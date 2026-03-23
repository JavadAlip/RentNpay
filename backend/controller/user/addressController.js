import Address from '../../models/Address.js';

export const getMyAddresses = async (req, res) => {
  try {
    const addresses = await Address.find({ user: req.user._id }).sort({
      createdAt: -1,
    });
    res.json({ addresses });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createAddress = async (req, res) => {
  try {
    const { label, fullName, phone, area, addressLine, city, pincode } =
      req.body;

    if (!fullName || !phone || !addressLine) {
      return res
        .status(400)
        .json({ message: 'fullName, phone and addressLine are required' });
    }

    const address = await Address.create({
      user: req.user._id,
      label: label || 'Home',
      fullName,
      phone,
      area: area || '',
      addressLine,
      city: city || '',
      pincode: pincode || '',
    });

    res.status(201).json({ address });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const { label, fullName, phone, area, addressLine, city, pincode } =
      req.body;

    const address = await Address.findOne({ _id: id, user: req.user._id });
    if (!address) {
      return res.status(404).json({ message: 'Address not found' });
    }

    if (label !== undefined) address.label = label;
    if (fullName !== undefined) address.fullName = fullName;
    if (phone !== undefined) address.phone = phone;
    if (area !== undefined) address.area = area;
    if (addressLine !== undefined) address.addressLine = addressLine;
    if (city !== undefined) address.city = city;
    if (pincode !== undefined) address.pincode = pincode;

    await address.save();
    res.json({ address });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const address = await Address.findOneAndDelete({
      _id: id,
      user: req.user._id,
    });

    if (!address) {
      return res.status(404).json({ message: 'Address not found' });
    }

    res.json({ message: 'Address deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

