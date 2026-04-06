import UserKyc from '../../models/UserKyc.js';
import {
  uploadImageToCloudinary,
  uploadRawToCloudinary,
} from '../../config/cloudinaryUpload.js';

const uploadFileIfExists = async (file, folder) => {
  if (!file) return '';
  const mime = String(file.mimetype || '').toLowerCase();
  const isPdf = mime.includes('pdf');
  const result = isPdf
    ? await uploadRawToCloudinary(file.buffer, folder)
    : await uploadImageToCloudinary(file.buffer, folder);
  return result?.secure_url || '';
};

export const getMyUserKyc = async (req, res) => {
  try {
    const existing = await UserKyc.findOne({ userId: req.user._id });
    if (!existing) {
      return res.json({
        kyc: {
          status: 'not_submitted',
          aadhaarFront: '',
          aadhaarBack: '',
          panCard: '',
          dateOfBirth: null,
          permanentAddress: '',
          contactNumber: '',
          submittedAt: null,
          reviewedAt: null,
          rejectionReason: '',
        },
      });
    }
    return res.json({ kyc: existing });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const submitMyUserKyc = async (req, res) => {
  try {
    const existing = await UserKyc.findOne({ userId: req.user._id });

    const aadhaarFront =
      (await uploadFileIfExists(
        req.files?.aadhaarFront?.[0],
        'user-kyc/aadhaar-front',
      )) || existing?.aadhaarFront || '';
    const aadhaarBack =
      (await uploadFileIfExists(
        req.files?.aadhaarBack?.[0],
        'user-kyc/aadhaar-back',
      )) || existing?.aadhaarBack || '';
    const panCard =
      (await uploadFileIfExists(req.files?.panCard?.[0], 'user-kyc/pan-card')) ||
      existing?.panCard ||
      '';

    const permanentAddress = String(req.body?.permanentAddress || '').trim();
    const contactNumber = String(req.body?.contactNumber || '').trim();
    const dobRaw = String(req.body?.dateOfBirth || '').trim();

    if (!permanentAddress || !contactNumber || !dobRaw) {
      return res.status(400).json({
        message:
          'Please enter date of birth, permanent address and contact number.',
      });
    }

    const dateOfBirth = new Date(dobRaw);
    if (Number.isNaN(dateOfBirth.getTime())) {
      return res.status(400).json({ message: 'Invalid date of birth.' });
    }

    if (!aadhaarFront || !aadhaarBack || !panCard) {
      return res.status(400).json({
        message: 'Please upload Aadhaar Front, Aadhaar Back and PAN Card.',
      });
    }

    const payload = {
      userId: req.user._id,
      aadhaarFront,
      aadhaarBack,
      panCard,
      dateOfBirth,
      permanentAddress,
      contactNumber,
      status: 'pending',
      rejectionReason: '',
      submittedAt: new Date(),
    };

    const kyc = await UserKyc.findOneAndUpdate(
      { userId: req.user._id },
      payload,
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );

    return res.status(200).json({
      message: 'KYC submitted successfully. Verification is in progress.',
      kyc,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
