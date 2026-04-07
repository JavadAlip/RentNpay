'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import {
  AlertTriangle,
  CircleX,
  Download,
  Eye,
  Filter,
  MoreVertical,
  Package,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
} from 'lucide-react';
import AdminProductAddModal from '@/Admin/Components/Modals/AdminProductAddModal';
import {
  clearListingTemplateError,
  createListingTemplate,
  deleteListingTemplate,
  fetchListingTemplates,
  toggleListingTemplateActive,
  updateListingTemplate,
} from '@/redux/slices/listingTemplateSlice';

function buildListingFormData(form) {
  const variants = form.variants || [];
  const sumStock = variants.reduce((acc, v) => acc + (Number(v.stock) || 0), 0);
  const summaryPrice =
    variants
      .map((v) => String(v?.price ?? '').trim())
      .find((p) => p.length > 0) ||
    String(form.salesConfiguration?.salePrice ?? '').trim() ||
    String(form.price ?? '').trim() ||
    '0';
  const autoStatus =
    sumStock === 0 ? 'Out of Stock' : sumStock <= 5 ? 'Low Stock' : 'Active';

  const payload = new FormData();
  payload.append('flexibleVariants', 'true');
  payload.append('sku', form.sku || '');
  payload.append('productName', form.productName);
  payload.append('type', form.type || 'Rental');
  payload.append('category', form.category);
  payload.append('subCategory', form.subCategory);
  payload.append('brand', form.brand || '');
  payload.append('condition', form.condition || 'Good');
  payload.append('shortDescription', '');
  payload.append('description', form.description || '');
  payload.append('productCustomSpecs', JSON.stringify([]));
  payload.append('specifications', JSON.stringify({}));

  const variantsPayload = variants.map((v) => ({
    variantName: v.variantName,
    price: v.price || '',
    stock: Number(v.stock) || 0,
    existingVariantImages: v.existingVariantImages || [],
    variantSpecs: (v.specRows || []).filter((r) => r.label || r.value),
    rentalPricingModel: v.rentalPricingModel === 'day' ? 'day' : 'month',
    allowVendorEditRentalPrices: v.allowVendorEditRentalPrices !== false,
    rentalConfigurations: (v.rentalConfigurations || []).map((cfg) => {
      const unit = cfg.periodUnit === 'day' ? 'day' : 'month';
      const cust = Number(cfg.customerRent) || 0;
      const derivedPricePerDay =
        unit === 'day'
          ? cust
          : cust > 0
            ? Math.round((cust / 30) * 100) / 100
            : Number(cfg.pricePerDay) || 0;
      return {
        months: Number(cfg.months) || 0,
        days: Number(cfg.days) || 0,
        periodUnit: unit,
        label: cfg.label || '',
        tierLabel: cfg.tierLabel || '',
        pricePerDay: derivedPricePerDay,
        customerRent: Number(cfg.customerRent) || 0,
        customerShipping: Number(cfg.customerShipping) || 0,
        vendorRent: Number(cfg.vendorRent) || 0,
        vendorShipping: Number(cfg.vendorShipping) || 0,
      };
    }),
    refundableDeposit: Number(v.refundableDeposit) || 0,
  }));
  payload.append('variants', JSON.stringify(variantsPayload));

  payload.append('rentalConfigurations', JSON.stringify([]));
  payload.append('refundableDeposit', '0');
  payload.append(
    'salesConfiguration',
    JSON.stringify(form.salesConfiguration || {}),
  );

  payload.append('price', summaryPrice);
  payload.append('stock', String(sumStock));

  payload.append(
    'logisticsVerification',
    JSON.stringify(form.logisticsVerification || {}),
  );
  payload.append('existingImages', JSON.stringify(form.existingImages || []));
  payload.append('status', autoStatus);
  payload.append('isActive', String(form.isActive !== false));
  if (Array.isArray(form.images) && form.images.length) {
    form.images.slice(0, 5).forEach((img) => payload.append('images', img));
  }
  variants.forEach((v, i) => {
    (v.images || []).slice(0, 5).forEach((file) => {
      payload.append(`variantImages_${i}`, file);
    });
  });
  return payload;
}

