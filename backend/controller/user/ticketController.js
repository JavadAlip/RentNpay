import Order from '../../models/Order.js';
import { buildIssueTicketsFromOrders } from '../admin/ticketAdminController.js';

function mapTicketForHelpCenter(t) {
  const vs = String(t.vendorStatus || 'open').toLowerCase();
  let displayStatus = 'Open';
  let statusVariant = 'amber';
  if (vs === 'resolved' || t.status === 'solved') {
    displayStatus = 'Resolved';
    statusVariant = 'emerald';
  } else if (vs === 'in_progress') {
    displayStatus = 'In Progress';
    statusVariant = 'violet';
  } else if (vs === 'open') {
    displayStatus = 'Waiting on Vendor';
    statusVariant = 'amber';
  }
  return {
    ...t,
    issueId: t._id,
    displayStatus,
    statusVariant,
  };
}

/** Logged-in customer: issue tickets they raised on their orders (product lines). */
export const getMySupportTickets = async (req, res) => {
  try {
    const orders = await Order.find({
      user: req.user._id,
      'products.issueReports.0': { $exists: true },
    })
      .populate([
        { path: 'user', select: 'fullName emailAddress' },
        {
          path: 'products.product',
          select: 'productName image vendorId logisticsVerification',
        },
      ])
      .sort({ updatedAt: -1 })
      .lean();

    const raw = await buildIssueTicketsFromOrders(orders);
    const tickets = (raw || []).map(mapTicketForHelpCenter);
    const total = tickets.length;
    const solved = tickets.filter((t) => t.status === 'solved').length;
    const pending = total - solved;

    return res.json({
      tickets,
      summary: { total, pending, solved },
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
