import Order from '../../models/Order.js';
import Product from '../../models/Product.js';

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
          // With available schema there is no condition flag, so split buy as new.
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

