'use client';

import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { apiGetAdminVendorDetails, apiGetAdminVendorKycReview } from '@/service/api';

const money = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
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
    stores.find((s) => String(s.shopFrontPhotoUrl || '').trim())?.shopFrontPhotoUrl || '';
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

export default function VendorDetails({ vendorId }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  const [search, setSearch] = useState('');
  const [kycPreviewUrl, setKycPreviewUrl] = useState(null);

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

    (async () => {
      try {
        const res = await apiGetAdminVendorDetails(vendorId, token);
        let payload = res.data || null;
        if (!mounted) return;

        const fromDetails = payload?.kycDocuments;
        if (!kycDocumentsHaveAnyUrl(fromDetails)) {
          try {
            const kycRes = await apiGetAdminVendorKycReview(vendorId, token);
            const kyc = kycRes.data?.kyc;
            const built = buildKycDocumentsFromKyc(kyc);
            if (built?.length) {
              payload = { ...payload, kycDocuments: built };
            }
          } catch {
            /* keep vendor details payload */
          }
        }

        setData(payload);
      } catch (err) {
        if (!mounted) return;
        setError(err.response?.data?.message || 'Failed to load vendor details.');
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

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{vendor.fullName}</h1>
            <p className="text-xs text-gray-500 mt-1">
              #{vendor.vendorCode} • {vendor.isVerified ? 'KYC Verified' : 'KYC Pending'}
            </p>
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-2 rounded-lg border border-gray-300 text-sm">
              Export Profile
            </button>
            <button className="px-3 py-2 rounded-lg bg-[#F97316] text-white text-sm">
              Send Message
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-emerald-100 p-4">
          <p className="text-[11px] text-gray-500">TOTAL EARNINGS</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{money(summary?.totalEarnings)}</p>
        </div>
        <div className="bg-white rounded-xl border border-blue-100 p-4">
          <p className="text-[11px] text-gray-500">ACTIVE PRODUCTS</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{summary?.activeProducts || 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-orange-100 p-4">
          <p className="text-[11px] text-gray-500">PENDING</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{money(summary?.pendingSettlement)}</p>
        </div>
        <div className="bg-white rounded-xl border border-violet-100 p-4">
          <p className="text-[11px] text-gray-500">PRODUCTS</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{summary?.totalProducts || 0}</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-4">
        <h2 className="font-semibold text-gray-900 mb-3">Vendor Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-gray-500">Business Name</p>
            <p className="font-medium text-gray-900">{vendor.fullName}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Email</p>
            <p className="font-medium text-gray-900">{vendor.emailAddress}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Phone</p>
            <p className="font-medium text-gray-900">-</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Member Since</p>
            <p className="font-medium text-gray-900">
              {vendor.createdAt
                ? new Date(vendor.createdAt).toLocaleDateString('en-GB')
                : '-'}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Listed Products</h2>
        </div>
        <div className="p-4 border-b border-gray-100">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search product by name..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[900px] w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-500">
              <tr>
                <th className="px-3 py-2.5 text-left font-medium">Product</th>
                <th className="px-3 py-2.5 text-left font-medium">Category</th>
                <th className="px-3 py-2.5 text-left font-medium">Price</th>
                <th className="px-3 py-2.5 text-left font-medium">Stock</th>
                <th className="px-3 py-2.5 text-left font-medium">Stock Status</th>
                <th className="px-3 py-2.5 text-left font-medium">Enable/Disable</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((p) => (
                <tr key={p._id} className="border-t border-gray-100">
                  <td className="px-3 py-2.5 font-medium text-gray-900">{p.productName}</td>
                  <td className="px-3 py-2.5 text-gray-700">{p.category}</td>
                  <td className="px-3 py-2.5 font-semibold text-gray-900">{money(parsePrice(p.price))}</td>
                  <td className="px-3 py-2.5 text-gray-700">{p.stock}</td>
                  <td className="px-3 py-2.5">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-[11px] border ${
                        p.status === 'Active'
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                          : p.status === 'Low Stock'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-rose-50 text-rose-600 border-rose-200'
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className={`inline-flex w-10 h-6 rounded-full items-center px-1 ${
                        p.status === 'Out of Stock' ? 'bg-gray-300' : 'bg-emerald-500'
                      }`}
                    >
                      <span className="w-4 h-4 rounded-full bg-white ml-auto" />
                    </span>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-gray-500">
                    No products found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">KYC Documents</h2>
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          {kycDocs.map((doc) => {
            const hasFile = Boolean(String(doc.url || '').trim());
            return (
              <div key={doc.id} className="rounded-xl border border-gray-200 overflow-hidden">
                <div className="h-28 bg-gray-100 flex items-center justify-center overflow-hidden">
                  {hasFile ? (
                    urlLooksLikePdf(doc.url) ? (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-1 px-2 text-center">
                        <span className="text-xs font-medium text-gray-600">PDF document</span>
                        <span className="text-[11px] text-gray-400 truncate max-w-full">{doc.title}</span>
                      </div>
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={doc.url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    )
                  ) : (
                    <span className="text-gray-400 text-sm">No preview</span>
                  )}
                </div>
                <div className="p-3">
                  <p className="font-medium text-sm text-gray-900">{doc.title}</p>
                  <p className="text-xs text-gray-500 mt-1">{doc.status}</p>
                  <div className="mt-2">
                    <button
                      type="button"
                      disabled={!hasFile}
                      onClick={() => hasFile && setKycPreviewUrl(doc.url)}
                      className={`px-3 py-1.5 rounded-md border border-gray-300 text-xs ${
                        hasFile
                          ? 'hover:bg-gray-50 text-gray-900'
                          : 'opacity-50 cursor-not-allowed text-gray-500'
                      }`}
                    >
                      View
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {kycPreviewUrl ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75"
          role="presentation"
          onClick={() => setKycPreviewUrl(null)}
        >
          <div
            className="relative max-w-[min(100vw-2rem,1200px)] max-h-[90vh] w-full"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative rounded-xl overflow-hidden bg-white shadow-xl max-h-[90vh] flex items-center justify-center">
              <button
                type="button"
                onClick={() => setKycPreviewUrl(null)}
                className="absolute top-3 right-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/55 text-white hover:bg-black/70"
                aria-label="Close preview"
              >
                <X size={20} strokeWidth={2.5} />
              </button>
              {urlLooksLikePdf(kycPreviewUrl) ? (
                <iframe
                  title="KYC document preview"
                  src={kycPreviewUrl}
                  className="w-full min-h-[75vh] border-0 bg-white pt-14"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={kycPreviewUrl}
                  alt="KYC document"
                  className="max-w-full max-h-[90vh] w-auto h-auto object-contain pt-14 pb-4 px-4"
                />
              )}
            </div>
          </div>
        </div>
      ) : null}

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Financials & Settlements</h2>
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-xl border border-gray-200 p-3">
            <p className="text-xs text-gray-500">Total Earnings</p>
            <p className="text-2xl font-semibold text-gray-900 mt-1">{money(financials?.totalEarnings)}</p>
          </div>
          <div className="rounded-xl border border-gray-200 p-3">
            <p className="text-xs text-gray-500">Pending Settlements</p>
            <p className="text-2xl font-semibold text-orange-600 mt-1">{money(financials?.pendingSettlement)}</p>
          </div>
          <div className="rounded-xl border border-gray-200 p-3">
            <p className="text-xs text-gray-500">Last Settlement</p>
            <p className="text-2xl font-semibold text-gray-900 mt-1">{money(financials?.lastSettlement)}</p>
          </div>
        </div>
        <div className="px-4 pb-4">
          <div className="rounded-xl border border-gray-200 p-3">
            <div className="flex items-center justify-between">
              <p className="font-medium text-gray-900">Recent Transactions</p>
            </div>
            <div className="mt-2 space-y-2">
              {(recentTransactions || []).slice(0, 4).map((t) => (
                <div key={t._id} className="flex items-center justify-between border-t border-gray-100 pt-2 text-sm">
                  <p className="text-gray-700">
                    {t.date ? new Date(t.date).toLocaleDateString('en-GB') : '-'} - {t.description}
                  </p>
                  <p className="font-semibold text-gray-900">{money(t.amount)}</p>
                </div>
              ))}
              {!recentTransactions?.length ? (
                <p className="text-sm text-gray-500">No recent transactions.</p>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Loan History</h2>
        </div>
        <div className="p-4">
          {loanHistory?.length ? (
            <div className="text-sm text-gray-700">Loan records available.</div>
          ) : (
            <div className="text-sm text-gray-500">No loan history records available.</div>
          )}
        </div>
      </div>
    </div>
  );
}

