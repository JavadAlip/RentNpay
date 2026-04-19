'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Clock,
  ExternalLink,
  HelpCircle,
  Mail,
  MessageCircle,
  Phone,
  Plus,
  Search,
} from 'lucide-react';
import { apiGetMySupportTickets } from '@/lib/api';

const FAQ_ITEMS = [
  {
    id: '1',
    q: 'How do I return a rented item?',
    category: 'Returns',
    icon: 'box',
  },
  {
    id: '2',
    q: 'What is the refund policy?',
    category: 'Refunds',
    icon: 'wallet',
  },
  {
    id: '3',
    q: 'How do I extend my rental tenure?',
    category: 'Rentals',
    icon: 'clock',
  },
  {
    id: '4',
    q: 'What if I receive a damaged item?',
    category: 'Product Issues',
    icon: 'alert',
  },
  {
    id: '5',
    q: 'How are vendors verified?',
    category: 'Trust & Safety',
    icon: 'shield',
  },
  {
    id: '6',
    q: 'How do I cancel a service booking?',
    category: 'Services',
    icon: 'wrench',
  },
  {
    id: '7',
    q: 'Where can I download my invoices?',
    category: 'Billing',
    icon: 'file',
  },
  {
    id: '8',
    q: 'What payment methods are accepted?',
    category: 'Payments',
    icon: 'card',
  },
];

const FAQ_CATEGORIES = [
  'All Topics',
  'Returns',
  'Refunds',
  'Rentals',
  'Product Issues',
  'Services',
  'Billing',
  'Payments',
  'Trust & Safety',
];

function formatAgo(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const sec = Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000));
  if (sec < 60) return 'just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 48) return `${hr} hour${hr === 1 ? '' : 's'} ago`;
  const day = Math.floor(hr / 24);
  return `${day} day${day === 1 ? '' : 's'} ago`;
}

function FaqIcon({ name }) {
  const cls = 'h-4 w-4 text-orange-600';
  switch (name) {
    case 'wallet':
      return (
        <svg
          className={cls}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
          <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
          <path d="M18 12a2 2 0 0 0 0 4h3v-4Z" />
        </svg>
      );
    case 'clock':
      return (
        <svg
          className={cls}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
      );
    case 'shield':
      return (
        <svg
          className={cls}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      );
    case 'wrench':
      return (
        <svg
          className={cls}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
        </svg>
      );
    case 'file':
      return (
        <svg
          className={cls}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
        </svg>
      );
    case 'card':
      return (
        <svg
          className={cls}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
          <path d="M1 10h22" />
        </svg>
      );
    case 'alert':
      return (
        <svg
          className={cls}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <path d="M12 9v4M12 17h.01" />
        </svg>
      );
    default:
      return (
        <svg
          className={cls}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        </svg>
      );
  }
}

/** Figma-style status pills: outlined pill + tinted fill */
function statusPillClasses(variant) {
  if (variant === 'emerald')
    return 'bg-[#F0FDF4] text-[#15803D] ring-1 ring-[#15803D]';
  if (variant === 'violet')
    return 'bg-[#F5F3FF] text-[#7C3AED] ring-1 ring-[#7C3AED]';
  return 'bg-[#FFF7ED] text-[#C2410C] ring-1 ring-[#C2410C]';
}

function ticketLargeTileClasses(variant) {
  if (variant === 'emerald') return 'bg-emerald-100 text-emerald-800';
  if (variant === 'violet') return 'bg-violet-100 text-violet-800';
  return 'bg-amber-100 text-amber-950';
}

function TicketStatusLargeIcon({ variant, className }) {
  const cn = className || 'h-7 w-7';
  if (variant === 'emerald')
    return <CheckCircle2 className={cn} strokeWidth={2} aria-hidden />;
  if (variant === 'violet')
    return <AlertCircle className={cn} strokeWidth={2} aria-hidden />;
  return <Clock className={cn} strokeWidth={2} aria-hidden />;
}

function TicketStatusPillIcon({ variant, className }) {
  const cn = className || 'h-3.5 w-3.5 shrink-0';
  if (variant === 'emerald')
    return <CheckCircle2 className={cn} strokeWidth={2.5} aria-hidden />;
  if (variant === 'violet')
    return <AlertCircle className={cn} strokeWidth={2.5} aria-hidden />;
  return <Clock className={cn} strokeWidth={2.5} aria-hidden />;
}

function formatOrderRef(orderId) {
  const s = String(orderId || '');
  const tail = s.replace(/[^a-fA-F0-9]/g, '').slice(-4).toUpperCase();
  return tail || s.slice(-4).toUpperCase() || '—';
}

