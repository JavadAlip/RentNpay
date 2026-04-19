'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';
import { toast } from 'react-toastify';
import {
  apiGetAdminVendorDetails,
  apiGetAdminVendorKycReview,
  apiPatchAdminProductListingVisibility,
} from '@/service/api';

const money = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

/** Shown on website: approved + published + both admin and vendor switches on. */
function isProductLiveOnStorefront(p) {
  if (!p || p.isAdminApproved === false) return false;
  if (String(p.submissionStatus || '').trim() !== 'published') return false;
  if (p.adminListingEnabled === false) return false;
  if (p.vendorListingEnabled === false) return false;
  return true;
}
const parsePrice = (raw) => {
  const n = parseInt(String(raw || '').replace(/[^0-9]/g, ''), 10);
  return Number.isFinite(n) ? n : 0;
};

const urlLooksLikePdf = (url) => {
  if (!url) return false;
  const base = String(url).split('?')[0].toLowerCase();
  return base.endsWith('.pdf');
};

/** Build the three admin cards from a VendorKyc-shaped object (matches backend getVendorDetails). */
function buildKycDocumentsFromKyc(kyc) {
  if (!kyc) return null;
  const gstUrl = kyc.businessDetails?.gstCertificate || '';
  const panUrl = kyc.panPhoto || '';
  const stores = kyc.storeManagement?.stores || [];
  const shopUrl =
    stores.find((s) => String(s.shopFrontPhotoUrl || '').trim())
      ?.shopFrontPhotoUrl || '';
  const doc = (docId, title, url) => ({
    id: docId,
    title,
    url: String(url || '').trim(),
    status: String(url || '').trim() ? 'Uploaded' : 'Not Uploaded',
  });
  return [
    doc('gst', 'GST Certificate', gstUrl),
    doc('pan', 'Business PAN', panUrl),
    doc('shop', 'Shop Photo', shopUrl),
  ];
}

function kycDocumentsHaveAnyUrl(docs) {
  return (docs || []).some((d) => String(d?.url || '').trim());
}

