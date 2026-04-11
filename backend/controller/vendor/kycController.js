import VendorKyc from '../../models/VendorKyc.js';
import { uploadImageToCloudinary } from '../../config/cloudinaryUpload.js';

const uploadFileIfExists = async (file, folder) => {
  if (!file) return null;
  const result = await uploadImageToCloudinary(file.buffer, folder);
  return result?.secure_url || '';
};

const storeFrontKey = (i) => `storeFront_${i}`;

const getUploadedFile = (req, fieldName) => {
  // upload.fields(...) shape
  if (req?.files && !Array.isArray(req.files)) {
    return req.files?.[fieldName]?.[0] || null;
  }
  // upload.any() shape
  if (Array.isArray(req?.files)) {
    return req.files.find((f) => f?.fieldname === fieldName) || null;
  }
  return null;
};

export const getMyKyc = async (req, res) => {
  try {
    const kyc = await VendorKyc.findOne({ vendorId: req.vendor._id });
    res.json({ kyc });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const submitMyKyc = async (req, res) => {
  try {
    const {
      step = '1',
      finalSubmit = 'false',
      fullName,
      dateOfBirth,
      permanentAddress,
      contactNumber,
      panNumber,
      aadhaarNumber,
      tshirtSize,
      jeansWaistSize,
      shoeSize,
      shopName,
      businessCategory,
      shopActNumber,
      gstin,
      primaryContactNumber,
      secondaryContactNumber,
      accountHolderName,
      accountNumber,
      confirmAccountNumber,
      ifscCode,
      stores = '[]',
      slaAccepted = 'false',
      commissionAccepted = 'false',
    } = req.body;
    const stepNum = Math.max(1, Math.min(4, Number(step || 1)));
    const isFinalSubmit = String(finalSubmit) === 'true';

    const existing = await VendorKyc.findOne({ vendorId: req.vendor._id });

    const ownerPhoto = await uploadFileIfExists(
      getUploadedFile(req, 'ownerPhoto'),
      'vendor-kyc',
    );
    const panPhoto = await uploadFileIfExists(
      getUploadedFile(req, 'panPhoto'),
      'vendor-kyc',
    );
    const aadhaarFront = await uploadFileIfExists(
      getUploadedFile(req, 'aadhaarFront'),
      'vendor-kyc',
    );
    const aadhaarBack = await uploadFileIfExists(
      getUploadedFile(req, 'aadhaarBack'),
      'vendor-kyc',
    );
    const shopActLicenseFile = getUploadedFile(req, 'shopActLicense');
    const shopActLicense = await uploadFileIfExists(shopActLicenseFile, 'vendor-kyc');
    const gstCertificateFile = getUploadedFile(req, 'gstCertificate');
    const gstCertificate = await uploadFileIfExists(gstCertificateFile, 'vendor-kyc');
    const cancelledCheque = await uploadFileIfExists(
      getUploadedFile(req, 'cancelledCheque'),
      'vendor-kyc',
    );

    let storesParsed = [];
    try {
      storesParsed = Array.isArray(stores) ? stores : JSON.parse(stores || '[]');
    } catch {
      storesParsed = [];
    }

    const prevStores = existing?.storeManagement?.stores || [];
    const mergedStores = storesParsed.length > 0 ? storesParsed : prevStores;
    const storesWithUrls = await Promise.all(
      mergedStores.map(async (st, i) => {
        const prev = prevStores[i] || {};
        const frontFile = getUploadedFile(req, storeFrontKey(i));
        const frontUrl = await uploadFileIfExists(frontFile, 'vendor-kyc');
        return {
          ...st,
          shopFrontPhotoUrl:
            frontUrl || st.shopFrontPhotoUrl || prev.shopFrontPhotoUrl || '',
          additionalPhotoUrls: Array.isArray(st.additionalPhotoUrls)
            ? st.additionalPhotoUrls
            : prev.additionalPhotoUrls || [],
        };
      }),
    );

    let docReviews = {};
    if (existing?.documentReviews && typeof existing.documentReviews === 'object') {
      docReviews = { ...existing.documentReviews };
    }

    const clearReuploadIfNewFile = (reviewKey, hasNewFile) => {
      if (!hasNewFile) return;
      const entry = docReviews[reviewKey];
      if (entry && entry.status === 'reupload_requested') {
        delete docReviews[reviewKey];
      }
    };

    clearReuploadIfNewFile('profile', Boolean(ownerPhoto));
    clearReuploadIfNewFile('pan', Boolean(panPhoto));
    clearReuploadIfNewFile('aadhaarFront', Boolean(aadhaarFront));
    clearReuploadIfNewFile('aadhaarBack', Boolean(aadhaarBack));
    clearReuploadIfNewFile('bank', Boolean(cancelledCheque));
    clearReuploadIfNewFile('shopAct', Boolean(shopActLicense));
    clearReuploadIfNewFile('gst', Boolean(gstCertificate));
    for (let i = 0; i < storesWithUrls.length; i++) {
      const frontFile = getUploadedFile(req, storeFrontKey(i));
      clearReuploadIfNewFile(storeFrontKey(i), Boolean(frontFile));
    }

    const anyReuploadLeft = Object.values(docReviews).some(
      (e) => e && e.status === 'reupload_requested',
    );

    const shopActLicenseFileNameBody = String(
      req.body.shopActLicenseFileName || '',
    )
      .trim()
      .slice(0, 255);
    const gstCertificateFileNameBody = String(
      req.body.gstCertificateFileName || '',
    )
      .trim()
      .slice(0, 255);

    const next = {
      vendorId: req.vendor._id,
      fullName: fullName ?? existing?.fullName ?? '',
      dateOfBirth: dateOfBirth ?? existing?.dateOfBirth ?? null,
      permanentAddress: permanentAddress ?? existing?.permanentAddress ?? '',
      contactNumber: contactNumber ?? existing?.contactNumber ?? '',
      panNumber: panNumber
        ? String(panNumber).toUpperCase()
        : existing?.panNumber || '',
      aadhaarNumber: aadhaarNumber ?? existing?.aadhaarNumber ?? '',
      tshirtSize: tshirtSize ?? existing?.tshirtSize ?? '',
      jeansWaistSize: jeansWaistSize ?? existing?.jeansWaistSize ?? '',
      shoeSize: shoeSize ?? existing?.shoeSize ?? '',
      ownerPhoto: ownerPhoto || existing?.ownerPhoto || '',
      panPhoto: panPhoto || existing?.panPhoto || '',
      aadhaarFront: aadhaarFront || existing?.aadhaarFront || '',
      aadhaarBack: aadhaarBack || existing?.aadhaarBack || '',
      businessDetails: {
        shopName: shopName ?? existing?.businessDetails?.shopName ?? '',
        businessCategory:
          businessCategory ?? existing?.businessDetails?.businessCategory ?? '',
        shopActNumber: shopActNumber ?? existing?.businessDetails?.shopActNumber ?? '',
        gstin: gstin ?? existing?.businessDetails?.gstin ?? '',
        primaryContactNumber:
          primaryContactNumber ?? existing?.businessDetails?.primaryContactNumber ?? '',
        secondaryContactNumber:
          secondaryContactNumber ??
          existing?.businessDetails?.secondaryContactNumber ??
          '',
        shopActLicense:
          shopActLicense || existing?.businessDetails?.shopActLicense || '',
        shopActLicenseFileName: shopActLicense
          ? shopActLicenseFileNameBody ||
            String(shopActLicenseFile?.originalname || '').slice(0, 255) ||
            existing?.businessDetails?.shopActLicenseFileName ||
            ''
          : existing?.businessDetails?.shopActLicenseFileName || '',
        gstCertificate:
          gstCertificate || existing?.businessDetails?.gstCertificate || '',
        gstCertificateFileName: gstCertificate
          ? gstCertificateFileNameBody ||
            String(gstCertificateFile?.originalname || '').slice(0, 255) ||
            existing?.businessDetails?.gstCertificateFileName ||
            ''
          : existing?.businessDetails?.gstCertificateFileName || '',
      },
      bankDetails: {
        accountHolderName:
          accountHolderName ?? existing?.bankDetails?.accountHolderName ?? '',
        accountNumber: accountNumber ?? existing?.bankDetails?.accountNumber ?? '',
        confirmAccountNumber:
          confirmAccountNumber ?? existing?.bankDetails?.confirmAccountNumber ?? '',
        ifscCode: ifscCode
          ? String(ifscCode).toUpperCase()
          : existing?.bankDetails?.ifscCode || '',
        cancelledCheque:
          cancelledCheque || existing?.bankDetails?.cancelledCheque || '',
      },
      storeManagement: {
        stores: storesWithUrls,
        slaAccepted:
          String(slaAccepted) === 'true'
            ? true
            : existing?.storeManagement?.slaAccepted || false,
        commissionAccepted:
          String(commissionAccepted) === 'true'
            ? true
            : existing?.storeManagement?.commissionAccepted || false,
      },
      currentStep: stepNum,
      status: 'draft',
      applicationSubmitted: false,
      documentReviews: docReviews,
    };

    const hasStr = (v) => String(v ?? '').trim().length > 0;
    const hasDob = (v) => {
      if (v == null || v === '') return false;
      if (v instanceof Date) return !Number.isNaN(v.getTime());
      return String(v).trim().length > 0;
    };

    next.sectionsCompleted = {
      personal:
        hasStr(next.fullName) &&
        hasDob(next.dateOfBirth) &&
        hasStr(next.permanentAddress) &&
        hasStr(next.contactNumber) &&
        hasStr(next.panNumber) &&
        hasStr(next.aadhaarNumber),
      business:
        hasStr(next.businessDetails?.shopName) &&
        hasStr(next.businessDetails?.businessCategory) &&
        hasStr(next.businessDetails?.shopActNumber),
      banking:
        hasStr(next.bankDetails?.accountHolderName) &&
        hasStr(next.bankDetails?.accountNumber) &&
        hasStr(next.bankDetails?.confirmAccountNumber) &&
        hasStr(next.bankDetails?.ifscCode),
      store:
        (next.storeManagement?.stores || []).length > 0 &&
        next.storeManagement.slaAccepted === true &&
        next.storeManagement.commissionAccepted === true,
    };

    if (!isFinalSubmit) {
      next.awaitingVendorUpload = existing?.awaitingVendorUpload ?? false;
      next.resubmittedPendingReview = existing?.resubmittedPendingReview ?? false;
    }

    if (isFinalSubmit) {
      const sc = next.sectionsCompleted;
      if (!sc.personal || !sc.business || !sc.banking || !sc.store) {
        const missing = [];
        if (!sc.personal) missing.push('Step 1 · Proprietor (all fields + date of birth)');
        if (!sc.business) missing.push('Step 2 · Business (shop name, category, shop act no.)');
        if (!sc.banking) missing.push('Step 3 · Banking (account details + IFSC)');
        if (!sc.store) {
          missing.push(
            'Step 4 · At least one store and both checkboxes: Terms of Service and Commission policy',
          );
        }
        return res.status(400).json({
          message: `Cannot submit yet. ${missing.join(' ')}`,
        });
      }
      if (next.bankDetails.accountNumber !== next.bankDetails.confirmAccountNumber) {
        return res
          .status(400)
          .json({ message: 'Account number and confirm account number must match.' });
      }
      next.status = 'pending';
      next.applicationSubmitted = true;
      next.submittedAt = new Date();
      next.rejectionReason = '';
      next.documentReviews = docReviews;

      let nextAwaiting = anyReuploadLeft;
      let nextResubmitted = Boolean(existing?.resubmittedPendingReview);
      if (existing?.awaitingVendorUpload && !anyReuploadLeft) {
        nextResubmitted = true;
        nextAwaiting = false;
      } else if (anyReuploadLeft) {
        nextResubmitted = false;
        nextAwaiting = true;
      } else if (!existing?.awaitingVendorUpload && !existing?.resubmittedPendingReview) {
        nextResubmitted = false;
        nextAwaiting = false;
      }
      next.awaitingVendorUpload = nextAwaiting;
      next.resubmittedPendingReview = nextResubmitted;
    }

    const kyc = await VendorKyc.findOneAndUpdate(
      { vendorId: req.vendor._id },
      next,
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );

    res.status(200).json({
      message: isFinalSubmit
        ? 'KYC submitted successfully. Waiting for admin approval.'
        : 'KYC step saved successfully.',
      kyc,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

