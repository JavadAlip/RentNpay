/**
 * Storefront rental pricing: read vendor rentalConfigurations so day/month
 * products don’t fall back to ₹0 when `price` is missing or "0".
 */

export function pickProductRentalConfigurations(product) {
  const top = product?.rentalConfigurations;
  if (Array.isArray(top) && top.length) return top;
  const v0 = product?.variants?.[0];
  if (Array.isArray(v0?.rentalConfigurations) && v0.rentalConfigurations.length) {
    return v0.rentalConfigurations;
  }
  return [];
}

export function tierRentAmount(tier) {
  const n = (k) => {
    const v = Number(String(tier?.[k] ?? '').replace(/,/g, ''));
    return Number.isFinite(v) && v > 0 ? v : 0;
  };
  return n('customerRent') || n('pricePerDay') || n('vendorRent') || 0;
}

function parseDigitsPrice(raw) {
  const n = parseInt(String(raw || '').replace(/[^0-9]/g, ''), 10);
  return Number.isFinite(n) ? n : 0;
}

/** ₹ amount shown on cards / lists (integer). */
export function getRentalListingAmount(product) {
  if (!product || String(product.type) !== 'Rental') {
    return parseDigitsPrice(product?.price);
  }
  const configs = pickProductRentalConfigurations(product);
  if (configs.length) {
    const isDay = configs.some((c) => c?.periodUnit === 'day');
    if (isDay) {
      const tier =
        configs.find(
          (c) => c?.periodUnit === 'day' && Number(c?.days) === 3,
        ) || configs.find((c) => c?.periodUnit === 'day');
      if (tier) {
        const amt = tierRentAmount(tier);
        if (amt > 0) return Math.round(amt);
      }
    } else {
      const tier =
        configs.find(
          (c) => c?.periodUnit !== 'day' && Number(c?.months) === 3,
        ) ||
        configs.find(
          (c) =>
            (c?.periodUnit === 'month' || !c?.periodUnit) &&
            Number(c?.months) > 0,
        ) ||
        configs.find((c) => Number(c?.months) > 0);
      if (tier) {
        const amt = tierRentAmount(tier);
        if (amt > 0) return Math.round(amt);
      }
    }
  }
  return parseDigitsPrice(product?.price);
}

/** Suffix after amount on cards, e.g. "/3d" or "/3month" (legacy "/mo"). */
export function getRentalListingSuffix(product) {
  if (!product || String(product.type) !== 'Rental') return '';
  const configs = pickProductRentalConfigurations(product);
  if (!configs.length) return '/mo';
  const isDay = configs.some((c) => c?.periodUnit === 'day');
  if (isDay) {
    const tier =
      configs.find(
        (c) => c?.periodUnit === 'day' && Number(c?.days) === 3,
      ) || configs.find((c) => c?.periodUnit === 'day');
    const d = tier && Number(tier.days) > 0 ? Number(tier.days) : 3;
    return d === 3 ? '/3d' : `/${d}d`;
  }
  const tier =
    configs.find(
      (c) => c?.periodUnit !== 'day' && Number(c?.months) === 3,
    ) ||
    configs.find(
      (c) =>
        (c?.periodUnit === 'month' || !c?.periodUnit) &&
        Number(c?.months) > 0,
    ) ||
    configs.find((c) => Number(c?.months) > 0);
  const m = tier && Number(tier.months) > 0 ? Number(tier.months) : 3;
  return m === 3 ? '/3month' : `/${m}month`;
}

/** For sort / price filters on the products page. */
export function getProductListPriceValue(product) {
  if (!product) return 0;
  if (String(product.type) === 'Rental') {
    return getRentalListingAmount(product);
  }
  return parseDigitsPrice(product.price);
}

/**
 * Compact delivery ETA from `logisticsVerification` (storefront cards / lists).
 * Returns null when missing or invalid — callers may show a short fallback.
 */
export function getProductDeliveryEtaLabel(product) {
  const lv = product?.logisticsVerification || {};
  const n = Number(lv.deliveryTimelineValue);
  const unit = String(lv.deliveryTimelineUnit || 'Days').toLowerCase();
  if (!Number.isFinite(n) || n <= 0) return null;
  if (unit === 'hours') {
    return `${n} hour${n !== 1 ? 's' : ''}`;
  }
  return `${n} day${n !== 1 ? 's' : ''}`;
}
