import Order from '../../models/Order.js';
import Product from '../../models/Product.js';
import VendorKyc from '../../models/VendorKyc.js';

const vendorOrderPopulate = [
  { path: 'user', select: 'fullName emailAddress' },
  {
    path: 'products.product',
    select:
      'productName image vendorId brand logisticsVerification category subCategory stock',
  },
];

const packOrderPopulate = [
  { path: 'user', select: 'fullName emailAddress' },
  {
    path: 'products.product',
    select:
      'productName image vendorId stock logisticsVerification category subCategory',
  },
];

/** Orders that include at least one line for this vendor's products. */
export const getVendorOrders = async (req, res) => {
  try {
    const vendorId = req.vendor._id;
    const productIds = await Product.find({ vendorId }).distinct('_id');
    if (!productIds.length) {
      return res.json([]);
    }
    const orders = await Order.find({ 'products.product': { $in: productIds } })
      .populate(vendorOrderPopulate)
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getVendorOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate(
      vendorOrderPopulate,
    );
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const vid = String(req.vendor._id);
    const owns = (order.products || []).some((line) => {
      const p = line.product;
      if (!p || typeof p === 'string') return false;
      return String(p.vendorId) === vid;
    });
    if (!owns) {
      return res
        .status(403)
        .json({ message: 'This order does not include your products' });
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/** Packing UI: order + vendor GSTIN; only pending/confirmed. */
export const getVendorOrderPackDetail = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate(
      packOrderPopulate,
    );
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const vid = String(req.vendor._id);
    const owns = (order.products || []).some((line) => {
      const p = line.product;
      if (!p || typeof p === 'string') return false;
      return String(p.vendorId) === vid;
    });
    if (!owns) {
      return res
        .status(403)
        .json({ message: 'This order does not include your products' });
    }

    const st = String(order.status);
    if (!['pending', 'confirmed'].includes(st)) {
      return res.status(400).json({
        message: 'This order is not in packing (pending or confirmed).',
        code: 'INVALID_STATUS',
        status: order.status,
      });
    }

    const kyc = await VendorKyc.findOne({ vendorId: req.vendor._id })
      .select('businessDetails.gstin')
      .lean();
    const vendorGstin = kyc?.businessDetails?.gstin || '';

    res.json({ order, vendorGstin });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/** Save packing checklist + delivery partner and set status shipped. */
export const vendorMarkOrderShipped = async (req, res) => {
  try {
    const { packingChecklist, delivery } = req.body || {};
    const chk = packingChecklist || {};
    if (!chk.verifyQuality || !chk.packSecurely || !chk.labelPasted) {
      return res.status(400).json({
        message: 'Complete all packing checklist items first.',
      });
    }

    const method =
      delivery?.method === 'third_party' ? 'third_party' : 'self';
    const driverName = String(delivery?.driverName || '').trim();
    const driverPhone = String(delivery?.driverPhone || '').trim();
    if (method === 'self' && (!driverName || !driverPhone)) {
      return res.status(400).json({
        message:
          'Driver name and phone are required for self / staff delivery.',
      });
    }

    const order = await Order.findById(req.params.id).populate(
      'products.product',
      'vendorId',
    );
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const vid = String(req.vendor._id);
    const owns = (order.products || []).some((line) => {
      const p = line.product;
      if (!p || typeof p === 'string') return false;
      return String(p.vendorId) === vid;
    });
    if (!owns) {
      return res
        .status(403)
        .json({ message: 'This order does not include your products' });
    }

    const st = String(order.status);
    if (!['pending', 'confirmed'].includes(st)) {
      return res.status(400).json({
        message: 'Order cannot be marked shipped from this state.',
      });
    }

    order.vendorFulfillment = {
      packingChecklist: {
        verifyQuality: true,
        packSecurely: true,
        labelPasted: true,
      },
      markedPackedAt: new Date(),
      delivery: {
        method,
        driverName,
        driverPhone,
        vehicleNumber: String(delivery?.vehicleNumber || '').trim(),
        markedShippedAt: new Date(),
      },
    };
    order.status = 'shipped';
    await order.save();

    const populated = await Order.findById(order._id).populate(
      vendorOrderPopulate,
    );
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateVendorOrderStatus = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate(
      'products.product',
      'vendorId',
    );
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const vid = String(req.vendor._id);
    const owns = (order.products || []).some((line) => {
      const p = line.product;
      if (!p || typeof p === 'string') return false;
      return String(p.vendorId) === vid;
    });
    if (!owns) {
      return res
        .status(403)
        .json({ message: 'This order does not include your products' });
    }

    if (req.body.status) order.status = req.body.status;
    await order.save();

    const populated = await Order.findById(order._id).populate(
      vendorOrderPopulate,
    );
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
