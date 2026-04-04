/** Shared helpers for rental orders (My Orders, Rental Command Center). */

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

/** Days until next monthly billing before lease end; null if day-tenure or past lease. */
export function daysUntilNextRent(order, product) {
  const st = normalizeStatus(order.status);
  if (st !== 'delivered') return null;
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

export function primaryProduct(order) {
  const line = order.products?.[0];
  const p = line?.product;
  if (!p || typeof p === 'string') return null;
  return p;
}

export function primaryLine(order) {
  return order.products?.[0] || null;
}