function escapeHtmlCell(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function safeExportFileName(name) {
  const base = String(name || 'vendor')
    .replace(/[<>:"/\\|?*]+/g, '_')
    .replace(/\s+/g, '_')
    .slice(0, 80);
  return base || 'vendor';
}

/** Excel opens this HTML as a spreadsheet (no extra npm deps). */
function buildVendorProfileExportHtml(data, kycDocsForExport) {
  const v = data.vendor;
  const summary = data.summary || {};
  const financials = data.financials || {};
  const products = data.products || [];
  const recent = data.recentTransactions || [];
  const loanHistory = data.loanHistory || [];
  const moneyStr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
  const parsePriceInner = (raw) => {
    const n = parseInt(String(raw || '').replace(/[^0-9]/g, ''), 10);
    return Number.isFinite(n) ? n : 0;
  };

  const row = (label, val) =>
    `<tr><td>${escapeHtmlCell(label)}</td><td>${escapeHtmlCell(val)}</td></tr>`;

  const profileRows = [
    row('Vendor code', v.vendorCode),
    row('Business name', v.fullName),
    row('Email', v.emailAddress),
    row('Phone', v.mobileNumber != null ? String(v.mobileNumber) : '-'),
    row('Referral code', v.referralCode != null ? String(v.referralCode) : '-'),
    row('KYC status', v.isVerified ? 'Verified' : 'Pending'),
    row(
      'Member since',
      v.createdAt ? new Date(v.createdAt).toLocaleDateString('en-GB') : '-',
    ),
    row('Exported at', new Date().toLocaleString('en-IN')),
  ];

  const summaryRows = [
    row('Total earnings', moneyStr(summary.totalEarnings)),
    row('Active orders', summary.activeOrders ?? 0),
    row('Active products', summary.activeProducts ?? 0),
    row('Pending settlement', moneyStr(summary.pendingSettlement)),
    row('Total products', summary.totalProducts ?? 0),
  ];

  const financialRows = [
    row('Total earnings', moneyStr(financials.totalEarnings)),
    row('Pending settlements', moneyStr(financials.pendingSettlement)),
    row('Last settlement', moneyStr(financials.lastSettlement)),
  ];

  const kycRows = (kycDocsForExport || [])
    .map(
      (d) =>
        `<tr><td>${escapeHtmlCell(d.title)}</td><td>${escapeHtmlCell(d.status)}</td><td>${escapeHtmlCell(d.url || '')}</td></tr>`,
    )
    .join('');

  const productRows = products
    .map((p) => {
      const price = moneyStr(parsePriceInner(p.price));
      return `<tr><td>${escapeHtmlCell(p.productName)}</td><td>${escapeHtmlCell(p.category)}</td><td>${escapeHtmlCell(price)}</td><td>${escapeHtmlCell(p.stock)}</td><td>${escapeHtmlCell(p.status)}</td></tr>`;
    })
    .join('');

  const txRows = recent
    .map((t) => {
      const date = t.date ? new Date(t.date).toLocaleDateString('en-GB') : '-';
      return `<tr><td>${escapeHtmlCell(date)}</td><td>${escapeHtmlCell(t.description)}</td><td>${escapeHtmlCell(moneyStr(t.amount))}</td></tr>`;
    })
    .join('');

  const loanNote =
    loanHistory.length > 0
      ? `${loanHistory.length} loan record(s) on file.`
      : 'No loan history records.';

  return `<!DOCTYPE html><html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8" /><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Vendor</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head><body>
<table border="1" cellspacing="0" cellpadding="4"><tr><th colspan="2">Vendor profile</th></tr>${profileRows.join('')}</table>
<br/>
<table border="1" cellspacing="0" cellpadding="4"><tr><th colspan="2">Summary</th></tr>${summaryRows.join('')}</table>
<br/>
<table border="1" cellspacing="0" cellpadding="4"><tr><th colspan="2">Financials</th></tr>${financialRows.join('')}</table>
<br/>
<table border="1" cellspacing="0" cellpadding="4"><tr><th colspan="3">KYC documents</th></tr><tr><th>Document</th><th>Status</th><th>URL</th></tr>${kycRows || '<tr><td colspan="3">—</td></tr>'}</table>
<br/>
<table border="1" cellspacing="0" cellpadding="4"><tr><th colspan="5">Products</th></tr><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th></tr>${productRows || '<tr><td colspan="5">No products</td></tr>'}</table>
<br/>
<table border="1" cellspacing="0" cellpadding="4"><tr><th colspan="3">Recent transactions</th></tr><tr><th>Date</th><th>Description</th><th>Amount</th></tr>${txRows || '<tr><td colspan="3">None</td></tr>'}</table>
<br/>
<table border="1" cellspacing="0" cellpadding="4"><tr><th>Loan history</th></tr><tr><td>${escapeHtmlCell(loanNote)}</td></tr></table>
</body></html>`;
}

function downloadVendorProfileExcel(data, kycDocsForExport) {
  const html = buildVendorProfileExportHtml(data, kycDocsForExport);
  const blob = new Blob([`\ufeff${html}`], {
    type: 'application/vnd.ms-excel;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const name = safeExportFileName(
    data.vendor?.fullName || data.vendor?.vendorCode,
  );
  a.href = url;
  a.download = `${name}_profile.xls`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'products', label: 'Listed Products' },
  { id: 'kyc', label: 'KYC Documents' },
  { id: 'financials', label: 'Financials & Settlements' },
  { id: 'loans', label: 'Loan History' },
];

function VerifiedOrangeTick({ className = '' }) {
  return (
    <span
      className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-500 text-white shadow-sm ${className}`}
      title="Verified"
      aria-label="Verified"
    >
      <svg className="h-3.5 w-3.5" viewBox="0 0 12 12" fill="none" aria-hidden>
        <path
          d="M2.5 6L5 8.5L9.5 3.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

function StorefrontHeroIcon() {
  return (
    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-orange-500 shadow-md sm:h-[72px] sm:w-[72px]">
      <svg
        className="h-9 w-9 text-white sm:h-10 sm:w-10"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <path
          d="M4 10V19C4 19.5523 4.44772 20 5 20H9V14H15V20H19C19.5523 20 20 19.5523 20 19V10"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M3 9L5 4H19L21 9"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M3 9H21V10C21 11.6569 19.6569 13 18 13C16.3431 13 15 11.6569 15 10C15 11.6569 13.6569 13 12 13C10.3431 13 9 11.6569 9 10C9 11.6569 7.65685 13 6 13C4.34315 13 3 11.6569 3 10V9Z"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

function stockStatusClass(status) {
  if (status === 'Active')
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (status === 'Low Stock')
    return 'bg-amber-50 text-amber-800 border-amber-200';
  return 'bg-rose-50 text-rose-700 border-rose-200';
}

function loanStatusClass(status) {
  const s = String(status || '').toLowerCase();
  if (s === 'paid') return 'bg-emerald-50 text-emerald-800 border-emerald-200';
  if (s === 'active') return 'bg-sky-50 text-sky-800 border-sky-200';
  return 'bg-amber-50 text-amber-800 border-amber-200';
}

export default function VendorDetails({ vendorId }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  const [kycReviewMeta, setKycReviewMeta] = useState(null);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [kycPreviewUrl, setKycPreviewUrl] = useState(null);
  const [listingToggleId, setListingToggleId] = useState(null);

  useEffect(() => {
    let mounted = true;
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    if (!token) {
      setError('Please login again to continue.');
      setLoading(false);
      return undefined;
    }
    if (!vendorId) {
      setError('Invalid vendor id.');
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    setError('');
    setKycReviewMeta(null);

    (async () => {
      try {
        const res = await apiGetAdminVendorDetails(vendorId, token);
        let payload = res.data || null;
        if (!mounted) return;

        let kycFromReview = null;
        try {
          const kycRes = await apiGetAdminVendorKycReview(vendorId, token);
          kycFromReview = kycRes.data?.kyc || null;
          if (mounted) setKycReviewMeta(kycFromReview);
        } catch {
          if (mounted) setKycReviewMeta(null);
        }

        const fromDetails = payload?.kycDocuments;
        if (!kycDocumentsHaveAnyUrl(fromDetails) && kycFromReview) {
          const built = buildKycDocumentsFromKyc(kycFromReview);
          if (built?.length) {
            payload = { ...payload, kycDocuments: built };
          }
        }

        if (mounted) setData(payload);
      } catch (err) {
        if (!mounted) return;
        setError(
          err.response?.data?.message || 'Failed to load vendor details.',
        );
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [vendorId]);

  const filteredProducts = useMemo(() => {
    const list = data?.products || [];
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter((p) =>
      String(p.productName || '')
        .toLowerCase()
        .includes(q),
    );
  }, [data?.products, search]);

  const kycDocs = useMemo(() => {
    const docs = data?.kycDocuments || [];
    if (docs.length) return docs;
    return [
      { id: 'gst', title: 'GST Certificate', url: '', status: 'Not Uploaded' },
      { id: 'pan', title: 'Business PAN', url: '', status: 'Not Uploaded' },
      { id: 'shop', title: 'Shop Photo', url: '', status: 'Not Uploaded' },
    ];
  }, [data?.kycDocuments]);

  useEffect(() => {
    if (!kycPreviewUrl) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setKycPreviewUrl(null);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [kycPreviewUrl]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl">
        {error}
      </div>
    );
  }

  if (!data?.vendor) {
    return (
      <div className="p-6 text-sm text-gray-600 bg-white border border-gray-200 rounded-xl">
        No vendor details found.
      </div>
    );
  }

  const { vendor, summary, financials, recentTransactions, loanHistory } = data;
  const kycAppStatus = data.kycApplicationStatus;
  const businessAddress = String(data.businessAddress || '').trim();
  const kycApproved = kycAppStatus === 'approved' || vendor.isVerified === true;
  const kycRejected = kycAppStatus === 'rejected';
  const joinedLabel = vendor.createdAt
    ? `Joined ${new Date(vendor.createdAt).toLocaleDateString('en-IN', {
        month: 'short',
        year: 'numeric',
      })}`
    : '';
  const uploadedDateLabel = kycReviewMeta?.submittedAt
    ? new Date(kycReviewMeta.submittedAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : null;
  const activeOrders = summary?.activeOrders ?? summary?.activeProducts ?? 0;

  const show = (id) => activeTab === 'overview' || activeTab === id;

  const downloadAllKyc = () => {
    const urls = kycDocs.map((d) => String(d.url || '').trim()).filter(Boolean);
    if (!urls.length) {
      toast.info('No uploaded documents to download.');
      return;
    }
    urls.forEach((u) => window.open(u, '_blank', 'noopener,noreferrer'));
  };

  const handleAdminListingToggle = async (p) => {
    if (!p?._id) return;
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    if (!token) {
      toast.error('Please log in again.');
      return;
    }
    if (p.isAdminApproved === false) {
      toast.error('Approve this product before it can appear on the website.');
      return;
    }
    if (String(p.submissionStatus || '').trim() !== 'published') {
      toast.info('Only published listings can be shown on the storefront.');
      return;
    }
    const adminOn = p.adminListingEnabled !== false;
    const vendorOn = p.vendorListingEnabled !== false;
    const live = adminOn && vendorOn;
    let nextAdmin = adminOn;
    if (live) nextAdmin = false;
    else if (!adminOn) nextAdmin = true;
    else {
      toast.info(
        'The vendor has turned off this listing on their side. They need to enable it again before it can go live.',
      );
      return;
    }

    setListingToggleId(String(p._id));
    try {
      await apiPatchAdminProductListingVisibility(
        p._id,
        { adminListingEnabled: nextAdmin },
        token,
      );
      setData((prev) => {
        if (!prev?.products) return prev;
        return {
          ...prev,
          products: prev.products.map((x) =>
            String(x._id) === String(p._id)
              ? { ...x, adminListingEnabled: nextAdmin }
              : x,
          ),
        };
      });
      toast.success(
        nextAdmin
          ? 'Admin storefront visibility enabled.'
          : 'Listing hidden from the public website.',
      );
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update listing.');
    } finally {
      setListingToggleId(null);
    }
  };

  const statsRow = (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <div className="flex gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
          <span className="text-lg font-semibold">₹</span>
        </div>
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
            Total earnings
          </p>
          <p className="mt-0.5 text-xl font-semibold text-gray-900 sm:text-2xl">
            {money(summary?.totalEarnings)}
          </p>
        </div>
      </div>
      <div className="flex gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-600">
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          >
            <path d="M4 10V19C4 19.55 4.45 20 5 20H9V14H15V20H19C19.55 20 20 19.55 20 19V10" />
            <path d="M3 9L5 4H19L21 9" />
          </svg>
        </div>
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
            Active orders
          </p>
          <p className="mt-0.5 text-xl font-semibold text-gray-900 sm:text-2xl">
            {activeOrders.toLocaleString('en-IN')}
          </p>
        </div>
      </div>
      <div className="flex gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          </svg>
        </div>
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
            Pending
          </p>
          <p className="mt-0.5 text-xl font-semibold text-gray-900 sm:text-2xl">
            {money(summary?.pendingSettlement)}
          </p>
        </div>
      </div>
      <div className="flex gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          >
            <rect x="4" y="6" width="16" height="14" rx="2" />
            <path d="M8 6V4h8v2" />
          </svg>
        </div>
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
            Products
          </p>
          <p className="mt-0.5 text-xl font-semibold text-gray-900 sm:text-2xl">
            {(summary?.totalProducts || 0).toLocaleString('en-IN')}
          </p>
        </div>
      </div>
    </div>
  );

  const vendorDetailsCard = (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
      <h2 className="text-base font-semibold text-gray-900">Vendor details</h2>
      <div className="mt-4 grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Business address
          </p>
          <p className="mt-1 font-medium text-gray-900">
            {businessAddress || '—'}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Email address
          </p>
          <p className="mt-1 font-medium text-gray-900">
            {vendor.emailAddress}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Phone number
          </p>
          <p className="mt-1 font-medium text-gray-900">
            {vendor.mobileNumber ? String(vendor.mobileNumber) : '—'}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Member since
          </p>
          <p className="mt-1 font-medium text-gray-900">
            {vendor.createdAt
              ? new Date(vendor.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })
              : '—'}
          </p>
        </div>
      </div>
    </div>
  );

  const productsSection = (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-col gap-1 border-b border-gray-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
            >
              <rect x="4" y="6" width="16" height="14" rx="2" />
              <path d="M8 6V4h8v2" />
            </svg>
          </span>
          <h2 className="text-base font-semibold text-gray-900">
            Listed products
          </h2>
        </div>
      </div>
      <div className="border-b border-gray-100 px-4 py-3 sm:px-6">
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" />
            </svg>
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products by name..."
            className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-3 text-sm outline-none ring-orange-500/30 focus:border-orange-400 focus:ring-2"
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-[960px] w-full text-sm">
          <thead className="border-b border-gray-100 bg-gray-50/80">
            <tr className="text-left text-[11px] font-medium uppercase tracking-wide text-gray-500">
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Rent / month</th>
              <th className="px-4 py-3">Stock status</th>
              <th className="px-4 py-3">Enable / disable</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((p) => {
              const toggledOn = isProductLiveOnStorefront(p);
              const canToggleListing =
                p.isAdminApproved !== false &&
                String(p.submissionStatus || '').trim() === 'published';
              const busy = listingToggleId === String(p._id);
              return (
                <tr
                  key={p._id}
                  className="border-t border-gray-100 hover:bg-gray-50/80"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
                        {p.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={p.image}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[10px] text-gray-400">
                            —
                          </div>
                        )}
                      </div>
                      <span className="font-semibold text-gray-900">
                        {p.productName}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{p.category}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900">
                    {money(parsePrice(p.price))}
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-900">
                    {money(Number(p.rentPerMonth) || 0)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${stockStatusClass(p.status)}`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      disabled={!canToggleListing || busy}
                      onClick={() => handleAdminListingToggle(p)}
                      title={
                        !canToggleListing
                          ? 'Approve and publish before controlling storefront visibility'
                          : toggledOn
                            ? 'Visible on website — click to hide'
                            : 'Hidden from website — click to allow (vendor must also have it on)'
                      }
                      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full p-0.5 transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                        toggledOn ? 'bg-emerald-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-6 w-6 rounded-full bg-white shadow transition-transform ${
                          toggledOn ? 'translate-x-[1.15rem]' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </td>
                </tr>
              );
            })}
            {filteredProducts.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-10 text-center text-gray-500"
                >
                  No products found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const kycSection = (
    <div className="space-y-4">
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-4 sm:px-6">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
            </svg>
          </span>
          <h2 className="text-base font-semibold text-gray-900">
            KYC documents
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-3 sm:p-6">
          {kycDocs.map((doc) => {
            const hasFile = Boolean(String(doc.url || '').trim());
            const verifiedDoc = kycApproved && hasFile;
            return (
              <div
                key={doc.id}
                className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
              >
                <div className="flex h-36 items-center justify-center bg-gray-100">
                  {hasFile ? (
                    urlLooksLikePdf(doc.url) ? (
                      <div className="flex flex-col items-center gap-1 px-3 text-center">
                        <span className="text-xs font-medium text-gray-600">
                          PDF document
                        </span>
                        <span className="text-[11px] text-gray-400">
                          {doc.title}
                        </span>
                      </div>
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={doc.url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    )
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-gray-400">
                      <svg
                        className="h-10 w-10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.2"
                      >
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <path d="M14 2v6h6" />
                      </svg>
                      <span className="text-xs">No file</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-gray-900">{doc.title}</p>
                    <span
                      className={`shrink-0 text-xs font-semibold ${
                        verifiedDoc
                          ? 'text-emerald-600'
                          : hasFile
                            ? 'text-gray-600'
                            : 'text-amber-600'
                      }`}
                    >
                      {verifiedDoc
                        ? 'Verified'
                        : hasFile
                          ? 'Uploaded'
                          : 'Pending'}
                    </span>
                  </div>
                  {uploadedDateLabel ? (
                    <p className="text-xs text-gray-500">
                      Uploaded: {uploadedDateLabel}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-400">—</p>
                  )}
                  <div className="mt-auto flex gap-2 pt-1">
                    <button
                      type="button"
                      disabled={!hasFile}
                      onClick={() => hasFile && setKycPreviewUrl(doc.url)}
                      className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-gray-200 py-2 text-xs font-semibold ${
                        hasFile
                          ? 'text-gray-800 hover:bg-gray-50'
                          : 'cursor-not-allowed opacity-50'
                      }`}
                    >
                      <svg
                        className="h-3.5 w-3.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                      View
                    </button>
                    <button
                      type="button"
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-orange-500 py-2 text-xs font-semibold text-white hover:bg-orange-600"
                      onClick={() =>
                        toast.info(
                          'Ask the vendor to re-upload from their KYC flow, or use the KYC review page.',
                        )
                      }
                    >
                      <svg
                        className="h-3.5 w-3.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                      Update
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
        <h3 className="text-base font-semibold text-gray-900">KYC actions</h3>
        <div className="mt-4 flex flex-col flex-wrap gap-3 sm:flex-row">
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-orange-600"
            onClick={() =>
              toast.info(
                'Use Admin → KYC review for this vendor to approve application.',
              )
            }
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
            >
              <path d="M20 6L9 17l-5-5" />
            </svg>
            Approve KYC
          </button>
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-rose-300 bg-white px-5 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50"
            onClick={() =>
              toast.info(
                'Use Admin → KYC review for this vendor to reject application.',
              )
            }
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M15 9l-6 6M9 9l6 6" />
            </svg>
            Reject KYC
          </button>
          <button
            type="button"
            onClick={downloadAllKyc}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
            </svg>
            Download all
          </button>
        </div>
      </div>
    </div>
  );

  const financialsSection = (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
          <span className="text-sm font-semibold">₹</span>
        </span>
        <h2 className="text-base font-semibold text-gray-900">
          Financials & settlements
        </h2>
      </div>
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Financial summary
        </p>
        <div className="mt-4 grid grid-cols-1 gap-6 border-t border-gray-100 pt-4 md:grid-cols-3">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
              Total lifetime earnings
            </p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {money(financials?.totalEarnings)}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
              Pending settlements
            </p>
            <p className="mt-1 text-2xl font-bold text-orange-500">
              {money(financials?.pendingSettlement)}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
              Last settlement
            </p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {money(financials?.lastSettlement)}
            </p>
            {financials?.lastSettlementDate ? (
              <p className="mt-1 text-xs text-gray-500">
                {new Date(financials.lastSettlementDate).toLocaleDateString(
                  'en-IN',
                  {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  },
                )}
              </p>
            ) : null}
          </div>
        </div>
      </div>
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-base font-semibold text-gray-900">
            Recent transactions
          </h3>
          <button
            type="button"
            className="inline-flex items-center gap-1 text-sm font-semibold text-sky-600 hover:text-sky-700"
            onClick={() => toast.info('Full ledger view is not wired yet.')}
          >
            View all
            <svg
              className="h-3.5 w-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />
            </svg>
          </button>
        </div>
        <div className="mt-4 space-y-3">
          {(recentTransactions || []).slice(0, 6).map((t) => (
            <div
              key={t._id}
              className="flex flex-col gap-1 border-t border-gray-100 pt-3 text-sm first:border-t-0 first:pt-0 sm:flex-row sm:items-center sm:justify-between"
            >
              <p className="text-gray-600">
                <span className="font-medium text-gray-800">
                  {t.date
                    ? new Date(t.date).toLocaleDateString('en-IN', {
                        dateStyle: 'medium',
                      })
                    : '—'}
                </span>
                <span className="text-gray-400"> · </span>
                {t.description}
              </p>
              <p className="font-semibold text-gray-900">{money(t.amount)}</p>
            </div>
          ))}
          {!recentTransactions?.length ? (
            <p className="text-sm text-gray-400">
              Financial transaction history and settlement details will appear
              here.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );

  const loansSection = (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          >
            <rect x="2" y="5" width="20" height="14" rx="2" />
            <path d="M2 10h20" />
          </svg>
        </span>
        <h2 className="text-base font-semibold text-gray-900">Loan history</h2>
      </div>
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-[880px] w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50/80">
              <tr className="text-left text-[11px] font-medium uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3">Loan ID</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Principal amount</th>
                <th className="px-4 py-3">Remaining balance</th>
                <th className="px-4 py-3">Next EMI date</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {(loanHistory || []).map((row) => (
                <tr
                  key={row._id || row.loanId}
                  className="border-t border-gray-100"
                >
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {row.loanId || row._id}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {row.date
                      ? new Date(row.date).toLocaleDateString('en-IN', {
                          dateStyle: 'medium',
                        })
                      : '—'}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {money(row.principal)}
                  </td>
                  <td className="px-4 py-3 text-gray-800">
                    {money(row.remaining)}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {row.nextEmiDate || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${loanStatusClass(row.status)}`}
                    >
                      {row.status || '—'}
                    </span>
                  </td>
                </tr>
              ))}
              {!loanHistory?.length ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-sm text-gray-400"
                  >
                    No loan history records yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const kycBadge = kycApproved ? (
    <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
      KYC · Verified
    </span>
  ) : kycRejected ? (
    <span className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700">
      KYC · Rejected
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
      KYC · Pending
    </span>
  );

  return (
    <div className="space-y-6 pb-10">
      <Link
        href="/all-vendors"
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-orange-600"
      >
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M15 18l-6-6 6-6" />
        </svg>
        Back to vendors
      </Link>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start">
            <StorefrontHeroIcon />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                  {vendor.fullName}
                </h1>
                {kycApproved ? <VerifiedOrangeTick /> : null}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="text-sm text-gray-500">
                  #{vendor.vendorCode}
                </span>
                {kycBadge}
              </div>
              <div className="mt-4 flex flex-col gap-3 text-sm text-gray-600 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6 sm:gap-y-2">
                <span className="inline-flex items-center gap-2">
                  <svg
                    className="h-4 w-4 shrink-0 text-gray-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="M22 7l-10 6L2 7" />
                  </svg>
                  {vendor.emailAddress}
                </span>
                <span className="inline-flex items-center gap-2">
                  <svg
                    className="h-4 w-4 shrink-0 text-gray-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  {vendor.mobileNumber ? String(vendor.mobileNumber) : '—'}
                </span>
                {joinedLabel ? (
                  <span className="inline-flex items-center gap-2">
                    <svg
                      className="h-4 w-4 shrink-0 text-gray-400"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <rect x="3" y="4" width="18" height="18" rx="2" />
                      <path d="M16 2v4M8 2v4M3 10h18" />
                    </svg>
                    {joinedLabel}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => downloadVendorProfileExcel(data, kycDocs)}
              className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 shadow-sm hover:bg-gray-50"
            >
              Export profile
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-orange-600"
              onClick={() => toast.info('Messaging is not connected yet.')}
            >
              Send message
            </button>
          </div>
        </div>

        <div className="mt-6 border-t border-gray-100 pt-4">
          <div className="-mx-1 flex gap-1 overflow-x-auto pb-1">
            {TABS.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`shrink-0 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
                    active
                      ? 'border-b-2 border-orange-500 text-orange-600'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {show('overview') && (
        <div className="space-y-6">
          {statsRow}
          {vendorDetailsCard}
          {productsSection}
          {kycSection}
          {financialsSection}
          {loansSection}
        </div>
      )}

      {activeTab === 'products' && (
        <div className="space-y-6">{productsSection}</div>
      )}

      {activeTab === 'kyc' && <div className="space-y-6">{kycSection}</div>}

      {activeTab === 'financials' && (
        <div className="space-y-6">{financialsSection}</div>
      )}

      {activeTab === 'loans' && <div className="space-y-6">{loansSection}</div>}

      {kycPreviewUrl ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4"
          role="presentation"
          onClick={() => setKycPreviewUrl(null)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-[min(100vw-2rem,1200px)]"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative flex max-h-[90vh] items-center justify-center overflow-hidden rounded-xl bg-white shadow-xl">
              <button
                type="button"
                onClick={() => setKycPreviewUrl(null)}
                className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/55 text-white hover:bg-black/70"
                aria-label="Close preview"
              >
                <X size={20} strokeWidth={2.5} />
              </button>
              {urlLooksLikePdf(kycPreviewUrl) ? (
                <iframe
                  title="KYC document preview"
                  src={kycPreviewUrl}
                  className="min-h-[75vh] w-full border-0 bg-white pt-14"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={kycPreviewUrl}
                  alt="KYC document"
                  className="max-h-[90vh] w-auto max-w-full object-contain px-4 pb-4 pt-14"
                />
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
