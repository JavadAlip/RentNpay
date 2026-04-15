/** Shared helpers for rental orders (My Orders, Rental Command Center). */

export function formatOrderDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function orderDisplayId(order) {
  const id = String(order._id || '');
  return id.slice(-6).toUpperCase() || id.slice(-8) || '—';
}

export function formatMoney(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '0';
  return n.toLocaleString('en-IN');
}

export function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function ordinalDay(d) {
  const n = d.getDate();
  const j = n % 10;
  const k = n % 100;
  if (k > 10 && k < 14) return `${n}th`;
  if (j === 1) return `${n}st`;
  if (j === 2) return `${n}nd`;
  if (j === 3) return `${n}rd`;
  return `${n}th`;
}

export function computeNextPaymentLabel(startDate, leaseEnd) {
  const start = new Date(startDate);
  const end = new Date(leaseEnd);
  const now = new Date();
  if (now >= end) {
    return `${ordinalDay(end)} ${end.toLocaleString('en-IN', { month: 'long' })}`;
  }
  const billDay = Math.min(start.getDate(), 28);
  let c = new Date(now.getFullYear(), now.getMonth(), billDay);
  if (c <= now) c = new Date(now.getFullYear(), now.getMonth() + 1, billDay);
  if (c > end) {
    return `${ordinalDay(end)} ${end.toLocaleString('en-IN', { month: 'long' })}`;
  }
  return `${ordinalDay(c)} ${c.toLocaleString('en-IN', { month: 'long' })}`;
}

export function productImageUrl(path) {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  const base = (
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
  ).replace(/\/api\/?$/, '');
  return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
}

export function normalizeStatus(status) {
  return String(status || '').toLowerCase();
}

export function tenureIsDays(product, rentalDuration) {
  const rd = Number(rentalDuration);
  if (!Number.isFinite(rd) || rd < 1) return false;
  const cfgs = Array.isArray(product?.rentalConfigurations)
    ? product.rentalConfigurations
    : [];
  if (!cfgs.length) return false;

  const matchDay = cfgs.some(
    (c) =>
      String(c?.periodUnit || '').toLowerCase() === 'day' &&
      Number(c?.days || 0) === rd,
  );
  if (!matchDay) return false;

  const hasMonthTierSameDuration = cfgs.some((c) => {
    const months = Number(c?.months || 0);
    if (months !== rd || months <= 0) return false;
    return String(c?.periodUnit || '').toLowerCase() !== 'day';
  });
  if (hasMonthTierSameDuration) return false;

  return true;
}

export function resolveTenureUnit(order, product, rentalDuration) {
  if (order.tenureUnit === 'day') return 'day';
  if (order.tenureUnit === 'month') return 'month';
  return tenureIsDays(product, rentalDuration) ? 'day' : 'month';
}

export function computeLeaseEnd(start, durationRaw, unit) {
  const n = Math.max(1, Number(durationRaw || 1));
  const d = new Date(start.getTime());
  if (unit === 'day') d.setDate(d.getDate() + n);
  else d.setMonth(d.getMonth() + n);
  return d;
}

export function primaryProduct(order) {
  const line = order.products?.[0];
  const p = line?.product;
  if (!p || typeof p === 'string') return null;
  return p;
}

/** Buy/sell checkout lines snapshot `productType: 'Sell'`; fall back to populated product.type. */
export function orderIsPurchase(order) {
  const line = order.products?.[0];
  if (line && String(line.productType || '').toLowerCase() === 'sell') {
    return true;
  }
  const p = primaryProduct(order);
  return p != null && String(p.type || '').toLowerCase() === 'sell';
}

/** One-time purchase total (sale price × qty), not rent × duration. */
export function purchaseLineTotal(order) {
  const line = order.products?.[0];
  return Number(line?.pricePerDay || 0) * Number(line?.quantity || 1);
}

