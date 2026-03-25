import VendorKyc from '../../models/VendorKyc.js';
import { uploadImageToCloudinary } from '../../config/cloudinaryUpload.js';

const uploadFileIfExists = async (file, folder) => {
  if (!file) return null;
  const result = await uploadImageToCloudinary(file.buffer, folder);
  return result?.secure_url || '';
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
      fullName,
      dateOfBirth,
      permanentAddress,
      contactNumber,
      panNumber,
      aadhaarNumber,
      tshirtSize,
      jeansWaistSize,
      shoeSize,
    } = req.body;

    if (
      !fullName ||
      !dateOfBirth ||
      !permanentAddress ||
      !contactNumber ||
      !panNumber ||
      !aadhaarNumber
    ) {
      return res.status(400).json({ message: 'Please fill all required KYC fields.' });
    }

    const existing = await VendorKyc.findOne({ vendorId: req.vendor._id });

    const ownerPhoto = await uploadFileIfExists(req.files?.ownerPhoto?.[0], 'vendor-kyc');
    const panPhoto = await uploadFileIfExists(req.files?.panPhoto?.[0], 'vendor-kyc');
    const aadhaarFront = await uploadFileIfExists(req.files?.aadhaarFront?.[0], 'vendor-kyc');
    const aadhaarBack = await uploadFileIfExists(req.files?.aadhaarBack?.[0], 'vendor-kyc');

    const payload = {
      vendorId: req.vendor._id,
      fullName,
      dateOfBirth,
      permanentAddress,
      contactNumber,
      panNumber: String(panNumber).toUpperCase(),
      aadhaarNumber,
      tshirtSize: tshirtSize || '',
      jeansWaistSize: jeansWaistSize || '',
      shoeSize: shoeSize || '',
      status: 'pending',
      submittedAt: new Date(),
      rejectionReason: '',
      ownerPhoto: ownerPhoto || existing?.ownerPhoto || '',
      panPhoto: panPhoto || existing?.panPhoto || '',
      aadhaarFront: aadhaarFront || existing?.aadhaarFront || '',
      aadhaarBack: aadhaarBack || existing?.aadhaarBack || '',
    };

    const kyc = await VendorKyc.findOneAndUpdate(
      { vendorId: req.vendor._id },
      payload,
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );

    res.status(200).json({
      message: 'KYC submitted successfully. Waiting for admin approval.',
      kyc,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

