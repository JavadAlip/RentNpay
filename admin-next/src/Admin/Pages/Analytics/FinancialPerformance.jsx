'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Calendar,
  CreditCard,
  DollarSign,
  Download,
  PiggyBank,
  ShoppingCart,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { apiGetAllOrders, apiGetMasterCategories } from '@/service/api';

const COMMISSION_RATE = 0.1;

const RANGE_OPTIONS = [
  { id: '6m', label: 'Last 6 months' },
  { id: '30d', label: 'Last 30 days' },
  { id: '90d', label: 'Last 90 days' },
  { id: 'ytd', label: 'Year to date' },
];

function orderGmv(o) {
  return (o.products || []).reduce(
    (s, i) =>
      s +
      Number(i.pricePerDay || 0) *
        Number(i.quantity || 0) *
        Number(o.rentalDuration || 0),
    0,
  );
}

function isCancelled(o) {
  return String(o.status || '').toLowerCase() === 'cancelled';
}

function inRange(date, rangeId, now = new Date()) {
  const t = new Date(date).getTime();
  if (Number.isNaN(t)) return false;
  const start = new Date(now);
  if (rangeId === '30d') {
    start.setDate(start.getDate() - 30);
  } else if (rangeId === '90d') {
    start.setDate(start.getDate() - 90);
  } else if (rangeId === 'ytd') {
    start.setMonth(0, 1);
    start.setHours(0, 0, 0, 0);
  } else {
    start.setMonth(start.getMonth() - 6);
  }
  return t >= start.getTime() && t <= now.getTime();
}

