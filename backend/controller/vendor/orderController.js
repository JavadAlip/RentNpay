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

    const method = delivery?.method === 'third_party' ? 'third_party' : 'self';
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

export const scheduleVendorReturnPickup = async (req, res) => {
  try {
    const { productId, pickupDate, pickupTime, driverName, pickupAddress } =
      req.body || {};

    const parsedPickupDate = new Date(pickupDate);
    if (!pickupDate || Number.isNaN(parsedPickupDate.getTime())) {
      return res
        .status(400)
        .json({ message: 'Valid pickup date is required.' });
    }

    const timeSlot = ['Morning', 'Afternoon', 'Evening'].includes(
      String(pickupTime || ''),
    )
      ? String(pickupTime)
      : null;
    if (!timeSlot) {
      return res
        .status(400)
        .json({ message: 'Valid pickup time is required.' });
    }

    const safeDriverName = String(driverName || '').trim();
    if (!safeDriverName) {
      return res.status(400).json({ message: 'Driver name is required.' });
    }

    const order = await Order.findById(req.params.id).populate(
      'products.product',
      'vendorId type',
    );
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const vid = String(req.vendor._id);
    const targetLine = (order.products || []).find((line) => {
      const p = line?.product;
      if (!p || typeof p === 'string') return false;
      if (String(p.vendorId || '') !== vid) return false;
      if (String(p.type || '').toLowerCase() === 'sell') return false;
      if (productId && String(p._id || '') !== String(productId)) return false;
      const rr = line?.returnRequest;
      return Boolean(rr?.requestedAt);
    });

    if (!targetLine) {
      return res.status(404).json({
        message: 'Return request line not found for this vendor.',
      });
    }

    const resolvedPickupAddress =
      String(pickupAddress || '').trim() || String(order.address || '').trim();
    if (
      !targetLine.returnRequest ||
      typeof targetLine.returnRequest !== 'object'
    ) {
      targetLine.returnRequest = {};
    }
    if (
      !targetLine.returnRequest.refundDetails ||
      typeof targetLine.returnRequest.refundDetails !== 'object'
    ) {
      targetLine.returnRequest.refundDetails = {};
    }
    targetLine.returnRequest.vendorPickupDate = parsedPickupDate;
    targetLine.returnRequest.vendorPickupTime = timeSlot;
    targetLine.returnRequest.vendorPickupAddress = resolvedPickupAddress;
    targetLine.returnRequest.vendorDriverName = safeDriverName;
    targetLine.returnRequest.pickupScheduledAt = new Date();

    await order.save();

    const populated = await Order.findById(order._id).populate(
      vendorOrderPopulate,
    );
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const completeVendorReturnInspection = async (req, res) => {
  try {
    const {
      productId,
      inspectionChecklist,
      pickupPhotoName,
      damageDeduction,
      cleaningFees,
      authorizeRefund,
    } = req.body || {};

    if (!authorizeRefund) {
      return res.status(400).json({
        message: 'Authorization is required to initiate refund.',
      });
    }

    const order = await Order.findById(req.params.id).populate(
      'products.product',
      'vendorId type',
    );
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const vid = String(req.vendor._id);
    const targetLine = (order.products || []).find((line) => {
      const p = line?.product;
      if (!p || typeof p === 'string') return false;
      if (String(p.vendorId || '') !== vid) return false;
      if (String(p.type || '').toLowerCase() === 'sell') return false;
      if (productId && String(p._id || '') !== String(productId)) return false;
      return Boolean(line?.returnRequest?.pickupScheduledAt);
    });

    if (!targetLine) {
      return res.status(404).json({
        message: 'Pickup-scheduled return line not found for this vendor.',
      });
    }

    const safeDamage = Math.max(0, Number(damageDeduction || 0));
    const safeCleaning = Math.max(0, Number(cleaningFees || 0));
    const totalDeduction = safeDamage + safeCleaning;
    const depositHeld = Math.max(0, Number(targetLine?.refundableDeposit || 0));
    const finalRefundAmount = Math.max(0, depositHeld - totalDeduction);

    if (
      !targetLine.returnRequest ||
      typeof targetLine.returnRequest !== 'object'
    ) {
      targetLine.returnRequest = {};
    }
    if (
      !targetLine.returnRequest.refundDetails ||
      typeof targetLine.returnRequest.refundDetails !== 'object'
    ) {
      targetLine.returnRequest.refundDetails = {};
    }

    const checklist = inspectionChecklist || {};
    targetLine.returnRequest.inspectionChecklist = {
      powerFunctionCheck: Boolean(checklist.powerFunctionCheck),
      surfaceScratches: Boolean(checklist.surfaceScratches),
      structuralIntegrity: Boolean(checklist.structuralIntegrity),
      accessoriesAccountedFor: Boolean(checklist.accessoriesAccountedFor),
      cleanlinessCheck: Boolean(checklist.cleanlinessCheck),
    };
    targetLine.returnRequest.pickupPhotoName = String(
      pickupPhotoName || '',
    ).trim();
    targetLine.returnRequest.damageDeduction = safeDamage;
    targetLine.returnRequest.cleaningFees = safeCleaning;
    targetLine.returnRequest.totalDeduction = totalDeduction;
    targetLine.returnRequest.finalRefundAmount = finalRefundAmount;
    targetLine.returnRequest.qcCompletedAt = new Date();
    targetLine.returnRequest.refundInitiatedAt = new Date();
    order.status = 'completed';

    await order.save();

    const populated = await Order.findById(order._id).populate(
      vendorOrderPopulate,
    );
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
