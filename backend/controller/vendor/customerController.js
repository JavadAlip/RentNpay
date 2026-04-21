import mongoose from 'mongoose';
import Order from '../../models/Order.js';
import Product from '../../models/Product.js';
import User from '../../models/userAuthModel.js';
import UserKyc from '../../models/UserKyc.js';
import Address from '../../models/Address.js';
import { buildMyRentalsStyleActiveRows } from '../../utils/userRentalHubActiveRows.js';
import { buildIssueTicketsFromOrders } from '../admin/ticketAdminController.js';

function filterOrderToVendorProducts(order, productIds) {
  const lines = (order.products || []).filter((it) =>
    productIds.includes(String(it.product?._id || it.product)),
  );
  if (!lines.length) return null;
  return { ...order, products: lines };
}

async function enrichCustomersWithKycPhones(customers) {
  const userIds = customers.map((c) => c._id).filter(Boolean);
  const oidList = userIds
    .filter((id) => mongoose.Types.ObjectId.isValid(String(id)))
    .map((id) => new mongoose.Types.ObjectId(String(id)));
  if (!oidList.length) return;

  const [kycRows, addressPhones, orderPhones] = await Promise.all([
    UserKyc.find({ userId: { $in: oidList } })
      .select('userId contactNumber')
      .lean(),
    Address.aggregate([
      { $match: { user: { $in: oidList } } },
      { $sort: { createdAt: -1 } },
      { $group: { _id: '$user', phone: { $first: '$phone' } } },
    ]),
    Order.aggregate([
      { $match: { user: { $in: oidList } } },
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

  for (const c of customers) {
    const uid = String(c._id);
    c.kycMobile =
      kycByUser.get(uid) ||
      addressPhoneByUser.get(uid) ||
      orderPhoneByUser.get(uid) ||
      '';
  }
}

export const getVendorCustomersSummary = async (req, res) => {
  try {
    const vendorId = req.vendor?._id;
    if (!vendorId) {
      return res.status(401).json({ message: 'Vendor not authenticated' });
    }

    const vendorProducts = await Product.find({ vendorId }).select(
      '_id productName category type price',
    );
    const productIds = vendorProducts.map((p) => String(p._id));
    const productMap = new Map(vendorProducts.map((p) => [String(p._id), p]));

    if (!productIds.length) {
      return res.json({
        customers: [],
        totals: {
          totalCustomers: 0,
          topCustomers: 0,
          revenue: 0,
          avgTenureMonths: 0,
          service: 0,
          newBuy: 0,
          usedBuy: 0,
          rent: 0,
          deposit: 0,
          shipping: 0,
          lifetime: 0,
        },
      });
    }

    const orders = await Order.find({
      'products.product': { $in: productIds },
    })
      .populate('user', 'fullName emailAddress')
      .populate('products.product', 'productName')
      .sort({ createdAt: -1 });

    const byCustomer = new Map();

    orders.forEach((order) => {
      const orderUserId = String(order.user?._id || '');
      if (!orderUserId) return;

      const userName = order.user?.fullName || 'Customer';
      const userEmail = order.user?.emailAddress || '';
      const orderDate = order.createdAt;
      const rentalDuration = Number(order.rentalDuration || 0);

      const items = (order.products || []).filter((it) =>
        productIds.includes(String(it.product?._id || it.product)),
      );
      if (!items.length) return;

      if (!byCustomer.has(orderUserId)) {
        byCustomer.set(orderUserId, {
          _id: orderUserId,
          fullName: userName,
          emailAddress: userEmail,
          lastOrderAt: orderDate,
          service: 0,
          newBuy: 0,
          usedBuy: 0,
          rent: 0,
          deposit: 0,
          shipping: 0,
          lifetimeValue: 0,
          ordersCount: 0,
          totalTenureMonths: 0,
        });
      }

      const row = byCustomer.get(orderUserId);
      row.ordersCount += 1;
      row.totalTenureMonths += rentalDuration;
      if (new Date(orderDate) > new Date(row.lastOrderAt)) {
        row.lastOrderAt = orderDate;
      }

      items.forEach((it) => {
        const pid = String(it.product?._id || it.product);
        const p = productMap.get(pid);
        const qty = Number(it.quantity || 0);
        const lineBase = Number(it.pricePerDay || 0) * qty;
        const lineTotal = lineBase * rentalDuration;

        const category = String(p?.category || '').toLowerCase();
        const type = String(p?.type || '').toLowerCase();

        if (category.includes('service')) {
          row.service += lineTotal;
        } else if (type === 'sell') {
          row.newBuy += lineTotal;
        } else {
          row.rent += lineTotal;
        }

        row.deposit += Math.round(lineBase * 0.3);
        row.shipping += Math.round(lineBase * 0.05);
        row.lifetimeValue += lineTotal;
      });
    });

    const customers = Array.from(byCustomer.values())
      .map((c, idx) => ({
        ...c,
        customerCode: `CUST-${String(idx + 1).padStart(3, '0')}`,
        avgTenureMonths: c.ordersCount
          ? Number((c.totalTenureMonths / c.ordersCount).toFixed(1))
          : 0,
      }))
      .sort((a, b) => b.lifetimeValue - a.lifetimeValue);

    await enrichCustomersWithKycPhones(customers);

    const totals = customers.reduce(
      (acc, c) => {
        acc.service += c.service;
        acc.newBuy += c.newBuy;
        acc.usedBuy += c.usedBuy;
        acc.rent += c.rent;
        acc.deposit += c.deposit;
        acc.shipping += c.shipping;
        acc.lifetime += c.lifetimeValue;
        return acc;
      },
      {
        totalCustomers: customers.length,
        topCustomers: customers.filter((c) => c.lifetimeValue > 0).slice(0, 5)
          .length,
        revenue: 0,
        avgTenureMonths: 0,
        service: 0,
        newBuy: 0,
        usedBuy: 0,
        rent: 0,
        deposit: 0,
        shipping: 0,
        lifetime: 0,
      },
    );

    totals.revenue = totals.lifetime;
    totals.avgTenureMonths = customers.length
      ? Number(
          (
            customers.reduce((s, c) => s + Number(c.avgTenureMonths || 0), 0) /
            customers.length
          ).toFixed(1),
        )
      : 0;

    return res.json({ customers, totals });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const populateVendorCustomerOrder = [
  { path: 'user', select: 'fullName emailAddress' },
  {
    path: 'products.product',
    select:
      'productName image category type rentalConfigurations refundableDeposit vendorId logisticsVerification',
  },
];

export const getVendorCustomerDetails = async (req, res) => {
  try {
    const vendorId = req.vendor?._id;
    if (!vendorId) {
      return res.status(401).json({ message: 'Vendor not authenticated' });
    }

    const { userId } = req.params;
    if (!userId || !mongoose.Types.ObjectId.isValid(String(userId))) {
      return res.status(400).json({ message: 'Invalid customer id.' });
    }

    const vendorProductIds = await Product.find({ vendorId }).distinct('_id');
    const productIds = (vendorProductIds || []).map((id) => String(id));
    if (!productIds.length) {
      return res.status(404).json({ message: 'No products listed for your store yet.' });
    }

    const user = await User.findById(userId)
      .select('fullName emailAddress createdAt customerNumber')
      .lean();
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const uid = new mongoose.Types.ObjectId(String(userId));

    const orderMatch = {
      user: uid,
      'products.product': { $in: productIds },
    };

    const [ordersRaw, kycLean, issueOrdersRaw, addressDoc] = await Promise.all([
      Order.find(orderMatch)
        .populate(populateVendorCustomerOrder)
        .sort({ createdAt: -1 })
        .lean(),
      UserKyc.findOne({ userId: uid }).lean(),
      Order.find({
        ...orderMatch,
        'products.issueReports.0': { $exists: true },
      })
        .populate(populateVendorCustomerOrder)
        .sort({ createdAt: -1 })
        .lean(),
      Address.findOne({ user: uid }).sort({ createdAt: -1 }).lean(),
    ]);

    const ordersFiltered = ordersRaw
      .map((o) => filterOrderToVendorProducts(o, productIds))
      .filter(Boolean);

    if (!ordersFiltered.length) {
      return res.status(404).json({
        message: 'This customer has no orders with your products.',
      });
    }

    const issueOrdersFiltered = issueOrdersRaw
      .map((o) => filterOrderToVendorProducts(o, productIds))
      .filter(Boolean);

    const orderPhone = ordersFiltered.length
      ? String(ordersFiltered[0].phone || '').trim()
      : '';
    const resolvedProfilePhone =
      String(kycLean?.contactNumber || '').trim() ||
      String(addressDoc?.phone || '').trim() ||
      orderPhone;

    const activeRentals = buildMyRentalsStyleActiveRows(ordersFiltered);
    const supportTickets = await buildIssueTicketsFromOrders(issueOrdersFiltered);

    const orderHistory = [];
    let totalAmount = 0;
    let totalRentAmount = 0;
    let totalDeposit = 0;
    let totalShipping = 0;

    ordersFiltered.forEach((order) => {
      const rentalDuration = Number(order.rentalDuration || 0);
      const vendorLines = order.products || [];

      const orderAmount = vendorLines.reduce((sum, item) => {
        const qty = Number(item.quantity || 0);
        return sum + Number(item.pricePerDay || 0) * qty * rentalDuration;
      }, 0);

      totalAmount += orderAmount;
      totalRentAmount += orderAmount;
      totalDeposit += vendorLines.reduce(
        (s, item) =>
          s +
          Math.round(
            Number(item.pricePerDay || 0) * Number(item.quantity || 0) * 0.3,
          ),
        0,
      );
      totalShipping += vendorLines.reduce(
        (s, item) =>
          s +
          Math.round(
            Number(item.pricePerDay || 0) * Number(item.quantity || 0) * 0.05,
          ),
        0,
      );

      const firstLine = vendorLines[0];
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
          vendorLines
            .map((p) => p.product?.productName)
            .filter(Boolean)
            .join(', ') || 'Order',
      });
    });

    const tenureMonths = Math.max(
      0,
      Math.floor(
        (Date.now() - new Date(user.createdAt).getTime()) /
          (30 * 24 * 60 * 60 * 1000),
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

    return res.json({
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
        totalOrders: ordersFiltered.length,
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
    return res.status(500).json({ message: error.message });
  }
};