/** All rental tiers on template (product-level + each variant). */
function collectAllRentalTiers(listing) {
  const out = [];
  const push = (configs) => {
    if (!Array.isArray(configs)) return;
    for (const c of configs) {
      if (c && typeof c === 'object') out.push(c);
    }
  };
  push(listing?.rentalConfigurations);
  for (const v of listing?.variants || []) {
    push(v?.rentalConfigurations);
  }
  return out;
}

/** Prefer vendor rent; then stored per-tier rate; last legacy fallback to customer rent. */
function tierVendorDisplayAmount(cfg) {
  const n = (k) => {
    const v = Number(cfg?.[k]);
    return Number.isFinite(v) && v > 0 ? v : 0;
  };
  return n('vendorRent') || n('pricePerDay') || n('customerRent');
}

function pickMonthTier(tiers) {
  const monthTiers = tiers.filter((c) => {
    const unit = c?.periodUnit === 'day' ? 'day' : 'month';
    return unit === 'month' && Number(c?.months) > 0;
  });
  if (!monthTiers.length) return null;
  const exact3 = monthTiers.find((c) => Number(c.months) === 3);
  if (exact3) return exact3;
  return [...monthTiers].sort(
    (a, b) => Number(a.months) - Number(b.months),
  )[0];
}

function pickDayTier(tiers) {
  const dayTiers = tiers.filter(
    (c) => c?.periodUnit === 'day' && Number(c?.days) > 0,
  );
  if (!dayTiers.length) return null;
  const exact3 = dayTiers.find((c) => Number(c.days) === 3);
  if (exact3) return exact3;
  return [...dayTiers].sort((a, b) => Number(a.days) - Number(b.days))[0];
}

/**
 * Table subtitle: vendor rent only. If both day + month tiers exist → month wins.
 * Formats: ₹X/3month, ₹X/6month, ₹X/3day, etc.
 */
function formatListingTablePriceLine(listing) {
  const tiers = collectAllRentalTiers(listing);
  const hasMonth = tiers.some((c) => {
    const unit = c?.periodUnit === 'day' ? 'day' : 'month';
    return unit === 'month' && Number(c?.months) > 0;
  });
  const hasDay = tiers.some(
    (c) => c?.periodUnit === 'day' && Number(c?.days) > 0,
  );

  let chosen = null;
  let kind = null;
  if (hasMonth && hasDay) {
    chosen = pickMonthTier(tiers);
    kind = 'month';
  } else if (hasMonth) {
    chosen = pickMonthTier(tiers);
    kind = 'month';
  } else if (hasDay) {
    chosen = pickDayTier(tiers);
    kind = 'day';
  }

  if (chosen && kind) {
    const amt = tierVendorDisplayAmount(chosen);
    if (amt > 0) {
      const f = Math.round(amt).toLocaleString('en-IN');
      if (kind === 'month') {
        const m = Number(chosen.months) || 3;
        return m === 3 ? `₹${f}/3month` : `₹${f}/${m}month`;
      }
      const d = Number(chosen.days) || 3;
      return d === 3 ? `₹${f}/3day` : `₹${f}/${d}day`;
    }
  }

  const raw = listing?.price;
  if (raw != null && String(raw).trim() !== '' && String(raw).trim() !== '0') {
    return String(raw).trim();
  }
  return null;
}

function listingGalleryUrls(listing) {
  const fromArr = Array.isArray(listing?.images)
    ? listing.images.filter(Boolean)
    : [];
  if (fromArr.length) return fromArr;
  if (listing?.image) return [listing.image];
  return [];
}

function specificationsEntries(specifications) {
  if (!specifications || typeof specifications !== 'object') return [];
  return Object.entries(specifications).filter(
    ([, v]) => v != null && String(v).trim() !== '',
  );
}

function DetailRow({ label, children }) {
  const empty =
    children === null ||
    children === undefined ||
    (typeof children === 'string' && !children.trim());
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-3 py-2.5 border-b border-gray-100 last:border-0">
      <dt className="text-xs font-medium text-gray-500 shrink-0">{label}</dt>
      <dd className="sm:col-span-2 text-sm text-gray-900 break-words">
        {empty ? <span className="text-gray-400">—</span> : children}
      </dd>
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <h4 className="text-sm font-semibold text-gray-900 mt-6 first:mt-0 mb-2">
      {children}
    </h4>
  );
}