function monthKey(d) {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(ym) {
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleString('en-IN', { month: 'short' });
}

function formatLakhs(rupees) {
  const l = Number(rupees || 0) / 1e5;
  return `₹${l.toFixed(1)}L`;
}

function formatCompactINR(rupees) {
  const n = Number(rupees || 0);
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(1)} Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(1)}L`;
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
}

const slugify = (text) =>
  String(text || '')
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

/**
 * Maps an order line to a Master Category name from admin Master Categories, or null
 * if the line is skipped in Category Performance (unmapped / legacy data).
 */
function resolveToMasterCategoryName(item, labelByKey, subKeyToParent) {
  const p = item?.product;
  if (!p || typeof p !== 'object') return null;

  const allowed = new Set(labelByKey.values());

  const matchMain = (raw) => {
    const s = String(raw || '').trim();
    if (!s) return null;
    const key = slugify(s);
    if (labelByKey.has(key)) return labelByKey.get(key);
    for (const label of labelByKey.values()) {
      if (label.toLowerCase() === s.toLowerCase()) return label;
    }
    if (allowed.has(s)) return s;
    return null;
  };

  const fromMain = matchMain(p.category);
  if (fromMain) return fromMain;

  const subRaw = String(p.subCategory || '').trim();
  if (subRaw) {
    const sk = slugify(subRaw);
    if (subKeyToParent.has(sk)) {
      const parent = subKeyToParent.get(sk);
      if (parent && allowed.has(parent)) return parent;
    }
  }

  return null;
}

const DONUT_COLORS = ['#1e3a8a', '#3b82f6', '#9333ea', '#f97316', '#64748b'];

function buildDonutSegments(categoryTotals) {
  const entries = Object.entries(categoryTotals).filter(([, v]) => v > 0);
  entries.sort((a, b) => b[1] - a[1]);
  const top = entries.slice(0, 4);
  const rest = entries.slice(4).reduce((s, [, v]) => s + v, 0);
  if (rest > 0) top.push(['Others', rest]);
  const total = top.reduce((s, [, v]) => s + v, 0) || 1;
  const rows = top.map(([name, value], i) => ({
    name,
    value,
    pct: Math.round((value / total) * 100),
    color: DONUT_COLORS[i % DONUT_COLORS.length],
  }));
  const sumPct = rows.reduce((s, r) => s + r.pct, 0);
  if (rows.length && sumPct !== 100) {
    rows[rows.length - 1].pct += 100 - sumPct;
  }
  return rows;
}

function DonutChart({ segments, centerTitle, centerSubtitle }) {
  const size = 200;
  const stroke = 28;
  const r = (size - stroke) / 2;
  const c = size / 2;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  const total = segments.reduce((s, x) => s + x.pct, 0) || 1;

  const arcs = segments.map((seg) => {
    const frac = seg.pct / total;
    const len = frac * circ;
    const dash = `${len} ${circ - len}`;
    const arc = (
      <circle
        key={seg.name}
        cx={c}
        cy={c}
        r={r}
        fill="none"
        stroke={seg.color}
        strokeWidth={stroke}
        strokeDasharray={dash}
        strokeDashoffset={-offset}
        transform={`rotate(-90 ${c} ${c})`}
        className="transition-opacity hover:opacity-90"
      />
    );
    offset += len;
    return arc;
  });

  return (
    <div className="flex flex-col items-center">
      <svg
        width="min(100%, 220px)"
        viewBox={`0 0 ${size} ${size}`}
        className="max-w-[220px]"
        aria-hidden
      >
        {arcs}
        <text
          x={c}
          y={c - 6}
          textAnchor="middle"
          className="fill-gray-400 text-[10px] font-medium"
        >
          {centerTitle}
        </text>
        <text
          x={c}
          y={c + 14}
          textAnchor="middle"
          className="fill-gray-900 text-sm font-semibold"
        >
          {centerSubtitle}
        </text>
      </svg>
    </div>
  );
}

function LineChart({ points }) {
  const w = 400;
  const h = 200;
  const padL = 44;
  const padR = 12;
  const padT = 16;
  const padB = 36;
  const innerW = w - padL - padR;
  const innerH = h - padT - padB;
  const maxY = Math.max(...points.map((p) => p.y), 1);
  const n = points.length;
  const coords = points.map((p, i) => {
    const x = padL + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW);
    const y = padT + innerH - (p.y / maxY) * innerH;
    return { x, y, label: p.label };
  });
  const pathD = coords
    .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`)
    .join(' ');
  const areaD = `${pathD} L ${coords[coords.length - 1]?.x || padL} ${padT + innerH} L ${coords[0]?.x || padL} ${padT + innerH} Z`;

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => ({
    y: padT + innerH - t * innerH,
    lab: formatLakhs(maxY * t),
  }));

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${w} ${h}`}
      className="min-h-[180px] sm:min-h-[200px]"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden
    >
      <defs>
        <linearGradient id="fpFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#22c55e" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
        </linearGradient>
      </defs>
      {yTicks.map((t) => (
        <g key={t.lab}>
          <line
            x1={padL}
            x2={w - padR}
            y1={t.y}
            y2={t.y}
            stroke="#e5e7eb"
            strokeDasharray="4 4"
          />
          <text x={4} y={t.y + 4} className="fill-gray-400 text-[9px]">
            {t.lab}
          </text>
        </g>
      ))}
      <path d={areaD} fill="url(#fpFill)" />
      <path
        d={pathD}
        fill="none"
        stroke="#16a34a"
        strokeWidth={2.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {coords.map((pt) => (
        <circle key={pt.label} cx={pt.x} cy={pt.y} r={3.5} fill="#16a34a" />
      ))}
      {coords.map((pt) => (
        <text
          key={`${pt.label}-x`}
          x={pt.x}
          y={h - 8}
          textAnchor="middle"
          className="fill-gray-500 text-[10px]"
        >
          {pt.label}
        </text>
      ))}
    </svg>
  );
}

const MASTER_PLATFORMS = ['rent', 'buy', 'services'];

async function fetchMasterCategoryMaps(token) {
  const labelByKey = new Map();
  const subKeyToParent = new Map();
  const results = await Promise.all(
    MASTER_PLATFORMS.map((platform) =>
      apiGetMasterCategories(token, platform).catch(() => ({
        data: { tree: [] },
      })),
    ),
  );
  for (const res of results) {
    const tree = res.data?.tree || [];
    for (const c of tree) {
      const name = String(c.name || '').trim();
      if (!name) continue;
      const key = slugify(name);
      if (!labelByKey.has(key)) labelByKey.set(key, name);
      const subs = c.subCategories || [];
      for (const s of subs) {
        const subName = String(s.name || '').trim();
        if (!subName) continue;
        const sk = slugify(subName);
        if (!subKeyToParent.has(sk)) subKeyToParent.set(sk, name);
      }
    }
  }
  return { labelByKey, subKeyToParent };
}

const FinancialPerformance = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [orders, setOrders] = useState([]);
  const [masterMaps, setMasterMaps] = useState(() => ({
    labelByKey: new Map(),
    subKeyToParent: new Map(),
  }));
  const [rangeId, setRangeId] = useState('6m');

  useEffect(() => {
    let mounted = true;
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    if (!token) {
      setError('Please login again to continue.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    Promise.all([apiGetAllOrders(token), fetchMasterCategoryMaps(token)])
      .then(([ordersRes, maps]) => {
        if (!mounted) return;
        setOrders(ordersRes.data || []);
        setMasterMaps(maps);
      })
      .catch((err) => {
        if (!mounted) return;
        setOrders([]);
        setMasterMaps({ labelByKey: new Map(), subKeyToParent: new Map() });
        setError(err.response?.data?.message || 'Failed to load analytics.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const filteredOrders = useMemo(
    () =>
      (orders || []).filter(
        (o) => !isCancelled(o) && inRange(o.createdAt, rangeId),
      ),
    [orders, rangeId],
  );

  const analytics = useMemo(() => {
    const gmv = filteredOrders.reduce((s, o) => s + orderGmv(o), 0);
    const commission = gmv * COMMISSION_RATE;
    const payouts = gmv - commission;
    const orderCount = filteredOrders.length;
    const aov = orderCount ? gmv / orderCount : 0;

    const now = new Date();
    const monthKeys = [];
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthKeys.push(monthKey(d));
    }

    const commissionByMonth = {};
    monthKeys.forEach((k) => {
      commissionByMonth[k] = 0;
    });
    filteredOrders.forEach((o) => {
      const k = monthKey(o.createdAt);
      if (commissionByMonth[k] === undefined) return;
      commissionByMonth[k] += orderGmv(o) * COMMISSION_RATE;
    });

    const linePoints = monthKeys.map((k) => ({
      label: monthLabel(k),
      y: commissionByMonth[k],
    }));

    const lastKey = monthKeys[monthKeys.length - 1];
    const prevKey = monthKeys[monthKeys.length - 2];
    const cur = commissionByMonth[lastKey] || 0;
    const prev = commissionByMonth[prevKey] || 0;
    const growthPct =
      prev > 0 ? Math.round(((cur - prev) / prev) * 100) : cur > 0 ? 100 : 0;
    const sixMonthCommission = monthKeys.reduce(
      (s, k) => s + (commissionByMonth[k] || 0),
      0,
    );

    const { labelByKey, subKeyToParent } = masterMaps;
    const categoryTotals = {};
    filteredOrders.forEach((o) => {
      const items = o.products || [];
      if (!items.length) return;
      items.forEach((it) => {
        const line = orderGmv({ ...o, products: [it] });
        const cat = resolveToMasterCategoryName(it, labelByKey, subKeyToParent);
        if (!cat) return;
        categoryTotals[cat] = (categoryTotals[cat] || 0) + line;
      });
    });

    const segments = buildDonutSegments(categoryTotals);
    const topSeg = segments[0];
    const topName = topSeg?.name || '—';

    return {
      gmv,
      commission,
      payouts,
      aov,
      linePoints,
      cur,
      growthPct,
      sixMonthCommission,
      segments,
      topName,
    };
  }, [filteredOrders, masterMaps]);

  const downloadReport = useCallback(async () => {
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      const margin = 14;
      const maxW = doc.internal.pageSize.getWidth() - margin * 2;
      let y = 20;

      const rupee = (n) =>
        `INR ${Math.round(Number(n) || 0).toLocaleString('en-IN')}`;

      const ensureSpace = (needed = 10) => {
        if (y + needed > doc.internal.pageSize.getHeight() - 16) {
          doc.addPage();
          y = 20;
        }
      };

      const heading = (text, size = 14) => {
        ensureSpace(12);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(size);
        const lines = doc.splitTextToSize(text, maxW);
        doc.text(lines, margin, y);
        y += lines.length * (size * 0.45) + 4;
      };

      const body = (text, size = 10) => {
        ensureSpace(8);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(size);
        const lines = doc.splitTextToSize(String(text), maxW);
        doc.text(lines, margin, y);
        y += lines.length * (size * 0.45) + 3;
      };

      heading('Financial Performance Report', 16);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(90, 90, 90);
      body(
        `Date range: ${RANGE_OPTIONS.find((r) => r.id === rangeId)?.label || rangeId} · Generated ${new Date().toLocaleString('en-IN')}`,
        9,
      );
      doc.setTextColor(0, 0, 0);
      y += 4;

      heading('Summary', 12);
      body(`Total GMV: ${rupee(analytics.gmv)}`);
      body(`Total payouts: ${rupee(analytics.payouts)}`);
      body(`Net commission: ${rupee(analytics.commission)}`);
      body(`Orders (excl. cancelled): ${filteredOrders.length}`);
      body(`Average order value: ${rupee(analytics.aov)}`);
      body(
        `Month-on-month commission growth: ${analytics.growthPct >= 0 ? '+' : ''}${analytics.growthPct}%`,
      );
      y += 4;

      heading('Category performance (GMV share)', 12);
      if (analytics.segments.length) {
        analytics.segments.forEach((s) => {
          body(`${s.name}: ${s.pct}%`);
        });
      } else {
        body('No mapped master categories in this range.');
      }

      doc.save(`financial-performance-${rangeId}.pdf`);
    } catch (e) {
      console.error(e);
      toast.error(
        'Could not create PDF. Run npm install in the admin-next folder if jspdf is missing.',
      );
    }
  }, [analytics, filteredOrders.length, rangeId]);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
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

  return (
    <div className="min-h-full bg-[#f2f4f8] -m-3 sm:-m-4 md:-m-6 p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-5 sm:space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Financial Performance
            </h1>
            <p className="mt-1 text-sm sm:text-base text-gray-500">
              Data-driven insights &amp; commission analytics
            </p>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full lg:w-auto">
            <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm">
              <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
              <select
                value={rangeId}
                onChange={(e) => setRangeId(e.target.value)}
                className="text-sm text-gray-800 bg-transparent border-none outline-none cursor-pointer min-w-0 flex-1"
                aria-label="Date range"
              >
                {RANGE_OPTIONS.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={downloadReport}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 text-white text-sm font-medium px-4 py-2.5 shadow-sm hover:bg-orange-600 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download Report
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-slate-900">
                  Revenue Growth (Commission Earned)
                </h2>
                <p className="text-xs sm:text-sm text-gray-500">
                  Monthly commission trend
                </p>
              </div>
            </div>
            <LineChart points={analytics.linePoints} />
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pt-4 border-t border-gray-100">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-gray-400 font-medium">
                  Current month
                </p>
                <p className="text-lg font-semibold text-emerald-600">
                  {formatLakhs(analytics.cur)}
                </p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-gray-400 font-medium">
                  Growth rate
                </p>
                <p className="text-lg font-semibold text-emerald-600">
                  {analytics.growthPct >= 0 ? '+' : ''}
                  {analytics.growthPct}%
                </p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-gray-400 font-medium">
                  6-month total
                </p>
                <p className="text-lg font-semibold text-slate-900">
                  {formatLakhs(analytics.sixMonthCommission)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-6">
            <h2 className="text-base font-semibold text-slate-900">
              Category Performance
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5 mb-4">
              Revenue distribution by category
            </p>
            {analytics.segments.length ? (
              <DonutChart
                segments={analytics.segments}
                centerTitle="Top Category"
                centerSubtitle={analytics.topName}
              />
            ) : (
              <div
                className="mx-auto flex h-[200px] max-w-[220px] flex-col items-center justify-center rounded-full border-2 border-dashed border-gray-200 bg-gray-50/80 text-center px-6"
                aria-hidden
              >
                <p className="text-xs font-medium text-gray-500">
                  No chart data
                </p>
                <p className="mt-1 text-[11px] text-gray-400 leading-snug">
                  Map products to Master Categories to see the split here.
                </p>
              </div>
            )}
            <ul className="mt-4 space-y-2.5">
              {(analytics.segments.length ? analytics.segments : []).map(
                (s) => (
                  <li
                    key={s.name}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="flex items-center gap-2 text-gray-700 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: s.color }}
                      />
                      <span className="truncate">{s.name}</span>
                    </span>
                    <span className="font-medium text-slate-900 shrink-0 ml-2">
                      {s.pct}%
                    </span>
                  </li>
                ),
              )}
              {!analytics.segments.length ? (
                <li className="text-sm text-gray-400">
                  No purchases mapped to Master Categories in this range.
                </li>
              ) : null}
            </ul>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
          {[
            {
              label: 'Total GMV',
              value: formatCompactINR(analytics.gmv),
              icon: ShoppingCart,
              iconBg: 'bg-blue-50 text-blue-600',
            },
            {
              label: 'Total Payouts',
              value: formatCompactINR(analytics.payouts),
              icon: DollarSign,
              iconBg: 'bg-orange-50 text-orange-600',
            },
            {
              label: 'Net Profit',
              value: formatCompactINR(analytics.commission),
              icon: PiggyBank,
              iconBg: 'bg-emerald-50 text-emerald-600',
            },
            {
              label: 'Avg Order Value (AOV)',
              value: `₹${Math.round(analytics.aov).toLocaleString('en-IN')}`,
              icon: CreditCard,
              iconBg: 'bg-violet-50 text-violet-600',
            },
          ].map((card) => (
            <div
              key={card.label}
              className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-start gap-4"
            >
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${card.iconBg}`}
              >
                <card.icon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-gray-400 tracking-wide uppercase">
                  {card.label}
                </p>
                <p className="mt-1 text-xl sm:text-2xl font-bold text-slate-900 truncate">
                  {card.value}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FinancialPerformance;