export default function HelpCenterPage() {
  const [faqSearch, setFaqSearch] = useState('');
  const [faqCategory, setFaqCategory] = useState('All Topics');
  const [tickets, setTickets] = useState([]);
  const [ticketSummary, setTicketSummary] = useState({
    total: 0,
    pending: 0,
    solved: 0,
  });
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [ticketsError, setTicketsError] = useState('');
  const [hasUser, setHasUser] = useState(() =>
    typeof window !== 'undefined'
      ? Boolean(localStorage.getItem('userToken'))
      : false,
  );

  const loadTickets = useCallback(async () => {
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('userToken') : null;
    setHasUser(Boolean(token));
    if (!token) {
      setTickets([]);
      setTicketSummary({ total: 0, pending: 0, solved: 0 });
      setTicketsLoading(false);
      return;
    }
    setTicketsLoading(true);
    setTicketsError('');
    try {
      const res = await apiGetMySupportTickets();
      setTickets(res.data?.tickets || []);
      setTicketSummary(
        res.data?.summary || { total: 0, pending: 0, solved: 0 },
      );
    } catch (e) {
      if (e.response?.status === 401) {
        setHasUser(false);
        setTickets([]);
        setTicketSummary({ total: 0, pending: 0, solved: 0 });
      } else {
        setTicketsError(e.response?.data?.message || 'Could not load tickets.');
      }
    } finally {
      setTicketsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const filteredFaqs = useMemo(() => {
    const q = faqSearch.trim().toLowerCase();
    return FAQ_ITEMS.filter((item) => {
      const catOk =
        faqCategory === 'All Topics' || item.category === faqCategory;
      const textOk =
        !q ||
        item.q.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q);
      return catOk && textOk;
    });
  }, [faqSearch, faqCategory]);

  return (
    <div className="bg-slate-50 min-h-[calc(100vh-4rem)]">
      <div className="mx-auto max-w-6xl px-4 py-8 lg:py-10">
        {/* Hero — Figma: orange circle + question mark above title */}
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-500 text-white shadow-md ring-4 ring-orange-500/10 sm:h-20 sm:w-20">
            <HelpCircle
              className="h-8 w-8 sm:h-10 sm:w-10"
              strokeWidth={2}
              aria-hidden
            />
          </div>
          <h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-900 sm:mt-6 sm:text-4xl">
            Help Center
          </h1>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">
            Find answers to your questions or get help from our support team
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 md:mt-12 md:grid-cols-3 md:gap-5">
          <div className="flex flex-row items-center gap-4 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
              <Phone className="h-7 w-7" strokeWidth={2} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-bold leading-tight text-slate-900 sm:text-xl">
                Call Support
              </h3>
              <p className="mt-0.5 text-sm text-slate-500">Talk to our team</p>
              <a
                href="tel:18000000000"
                className="mt-1 inline-block text-base font-bold text-sky-600 hover:text-sky-700"
              >
                1800-XXX-XXXX
              </a>
            </div>
          </div>
          <div className="flex flex-row items-center gap-4 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
              <Mail className="h-7 w-7" strokeWidth={2} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-bold leading-tight text-slate-900 sm:text-xl">
                Email Support
              </h3>
              <p className="mt-0.5 text-sm text-slate-500">
                Get help via email
              </p>
              <a
                href="mailto:support@rentnpay.com"
                className="mt-1 inline-block break-all text-base font-bold text-orange-600 hover:text-orange-700"
              >
                support@rentnpay.com
              </a>
            </div>
          </div>
          <div className="flex flex-row items-center gap-4 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
              <MessageCircle className="h-7 w-7" strokeWidth={2} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-bold leading-tight text-slate-900 sm:text-xl">
                Live Chat
              </h3>
              <p className="mt-0.5 text-sm text-slate-500">Chat with an agent</p>
              <button
                type="button"
                className="mt-1 inline-flex items-center gap-1.5 text-left text-base font-bold text-emerald-600 hover:text-emerald-700"
                onClick={() =>
                  window.open(
                    'mailto:support@rentnpay.com?subject=Live%20chat%20request',
                    '_blank',
                  )
                }
              >
                Start Chat
                <ExternalLink className="h-4 w-4 shrink-0" aria-hidden />
              </button>
            </div>
          </div>
        </div>

        {/* Recent tickets */}
        <section className="mt-14">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-orange-500 bg-white text-orange-500"
                aria-hidden
              >
                <MessageCircle className="h-5 w-5" strokeWidth={2} />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">
                  Recent Tickets
                </h2>
                <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                  {ticketSummary.total}
                </span>
              </div>
            </div>
            <Link
              href="/my-rentals"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-orange-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 sm:px-5"
            >
              <Plus className="h-5 w-5 shrink-0" strokeWidth={2.5} aria-hidden />
              Raise New Ticket
            </Link>
          </div>
          {/* <p className="mt-1 text-xs text-slate-500">
            Report an issue from an order under <strong>My orders</strong>. Your requests appear
            here.
          </p> */}

          <div className="mt-5 space-y-3">
            {ticketsLoading ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
                Loading your tickets…
              </div>
            ) : ticketsError ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
                {ticketsError}
              </div>
            ) : !hasUser ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-600">
                <Link
                  href="/login"
                  className="font-semibold text-orange-600 hover:text-orange-700"
                >
                  Log in
                </Link>{' '}
                to see tickets you&apos;ve raised about your orders.
              </div>
            ) : tickets.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
                No tickets yet. Open an order and use{' '}
                <strong>Report an issue</strong> to contact the vendor and
                support.
              </div>
            ) : (
              tickets.map((t) => (
                <Link
                  key={`${t.orderId}-${t._id}`}
                  href={`/orders/${t.orderId}/track`}
                  className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-orange-200 hover:shadow-md"
                >
                  <div className="flex items-stretch gap-4">
                    <div
                      className={`flex h-14 w-14 shrink-0 items-center justify-center self-center rounded-xl ${ticketLargeTileClasses(t.statusVariant)}`}
                    >
                      <TicketStatusLargeIcon variant={t.statusVariant} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900">
                        {t.productName}
                      </p>
                      <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                        {t.message}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-slate-500">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusPillClasses(t.statusVariant)}`}
                        >
                          <TicketStatusPillIcon variant={t.statusVariant} />
                          {t.displayStatus}
                        </span>
                        <span className="text-slate-300" aria-hidden>
                          ·
                        </span>
                        <span className="font-medium text-slate-600">
                          {t.queryId}
                        </span>
                        <span className="text-slate-300" aria-hidden>
                          ·
                        </span>
                        <span>{t.issueCategory || 'Product issue'}</span>
                        <span className="text-slate-300" aria-hidden>
                          ·
                        </span>
                        <span>
                          Order:{' '}
                          <span className="font-mono text-[11px] text-slate-600">
                            ORD-{formatOrderRef(t.orderId)}
                          </span>
                        </span>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end justify-between gap-2">
                      <span className="text-xs text-slate-400">
                        Updated {formatAgo(t.createdAt)}
                      </span>
                      <ChevronRight className="h-5 w-5 text-slate-300" />
                    </div>
                  </div>
                  {t.assignedStore ? (
                    <p className="mt-3 border-t border-slate-100 pt-3 text-xs text-sky-700">
                      {t.assignedStore}
                    </p>
                  ) : null}
                </Link>
              ))
            )}
          </div>
        </section>

        {/* FAQ */}
        <section className="mt-16">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-500 text-white">
              <HelpCircle className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              Frequently asked questions
            </h2>
          </div>

          <div className="relative mt-4">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={faqSearch}
              onChange={(e) => setFaqSearch(e.target.value)}
              placeholder="Search for help... (e.g. 'How to return?', 'Refund policy')"
              className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 text-sm outline-none ring-orange-500/20 focus:border-orange-400 focus:ring-2"
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {FAQ_CATEGORIES.map((c) => {
              const active = faqCategory === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setFaqCategory(c)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    active
                      ? 'bg-orange-500 text-white shadow-sm'
                      : 'border border-slate-200 bg-white text-slate-700 hover:border-orange-200'
                  }`}
                >
                  {c}
                </button>
              );
            })}
          </div>

          <ul className="mt-5 space-y-2">
            {filteredFaqs.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-50">
                  <FaqIcon name={item.icon} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900">{item.q}</p>
                  <p className="text-xs font-medium text-orange-600">
                    {item.category}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-slate-300" />
              </li>
            ))}
            {filteredFaqs.length === 0 ? (
              <li className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
                No questions match your search.
              </li>
            ) : null}
          </ul>
        </section>

        {/* CTA */}
        <section className="mt-14 rounded-2xl border border-sky-200 bg-sky-50/80 p-6 text-center sm:p-8">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-sky-500 text-white">
            <HelpCircle className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-lg font-bold text-slate-900">
            Still need help?
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
            Can&apos;t find what you&apos;re looking for? Our support team is
            here to help you.
          </p>
          <Link
            href="/my-rentals"
            className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-orange-600"
          >
            + Raise a support ticket
          </Link>
        </section>
      </div>
    </div>
  );
}
