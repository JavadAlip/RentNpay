import Address from '../../models/Address.js';
import mongoose from 'mongoose';
import Product from '../../models/Product.js';
import VendorKyc from '../../models/VendorKyc.js';

function toRad(v) {
  return (Number(v) * Math.PI) / 180;
}

function distanceKm(aLat, aLon, bLat, bLon) {
  const R = 6371;
  const dLat = toRad(Number(bLat) - Number(aLat));
  const dLon = toRad(Number(bLon) - Number(aLon));
  const lat1 = toRad(aLat);
  const lat2 = toRad(bLat);
  const s1 = Math.sin(dLat / 2);
  const s2 = Math.sin(dLon / 2);
  const x = s1 * s1 + Math.cos(lat1) * Math.cos(lat2) * s2 * s2;
  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  return R * c;
}

function vendorServesLocation(store, userLat, userLng) {
  if (!store) return false;
  if (store?.serviceModePanIndia === true) return true;

  const isLocal =
    store?.serviceModeLocalDelivery === true ||
    store?.deliveryZoneType === 'hyper-local';
  if (!isLocal) {
    if (store?.deliveryZoneType === 'pan-india') return true;
    return false;
  }
  if (!Number.isFinite(userLat) || !Number.isFinite(userLng)) return false;

  const sLat = Number(store?.mapLat);
  const sLng = Number(store?.mapLng);
  if (!Number.isFinite(sLat) || !Number.isFinite(sLng)) return false;

  const radius = Number(store?.serviceRadiusKm);
  const safeRadius = Number.isFinite(radius) && radius > 0 ? radius : 50;
  return distanceKm(userLat, userLng, sLat, sLng) <= safeRadius;
}

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

const pickPrimaryStore = (stores = []) => {
  if (!Array.isArray(stores) || stores.length === 0) return null;
  return (
    stores.find((s) => s?.isDefault && s?.isActive !== false) ||
    stores.find((s) => s?.isActive !== false) ||
    stores[0]
  );
};

export const getCheckoutPickupStores = async (req, res) => {
  try {
    const raw = String(req.query?.productIds || '')
      .split(',')
      .map((x) => String(x).trim())
      .filter(Boolean);
    if (!raw.length) return res.json({ stores: [] });

    const ids = raw
      .filter((x) => mongoose.Types.ObjectId.isValid(x))
      .map((x) => new mongoose.Types.ObjectId(x));
    if (!ids.length) return res.json({ stores: [] });
    const userLat = Number(req.query?.userLat);
    const userLng = Number(req.query?.userLng);
    const hasUserCoords = Number.isFinite(userLat) && Number.isFinite(userLng);

    const products = await Product.find({ _id: { $in: ids } })
      .select('_id vendorId productName')
      .lean();
    const vendorIds = [
      ...new Set(products.map((p) => String(p.vendorId || '')).filter(Boolean)),
    ];
    if (!vendorIds.length) return res.json({ stores: [] });

    const kycRows = await VendorKyc.find({ vendorId: { $in: vendorIds } })
      .select('vendorId storeManagement.stores businessDetails.shopName')
      .lean();

    const productByVendor = new Map();
    for (const p of products) {
      const key = String(p.vendorId || '');
      if (!productByVendor.has(key)) productByVendor.set(key, []);
      productByVendor.get(key).push({
        productId: String(p._id),
        productName: p.productName || 'Product',
      });
    }

    const stores = (kycRows || [])
      .map((row) => {
        const primary = pickPrimaryStore(row?.storeManagement?.stores || []);
        if (!primary) return null;
        if (hasUserCoords && !vendorServesLocation(primary, userLat, userLng)) {
          return null;
        }
        return {
          vendorId: String(row.vendorId || ''),
          vendorName:
            String(primary?.storeName || '').trim() ||
            String(row?.businessDetails?.shopName || '').trim() ||
            'Partner Store',
          storeName: String(primary?.storeName || '').trim() || 'Partner Store',
          mapAddress:
            String(primary?.mapAddress || '').trim() ||
            String(primary?.completeAddress || '').trim(),
          mapLat: Number(primary?.mapLat),
          mapLng: Number(primary?.mapLng),
          rating: 4.9,
          products: productByVendor.get(String(row.vendorId || '')) || [],
        };
      })
      .filter(Boolean);

    return res.json({ stores });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

