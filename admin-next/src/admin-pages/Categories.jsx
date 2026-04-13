'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Check,
  ChevronDown,
  ChevronRight,
  FolderTree,
  ImageIcon,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { apiGetMasterCategories } from '@/service/api';
import {
  clearCategoryError,
  createCategory,
  createSubCategory,
  deleteCategory,
  deleteSubCategory,
  updateCategory,
  updateSubCategory,
} from '@/redux/slices/categorySlice';

const slugify = (text) =>
  String(text || '')
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

const TABS = [
  { id: 'rentals', label: 'Rentals', platform: 'rent' },
  { id: 'selling', label: 'Selling', platform: 'buy' },
  { id: 'services', label: 'Services', platform: 'services' },
];

function MediaDropZone({
  label,
  hint,
  file,
  onFile,
  requiredMark,
  existingUrl,
  accept = 'image/*',
}) {
  const [preview, setPreview] = useState('');
  useEffect(() => {
    if (!file) {
      setPreview('');
      return undefined;
    }
    const u = URL.createObjectURL(file);
    setPreview(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);

  return (
    <div className="min-w-0">
      <p className="text-sm font-medium text-gray-900 mb-3">
        {label}
        {requiredMark ? (
          <span className="text-orange-500" aria-hidden>
            {' '}
            *
          </span>
        ) : null}
      </p>
      <label className="flex flex-col items-center justify-center min-h-[168px] rounded-xl border border-gray-200 bg-gray-50/80 hover:border-orange-200 hover:bg-orange-50/20 cursor-pointer transition-colors">
        <input
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => onFile(e.target.files?.[0] || null)}
        />
        {file ? (
          <div className="relative p-3 w-full">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                onFile(null);
              }}
              className="absolute top-2 right-2 p-1 rounded-full bg-white shadow border border-gray-200 text-gray-600 hover:text-red-600"
              aria-label="Remove file"
            >
              <X className="w-4 h-4" />
            </button>
            <img
              src={preview}
              alt=""
              className="mx-auto max-h-32 object-contain rounded-lg"
            />
            <p className="text-xs text-center text-gray-600 mt-2 truncate px-2">
              {file.name}
            </p>
          </div>
        ) : existingUrl ? (
          <div className="relative flex flex-col items-center gap-2 py-8 px-4">
            <img
              src={existingUrl}
              alt=""
              className="mx-auto max-h-32 object-contain rounded-lg"
            />
            <span className="text-sm font-medium text-orange-500">
              Click to replace
            </span>
            <span className="text-xs text-gray-400">PNG, JPG, WebP</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-10 px-4">
            <ImageIcon className="w-9 h-9 text-orange-500" strokeWidth={1.75} />
            <span className="text-sm font-medium text-orange-500">
              Select from Media Library
            </span>
            <span className="text-xs text-gray-400">PNG, JPG, WebP</span>
          </div>
        )}
      </label>
      {hint ? <p className="text-xs text-gray-500 mt-2">{hint}</p> : null}
    </div>
  );
}

