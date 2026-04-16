import Order from '../../models/Order.js';
import Product from '../../models/Product.js';
import UserKyc from '../../models/UserKyc.js';
import Address from '../../models/Address.js';

const ISSUE_TYPE_LABEL = {
  structural_damage: 'Structural damage',
  fabric_stain: 'Fabric tear / stain',
  functionality_issue: 'Functionality issue',
  other: 'Other',
};

function formatQueryId(report) {
  const n = Number(report?.queryCode);
  if (Number.isFinite(n) && n > 0) {
    return `QRY-${String(Math.floor(n)).padStart(4, '0')}`;
  }
  const id = String(report?._id || '');
  if (id.length >= 4) return `QRY-${id.slice(-4).toUpperCase()}`;
  return `QRY-${id.toUpperCase() || 'NEW'}`;
}

function ticketMessage(report) {
  const label =
    ISSUE_TYPE_LABEL[String(report?.issueType || '').trim()] || 'Issue';
  const desc = String(report?.description || '').trim();
  if (!desc) return `${label}.`;
  return `${label}: ${desc}`;
}

function isVendorLine(line, vendorIdStr) {
  const p = line?.product;
  if (!p || typeof p === 'string') return false;
  return String(p.vendorId) === vendorIdStr;
}

function getTicketStatus(report) {
  const st = String(report?.status || 'open').toLowerCase();
  return st === 'resolved' ? 'solved' : 'pending';
}

function composeAddressFromDoc(addressDoc) {
  if (!addressDoc) return '';
  return `${addressDoc.addressLine || ''}${addressDoc.area ? `, ${addressDoc.area}` : ''}${
    addressDoc.city ? `, ${addressDoc.city}` : ''
  }${addressDoc.pincode ? ` - ${addressDoc.pincode}` : ''}`.trim();
}

/** Flatten issue reports for this vendor’s rental lines across orders. */
export const getVendorTickets = async (req, res) => {
  try {
    const vendorId = req.vendor._id;
    const vendorIdStr = String(vendorId);
    const productIds = await Product.find({ vendorId }).distinct('_id');
    if (!productIds.length) {
      return res.json({
        tickets: [],
        summary: { total: 0, pending: 0, solved: 0 },
      });
    }

    const orders = await Order.find({ 'products.product': { $in: productIds } })
      .populate([
        { path: 'user', select: 'fullName emailAddress' },
        {
          path: 'products.product',
          select: 'productName image vendorId logisticsVerification',
        },
      ])
      .sort({ updatedAt: -1 })
      .lean();

    const tickets = [];
    for (const order of orders) {
      const customerName = order.user?.fullName || 'Customer';
      for (const line of order.products || []) {
        if (!isVendorLine(line, vendorIdStr)) continue;
        const p = line.product;
        const reports = line.issueReports || [];
        const ownerName =
          (p.logisticsVerification && p.logisticsVerification.inventoryOwnerName) ||
          '';
        for (const ir of reports) {
          if (!ir) continue;
          const st = String(ir.status || 'open').toLowerCase();
          tickets.push({
            _id: String(ir._id),
            orderId: String(order._id),
            productId: String(p._id),
            queryId: formatQueryId(ir),
            customerName,
            productName: p.productName || 'Product',
            message: ticketMessage(ir),
            status: getTicketStatus(ir),
            vendorStatus: st,
            createdAt: ir.createdAt || order.createdAt,
            assignedStore: String(ownerName || '').trim(),
            photos: Array.isArray(ir.photos) ? ir.photos : [],
            issueType: ir.issueType,
          });
        }
      }
    }

    tickets.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    const total = tickets.length;
    const solved = tickets.filter((t) => t.status === 'solved').length;
    const pending = total - solved;
    res.json({ tickets, summary: { total, pending, solved } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getVendorTicketById = async (req, res) => {
  try {
    const { orderId, issueId } = req.params;
    const order = await Order.findById(orderId)
      .populate([
        { path: 'user', select: 'fullName emailAddress' },
        {
          path: 'products.product',
          select: 'productName image vendorId logisticsVerification',
        },
      ])
      .lean();
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const vendorIdStr = String(req.vendor._id);
    const userId = String(order?.user?._id || '');

    let kyc = null;
    let addressDoc = null;
    if (userId) {
      [kyc, addressDoc] = await Promise.all([
        UserKyc.findOne({ userId }).lean(),
        Address.findOne({ user: userId }).sort({ createdAt: -1 }).lean(),
      ]);
    }

    const kycAddress = String(kyc?.permanentAddress || '').trim();
    const fallbackAddress = composeAddressFromDoc(addressDoc);
    const resolvedAddress =
      kycAddress ||
      fallbackAddress ||
      String(order.address || '').trim();

    const resolvedPhone =
      String(kyc?.contactNumber || '').trim() ||
      String(addressDoc?.phone || '').trim() ||
      String(order.phone || '').trim();

    let ticket = null;

    for (const line of order.products || []) {
      if (!isVendorLine(line, vendorIdStr)) continue;
      const p = line.product;
      const ownerName =
        (p.logisticsVerification && p.logisticsVerification.inventoryOwnerName) || '';
      const report = (line.issueReports || []).find(
        (x) => String(x?._id) === String(issueId),
      );
      if (!report) continue;

      ticket = {
        _id: String(report._id),
        orderId: String(order._id),
        productId: String(p._id),
        queryId: formatQueryId(report),
        customerName: order.user?.fullName || order.name || 'Customer',
        customerEmail: order.user?.emailAddress || '',
        customerPhone: resolvedPhone,
        productName: p.productName || 'Product',
        status: getTicketStatus(report),
        vendorStatus: String(report.status || 'open').toLowerCase(),
        createdAt: report.createdAt || order.createdAt,
        assignedStore: String(ownerName || '').trim(),
        address: resolvedAddress,
        issueType: String(report.issueType || 'other'),
        issueDescription: String(report.description || '').trim(),
        message: ticketMessage(report),
        photos: Array.isArray(report.photos) ? report.photos : [],
      };
      break;
    }

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    return res.json({ ticket });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const updateVendorTicketStatus = async (req, res) => {
  try {
    const { orderId, issueId } = req.params;
    const next = String(req.body?.status || '').toLowerCase();
    if (!['resolved', 'open', 'in_progress'].includes(next)) {
      return res
        .status(400)
        .json({ message: 'status must be resolved, open, or in_progress' });
    }

    const order = await Order.findById(orderId).populate({
      path: 'products.product',
      select: 'vendorId',
    });
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const vendorIdStr = String(req.vendor._id);
    let updated = null;

    for (const line of order.products || []) {
      if (!isVendorLine(line, vendorIdStr)) continue;
      const rep = (line.issueReports || []).find(
        (x) => String(x._id) === String(issueId),
      );
      if (rep) {
        rep.status = next;
        updated = rep;
        break;
      }
    }

    if (!updated) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    await order.save();
    res.json({
      ok: true,
      status: updated.status,
      ticketId: String(updated._id),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
