import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import Vendor from '../../models/vendorAuthModel.js';
import Product from '../../models/Product.js';
import User from '../../models/userAuthModel.js';
import Order from '../../models/Order.js';
import VendorKyc from '../../models/VendorKyc.js';
import UserKyc from '../../models/UserKyc.js';
import Address from '../../models/Address.js';
import { buildMyRentalsStyleActiveRows } from '../../utils/userRentalHubActiveRows.js';
import { buildIssueTicketsFromOrders } from './ticketAdminController.js';

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

/** Public storefront: hide if admin or vendor turned listing off. */
function storefrontListingVisibilityMatch() {
  return {
    adminListingEnabled: { $ne: false },
    vendorListingEnabled: { $ne: false },
  };
}

function pickPrimaryStore(stores = []) {
  if (!Array.isArray(stores) || stores.length === 0) return null;
  return (
    stores.find((s) => s?.isDefault && s?.isActive !== false) ||
    stores.find((s) => s?.isActive !== false) ||
    stores[0]
  );
}

function vendorServesLocation(store, userLat, userLng) {
  if (!store) return false;
  // Prefer explicit service-mode booleans. Some vendors may not sync the
  // `deliveryZoneType` field when toggling service mode in UI.
  if (store?.serviceModePanIndia === true) return true;

  const isLocal =
    store?.serviceModeLocalDelivery === true ||
    store?.deliveryZoneType === 'hyper-local';
  if (!isLocal) {
    // If we only know pan-india via the enum value.
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

export const adminLogin = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    console.log('ENV EMAIL:', `"${process.env.ADMIN_EMAIL}"`);
    console.log('ENV PASSWORD:', `"${process.env.ADMIN_PASSWORD}"`);
    console.log('BODY:', `"${identifier}"`, `"${password}"`);

    // ✅ Validation
    if (!identifier || !password) {
      return res.status(400).json({
        message: 'Email and password required',
      });
    }

    // ✅ Simple ENV check
    if (
      identifier !== process.env.ADMIN_EMAIL ||
      password !== process.env.ADMIN_PASSWORD
    ) {
      return res.status(401).json({
        message: 'Invalid admin credentials',
      });
    }

    // ✅ Generate token
    const token = jwt.sign(
      { role: 'admin', email: identifier },
      process.env.JWT_SECRET,
      { expiresIn: '30d' },
    );

    return res.status(200).json({
      message: 'Admin login successful',
      token,
      user: {
        email: identifier,
        role: 'admin',
      },
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
export const adminLogout = async (req, res) => {
  try {
    console.log(' Admin Logout API Hit');

    console.log('Headers:', req.headers);
    console.log('Body:', req.body);

    return res.status(200).json({
      message: 'Admin logged out successfully',
    });
  } catch (error) {
    console.error(' Admin logout error:', error);

    res.status(500).json({
      message: 'Server error',
    });
  }
};

export const getAllVendors = async (req, res) => {
  try {
    const vendors = await Vendor.find()
      .select('-password -otp -otpExpire') // 🔥 hide sensitive data
      .sort({ createdAt: -1 });

    const vendorIds = vendors.map((v) => v._id);

    const kycRecords = await VendorKyc.find({
      vendorId: { $in: vendorIds },
    }).select('vendorId status');
    const kycStatusMap = new Map(
      (kycRecords || []).map((x) => [String(x.vendorId), x.status]),
    );

    const productCounts = await Product.aggregate([
      { $match: { vendorId: { $in: vendorIds } } },
      { $group: { _id: '$vendorId', count: { $sum: 1 } } },
    ]);
    const countMap = new Map(productCounts.map((x) => [String(x._id), x.count]));

    const withCounts = vendors.map((v) => ({
      ...v.toObject(),
      productsCount: countMap.get(String(v._id)) || 0,
      // Primary source of truth: VendorKyc.status
      // If no KYC document exists yet, keep it pending.
      kycStatus: kycStatusMap.get(String(v._id)) || 'pending',
    }));

    res.json({
      vendors: withCounts,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const extractCityFromStore = (store = {}) => {
  const mapAddress = String(store.mapAddress || '').trim();
  if (mapAddress) {
    const parts = mapAddress
      .split(',')
      .map((x) => String(x || '').trim())
      .filter(Boolean);
    if (parts.length >= 3) return parts[parts.length - 3];
    if (parts.length >= 2) return parts[parts.length - 2];
    return parts[0] || 'Unknown';
  }

  const address = String(store.completeAddress || '').trim();
  if (!address) return 'Unknown';
  const tokens = address
    .split(',')
    .map((x) => String(x || '').trim())
    .filter(Boolean);
  if (tokens.length >= 2) return tokens[tokens.length - 2];
  return tokens[0] || 'Unknown';
};

const storeRadiusLabel = (store = {}) => {
  if (store.serviceModePanIndia || store.deliveryZoneType === 'pan-india') {
    return 'Pan-India';
  }
  const km = Number(store.serviceRadiusKm || 0);
  const safeKm = Number.isFinite(km) && km > 0 ? Math.round(km) : 15;
  return `${safeKm} km (Local)`;
};

export const getAdminStores = async (req, res) => {
  try {
    const rows = await VendorKyc.find({})
      .populate('vendorId', 'fullName')
      .select('vendorId storeManagement.stores')
      .lean();

    let seq = 1;
    const stores = [];
    for (const kyc of rows || []) {
      const vendorObjId = kyc?.vendorId?._id ? String(kyc.vendorId._id) : '';
      if (!vendorObjId) continue;
      const vendorName = String(kyc?.vendorId?.fullName || 'Vendor').trim();
      const vendorCode = `VEN-${vendorObjId.slice(-3).toUpperCase()}`;
      const list = Array.isArray(kyc?.storeManagement?.stores)
        ? kyc.storeManagement.stores
        : [];
      for (let i = 0; i < list.length; i += 1) {
        const s = list[i] || {};
        stores.push({
          _id: `${vendorObjId}_${i}`,
          id: `STR-${String(seq).padStart(3, '0')}`,
          name: String(s.storeName || `Store ${i + 1}`).trim(),
          vendor: vendorName,
          vendorId: vendorCode,
          city: extractCityFromStore(s),
          pin: String(s.pincode || '').trim() || '—',
          radius: storeRadiusLabel(s),
          status: s.isActive === false ? 'disabled' : 'enabled',
        });
        seq += 1;
      }
    }

    res.json({ stores });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createVendorProfile = async (req, res) => {
  try {
    const { fullName, emailAddress, password } = req.body;

    if (!fullName || !emailAddress) {
      return res.status(400).json({ message: 'fullName and emailAddress are required' });
    }

    const existing = await Vendor.findOne({ emailAddress });
    if (existing) {
      return res.status(400).json({ message: 'Vendor email already exists' });
    }

    const tempPassword =
      String(password || '').trim() ||
      `Rent@${Math.random().toString(36).slice(-6)}${Date.now().toString().slice(-2)}`;
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const vendor = await Vendor.create({
      fullName,
      emailAddress: String(emailAddress).trim().toLowerCase(),
      password: hashedPassword,
      // Admin-created profiles should be able to login directly.
      isVerified: true,
      otp: null,
      otpExpire: null,
    });

    return res.status(201).json({
      message: 'Vendor profile created successfully',
      vendor: {
        _id: vendor._id,
        fullName: vendor.fullName,
        emailAddress: vendor.emailAddress,
        isVerified: vendor.isVerified,
        createdAt: vendor.createdAt,
      },
      tempPassword,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getVendorDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const vendor = await Vendor.findById(id).select(
      'fullName emailAddress isVerified createdAt mobileNumber referralCode',
    );
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    const products = await Product.find({ vendorId: id }).sort({ createdAt: -1 });
    const productIds = products.map((p) => p._id);

    const orders = await Order.find({
      'products.product': { $in: productIds },
    })
      .populate('products.product', 'productName vendorId category type')
      .sort({ createdAt: -1 });

    let totalEarnings = 0;
    let pendingSettlement = 0;
    const transactions = [];

    orders.forEach((order) => {
      const rentalDuration = Number(order.rentalDuration || 0);
      let orderVendorAmount = 0;

      (order.products || []).forEach((item) => {
        const p = item.product;
        if (!p || String(p.vendorId) !== String(id)) return;
        orderVendorAmount +=
          Number(item.pricePerDay || 0) *
          Number(item.quantity || 0) *
          rentalDuration;
      });

      if (orderVendorAmount > 0) {
        totalEarnings += orderVendorAmount;
        if (!['delivered', 'cancelled'].includes(String(order.status || ''))) {
          pendingSettlement += orderVendorAmount;
        }
        transactions.push({
          _id: order._id,
          date: order.createdAt,
          amount: orderVendorAmount,
          status: order.status,
          description: 'Rental order payout',
        });
      }
    });

    const activeProducts = products.filter((p) => Number(p.stock || 0) > 0).length;
    const activeOrders = orders.filter(
      (o) => !['cancelled'].includes(String(o.status || '').toLowerCase()),
    ).length;
    const summary = {
      totalEarnings,
      activeProducts,
      activeOrders,
      pendingSettlement,
      totalProducts: products.length,
    };

    const vendorIdStr = String(id || '').trim();
    let kycRecord = null;
    if (mongoose.Types.ObjectId.isValid(vendorIdStr)) {
      const oid = new mongoose.Types.ObjectId(vendorIdStr);
      kycRecord = await VendorKyc.findOne({ vendorId: oid }).lean();
    }
    if (!kycRecord) {
      kycRecord = await VendorKyc.findOne({ vendorId: vendorIdStr }).lean();
    }
    const kycDocuments = [];
    if (kycRecord) {
      const gstUrl = kycRecord.businessDetails?.gstCertificate || '';
      const panUrl = kycRecord.panPhoto || '';
      const stores = kycRecord.storeManagement?.stores || [];
      const shopUrl =
        stores.find((s) => String(s.shopFrontPhotoUrl || '').trim())?.shopFrontPhotoUrl ||
        '';
      const doc = (docId, title, url) => ({
        id: docId,
        title,
        url: String(url || '').trim(),
        status: String(url || '').trim() ? 'Uploaded' : 'Not Uploaded',
      });
      kycDocuments.push(
        doc('gst', 'GST Certificate', gstUrl),
        doc('pan', 'Business PAN', panUrl),
        doc('shop', 'Shop Photo', shopUrl),
      );
    } else {
      kycDocuments.push(
        { id: 'gst', title: 'GST Certificate', url: '', status: 'Not Uploaded' },
        { id: 'pan', title: 'Business PAN', url: '', status: 'Not Uploaded' },
        { id: 'shop', title: 'Shop Photo', url: '', status: 'Not Uploaded' },
      );
    }

    const storesForAddr = kycRecord?.storeManagement?.stores || [];
    const defaultStore =
      storesForAddr.find((s) => s.isDefault) || storesForAddr[0] || null;
    const businessAddress =
      String(defaultStore?.completeAddress || '').trim() ||
      String(kycRecord?.permanentAddress || '').trim() ||
      '';

    const productRentPerMonth = (p) => {
      const tiers = p.rentalConfigurations || [];
      const t = tiers[0];
      if (!t) return 0;
      const cr = Number(t.customerRent || 0);
      if (cr > 0) return Math.round(cr);
      const ppd = Number(t.pricePerDay || 0);
      return ppd > 0 ? Math.round(ppd * 30) : 0;
    };

    const lastTx = transactions[0];
    const lastSettlementDate = lastTx?.date || null;

    res.json({
      vendor: {
        _id: vendor._id,
        fullName: vendor.fullName,
        emailAddress: vendor.emailAddress,
        mobileNumber: vendor.mobileNumber || '',
        referralCode: vendor.referralCode || '',
        isVerified: vendor.isVerified,
        createdAt: vendor.createdAt,
        vendorCode: `VEN-${String(vendor._id).slice(-4).toUpperCase()}`,
      },
      kycApplicationStatus: kycRecord?.status || null,
      businessAddress,
      summary,
      products: products.map((p) => ({
        _id: p._id,
        productName: p.productName,
        category: p.category,
        type: p.type,
        price: p.price,
        stock: p.stock,
        status: p.status,
        image: p.image,
        rentPerMonth: productRentPerMonth(p),
        submissionStatus: p.submissionStatus,
        isAdminApproved: p.isAdminApproved,
        adminListingEnabled: p.adminListingEnabled,
        vendorListingEnabled: p.vendorListingEnabled,
      })),
      kycDocuments,
      financials: {
        totalEarnings,
        pendingSettlement,
        lastSettlement: Math.round(totalEarnings * 0.03),
        lastSettlementDate,
      },
      recentTransactions: transactions.slice(0, 8),
      loanHistory: [],
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** Sell vs rental from line snapshot and/or populated catalog product. */
function lineIsSell(line) {
  const t = String(line?.productType || '').trim().toLowerCase();
  if (t === 'sell') return true;
  const p = line?.product;
  if (p && typeof p === 'object') {
    const pt = String(p.type || '').trim().toLowerCase();
    if (pt === 'sell') return true;
  }
  return false;
}

/** Brand-new sell purchases only; everything else (Refurbished, Like New, …) → used bucket. */
function sellSpendIsBrandNew(conditionRaw) {
  const c = String(conditionRaw || '').trim().toLowerCase();
  return c === 'brand new' || c === 'brandnew';
}

/**
 * Per line: checkout stores the customer line total in `pricePerDay` × `quantity`
 * (full-tenure rent for rentals, sale price × qty for buys).
 */
function lineGoodsTotal(line) {
  const qty = Math.max(1, Number(line?.quantity || 1));
  return Number(line?.pricePerDay || 0) * qty;
}

function summarizeUserOrders(orders = []) {
  let ordersCount = 0;
  let itemsCount = 0;
  let newBuy = 0;
  let usedBuy = 0;
  let rent = 0;
  let deposit = 0;
  let shipping = 0;

  for (const order of orders) {
    const lines = order.products || [];
    if (!lines.length) continue;
    ordersCount += 1;

    for (const line of lines) {
      itemsCount += Math.max(1, Number(line?.quantity || 1));
      const amt = lineGoodsTotal(line);

      if (lineIsSell(line)) {
        const p = line.product;
        const cond = p && typeof p === 'object' ? String(p.condition || '').trim() : '';
        if (sellSpendIsBrandNew(cond)) newBuy += amt;
        else usedBuy += amt;
      } else {
        rent += amt;
        deposit += Number(line.refundableDeposit || 0);
      }
    }

    shipping += 99;
  }

  // At-home product service (AC/fridge visits): not implemented — always 0 for API/UI.
  const service = 0;
  const lifetimeValue = rent + newBuy + usedBuy + deposit + shipping;

  return {
    ordersCount,
    itemsCount,
    service,
    newBuy,
    usedBuy,
    rent,
    deposit,
    shipping,
    lifetimeValue,
  };
}

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({})
      .select('fullName emailAddress createdAt customerNumber')
      .sort({ createdAt: -1 });

    const userIds = users.map((u) => u._id);
    const [kycRows, orders, addressPhones, orderPhones] = await Promise.all([
      UserKyc.find({ userId: { $in: userIds } })
        .select('userId contactNumber')
        .lean(),
      Order.find({ user: { $in: userIds } })
        .populate('products.product', 'type condition')
        .lean(),
      Address.aggregate([
        { $match: { user: { $in: userIds } } },
        { $sort: { createdAt: -1 } },
        { $group: { _id: '$user', phone: { $first: '$phone' } } },
      ]),
      Order.aggregate([
        { $match: { user: { $in: userIds } } },
        { $sort: { createdAt: -1 } },
        { $group: { _id: '$user', phone: { $first: '$phone' } } },
      ]),
    ]);

    const kycByUser = new Map(
      kycRows.map((k) => [String(k.userId), String(k.contactNumber || '').trim()]),
    );
    const addressPhoneByUser = new Map(
      addressPhones.map((r) => [String(r._id), String(r.phone || '').trim()]),
    );
    const orderPhoneByUser = new Map(
      orderPhones.map((r) => [String(r._id), String(r.phone || '').trim()]),
    );

    const ordersByUser = new Map();
    for (const id of userIds) {
      ordersByUser.set(String(id), []);
    }
    for (const o of orders) {
      const key = String(o.user);
      if (!ordersByUser.has(key)) ordersByUser.set(key, []);
      ordersByUser.get(key).push(o);
    }

    const result = users.map((u) => {
      const uid = String(u._id);
      const userOrders = ordersByUser.get(uid) || [];
      const fin = summarizeUserOrders(userOrders);
      const lifetimeValue =
        fin.rent + fin.newBuy + fin.usedBuy + fin.deposit + fin.shipping;
      return {
        _id: u._id,
        fullName: u.fullName,
        emailAddress: u.emailAddress,
        createdAt: u.createdAt,
        customerNumber: u.customerNumber,
        kycMobile:
          kycByUser.get(uid) ||
          addressPhoneByUser.get(uid) ||
          orderPhoneByUser.get(uid) ||
          '',
        ordersCount: fin.ordersCount,
        itemsCount: fin.itemsCount,
        service: 0,
        newBuy: fin.newBuy,
        usedBuy: fin.usedBuy,
        rent: fin.rent,
        deposit: fin.deposit,
        shipping: fin.shipping,
        lifetimeValue,
      };
    });

    res.json({ users: result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUserDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select(
      'fullName emailAddress createdAt customerNumber',
    );
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userObjectId = mongoose.Types.ObjectId.isValid(String(id))
      ? new mongoose.Types.ObjectId(String(id))
      : null;
    const userOrderFilter = userObjectId ? { user: userObjectId } : { user: id };

    const populateOrderPaths = [
      { path: 'user', select: 'fullName emailAddress' },
      {
        path: 'products.product',
        select:
          'productName image category type rentalConfigurations refundableDeposit vendorId logisticsVerification',
      },
    ];

    const [orders, kycLean, issueOrders, addressDoc] = await Promise.all([
      Order.find(userOrderFilter).populate(populateOrderPaths).sort({ createdAt: -1 }).lean(),
      UserKyc.findOne({ userId: userObjectId || id }).lean(),
      Order.find({
        ...userOrderFilter,
        'products.issueReports.0': { $exists: true },
      })
        .populate(populateOrderPaths)
        .sort({ createdAt: -1 })
        .lean(),
      Address.findOne({ user: userObjectId || id }).sort({ createdAt: -1 }).lean(),
    ]);

    const orderPhone = orders.length ? String(orders[0].phone || '').trim() : '';
    const resolvedProfilePhone =
      String(kycLean?.contactNumber || '').trim() ||
      String(addressDoc?.phone || '').trim() ||
      orderPhone;

    const activeRentals = buildMyRentalsStyleActiveRows(orders);
    const supportTickets = await buildIssueTicketsFromOrders(issueOrders);

    const orderHistory = [];
    let totalAmount = 0;
    let totalRentAmount = 0;
    let totalDeposit = 0;
    let totalShipping = 0;

    orders.forEach((order) => {
      const createdAt = order.createdAt ? new Date(order.createdAt) : new Date();
      const rentalDuration = Number(order.rentalDuration || 0);
      const endAt = new Date(createdAt);
      endAt.setMonth(endAt.getMonth() + rentalDuration);

      const orderAmount = (order.products || []).reduce((sum, item) => {
        return (
          sum +
          Number(item.pricePerDay || 0) *
            Number(item.quantity || 0) *
            rentalDuration
        );
      }, 0);

      totalAmount += orderAmount;
      totalRentAmount += orderAmount;
      totalDeposit += Math.round(orderAmount * 0.1);
      totalShipping += Math.round(orderAmount * 0.02);

      const firstLine = (order.products || [])[0];
      const firstProd = firstLine?.product;
      const isSell =
        String(firstLine?.productType || '').toLowerCase() === 'sell' ||
        (firstProd &&
          typeof firstProd === 'object' &&
          String(firstProd.type || '').toLowerCase() === 'sell');

      orderHistory.push({
        _id: order._id,
        date: order.createdAt,
        amount: orderAmount,
        status: order.status,
        type: isSell ? 'Buy' : 'Rent',
        description:
          order.products
            ?.map((p) => p.product?.productName)
            .filter(Boolean)
            .join(', ') || 'Rental order',
      });
    });

    const tenureMonths = Math.max(
      0,
      Math.floor(
        (Date.now() - new Date(user.createdAt).getTime()) / (30 * 24 * 60 * 60 * 1000),
      ),
    );

    const customerNumber = user.customerNumber;
    const customerCode =
      customerNumber != null && customerNumber > 0
        ? `CUST-${String(customerNumber).padStart(3, '0')}`
        : `CUST-${String(user._id).slice(-6).toUpperCase()}`;

    const customerKyc = kycLean
      ? {
          status: kycLean.status,
          submittedAt: kycLean.submittedAt,
          reviewedAt: kycLean.reviewedAt,
          contactNumber: resolvedProfilePhone,
          aadhaarFront: kycLean.aadhaarFront || '',
          aadhaarBack: kycLean.aadhaarBack || '',
          panCard: kycLean.panCard || '',
        }
      : null;

    res.json({
      profilePhone: resolvedProfilePhone,
      user: {
        _id: user._id,
        fullName: user.fullName,
        emailAddress: user.emailAddress,
        createdAt: user.createdAt,
        customerCode,
        customerNumber: customerNumber ?? null,
      },
      summary: {
        tenureMonths,
        totalOrders: orders.length,
        totalAmount,
        activeRentals: activeRentals.length,
      },
      financials: {
        rent: totalRentAmount,
        deposit: totalDeposit,
        shipping: totalShipping,
      },
      activeRentals,
      orderHistory,
      customerKyc,
      kycDocuments: [],
      supportTickets,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const patchAdminProductListingVisibility = async (req, res) => {
  try {
    const { productId } = req.params;
    const raw = req.body?.adminListingEnabled;
    const adminListingEnabled = raw === true || raw === 'true';

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    if (adminListingEnabled && product.isAdminApproved === false) {
      return res.status(400).json({
        message: 'Approve the product before enabling it on the storefront.',
      });
    }

    product.adminListingEnabled = adminListingEnabled;
    await product.save();

    return res.json({
      message: 'Listing visibility updated.',
      product,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getAllProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      search,
      category,
      storefront,
      sellStats,
      userLat,
      userLng,
    } = req.query;

    /** Storefront buy page: counts for all sell listings + by condition (no pagination). */
    if (
      (storefront === '1' || storefront === 'true') &&
      sellStats === '1'
    ) {
      const match = {
        type: 'Sell',
        vendorId: { $exists: true, $ne: null },
        submissionStatus: 'published',
        isAdminApproved: { $ne: false },
        ...storefrontListingVisibilityMatch(),
      };
      const rows = await Product.find(match)
        .populate('vendorId', '_id')
        .select('condition variants.condition')
        .lean();

      const visible = (rows || []).filter((p) => p.vendorId);

      const norm = (raw) =>
        String(raw ?? '')
          .trim()
          .toLowerCase()
          .replace(/\s+/g, ' ');

      let brandNew = 0;
      let refurbished = 0;
      for (const p of visible) {
        let c = norm(p.condition);
        if (!c && Array.isArray(p.variants) && p.variants.length) {
          c = norm(p.variants[0]?.condition);
        }
        if (c === 'brand new') brandNew += 1;
        else if (c === 'refurbished') refurbished += 1;
      }

      return res.status(200).json({
        total: visible.length,
        brandNew,
        refurbished,
      });
    }

    const query = {};
    if (search) query.productName = { $regex: search, $options: 'i' };
    if (category) query.category = category;

    /** Public website: show only admin-approved published listings. */
    if (storefront === '1' || storefront === 'true') {
      query.vendorId = { $exists: true, $ne: null };
      query.submissionStatus = 'published';
      query.isAdminApproved = { $ne: false };
      Object.assign(query, storefrontListingVisibilityMatch());
    }

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .populate('vendorId', 'fullName emailAddress')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    // If a vendor was deleted, populate(vendorId) becomes null; hide such products.
    let visibleProducts = (products || []).filter((p) => p.vendorId);

    // Storefront location filtering: if user location is selected, only show
    // vendors that serve that location based on their store service mode.
    const storefrontMode = storefront === '1' || storefront === 'true';
    const hasUserLocation =
      Number.isFinite(Number(userLat)) && Number.isFinite(Number(userLng));
    if (storefrontMode && hasUserLocation && visibleProducts.length) {
      const userLatNum = Number(userLat);
      const userLngNum = Number(userLng);
      const vendorIds = [
        ...new Set(visibleProducts.map((p) => String(p.vendorId?._id || '')).filter(Boolean)),
      ];
      const kycRows = await VendorKyc.find({ vendorId: { $in: vendorIds } })
        .select('vendorId storeManagement.stores')
        .lean();
      const storeMap = new Map();
      for (const row of kycRows || []) {
        const store = pickPrimaryStore(row?.storeManagement?.stores || []);
        storeMap.set(String(row?.vendorId || ''), store || null);
      }
      visibleProducts = visibleProducts.filter((p) => {
        const vid = String(p.vendorId?._id || '');
        const store = storeMap.get(vid);
        return vendorServesLocation(store, userLatNum, userLngNum);
      });
    }

    res.status(200).json({
      products: visibleProducts,
      pages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

function resolveApprovalStatusLabel(product) {
  if (product?.submissionStatus === 'published' && product?.isAdminApproved) {
    return 'approved';
  }
  if (product?.submissionStatus === 'draft') return 'draft';
  return 'pending_approval';
}

export const getProductApprovalQueue = async (req, res) => {
  try {
    const search = String(req.query.search || '').trim();
    const status = String(req.query.status || 'pending').trim().toLowerCase();

    const query = { vendorId: { $exists: true, $ne: null } };
    if (search) {
      query.$or = [
        { productName: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { subCategory: { $regex: search, $options: 'i' } },
      ];
    }
    if (status === 'approved') {
      query.submissionStatus = 'published';
      query.isAdminApproved = { $ne: false };
    } else if (status === 'draft') {
      query.submissionStatus = 'draft';
    } else {
      query.submissionStatus = 'pending_approval';
    }

    const products = await Product.find(query)
      .populate('vendorId', 'fullName emailAddress')
      .sort({ createdAt: -1 })
      .lean();

    const vendorIds = [
      ...new Set(
        (products || [])
          .map((p) => String(p?.vendorId?._id || p?.vendorId || ''))
          .filter(Boolean),
      ),
    ];
    const kycRows = await VendorKyc.find({ vendorId: { $in: vendorIds } })
      .select('vendorId businessDetails.shopName storeManagement.stores')
      .lean();
    const kycMap = new Map(kycRows.map((x) => [String(x.vendorId), x]));
    const pickPrimaryStore = (stores = []) =>
      stores.find((s) => s?.isDefault && s?.isActive !== false) ||
      stores.find((s) => s?.isActive !== false) ||
      stores[0] ||
      null;

    const queue = (products || [])
      .filter((p) => p.vendorId)
      .map((p) => {
        const vid = String(p?.vendorId?._id || p?.vendorId || '');
        const kyc = kycMap.get(vid);
        const store = pickPrimaryStore(kyc?.storeManagement?.stores || []);
        const vendorLabel =
          String(store?.storeName || '').trim() ||
          String(kyc?.businessDetails?.shopName || '').trim() ||
          String(p?.vendorId?.fullName || '').trim() ||
          'Vendor';
        return {
          _id: String(p._id),
          productName: p.productName || 'Product',
          image:
            (Array.isArray(p.images) && p.images[0]) ||
            p.image ||
            'https://placehold.co/120x80/e5e7eb/6b7280?text=IMG',
          category: p.category || '',
          subCategory: p.subCategory || '',
          type: p.type || '',
          createdAt: p.createdAt,
          submissionStatus: p.submissionStatus || 'draft',
          approvalStatus: resolveApprovalStatusLabel(p),
          vendor: {
            _id: vid,
            fullName: p?.vendorId?.fullName || '',
            emailAddress: p?.vendorId?.emailAddress || '',
            label: vendorLabel,
          },
          stock: Number(p.stock || 0),
          condition: p.condition || '',
          brand: p.brand || '',
          description: p.description || p.shortDescription || '',
          shortDescription: p.shortDescription || '',
          specifications: p.specifications || {},
          rentalConfigurations: Array.isArray(p.rentalConfigurations)
            ? p.rentalConfigurations
            : [],
          refundableDeposit: Number(p.refundableDeposit || 0),
          salesConfiguration: p.salesConfiguration || {},
          adminApprovedAt: p.adminApprovedAt || null,
        };
      });

    const counts = {
      pending: queue.filter((x) => x.approvalStatus === 'pending_approval').length,
      approved: queue.filter((x) => x.approvalStatus === 'approved').length,
      draft: queue.filter((x) => x.approvalStatus === 'draft').length,
    };

    return res.json({ queue, counts });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const approveProductAndGoLive = async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    product.isAdminApproved = true;
    product.submissionStatus = 'published';
    product.adminApprovedAt = new Date();
    product.adminApprovedBy = String(req?.admin?.email || 'admin');
    product.adminListingEnabled = true;
    product.vendorListingEnabled = true;
    await product.save();

    return res.json({
      message: 'Product approved and published to storefront.',
      productId: String(product._id),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
