/**
 * Mirrors website `RentalCommandCenter.flattenRentals` so admin "Active Rentals"
 * lists the same delivered rental lines as `/my-rentals`.
 */

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function normalizeOrderStatus(status) {
  return String(status || '').toLowerCase();
}

function tenureIsDays(product, rentalDuration) {
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

/**
 * @param {import('mongoose').Document[]|object[]} orders populated `products.product`
 * @returns {object[]}
 */
export function buildMyRentalsStyleActiveRows(orders) {
  const today = startOfDay(new Date());
  const rows = [];

  for (const order of orders) {
    const st = normalizeOrderStatus(order.status);
    if (st === 'cancelled' || st === 'completed') continue;
    if (st !== 'delivered') continue;

    const start = order.createdAt ? new Date(order.createdAt) : new Date();
    const duration = Math.max(1, Number(order.rentalDuration || 1));

    for (const line of order.products || []) {
      if (!lineEligibleForRentalHub(line)) continue;
      const p = line.product;
      const unit = resolveTenureUnit(order, p, duration);
      const end = computeLeaseEnd(start, duration, unit);

      const qty = Math.max(1, Number(line.quantity || 1));
      const rate = Number(line.pricePerDay || 0);
      const monthlyAmount = rate * qty;
      const lineTotalRent = monthlyAmount * duration;

      const depLine = Number(line.refundableDeposit);
      const deposit =
        Number.isFinite(depLine) && depLine > 0
          ? depLine
          : Math.max(0, Number(p?.refundableDeposit || 0)) * qty;

      const totalMs = end.getTime() - start.getTime();
      const elapsedMs = Math.min(
        Math.max(today.getTime() - startOfDay(start).getTime(), 0),
        totalMs,
      );
      const progressPct =
        totalMs <= 0 ? 100 : Math.min(100, (elapsedMs / totalMs) * 100);

      const remainingDays = Math.ceil(
        (startOfDay(end).getTime() - today.getTime()) / 86400000,
      );

      const careTax = Math.max(1, Math.round(lineTotalRent * 0.02));

      rows.push({
        orderId: order._id,
        productName: p?.productName || 'Product',
        productImage: p?.image || '',
        category: p?.category || '',
        startDate: start,
        endDate: end,
        tenureUnit: unit,
        duration,
        monthlyAmount,
        lineTotalRent,
        deposit,
        careTax,
        progressPct,
        remainingDays,
        productId: p?._id,
      });
    }
  }

  return rows;
}
