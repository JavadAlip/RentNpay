'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Sofa,
  BarChart3,
  Shield,
  Clock,
  Package,
  Wrench,
  X,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  Landmark,
  IndianRupee,
  Star,
  Camera,
  Calendar,
  Truck,
  CheckCircle,
  CircleCheck,
  TrendingUp,
  Upload,
} from 'lucide-react';
import {
  apiExtendMyOrderTenure,
  apiGetMyOrders,
  apiSubmitMyIssueReport,
  apiSubmitMyReturnRequest,
  apiGetPublicActiveOffers,
} from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import {
  formatMoney,
  startOfDay,
  computeNextPaymentLabel,
  productImageUrl,
  normalizeStatus,
  resolveTenureUnit,
  computeLeaseEnd,
  lineEligibleForRentalHub,
} from '@/lib/orderRentalUtils';
import PickupScheduledModal from '@/components/PickupScheduledModal';
import rentalSaveIcon from '@/assets/icons/rental-save.png';
import graphHighIcon from '@/assets/icons/grpah-high.png';

function flattenRentals(orders) {
  const rows = [];
  for (const order of orders) {
    const st = normalizeStatus(order.status);
    if (st === 'cancelled' || st === 'completed') continue;
    // Only items the customer physically has (admin marked Delivered).
    if (st !== 'delivered') continue;
    const start = order.createdAt ? new Date(order.createdAt) : new Date();
    const duration = order.rentalDuration;
    for (const line of order.products || []) {
      if (!lineEligibleForRentalHub(line)) continue;
      const p = line.product;
      const unit = resolveTenureUnit(order, p, duration);
      const end = computeLeaseEnd(start, duration, unit);
      rows.push({ order, line, product: p, start, end, tenureUnit: unit });
    }
  }
  return rows;
}

