'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ChevronDown, ChevronRight, ImageIcon, Trash2, X } from 'lucide-react';
import { toast } from 'react-toastify';
import { apiGetMasterCategories } from '@/service/api';
import {
  clearCategoryError,
  createCategory,
  createSubCategory,
  deleteCategory,
  deleteSubCategory,
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

function MediaDropZone({ label, hint, file, onFile, accept = 'image/*' }) {
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
    <div>
      <p className="text-sm font-medium text-gray-800 mb-1">{label}</p>
      <p className="text-xs text-gray-500 mb-2">{hint}</p>
      <label className="flex flex-col items-center justify-center min-h-[140px] rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 hover:border-orange-300 cursor-pointer transition-colors">
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
              className="mx-auto max-h-28 object-contain rounded-lg"
            />
            <p className="text-xs text-center text-gray-600 mt-2 truncate px-2">
              {file.name}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-8 text-gray-500">
            <ImageIcon className="w-10 h-10 text-gray-400" />
            <span className="text-sm">Click to upload</span>
            <span className="text-xs text-gray-400">PNG, JPG, WebP</span>
          </div>
        )}
      </label>
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
    setOperations([{ commissionRate: 15, otherTax: 15 }]);
  };

  const openModal = () => {
    resetModal();
    if (activeTab === 'rentals') setAvailableInRent(true);
    if (activeTab === 'selling') setAvailableInBuy(true);
    if (activeTab === 'services') setAvailableInServices(true);
    setModalOpen(true);
  };

  const parentOptions = useMemo(() => tree.map((c) => ({ id: c._id, name: c.name })), [tree]);

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
    if (isSub && !imageFile && !iconFile) {
      toast.error('Add a category image or icon for the sub-category');
      return;
    }
    if (!isSub && !imageFile && !iconFile) {
      toast.error('Add a category image or icon');
      return;
    }

    setSubmitting(true);
    const fd = buildFormData(isSub);
    const result = await dispatch(
      isSub ? createSubCategory(fd) : createCategory(fd),
    );
    setSubmitting(false);

    if (
      createCategory.fulfilled.match(result) ||
      createSubCategory.fulfilled.match(result)
    ) {
      toast.success(isSub ? 'Sub-category created' : 'Category created');
      setModalOpen(false);
      resetModal();
      loadTree();
    }
  };

  const addOperationRow = () => {
    setOperations((prev) => [
      ...prev,
      { commissionRate: 15, otherTax: 15 },
    ]);
  };

  const updateOperation = (index, field, value) => {
    setOperations((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value === '' ? '' : Number(value) };
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
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">
            Master Categories
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Organize product hierarchy and manage category settings.
          </p>
        </div>
        <button
          type="button"
          onClick={openModal}
          className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 shadow-sm"
        >
          + Add New Category
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            title: 'Total Categories',
            value: stats.totalMain,
            sub: 'Main',
            accent: 'bg-orange-50 text-orange-700 border-orange-100',
          },
          {
            title: 'Total Sub-Categories',
            value: stats.totalSubs,
            sub: 'Niche',
            accent: 'bg-emerald-50 text-emerald-700 border-emerald-100',
          },
          {
            title: 'Active Products',
            value: stats.activeProducts,
            sub: 'Listed',
            accent: 'bg-violet-50 text-violet-700 border-violet-100',
          },
        ].map((card) => (
          <div
            key={card.title}
            className={`rounded-2xl border p-5 ${card.accent}`}
          >
            <p className="text-sm font-medium opacity-90">{card.title}</p>
            <p className="text-3xl font-semibold mt-2 tabular-nums">
              {Number(card.value).toLocaleString()}
            </p>
            <p className="text-xs mt-1 opacity-80">{card.sub}</p>
          </div>
        ))}
      </div>

      <div className="border-b border-gray-200">
        <nav className="flex gap-8" aria-label="Platform">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === t.id
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">
            Category Hierarchy
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Expand rows to see sub-categories. Sub-categories are created by
            choosing a parent in the add form.
          </p>
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
                    <span className="font-medium text-gray-900">{cat.name}</span>
                    <span className="text-sm text-gray-500">
                      {displaySlug(cat.slug)}
                    </span>
                    <div className="ml-auto flex items-center gap-1 shrink-0">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                        Product
                      </span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div
            className="absolute inset-0"
            role="presentation"
            onClick={() => !submitting && setModalOpen(false)}
          />
          <form
            onSubmit={handleSubmit}
            className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl border border-gray-200"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
              <h3 className="text-lg font-semibold text-gray-900">
                Add New Category
              </h3>
              <button
                type="button"
                disabled={submitting}
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-6">
              <section>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">
                  Basic information
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Laptop Rental"
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Parent category
                    </label>
                    <select
                      value={parentId}
                      onChange={(e) => setParentId(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 outline-none"
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Slug (auto)
                    </label>
                    <input
                      value={slug}
                      onChange={(e) => {
                        setSlugManual(true);
                        setSlug(e.target.value);
                      }}
                      placeholder="auto from name"
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-gray-50 focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 outline-none"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Platform assignment
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        ['Rent', availableInRent, () => setAvailableInRent((v) => !v)],
                        ['Buy', availableInBuy, () => setAvailableInBuy((v) => !v)],
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
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                            on
                              ? 'bg-orange-50 border-orange-200 text-orange-800'
                              : 'bg-gray-50 border-gray-200 text-gray-600'
                          }`}
                        >
                          Available in {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">
                  Assets
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <MediaDropZone
                    label="Category icon (1:1)"
                    hint="Recommended 512×512"
                    file={iconFile}
                    onFile={setIconFile}
                  />
                  <MediaDropZone
                    label="Category image (1:1)"
                    hint="Recommended 512×512"
                    file={imageFile}
                    onFile={setImageFile}
                  />
                </div>
              </section>

              <section>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">
                  Operational rules
                </h4>
                <div className="space-y-3">
                  {operations.map((row, i) => (
                    <div
                      key={i}
                      className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100"
                    >
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          Commission rate %
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={row.commissionRate}
                          onChange={(e) =>
                            updateOperation(i, 'commissionRate', e.target.value)
                          }
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          Other tax %
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={row.otherTax}
                          onChange={(e) =>
                            updateOperation(i, 'otherTax', e.target.value)
                          }
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                        />
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addOperationRow}
                    className="w-full py-2 rounded-lg border border-dashed border-orange-300 text-sm font-medium text-orange-600 hover:bg-orange-50"
                  >
                    + Add new operations
                  </button>
                </div>
              </section>
            </div>

            <div className="sticky bottom-0 flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
              <button
                type="button"
                disabled={submitting}
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 disabled:opacity-60"
              >
                {submitting ? 'Saving…' : 'Create category & sync'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Categories;
