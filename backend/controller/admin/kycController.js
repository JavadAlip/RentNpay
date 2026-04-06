import mongoose from 'mongoose';
import VendorKyc from '../../models/VendorKyc.js';
import Vendor from '../../models/vendorAuthModel.js';
import Product from '../../models/Product.js';
import UserKyc from '../../models/UserKyc.js';
import User from '../../models/userAuthModel.js';
import Address from '../../models/Address.js';

const BASE_DOC_KEYS = [
  'profile',
  'pan',
  'aadhaarFront',
  'aadhaarBack',
  'bank',
  'shopAct',
  'gst',
];

const isValidDocumentReviewKey = (key) => {
  if (BASE_DOC_KEYS.includes(key)) return true;
  return /^storeFront_\d+$/.test(String(key));
};

const normalizeDocReviews = (raw) => {
  if (!raw || typeof raw !== 'object') return {};
  return { ...raw };
};

const computeRisk = (kyc) => {
  const risks = [];
  if (kyc.status === 'rejected') {
    const reason = kyc.rejectionReason || kyc.adminComment;
    if (reason) risks.push(`Rejected: ${reason}`);
  }
  if (kyc.awaitingVendorUpload) risks.push('Awaiting vendor re-upload');
  if (kyc.resubmittedPendingReview) risks.push('Resubmitted — needs review');
  if (!kyc.ownerPhoto) risks.push('Owner photo missing');
  if (!kyc.panPhoto) risks.push('PAN photo missing');
  if (!kyc.aadhaarFront) risks.push('Aadhaar front missing');
  if (!kyc.aadhaarBack) risks.push('Aadhaar back missing');
  if (!kyc.panNumber) risks.push('PAN number missing');
  return risks.length ? risks : ['Clean'];
};

const dueInText = (submittedAt, hours = 48) => {
  const submitted = submittedAt ? new Date(submittedAt) : null;
  if (!submitted || Number.isNaN(submitted.getTime())) return 'Due soon';
  const due = new Date(submitted.getTime() + hours * 60 * 60 * 1000);
  const diffMs = due.getTime() - Date.now();
  if (diffMs <= 0) return 'SLA Overdue';
  const totalMins = Math.floor(diffMs / (60 * 1000));
  const hrs = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  if (hrs <= 0) return `Due in ${mins}m`;
  return `Due in ${hrs}h ${mins}m`;
};

const mapQueueItem = (kyc, prodMap) => {
  const vendorId = kyc.vendorId?._id;
  const prod = vendorId ? prodMap.get(String(vendorId)) : null;
  const typeLabel = prod
    ? `${prod.category || 'Category'} (${prod.type || 'Rental'})`
    : 'Products';
  return {
    vendorId,
    _id: kyc._id,
    vendorName: kyc.vendorId?.fullName || '',
    vendorEmail: kyc.vendorId?.emailAddress || '',
    type: typeLabel,
    riskFactors: computeRisk(kyc),
    dueIn: dueInText(kyc.submittedAt, 48),
    submittedAt: kyc.submittedAt,
    status: kyc.status,
    adminComment: kyc.adminComment || '',
    reviewedAt: kyc.reviewedAt,
    awaitingVendorUpload: Boolean(kyc.awaitingVendorUpload),
    resubmittedPendingReview: Boolean(kyc.resubmittedPendingReview),
  };
};

