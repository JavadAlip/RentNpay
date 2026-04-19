import Order from '../../models/Order.js';
import Product from '../../models/Product.js';
import UserKyc from '../../models/UserKyc.js';
import Address from '../../models/Address.js';
import VendorKyc from '../../models/VendorKyc.js';

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

function pickPrimaryStore(stores = []) {
  if (!Array.isArray(stores) || stores.length === 0) return null;
  return (
    stores.find((s) => s?.isDefault && s?.isActive !== false) ||
    stores.find((s) => s?.isActive !== false) ||
    stores[0]
  );
}

async function resolveAssignedStoreName(productDoc) {
  if (!productDoc) return '';
  const ownerName =
    (productDoc.logisticsVerification &&
      productDoc.logisticsVerification.inventoryOwnerName) ||
    '';
  if (String(ownerName || '').trim()) return String(ownerName).trim();

  const vendorId = productDoc.vendorId;
  if (!vendorId) return '';
  const kyc = await VendorKyc.findOne({ vendorId }).lean();
  if (!kyc) return '';
  const primary = pickPrimaryStore(kyc?.storeManagement?.stores || []);
  if (primary && String(primary.storeName || '').trim()) {
    return String(primary.storeName).trim();
  }
  if (kyc.businessDetails && String(kyc.businessDetails.shopName || '').trim()) {
    return String(kyc.businessDetails.shopName).trim();
  }
  return '';
}

// ── Admin: list all tickets across all vendors ────────────────────────────────
export const getAdminTickets = async (req, res) => {
  try {
    // Load orders that have any issueReports in their product lines.
    const orders = await Order.find({ 'products.issueReports.0': { $exists: true } })
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
      const customerName = order.user?.fullName || order.name || 'Customer';
      for (const line of order.products || []) {
        const p = line.product;
        if (!p || typeof p === 'string') continue;
        const reports = line.issueReports || [];
        for (const ir of reports) {
          if (!ir) continue;
          const st = String(ir.status || 'open').toLowerCase();
          const assignedStoreName = await resolveAssignedStoreName(p);
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
            assignedStore: String(assignedStoreName || '').trim(),
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
    return res.json({ tickets, summary: { total, pending, solved } });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

/**
 * Issue rows from orders (e.g. one customer's orders). Same shape as entries in
 * `getAdminTickets` for consistent admin UI.
 * @param {object[]} ordersLean — lean orders with populated `products.product` and optional `user`
 */
export async function buildIssueTicketsFromOrders(ordersLean) {
  const tickets = [];
  for (const order of ordersLean || []) {
    const customerName = order.user?.fullName || order.name || 'Customer';
    for (const line of order.products || []) {
      const reports = line.issueReports || [];
      if (!reports.length) continue;

      const p = line.product;
      const populatedProduct =
        p &&
        typeof p === 'object' &&
        (p.vendorId != null || typeof p.productName === 'string');

      const productName = populatedProduct ? String(p.productName || 'Product') : 'Product';
      const productId =
        populatedProduct && p._id
          ? String(p._id)
          : typeof p === 'string'
            ? p
            : p && typeof p === 'object' && p._id
              ? String(p._id)
              : '';
      const assignedStoreName = populatedProduct
        ? await resolveAssignedStoreName(p)
        : '';

      for (const ir of reports) {
        if (!ir) continue;
        const st = String(ir.status || 'open').toLowerCase();
        tickets.push({
          _id: String(ir._id),
          orderId: String(order._id),
          productId,
          queryId: formatQueryId(ir),
          customerName,
          productName,
          message: ticketMessage(ir),
          status: getTicketStatus(ir),
          vendorStatus: st,
          createdAt: ir.createdAt || order.createdAt,
          assignedStore: String(assignedStoreName || '').trim(),
        });
      }
    }
  }
  tickets.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  return tickets;
}

// ── Admin: get one ticket by order + issue ───────────────────────────────────
export const getAdminTicketById = async (req, res) => {
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
      kycAddress || fallbackAddress || String(order.address || '').trim();

    const resolvedPhone =
      String(kyc?.contactNumber || '').trim() ||
      String(addressDoc?.phone || '').trim() ||
      String(order.phone || '').trim();

    let ticket = null;

    for (const line of order.products || []) {
      const p = line.product;
      if (!p || typeof p === 'string') continue;
      const report = (line.issueReports || []).find(
        (x) => String(x?._id) === String(issueId),
      );
      if (!report) continue;

      const assignedStoreName = await resolveAssignedStoreName(p);

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
        assignedStore: String(assignedStoreName || '').trim(),
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