function parseDeposit(product) {
  const v = product?.refundableDeposit;
  if (v == null || v === '') return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Prefer deposit snapshot on the order line when it was persisted (> 0).
 * Lines often have `refundableDeposit: 0` from schema defaults or pre-snapshot
 * orders — in that case use the populated product (same source as product detail).
 */
function lineDeposit(line, product) {
  const fromLine = Number(line?.refundableDeposit);
  if (Number.isFinite(fromLine) && fromLine > 0) return fromLine;
  return parseDeposit(product);
}

function buildActivity(order, lineTotalRent) {
  const t = order.createdAt ? new Date(order.createdAt) : new Date();
  const items = [
    {
      text: `Payment successful — ₹${formatMoney(lineTotalRent)}`,
      date: t,
    },
  ];
  const st = normalizeStatus(order.status);
  if (st === 'delivered') {
    items.push({
      text: 'Delivered to your address',
      date: t,
    });
  } else if (st === 'shipped') {
    items.push({
      text: 'Shipment in progress',
      date: t,
    });
  } else if (st === 'confirmed') {
    items.push({
      text: 'Order confirmed by vendor',
      date: t,
    });
  }
  return items;
}

function formatShortDate(d) {
  return d.toLocaleString('en-IN', { month: 'short', day: 'numeric' });
}

function formatShortWeekday(d) {
  return d.toLocaleString('en-IN', { weekday: 'short' });
}

function toLocalDateOnly(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function daysBetween(startDate, endDate) {
  const ms =
    toLocalDateOnly(endDate).getTime() - toLocalDateOnly(startDate).getTime();
  return Math.floor(ms / 86400000);
}

// function normalizeExtensionPlans(product, tenureUnit) {
//   const cfgs = Array.isArray(product?.rentalConfigurations)
//     ? product.rentalConfigurations
//     : [];
//   const out = cfgs
//     .map((cfg, idx) => {
//       const unit =
//         String(cfg?.periodUnit || '').toLowerCase() === 'day' ? 'day' : 'month';
//       if (unit !== tenureUnit) return null;
//       const months = Math.max(0, Number(cfg?.months || 0));
//       const days = Math.max(0, Number(cfg?.days || 0));
//       const duration = unit === 'day' ? days : months;
//       if (duration <= 0) return null;
//       const unitRent = Number(cfg?.customerRent || cfg?.pricePerDay || 0);
//       if (!Number.isFinite(unitRent) || unitRent <= 0) return null;
//       return {
//         id: `${unit}-${duration}-${idx}`,
//         unit,
//         duration,
//         unitRent,
//       };
//     })
//     .filter(Boolean)
//     .sort((a, b) => a.duration - b.duration);
//   return out;
// }
function normalizeExtensionPlans(product, tenureUnit) {
  const cfgs = Array.isArray(product?.rentalConfigurations)
    ? product.rentalConfigurations
    : [];
  const out = cfgs
    .map((cfg, idx) => {
      const unit =
        String(cfg?.periodUnit || '').toLowerCase() === 'day' ? 'day' : 'month';
      if (unit !== tenureUnit) return null;
      const months = Math.max(0, Number(cfg?.months || 0));
      const days = Math.max(0, Number(cfg?.days || 0));
      const duration = unit === 'day' ? days : months;
      if (duration <= 0) return null;
      const unitRent = Number(cfg?.customerRent || cfg?.pricePerDay || 0);
      if (!Number.isFinite(unitRent) || unitRent <= 0) return null;
      return {
        id: `${unit}-${duration}-${idx}`,
        unit,
        duration,
        unitRent, // base price before offer
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.duration - b.duration);
  return out;
}

export default function RentalCommandCenter() {
  const { pushToast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [offersByProduct, setOffersByProduct] = useState({});
  const [extendState, setExtendState] = useState({
    open: false,
    row: null,
    selectedPlanId: '',
  });
  const [confirmingExtend, setConfirmingExtend] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [pickupAnchorDate, setPickupAnchorDate] = useState(null); // null = today
  const [returnState, setReturnState] = useState({
    open: false,
    row: null,
    pickupDateIso: '',
    step: 1,
    refundMethod: '',
    bankAccountName: '',
    bankAccountNumber: '',
    bankIfsc: '',
    upiId: '',
    reviewRating: 0,
    reviewText: '',
    mediaNames: [],
    mediaPreviews: [],
    mediaFiles: [],
  });
  const [submittingReturn, setSubmittingReturn] = useState(false);
  const [pickupScheduled, setPickupScheduled] = useState({
    open: false,
    orderId: '',
    productName: '',
    pickupSubtitle: '',
    refundableDeposit: 0,
    extensionFine: 0,
    netEstimate: 0,
  });
  const [issueState, setIssueState] = useState({
    open: false,
    row: null,
    issueType: '',
    description: '',
    photoNames: [],
    photoFiles: [],
    photoPreviews: [],
  });
  const [submittingIssue, setSubmittingIssue] = useState(false);

  useEffect(() => {
    if (!issueState.open) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [issueState.open]);

  useEffect(() => {
    setLoading(true);
    setError('');
    apiGetMyOrders()
      .then((res) => setOrders(res.data || []))
      .catch((err) => {
        setOrders([]);
        setError(err.response?.data?.message || 'Failed to load rentals.');
      })
      .finally(() => setLoading(false));
  }, []);

  const rentals = useMemo(() => flattenRentals(orders), [orders]);
  const openReturnFromQuery = searchParams.get('openReturn') === '1';
  const requestedOrderId = searchParams.get('orderId') || '';
  const requestedProductId = searchParams.get('productId') || '';
  const today = startOfDay(new Date());

  useEffect(() => {
    if (!openReturnFromQuery || loading) return;
    if (!requestedOrderId || !requestedProductId) return;
    if (!rentals.length) return;
    if (returnState.open) return;

    const targetRow = rentals.find(
      (row) =>
        String(row?.order?._id || '') === String(requestedOrderId) &&
        String(row?.product?._id || '') === String(requestedProductId),
    );
    if (!targetRow) return;

    setReturnState((prev) => ({
      ...prev,
      open: true,
      row: targetRow,
      pickupDateIso: '',
      step: 1,
      refundMethod: '',
      bankAccountName: '',
      bankAccountNumber: '',
      bankIfsc: '',
      upiId: '',
      reviewRating: 0,
      reviewText: '',
      mediaNames: [],
      mediaPreviews: [],
      mediaFiles: [],
    }));
    router.replace('/my-rentals');
  }, [
    openReturnFromQuery,
    requestedOrderId,
    requestedProductId,
    loading,
    rentals,
    returnState.open,
    router,
  ]);

  // const extensionPlans = useMemo(() => {
  //   if (!extendState.row) return [];
  //   return normalizeExtensionPlans(
  //     extendState.row.product,
  //     extendState.row.tenureUnit,
  //   );
  // }, [extendState.row]);
  const extensionPlans = useMemo(() => {
    if (!extendState.row) return [];
    return normalizeExtensionPlans(
      extendState.row.product,
      extendState.row.tenureUnit,
    );
  }, [extendState.row]);

  useEffect(() => {
    if (!extendState.open) return;
    const firstId = extensionPlans[0]?.id || '';
    setExtendState((prev) => ({
      ...prev,
      selectedPlanId:
        prev.selectedPlanId &&
        extensionPlans.some((p) => p.id === prev.selectedPlanId)
          ? prev.selectedPlanId
          : firstId,
    }));
  }, [extendState.open, extensionPlans]);

  const selectedExtensionPlan = useMemo(
    () =>
      extensionPlans.find((p) => p.id === extendState.selectedPlanId) ||
      extensionPlans[0] ||
      null,
    [extensionPlans, extendState.selectedPlanId],
  );

  const closeExtendModal = () =>
    setExtendState({ open: false, row: null, selectedPlanId: '' });

  // const closeReturnModal = () =>
  //   setReturnState((prev) => {
  //     (prev.mediaPreviews || []).forEach((item) => {
  //       if (item?.url) URL.revokeObjectURL(item.url);
  //     });
  //     return {
  //       open: false,
  //       row: null,
  //       pickupDateIso: '',
  //       step: 1,
  //       refundMethod: '',
  //       bankAccountName: '',
  //       bankAccountNumber: '',
  //       bankIfsc: '',
  //       upiId: '',
  //       reviewRating: 0,
  //       reviewText: '',
  //       mediaNames: [],
  //       mediaPreviews: [],
  //       mediaFiles: [],
  //     };
  //   });

  const closeReturnModal = () => {
    setReturnState((prev) => {
      (prev.mediaPreviews || []).forEach((item) => {
        if (item?.url) URL.revokeObjectURL(item.url);
      });
      return {
        open: false,
        row: null,
        pickupDateIso: '',
        step: 1,
        refundMethod: '',
        bankAccountName: '',
        bankAccountNumber: '',
        bankIfsc: '',
        upiId: '',
        reviewRating: 0,
        reviewText: '',
        mediaNames: [],
        mediaPreviews: [],
        mediaFiles: [],
      };
    });
    setPickupAnchorDate(null);
    setCalendarOpen(false);
  };
  const closeIssueModal = () =>
    setIssueState((prev) => {
      (prev.photoPreviews || []).forEach((item) => {
        if (item?.url) URL.revokeObjectURL(item.url);
      });
      return {
        open: false,
        row: null,
        issueType: '',
        description: '',
        photoNames: [],
        photoFiles: [],
        photoPreviews: [],
      };
    });

  const applySelectedMedia = (incomingFiles) => {
    const files = Array.from(incomingFiles || []).slice(0, 10);
    setReturnState((prev) => {
      (prev.mediaPreviews || []).forEach((item) => {
        if (item?.url) URL.revokeObjectURL(item.url);
      });
      return {
        ...prev,
        mediaNames: files.map((f) => f.name),
        mediaFiles: files,
        mediaPreviews: files.map((file) => ({
          name: file.name,
          type: file.type || '',
          url: URL.createObjectURL(file),
        })),
      };
    });
  };

  const removeSelectedMediaAt = (index) => {
    setReturnState((prev) => {
      const existing = prev.mediaPreviews || [];
      const target = existing[index];
      if (target?.url) URL.revokeObjectURL(target.url);
      const nextPreviews = existing.filter((_, i) => i !== index);
      return {
        ...prev,
        mediaPreviews: nextPreviews,
        mediaNames: nextPreviews.map((item) => item.name),
        mediaFiles: (prev.mediaFiles || []).filter((_, i) => i !== index),
      };
    });
  };

  const applyIssuePhotos = (incomingFiles) => {
    const files = Array.from(incomingFiles || []).slice(0, 5);
    setIssueState((prev) => {
      (prev.photoPreviews || []).forEach((item) => {
        if (item?.url) URL.revokeObjectURL(item.url);
      });
      return {
        ...prev,
        photoNames: files.map((f) => f.name),
        photoFiles: files,
        photoPreviews: files.map((file) => ({
          name: file.name,
          type: file.type || '',
          url: URL.createObjectURL(file),
        })),
      };
    });
  };

  const removeIssuePhotoAt = (index) => {
    setIssueState((prev) => {
      const existing = prev.photoPreviews || [];
      const target = existing[index];
      if (target?.url) URL.revokeObjectURL(target.url);
      const nextPreviews = existing.filter((_, i) => i !== index);
      return {
        ...prev,
        photoPreviews: nextPreviews,
        photoNames: nextPreviews.map((item) => item.name),
        photoFiles: (prev.photoFiles || []).filter((_, i) => i !== index),
      };
    });
  };

  const handleSubmitIssueReport = async () => {
    if (!issueState.row) return;
    if (!issueState.issueType) {
      pushToast('Please select the issue type.', 'error');
      return;
    }
    if ((issueState.photoFiles || []).length < 1) {
      pushToast('Please upload at least 1 photo.', 'error');
      return;
    }
    if (String(issueState.description || '').trim().length < 10) {
      pushToast('Please add at least 10 characters in description.', 'error');
      return;
    }

    const orderId = String(issueState.row.order?._id || '');
    const productId = String(issueState.row.product?._id || '');
    if (!orderId || !productId) return;

    const payload = new FormData();
    payload.append('productId', productId);
    payload.append('issueType', issueState.issueType);
    payload.append('description', issueState.description || '');
    payload.append('photoNames', JSON.stringify(issueState.photoNames || []));
    (issueState.photoFiles || []).slice(0, 5).forEach((file) => {
      payload.append('issuePhotos', file);
    });

    try {
      setSubmittingIssue(true);
      const res = await apiSubmitMyIssueReport(orderId, payload);
      const updatedOrder = res.data;
      setOrders((prev) =>
        prev.map((o) =>
          String(o?._id || '') === String(updatedOrder?._id || '')
            ? updatedOrder
            : o,
        ),
      );
      pushToast(
        'Issue reported successfully. Our team will review it shortly.',
        'success',
      );
      closeIssueModal();
    } catch (err) {
      pushToast(
        err?.response?.data?.message || 'Failed to submit issue report.',
        'error',
      );
    } finally {
      setSubmittingIssue(false);
    }
  };

  const handleSubmitReturnRequest = async () => {
    if (!returnState.row) return;
    if (!returnState.refundMethod) {
      pushToast('Please select payment plan', 'error');
      return;
    }
    const orderId = String(returnState.row.order?._id || '');
    const productId = String(returnState.row.product?._id || '');
    if (!orderId || !productId) return;

    const payload = new FormData();
    payload.append('productId', productId);
    payload.append('pickupDate', returnState.pickupDateIso || '');
    payload.append('refundMethod', returnState.refundMethod || 'original');
    payload.append('upiId', returnState.upiId || '');
    payload.append('bankAccountName', returnState.bankAccountName || '');
    payload.append('bankAccountNumber', returnState.bankAccountNumber || '');
    payload.append('bankIfsc', returnState.bankIfsc || '');
    if (returnState.reviewRating) {
      payload.append('rating', String(returnState.reviewRating));
    }
    payload.append('reviewText', returnState.reviewText || '');
    (returnState.mediaFiles || []).slice(0, 10).forEach((file) => {
      payload.append('mediaFiles', file);
    });

    console.log('[return-review] submit clicked', {
      orderId,
      productId,
      step: returnState.step,
      payload,
    });

    try {
      setSubmittingReturn(true);
      const calcSnapshot = returnCalc;
      const rowSnapshot = returnState.row;
      const res = await apiSubmitMyReturnRequest(orderId, payload);
      console.log('[return-review] API success', {
        status: res?.status,
        data: res?.data,
      });
      const updatedOrder = res.data;
      setOrders((prev) =>
        prev.map((o) =>
          String(o?._id || '') === String(updatedOrder?._id || '')
            ? updatedOrder
            : o,
        ),
      );
      pushToast('Return request submitted successfully.', 'success');
      closeReturnModal();
      if (calcSnapshot && rowSnapshot) {
        const pd = calcSnapshot.pickupDate;
        const datePart = pd.toLocaleString('en-IN', {
          day: 'numeric',
          month: 'short',
        });
        setPickupScheduled({
          open: true,
          orderId: String(rowSnapshot.order?._id || ''),
          productName: rowSnapshot.product?.productName || 'Rental item',
          pickupSubtitle: `Our team will collect the item on ${datePart}, 1-4 PM`,
          refundableDeposit: calcSnapshot.refundableDeposit,
          extensionFine: calcSnapshot.extensionFine,
          netEstimate: Math.max(0, calcSnapshot.netBalance),
        });
      }
    } catch (err) {
      console.log('[return-review] API error', {
        status: err?.response?.status,
        data: err?.response?.data,
        message: err?.message,
      });
      pushToast(
        err?.response?.data?.message || 'Failed to submit return request.',
        'error',
      );
    } finally {
      setSubmittingReturn(false);
    }
  };

  const proceedToReviewStep = () => {
    if (!returnState.refundMethod) {
      pushToast('Please select payment plan', 'error');
      return;
    }
    setReturnState((prev) => ({ ...prev, step: 3 }));
  };

  // const returnDateOptions = useMemo(() => {
  //   if (!returnState.row) return [];
  //   const base = toLocalDateOnly(new Date());
  //   return Array.from({ length: 7 }).map((_, i) => {
  //     const dt = new Date(base);
  //     dt.setDate(base.getDate() + i);
  //     return dt;
  //   });
  // }, [returnState.row]);
  const returnDateOptions = useMemo(() => {
    if (!returnState.row) return [];
    const base = toLocalDateOnly(pickupAnchorDate || new Date());
    return Array.from({ length: 7 }).map((_, i) => {
      const dt = new Date(base);
      dt.setDate(base.getDate() + i);
      return dt;
    });
  }, [returnState.row, pickupAnchorDate]);

  useEffect(() => {
    if (!returnState.open || !returnState.row) return;
    const initial = toLocalDateOnly(new Date());
    setReturnState((prev) =>
      prev.pickupDateIso
        ? prev
        : { ...prev, pickupDateIso: initial.toISOString() },
    );
  }, [returnState.open, returnState.row]);

  useEffect(() => {
    setLoading(true);
    setError('');
    Promise.all([apiGetMyOrders(), apiGetPublicActiveOffers()])
      .then(([ordRes, offRes]) => {
        setOrders(ordRes.data || []);
        const map = {};
        (offRes.data?.offers || []).forEach((o) => {
          map[String(o.productId)] = o;
        });
        setOffersByProduct(map);
      })
      .catch((err) => {
        setOrders([]);
        setError(err.response?.data?.message || 'Failed to load rentals.');
      })
      .finally(() => setLoading(false));
  }, []);

  const returnCalc = useMemo(() => {
    if (!returnState.row || !returnState.pickupDateIso) return null;
    const selected = new Date(returnState.pickupDateIso);
    if (Number.isNaN(selected.getTime())) return null;

    const endDate = toLocalDateOnly(returnState.row.end);
    const pickupDate = toLocalDateOnly(selected);
    const lateDays = Math.max(0, daysBetween(endDate, pickupDate));

    const line = returnState.row.line;
    const fineRatePerDay = 50;
    const refundableDeposit = lineDeposit(line, returnState.row.product);

    // const hasExtension =
    //   Number(returnState.row.order?.extendedDurationTotal || 0) > 0;

    // // Extension fine must come from extended tenure itself (not pickup-date changes).
    // const extendedDurationRaw = Math.max(
    //   0,
    //   Number(returnState.row.order?.extendedDurationTotal || 0),
    // );
    // const extensionUnit =
    //   String(returnState.row.order?.tenureUnit || '').toLowerCase() === 'day'
    //     ? 'day'
    //     : 'month';
    // const extendedDays =
    //   extensionUnit === 'day'
    //     ? extendedDurationRaw
    //     : Math.round(extendedDurationRaw * 30);

    // const extensionFine = hasExtension ? extendedDays * fineRatePerDay : 0;
    // const netBalance = refundableDeposit - extensionFine;

    const extendedDays = Math.max(0, daysBetween(endDate, pickupDate));
    const gracePeriodDays = 2;
    const chargeableDays = Math.max(0, extendedDays - gracePeriodDays);
    const hasExtension = extendedDays > 0;
    const extensionFine = chargeableDays * fineRatePerDay;
    const netBalance = refundableDeposit - extensionFine;

    return {
      pickupDate,
      endDate,
      hasExtension,
      lateDays,
      extendedDays,
      fineRatePerDay,
      extensionFine,
      refundableDeposit,
      netBalance,
    };
  }, [returnState]);

  // const handleConfirmExtension = async () => {
  //   if (!extendState.row || !selectedExtensionPlan) return;
  //   const orderId = String(extendState.row.order?._id || '');
  //   if (!orderId) return;

  //   // const increment = Number(selectedExtensionPlan.duration || 0);
  //   // if (!Number.isFinite(increment) || increment <= 0) return;

  //   // const productId = String(extendState.row.product?._id || '');
  //   // In RentalCommandCenter — replace the try block inside handleConfirmExtension
  //   const increment = Number(selectedExtensionPlan.duration || 0);
  //   if (!Number.isFinite(increment) || increment <= 0) return;
  //   const productId = String(extendState.row.product?._id || '');

  //   // Store extension intent for the payment page to pick up
  //   localStorage.setItem(
  //     'rentpay_pending_extension',
  //     JSON.stringify({
  //       orderId,
  //       productId,
  //       extensionUnit: selectedExtensionPlan.unit,
  //       extensionDuration: increment,
  //       newUnitRent: selectedExtensionPlan.unitRent,
  //       label: `${selectedExtensionPlan.duration} ${selectedExtensionPlan.unit === 'day' ? 'day' : 'month'} extension`,
  //     }),
  //   );

  //   closeExtendModal();
  //   router.push('/payment?mode=extension');

  //   try {
  //     setConfirmingExtend(true);
  //     const res = await apiExtendMyOrderTenure(orderId, {
  //       extensionUnit: selectedExtensionPlan.unit,
  //       extensionDuration: increment,
  //       newUnitRent: selectedExtensionPlan.unitRent,
  //       productId,
  //     });
  //     const updated = res.data;
  //     setOrders((prev) =>
  //       prev.map((o) => (String(o?._id || '') === orderId ? updated : o)),
  //     );
  //     pushToast('Tenure extension saved successfully.', 'success');
  //     closeExtendModal();
  //   } catch (err) {
  //     pushToast(
  //       err?.response?.data?.message ||
  //         'Failed to extend tenure. Please try again.',
  //       'error',
  //     );
  //   } finally {
  //     setConfirmingExtend(false);
  //   }
  // };

  const handleConfirmExtension = async () => {
    if (!extendState.row || !selectedExtensionPlan) return;
    const orderId = String(extendState.row.order?._id || '');
    if (!orderId) return;

    const increment = Number(selectedExtensionPlan.duration || 0);
    if (!Number.isFinite(increment) || increment <= 0) return;

    const productId = String(extendState.row.product?._id || '');

    // Store extension intent for payment page
    localStorage.setItem(
      'rentpay_pending_extension',
      JSON.stringify({
        orderId,
        productId,
        extensionUnit: selectedExtensionPlan.unit,
        extensionDuration: increment,
        newUnitRent: selectedExtensionPlan.unitRent,
        label: `${selectedExtensionPlan.duration} ${selectedExtensionPlan.unit === 'day' ? 'day' : 'month'} extension`,
      }),
    );

    closeExtendModal();
    router.push('/payment?mode=extension');
  };
  return (
    <div className="min-h-screen bg-[#F4F6FB] pb-12">
      <div className="max-w-6xl mx-auto px-4 py-8 lg:py-10">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Sofa className="w-7 h-7 text-blue-600 shrink-0" aria-hidden />
              <h1 className="text-2xl lg:text-3xl font-bold text-black">
                Rental Command Center
              </h1>
            </div>
            <p className="text-sm text-gray-500 mb-8">
              Active Rentals ({rentals.length}{' '}
              {rentals.length === 1 ? 'Item' : 'Items'})
            </p>

            {loading ? (
              <div className="flex justify-center py-16">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : error ? (
              <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl p-4">
                {error}
              </div>
            ) : rentals.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-10 text-center">
                <p className="text-gray-700 font-medium">
                  No active rentals yet
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  After your order is marked delivered, your rentals appear here
                  with tenure and payment details.
                </p>
                <Link
                  href="/rent"
                  className="inline-flex mt-6 px-6 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
                >
                  Browse rentals
                </Link>
              </div>
            ) : (
              <div className="space-y-8">
                {rentals.map(
                  ({ order, line, product, start, end, tenureUnit }, idx) => {
                    const title =
                      product.productName || product.title || 'Rented product';
                    const img = productImageUrl(product.image);
                    const vendorName =
                      product.vendorId?.fullName ||
                      product.vendorId?.emailAddress ||
                      'Vendor';
                    const city =
                      product.logisticsVerification?.city?.trim() ||
                      'Your city';

                    const qty = Number(line.quantity || 1);
                    const rate = Number(line.pricePerDay || 0);
                    const dur = Math.max(1, Number(order.rentalDuration || 1));
                    const isDay = tenureUnit === 'day';

                    // const unitRent = rate * qty;
                    // const lineTotalRent = unitRent * dur;

                    // // rate is the TOTAL price for full tenure, divide by duration to get per-unit
                    // const perUnitRent =
                    //   dur > 0 ? Math.round(unitRent / dur) : unitRent;
                    const totalPrice = Number(line.pricePerDay || 0) * qty;
                    const perUnitRent = Math.round(totalPrice / dur);
                    const unitRent = totalPrice;
                    const lineTotalRent = totalPrice;

                    // const rentPrimaryLabel = isDay
                    //   ? `₹${formatMoney(perUnitRent)}/day`
                    //   : `₹${formatMoney(perUnitRent)}/mo`;
                    const rentPrimaryLabel = isDay
                      ? `₹${formatMoney(unitRent)}/3day`
                      : `₹${formatMoney(unitRent)}/3mo`;
                    const rentCardTitle = isDay ? 'Daily rent' : 'Monthly rent';
                    // const rentSubline = isDay
                    //   ? `${dur} day${dur === 1 ? '' : 's'} tenure · ₹${formatMoney(lineTotalRent)} total`
                    //   : `${dur} month${dur === 1 ? '' : 's'} tenure · ₹${formatMoney(lineTotalRent)} total`;

                    const deposit = lineDeposit(line, product);
                    const nextPay = computeNextPaymentLabel(start, end);
                    // const discounted = isDay
                    //   ? Math.max(1, Math.round(unitRent * 0.92))
                    //   : Math.max(
                    //       1,
                    //       unitRent - Math.max(50, Math.round(unitRent * 0.08)),
                    //     );

                    // Get the longest duration plan and its per-unit price
                    const extensionPlansForCard = normalizeExtensionPlans(
                      product,
                      tenureUnit,
                    );
                    const longestPlan = extensionPlansForCard.length
                      ? extensionPlansForCard[extensionPlansForCard.length - 1]
                      : null;

                    // Per-unit price of longest plan (divide total by duration)
                    const longestPlanPerUnit = longestPlan
                      ? Math.round(longestPlan.unitRent / longestPlan.duration)
                      : 0;

                    // Apply offer discount if exists
                    const cardOffer =
                      offersByProduct[String(product?._id || '')];
                    const cardOfferDiscount = Number(
                      cardOffer?.discountPercent || 0,
                    );
                    const discountedPerUnit =
                      longestPlanPerUnit > 0 && cardOfferDiscount > 0
                        ? Math.max(
                            1,
                            Math.round(
                              longestPlanPerUnit -
                                (longestPlanPerUnit * cardOfferDiscount) / 100,
                            ),
                          )
                        : longestPlanPerUnit;

                    const totalMs = end.getTime() - start.getTime();
                    const elapsedMs = Math.min(
                      Math.max(
                        today.getTime() - startOfDay(start).getTime(),
                        0,
                      ),
                      totalMs,
                    );
                    const progressPct =
                      totalMs <= 0
                        ? 100
                        : Math.min(100, (elapsedMs / totalMs) * 100);

                    const daysLeft = Math.ceil(
                      (startOfDay(end).getTime() - today.getTime()) / 86400000,
                    );
                    const isEnded = daysLeft <= 0;
                    const isUrgent = !isEnded && daysLeft <= 5;

                    const activity = buildActivity(order, lineTotalRent);

                    const progressBox = isEnded
                      ? {
                          wrap: 'bg-red-50 border border-red-100',
                          headline: 'text-red-800',
                          bar: 'bg-red-500',
                        }
                      : isUrgent
                        ? {
                            wrap: 'bg-amber-50 border border-amber-100',
                            headline: 'text-amber-800',
                            bar: 'bg-amber-500',
                          }
                        : {
                            wrap: 'bg-blue-50 border border-blue-100',
                            headline: 'text-blue-800',
                            bar: 'bg-blue-500',
                          };

                    const cardBorder = isEnded
                      ? 'border-2 border-red-200 ring-1 ring-red-100'
                      : isUrgent
                        ? 'border-2 border-amber-200 ring-1 ring-amber-100'
                        : 'border-2 border-blue-100 ring-1 ring-blue-50';

                    return (
                      <article
                        key={`${order._id}-${String(line.product?._id || line.product || idx)}-${idx}`}
                        className={`bg-white rounded-xl shadow-sm overflow-hidden ${cardBorder}`}
                      >
                        <div className="p-4 sm:p-6">
                          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden bg-gray-100 shrink-0 relative">
                              {img ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={img}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                  No image
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-start justify-between gap-2">
                                <div>
                                  <h2 className="text-lg font-bold text-black">
                                    {title}
                                  </h2>
                                  <p className="text-sm text-gray-500 mt-0.5">
                                    Rented from: {vendorName}
                                    {city ? ` (${city})` : ''}
                                  </p>
                                </div>
                                {isEnded ? (
                                  <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full bg-gray-100 text-gray-700">
                                    <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
                                    Ended
                                  </span>
                                ) : isUrgent ? (
                                  <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                                    Expiring in {daysLeft}{' '}
                                    {daysLeft === 1 ? 'Day' : 'Days'}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    Active
                                  </span>
                                )}
                              </div>

                              <div
                                className={`mt-6 rounded-xl px-4 py-5 ${progressBox.wrap}`}
                              >
                                <p className="text-center text-xs text-gray-500 uppercase tracking-wide">
                                  Tenure progress
                                </p>
                                <p
                                  className={`text-center text-2xl font-bold mt-1 ${progressBox.headline}`}
                                >
                                  {isEnded
                                    ? 'Tenure ended'
                                    : `${daysLeft} ${daysLeft === 1 ? 'Day' : 'Days'} remaining`}
                                </p>
                                <div className="mt-6 relative pt-2">
                                  <div className="h-2.5 rounded-full bg-gray-200/90 overflow-hidden">
                                    <div
                                      className={`h-full rounded-full transition-all ${progressBox.bar}`}
                                      style={{ width: `${progressPct}%` }}
                                    />
                                  </div>
                                  <div
                                    className="absolute top-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white shadow-sm -translate-x-1/2"
                                    style={{ left: `${progressPct}%` }}
                                    title="Today"
                                  />
                                  <div className="flex justify-between mt-2 text-[11px] text-gray-500">
                                    <span>{formatShortDate(start)}</span>
                                    <span className="text-gray-600 font-medium">
                                      Today
                                    </span>
                                    <span>{formatShortDate(end)}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                                <div className="rounded-lg border-2 border-[#BEDBFF] bg-[#EFF6FF] p-4">
                                  {/* <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-2">
                                    <BarChart3 className="w-4 h-4 text-blue-600" />
                                    {rentCardTitle}
                                  </div> */}
                                  <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-2">
                                    <img
                                      src={graphHighIcon.src}
                                      alt="Graph"
                                      className="w-4 h-4 shrink-0"
                                    />
                                    {rentCardTitle}
                                  </div>
                                  <p className="text-lg font-bold text-black">
                                    {rentPrimaryLabel}
                                  </p>
                                  {/* <p className="text-xs text-gray-600 mt-1">
                                    {rentSubline}
                                  </p> */}

                                  <p className="text-xs text-emerald-600 mt-1 font-medium">
                                    Auto-pay active
                                  </p>
                                </div>
                                <div className="rounded-lg border-2 border-[#B9F8CF] bg-[#F0FDF4] p-4">
                                  <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-2">
                                    <Shield className="w-4 h-4 text-emerald-600" />
                                    Security deposit
                                  </div>
                                  <p className="text-lg font-bold text-black">
                                    ₹{formatMoney(deposit)}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    Refundable
                                  </p>
                                </div>
                                {/* <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-4">
                                  <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-2">
                                    <Calendar className="w-4 h-4 text-violet-600" />
                                    Next payment
                                  </div>
                                  <p className="text-lg font-bold text-black">
                                    {nextPay}
                                  </p>
                                </div> */}
                                <div className="rounded-lg border-2 border-[#E9D4FF] bg-gray-[#FAF5FF] p-4">
                                  <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-2">
                                    <Calendar className="w-4 h-4 text-violet-600" />
                                    Next payment
                                  </div>
                                  <p className="text-lg font-bold text-black">
                                    {end.toLocaleString('en-IN', {
                                      day: 'numeric',
                                      month: 'short',
                                      year: 'numeric',
                                    })}
                                  </p>
                                  {/* <p className="text-xs text-gray-500 mt-1">
                                    {isEnded
                                      ? 'Tenure completed'
                                      : `${daysLeft} day${daysLeft === 1 ? '' : 's'} left`}
                                  </p> */}
                                </div>
                              </div>
                              {/* 
                              {!isEnded ? (
                                <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50/50 px-4 py-4">
                                  <p className="text-sm text-gray-700">
                                    {isDay
                                      ? 'Want to keep it longer? Extend at '
                                      : 'Want to keep it longer? Extend for another month at '}
                                    <span className="font-semibold text-blue-700">
                                      ₹{formatMoney(discounted)}
                                      {isDay ? '/day' : '/mo'}
                                    </span>{' '}
                                    <span className="text-blue-600">
                                      (Discounted!)
                                    </span>
                                  </p>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setExtendState({
                                        open: true,
                                        row: {
                                          order,
                                          line,
                                          product,
                                          start,
                                          end,
                                          tenureUnit,
                                        },
                                        selectedPlanId: '',
                                      })
                                    }
                                    className="inline-flex items-center justify-center gap-2 shrink-0 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
                                  >
                                    <Clock className="w-4 h-4" />
                                    Extend tenure
                                  </button>
                                </div>
                              ) : null} */}

                              {!isEnded && longestPlan ? (
                                <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50/50 px-4 py-4">
                                  <p className="text-sm text-gray-700">
                                    <span className="block font-bold text-black text-lg">
                                      Want to keep it longer?
                                    </span>

                                    <span className="block">
                                      Extend up to{' '}
                                      <span className="font-semibold text-blue-700">
                                        ₹{formatMoney(discountedPerUnit)}
                                        {isDay ? '/day' : '/mo'}
                                      </span>{' '}
                                      {cardOfferDiscount > 0 && (
                                        <span className="text-blue-600">
                                          (Discounted!)
                                        </span>
                                      )}
                                    </span>
                                  </p>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setExtendState({
                                        open: true,
                                        row: {
                                          order,
                                          line,
                                          product,
                                          start,
                                          end,
                                          tenureUnit,
                                        },
                                        selectedPlanId: '',
                                      })
                                    }
                                    className="inline-flex items-center justify-center gap-2 shrink-0 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
                                  >
                                    <Clock className="w-4 h-4" />
                                    Extend tenure
                                  </button>
                                </div>
                              ) : null}

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setReturnState((prev) => {
                                      (prev.mediaPreviews || []).forEach(
                                        (item) => {
                                          if (item?.url)
                                            URL.revokeObjectURL(item.url);
                                        },
                                      );
                                      return {
                                        open: true,
                                        row: {
                                          order,
                                          line,
                                          product,
                                          start,
                                          end,
                                          tenureUnit,
                                        },
                                        pickupDateIso: '',
                                        step: 1,
                                        refundMethod: '',
                                        bankAccountName: '',
                                        bankAccountNumber: '',
                                        bankIfsc: '',
                                        upiId: '',
                                        reviewRating: 0,
                                        reviewText: '',
                                        mediaNames: [],
                                        mediaPreviews: [],
                                        mediaFiles: [],
                                      };
                                    })
                                  }
                                  className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 border-gray-200 text-gray-800 text-sm font-medium hover:bg-gray-50"
                                >
                                  <Truck className="w-4 h-4" />
                                  Request return / Pickup
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setIssueState((prev) => {
                                      (prev.photoPreviews || []).forEach(
                                        (item) => {
                                          if (item?.url)
                                            URL.revokeObjectURL(item.url);
                                        },
                                      );
                                      return {
                                        open: true,
                                        row: {
                                          order,
                                          line,
                                          product,
                                          start,
                                          end,
                                          tenureUnit,
                                        },
                                        issueType: '',
                                        description: '',
                                        photoNames: [],
                                        photoFiles: [],
                                        photoPreviews: [],
                                      };
                                    })
                                  }
                                  className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 border-gray-200 text-gray-800 text-sm font-medium hover:bg-gray-50"
                                >
                                  <Wrench className="w-4 h-4" />
                                  Report issue / Repair
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="mt-8 pt-6 border-t border-gray-100">
                            <h3 className="text-sm font-bold text-black mb-4">
                              Recent activity
                            </h3>
                            <ul className="space-y-3">
                              {activity.map((row, i) => (
                                <li
                                  key={i}
                                  className="flex items-start justify-between gap-3 text-sm"
                                >
                                  <span className="flex items-start gap-2 min-w-0 text-gray-700">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                                    <span>{row.text}</span>
                                  </span>
                                  <span className="text-gray-400 text-xs shrink-0 tabular-nums">
                                    {row.date.toLocaleString('en-IN', {
                                      month: 'short',
                                      day: 'numeric',
                                    })}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </article>
                    );
                  },
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      {extendState.open && extendState.row ? (
        <div className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl rounded-tr-2xl rounded-br-2xl shadow-2xl [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex items-start justify-between p-5 border-b border-gray-100">
              <div>
                <h2 className="text-2xl font-bold text-black">
                  Extend your Rental
                </h2>
                {/* <p className="text-sm text-gray-600 mt-1">
                  For{' '}
                  {extendState.row.product?.productName || 'this rental item'}
                </p> */}
                <p className="text-sm text-[#64748B] mt-1">
                  For{' '}
                  <span className="font-bold text-black">
                    {extendState.row.product?.productName || 'this rental item'}
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={closeExtendModal}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
                aria-label="Close extension modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-6">
              {/* <div className="rounded-lg border font-bold border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-800">
                Current tenure ends:{' '}
                <span className="font-normal">
                  {formatShortDate(extendState.row.end)}
                </span>
              </div> */}
              <div className="rounded-lg border font-bold border-[#BEDBFF] bg-[#EFF6FF] px-3 py-2 text-sm text-[#1C398E] flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-[#1C398E]" />
                <span>
                  Current tenure ends:{' '}
                  <span className="font-normal">
                    {formatShortDate(extendState.row.end)}
                  </span>
                </span>
              </div>

              <div>
                <h3 className="text-1xl font-semibold text-black mb-3">
                  Choose Extension Duration
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {extensionPlans.map((plan) => {
                    const active = selectedExtensionPlan?.id === plan.id;
                    const unitLabel = plan.unit === 'day' ? 'day' : 'mo';

                    // Get offer for this product (same as RentPrdctMain)
                    const productOffer =
                      offersByProduct[
                        String(extendState.row?.product?._id || '')
                      ];
                    const offerDiscount = Number(
                      productOffer?.discountPercent || 0,
                    );
                    const hasOffer = offerDiscount > 0;
                    const displayPrice = hasOffer
                      ? Math.max(
                          0,
                          Math.round(
                            plan.unitRent -
                              (plan.unitRent * offerDiscount) / 100,
                          ),
                        )
                      : plan.unitRent;

                    return (
                      <button
                        key={plan.id}
                        type="button"
                        onClick={() =>
                          setExtendState((prev) => ({
                            ...prev,
                            selectedPlanId: plan.id,
                          }))
                        }
                        className={`relative rounded-xl border px-4 py-3 text-left transition-colors ${
                          active
                            ? 'border-orange-400 bg-orange-50 ring-2 ring-orange-300'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        {hasOffer && (
                          <span className="absolute -top-2.5 right-3 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                            -{offerDiscount}%
                          </span>
                        )}

                        <p className="font-semibold text-base text-center text-black mt-1">
                          +{plan.duration}{' '}
                          {plan.unit === 'day' ? 'Days' : 'Months'}
                        </p>

                        {/* Discounted price */}
                        {/* <p className="text-sm text-gray-700 mt-0.5">
                          ₹{formatMoney(displayPrice)}
                          {hasOffer && (
                            <span className="text-gray-400 line-through ml-1.5 text-xs">
                              ₹{formatMoney(plan.unitRent)}
                            </span>
                          )}
                        </p> */}

                        {/* Save amount in green */}
                        {hasOffer && (
                          <p className="text-xs text-center text-emerald-600 font-semibold mt-1">
                            Save ₹{formatMoney(plan.unitRent - displayPrice)}
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {selectedExtensionPlan ? (
                <>
                  {/* <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                    <div className="grid grid-cols-3 items-center gap-2">
                      <div>
                        <p className="text-sm text-gray-600">Current rate</p>
                        <p className="text-3xl font-bold text-gray-800">
                          ₹
                          {formatMoney(
                            Number(extendState.row.line?.pricePerDay || 0),
                          )}
                          /{selectedExtensionPlan.unit === 'day' ? 'day' : 'mo'}
                        </p>
                      </div>
                      <div className="flex justify-center text-emerald-600">
                        <ArrowRight className="w-8 h-8" />
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">New rate</p>
                        <p className="text-3xl font-bold text-emerald-600">
                          ₹{formatMoney(selectedExtensionPlan.unitRent)}/
                          {selectedExtensionPlan.unit === 'day' ? 'day' : 'mo'}
                        </p>
                      </div>
                    </div>
                  </div> */}

                  {(() => {
                    const productOffer =
                      offersByProduct[
                        String(extendState.row?.product?._id || '')
                      ];
                    const offerDiscount = Number(
                      productOffer?.discountPercent || 0,
                    );
                    const hasOffer = offerDiscount > 0;
                    const dur = selectedExtensionPlan.duration;
                    const unitLabel =
                      selectedExtensionPlan.unit === 'day' ? 'day' : 'mo';
                    const durationLabel =
                      selectedExtensionPlan.unit === 'day'
                        ? `${dur} day${dur > 1 ? 's' : ''}`
                        : `${dur} month${dur > 1 ? 's' : ''}`;

                    // unitRent is the TOTAL price for the full duration (e.g. ₹1000 for 3days)
                    // Divide by duration to get per-day/mo display price
                    const currentTotalPrice = selectedExtensionPlan.unitRent; // e.g. 1000 for 3days
                    const newTotalPrice = hasOffer
                      ? Math.max(
                          0,
                          Math.round(
                            currentTotalPrice -
                              (currentTotalPrice * offerDiscount) / 100,
                          ),
                        )
                      : currentTotalPrice; // e.g. 850 for 3days after 15% off

                    // Per-unit display (divide total by duration)
                    const currentPerUnit = Math.round(currentTotalPrice / dur); // 1000/3 = 333
                    const newPerUnit = Math.round(newTotalPrice / dur); // 850/3 = 283

                    // Savings = difference in total prices
                    const totalSaved = currentTotalPrice - newTotalPrice; // 1000 - 850 = 150

                    return (
                      <>
                        {/* Rate comparison */}
                        <div className="rounded-xl border border-[#B9F8CF] bg-[#ECFDF5] p-4">
                          {/* <div className="grid grid-cols-3 items-center gap-2">
                            <div>
                              <p className="text-sm text-[#64748B]">
                                Current rate
                              </p>
                              <p className="text-3xl font-bold text-[#64748B] line-through decoration-1">
                                ₹{formatMoney(currentPerUnit)}/{unitLabel}
                              </p>
                            </div>
                            <div className="flex  justify-center text-[#16A34A]">
                              <ArrowRight className="w-8 font-bold h-8" />
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-600">New rate</p>
                              <p className="text-3xl font-bold text-[#16A34A]">
                                ₹{formatMoney(newPerUnit)}/{unitLabel}
                              </p>
                         
                            </div>
                          </div> */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-3 text-center sm:text-left">
                            {/* Current Rate */}
                            <div>
                              <p className="text-sm text-[#64748B]">
                                Current rate
                              </p>
                              <p className="text-2xl sm:text-3xl font-bold text-[#64748B] line-through decoration-1">
                                ₹{formatMoney(currentPerUnit)}/{unitLabel}
                              </p>
                            </div>

                            {/* Arrow */}
                            <div className="flex justify-center text-[#16A34A]">
                              <ArrowRight className="w-6 h-6 sm:w-8 sm:h-8" />
                            </div>

                            {/* New Rate */}
                            <div className="sm:text-right">
                              <p className="text-sm text-gray-600">New rate</p>
                              <p className="text-2xl sm:text-3xl font-bold text-[#16A34A]">
                                ₹{formatMoney(newPerUnit)}/{unitLabel}
                              </p>
                            </div>
                          </div>
                          {/* Save banner */}
                          {totalSaved > 0 && (
                            <div className="w-full mt-4 rounded-full bg-[#00C950] text-white py-3 text-lg font-semibold flex items-center justify-center gap-2">
                              <img
                                src={rentalSaveIcon.src}
                                alt="Save"
                                className="w-4 h-4 shrink-0"
                              />
                              <span>
                                Save ₹{formatMoney(totalSaved)} total!
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Updated Timeline */}
                        {/* <div className="rounded-xl border border-gray-200 p-4">
                          <h4 className="text-1xl font-semibold text-black mb-3">
                            Updated Timeline
                          </h4>
                          <div className="flex items-center justify-between text-sm text-gray-600">
                            <div>
                              <p className="font-medium">Current End</p>
                              <p className="text-black font-semibold">
                                {formatShortDate(extendState.row.end)}
                              </p>
                            </div>
                            <span className="text-amber-600 font-semibold">
                              +{selectedExtensionPlan.duration}{' '}
                              {selectedExtensionPlan.unit === 'day'
                                ? 'days'
                                : 'months'}
                            </span>
                            <div className="text-right">
                              <p className="font-medium">New End</p>
                              <p className="text-amber-700 font-semibold">
                                {formatShortDate(
                                  selectedExtensionPlan.unit === 'day'
                                    ? new Date(
                                        extendState.row.end.getFullYear(),
                                        extendState.row.end.getMonth(),
                                        extendState.row.end.getDate() +
                                          selectedExtensionPlan.duration,
                                      )
                                    : new Date(
                                        extendState.row.end.getFullYear(),
                                        extendState.row.end.getMonth() +
                                          selectedExtensionPlan.duration,
                                        extendState.row.end.getDate(),
                                      ),
                                )}
                              </p>
                            </div>
                          </div>
                        </div> */}
                        {/* Updated Timeline */}
                        <div className="space-y-2">
                          <h4 className="text-1xl font-bold text-black ">
                            Updated Timeline
                          </h4>
                          <div
                            className="rounded-xl p-5"
                            style={{
                              background: '#F9FAFB',
                              border: '1px solid #E5E7EB',
                            }}
                          >
                            {(() => {
                              const newEnd =
                                selectedExtensionPlan.unit === 'day'
                                  ? new Date(
                                      extendState.row.end.getFullYear(),
                                      extendState.row.end.getMonth(),
                                      extendState.row.end.getDate() +
                                        selectedExtensionPlan.duration,
                                    )
                                  : new Date(
                                      extendState.row.end.getFullYear(),
                                      extendState.row.end.getMonth() +
                                        selectedExtensionPlan.duration,
                                      extendState.row.end.getDate(),
                                    );

                              const durationLabel = `+${selectedExtensionPlan.duration} ${selectedExtensionPlan.unit === 'day' ? 'months' : 'months'}`;

                              return (
                                <div className="relative">
                                  {/* Timeline track */}
                                  <div className="flex items-center gap-0">
                                    {/* Current End dot */}
                                    <div className="flex flex-col items-center shrink-0">
                                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                                    </div>

                                    {/* Orange line with duration label */}
                                    <div className="flex-1 relative mx-1">
                                      <div className="h-0.5 bg-[#F97316] w-full" />
                                      {/* Arrow head */}
                                      <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1">
                                        <svg
                                          width="8"
                                          height="12"
                                          viewBox="0 0 8 12"
                                          fill="none"
                                        >
                                          <path
                                            d="M0 0L8 6L0 12"
                                            fill="#FB923C"
                                          />
                                        </svg>
                                      </div>
                                      {/* Duration badge in middle */}
                                      <div className="absolute left-1/2 -translate-x-1/2 top-3">
                                        <span className="bg-orange-100 text-[#F97316] text-[11px] font-semibold px-2.5 py-0.5 rounded-full border border-orange-200 whitespace-nowrap">
                                          +{selectedExtensionPlan.duration}{' '}
                                          {selectedExtensionPlan.unit === 'day'
                                            ? 'days'
                                            : 'months'}
                                        </span>
                                      </div>
                                    </div>

                                    {/* New End dot */}
                                    <div className="flex flex-col items-center shrink-0">
                                      <div className="w-3 h-3 rounded-full bg-[#F97316]" />
                                    </div>
                                  </div>

                                  {/* Labels below */}
                                  <div className="flex items-start justify-between mt-3">
                                    <div>
                                      <p className="text-xs text-gray-500 font-medium">
                                        Current End
                                      </p>
                                      <p className="text-sm font-bold text-gray-800 mt-0.5">
                                        {formatShortDate(extendState.row.end)}
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-xs text-[#F97316] font-medium">
                                        New End
                                      </p>
                                      <p className="text-sm font-bold text-[#F97316] mt-0.5">
                                        {formatShortDate(newEnd)}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        </div>

                        {/* Payment Summary */}
                        <div className="space-y-2">
                          <h4 className="text-1xl font-bold text-black ">
                            Payment Summary
                          </h4>
                          <div className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-4">
                            <div className="flex items-center justify-between text-sm py-1">
                              <span className="text-[#64748B]">
                                Extension fee (difference)
                              </span>
                              <span className="font-semibold text-emerald-600">
                                ₹0
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-sm py-1 border-t border-gray-100 mt-1 pt-2">
                              <span className="text-[#64748B]">
                                Total rental cost ({durationLabel})
                              </span>
                              {/* newTotalPrice IS already the total for the full duration — no multiplication */}
                              <span className="font-semibold text-black">
                                ₹{formatMoney(newTotalPrice)}
                              </span>
                            </div>
                            {/* <p className="text-sm text-[#64748B] mt-3 flex items-center gap-2">
                              <Shield className="w-4 h-4 text-blue-600" />
                              Your deposit remains active and refundable at
                              tenure end.
                            </p> */}
                            <p className="text-sm text-[#64748B] mt-3 flex items-center gap-2">
                              <Shield className="w-4 h-4 text-blue-600" />
                              <span>
                                Your deposit of{' '}
                                <span className="font-semibold text-black">
                                  ₹
                                  {Number(
                                    extendState?.row?.product
                                      ?.refundableDeposit || 0,
                                  ).toLocaleString('en-IN')}
                                </span>{' '}
                                remains active and refundable at tenure end.
                              </span>
                            </p>
                          </div>
                        </div>
                      </>
                    );
                  })()}

                  <div className="rounded-xl border border-[#BEDBFF] bg-[#EFF6FF] p-4">
                    <h4 className="text-1xl font-bold text-black mb-2">
                      Why extend your rental?
                    </h4>
                    <ul className="space-y-1 text-sm text-[#64748B]">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Lower rental rates with longer commitments
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        No new deposit or setup fees required
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Continue enjoying hassle-free rentals
                      </li>
                    </ul>
                  </div>

                  <div>
                    <button
                      type="button"
                      onClick={handleConfirmExtension}
                      disabled={confirmingExtend}
                      className="w-full rounded-xl bg-[#FF6F00] text-white py-3.5 text-lg font-semibold hover:bg-[#e56400] disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {confirmingExtend ? 'Saving...' : 'Confirm Extension'}
                    </button>
                    <p className="text-center text-xs text-gray-500 mt-2">
                      No immediate payment required. Billing updates
                      automatically.
                    </p>
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-500">
                  No matching extension tenure options are available for this
                  product.
                </p>
              )}
            </div>
          </div>
        </div>
      ) : null}
      {returnState.open && returnState.row && returnCalc ? (
        <div className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <div className="p-5 border-b border-gray-100 flex items-start justify-between">
              <div>
                <h2 className="text-[18px] leading-[1.2] font-bold text-black">
                  Return Request
                </h2>
                <div className="mt-4 flex items-center gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setReturnState((prev) => ({
                        ...prev,
                        step: 1,
                      }))
                    }
                    className="inline-flex items-center gap-2"
                  >
                    {/* <span
                      className={`w-6 h-6 rounded-full text-[11px] font-semibold flex items-center justify-center ${
                        returnState.step >= 1
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      1
                    </span> */}
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        returnState.step >= 1
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      <CircleCheck className="w-4 h-4" />
                    </span>
                    <span
                      className={`text-sm font-medium ${
                        returnState.step === 1
                          ? 'text-black'
                          : returnState.step > 1
                            ? 'text-orange-600'
                            : 'text-gray-500'
                      }`}
                    >
                      Pickup
                    </span>
                  </button>
                  <span
                    className={`h-px w-12 sm:w-16 ${
                      returnState.step >= 2 ? 'bg-orange-500' : 'bg-gray-300'
                    }`}
                  />
                  {/* <button
                    type="button"
                    onClick={() =>
                      setReturnState((prev) => ({
                        ...prev,
                        step: 2,
                      }))
                    }
                    className="inline-flex items-center gap-2"
                  >
                    <span
                      className={`w-6 h-6 rounded-full text-[11px] font-semibold flex items-center justify-center ${
                        returnState.step >= 2
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      2
                    </span>
                    <span
                      className={`text-sm font-medium ${
                        returnState.step === 2
                          ? 'text-black'
                          : returnState.step > 2
                            ? 'text-orange-600'
                            : 'text-gray-500'
                      }`}
                    >
                      Refund
                    </span>
                  </button> */}
                  <button
                    type="button"
                    onClick={() =>
                      setReturnState((prev) => ({
                        ...prev,
                        step: 2,
                      }))
                    }
                    className="inline-flex items-center gap-2"
                  >
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        returnState.step >= 2
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {returnState.step >= 2 ? (
                        <CircleCheck className="w-4 h-4" />
                      ) : (
                        <span className="text-[11px] font-semibold">2</span>
                      )}
                    </span>

                    <span
                      className={`text-sm font-medium ${
                        returnState.step === 2
                          ? 'text-black'
                          : returnState.step > 2
                            ? 'text-orange-600'
                            : 'text-gray-500'
                      }`}
                    >
                      Refund
                    </span>
                  </button>
                  <span
                    className={`h-px w-12 sm:w-16 ${
                      returnState.step >= 3 ? 'bg-orange-500' : 'bg-gray-300'
                    }`}
                  />
                  {/* <button
                    type="button"
                    onClick={proceedToReviewStep}
                    className="inline-flex items-center gap-2"
                  >
                    <span
                      className={`w-6 h-6 rounded-full text-[11px] font-semibold flex items-center justify-center ${
                        returnState.step >= 3
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      3
                    </span>
                    <span
                      className={`text-sm font-medium ${
                        returnState.step === 3
                          ? 'text-black'
                          : 'text-gray-500'
                      }`}
                    >
                      Review
                    </span>
                  </button> */}
                  <button
                    type="button"
                    onClick={proceedToReviewStep}
                    className="inline-flex items-center gap-2"
                  >
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        returnState.step >= 3
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {returnState.step >= 3 ? (
                        <CircleCheck className="w-4 h-4" />
                      ) : (
                        <span className="text-[11px] font-semibold">3</span>
                      )}
                    </span>

                    <span
                      className={`text-sm font-medium ${
                        returnState.step === 3 ? 'text-black' : 'text-gray-500'
                      }`}
                    >
                      Review
                    </span>
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={closeReturnModal}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
                aria-label="Close return modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {returnState.step === 1 ? (
                <>
                  {/* <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.08)]">
                    <div className="rounded-xl border border-blue-200 bg-[#eef4ff] p-4 flex items-center gap-3">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#60a5fa] to-[#4f46e5] flex items-center justify-center shrink-0">
                        <Package className="w-7 h-7 text-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xl font-bold text-black truncate">
                          {returnState.row.product?.productName ||
                            'Rental item'}
                        </p>
                        <p className="text-xs text-gray-600 mt-1 flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          Original End Date:{' '}
                          <span className="font-semibold text-black">
                            {formatShortDate(returnCalc.endDate)}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div> */}

                  <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.08)]">
                    {/* Heading */}
                    <div className="flex items-center gap-2 mb-3">
                      <h2 className="text-2xl font-bold text-black">
                        Schedule Return Pickup
                      </h2>
                    </div>

                    {/* Content */}
                    <div className="rounded-xl border border-blue-200 bg-[#eef4ff] p-4 flex items-center gap-3">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#60a5fa] to-[#4f46e5] flex items-center justify-center shrink-0">
                        <Package className="w-7 h-7 text-white" />
                      </div>

                      <div className="min-w-0">
                        <p className="text-base font-bold text-black truncate">
                          {returnState.row.product?.productName ||
                            'Rental item'}
                        </p>

                        <p className="text-xs text-gray-600 mt-1 flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          Original End Date:{' '}
                          <span className="font-semibold text-black">
                            {formatShortDate(returnCalc.endDate)}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    {/* <p className="text-xs font-semibold text-black mb-2 flex items-center gap-2">
                      Select Pickup Date
                      <Calendar className="w-4 h-4 text-[#F97316]" />
                    </p>
                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                      {returnDateOptions.map((d, idx) => {
                        const iso = d.toISOString();
                        const active = returnState.pickupDateIso === iso;
                        const isEndDate =
                          toLocalDateOnly(d).getTime() ===
                          toLocalDateOnly(returnCalc.endDate).getTime();
                        // const optionCharge =
                        //   idx === 0 ? 0 : returnCalc.fineRatePerDay;
                        const pickupIsAfterEnd =
                          toLocalDateOnly(d).getTime() >
                          toLocalDateOnly(returnCalc.endDate).getTime();
                        const optionCharge = pickupIsAfterEnd
                          ? returnCalc.fineRatePerDay
                          : 0;
                        return (
                          <button
                            key={iso}
                            type="button"
                            onClick={() =>
                              setReturnState((prev) => ({
                                ...prev,
                                pickupDateIso: iso,
                              }))
                            }
                            className={`rounded-xl border px-2 py-2 text-center transition-colors ${
                              active
                                ? 'border-orange-500 bg-orange-500 text-white'
                                : isEndDate
                                  ? 'border-red-300 ring-1 ring-red-200 bg-white'
                                  : 'border-gray-200 bg-white hover:border-gray-300'
                            }`}
                          >
                            <p
                              className={`text-[9px] ${
                                active ? 'text-orange-100' : 'text-gray-500'
                              }`}
                            >
                              {formatShortWeekday(d)}
                            </p>
                            <p
                              className={`text-sm font-semibold ${
                                active ? 'text-white' : 'text-black'
                              }`}
                            >
                              {d.getDate()}
                            </p>
                            <p
                              className={`text-[9px] ${
                                active ? 'text-orange-100' : 'text-gray-500'
                              }`}
                            >
                              {d.toLocaleString('en-IN', { month: 'short' })}
                            </p>
                            <p
                              className={`text-[10px] mt-1 font-medium ${
                                active ? 'text-white' : 'text-gray-700'
                              }`}
                            >
                              ₹ {formatMoney(optionCharge)}
                            </p>
                          </button>
                        );
                      })}
                    </div> */}
                    {/* Heading - clickable to open calendar */}
                    <p
                      className="text-xs font-semibold text-black mb-2 flex items-center gap-2 cursor-pointer hover:text-blue-600 select-none"
                      onClick={() => setCalendarOpen(true)}
                    >
                      Select Pickup Date
                      <Calendar className="w-4 h-4 text-[#F97316]" />
                      {/* <span className="text-[10px] font-normal text-blue-500 underline">
                        Choose start date
                      </span> */}
                    </p>

                    {/* Calendar Modal */}
                    {calendarOpen && (
                      <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl shadow-2xl p-5 w-full max-w-sm">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base font-bold text-black">
                              Pick a start date
                            </h3>
                            <button
                              type="button"
                              onClick={() => setCalendarOpen(false)}
                              className="p-1 rounded-lg hover:bg-gray-100 text-gray-500"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <input
                            type="date"
                            min={
                              toLocalDateOnly(new Date())
                                .toISOString()
                                .split('T')[0]
                            }
                            defaultValue={
                              pickupAnchorDate
                                ? toLocalDateOnly(pickupAnchorDate)
                                    .toISOString()
                                    .split('T')[0]
                                : toLocalDateOnly(new Date())
                                    .toISOString()
                                    .split('T')[0]
                            }
                            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400"
                            onChange={(e) => {
                              if (!e.target.value) return;
                              const picked = new Date(
                                e.target.value + 'T00:00:00',
                              );
                              setPickupAnchorDate(picked);
                              // Also auto-select the first date of the new window
                              setReturnState((prev) => ({
                                ...prev,
                                pickupDateIso:
                                  toLocalDateOnly(picked).toISOString(),
                              }));
                              setCalendarOpen(false);
                            }}
                          />
                          <p className="text-xs text-gray-500 mt-2 text-center">
                            7 pickup dates will be shown starting from the date
                            you pick
                          </p>
                        </div>
                      </div>
                    )}

                    {/* 7 date buttons - now dynamic */}
                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                      {returnDateOptions.map((d, idx) => {
                        const iso = d.toISOString();
                        const active = returnState.pickupDateIso === iso;
                        const isEndDate =
                          toLocalDateOnly(d).getTime() ===
                          toLocalDateOnly(returnCalc.endDate).getTime();
                        const pickupIsAfterEnd =
                          toLocalDateOnly(d).getTime() >
                          toLocalDateOnly(returnCalc.endDate).getTime();
                        const optionCharge = pickupIsAfterEnd
                          ? returnCalc.fineRatePerDay
                          : 0;

                        return (
                          <button
                            key={iso}
                            type="button"
                            onClick={() =>
                              setReturnState((prev) => ({
                                ...prev,
                                pickupDateIso: iso,
                              }))
                            }
                            className={`rounded-xl border px-2 py-2 text-center transition-colors ${
                              active
                                ? 'border-orange-500 bg-orange-500 text-white'
                                : isEndDate
                                  ? 'border-[#E7000B] ring-1 ring-red-200 bg-white'
                                  : 'border-gray-200 bg-white hover:border-gray-300'
                            }`}
                          >
                            <p
                              className={`text-[9px] ${active ? 'text-orange-100' : 'text-gray-500'}`}
                            >
                              {formatShortWeekday(d)}
                            </p>
                            <p
                              className={`text-sm font-semibold ${active ? 'text-white' : 'text-black'}`}
                            >
                              {d.getDate()}
                            </p>
                            <p
                              className={`text-[9px] ${active ? 'text-orange-100' : 'text-gray-500'}`}
                            >
                              {d.toLocaleString('en-IN', { month: 'short' })}
                            </p>
                            <p
                              className={`text-[10px] mt-1 font-medium ${active ? 'text-white' : optionCharge > 0 ? 'text-red-500' : 'text-gray-700'}`}
                            >
                              {optionCharge > 0
                                ? `₹${formatMoney(optionCharge)}`
                                : '₹0'}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-xl border border-[#FFB900] bg-[#FFFBEB] px-4 py-3 text-xs text-gray-800 text-center font-medium">
                    You will be charged ₹
                    {formatMoney(returnCalc.fineRatePerDay)} per day, if you
                    exceed End Date ({formatShortDate(returnCalc.endDate)})
                  </div>

                  {returnCalc.hasExtension ? (
                    <div className="rounded-[24px] border border-red-300 bg-white p-4 sm:p-5 shadow-[0_8px_20px_rgba(239,68,68,0.12)]">
                      <h4 className="text-[22px] leading-tight font-bold text-black flex items-center gap-3">
                        <span className="w-9 h-9 rounded-xl bg-[#ff4d2d] flex items-center justify-center shrink-0">
                          <AlertTriangle className="w-5 h-5 text-white" />
                        </span>
                        Extension Summary
                      </h4>
                      <div className="mt-4 rounded-2xl border border-amber-200 bg-[#fff8ef] p-4">
                        <p className="text-[12px] font-semibold text-gray-800 mb-3">
                          Timeline Breakdown:
                        </p>

                        <div className="space-y-2 mb-3">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-emerald-600 font-semibold">
                              Grace Period (0-2 days)
                            </span>
                            <span className="text-emerald-600 font-semibold">
                              FREE
                            </span>
                          </div>
                          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-400 rounded-full"
                              style={{ width: '3%' }}
                            />
                          </div>
                        </div>

                        <div className="space-y-2 mb-4">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-red-500 font-semibold">
                              Daily Fine (3-30 days)
                            </span>
                            <span className="text-red-500 font-semibold">
                              ₹{formatMoney(returnCalc.fineRatePerDay)}/day
                            </span>
                          </div>
                          <div className="h-3 bg-red-100 rounded-full overflow-hidden">
                            <div className="h-full bg-red-400 rounded-full w-full" />
                          </div>
                        </div>

                        <div className="rounded-xl border border-amber-200 bg-white p-3 sm:p-4 space-y-3">
                          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                            <span className="text-black font-semibold">
                              Total Delay:
                            </span>
                            <span className="text-black font-semibold">
                              {returnCalc.extendedDays} Days
                            </span>
                          </div>
                          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                            <span className="text-emerald-600 font-medium">
                              Grace Period:
                            </span>
                            <span className="text-emerald-600 font-semibold">
                              -2 Days (Free)
                            </span>
                          </div>
                          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                            <span className="text-red-500 font-medium">
                              Chargeable:
                            </span>
                            <span className="text-red-500 font-semibold">
                              {Math.max(0, returnCalc.extendedDays - 2)} Days x
                              ₹{formatMoney(returnCalc.fineRatePerDay)}/day
                            </span>
                          </div>
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[18px] leading-none font-bold text-black">
                              Total Fine:
                            </span>
                            <span className="text-[28px] leading-none font-extrabold text-red-600">
                              ₹ {formatMoney(returnCalc.extensionFine)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 rounded-xl border border-yellow-400 bg-yellow-50 px-4 py-3 text-xs text-[#7B3306] text-center font-semibold">
                        This amount will be deducted from your Security Deposit.
                      </div>
                    </div>
                  ) : null}

                  <div className="rounded-[24px] border border-gray-200 bg-white p-4 sm:p-5 shadow-[0_8px_20px_rgba(15,23,42,0.10)]">
                    {/* <h4 className="text-[22px] leading-tight font-bold text-black">
                      {returnCalc.netBalance >= 0
                        ? 'Estimated Refund'
                        : 'Pending Amount'}
                    </h4> */}

                    <h4 className="text-[22px] leading-tight font-bold text-black flex items-center gap-2">
                      {returnCalc.netBalance >= 0 && (
                        <TrendingUp className="w-5 h-5 text-[#64748B]" />
                      )}

                      {returnCalc.netBalance >= 0
                        ? 'Estimated Refund'
                        : 'Pending Amount'}
                    </h4>

                    <div className="mt-4 space-y-0">
                      <div className="flex items-center justify-between py-3 border-b border-gray-200">
                        <span className="text-[15px] font-semibold text-[#64748B]">
                          Security Deposit Held:
                        </span>
                        <span className="text-[24px] font-bold text-black">
                          ₹ {formatMoney(returnCalc.refundableDeposit)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between py-3 border-b border-gray-200">
                        <span className="text-[15px] font-semibold text-red-500">
                          Less: Extension Fine
                        </span>
                        <span className="text-[24px] font-bold text-red-500">
                          - ₹ {formatMoney(returnCalc.extensionFine)}
                        </span>
                      </div>
                    </div>

                    <div
                      className={`mt-4 rounded-2xl px-4 py-4 ${
                        returnCalc.netBalance >= 0
                          ? 'border border-emerald-200 bg-emerald-50'
                          : 'border border-red-200 bg-red-50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[16px] font-bold text-black">
                          {returnCalc.netBalance >= 0
                            ? 'Net Refund:'
                            : 'Amount to Pay:'}
                        </span>
                        <span
                          className={`text-[32px] leading-none font-extrabold ${
                            returnCalc.netBalance >= 0
                              ? 'text-emerald-600'
                              : 'text-red-600'
                          }`}
                        >
                          ₹ {formatMoney(Math.abs(returnCalc.netBalance))}
                        </span>
                      </div>
                      <p
                        className={`mt-2 text-[12px] ${
                          returnCalc.netBalance >= 0
                            ? 'text-gray-600 font-semibold'
                            : 'text-red-600 font-semibold'
                        }`}
                      >
                        {returnCalc.netBalance >= 0
                          ? 'Will be credited within 5-7 business days'
                          : 'This due amount must be paid before pickup confirmation'}
                      </p>
                    </div>
                  </div>

                  {/* <button
                    type="button"
                    onClick={() =>
                      setReturnState((prev) => ({ ...prev, step: 2 }))
                    }
                    className="w-full rounded-xl bg-blue-600 text-white py-3 text-base font-semibold hover:bg-blue-700"
                  >
                    Confirm Pickup for {formatShortDate(returnCalc.pickupDate)}
                  </button> */}
                  <button
                    type="button"
                    onClick={() =>
                      setReturnState((prev) => ({ ...prev, step: 2 }))
                    }
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#2563EB] text-white py-3 text-base font-semibold hover:bg-blue-700"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Confirm Pickup for {formatShortDate(returnCalc.pickupDate)}
                  </button>

                  {/* Info text */}
                  <p className=" text-center font-semibold text-xs text-[#64748B]">
                    Pickup agent will call before arriving
                  </p>

                  <p className=" text-center text-xs font-semibold text-[#64748B]">
                    Need help?{' '}
                    <span className="text-[#2563EB] font-semibold cursor-pointer">
                      Contact Support
                    </span>
                  </p>
                </>
              ) : returnState.step === 2 ? (
                <>
                  <div className="space-y-1">
                    <h3 className="text-[24px] font-bold text-black">
                      Security Deposit Refund
                    </h3>
                    <p className="text-sm text-gray-500">
                      Choose where you&apos;d like to receive your refund
                    </p>
                  </div>

                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-5 text-center">
                    <p className="text-sm text-gray-500">
                      Total Refundable Amount
                    </p>
                    <p className="text-[44px] leading-none font-extrabold text-emerald-600 mt-1">
                      ₹{formatMoney(Math.max(0, returnCalc.netBalance))}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setReturnState((prev) => ({
                        ...prev,
                        refundMethod: 'original',
                      }))
                    }
                    className={`w-full rounded-2xl border px-4 py-4 text-left transition-colors ${
                      returnState.refundMethod === 'original'
                        ? 'border-orange-400 bg-orange-50 shadow-[0_4px_12px_rgba(249,115,22,0.15)]'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-black font-semibold">
                      <CreditCard className="w-4 h-4 text-slate-500" />
                      Original Payment Source
                      <span className="ml-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                        Recommended
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      HDFC Credit Card ending 1234
                    </p>
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      Fastest refund method
                      <span className="w-1 h-1 bg-gray-400 rounded-full inline-block" />
                      3-5 business days
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setReturnState((prev) => ({
                        ...prev,
                        refundMethod: 'upi',
                      }))
                    }
                    className={`w-full rounded-2xl border px-4 py-4 text-left transition-colors ${
                      returnState.refundMethod === 'upi'
                        ? 'border-orange-400 bg-orange-50'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-black font-semibold">
                      <IndianRupee className="w-4 h-4 text-violet-500" />
                      UPI ID
                    </div>

                    {returnState.refundMethod === 'upi' ? (
                      <input
                        type="text"
                        value={returnState.upiId}
                        onChange={(e) =>
                          setReturnState((prev) => ({
                            ...prev,
                            upiId: e.target.value,
                          }))
                        }
                        placeholder="Enter UPI ID"
                        className="mt-3 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
                      />
                    ) : null}
                  </button>

                  <div
                    className={`w-full rounded-2xl border px-4 py-4 transition-colors ${
                      returnState.refundMethod === 'bank'
                        ? 'border-orange-400 bg-orange-50'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setReturnState((prev) => ({
                          ...prev,
                          refundMethod: 'bank',
                        }))
                      }
                      className="w-full text-left"
                    >
                      <div className="flex items-center gap-2 text-black font-semibold">
                        <Landmark className="w-4 h-4 text-slate-500" />
                        Bank Transfer
                      </div>
                    </button>
                    {returnState.refundMethod === 'bank' ? (
                      <div className="mt-3 space-y-2">
                        <input
                          type="text"
                          value={returnState.bankAccountName}
                          onChange={(e) =>
                            setReturnState((prev) => ({
                              ...prev,
                              bankAccountName: e.target.value,
                            }))
                          }
                          placeholder="Account Holder Name"
                          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400"
                        />
                        <input
                          type="text"
                          value={returnState.bankAccountNumber}
                          onChange={(e) =>
                            setReturnState((prev) => ({
                              ...prev,
                              bankAccountNumber: e.target.value,
                            }))
                          }
                          placeholder="Account Number"
                          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400"
                        />
                        <input
                          type="text"
                          value={returnState.bankIfsc}
                          onChange={(e) =>
                            setReturnState((prev) => ({
                              ...prev,
                              bankIfsc: e.target.value.toUpperCase(),
                            }))
                          }
                          placeholder="IFSC CODE"
                          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400"
                        />
                      </div>
                    ) : null}
                  </div>

                  <div className="pt-2 border-t border-gray-100 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setReturnState((prev) => ({ ...prev, step: 1 }))
                      }
                      className="px-6 py-3 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={proceedToReviewStep}
                      className="flex-1 px-6 py-3 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600"
                    >
                      Continue
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-1">
                    <h3 className="text-[24px] font-bold text-black">
                      Review & Confirm
                    </h3>
                    <p className="text-sm text-gray-500">
                      Please review your return request details
                    </p>
                  </div>

                  <div className="rounded-2xl border border-gray-200 bg-white p-4 space-y-3">
                    <div className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-3">
                      <p className="font-semibold text-black flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-[#F97316]" />
                        Pickup Details
                      </p>
                      <div className="mt-2 text-sm text-gray-600 space-y-1">
                        <p className="flex justify-between">
                          <span>Date:</span>
                          <span className="font-medium text-black">
                            {formatShortDate(returnCalc.pickupDate)}
                          </span>
                        </p>
                        <p className="flex justify-between">
                          <span>Time:</span>
                          <span className="font-medium text-black">
                            1 PM - 4 PM
                          </span>
                        </p>
                        <p className="flex justify-between">
                          <span>Location:</span>
                          <span className="font-medium text-black">Home</span>
                        </p>
                      </div>
                    </div>

                    <div className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-3">
                      {/* <p className="font-semibold text-black">Refund Details</p> */}
                      <p className="font-semibold text-black flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-[#F97316]" />
                        Refund Details
                      </p>
                      <div className="mt-2 text-sm text-gray-600 space-y-1">
                        <p className="flex justify-between">
                          <span>Amount:</span>
                          <span className="font-semibold text-emerald-600">
                            ₹{formatMoney(Math.max(0, returnCalc.netBalance))}
                          </span>
                        </p>
                        <p className="flex justify-between">
                          <span>Destination:</span>
                          <span className="font-medium text-black">
                            {returnState.refundMethod === 'bank'
                              ? 'Bank Transfer'
                              : returnState.refundMethod === 'upi'
                                ? 'UPI ID'
                                : 'Original Source'}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-gray-200 bg-white p-4">
                    <p className="font-semibold text-black">Overall Rating</p>
                    <div className="mt-3 flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() =>
                            setReturnState((prev) => ({
                              ...prev,
                              reviewRating: n,
                            }))
                          }
                          className="p-1"
                        >
                          <Star
                            className={`w-6 h-6 ${
                              (returnState.reviewRating || 0) >= n
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-gray-300'
                            }`}
                          />
                        </button>
                      ))}
                    </div>

                    <p className="mt-4 font-semibold text-black">Your Review</p>
                    <textarea
                      value={returnState.reviewText}
                      onChange={(e) =>
                        setReturnState((prev) => ({
                          ...prev,
                          reviewText: e.target.value.slice(0, 1000),
                        }))
                      }
                      placeholder="How was your experience with this product? Mention the condition, delivery, and overall service..."
                      className="mt-2 w-full min-h-[120px] rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
                    />
                    <div className="mt-1 flex justify-between text-[11px] text-gray-500">
                      <span>
                        Tip: Detailed reviews help others make better decisions
                      </span>
                      <span>{(returnState.reviewText || '').length}/1000</span>
                    </div>

                    <p className="mt-4 font-semibold text-black">
                      Add Photos or Videos (Optional)
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      You can upload up to 10 files.
                    </p>
                    <label
                      className="mt-2 block rounded-xl border border-gray-200 bg-gray-50 p-6 text-center cursor-pointer"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        applySelectedMedia(e.dataTransfer.files);
                      }}
                    >
                      <Camera className="w-8 h-8 text-gray-400 mx-auto" />
                      <p className="mt-2 text-sm font-semibold text-black">
                        Drag and drop photos or videos here
                      </p>
                      <p className="text-xs text-gray-500">
                        or click to browse your files
                      </p>
                      {/* <span className="inline-block mt-3 px-4 py-1.5 rounded-lg bg-blue-600 text-white text-sm">
                        Choose Files
                      </span> */}
                      <span className="inline-flex items-center gap-2 mt-3 px-4 py-1.5 rounded-lg bg-blue-600 text-white text-sm">
                        <Upload className="w-4 h-4" />
                        Choose Files
                      </span>
                      <input
                        type="file"
                        accept="image/*,video/*"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          applySelectedMedia(e.target.files);
                          e.target.value = '';
                        }}
                      />
                    </label>
                    {returnState.mediaPreviews?.length ? (
                      <div className="mt-3">
                        <p className="mb-2 text-xs text-gray-500">
                          Selected: {returnState.mediaPreviews.length}/10
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {returnState.mediaPreviews.map((media, idx) => {
                            const isVideo = String(media.type || '').startsWith(
                              'video/',
                            );
                            return (
                              <div
                                key={`${media.name}-${idx}`}
                                className="relative rounded-xl border border-gray-200 bg-white overflow-hidden"
                              >
                                <button
                                  type="button"
                                  aria-label={`Remove ${media.name || `file ${idx + 1}`}`}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    removeSelectedMediaAt(idx);
                                  }}
                                  className="absolute top-2 right-2 z-10 inline-flex items-center justify-center w-6 h-6 rounded-full bg-black/70 text-white hover:bg-black"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                                {isVideo ? (
                                  <video
                                    src={media.url}
                                    className="w-full h-28 object-cover bg-black"
                                    controls
                                  />
                                ) : (
                                  <img
                                    src={media.url}
                                    alt={
                                      media.name || `Selected media ${idx + 1}`
                                    }
                                    className="w-full h-28 object-cover"
                                  />
                                )}
                                <p className="px-2 py-1.5 text-[11px] text-gray-600 truncate">
                                  {media.name}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="pt-2 border-t border-gray-100 space-y-2">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setReturnState((prev) => ({ ...prev, step: 2 }))
                        }
                        className="px-6 py-3 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        disabled={submittingReturn}
                        onClick={() => {
                          console.log('[return-review] confirm button pressed');
                          handleSubmitReturnRequest();
                        }}
                        className="flex-1 px-6 py-3 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {submittingReturn
                          ? 'Submitting...'
                          : 'Confirm Return & Pickup'}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={closeReturnModal}
                      className="w-full text-center text-sm text-gray-500 hover:text-gray-700"
                    >
                      Keep Renting
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {issueState.open && issueState.row ? (
        <div className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4">
          <div
            className="w-full max-w-[720px] max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-gray-100 flex items-start justify-between">
              <div>
                <h2 className="text-[24px] leading-[1.2] font-bold text-black">
                  Report an Issue
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  For{' '}
                  <span className="font-semibold text-gray-800">
                    {issueState.row.product?.productName || 'Rental item'}
                  </span>{' '}
                  (Asset ID{' '}
                  <span className="font-semibold text-gray-800">
                    #
                    {String(issueState.row.order?._id || '')
                      .slice(-4)
                      .toUpperCase()}
                  </span>
                  )
                </p>
              </div>
              <button
                type="button"
                onClick={closeIssueModal}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
                aria-label="Close issue modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5">
              <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-[11px] text-blue-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                We are here to help. Please provide details so we can resolve
                this quickly.
              </div>

              <div className="mt-4">
                <p className="text-[18px] font-semibold text-black">
                  What seems to be the problem?
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  {[
                    {
                      id: 'structural_damage',
                      title: 'Structural Damage',
                      subtitle: 'e.g., Broken leg, loose parts',
                    },
                    {
                      id: 'fabric_stain',
                      title: 'Fabric Tear / Stain',
                      subtitle: 'e.g., Rips, discoloration',
                    },
                    {
                      id: 'functionality_issue',
                      title: 'Functionality Issue',
                      subtitle: 'e.g., Mechanism not working',
                    },
                    {
                      id: 'other',
                      title: 'Other',
                      subtitle: 'Any other issue not listed above',
                    },
                  ].map((opt) => {
                    const active = issueState.issueType === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() =>
                          setIssueState((prev) => ({
                            ...prev,
                            issueType: opt.id,
                          }))
                        }
                        className={`rounded-xl border px-3.5 py-2.5 text-left transition-colors ${
                          active
                            ? 'border-orange-300 bg-orange-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <span
                            className={`mt-1 h-4 w-4 rounded-full border ${
                              active
                                ? 'border-orange-500 bg-orange-500'
                                : 'border-gray-300 bg-white'
                            }`}
                          />
                          <span className="min-w-0">
                            <p className="text-[15px] font-semibold text-black leading-tight">
                              {opt.title}
                            </p>
                            <p className="text-[11px] text-gray-500 mt-1">
                              {opt.subtitle}
                            </p>
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4">
                <p className="text-[18px] font-semibold text-black">
                  Upload Photos of the Issue
                </p>
                <p className="mt-1 text-[11px] text-gray-500">
                  Minimum 1 photo required - Max 5 photos
                </p>
                <label
                  className="mt-2.5 block rounded-xl border border-gray-200 bg-gray-50 p-7 text-center cursor-pointer"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    applyIssuePhotos(e.dataTransfer.files);
                  }}
                >
                  {/* <Camera className="w-9 h-9 text-gray-400 mx-auto" /> */}
                  <div
                    style={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #D1D5DC',
                    }}
                    className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
                  >
                    <Camera className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="mt-2.5 text-[16px] font-semibold text-gray-800">
                    Click to Upload or Drag & Drop
                  </p>
                  <p className="text-[11px] text-gray-500 mt-1">
                    JPG, PNG or HEIC - Max 5MB per file
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      applyIssuePhotos(e.target.files);
                      e.target.value = '';
                    }}
                  />
                </label>

                {issueState.photoPreviews?.length ? (
                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {issueState.photoPreviews.map((photo, idx) => (
                      <div
                        key={`${photo.name}-${idx}`}
                        className="relative rounded-xl border border-gray-200 bg-white overflow-hidden"
                      >
                        <button
                          type="button"
                          aria-label={`Remove ${photo.name || `image ${idx + 1}`}`}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            removeIssuePhotoAt(idx);
                          }}
                          className="absolute top-2 right-2 z-10 inline-flex items-center justify-center w-6 h-6 rounded-full bg-black/70 text-white hover:bg-black"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                        <img
                          src={photo.url}
                          alt={photo.name || `Issue photo ${idx + 1}`}
                          className="w-full h-28 object-cover"
                        />
                        <p className="px-2 py-1.5 text-[11px] text-gray-600 truncate">
                          {photo.name}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="mt-4">
                <p className="text-[18px] font-semibold text-black">
                  Describe the issue briefly
                </p>
                <p className="text-[11px] text-gray-500 mt-1">
                  Help us understand what happened
                </p>
                <textarea
                  value={issueState.description}
                  onChange={(e) =>
                    setIssueState((prev) => ({
                      ...prev,
                      description: e.target.value.slice(0, 500),
                    }))
                  }
                  placeholder="e.g. Left leg feels unstable when seated. Started after moving the sofa."
                  className="mt-2 w-full min-h-[110px] rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-400"
                />
                <div className="mt-1 flex justify-between text-[11px] text-gray-500">
                  <span>
                    {Math.max(
                      0,
                      10 - String(issueState.description || '').trim().length,
                    )}{' '}
                    more characters needed
                  </span>
                  <span>{(issueState.description || '').length}/500</span>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                <p className="text-[12px] font-semibold text-amber-900 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  Tips for faster resolution:
                </p>
                <ul className="mt-2 space-y-1 text-[11px] text-amber-800">
                  <li>- Take clear, well-lit photos from multiple angles</li>
                  <li>- Include close-ups of the specific problem area</li>
                  <li>- Describe when you first noticed the issue</li>
                  <li>- Mention if the issue affects usability</li>
                </ul>
              </div>

              <div className="mt-5 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  disabled={submittingIssue}
                  onClick={handleSubmitIssueReport}
                  className="w-full rounded-xl bg-[#f2a36f] text-white py-2.5 text-sm font-semibold hover:bg-[#ea9156] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submittingIssue ? 'Submitting...' : 'Submit Report'}
                </button>
                <p className="text-center text-[11px] text-gray-500 mt-2">
                  Our support team will review this within{' '}
                  <span className="font-semibold text-gray-700">24 hours</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <PickupScheduledModal
        open={pickupScheduled.open}
        onClose={() => setPickupScheduled((p) => ({ ...p, open: false }))}
        pickupSubtitle={pickupScheduled.pickupSubtitle}
        refundableDeposit={pickupScheduled.refundableDeposit}
        extensionFine={pickupScheduled.extensionFine}
        netEstimate={pickupScheduled.netEstimate}
        onViewReturnStatus={() => {
          const id = pickupScheduled.orderId;
          setPickupScheduled((p) => ({ ...p, open: false }));
          router.push(
            `/orders/return-status?orderId=${encodeURIComponent(id)}`,
          );
        }}
      />
    </div>
  );
}
