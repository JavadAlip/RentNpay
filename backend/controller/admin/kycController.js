import VendorKyc from '../../models/VendorKyc.js';
import Vendor from '../../models/vendorAuthModel.js';
import Product from '../../models/Product.js';

const computeRisk = (kyc) => {
  const risks = [];
  if (kyc.status === 'rejected') {
    const reason = kyc.rejectionReason || kyc.adminComment;
    if (reason) risks.push(`Rejected: ${reason}`);
  }
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

export const getVendorKycQueue = async (req, res) => {
  try {
    const [pending, approved, rejected] = await Promise.all([
      VendorKyc.find({ status: 'pending' }).populate('vendorId', 'fullName emailAddress').sort({ submittedAt: -1 }),
      VendorKyc.find({ status: 'approved' }).populate('vendorId', 'fullName emailAddress').sort({ submittedAt: -1 }),
      VendorKyc.find({ status: 'rejected' }).populate('vendorId', 'fullName emailAddress').sort({ submittedAt: -1 }),
    ]);

    const all = [...pending, ...approved, ...rejected];
    const vendorIds = all.map((x) => x.vendorId?._id).filter(Boolean);

    const productAgg = await Product.aggregate([
      { $match: { vendorId: { $in: vendorIds } } },
      { $group: { _id: '$vendorId', type: { $first: '$type' }, category: { $first: '$category' } } },
    ]);
    const prodMap = new Map(productAgg.map((x) => [String(x._id), x]));

    const mapList = (list) =>
      list
        .filter((kyc) => Boolean(kyc.vendorId?._id))
        .map((kyc) => {
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
        };
      });

    const pendingItems = mapList(pending);
    const approvedItems = mapList(approved);
    const rejectedItems = mapList(rejected);

    const approvalRate =
      approved.length + rejected.length > 0
        ? Math.round((approved.length * 100) / (approved.length + rejected.length))
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
        approved: approvedItems,
        rejected: rejectedItems,
      },
      counts: {
        pending: pendingItems.length,
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

export const getVendorKycReview = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const kyc = await VendorKyc.findOne({ vendorId }).populate(
      'vendorId',
      'fullName emailAddress',
    );

    if (!kyc) return res.status(404).json({ message: 'KYC not found' });

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
        status: kyc.status,
        rejectionReason: kyc.rejectionReason,
        adminComment: kyc.adminComment,
        submittedAt: kyc.submittedAt,
        reviewedAt: kyc.reviewedAt,
        reviewedBy: kyc.reviewedBy,
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

    await kyc.save();

    // Keep vendor isVerified aligned with KYC approval
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

