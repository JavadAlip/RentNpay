import VendorKyc from '../../models/VendorKyc.js';
import { uploadImageToCloudinary } from '../../config/cloudinaryUpload.js';

const uploadFileIfExists = async (file, folder) => {
  if (!file) return null;
  const result = await uploadImageToCloudinary(file.buffer, folder);
  return result?.secure_url || '';
};

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
    const shopActLicense = await uploadFileIfExists(
      getUploadedFile(req, 'shopActLicense'),
      'vendor-kyc',
    );
    const gstCertificate = await uploadFileIfExists(
      getUploadedFile(req, 'gstCertificate'),
      'vendor-kyc',
    );
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
        gstCertificate:
          gstCertificate || existing?.businessDetails?.gstCertificate || '',
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
        stores:
          storesParsed.length > 0
            ? storesParsed
            : existing?.storeManagement?.stores || [],
        slaAccepted:
          String(slaAccepted) === 'true'
            ? true
            : existing?.storeManagement?.slaAccepted || false,
        commissionAccepted:
          String(commissionAccepted) === 'true'
            ? true
            : existing?.storeManagement?.commissionAccepted || false,
      },
      sectionsCompleted: {
        personal:
          Boolean(fullName || existing?.fullName) &&
          Boolean(dateOfBirth || existing?.dateOfBirth) &&
          Boolean(permanentAddress || existing?.permanentAddress) &&
          Boolean(contactNumber || existing?.contactNumber) &&
          Boolean(panNumber || existing?.panNumber) &&
          Boolean(aadhaarNumber || existing?.aadhaarNumber),
        business:
          Boolean(shopName || existing?.businessDetails?.shopName) &&
          Boolean(businessCategory || existing?.businessDetails?.businessCategory) &&
          Boolean(shopActNumber || existing?.businessDetails?.shopActNumber),
        banking:
          Boolean(accountHolderName || existing?.bankDetails?.accountHolderName) &&
          Boolean(accountNumber || existing?.bankDetails?.accountNumber) &&
          Boolean(confirmAccountNumber || existing?.bankDetails?.confirmAccountNumber) &&
          Boolean(ifscCode || existing?.bankDetails?.ifscCode),
        store:
          (storesParsed.length > 0 ||
            (existing?.storeManagement?.stores || []).length > 0) &&
          (String(slaAccepted) === 'true' ||
            Boolean(existing?.storeManagement?.slaAccepted)) &&
          (String(commissionAccepted) === 'true' ||
            Boolean(existing?.storeManagement?.commissionAccepted)),
      },
      currentStep: stepNum,
      status: 'draft',
      applicationSubmitted: false,
    };

    if (isFinalSubmit) {
      if (
        !next.sectionsCompleted.personal ||
        !next.sectionsCompleted.business ||
        !next.sectionsCompleted.banking ||
        !next.sectionsCompleted.store
      ) {
        return res
          .status(400)
          .json({ message: 'Please complete all KYC steps before final submit.' });
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