export const getVendorKycQueue = async (req, res) => {
  try {
    const [pendingAll, approved, rejected] = await Promise.all([
      VendorKyc.find({ status: 'pending' })
        .populate('vendorId', 'fullName emailAddress')
        .sort({ submittedAt: -1 }),
      VendorKyc.find({ status: 'approved' })
        .populate('vendorId', 'fullName emailAddress')
        .sort({ submittedAt: -1 }),
      VendorKyc.find({ status: 'rejected' })
        .populate('vendorId', 'fullName emailAddress')
        .sort({ submittedAt: -1 }),
    ]);

    const all = [...pendingAll, ...approved, ...rejected];
    const vendorIds = all.map((x) => x.vendorId?._id).filter(Boolean);

    const productAgg = await Product.aggregate([
      { $match: { vendorId: { $in: vendorIds } } },
      {
        $group: {
          _id: '$vendorId',
          type: { $first: '$type' },
          category: { $first: '$category' },
        },
      },
    ]);
    const prodMap = new Map(productAgg.map((x) => [String(x._id), x]));

    const pendingFirst = pendingAll.filter((k) => !k.resubmittedPendingReview);
    const resubmitted = pendingAll.filter((k) => k.resubmittedPendingReview);

    const mapList = (list) =>
      list
        .filter((kyc) => Boolean(kyc.vendorId?._id))
        .map((kyc) => mapQueueItem(kyc, prodMap));

    const pendingItems = mapList(pendingFirst);
    const resubmittedItems = mapList(resubmitted);
    const approvedItems = mapList(approved);
    const rejectedItems = mapList(rejected);

    const approvalRate =
      approved.length + rejected.length > 0
        ? Math.round(
            (approved.length * 100) / (approved.length + rejected.length),
          )
        : 0;

    const reviewed = [...approved, ...rejected].filter((x) => x.reviewedAt);
    const avgReviewMins = reviewed.length
      ? Math.round(
          reviewed.reduce((sum, x) => {
            const a = x.submittedAt ? new Date(x.submittedAt).getTime() : 0;
            const b = x.reviewedAt ? new Date(x.reviewedAt).getTime() : 0;
            if (!a || !b) return sum;
            return sum + (b - a) / (60 * 1000);
          }, 0) / reviewed.length,
        )
      : 0;

    res.json({
      queue: {
        pending: pendingItems,
        resubmitted: resubmittedItems,
        approved: approvedItems,
        rejected: rejectedItems,
      },
      counts: {
        pending: pendingItems.length,
        resubmitted: resubmittedItems.length,
        approved: approvedItems.length,
        rejected: rejectedItems.length,
      },
      metrics: {
        avgReviewTimeMins: avgReviewMins,
        approvalRate,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const buildReviewDocuments = (kyc) => {
  const docs = [];
  const dr = normalizeDocReviews(kyc.documentReviews);

  const pushDoc = (key, label, category, src) => {
    docs.push({
      key,
      label,
      category,
      src: src || '',
      review: dr[key] || { status: 'pending', comment: '' },
    });
  };

  pushDoc('pan', 'PAN Card', 'identity', kyc.panPhoto);
  pushDoc('profile', 'Profile / Owner photo', 'identity', kyc.ownerPhoto);
  pushDoc('aadhaarFront', 'Aadhaar Card (Front)', 'identity', kyc.aadhaarFront);
  pushDoc('aadhaarBack', 'Aadhaar Card (Back)', 'identity', kyc.aadhaarBack);
  pushDoc(
    'bank',
    'Bank — Cancelled cheque',
    'bank',
    kyc.bankDetails?.cancelledCheque,
  );

  const stores = kyc.storeManagement?.stores || [];
  if (stores.length === 0) {
    pushDoc('storeFront_0', 'Shop — Store front (not added yet)', 'shop', '');
  } else {
    stores.forEach((st, i) => {
      const url = st.shopFrontPhotoUrl || '';
      const key = `storeFront_${i}`;
      pushDoc(
        key,
        `Shop — ${st.storeName || `Store ${i + 1}`} (front)`,
        'shop',
        url,
      );
    });
  }

  pushDoc(
    'shopAct',
    'Business — Shop Act License',
    'business',
    kyc.businessDetails?.shopActLicense,
  );
  pushDoc(
    'gst',
    'Business — GST Certificate',
    'business',
    kyc.businessDetails?.gstCertificate,
  );

  return docs;
};

export const getVendorKycReview = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const raw = String(vendorId || '').trim();
    const populateVendor = {
      path: 'vendorId',
      select: 'fullName emailAddress',
    };
    let kyc = null;
    if (mongoose.Types.ObjectId.isValid(raw)) {
      kyc = await VendorKyc.findOne({
        vendorId: new mongoose.Types.ObjectId(raw),
      }).populate(populateVendor);
    }
    if (!kyc) {
      kyc = await VendorKyc.findOne({ vendorId: raw }).populate(populateVendor);
    }

    if (!kyc) return res.status(404).json({ message: 'KYC not found' });

    const documents = buildReviewDocuments(kyc);

    res.json({
      kyc: {
        _id: kyc._id,
        vendorId: kyc.vendorId?._id,
        vendorName: kyc.vendorId?.fullName || '',
        vendorEmail: kyc.vendorId?.emailAddress || '',
        ownerPhoto: kyc.ownerPhoto,
        fullName: kyc.fullName,
        dateOfBirth: kyc.dateOfBirth,
        permanentAddress: kyc.permanentAddress,
        contactNumber: kyc.contactNumber,
        panNumber: kyc.panNumber,
        aadhaarNumber: kyc.aadhaarNumber,
        panPhoto: kyc.panPhoto,
        aadhaarFront: kyc.aadhaarFront,
        aadhaarBack: kyc.aadhaarBack,
        tshirtSize: kyc.tshirtSize,
        jeansWaistSize: kyc.jeansWaistSize,
        shoeSize: kyc.shoeSize,
        businessDetails: kyc.businessDetails,
        bankDetails: kyc.bankDetails,
        storeManagement: kyc.storeManagement,
        status: kyc.status,
        rejectionReason: kyc.rejectionReason,
        adminComment: kyc.adminComment,
        documentReviews: normalizeDocReviews(kyc.documentReviews),
        awaitingVendorUpload: Boolean(kyc.awaitingVendorUpload),
        resubmittedPendingReview: Boolean(kyc.resubmittedPendingReview),
        submittedAt: kyc.submittedAt,
        reviewedAt: kyc.reviewedAt,
        reviewedBy: kyc.reviewedBy,
        documents,
        shopNameForVerification: kyc.businessDetails?.shopName || '',
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const reviewVendorKyc = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { status, comment } = req.body;

    const nextStatus = String(status || '').toLowerCase();
    if (!['approved', 'rejected', 'pending'].includes(nextStatus)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const kyc = await VendorKyc.findOne({ vendorId });
    if (!kyc) return res.status(404).json({ message: 'KYC not found' });

    const adminEmail = req.admin?.email || '';

    kyc.status = nextStatus;
    kyc.adminComment = comment || '';
    kyc.reviewedAt = new Date();
    kyc.reviewedBy = adminEmail;
    kyc.rejectionReason = nextStatus === 'rejected' ? comment || '' : '';

    if (nextStatus === 'approved') {
      kyc.awaitingVendorUpload = false;
      kyc.resubmittedPendingReview = false;
    }

    await kyc.save();

    const vendor = await Vendor.findById(vendorId);
    if (vendor) {
      vendor.isVerified = nextStatus === 'approved';
      await vendor.save();
    }

    res.json({ message: 'KYC updated', kyc });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const requestVendorKycDocumentReupload = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { documentKey, comment } = req.body;
    const key = String(documentKey || '').trim();
    if (!isValidDocumentReviewKey(key)) {
      return res.status(400).json({ message: 'Invalid document key' });
    }
    const msg = String(comment || '').trim();
    if (!msg) {
      return res
        .status(400)
        .json({ message: 'Comment is required for re-upload request' });
    }

    const kyc = await VendorKyc.findOne({ vendorId });
    if (!kyc) return res.status(404).json({ message: 'KYC not found' });
    if (kyc.status !== 'pending') {
      return res.status(400).json({ message: 'KYC is not pending review' });
    }

    const dr = normalizeDocReviews(kyc.documentReviews);
    dr[key] = {
      status: 'reupload_requested',
      comment: msg,
      updatedAt: new Date().toISOString(),
    };
    kyc.documentReviews = dr;
    kyc.awaitingVendorUpload = true;
    kyc.resubmittedPendingReview = false;
    kyc.adminComment = msg;
    kyc.reviewedBy = req.admin?.email || '';
    await kyc.save();

    res.json({ message: 'Re-upload requested', kyc });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ────────────────────────────────────────────────────────────────
// Customer (User) KYC approvals
// ────────────────────────────────────────────────────────────────

export const getCustomerKycQueue = async (req, res) => {
  try {
    const [pending, approved, rejected] = await Promise.all([
      UserKyc.find({ status: 'pending' })
        .populate('userId', 'fullName emailAddress customerNumber')
        .sort({ submittedAt: -1 }),
      UserKyc.find({ status: 'approved' })
        .populate('userId', 'fullName emailAddress customerNumber')
        .sort({ submittedAt: -1 }),
      UserKyc.find({ status: 'rejected' })
        .populate('userId', 'fullName emailAddress customerNumber')
        .sort({ submittedAt: -1 }),
    ]);

    const formatCustomerId = (u) => {
      const num = u?.customerNumber;
      if (num != null && num > 0) {
        return `CUST-${String(num).padStart(3, '0')}`;
      }
      return `CUST-${String(u?._id || '')
        .slice(-6)
        .toUpperCase()}`;
    };

    const mapList = (list) =>
      list.map((k) => ({
        userId: k.userId?._id,
        _id: k._id,
        customerName: k.userId?.fullName || '',
        customerEmail: k.userId?.emailAddress || '',
        customerId: formatCustomerId(k.userId),
        idType: 'Aadhaar',
        submittedAt: k.submittedAt,
        status: k.status,
        rejectionReason: k.rejectionReason || '',
        reviewedAt: k.reviewedAt,
        reviewedBy: k.reviewedBy || '',
      }));

    res.json({
      queue: {
        pending: mapList(pending),
        approved: mapList(approved),
        rejected: mapList(rejected),
      },
      counts: {
        pending: pending.length,
        approved: approved.length,
        rejected: rejected.length,
      },
      metrics: {
        avgReviewTimeMins: 0,
        approvalRate: pending.length
          ? Math.round((approved.length * 100) / pending.length)
          : 0,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getCustomerKycReview = async (req, res) => {
  try {
    const { userId } = req.params;
    const kyc = await UserKyc.findOne({ userId }).populate(
      'userId',
      'fullName emailAddress customerNumber',
    );

    if (!kyc) return res.status(404).json({ message: 'KYC not found' });

    const addressDoc = await Address.findOne({ user: kyc.userId?._id })
      .sort({ createdAt: -1 })
      .lean();

    const kycAddr = String(kyc.permanentAddress || '').trim();
    const permanentAddress = kycAddr
      ? kycAddr
      : addressDoc
        ? `${addressDoc.addressLine || ''}${addressDoc.area ? `, ${addressDoc.area}` : ''}${
            addressDoc.city ? `, ${addressDoc.city}` : ''
          }${addressDoc.pincode ? ` - ${addressDoc.pincode}` : ''}`.trim()
        : '';

    const contactNumber =
      String(kyc.contactNumber || '').trim() || addressDoc?.phone || '';
    const dateOfBirth = kyc.dateOfBirth || '';
    const aadhaarNumber = kyc.aadhaarNumber || '';
    const panNumber = kyc.panNumber || '';

    const idType = 'Aadhaar';
    const idNumber = idType === 'Aadhaar' ? aadhaarNumber : panNumber;

    const documents = [
      {
        key: 'aadhaarFront',
        label: 'Aadhaar Card (Front)',
        category: 'identity',
        src: kyc.aadhaarFront || '',
      },
      {
        key: 'aadhaarBack',
        label: 'Aadhaar Card (Back)',
        category: 'identity',
        src: kyc.aadhaarBack || '',
      },
      {
        key: 'panCard',
        label: 'PAN Card',
        category: 'identity',
        src: kyc.panCard || '',
      },
    ];

    res.json({
      kyc: {
        _id: kyc._id,
        userId: kyc.userId?._id,
        customerName: kyc.userId?.fullName || '',
        customerEmail: kyc.userId?.emailAddress || '',
        customerId:
          kyc.userId?.customerNumber != null && kyc.userId.customerNumber > 0
            ? `CUST-${String(kyc.userId.customerNumber).padStart(3, '0')}`
            : `CUST-${String(kyc.userId?._id || '')
                .slice(-6)
                .toUpperCase()}`,
        dateOfBirth,
        permanentAddress,
        contactNumber,
        idType,
        idNumber,
        aadhaarFront: kyc.aadhaarFront,
        aadhaarBack: kyc.aadhaarBack,
        panCard: kyc.panCard,
        status: kyc.status,
        rejectionReason: kyc.rejectionReason,
        submittedAt: kyc.submittedAt,
        reviewedAt: kyc.reviewedAt,
        documents,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const reviewCustomerKyc = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, comment } = req.body;

    const nextStatus = String(status || '').toLowerCase();
    if (!['approved', 'rejected', 'pending'].includes(nextStatus)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const kyc = await UserKyc.findOne({ userId });
    if (!kyc) return res.status(404).json({ message: 'KYC not found' });

    const adminEmail = req.admin?.email || '';

    kyc.status = nextStatus;
    kyc.rejectionReason =
      nextStatus === 'rejected' ? String(comment || '') : '';
    kyc.reviewedAt = new Date();
    // userKycSchema doesn't have reviewedBy, but we can store it anyway if schema allows.
    kyc.reviewedBy = adminEmail;

    await kyc.save();
    res.json({ message: 'Customer KYC updated', kyc });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
