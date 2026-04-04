import Order from '../../models/Order.js';
import Product from '../../models/Product.js';
import VendorKyc from '../../models/VendorKyc.js';

function orderShortRef(orderId) {
  const s = String(orderId);
  return s.length > 6 ? s.slice(-6).toUpperCase() : s.toUpperCase();
}

/**
 * Activity feed for the authenticated vendor (merged, sorted by time).
 * GET /vendor/notifications
 */
export async function getVendorNotifications(req, res) {
  try {
    const vendorId = req.vendor._id;

    const [kyc, myProducts, productIds] = await Promise.all([
      VendorKyc.findOne({ vendorId }).lean(),
      Product.find({ vendorId })
        .sort({ createdAt: -1 })
        .limit(20)
        .select('productName createdAt')
        .lean(),
      Product.find({ vendorId }).distinct('_id'),
    ]);

    const orders =
      productIds.length > 0
        ? await Order.find({ 'products.product': { $in: productIds } })
            .sort({ createdAt: -1 })
            .limit(20)
            .select('createdAt status products')
            .lean()
        : [];

    const items = [];

    if (req.vendor.createdAt) {
      items.push({
        id: `account-${vendorId}`,
        type: 'account',
        title: 'Vendor account ready',
        detail: 'Your vendor profile was created successfully.',
        at: req.vendor.createdAt,
      });
    }

    if (kyc?.status === 'approved') {
      const at = kyc.reviewedAt || kyc.updatedAt || kyc.createdAt;
      if (at) {
        items.push({
          id: `kyc-${kyc._id}`,
          type: 'kyc',
          title: 'KYC verified',
          detail: 'Your vendor KYC documents were approved.',
          at,
        });
      }
    }

    for (const p of myProducts) {
      if (!p.createdAt) continue;
      items.push({
        id: `product-${p._id}`,
        type: 'product',
        title: 'New product live',
        detail: `“${p.productName || 'Product'}” is on your catalog.`,
        at: p.createdAt,
      });
    }

    for (const o of orders) {
      if (!o.createdAt) continue;
      const ref = orderShortRef(o._id);
      items.push({
        id: `order-${o._id}`,
        type: 'order',
        orderId: String(o._id),
        orderStatus: o.status || 'pending',
        title: 'New order received',
        detail: `Order #${ref} — status: ${o.status || 'pending'}.`,
        at: o.createdAt,
      });
    }

    items.sort((a, b) => new Date(b.at) - new Date(a.at));

    const seen = new Set();
    const deduped = [];
    for (const row of items) {
      if (seen.has(row.id)) continue;
      seen.add(row.id);
      deduped.push(row);
    }

    const totalCount = deduped.length;
    const notifications = deduped.slice(0, 5).map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      detail: n.detail,
      at: n.at instanceof Date ? n.at.toISOString() : n.at,
      ...(n.type === 'order' && n.orderId
        ? { orderId: n.orderId, orderStatus: n.orderStatus }
        : {}),
    }));

    res.json({
      notifications,
      count: Math.min(totalCount, 99),
    });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to load notifications' });
  }
}