const Categories = () => {
  const dispatch = useDispatch();
  const { error } = useSelector((s) => s.category);

  const [activeTab, setActiveTab] = useState('rentals');
  const [tree, setTree] = useState([]);
  const [stats, setStats] = useState({
    totalMain: 0,
    totalSubs: 0,
    activeProducts: 0,
  });
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [expanded, setExpanded] = useState(() => new Set());

  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState('');
  const [slugManual, setSlugManual] = useState(false);
  const [slug, setSlug] = useState('');
  const [parentId, setParentId] = useState('');
  const [availableInRent, setAvailableInRent] = useState(true);
  const [availableInBuy, setAvailableInBuy] = useState(false);
  const [availableInServices, setAvailableInServices] = useState(false);
  const [iconFile, setIconFile] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [existingIconUrl, setExistingIconUrl] = useState('');
  const [existingImageUrl, setExistingImageUrl] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editingSubId, setEditingSubId] = useState(null);
  const [operations, setOperations] = useState([
    { commissionRate: 15, otherTax: 15 },
  ]);

  const platformParam = useMemo(
    () => TABS.find((t) => t.id === activeTab)?.platform || 'rent',
    [activeTab],
  );

  const loadTree = useCallback(async () => {
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    if (!token) {
      toast.error('Please login again to continue.');
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await apiGetMasterCategories(token, platformParam);
      const nextTree = res.data?.tree || [];
      setTree(nextTree);
      setStats(
        res.data?.stats || {
          totalMain: 0,
          totalSubs: 0,
          activeProducts: 0,
        },
      );
      setExpanded((prev) => {
        const next = new Set(prev);
        nextTree.forEach((c) => next.add(c._id));
        return next;
      });
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load categories');
      setTree([]);
    } finally {
      setLoading(false);
    }
  }, [platformParam]);

  useEffect(() => {
    loadTree();
  }, [loadTree]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearCategoryError());
    }
  }, [error, dispatch]);

  useEffect(() => {
    if (!slugManual) {
      setSlug(slugify(name));
    }
  }, [name, slugManual]);

  const resetModal = () => {
    setName('');
    setSlug('');
    setSlugManual(false);
    setParentId('');
    setAvailableInRent(true);
    setAvailableInBuy(false);
    setAvailableInServices(false);
    setIconFile(null);
    setImageFile(null);
    setExistingIconUrl('');
    setExistingImageUrl('');
    setEditingCategoryId(null);
    setEditingSubId(null);
    setOperations([{ commissionRate: 15, otherTax: 15 }]);
  };

  const closeModal = () => {
    if (submitting) return;
    setModalOpen(false);
    resetModal();
  };

  const openModal = () => {
    resetModal();
    if (activeTab === 'rentals') setAvailableInRent(true);
    if (activeTab === 'selling') setAvailableInBuy(true);
    if (activeTab === 'services') setAvailableInServices(true);
    setModalOpen(true);
  };

  const mapOperationsFromDoc = (doc) => {
    const ops = doc?.operations;
    if (Array.isArray(ops) && ops.length) {
      return ops.map((o) => ({
        commissionRate: o.commissionRate ?? 0,
        otherTax: o.otherTax ?? 0,
      }));
    }
    return [
      {
        commissionRate: doc?.commissionRate ?? 15,
        otherTax: doc?.otherTax ?? 15,
      },
    ];
  };

  const openEditCategory = (cat) => {
    resetModal();
    setEditingCategoryId(cat._id);
    setName(cat.name || '');
    setSlug(cat.slug || slugify(cat.name));
    setSlugManual(true);
    setAvailableInRent(cat.availableInRent !== false);
    setAvailableInBuy(!!cat.availableInBuy);
    setAvailableInServices(!!cat.availableInServices);
    setOperations(mapOperationsFromDoc(cat));
    setExistingIconUrl(cat.icon || '');
    setExistingImageUrl(cat.image || '');
    setModalOpen(true);
  };

  const openEditSub = (sub, parentCat) => {
    resetModal();
    setEditingSubId(sub._id);
    setParentId(parentCat._id);
    setName(sub.name || '');
    setSlug(sub.slug || slugify(sub.name));
    setSlugManual(true);
    setAvailableInRent(sub.availableInRent !== false);
    setAvailableInBuy(!!sub.availableInBuy);
    setAvailableInServices(!!sub.availableInServices);
    setOperations(mapOperationsFromDoc(sub));
    setExistingIconUrl(sub.icon || '');
    setExistingImageUrl(sub.image || '');
    setModalOpen(true);
  };

  const parentOptions = useMemo(
    () => tree.map((c) => ({ id: c._id, name: c.name })),
    [tree],
  );

  const toggleExpand = (id) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const displaySlug = (s) => {
    const raw = String(s || '').trim();
    if (!raw) return '—';
    return raw.startsWith('/') ? raw : `/${raw}`;
  };

  const buildFormData = (isSub) => {
    const fd = new FormData();
    fd.append('name', name.trim());
    fd.append('slug', slug.trim() || slugify(name));
    fd.append('availableInRent', String(availableInRent));
    fd.append('availableInBuy', String(availableInBuy));
    fd.append('availableInServices', String(availableInServices));
    const first = operations[0] || { commissionRate: 0, otherTax: 0 };
    fd.append('commissionRate', String(first.commissionRate ?? 0));
    fd.append('otherTax', String(first.otherTax ?? 0));
    fd.append('operations', JSON.stringify(operations));
    if (isSub) fd.append('categoryId', parentId);
    if (iconFile) fd.append('icon', iconFile);
    if (imageFile) fd.append('image', imageFile);
    return fd;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Enter a category name');
      return;
    }
    const isSub = Boolean(parentId);
    const isEdit = Boolean(editingCategoryId || editingSubId);
    const hasAsset = Boolean(
      iconFile ||
        imageFile ||
        (isEdit && (existingIconUrl || existingImageUrl)),
    );
    if (!hasAsset) {
      toast.error(
        isSub
          ? 'Add a category image or icon for the sub-category'
          : 'Add a category image or icon',
      );
      return;
    }

    setSubmitting(true);
    const fd = buildFormData(isSub);
    let result;
    if (isEdit && editingSubId) {
      result = await dispatch(updateSubCategory({ id: editingSubId, data: fd }));
    } else if (isEdit && editingCategoryId) {
      result = await dispatch(
        updateCategory({ id: editingCategoryId, data: fd }),
      );
    } else {
      result = await dispatch(
        isSub ? createSubCategory(fd) : createCategory(fd),
      );
    }
    setSubmitting(false);

    if (
      createCategory.rejected.match(result) ||
      createSubCategory.rejected.match(result) ||
      updateCategory.rejected.match(result) ||
      updateSubCategory.rejected.match(result)
    ) {
      toast.error(
        typeof result.payload === 'string'
          ? result.payload
          : 'Something went wrong',
      );
      return;
    }

    const ok =
      createCategory.fulfilled.match(result) ||
      createSubCategory.fulfilled.match(result) ||
      updateCategory.fulfilled.match(result) ||
      updateSubCategory.fulfilled.match(result);
    if (ok) {
      const pu = Number(result.payload?.productsUpdated) || 0;
      const clu = Number(result.payload?.customListingsUpdated) || 0;
      if (isEdit && (pu > 0 || clu > 0)) {
        const parts = [];
        if (pu > 0) {
          parts.push(`${pu} product listing${pu === 1 ? '' : 's'}`);
        }
        if (clu > 0) {
          parts.push(`${clu} custom listing row${clu === 1 ? '' : 's'}`);
        }
        toast.success(
          `Saved. Updated ${parts.join(' and ')} to match new names.`,
        );
      } else {
        toast.success(
          isEdit
            ? isSub
              ? 'Sub-category updated'
              : 'Category updated'
            : isSub
              ? 'Sub-category created'
              : 'Category created',
        );
      }
      closeModal();
      loadTree();
    }
  };

  const addOperationRow = () => {
    setOperations((prev) => [...prev, { commissionRate: 15, otherTax: 15 }]);
  };

  const updateOperation = (index, field, value) => {
    setOperations((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        [field]: value === '' ? '' : Number(value),
      };
      return next;
    });
  };

  const handleDeleteCategory = async (cat) => {
    const subCount = (cat.subCategories || []).length;
    const subPhrase =
      subCount === 0
        ? ''
        : subCount === 1
          ? ' and its sub-category'
          : ` and ${subCount} sub-categories`;
    const ok = window.confirm(
      `Delete "${cat.name}"${subPhrase}? All products whose main category matches this name will be permanently removed from the database, along with any vendor offers on those products.`,
    );
    if (!ok) return;
    setDeleting(true);
    const result = await dispatch(deleteCategory(cat._id));
    setDeleting(false);
    if (deleteCategory.fulfilled.match(result)) {
      const { deletedProducts = 0, deletedOffers = 0 } = result.payload;
      const parts = [`${deletedProducts} product(s) removed`];
      if (deletedOffers) parts.push(`${deletedOffers} offer(s) removed`);
      toast.success(parts.join(', '));
      loadTree();
    }
  };

  const handleDeleteSubCategory = async (sub, parentName) => {
    const ok = window.confirm(
      `Delete sub-category "${sub.name}" under "${parentName}"? All products using this sub-category will be permanently removed, along with vendor offers on those products.`,
    );
    if (!ok) return;
    setDeleting(true);
    const result = await dispatch(deleteSubCategory(sub._id));
    setDeleting(false);
    if (deleteSubCategory.fulfilled.match(result)) {
      const { deletedProducts = 0, deletedOffers = 0 } = result.payload;
      const parts = [`${deletedProducts} product(s) removed`];
      if (deletedOffers) parts.push(`${deletedOffers} offer(s) removed`);
      toast.success(parts.join(', '));
      loadTree();
    }
  };

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,0.06)] sm:rounded-3xl sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#00B050] text-white shadow-sm"
              aria-hidden
            >
              <FolderTree className="h-6 w-6" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-[26px]">
                Master Categories
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Organize product hierarchy and manage category settings
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={openModal}
            className="inline-flex w-full shrink-0 items-center justify-center rounded-xl bg-[#F26522] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#dc5a1f] sm:w-auto"
          >
            + Add New Category
          </button>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            {
              title: 'Total Categories',
              value: stats.totalMain,
              sub: 'Main',
              wrap: 'border-sky-100 bg-sky-50/90',
              valueClass: 'text-gray-900',
            },
            {
              title: 'Total Sub-Categories',
              value: stats.totalSubs,
              sub: 'Niche',
              wrap: 'border-fuchsia-100 bg-fuchsia-50/70',
              valueClass: 'text-gray-900',
            },
            {
              title: 'Active Products',
              value: stats.activeProducts,
              sub: 'Listed',
              wrap: 'border-emerald-100 bg-emerald-50/90',
              valueClass: 'text-emerald-700',
            },
          ].map((card) => (
            <div
              key={card.title}
              className={`rounded-2xl border p-5 ${card.wrap}`}
            >
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                {card.title}
              </p>
              <p
                className={`mt-2 text-3xl font-bold tabular-nums ${card.valueClass}`}
              >
                {Number(card.value).toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-gray-500">({card.sub})</p>
            </div>
          ))}
        </div>

        <nav
          className="mt-8 flex gap-1 rounded-xl bg-gray-100 p-1.5"
          aria-label="Platform"
        >
          {TABS.map((t) => {
            const selected = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`min-h-[40px] flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                  selected
                    ? 'bg-white font-semibold text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">
            Category Hierarchy
          </h2>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : tree.length === 0 ? (
          <p className="py-12 text-center text-sm text-gray-500">
            No categories for this platform yet. Add one to get started.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {tree.map((cat) => {
              const hasChildren = (cat.subCategories || []).length > 0;
              const isOpen = expanded.has(cat._id);
              return (
                <li key={cat._id} className="bg-white">
                  <div className="flex items-center gap-2 px-4 py-3">
                    {hasChildren ? (
                      <button
                        type="button"
                        onClick={() => toggleExpand(cat._id)}
                        className="p-1 rounded text-gray-500 hover:bg-gray-100"
                        aria-expanded={isOpen}
                      >
                        {isOpen ? (
                          <ChevronDown className="w-5 h-5" />
                        ) : (
                          <ChevronRight className="w-5 h-5" />
                        )}
                      </button>
                    ) : (
                      <span className="w-7" />
                    )}
                    <span className="font-medium text-gray-900">
                      {cat.name}
                    </span>
                    <span className="text-sm text-gray-500">
                      {displaySlug(cat.slug)}
                    </span>
                    <div className="ml-auto flex items-center gap-1 shrink-0">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                        Product
                      </span>
                      <button
                        type="button"
                        disabled={deleting || submitting}
                        onClick={() => openEditCategory(cat)}
                        className="p-2 rounded-lg text-gray-400 hover:text-orange-600 hover:bg-orange-50 disabled:opacity-40"
                        title="Edit category"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        disabled={deleting}
                        onClick={() => handleDeleteCategory(cat)}
                        className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-40"
                        title="Delete category and related products"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {hasChildren && isOpen && (
                    <ul className="border-t border-gray-50 bg-gray-50/80">
                      {(cat.subCategories || []).map((sub) => (
                        <li
                          key={sub._id}
                          className="flex items-center gap-2 pl-14 pr-4 py-2.5 text-sm border-t border-gray-100/80"
                        >
                          <span className="font-medium text-gray-800">
                            {sub.name}
                          </span>
                          <span className="text-gray-500">
                            {displaySlug(sub.slug || slugify(sub.name))}
                          </span>
                          <div className="ml-auto flex items-center gap-1 shrink-0">
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                              Product
                            </span>
                            <button
                              type="button"
                              disabled={deleting || submitting}
                              onClick={() => openEditSub(sub, cat)}
                              className="p-2 rounded-lg text-gray-400 hover:text-orange-600 hover:bg-orange-50 disabled:opacity-40"
                              title="Edit sub-category"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              disabled={deleting}
                              onClick={() =>
                                handleDeleteSubCategory(sub, cat.name)
                              }
                              className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-40"
                              title="Delete sub-category and related products"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40">
          <div
            className="absolute inset-0"
            role="presentation"
            onClick={() => !submitting && closeModal()}
          />
          <form
            onSubmit={handleSubmit}
            className="relative flex w-full max-w-4xl flex-col max-h-[min(90vh,880px)] overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-gray-200"
          >
            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-gray-100 px-8 py-5">
              <div className="min-w-0 pr-2">
                <h3 className="text-xl font-semibold tracking-tight text-gray-900">
                  {editingSubId
                    ? 'Edit Sub-category'
                    : editingCategoryId
                      ? 'Edit Category'
                      : 'Add New Category'}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Configure category details, assets, and operational rules
                </p>
              </div>
              <button
                type="button"
                disabled={submitting}
                onClick={closeModal}
                className="shrink-0 rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain">
              <div className="space-y-8 px-8 py-6">
                <section>
                  <h4 className="mb-5 text-base font-semibold text-gray-900">
                    Basic Information
                  </h4>
                  <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                    <div className="lg:col-span-2">
                      <label className="mb-1.5 block text-sm font-medium text-gray-800">
                        {editingSubId ? 'Sub-category' : 'Category'}
                      </label>
                      <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g., Electronics"
                        className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none transition-shadow focus:border-orange-500 focus:ring-2 focus:ring-orange-500/25"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-800">
                        Parent Category
                      </label>
                      <select
                        value={parentId}
                        onChange={(e) => setParentId(e.target.value)}
                        disabled={Boolean(editingCategoryId)}
                        className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none transition-shadow focus:border-orange-500 focus:ring-2 focus:ring-orange-500/25 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500"
                      >
                        <option value="">None (top-level category)</option>
                        {parentOptions.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-800">
                        Slug (Auto-generated)
                      </label>
                      <input
                        value={slug}
                        onChange={(e) => {
                          setSlugManual(true);
                          setSlug(e.target.value);
                        }}
                        placeholder="auto-generated-slug"
                        className="w-full rounded-xl border border-gray-200 bg-gray-50/80 px-3.5 py-2.5 text-sm outline-none transition-shadow focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/25"
                      />
                      <p className="mt-1.5 text-xs text-gray-500">
                        URL:{' '}
                        <span className="font-medium text-gray-700">
                          {displaySlug(slug)}
                        </span>
                      </p>
                    </div>
                    <div className="lg:col-span-2">
                      <p className="mb-2 text-sm font-medium text-gray-800">
                        Platform Assignment
                        <span className="text-orange-500" aria-hidden>
                          {' '}
                          *
                        </span>
                      </p>
                      <div className="flex flex-wrap gap-2.5">
                        {[
                          [
                            'Rent',
                            availableInRent,
                            () => setAvailableInRent((v) => !v),
                          ],
                          [
                            'Buy',
                            availableInBuy,
                            () => setAvailableInBuy((v) => !v),
                          ],
                          [
                            'Services',
                            availableInServices,
                            () => setAvailableInServices((v) => !v),
                          ],
                        ].map(([label, on, toggle]) => (
                          <button
                            key={label}
                            type="button"
                            onClick={toggle}
                            className={`rounded-full border px-4 py-2 text-xs font-medium transition-colors ${
                              on
                                ? 'border-orange-200 bg-orange-50 text-orange-800'
                                : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300'
                            }`}
                          >
                            Available in {label}
                          </button>
                        ))}
                      </div>
                      <p className="mt-2 text-xs text-gray-500">
                        Select where this category will be visible on the
                        platform
                      </p>
                    </div>
                  </div>
                </section>

                <section>
                  <h4 className="mb-5 text-base font-semibold text-gray-900">
                    Asset Selection
                  </h4>
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <MediaDropZone
                      label="Category Icon (1:1)"
                      hint="512x512px recommended for app grids"
                      requiredMark={!editingCategoryId && !editingSubId}
                      existingUrl={
                        iconFile ? undefined : existingIconUrl || undefined
                      }
                      file={iconFile}
                      onFile={setIconFile}
                    />
                    <MediaDropZone
                      label="Category Image (1:1)"
                      hint="512x512px recommended for app grids"
                      requiredMark={!editingCategoryId && !editingSubId}
                      existingUrl={
                        imageFile ? undefined : existingImageUrl || undefined
                      }
                      file={imageFile}
                      onFile={setImageFile}
                    />
                  </div>
                </section>

                <section className="pb-1">
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h4 className="text-base font-semibold text-gray-900">
                      Operational Rules
                    </h4>
                    <button
                      type="button"
                      onClick={addOperationRow}
                      className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-orange-600"
                    >
                      <Plus className="h-4 w-4" strokeWidth={2.5} />
                      Add New Operations
                    </button>
                  </div>
                  <div className="space-y-4">
                    {operations.map((row, i) => (
                      <div
                        key={i}
                        className="grid grid-cols-1 gap-5 rounded-xl border border-gray-100 bg-gray-50/80 p-4 sm:grid-cols-2"
                      >
                        <div>
                          <label className="mb-1.5 block text-sm font-medium text-gray-800">
                            Commission Rate
                            <span className="text-orange-500" aria-hidden>
                              {' '}
                              *
                            </span>
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              min={0}
                              value={row.commissionRate}
                              onChange={(e) =>
                                updateOperation(
                                  i,
                                  'commissionRate',
                                  e.target.value,
                                )
                              }
                              className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-3.5 pr-9 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/25"
                            />
                            <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                              %
                            </span>
                          </div>
                          <p className="mt-1.5 text-xs text-gray-500">
                            Platform&apos;s percentage share for this category
                          </p>
                        </div>
                        <div>
                          <label className="mb-1.5 block text-sm font-medium text-gray-800">
                            Other Tax
                            <span className="text-orange-500" aria-hidden>
                              {' '}
                              *
                            </span>
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              min={0}
                              value={row.otherTax}
                              onChange={(e) =>
                                updateOperation(i, 'otherTax', e.target.value)
                              }
                              className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-3.5 pr-9 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/25"
                            />
                            <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                              %
                            </span>
                          </div>
                          <p className="mt-1.5 text-xs text-gray-500">
                            Platform&apos;s percentage share for this category
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>

            <div className="flex shrink-0 items-center justify-between gap-3 border-t border-gray-100 bg-white px-8 py-4">
              <button
                type="button"
                disabled={submitting}
                onClick={closeModal}
                className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-800 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-orange-600 disabled:opacity-60"
              >
                {submitting ? (
                  'Saving…'
                ) : editingCategoryId || editingSubId ? (
                  <>
                    <Check className="h-4 w-4" strokeWidth={2.5} />
                    Save changes
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" strokeWidth={2.5} />
                    Create Category &amp; Sync
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Categories;