/** Days until next monthly billing before lease end; null if day-tenure or past lease. */
export function daysUntilNextRent(order, product) {
  const st = normalizeStatus(order.status);
  if (st !== 'delivered') return null;
  if (orderIsPurchase(order)) return null;
  const start = order.createdAt ? new Date(order.createdAt) : new Date();
  const unit = resolveTenureUnit(order, product, order.rentalDuration);
  if (unit === 'day') return null;
  const leaseEnd = computeLeaseEnd(start, order.rentalDuration, unit);
  const now = new Date();
  if (now >= leaseEnd) return null;
  const billDay = Math.min(start.getDate(), 28);
  let c = new Date(now.getFullYear(), now.getMonth(), billDay);
  if (c <= now) c = new Date(now.getFullYear(), now.getMonth() + 1, billDay);
  if (c > leaseEnd) return null;
  return Math.ceil(
    (startOfDay(c).getTime() - startOfDay(now).getTime()) / 86400000,
  );
}

export function orderLineTotal(order) {
  const dur = Math.max(1, Number(order.rentalDuration || 1));
  return (order.products || []).reduce(
    (sum, it) =>
      sum +
      Number(it.pricePerDay || 0) * Number(it.quantity || 0) * dur,
    0,
  );
}

/** Rent for full tenure plus refundable deposits (checkout-style total). */
export function orderGrandTotal(order) {
  const rent = orderLineTotal(order);
  const dep = (order.products || []).reduce(
    (s, l) => s + Number(l.refundableDeposit || 0),
    0,
  );
  return rent + dep;
}

export function primaryLine(order) {
  return order.products?.[0] || null;
}

/**
 * Same line-level rules as /my-rentals (Rental Command Center): rental line with
 * populated product document, not sell, not in active return flow.
 */
export function lineEligibleForRentalHub(line) {
  const rr = String(line?.returnRequest?.status || '');
  if (rr === 'requested' || rr === 'review_submitted') return false;
  const lineType = String(line?.productType || '').toLowerCase();
  if (lineType === 'sell') return false;
  const p = line?.product;
  if (!p || typeof p === 'string') return false;
  if (String(p?.type || '').toLowerCase() === 'sell') return false;
  return true;
}

/** First rental line that would appear under /my-rentals, or null. */
export function firstMyRentalsEligibleLine(order) {
  if (!order || orderIsPurchase(order)) return null;
  if (normalizeStatus(order.status) !== 'delivered') return null;
  for (const line of order.products || []) {
    if (!lineEligibleForRentalHub(line)) continue;
    return { line, product: line.product };
  }
  return null;
}

/**
 * Active lease lines shown in customer payment flows:
 * delivered rental lines with time left on tenure. Excludes buy/sell lines.
 */
export function flattenActiveLeaseRows(orders) {
  const rows = [];
  const today = startOfDay(new Date());
  for (const order of orders) {
    const st = normalizeStatus(order.status);
    if (st === 'cancelled' || st === 'completed') continue;
    if (st === 'delivered') {
      const start = order.createdAt ? new Date(order.createdAt) : new Date();
      const duration = order.rentalDuration;
      for (const line of order.products || []) {
        if (!lineEligibleForRentalHub(line)) continue;
        const p = line.product;
        const unit = resolveTenureUnit(order, p, duration);
        const end = computeLeaseEnd(start, duration, unit);
        const daysLeft = Math.ceil(
          (startOfDay(end).getTime() - today.getTime()) / 86400000,
        );
        if (daysLeft <= 0) continue;
        rows.push({
          key: `${order._id}-${String(p._id || line.product)}-${rows.length}`,
          order,
          line,
          product: p,
          start,
          end,
          tenureUnit: unit,
          daysLeft,
        });
      }
      continue;
    }
  }
  return rows;
}

/** Per-period rent for one line (monthly or daily rate × qty). */
export function lineUnitRent(line) {
  return Number(line?.pricePerDay || 0) * Number(line?.quantity || 1);
}