function ListingDetailsModal({ listing, onClose }) {
  useEffect(() => {
    if (!listing) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [listing, onClose]);

  if (!listing) return null;

  const gallery = listingGalleryUrls(listing);
  const specPairs = specificationsEntries(listing.specifications);
  const customSpecs = Array.isArray(listing.productCustomSpecs)
    ? listing.productCustomSpecs.filter((r) => r?.label || r?.value)
    : [];
  const variants = Array.isArray(listing.variants) ? listing.variants : [];
  const productRental = Array.isArray(listing.rentalConfigurations)
    ? listing.rentalConfigurations
    : [];
  const logistics = listing.logisticsVerification || {};
  const created = listing.createdAt
    ? new Date(listing.createdAt).toLocaleString()
    : null;
  const updated = listing.updatedAt
    ? new Date(listing.updatedAt).toLocaleString()
    : null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-3 md:p-4 bg-black/40"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-3xl max-h-[92vh] flex flex-col rounded-2xl bg-white shadow-xl border border-gray-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="listing-detail-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-gray-100 shrink-0">
          <div className="min-w-0">
            <h3
              id="listing-detail-title"
              className="text-lg font-semibold text-gray-900 truncate"
            >
              {listing.productName}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Full listing template details
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 text-gray-500 hover:text-gray-700 text-xl leading-none p-1"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4 flex-1 min-h-0">
          {gallery.length > 0 ? (
            <div className="flex flex-wrap gap-2 mb-4">
              {gallery.map((src, i) => (
                <a
                  key={i}
                  href={src}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block shrink-0"
                >
                  <img
                    src={src}
                    alt=""
                    className="h-24 w-24 rounded-xl object-cover border border-gray-100"
                  />
                </a>
              ))}
            </div>
          ) : null}

          <SectionTitle>Overview</SectionTitle>
          <dl>
            {/* <DetailRow label="SKU">{listing.sku}</DetailRow> */}
            <DetailRow label="Type">{listing.type}</DetailRow>
            <DetailRow label="Category">{listing.category}</DetailRow>
            <DetailRow label="Sub-category">{listing.subCategory}</DetailRow>
            <DetailRow label="Brand">{listing.brand}</DetailRow>
            <DetailRow label="Condition">{listing.condition}</DetailRow>
            {/* <DetailRow label="Summary price">{listing.price}</DetailRow> */}
            {/* <DetailRow label="Total stock">{String(listing.stock ?? '')}</DetailRow> */}
            <DetailRow label="Status">{listing.status}</DetailRow>
            <DetailRow label="Active">
              {listing.isActive !== false ? 'Yes' : 'No'}
            </DetailRow>
          </dl>

          {listing.shortDescription ? (
            <>
              <SectionTitle>Short description</SectionTitle>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {listing.shortDescription}
              </p>
            </>
          ) : null}

          {listing.description ? (
            <>
              <SectionTitle>Description</SectionTitle>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {listing.description}
              </p>
            </>
          ) : null}

          {customSpecs.length > 0 ? (
            <>
              <SectionTitle>Product specifications</SectionTitle>
              <dl className="rounded-xl border border-gray-100 divide-y divide-gray-100">
                {customSpecs.map((row, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-1 sm:grid-cols-3 gap-1 px-3 py-2"
                  >
                    <dt className="text-xs font-medium text-gray-500">
                      {row.label || '—'}
                    </dt>
                    <dd className="sm:col-span-2 text-sm text-gray-900">
                      {row.value || '—'}
                    </dd>
                  </div>
                ))}
              </dl>
            </>
          ) : null}

          {specPairs.length > 0 ? (
            <>
              <SectionTitle>Specifications (legacy)</SectionTitle>
              <dl>
                {specPairs.map(([k, v]) => (
                  <DetailRow key={k} label={k}>
                    {String(v)}
                  </DetailRow>
                ))}
              </dl>
            </>
          ) : null}

          {productRental.length > 0 ? (
            <>
              <SectionTitle>Product rental configuration</SectionTitle>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {productRental.map((cfg, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-gray-100 p-3 bg-gray-50/80"
                  >
                    <p className="text-xs text-gray-500">{cfg.months} months</p>
                    <p className="text-sm font-medium text-gray-900 mt-1">
                      {cfg.label || '—'}
                    </p>
                    <p className="text-sm text-gray-700 mt-1">
                      {cfg.pricePerDay != null
                        ? `${cfg.pricePerDay} / day`
                        : '—'}
                    </p>
                  </div>
                ))}
              </div>
            </>
          ) : null}

          {Number(listing.refundableDeposit) > 0 ? (
            <>
              <SectionTitle>Refundable deposit (product)</SectionTitle>
              <p className="text-sm text-gray-800">
                {listing.refundableDeposit}
              </p>
            </>
          ) : null}

          {variants.length > 0 ? (
            <>
              <SectionTitle>Variants ({variants.length})</SectionTitle>
              <div className="space-y-4">
                {variants.map((v, vi) => {
                  const vImgs = Array.isArray(v.images)
                    ? v.images.filter(Boolean)
                    : [];
                  const vSpecs = Array.isArray(v.variantSpecs)
                    ? v.variantSpecs.filter((r) => r?.label || r?.value)
                    : [];
                  const vRental = Array.isArray(v.rentalConfigurations)
                    ? v.rentalConfigurations
                    : [];
                  return (
                    <div
                      key={vi}
                      className="rounded-xl border border-gray-200 p-4 bg-white shadow-sm"
                    >
                      <p className="text-sm font-semibold text-gray-900">
                        {v.variantName || `Variant ${vi + 1}`}
                      </p>
                      <dl className="mt-2">
                        {(v.color || v.storage || v.ram || v.condition) && (
                          <>
                            <DetailRow label="Color">{v.color}</DetailRow>
                            <DetailRow label="Storage">{v.storage}</DetailRow>
                            <DetailRow label="RAM">{v.ram}</DetailRow>
                            <DetailRow label="Variant condition">
                              {v.condition}
                            </DetailRow>
                          </>
                        )}
                        {Number(v.refundableDeposit) > 0 ? (
                          <DetailRow label="Refundable deposit">
                            {v.refundableDeposit}
                          </DetailRow>
                        ) : null}
                      </dl>
                      {vImgs.length > 0 ? (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {vImgs.map((src, ii) => (
                            <a
                              key={ii}
                              href={src}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <img
                                src={src}
                                alt=""
                                className="h-16 w-16 rounded-lg object-cover border"
                              />
                            </a>
                          ))}
                        </div>
                      ) : null}
                      {vSpecs.length > 0 ? (
                        <div className="mt-3">
                          <p className="text-xs font-medium text-gray-500 mb-1">
                            Variant specs
                          </p>
                          <ul className="text-sm text-gray-800 space-y-1">
                            {vSpecs.map((r, ri) => (
                              <li key={ri}>
                                <span className="font-medium">{r.label}:</span>{' '}
                                {r.value}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                      {vRental.length > 0 ? (
                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {vRental.map((cfg, ci) => (
                            <div
                              key={ci}
                              className="rounded-lg border border-gray-100 p-2 bg-gray-50 text-xs"
                            >
                              <span className="text-gray-500">
                                {cfg.months} mo
                              </span>
                              <div className="text-gray-900 font-medium">
                                {cfg.label || '—'}
                              </div>
                              <div className="text-gray-700">
                                {cfg.pricePerDay != null
                                  ? `${cfg.pricePerDay}/day`
                                  : ''}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </>
          ) : null}

          <SectionTitle>Logistics &amp; verification</SectionTitle>
          <dl>
            <DetailRow label="Inventory owner">
              {logistics.inventoryOwnerName}
            </DetailRow>
            <DetailRow label="City">{logistics.city}</DetailRow>
          </dl>

          {created || updated ? (
            <>
              <SectionTitle>Record</SectionTitle>
              <dl>
                {created ? (
                  <DetailRow label="Created">{created}</DetailRow>
                ) : null}
                {updated ? (
                  <DetailRow label="Updated">{updated}</DetailRow>
                ) : null}
              </dl>
            </>
          ) : null}
        </div>

        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50 shrink-0 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

const CustomListings = () => {
  const dispatch = useDispatch();
  const { items, loading, error } = useSelector((s) => s.listingTemplate);

  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [menuOpenId, setMenuOpenId] = useState(null);

  useEffect(() => {
    dispatch(fetchListingTemplates());
  }, [dispatch]);

  useEffect(() => {
    if (!modalOpen) return;
    dispatch(fetchListingTemplates());
  }, [modalOpen, dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearListingTemplateError());
    }
  }, [error, dispatch]);

  useEffect(() => {
    const close = (e) => {
      if (e.target.closest?.('[data-listing-menu]')) return;
      setMenuOpenId(null);
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return items.filter((t) => {
      if (typeFilter !== 'all' && String(t.type) !== typeFilter) return false;
      if (!term) return true;
      const name = String(t.productName || '').toLowerCase();
      const sku = String(t.sku || '').toLowerCase();
      return name.includes(term) || sku.includes(term);
    });
  }, [items, query, typeFilter]);

  const total = items.length;
  const activeCount = items.filter((t) => t.isActive !== false).length;
  const inactiveCount = total - activeCount;

  const handleCreate = async (form) => {
    const fd = buildListingFormData(form);
    const res = await dispatch(createListingTemplate(fd));
    if (createListingTemplate.fulfilled.match(res)) {
      toast.success('Listing template saved');
      setModalOpen(false);
    }
  };

  const handleUpdate = async (form) => {
    if (!editing?._id) return;
    const fd = buildListingFormData(form);
    const res = await dispatch(
      updateListingTemplate({
        id: editing._id,
        formData: fd,
        listingKind: editing.listingKind,
      }),
    );
    if (updateListingTemplate.fulfilled.match(res)) {
      toast.success('Listing template updated');
      setModalOpen(false);
      setEditing(null);
    }
  };

  const handleToggle = async (row, next) => {
    const res = await dispatch(
      toggleListingTemplateActive({
        id: row._id,
        isActive: next,
        listingKind: row.listingKind,
      }),
    );
    if (!toggleListingTemplateActive.fulfilled.match(res)) {
      dispatch(fetchListingTemplates());
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget?._id) return;
    const res = await dispatch(
      deleteListingTemplate({
        id: deleteTarget._id,
        listingKind: deleteTarget.listingKind,
      }),
    );
    if (deleteListingTemplate.fulfilled.match(res)) {
      toast.success('Listing removed');
    }
    setDeleteTarget(null);
  };

  const exportCsv = useCallback(() => {
    const header = [
      'SKU',
      'Product',
      'Type',
      'Category',
      'SubCategory',
      'Price',
      'Active',
      'Status',
    ];
    const lines = [
      header.join(','),
      ...filtered.map((t) =>
        [
          t.sku || '',
          t.productName,
          t.type,
          t.category,
          t.subCategory,
          t.price,
          t.isActive !== false ? 'Yes' : 'No',
          t.status || '',
        ]
          .map((c) => `"${String(c).replace(/"/g, '""')}"`)
          .join(','),
      ),
    ];
    const blob = new Blob([lines.join('\n')], {
      type: 'text/csv;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `custom-listings-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Export started');
  }, [filtered]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-1 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Package className="w-6 h-6" strokeWidth={1.75} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">
              Custom Listings
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage your custom listing products and templates
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-600">Total products</p>
            <Package className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-3xl font-semibold mt-2 tabular-nums">{total}</p>
        </div>
        <div className="rounded-2xl border border-amber-100 bg-amber-50/80 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-amber-900/80">Active</p>
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-2xl font-semibold mt-2 text-amber-900 tabular-nums">
            {activeCount} items
          </p>
          <button
            type="button"
            className="mt-2 text-xs font-medium text-amber-700 hover:underline"
            onClick={() => {
              setTypeFilter('all');
              setQuery('');
            }}
          >
            View list →
          </button>
        </div>
        <div className="rounded-2xl border border-red-100 bg-red-50/60 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-red-900/80">Inactive</p>
            <CircleX className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-2xl font-semibold mt-2 text-red-900 tabular-nums">
            {inactiveCount} items
          </p>
          <button
            type="button"
            className="mt-2 text-xs font-medium text-red-700 hover:underline"
            onClick={() =>
              toast.info('Filter inactive in the table using the status toggle')
            }
          >
            View list →
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by product name or SKU…"
            className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-orange-500/25 focus:border-orange-400 outline-none"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() =>
              toast.info('Choose Rental or Sell in the filter dropdown')
            }
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 hover:bg-gray-50"
          >
            <Filter className="w-4 h-4" />
            Filter
          </button>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700"
            aria-label="Filter by type"
          >
            <option value="all">All types</option>
            <option value="Rental">Rental</option>
            <option value="Sell">Sell</option>
          </select>
          <button
            type="button"
            onClick={() =>
              toast.info('Bulk update will be available in a future release')
            }
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 hover:bg-gray-50"
          >
            <Upload className="w-4 h-4" />
            Bulk update
          </button>
          <button
            type="button"
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add New Product
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr className="text-left text-gray-600">
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Sub-category</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && !items.length ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-16 text-center text-gray-500"
                  >
                    <div className="inline-flex w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                  </td>
                </tr>
              ) : null}
              {!loading &&
                filtered.map((t) => {
                  const active = t.isActive !== false;
                  const priceLine = formatListingTablePriceLine(t);
                  return (
                    <tr key={t._id} className="hover:bg-gray-50/80">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3 min-w-[200px]">
                          <img
                            src={
                              t.images?.[0] ||
                              t.image ||
                              'https://placehold.co/80x80/e5e7eb/6b7280?text=IMG'
                            }
                            alt=""
                            className="w-11 h-11 rounded-lg object-cover border border-gray-100"
                          />
                          <div>
                            <p className="font-medium text-gray-900">
                              {t.productName}
                            </p>
                            <p className="text-xs text-gray-500 tabular-nums">
                              {priceLine || '—'}
                            </p>
                            {t.sku ? (
                              <p className="text-[11px] text-gray-400">
                                SKU: {t.sku}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{t.type}</td>
                      <td className="px-4 py-3 text-gray-700">{t.category}</td>
                      <td className="px-4 py-3 text-gray-700">
                        {t.subCategory}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={active}
                          onClick={() => handleToggle(t, !active)}
                          className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                            active ? 'bg-emerald-500' : 'bg-red-400'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition ${
                              active ? 'translate-x-5' : 'translate-x-0.5'
                            }`}
                          />
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1 justify-end relative">
                          <button
                            type="button"
                            onClick={() => {
                              setMenuOpenId(null);
                              setViewing(t);
                            }}
                            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
                            title="View details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditing(t);
                              setModalOpen(true);
                            }}
                            className="p-2 rounded-lg text-blue-600 hover:bg-blue-50"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <div className="relative" data-listing-menu>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setMenuOpenId((id) =>
                                  id === t._id ? null : t._id,
                                );
                              }}
                              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"
                              title="More"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                            {menuOpenId === t._id ? (
                              <div className="absolute right-0 mt-1 w-40 rounded-xl border border-gray-200 bg-white shadow-lg z-20 py-1">
                                <button
                                  type="button"
                                  className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                  onClick={() => {
                                    setMenuOpenId(null);
                                    setDeleteTarget(t);
                                  }}
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Delete
                                </button>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              {!loading && filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-gray-500"
                  >
                    No listing templates yet. Click &quot;Add New Product&quot;
                    to create one.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border-t border-gray-100 bg-gray-50/50">
          <p className="text-xs text-gray-500">
            Showing {filtered.length} of {total} products
          </p>
          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 hover:bg-gray-50"
          >
            <Download className="w-4 h-4" />
            Export to CSV
          </button>
        </div>
      </div>

      <AdminProductAddModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSubmit={editing ? handleUpdate : handleCreate}
        mode={editing ? 'edit' : 'create'}
        initialData={editing}
        existingProducts={items}
        enableStandardProductSearch
        standardCatalogLoading={modalOpen && loading && items.length === 0}
        standardCatalogTableOnly
        showSkuField
        allowListingTypeSwitch
        showAdminListingFlags
        flexibleListingForm
        subtitle="Custom specs & per-variant media, specifications, and rental"
        submitCreateLabel="Save listing template"
        submitEditLabel="Update listing template"
      />

      {viewing ? (
        <ListingDetailsModal
          listing={viewing}
          onClose={() => setViewing(null)}
        />
      ) : null}

      {deleteTarget ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl border border-gray-200">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">
                Delete listing template
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Remove{' '}
                <span className="font-medium text-gray-800">
                  {deleteTarget.productName}
                </span>
                ? This does not delete vendor products.
              </p>
            </div>
            <div className="px-5 py-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default CustomListings;
