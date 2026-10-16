import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  Trophy,
  Download,
  Shuffle,
  Search,
  ExternalLink,
  MessageCircle,
  ChefHat,
  LogOut,
  Calendar,
  CheckCircle2,
  X,
  Star,
  Users,
  Flame,
  Clock,
  Sparkles,
  ArrowLeft,
  FileSpreadsheet,
  Phone,
  MapPin,
  RefreshCw,
  Settings,
  DollarSign,
  ShoppingBag,
  Truck,
  BarChart3,
  Eye,
  Activity,
  Smartphone,
  Laptop,
  TrendingUp,
  Globe,
  Share2,
  FileText,
  Printer,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  CreditCard,
} from 'lucide-react';
import { DeliveryMotorbikeIcon } from './icons/DeliveryMotorbikeIcon';
import { isPayFastStaffTestMode, setPayFastStaffTestMode } from '../services/payment';
import { LiveOrder, ReviewDrawEntry, OrderStatus } from '../types';
import { GOOGLE_REVIEW_URL } from '../data/stores';
import {
  getTrafficSummary,
  getLiveVisitorsCount,
  subscribeToTraffic,
  exportTrafficToCsv,
  generateWhatsAppDailyReportText,
  resetDailyTraffic,
  normalizeFlavourKey,
  TrafficDailyDoc,
  isDeviceAnalyticsExcluded,
  setDeviceAnalyticsExcluded,
  getCachedClientIp,
  getExcludedIps,
  addExcludedIp,
  removeExcludedIp,
  cleanLocalTrafficData,
  fetchAndSyncClientIp,
} from '../services/analyticsService';
import {
  subscribeToReviewEntries,
  updateReviewEntryStatus,
  exportEntriesToCsv
} from '../services/reviewService';
import {
  getAllOrders,
  subscribeToOrders,
  syncOrdersFromCloud,
  exportOrdersToCsv,
  getGoogleSheetsWebhookUrl,
  setGoogleSheetsWebhookUrl,
  getLocalTodayDateString,
  formatToLocalDateString,
  getOrderDateString,
  generateWhatsAppDailyOrdersReportText,
  isTestOrder,
} from '../services/orderService';
import { generateGoogleMapsUrl } from '../services/payment';
import {
  exportOrdersToPdf,
  exportTrafficToPdf,
  exportReviewEntriesToPdf
} from '../services/pdfExportService';

interface AdminPortalViewProps {
  onBackToMenu: () => void;
  onLogout: () => void;
  onNavigateRole: (role: 'kitchen' | 'driver') => void;
}

export const AdminPortalView: React.FC<AdminPortalViewProps> = ({
  onBackToMenu,
  onLogout,
  onNavigateRole,
}) => {
  // Navigation Tab: Orders & Sales CRM vs Google Review Draw vs Customer Traffic
  const [activeTab, setActiveTab] = useState<'orders' | 'reviews' | 'traffic'>('orders');
  const [isPayFastTesting, setIsPayFastTesting] = useState(() => isPayFastStaffTestMode());

  // --- Orders State ---
  const [orders, setOrders] = useState<LiveOrder[]>(() => getAllOrders());
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderModeFilter, setOrderModeFilter] = useState<'all' | 'delivery' | 'collection'>('all');
  const [selectedOrderDate, setSelectedOrderDate] = useState<string>(() => getLocalTodayDateString());
  const [dailyOrdersReportModalOpen, setDailyOrdersReportModalOpen] = useState(false);
  const [copiedOrdersReportFeedback, setCopiedOrdersReportFeedback] = useState(false);
  const [isSyncingOrders, setIsSyncingOrders] = useState(false);

  // Webhook Configuration Modal State
  const [webhookModalOpen, setWebhookModalOpen] = useState(false);
  const [webhookUrlInput, setWebhookUrlInput] = useState(() => getGoogleSheetsWebhookUrl());
  const [webhookSavedFeedback, setWebhookSavedFeedback] = useState(false);

  // --- Reviews Draw State ---
  const [entries, setEntries] = useState<ReviewDrawEntry[]>([]);
  const [reviewSearchQuery, setReviewSearchQuery] = useState('');
  const [reviewStatusFilter, setReviewStatusFilter] = useState<'all' | 'pending' | 'winner'>('all');
  const [isDrawing, setIsDrawing] = useState(false);
  const [winnerModalOpen, setWinnerModalOpen] = useState(false);
  const [selectedWinner, setSelectedWinner] = useState<ReviewDrawEntry | null>(null);

  // --- Customer Traffic Analytics State ---
  const [trafficRange, setTrafficRange] = useState<'today' | 'yesterday' | 'week' | 'all'>('today');
  const [trafficSummary, setTrafficSummary] = useState<TrafficDailyDoc>(() => getTrafficSummary('today'));
  const [liveVisitors, setLiveVisitors] = useState<number>(() => getLiveVisitorsCount());
  const [isRefreshingTraffic, setIsRefreshingTraffic] = useState(false);
  const [dailyReportModalOpen, setDailyReportModalOpen] = useState(false);
  const [copiedReportFeedback, setCopiedReportFeedback] = useState(false);

  // --- Staff & Device Analytics Exclusion State ---
  const [isDeviceExcluded, setIsDeviceExcluded] = useState<boolean>(() => isDeviceAnalyticsExcluded());
  const [clientIp, setClientIp] = useState<string>(() => getCachedClientIp());
  const [excludedIpsList, setExcludedIpsList] = useState<string[]>(() => getExcludedIps());
  const [customIpInput, setCustomIpInput] = useState('');
  const [cleanDataFeedback, setCleanDataFeedback] = useState(false);

  useEffect(() => {
    fetchAndSyncClientIp()
      .then((res) => {
        if (res.clientIp) setClientIp(res.clientIp);
        setExcludedIpsList(getExcludedIps());
        setIsDeviceExcluded(isDeviceAnalyticsExcluded());
      })
      .catch(() => {});
  }, []);

  const handleToggleDeviceExclusion = () => {
    const next = !isDeviceExcluded;
    setDeviceAnalyticsExcluded(next);
    setIsDeviceExcluded(next);
  };

  const handleToggleCurrentIpExclusion = async () => {
    if (!clientIp) return;
    if (excludedIpsList.includes(clientIp)) {
      const updated = await removeExcludedIp(clientIp);
      setExcludedIpsList(updated);
    } else {
      const updated = await addExcludedIp(clientIp);
      setExcludedIpsList(updated);
    }
  };

  const handleAddCustomIp = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = customIpInput.trim();
    if (!clean) return;
    const updated = await addExcludedIp(clean);
    setExcludedIpsList(updated);
    setCustomIpInput('');
  };

  const handleRemoveIp = async (ipToRemove: string) => {
    const updated = await removeExcludedIp(ipToRemove);
    setExcludedIpsList(updated);
  };

  const handleCleanTodayTestData = async () => {
    await cleanLocalTrafficData('today');
    setTrafficSummary(getTrafficSummary(trafficRange));
    setLiveVisitors(getLiveVisitorsCount());
    setCleanDataFeedback(true);
    setTimeout(() => setCleanDataFeedback(false), 3000);
  };

  const handleRefreshTraffic = () => {
    setIsRefreshingTraffic(true);
    setTrafficSummary(getTrafficSummary(trafficRange));
    setLiveVisitors(getLiveVisitorsCount());
    setTimeout(() => setIsRefreshingTraffic(false), 500);
  };

  const handleResetTraffic = async () => {
    const periodLabel = trafficRange === 'today' ? "Today's test traffic" : `traffic for ${trafficRange}`;
    if (window.confirm(`Are you sure you want to reset ${periodLabel} back to 0? This will clear test visitor and page view counts.`)) {
      await resetDailyTraffic(trafficRange === 'today' ? 'today' : trafficSummary.date);
      setTrafficSummary(getTrafficSummary(trafficRange));
      setLiveVisitors(getLiveVisitorsCount());
    }
  };

  useEffect(() => {
    setTrafficSummary(getTrafficSummary(trafficRange));
  }, [trafficRange]);

  // Aggregate ordered food items & revenue for current range
  const trafficOrdersData = useMemo(() => {
    const todayStr = getLocalTodayDateString();

    const yDate = new Date();
    yDate.setDate(yDate.getDate() - 1);
    const yStr = formatToLocalDateString(yDate);

    const weekDate = new Date();
    weekDate.setDate(weekDate.getDate() - 7);
    const weekStr = formatToLocalDateString(weekDate);

    const filtered = orders.filter((o) => {
      if (!o || !o.orderId) return false;
      // Do not count cancelled, test orders, or unpaid PayFast orders in meals sold
      if (o.status === 'cancelled') return false;
      if (isTestOrder(o)) return false;
      if (o.paymentMethod === 'payfast' && o.paymentStatus !== 'paid') return false;
      const cName = (o.customer?.customerName || '').toLowerCase();
      if (cName.includes('test')) return false;

      const d = getOrderDateString(o);
      if (trafficRange === 'all') return true;
      if (trafficRange === 'today') return d === todayStr;
      if (trafficRange === 'yesterday') return d === yStr;
      if (trafficRange === 'week') return d >= weekStr && d <= todayStr;
      return true;
    });

    const itemsMap: Record<string, number> = {};
    const flavourCounts: Record<string, number> = {
      lemony: 0,
      mild: 0,
      bbq: 0,
      sweet_chilli: 0,
      hot: 0,
    };
    let totalItemsCount = 0;
    let revenue = 0;

    if (filtered.length > 0) {
      for (const ord of filtered) {
        revenue += ord.grandTotal || 0;
        if (ord.items && Array.isArray(ord.items)) {
          for (const it of ord.items) {
            const name = it.menuItem?.name || 'Meal Item';
            const qty = it.quantity || 1;
            itemsMap[name] = (itemsMap[name] || 0) + qty;
            totalItemsCount += qty;

            // Detect flavours from item customization
            if (it.customization?.flavour) {
              const flvKey = normalizeFlavourKey(it.customization.flavour);
              if (flvKey) {
                flavourCounts[flvKey] = (flavourCounts[flvKey] || 0) + qty;
              }
            }
            if (it.customization?.extras && Array.isArray(it.customization.extras)) {
              for (const ext of it.customization.extras) {
                if (ext.name && (ext.name.toLowerCase().includes('sauce') || ext.name.toLowerCase().includes('basting'))) {
                  const flvKey = normalizeFlavourKey(ext.name);
                  if (flvKey) {
                    flavourCounts[flvKey] = (flavourCounts[flvKey] || 0) + qty;
                  }
                }
              }
            }
            if (it.customization?.notes) {
              const flvKey = normalizeFlavourKey(it.customization.notes);
              if (flvKey) {
                flavourCounts[flvKey] = (flavourCounts[flvKey] || 0) + qty;
              }
            }
          }
        }
      }
    }

    const ordersCount = filtered.length;

    return {
      ordersCount,
      revenue,
      itemsMap,
      totalItemsCount,
      flavourCounts,
    };
  }, [orders, trafficRange, trafficSummary]);

  const handleCopyWhatsAppReport = () => {
    const rangeLabel =
      trafficRange === 'today'
        ? "Today's Rush"
        : trafficRange === 'yesterday'
        ? 'Yesterday'
        : trafficRange === 'week'
        ? 'Past 7 Days'
        : 'All-Time';

    const reportText = generateWhatsAppDailyReportText(
      trafficSummary,
      rangeLabel,
      trafficOrdersData.ordersCount,
      trafficOrdersData.revenue,
      trafficOrdersData.itemsMap
    );

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(reportText);
      setCopiedReportFeedback(true);
      setTimeout(() => setCopiedReportFeedback(false), 2500);
    }
  };

  // Subscribe to Orders, Reviews & Traffic in real-time
  useEffect(() => {
    const unsubOrders = subscribeToOrders((list) => {
      setOrders(list);
    });
    const unsubReviews = subscribeToReviewEntries((list) => {
      setEntries(list);
    });
    const unsubTraffic = subscribeToTraffic(() => {
      setTrafficSummary(getTrafficSummary(trafficRange));
      setLiveVisitors(getLiveVisitorsCount());
    });
    return () => {
      unsubOrders();
      unsubReviews();
      unsubTraffic();
    };
  }, [trafficRange]);

  // Helper to extract clean international WhatsApp phone
  const getCleanWhatsAppPhone = (phone: string) => {
    let clean = (phone || '').replace(/\D/g, '');
    if (clean.startsWith('0')) {
      clean = '27' + clean.slice(1);
    }
    return clean;
  };

  // Date Shift Helper for Daily Orders Report
  const shiftReportDate = (offsetDays: number) => {
    const base = selectedOrderDate === 'all' ? getLocalTodayDateString() : selectedOrderDate;
    const parts = base.split('-');
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      d.setDate(d.getDate() + offsetDays);
      setSelectedOrderDate(formatToLocalDateString(d));
    }
  };

  const formatReportDateLabel = (dateStr: string) => {
    if (dateStr === 'all') return 'All Recorded Dates';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      const todayStr = getLocalTodayDateString();
      const isToday = dateStr === todayStr;
      const formatted = d.toLocaleDateString('en-ZA', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
      return isToday ? `Today (${formatted})` : formatted;
    }
    return dateStr;
  };

  // --- Aggregate Daily Orders & Totals for Selected Date ---
  const dayOrdersData = useMemo(() => {
    const targetDate = selectedOrderDate;
    const targetList = orders.filter((o) => {
      if (!o || !o.orderId) return false;
      // Do not count cancelled, unpaid, or PayFast test orders in daily sales report
      if (o.status === 'cancelled') return false;
      if (o.paymentMethod === 'payfast') return false;
      const cName = (o.customer?.customerName || '').toLowerCase();
      if (cName.includes('test')) return false;

      if (targetDate === 'all') return true;
      return getOrderDateString(o) === targetDate;
    });

    const totalOrders = targetList.length;
    let totalRevenue = 0;
    let subtotal = 0;
    let deliveryFees = 0;
    let driverTips = 0;
    let deliveriesCount = 0;
    let deliveryRevenue = 0;
    let collectionsCount = 0;
    let collectionRevenue = 0;
    const itemsMap: Record<string, { qty: number; revenue: number }> = {};
    let totalItemsCount = 0;

    const suburbsMap: Record<string, number> = {};
    const paymentMethodsMap: Record<string, { count: number; total: number }> = {};

    for (const ord of targetList) {
      const grand = ord.grandTotal || 0;
      const sub = ord.subtotal || grand;
      const fee = ord.deliveryFee || 0;
      const tip = ord.tip || 0;

      totalRevenue += grand;
      subtotal += sub;
      deliveryFees += fee;
      driverTips += tip;

      if (ord.orderMode === 'delivery') {
        deliveriesCount++;
        deliveryRevenue += grand;
        const subName = (ord.customer?.suburb || 'Pinetown').trim();
        suburbsMap[subName] = (suburbsMap[subName] || 0) + 1;
      } else {
        collectionsCount++;
        collectionRevenue += grand;
      }

      const pMethod = (ord.paymentMethod || 'cod').toLowerCase();
      if (!paymentMethodsMap[pMethod]) {
        paymentMethodsMap[pMethod] = { count: 0, total: 0 };
      }
      paymentMethodsMap[pMethod].count++;
      paymentMethodsMap[pMethod].total += grand;

      if (ord.items && Array.isArray(ord.items)) {
        for (const it of ord.items) {
          const name = it.menuItem?.name || 'Meal Item';
          const qty = it.quantity || 1;
          const lineTotal = it.itemTotal || (it.menuItem?.price ? it.menuItem.price * qty : 0);

          if (!itemsMap[name]) {
            itemsMap[name] = { qty: 0, revenue: 0 };
          }
          itemsMap[name].qty += qty;
          itemsMap[name].revenue += lineTotal;
          totalItemsCount += qty;
        }
      }
    }

    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    return {
      targetList,
      totalOrders,
      totalRevenue,
      subtotal,
      deliveryFees,
      driverTips,
      deliveriesCount,
      deliveryRevenue,
      collectionsCount,
      collectionRevenue,
      totalItemsCount,
      itemsMap,
      suburbsMap,
      paymentMethodsMap,
      avgOrderValue,
    };
  }, [orders, selectedOrderDate]);

  const handleCopyDailyOrdersWhatsAppReport = () => {
    const dateLabel = formatReportDateLabel(selectedOrderDate);
    const reportText = generateWhatsAppDailyOrdersReportText(dateLabel, dayOrdersData);

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(reportText);
      setCopiedOrdersReportFeedback(true);
      setTimeout(() => setCopiedOrdersReportFeedback(false), 2500);
    }
  };

  // --- Filtered Orders (Search + Mode + Selected Date) ---
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (!o || !o.orderId) return false;
      const cleanId = String(o.orderId).replace('#', '').toLowerCase();
      const customerName = (o.customer?.customerName || '').toLowerCase();
      const phone = (o.customer?.phone || '').toLowerCase();
      const address = (o.customer?.address || '').toLowerCase();
      const suburb = (o.customer?.suburb || '').toLowerCase();

      // Search Query
      const q = orderSearchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        cleanId.includes(q) ||
        customerName.includes(q) ||
        phone.includes(q) ||
        address.includes(q) ||
        suburb.includes(q);

      // Mode Filter
      const matchMode =
        orderModeFilter === 'all' ? true : o.orderMode === orderModeFilter;

      // Date Filter
      let matchDate = true;
      if (selectedOrderDate !== 'all') {
        matchDate = getOrderDateString(o) === selectedOrderDate;
      }

      return matchSearch && matchMode && matchDate;
    });
  }, [orders, orderSearchQuery, orderModeFilter, selectedOrderDate]);

  // --- Orders Metrics (Tied to selected date or all-time) ---
  const orderMetrics = useMemo(() => {
    const uniquePhones = new Set<string>();
    for (const o of dayOrdersData.targetList) {
      const clean = (o.customer?.phone || '').replace(/\D/g, '');
      if (clean) uniquePhones.add(clean);
    }

    return {
      totalOrders: dayOrdersData.totalOrders,
      totalRevenue: dayOrdersData.totalRevenue,
      subtotal: dayOrdersData.subtotal,
      deliveryFees: dayOrdersData.deliveryFees,
      totalTips: dayOrdersData.driverTips,
      deliveriesCount: dayOrdersData.deliveriesCount,
      deliveryRevenue: dayOrdersData.deliveryRevenue,
      collectionsCount: dayOrdersData.collectionsCount,
      collectionRevenue: dayOrdersData.collectionRevenue,
      totalItemsCount: dayOrdersData.totalItemsCount,
      avgOrderValue: dayOrdersData.avgOrderValue,
      smsContactsCount: uniquePhones.size,
    };
  }, [dayOrdersData]);

  // --- Reviews Metrics ---
  const reviewMetrics = useMemo(() => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisWeek = entries.filter((e) => new Date(e.createdAt) >= oneWeekAgo);
    const winners = entries.filter((e) => e.status === 'winner');
    const totalRatings = entries.reduce((acc, curr) => acc + (curr.rating || 5), 0);
    const avgRating = entries.length > 0 ? (totalRatings / entries.length).toFixed(1) : '5.0';

    return {
      total: entries.length,
      thisWeek: thisWeek.length,
      winners: winners.length,
      avgRating,
    };
  }, [entries]);

  // --- Filtered Reviews ---
  const filteredReviews = useMemo(() => {
    return entries.filter((e) => {
      const q = reviewSearchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        e.fullName.toLowerCase().includes(q) ||
        e.phone.includes(q) ||
        e.receiptNumber.toLowerCase().includes(q) ||
        e.googleReviewName.toLowerCase().includes(q);

      const matchStatus =
        reviewStatusFilter === 'all'
          ? true
          : reviewStatusFilter === 'winner'
          ? e.status === 'winner'
          : e.status !== 'winner';

      return matchSearch && matchStatus;
    });
  }, [entries, reviewSearchQuery, reviewStatusFilter]);

  // Draw Random Winner
  const handleDrawRandomWinner = () => {
    if (entries.length === 0) {
      alert('No entries available to draw from yet.');
      return;
    }
    setIsDrawing(true);
    setWinnerModalOpen(true);

    let counter = 0;
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * entries.length);
      setSelectedWinner(entries[randomIndex]);
      counter++;
      if (counter > 15) {
        clearInterval(interval);
        const finalWinner = entries[Math.floor(Math.random() * entries.length)];
        setSelectedWinner(finalWinner);
        setIsDrawing(false);
      }
    }, 100);
  };

  const handleMarkAsWinner = async (entry: ReviewDrawEntry) => {
    await updateReviewEntryStatus(entry.id, 'winner');
    setSelectedWinner((prev) => (prev?.id === entry.id ? { ...prev, status: 'winner' } : prev));
  };

  // Save Webhook URL
  const handleSaveWebhook = () => {
    setGoogleSheetsWebhookUrl(webhookUrlInput);
    setWebhookSavedFeedback(true);
    setTimeout(() => setWebhookSavedFeedback(false), 2500);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-zinc-100 flex flex-col font-sans selection:bg-rose-500 selection:text-white">
      {/* ── Top Manager Navigation Bar ── */}
      <header className="sticky top-0 z-40 bg-[#121218]/95 backdrop-blur-md border-b border-white/10 px-4 sm:px-6 py-3.5 shadow-xl">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Admin Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-rose-950/60 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-widest text-amber-400">
                  Manager Portal
                </span>
                <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-[10px] font-bold">
                  Protected
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-black text-white">
                Wrap &amp; Wings Co Admin Center
              </h1>
            </div>
          </div>

          {/* Quick Department Jump & Logout */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigateRole('kitchen')}
              className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-xs font-bold text-zinc-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Open Kitchen Display"
            >
              <ChefHat className="w-3.5 h-3.5 text-rose-500" />
              <span>Kitchen Display</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateRole('driver')}
              className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-xs font-bold text-zinc-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Open Driver Dispatch"
            >
              <DeliveryMotorbikeIcon className="w-3.5 h-3.5 text-amber-400" />
              <span>Driver Portal</span>
            </button>

            {/* PayFast Sandbox Staff Test Toggle */}
            <button
              type="button"
              onClick={() => {
                const next = !isPayFastTesting;
                setPayFastStaffTestMode(next);
                setIsPayFastTesting(next);
              }}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                isPayFastTesting
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 hover:bg-amber-500/30 ring-1 ring-amber-500/30'
                  : 'bg-zinc-900 hover:bg-zinc-800 border-white/10 text-zinc-400 hover:text-zinc-200'
              }`}
              title="Toggle PayFast Sandbox Test Mode for your device"
            >
              <CreditCard className="w-3.5 h-3.5 text-amber-400" />
              <span>PayFast Sandbox: <strong className={isPayFastTesting ? 'text-amber-300' : 'text-zinc-500'}>{isPayFastTesting ? 'ON' : 'OFF'}</strong></span>
            </button>

            {/* Device Exclusion Toggle */}
            <button
              type="button"
              onClick={handleToggleDeviceExclusion}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                isDeviceExcluded
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30 ring-1 ring-emerald-500/30'
                  : 'bg-zinc-900 hover:bg-zinc-800 border-white/10 text-zinc-400 hover:text-zinc-200'
              }`}
              title="Toggle whether interactions from this computer are excluded from customer analytics"
            >
              <ShieldCheck className={`w-3.5 h-3.5 ${isDeviceExcluded ? 'text-emerald-400' : 'text-zinc-500'}`} />
              <span>Device Shield: <strong className={isDeviceExcluded ? 'text-emerald-300' : 'text-zinc-500'}>{isDeviceExcluded ? 'ON' : 'OFF'}</strong></span>
            </button>

            <button
              type="button"
              onClick={onBackToMenu}
              className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-xs font-bold text-zinc-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
              title="View Customer Food Menu"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Customer Menu</span>
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="p-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 hover:text-white transition-colors cursor-pointer"
              title="Logout from Admin"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ── Primary Tabs Navigation ── */}
      <div className="bg-[#101016] border-b border-white/10 px-3 sm:px-6 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Responsive Tabs Row */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar scroll-smooth pb-1 md:pb-0 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className={`px-3 sm:px-4 py-2 rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'orders'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-950/50'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-white/5'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
              <span>Customer Orders &amp; Google Sheets</span>
              <span className="px-2 py-0.5 rounded-full bg-black/40 text-[11px] font-mono">
                {orders.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('reviews')}
              className={`px-3 sm:px-4 py-2 rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'reviews'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-950/50'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-white/5'
              }`}
            >
              <Trophy className="w-4 h-4 text-amber-300" />
              <span>Weekly Meal Review Draw</span>
              <span className="px-2 py-0.5 rounded-full bg-black/40 text-[11px] font-mono">
                {entries.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('traffic')}
              className={`px-3 sm:px-4 py-2 rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'traffic'
                  ? 'bg-gradient-to-r from-rose-600 to-amber-600 text-white shadow-lg shadow-rose-950/50'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-white/5'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-rose-300" />
              <span>Customer Traffic &amp; Insights</span>
              <span className="px-2 py-0.5 rounded-full bg-black/40 text-[11px] font-mono flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{liveVisitors} Live</span>
              </span>
            </button>
          </div>

          {/* Action Buttons for Orders Tab */}
          {activeTab === 'orders' && (
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-end">
              <button
                type="button"
                onClick={() => setDailyOrdersReportModalOpen(true)}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 text-xs font-black flex items-center gap-1.5 shadow-md shadow-amber-950/40 transition-colors cursor-pointer"
                title="Generate Daily Orders & Sales Shift Report"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Daily Report</span>
              </button>

              <button
                type="button"
                onClick={() => exportOrdersToCsv(filteredOrders, `orders-${selectedOrderDate}`)}
                disabled={filteredOrders.length === 0}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black flex items-center gap-1.5 shadow-md shadow-emerald-950/40 transition-colors cursor-pointer disabled:opacity-40"
                title="Download orders in CSV format"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download CSV</span>
              </button>

              <button
                type="button"
                onClick={() => exportOrdersToPdf(filteredOrders, formatReportDateLabel(selectedOrderDate), orderMetrics)}
                disabled={filteredOrders.length === 0}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white text-xs font-black flex items-center gap-1.5 shadow-md shadow-rose-950/40 transition-colors cursor-pointer disabled:opacity-40"
                title="Download orders in PDF format"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Download PDF</span>
              </button>

              <button
                type="button"
                onClick={() => setWebhookModalOpen(true)}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-xs font-bold text-zinc-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Configure Google Sheets Live Webhook"
              >
                <Settings className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden xl:inline">Live Sheets Auto-Sync</span>
              </button>
            </div>
          )}

          {/* Action Buttons for Traffic Tab */}
          {activeTab === 'traffic' && (
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-end">
              <button
                type="button"
                onClick={handleRefreshTraffic}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-xs font-bold text-zinc-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Refresh customer traffic data"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-rose-400 ${isRefreshingTraffic ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>

              <button
                type="button"
                onClick={handleResetTraffic}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-rose-950/40 border border-white/10 hover:border-rose-500/30 text-xs font-bold text-zinc-400 hover:text-rose-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Reset test traffic data back to 0 for a clean slate"
              >
                <X className="w-3.5 h-3.5 text-zinc-400" />
                <span className="hidden xl:inline">Reset Test Data</span>
              </button>

              <button
                type="button"
                onClick={() => setDailyReportModalOpen(true)}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 text-xs font-black flex items-center gap-1.5 shadow-md shadow-amber-950/40 transition-colors cursor-pointer"
                title="Generate Daily Executive Shift Report"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Daily Report</span>
              </button>

              <button
                type="button"
                onClick={() => exportTrafficToCsv(trafficSummary, trafficRange.toUpperCase())}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black flex items-center gap-1.5 shadow-md shadow-emerald-950/40 transition-colors cursor-pointer"
                title="Download traffic metrics in CSV format"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download CSV</span>
              </button>

              <button
                type="button"
                onClick={() => exportTrafficToPdf(trafficSummary, trafficRange === 'today' ? "Today's Rush" : trafficRange === 'yesterday' ? 'Yesterday' : trafficRange === 'week' ? 'Past 7 Days' : 'All-Time', trafficOrdersData)}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white text-xs font-black flex items-center gap-1.5 shadow-md shadow-rose-950/40 transition-colors cursor-pointer"
                title="Download traffic intelligence in PDF format"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Download PDF</span>
              </button>
            </div>
          )}

          {/* Action Buttons for Reviews Tab */}
          {activeTab === 'reviews' && (
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-end">
              <button
                type="button"
                onClick={() => exportEntriesToCsv(entries)}
                disabled={entries.length === 0}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black flex items-center gap-1.5 shadow-md shadow-emerald-950/40 transition-colors cursor-pointer disabled:opacity-40"
                title="Download review entries in CSV format"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download CSV</span>
              </button>

              <button
                type="button"
                onClick={() => exportReviewEntriesToPdf(entries)}
                disabled={entries.length === 0}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white text-xs font-black flex items-center gap-1.5 shadow-md shadow-rose-950/40 transition-colors cursor-pointer disabled:opacity-40"
                title="Download review entries in PDF format"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Download PDF</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Main Dashboard Body ── */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 flex-1">
        
        {/* ==================================================================== */}
        {/* TAB 1: CUSTOMER ORDERS & SALES CRM (GOOGLE SHEETS & SMS)             */}
        {/* ==================================================================== */}
        {activeTab === 'orders' && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Metric Cards Row */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
              <div className="p-4 sm:p-5 rounded-2xl bg-[#13131a] border border-white/10 shadow-lg space-y-1">
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Total Sales</span>
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-emerald-400">
                  R{orderMetrics.totalRevenue.toFixed(2)}
                </div>
                <p className="text-[11px] text-zinc-400">
                  Food: R{orderMetrics.subtotal.toFixed(0)} • Delivery: R{orderMetrics.deliveryFees.toFixed(0)}
                </p>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-[#13131a] border border-white/10 shadow-lg space-y-1">
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Orders Placed</span>
                  <ShoppingBag className="w-4 h-4 text-rose-500" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-white">
                  {orderMetrics.totalOrders}
                </div>
                <p className="text-[11px] text-zinc-400">
                  Avg Ticket: R{orderMetrics.avgOrderValue.toFixed(2)}
                </p>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-[#13131a] border border-white/10 shadow-lg space-y-1">
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Delivery Split</span>
                  <DeliveryMotorbikeIcon className="w-4 h-4 text-orange-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-amber-400">
                  {orderMetrics.deliveriesCount} <span className="text-xs text-zinc-400 font-normal">/ {orderMetrics.collectionsCount} pick</span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  R{orderMetrics.deliveryRevenue.toFixed(0)} del • R{orderMetrics.collectionRevenue.toFixed(0)} pick
                </p>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-[#13131a] border border-white/10 shadow-lg space-y-1">
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Driver Tips</span>
                  <Flame className="w-4 h-4 text-yellow-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-yellow-400">
                  R{orderMetrics.totalTips.toFixed(2)}
                </div>
                <p className="text-[11px] text-zinc-400">Collected for delivery team</p>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-[#13131a] border border-white/10 shadow-lg space-y-1 col-span-2 lg:col-span-1">
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Food Items Sold</span>
                  <ChefHat className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-cyan-400">
                  {orderMetrics.totalItemsCount}
                </div>
                <p className="text-[11px] text-zinc-400">Portions cooked on {formatReportDateLabel(selectedOrderDate)}</p>
              </div>
            </div>

            {/* Action Toolbar */}
            <div className="p-4 sm:p-6 rounded-3xl bg-[#13131a] border border-white/10 shadow-xl flex flex-col lg:flex-row items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                {/* Daily Orders Report Button */}
                <button
                  type="button"
                  onClick={() => setDailyOrdersReportModalOpen(true)}
                  className="py-3 px-4 sm:px-5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 active:scale-95 text-zinc-950 font-black text-xs sm:text-sm tracking-wide shadow-lg shadow-amber-950/60 transition-all flex items-center gap-2 cursor-pointer"
                  title="Open Daily Orders & Sales Shift Report"
                >
                  <FileText className="w-4 h-4 text-zinc-950" />
                  <span>📄 Daily Orders Report</span>
                </button>

                {/* 1-Click Export to Google Sheets Button */}
                <button
                  type="button"
                  onClick={() => exportOrdersToCsv(filteredOrders, `orders-${selectedOrderDate}`)}
                  disabled={filteredOrders.length === 0}
                  className="py-3 px-4 sm:px-5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white font-black text-xs sm:text-sm tracking-wide shadow-lg shadow-emerald-950/60 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  title="Download clean CSV ready for Google Sheets, Microsoft Excel, and Bulk SMS"
                >
                  <Download className="w-4 h-4" />
                  <span>📊 Export CSV</span>
                </button>

                {/* 1-Click Export to Official PDF Button */}
                <button
                  type="button"
                  onClick={() => exportOrdersToPdf(filteredOrders, formatReportDateLabel(selectedOrderDate), orderMetrics)}
                  disabled={filteredOrders.length === 0}
                  className="py-3 px-4 sm:px-5 rounded-2xl bg-gradient-to-r from-rose-600 via-pink-600 to-rose-700 hover:from-rose-500 hover:to-pink-500 active:scale-95 text-white font-black text-xs sm:text-sm tracking-wide shadow-lg shadow-rose-950/60 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  title="Download official branded PDF orders and sales report"
                >
                  <FileText className="w-4 h-4" />
                  <span>📄 Export PDF</span>
                </button>

                {/* Date Selector */}
                <div className="inline-flex items-center gap-1 rounded-xl bg-zinc-900 p-1 border border-white/5 text-xs">
                  <div className="flex items-center gap-1 text-zinc-400 px-1.5 font-bold">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    <span className="hidden sm:inline">Date:</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedOrderDate(getLocalTodayDateString())}
                    className={`px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                      selectedOrderDate === getLocalTodayDateString()
                        ? 'bg-amber-500 text-zinc-950 shadow-sm'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const y = new Date();
                      y.setDate(y.getDate() - 1);
                      setSelectedOrderDate(formatToLocalDateString(y));
                    }}
                    className={`px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                      (() => {
                        const y = new Date();
                        y.setDate(y.getDate() - 1);
                        return selectedOrderDate === formatToLocalDateString(y);
                      })()
                        ? 'bg-amber-500 text-zinc-950 shadow-sm'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Yesterday
                  </button>
                  <input
                    type="date"
                    value={selectedOrderDate === 'all' ? '' : selectedOrderDate}
                    onChange={(e) => {
                      if (e.target.value) setSelectedOrderDate(e.target.value);
                    }}
                    className="bg-zinc-800 text-zinc-200 text-xs px-2 py-1 rounded-lg border border-white/10 focus:outline-none focus:border-amber-400 cursor-pointer font-mono"
                    title="Pick any specific date from calendar"
                  />
                  <button
                    type="button"
                    onClick={() => setSelectedOrderDate('all')}
                    className={`px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                      selectedOrderDate === 'all'
                        ? 'bg-zinc-700 text-white'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    All Dates
                  </button>
                </div>

                {/* Mode Filter */}
                <div className="inline-flex rounded-xl bg-zinc-900 p-1 border border-white/5 text-xs">
                  <button
                    type="button"
                    onClick={() => setOrderModeFilter('all')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                      orderModeFilter === 'all'
                        ? 'bg-rose-600 text-white'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    All ({dayOrdersData.totalOrders})
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderModeFilter('delivery')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                      orderModeFilter === 'delivery'
                        ? 'bg-orange-500 text-zinc-950'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Deliveries ({dayOrdersData.deliveriesCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderModeFilter('collection')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                      orderModeFilter === 'collection'
                        ? 'bg-amber-400 text-zinc-950'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Collections ({dayOrdersData.collectionsCount})
                  </button>
                </div>

                {/* Cloud Sync Button */}
                <button
                  type="button"
                  onClick={async () => {
                    setIsSyncingOrders(true);
                    const fresh = await syncOrdersFromCloud();
                    setOrders(fresh);
                    setTimeout(() => setIsSyncingOrders(false), 600);
                  }}
                  disabled={isSyncingOrders}
                  className="p-2.5 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-xs font-bold text-zinc-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Fetch latest cloud orders"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-rose-400 ${isSyncingOrders ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">{isSyncingOrders ? 'Syncing...' : 'Sync Cloud'}</span>
                </button>
              </div>

              {/* Search Box */}
              <div className="relative w-full lg:w-80">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={orderSearchQuery}
                  onChange={(e) => setOrderSearchQuery(e.target.value)}
                  placeholder="Search customer name, cell, #order ID, suburb..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-emerald-400 transition-colors"
                />
              </div>
            </div>

            {/* Orders Table */}
            <div className="rounded-3xl bg-[#13131a] border border-white/10 shadow-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-white/10 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-black uppercase text-white tracking-wider flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <span>Captured Online Customer Orders ({filteredOrders.length})</span>
                </h2>
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  <span>Showing: <strong className="text-zinc-200">{formatReportDateLabel(selectedOrderDate)}</strong></span>
                  {selectedOrderDate !== 'all' && (
                    <button
                      type="button"
                      onClick={() => setSelectedOrderDate('all')}
                      className="ml-1.5 px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-[11px] text-zinc-300 font-bold transition-colors cursor-pointer"
                    >
                      Show All Dates
                    </button>
                  )}
                </div>
              </div>

              {filteredOrders.length === 0 ? (
                <div className="py-16 px-4 text-center space-y-3">
                  <ShoppingBag className="w-12 h-12 mx-auto text-zinc-600" />
                  <h3 className="text-base font-bold text-white">No Orders Found</h3>
                  <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                    {orderSearchQuery
                      ? 'No orders match your search criteria.'
                      : 'Orders placed on the customer website appear here automatically in real time.'}
                  </p>
                </div>
              ) : (
                <>
                  {/* Mobile-Friendly Orders Card View (Visible on screens < lg) */}
                  <div className="block lg:hidden divide-y divide-white/5 p-3 space-y-3">
                    {filteredOrders.map((o) => {
                      const isDelivery = o.orderMode === 'delivery';
                      const tip = typeof o.tip === 'number' ? o.tip : 0;
                      const cleanPhone = (o.customer?.phone || '').replace(/\D/g, '');
                      const waPhone = getCleanWhatsAppPhone(o.customer?.phone || '');

                      return (
                        <div
                          key={o.orderId}
                          className="p-4 rounded-2xl bg-zinc-900/90 border border-white/5 space-y-3 shadow-md"
                        >
                          {/* Card Header: ID, Date/Time, Status Badge */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-black text-white text-base">
                                #{o.orderId}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                  isDelivery ? 'bg-orange-500 text-zinc-950' : 'bg-amber-400 text-zinc-950'
                                }`}
                              >
                                {isDelivery ? '🏍️ Delivery' : '🛍️ Pick'}
                              </span>
                            </div>

                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                o.status === 'completed'
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                  : o.status === 'cooking'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                  : o.status === 'ready'
                                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                                  : o.status === 'dispatched'
                                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                                  : o.status === 'cancelled'
                                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                                  : 'bg-zinc-800 text-zinc-300 border border-white/10'
                              }`}
                            >
                              {o.status === 'cancelled' ? '❌ UNPAID / CANCELLED' : o.status}
                            </span>
                          </div>

                          {/* Placed Timestamp */}
                          <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-amber-400" />
                            <span>Placed: {o.createdAt || 'Recent'}</span>
                          </div>

                          {/* Customer Details & 1-Tap Contact */}
                          <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="font-bold text-white text-xs truncate">
                                {o.customer?.customerName || 'Customer'}
                              </div>
                              <div className="text-[11px] text-zinc-400 truncate">
                                {isDelivery
                                  ? `${o.customer?.address || ''}, ${o.customer?.suburb || 'Pinetown'}`
                                  : 'Store Pickup at Shop 1'}
                              </div>
                            </div>

                            {o.customer?.phone && (
                              <div className="flex items-center gap-1.5 shrink-0">
                                <a
                                  href={`tel:${cleanPhone}`}
                                  className="p-2 rounded-xl bg-zinc-800 text-emerald-400 hover:bg-emerald-500 hover:text-zinc-950 transition-colors"
                                  title="Call Customer"
                                >
                                  <Phone className="w-3.5 h-3.5" />
                                </a>
                                <a
                                  href={`https://wa.me/${waPhone}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500 hover:text-zinc-950 transition-colors"
                                  title="WhatsApp Customer"
                                >
                                  <MessageCircle className="w-3.5 h-3.5" />
                                </a>
                              </div>
                            )}
                          </div>

                          {/* Items Ordered List */}
                          <div className="space-y-1 text-xs">
                            <span className="text-[10px] uppercase font-bold text-zinc-500">Ordered Meals:</span>
                            {(o.items || []).map((it, idx) => (
                              <div key={idx} className="flex justify-between text-zinc-300">
                                <span className="truncate pr-2">
                                  <strong className="text-white">{it.quantity || 1}x</strong> {it.menuItem?.name || 'Meal Item'}
                                  {it.customization?.flavour && (
                                    <span className="text-rose-400 ml-1">({it.customization.flavour})</span>
                                  )}
                                </span>
                                <span className="font-mono text-zinc-400 shrink-0">
                                  R{((it.itemTotal || (it.menuItem?.price ? it.menuItem.price * (it.quantity || 1) : 0))).toFixed(2)}
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* Footer: Grand Total & Payment Method */}
                          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                  o.paymentStatus === 'paid'
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-zinc-800 text-zinc-300 border border-white/5'
                                }`}
                              >
                                {(o.paymentMethod || 'cod').toUpperCase()}
                              </span>
                              {tip > 0 && <span className="text-yellow-400 text-[11px] font-bold">+R{tip} Tip</span>}
                            </div>
                            <div className="font-mono font-black text-amber-400 text-base">
                              R{(o.grandTotal || 0).toFixed(2)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Desktop Spreadsheet Table View (Visible on screens >= lg) */}
                  <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-900/80 text-[11px] font-black uppercase text-zinc-400 border-b border-white/10">
                      <tr>
                        <th className="py-3 px-4">Order ID &amp; Time</th>
                        <th className="py-3 px-4">Customer Name</th>
                        <th className="py-3 px-4">Cell / WhatsApp (SMS)</th>
                        <th className="py-3 px-4">Type &amp; Address</th>
                        <th className="py-3 px-4">Items Summary</th>
                        <th className="py-3 px-4">Subtotal</th>
                        <th className="py-3 px-4">Driver Tip</th>
                        <th className="py-3 px-4">Total</th>
                        <th className="py-3 px-4">Payment</th>
                        <th className="py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredOrders.map((o) => {
                        const isDelivery = o.orderMode === 'delivery';
                        const tip = typeof o.tip === 'number' ? o.tip : 0;
                        const subtotal = typeof o.subtotal === 'number' ? o.subtotal : (o.grandTotal || 0);
                        const cleanPhone = (o.customer?.phone || '').replace(/\D/g, '');
                        const waPhone = getCleanWhatsAppPhone(o.customer?.phone || '');

                        return (
                          <tr key={o.orderId} className="hover:bg-white/[0.02] transition-colors">
                            {/* Order ID & Time */}
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <div className="font-mono font-black text-white text-sm">
                                #{o.orderId}
                              </div>
                              <div className="text-[10px] text-zinc-400 flex items-center gap-1 mt-0.5">
                                <Clock className="w-3 h-3 text-amber-400" />
                                <span>{o.createdAt}</span>
                              </div>
                            </td>

                            {/* Customer Name */}
                            <td className="py-3.5 px-4 font-bold text-white whitespace-nowrap">
                              {o.customer?.customerName || 'Customer'}
                            </td>

                            {/* Cell / WhatsApp Phone */}
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              {o.customer?.phone ? (
                                <div className="flex items-center gap-2">
                                  <a
                                    href={`tel:${cleanPhone}`}
                                    className="text-white hover:text-emerald-400 font-bold flex items-center gap-1"
                                    title="Call customer directly"
                                  >
                                    <Phone className="w-3 h-3 text-emerald-400" />
                                    <span>{o.customer.phone}</span>
                                  </a>
                                  <a
                                    href={`https://wa.me/${waPhone}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1 rounded bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500 hover:text-zinc-950 transition-colors"
                                    title="WhatsApp customer"
                                  >
                                    <MessageCircle className="w-3 h-3" />
                                  </a>
                                </div>
                              ) : (
                                <span className="text-zinc-500">No phone</span>
                              )}
                            </td>

                            {/* Type & Address */}
                            <td className="py-3.5 px-4 max-w-xs">
                              <span
                                className={`inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase mb-1 ${
                                  isDelivery ? 'bg-orange-500 text-zinc-950' : 'bg-amber-400 text-zinc-950'
                                }`}
                              >
                                {isDelivery ? '🏍️ Delivery' : '🛍️ Collection'}
                              </span>
                              {isDelivery ? (
                                <div className="text-[11px] text-zinc-300 line-clamp-2">
                                  {o.customer?.address}, {o.customer?.suburb || 'Pinetown'}
                                  {o.customer?.complexOrUnit ? ` (Unit ${o.customer.complexOrUnit})` : ''}
                                </div>
                              ) : (
                                <div className="text-[11px] text-zinc-400">Store Pickup at Shop 1</div>
                              )}
                            </td>

                            {/* Items Summary */}
                            <td className="py-3.5 px-4 max-w-xs">
                              <div className="space-y-0.5">
                                {(o.items || []).map((it, idx) => (
                                  <div key={idx} className="text-[11px] text-zinc-200">
                                    <span className="font-bold text-white">{it.quantity || 1}x</span>{' '}
                                    {it.menuItem?.name || 'Meal'}
                                    {it.customization?.flavour && (
                                      <span className="text-rose-400 font-semibold ml-1">
                                        ({it.customization.flavour})
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </td>

                            {/* Subtotal */}
                            <td className="py-3.5 px-4 font-bold text-zinc-300 whitespace-nowrap">
                              R{subtotal.toFixed(2)}
                            </td>

                            {/* Driver Tip (Yellow) */}
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              {tip > 0 ? (
                                <span className="text-yellow-400 font-black">+R{tip.toFixed(2)}</span>
                              ) : (
                                <span className="text-zinc-500">—</span>
                              )}
                            </td>

                            {/* Total */}
                            <td className="py-3.5 px-4 font-black text-amber-400 text-sm whitespace-nowrap">
                              R{(o.grandTotal || 0).toFixed(2)}
                            </td>

                            {/* Payment */}
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                  o.paymentStatus === 'paid'
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-zinc-800 text-zinc-300 border border-white/5'
                                }`}
                              >
                                {(o.paymentMethod || 'cod').toUpperCase()}
                              </span>
                            </td>

                            {/* Status */}
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <span
                                className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                                  o.status === 'completed'
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                    : o.status === 'cooking'
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                    : o.status === 'ready'
                                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                                    : o.status === 'dispatched'
                                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                                    : 'bg-zinc-800 text-zinc-300 border border-white/10'
                                }`}
                              >
                                {o.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>

          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 2: WEEKLY MEAL VOUCHER CUSTOMER REVIEW DRAW (GOOGLE REVIEWS)      */}
        {/* ==================================================================== */}
        {activeTab === 'reviews' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Metric Cards Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="p-4 sm:p-5 rounded-2xl bg-[#13131a] border border-white/10 shadow-lg space-y-1">
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Total Entries</span>
                  <Users className="w-4 h-4 text-rose-500" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-white">{reviewMetrics.total}</div>
                <p className="text-[11px] text-zinc-400">All-time review entries</p>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-[#13131a] border border-white/10 shadow-lg space-y-1">
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="text-[11px] font-bold uppercase tracking-wider">This Week</span>
                  <Calendar className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-amber-400">{reviewMetrics.thisWeek}</div>
                <p className="text-[11px] text-zinc-400">Eligible for Sunday draw</p>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-[#13131a] border border-white/10 shadow-lg space-y-1">
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Avg Satisfaction</span>
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-white">{reviewMetrics.avgRating} ★</div>
                <p className="text-[11px] text-zinc-400">Customer feedback score</p>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-[#13131a] border border-white/10 shadow-lg space-y-1">
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Winners Drawn</span>
                  <Trophy className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-emerald-400">{reviewMetrics.winners}</div>
                <p className="text-[11px] text-zinc-400">Weekly meal combos awarded</p>
              </div>
            </div>

            {/* QR Code & In-Store Print Kit Card */}
            <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-[#151520] via-[#121217] to-[#161622] border border-amber-500/30 shadow-xl space-y-4">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 text-xl font-black shrink-0">
                    📱
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                      In-Store Till Flyers &amp; Takeaway Bag Inserts
                    </div>
                    <h3 className="text-base sm:text-lg font-black text-white">
                      Weekly Wrap Meal Draw QR Code &amp; Campaign URL
                    </h3>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href="https://wrapandwings.co.za/#review"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-xs font-bold text-zinc-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>Test Customer Page</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <a
                    href="https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=https%3A%2F%2Fwrapandwings.co.za%2F%23review"
                    download="wrap-and-wings-meal-qr-code.png"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download QR Code (PNG)</span>
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                {/* QR Code Preview */}
                <div className="p-3.5 rounded-2xl bg-zinc-900/90 border border-white/10 flex flex-col items-center justify-center text-center space-y-2">
                  <img
                    src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https%3A%2F%2Fwrapandwings.co.za%2F%23review"
                    alt="Scan for Weekly Meal Draw"
                    className="w-32 h-32 rounded-xl bg-white p-2 shadow-inner"
                  />
                  <div className="text-[11px] font-mono text-amber-300 font-bold break-all">
                    wrapandwings.co.za/#review
                  </div>
                </div>

                {/* Takeaway Bag Insert Copy Draft */}
                <div className="md:col-span-2 p-4 rounded-2xl bg-zinc-950/80 border border-white/5 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-zinc-400">
                    <span className="font-bold uppercase tracking-wider text-[11px] text-amber-400">
                      📄 Print Copy Draft (Flyer / Bag Insert):
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(
                          "WIN A FREE WRAP MEAL THIS WEEK! 🌯🔥\nLoved your meal? Want to help our brand new local spot grow?\n1. Scan the QR code or visit wrapandwings.co.za/#review\n2. Drop us your receipt number & honest review on Google.\n3. Stand a chance to win this week's featured Wrap Meal combo in our Sunday draw!"
                        );
                        alert("Flyer text copied to clipboard!");
                      }}
                      className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-[11px] cursor-pointer"
                    >
                      Copy Flyer Copy
                    </button>
                  </div>
                  <div className="p-3 rounded-xl bg-zinc-900 border border-white/5 font-mono text-[11px] text-zinc-300 leading-relaxed">
                    <p className="font-bold text-white">WIN A FREE WRAP MEAL THIS WEEK! 🌯🔥</p>
                    <p>Loved your meal? Want to help our brand new local spot grow?</p>
                    <p>1. Scan the QR code or visit <strong>wrapandwings.co.za/#review</strong></p>
                    <p>2. Enter your receipt slip number &amp; leave a quick review on Google</p>
                    <p>3. Stand a chance to win this week's featured Wrap Meal combo in our Sunday draw!</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Controls & Toolbar */}
            <div className="p-4 sm:p-6 rounded-3xl bg-[#13131a] border border-white/10 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                {/* Draw Winner Button */}
                <button
                  type="button"
                  onClick={handleDrawRandomWinner}
                  disabled={entries.length === 0}
                  className="py-3 px-5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 active:scale-95 text-white font-black text-xs sm:text-sm tracking-wide shadow-lg shadow-amber-950/60 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Shuffle className="w-4 h-4" />
                  <span>🎲 Draw Sunday Winner</span>
                </button>

                {/* Export CSV Button */}
                <button
                  type="button"
                  onClick={() => exportEntriesToCsv(entries)}
                  disabled={entries.length === 0}
                  className="py-3 px-4 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-white font-bold text-xs sm:text-sm flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                  title="Download all entries into Excel / CSV"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>Export Review CSV</span>
                </button>

                {/* Export PDF Button */}
                <button
                  type="button"
                  onClick={() => exportReviewEntriesToPdf(entries)}
                  disabled={entries.length === 0}
                  className="py-3 px-4 rounded-2xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50 shadow-md shadow-rose-950/40"
                  title="Download review entries in official PDF format"
                >
                  <FileText className="w-4 h-4" />
                  <span>Export Review PDF</span>
                </button>

                {/* Status Filter Buttons */}
                <div className="inline-flex rounded-xl bg-zinc-900 p-1 border border-white/5 text-xs">
                  <button
                    type="button"
                    onClick={() => setReviewStatusFilter('all')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                      reviewStatusFilter === 'all'
                        ? 'bg-rose-600 text-white'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    All ({entries.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewStatusFilter('winner')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                      reviewStatusFilter === 'winner'
                        ? 'bg-amber-500 text-zinc-950'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Winners ({reviewMetrics.winners})
                  </button>
                </div>
              </div>

              {/* Search Box */}
              <div className="relative w-full md:w-72">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={reviewSearchQuery}
                  onChange={(e) => setReviewSearchQuery(e.target.value)}
                  placeholder="Search name, phone, slip #..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>
            </div>

            {/* Entries Table */}
            <div className="rounded-3xl bg-[#13131a] border border-white/10 shadow-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                <h2 className="text-sm font-black uppercase text-white tracking-wider flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span>Customer Draw Entries ({filteredReviews.length})</span>
                </h2>
                <span className="text-xs text-zinc-400">Live Feedback &amp; Review Bridge Log</span>
              </div>

              {filteredReviews.length === 0 ? (
                <div className="py-16 px-4 text-center space-y-3">
                  <Trophy className="w-12 h-12 mx-auto text-zinc-600" />
                  <h3 className="text-base font-bold text-white">No Entries Found</h3>
                  <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                    {reviewSearchQuery
                      ? 'No entries match your search query.'
                      : 'Customer entries will appear here the moment someone scans the QR code and submits their details.'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-900/80 text-[11px] font-black uppercase text-zinc-400 border-b border-white/10">
                      <tr>
                        <th className="py-3 px-4">Date &amp; Time</th>
                        <th className="py-3 px-4">Customer Name</th>
                        <th className="py-3 px-4">WhatsApp / Cell</th>
                        <th className="py-3 px-4">Receipt #</th>
                        <th className="py-3 px-4">Google Account</th>
                        <th className="py-3 px-4">Rating</th>
                        <th className="py-3 px-4">Comments</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredReviews.map((e) => (
                        <tr
                          key={e.id}
                          className={`hover:bg-white/[0.02] transition-colors ${
                            e.status === 'winner' ? 'bg-amber-500/10' : ''
                          }`}
                        >
                          <td className="py-3.5 px-4 text-zinc-400 whitespace-nowrap">
                            {new Date(e.createdAt).toLocaleDateString('en-ZA', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>

                          <td className="py-3.5 px-4 font-bold text-white whitespace-nowrap">
                            {e.fullName}
                          </td>

                          <td className="py-3.5 px-4 text-zinc-300 whitespace-nowrap">
                            <a
                              href={`https://wa.me/${getCleanWhatsAppPhone(e.phone)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-emerald-400 hover:underline"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>{e.phone}</span>
                            </a>
                          </td>

                          <td className="py-3.5 px-4 font-mono font-bold text-amber-300 whitespace-nowrap">
                            {e.receiptNumber}
                          </td>

                          <td className="py-3.5 px-4 text-zinc-300 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded-lg bg-zinc-800 border border-white/5 text-zinc-200">
                              {e.googleReviewName}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-amber-400 font-bold whitespace-nowrap">
                            {e.rating || 5} ★
                          </td>

                          <td className="py-3.5 px-4 text-zinc-400 max-w-xs truncate" title={e.comments}>
                            {e.comments || '—'}
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {e.status === 'winner' ? (
                              <span className="px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 font-black text-[10px] uppercase flex items-center gap-1 w-max">
                                <Trophy className="w-3 h-3" />
                                <span>Winner</span>
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 text-[10px] font-bold uppercase">
                                Pending
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            {e.status !== 'winner' ? (
                              <button
                                type="button"
                                onClick={() => handleMarkAsWinner(e)}
                                className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-amber-600 hover:text-zinc-950 text-zinc-300 text-[11px] font-bold transition-all cursor-pointer"
                              >
                                Mark Winner
                              </button>
                            ) : (
                              <span className="text-[11px] text-emerald-400 font-bold">Awarded</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 3: CUSTOMER TRAFFIC & VISITOR REPORT                             */}
        {/* ==================================================================== */}
        {activeTab === 'traffic' && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Top Control Bar: Date Range Filter & Live Status */}
            <div className="bg-[#14141c] border border-white/10 rounded-3xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                    <span>Customer Traffic &amp; Website Intelligence</span>
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Real-time digital dining room activity across Pinetown &amp; surrounds
                  </p>
                </div>
              </div>

              {/* Time Range Filter Pills */}
              <div className="flex items-center gap-1.5 bg-zinc-900/90 p-1.5 rounded-2xl border border-white/5 w-full md:w-auto overflow-x-auto">
                {(
                  [
                    { id: 'today', label: "Today's Rush" },
                    { id: 'yesterday', label: 'Yesterday' },
                    { id: 'week', label: 'Past 7 Days' },
                    { id: 'all', label: 'All-Time' },
                  ] as const
                ).map((range) => (
                  <button
                    key={range.id}
                    type="button"
                    onClick={() => setTrafficRange(range.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                      trafficRange === range.id
                        ? 'bg-rose-600 text-white shadow-md'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Staff Testing & Privacy Shield Control Center */}
            <div className="bg-gradient-to-r from-emerald-950/30 via-zinc-900 to-zinc-900 border border-emerald-500/30 rounded-3xl p-4 sm:p-5 space-y-4 shadow-xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm sm:text-base font-black text-white">
                        Staff Testing &amp; Privacy Shield
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {isDeviceExcluded ? 'Protection Active' : 'Protection Off'}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400">
                      Excludes your computer &amp; staff Wi-Fi from diner analytics so reports stay 100% accurate.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleToggleDeviceExclusion}
                    className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer flex-1 sm:flex-initial ${
                      isDeviceExcluded
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                        : 'bg-zinc-800 text-zinc-400 border border-white/10 hover:text-white'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>This Computer: {isDeviceExcluded ? 'Excluded (Hidden)' : 'Include in Analytics'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCleanTodayTestData}
                    className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-white/10 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0"
                    title="Clean up local test visits and sync with cloud"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                    <span>{cleanDataFeedback ? 'Cleaned!' : 'Sync Clean Data'}</span>
                  </button>
                </div>
              </div>

              {/* IP Exclusion Row */}
              <div className="pt-3 border-t border-white/5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-zinc-400 flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-blue-400" />
                    Your Public IP:
                  </span>
                  <span className="font-mono font-bold text-white bg-black/40 px-2 py-0.5 rounded border border-white/10">
                    {clientIp || 'Detecting...'}
                  </span>
                  {clientIp && (
                    <button
                      type="button"
                      onClick={handleToggleCurrentIpExclusion}
                      className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                        excludedIpsList.includes(clientIp)
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-blue-600 hover:bg-blue-500 text-white'
                      }`}
                    >
                      {excludedIpsList.includes(clientIp) ? '✓ IP Excluded' : '+ Exclude This IP'}
                    </button>
                  )}
                </div>

                {/* Excluded IPs Chips and Add Form */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-zinc-500 text-[11px]">Excluded IPs:</span>
                  {excludedIpsList.map((ip) => (
                    <span
                      key={ip}
                      className="px-2 py-0.5 rounded bg-zinc-800 border border-white/10 text-zinc-300 font-mono text-[11px] flex items-center gap-1.5"
                    >
                      <span>{ip}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveIp(ip)}
                        className="text-zinc-500 hover:text-rose-400 transition-colors ml-0.5"
                        title="Remove IP"
                      >
                        ×
                      </button>
                    </span>
                  ))}

                  <form onSubmit={handleAddCustomIp} className="flex items-center gap-1">
                    <input
                      type="text"
                      placeholder="Add IP (e.g. 105.x.x.x)"
                      value={customIpInput}
                      onChange={(e) => setCustomIpInput(e.target.value)}
                      className="px-2 py-1 rounded-lg bg-black/40 border border-white/10 text-zinc-200 text-[11px] font-mono placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 w-36"
                    />
                    <button
                      type="submit"
                      className="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-bold border border-white/10 cursor-pointer"
                    >
                      + Add
                    </button>
                  </form>
                </div>
              </div>
            </div>

            {/* ── 4 Executive KPI Hero Cards ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {/* Card 1: Total Visits */}
              <div className="p-4 sm:p-5 rounded-3xl bg-[#14141c] border border-white/10 space-y-2 relative overflow-hidden shadow-lg">
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="text-xs font-bold uppercase tracking-wider">Total Page Views</span>
                  <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                    <Eye className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-blue-400 font-mono text-center">
                  {trafficSummary.totalPageViews}
                </div>
                <p className="text-[11px] text-zinc-400 text-center">Total digital visits &amp; menu browses</p>
              </div>

              {/* Card 2: Unique Diners */}
              <div className="p-4 sm:p-5 rounded-3xl bg-[#14141c] border border-white/10 space-y-2 relative overflow-hidden shadow-lg">
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="text-xs font-bold uppercase tracking-wider">Unique Diners</span>
                  <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-blue-400 font-mono text-center">
                  {trafficSummary.uniqueVisitorIds.length}
                </div>
                <p className="text-[11px] text-zinc-400 text-center">Individual phones &amp; devices</p>
              </div>

              {/* Card 3: Live In Shop Right Now */}
              <div className="p-4 sm:p-5 rounded-3xl bg-[#14141c] border border-blue-500/30 space-y-2 relative overflow-hidden shadow-lg">
                <div className="flex items-center justify-between text-blue-400">
                  <span className="text-xs font-bold uppercase tracking-wider">Online Right Now</span>
                  <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center relative">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-ping absolute" />
                    <Activity className="w-4 h-4 relative" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-blue-400 font-mono text-center">
                  {liveVisitors}
                </div>
                <p className="text-[11px] text-zinc-400 text-center">Active in the last 10 minutes</p>
              </div>

              {/* Card 4: Items Ordered & Food Sold */}
              <div className="p-4 sm:p-5 rounded-3xl bg-[#14141c] border border-blue-500/30 space-y-2 relative overflow-hidden shadow-lg">
                <div className="flex items-center justify-between text-blue-400">
                  <span className="text-xs font-bold uppercase tracking-wider">Food Items Ordered</span>
                  <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-blue-400 font-mono text-center">
                  {trafficOrdersData.totalItemsCount}
                </div>
                <p className="text-[11px] text-zinc-400 text-center">
                  {trafficOrdersData.ordersCount} orders • R{trafficOrdersData.revenue.toFixed(2)} sales
                </p>
              </div>
            </div>

            {/* ── Main Two-Column Breakdown ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* LEFT COLUMN: Sources & Devices */}
              <div className="space-y-6">

                {/* Acquisition Sources Card */}
                <div className="bg-[#14141c] border border-white/10 rounded-3xl p-5 sm:p-6 space-y-5 shadow-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                        <Globe className="w-4 h-4" />
                      </div>
                      <h3 className="text-sm font-black text-white uppercase tracking-wider">
                        Where Diners Found You
                      </h3>
                    </div>
                    <span className="text-xs text-zinc-400">Traffic Source</span>
                  </div>

                  {(() => {
                    const totalSources =
                      (trafficSummary.sources.google_gmb || 0) +
                      (trafficSummary.sources.whatsapp || 0) +
                      (trafficSummary.sources.social || 0) +
                      (trafficSummary.sources.direct || 0) || 1;

                    const sourcesList = [
                      {
                        name: 'Google Business Profile & Maps',
                        desc: 'Found via Google Search & Google Maps in Pinetown',
                        count: trafficSummary.sources.google_gmb || 0,
                        color: 'from-blue-500 to-indigo-600',
                        textColor: 'text-blue-400',
                      },
                      {
                        name: 'WhatsApp Broadcasts & Chat',
                        desc: 'Tapped links in WhatsApp status & chats',
                        count: trafficSummary.sources.whatsapp || 0,
                        color: 'from-blue-500 to-indigo-600',
                        textColor: 'text-blue-400',
                      },
                      {
                        name: 'Social Media (Instagram/TikTok/FB)',
                        desc: 'Arrived from social promo links',
                        count: trafficSummary.sources.social || 0,
                        color: 'from-blue-500 to-indigo-600',
                        textColor: 'text-blue-400',
                      },
                      {
                        name: 'Direct & Brand Bookmark',
                        desc: 'Typed wrapandwings.co.za directly',
                        count: trafficSummary.sources.direct || 0,
                        color: 'from-blue-500 to-indigo-600',
                        textColor: 'text-blue-400',
                      },
                    ];

                    return (
                      <div className="space-y-4">
                        {sourcesList.map((src, idx) => {
                          const pct = Math.round((src.count / totalSources) * 100);
                          return (
                            <div key={idx} className="space-y-1.5">
                              <div className="flex items-center justify-between text-xs">
                                <div>
                                  <span className="font-bold text-white">{src.name}</span>
                                  <p className="text-[11px] text-zinc-500">{src.desc}</p>
                                </div>
                                <div className="text-right">
                                  <span className={`font-mono font-black ${src.textColor}`}>
                                    {src.count}
                                  </span>
                                  <span className="text-[11px] text-zinc-500 ml-1.5 font-mono">
                                    ({pct}%)
                                  </span>
                                </div>
                              </div>
                              <div className="w-full h-2 rounded-full bg-zinc-900 overflow-hidden">
                                <div
                                  className={`h-full rounded-full bg-gradient-to-r ${src.color} transition-all duration-500`}
                                  style={{ width: `${Math.max(4, pct)}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>

                {/* Device Breakdown Card */}
                <div className="bg-[#14141c] border border-white/10 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                        <Smartphone className="w-4 h-4" />
                      </div>
                      <h3 className="text-sm font-black text-white uppercase tracking-wider">
                        Customer Devices
                      </h3>
                    </div>
                    <span className="text-xs text-zinc-400">Mobile vs Desktop</span>
                  </div>

                  {(() => {
                    const totalDevices =
                      (trafficSummary.devices.ios || 0) +
                      (trafficSummary.devices.android || 0) +
                      (trafficSummary.devices.desktop || 0) || 1;
                    const iosPct = Math.round(((trafficSummary.devices.ios || 0) / totalDevices) * 100);
                    const androidPct = Math.round(((trafficSummary.devices.android || 0) / totalDevices) * 100);
                    const desktopPct = Math.round(((trafficSummary.devices.desktop || 0) / totalDevices) * 100);

                    return (
                      <div className="grid grid-cols-3 gap-3 pt-1">
                        <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-white/5 text-center space-y-1">
                          <Smartphone className="w-5 h-5 mx-auto text-blue-400" />
                          <div className="text-xs font-bold text-zinc-300">Apple iPhone</div>
                          <div className="text-lg font-black text-white font-mono">
                            {trafficSummary.devices.ios || 0}
                          </div>
                          <div className="text-[10px] text-zinc-500 font-mono">{iosPct}%</div>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-white/5 text-center space-y-1">
                          <Smartphone className="w-5 h-5 mx-auto text-blue-400" />
                          <div className="text-xs font-bold text-zinc-300">Android</div>
                          <div className="text-lg font-black text-white font-mono">
                            {trafficSummary.devices.android || 0}
                          </div>
                          <div className="text-[10px] text-zinc-500 font-mono">{androidPct}%</div>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-white/5 text-center space-y-1">
                          <Laptop className="w-5 h-5 mx-auto text-blue-400" />
                          <div className="text-xs font-bold text-zinc-300">Computer</div>
                          <div className="text-lg font-black text-white font-mono">
                            {trafficSummary.devices.desktop || 0}
                          </div>
                          <div className="text-[10px] text-zinc-500 font-mono">{desktopPct}%</div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Direct High-Value Customer Actions Card */}
                <div className="bg-[#14141c] border border-white/10 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                        <Phone className="w-4 h-4" />
                      </div>
                      <h3 className="text-sm font-black text-white uppercase tracking-wider">
                        Direct Customer Actions
                      </h3>
                    </div>
                    <span className="text-xs text-zinc-400">1-Tap Buttons</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-white/5 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                          <MessageCircle className="w-3.5 h-3.5 text-blue-400" />
                          <span>WhatsApp Clicks</span>
                        </span>
                        <p className="text-[10px] text-zinc-500">Started direct chat</p>
                      </div>
                      <span className="text-lg font-mono font-black text-blue-400">
                        {trafficSummary.directActions.whatsappChat || 0}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-white/5 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-blue-400" />
                          <span>Phone Calls</span>
                        </span>
                        <p className="text-[10px] text-zinc-500">Called shop counter</p>
                      </div>
                      <span className="text-lg font-mono font-black text-blue-400">
                        {trafficSummary.directActions.phoneCall || 0}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-white/5 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-blue-400" />
                          <span>Maps / Waze Taps</span>
                        </span>
                        <p className="text-[10px] text-zinc-500">Navigation to Shop 1</p>
                      </div>
                      <span className="text-lg font-mono font-black text-blue-400">
                        {trafficSummary.directActions.directions || 0}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-white/5 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                          <Trophy className="w-3.5 h-3.5 text-blue-400" />
                          <span>Review Draw Entries</span>
                        </span>
                        <p className="text-[10px] text-zinc-500">Win meal contest</p>
                      </div>
                      <span className="text-lg font-mono font-black text-blue-400">
                        {entries.length}
                      </span>
                    </div>
                  </div>
                </div>

              </div>

              {/* RIGHT COLUMN: Craved Items, Flavours & Ordering Funnel */}
              <div className="space-y-6">

                {/* Items Actually Ordered (Quantities Sold) Card */}
                <div className="bg-[#14141c] border border-blue-500/30 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                        <ShoppingBag className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-white uppercase tracking-wider">
                          Items Ordered (Quantities Sold)
                        </h3>
                        <p className="text-[11px] text-zinc-400">Total units cooked &amp; dispatched</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 font-mono font-black text-xs">
                      {trafficOrdersData.totalItemsCount} Total Units
                    </span>
                  </div>

                  {(() => {
                    const sortedOrdered = Object.entries(trafficOrdersData.itemsMap)
                      .filter(([_, q]) => q > 0)
                      .sort((a, b) => b[1] - a[1]);

                    if (sortedOrdered.length === 0) {
                      return (
                        <div className="py-6 text-center text-zinc-500 text-xs">
                          <ShoppingBag className="w-7 h-7 mx-auto text-zinc-700 mb-1.5" />
                          <p>Order quantities will update automatically as customer meals are submitted.</p>
                        </div>
                      );
                    }

                    const maxQty = sortedOrdered[0][1] || 1;

                    return (
                      <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
                        {sortedOrdered.map(([name, qty], idx) => {
                          const pct = Math.round((qty / maxQty) * 100);
                          return (
                            <div key={idx} className="p-2.5 rounded-2xl bg-zinc-900/80 border border-white/5 space-y-1.5">
                              <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                  <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-black flex items-center justify-center">
                                    #{idx + 1}
                                  </span>
                                  <span className="font-bold text-white truncate max-w-[170px] sm:max-w-[220px]">
                                    {name}
                                  </span>
                                </div>
                                <span className="font-mono font-black text-blue-400 px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-xs">
                                  {qty}x Ordered
                                </span>
                              </div>
                              <div className="w-full h-2 rounded-full bg-zinc-900 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all"
                                  style={{ width: `${Math.max(8, pct)}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>

                {/* Top Craved Menu Items Card */}
                <div className="bg-[#14141c] border border-white/10 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                        <Flame className="w-4 h-4" />
                      </div>
                      <h3 className="text-sm font-black text-white uppercase tracking-wider">
                        Most Craved Menu Items
                      </h3>
                    </div>
                    <span className="text-xs text-zinc-400">Diner Interest Ranking</span>
                  </div>

                  {(() => {
                    const sortedItems = Object.entries(trafficSummary.popularItems || {})
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 6);

                    if (sortedItems.length === 0) {
                      return (
                        <div className="py-8 text-center text-zinc-500 text-xs">
                          <ShoppingBag className="w-8 h-8 mx-auto text-zinc-700 mb-2" />
                          <p>Customer meal cravings will rank here as diners browse your menu.</p>
                        </div>
                      );
                    }

                    const maxClicks = sortedItems[0][1] || 1;

                    return (
                      <div className="space-y-3">
                        {sortedItems.map(([itemName, count], idx) => {
                          const pct = Math.round((count / maxClicks) * 100);
                          return (
                            <div key={idx} className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                  <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-black flex items-center justify-center">
                                    #{idx + 1}
                                  </span>
                                  <span className="font-bold text-white truncate max-w-[200px] sm:max-w-[260px]">
                                    {itemName}
                                  </span>
                                </div>
                                <span className="font-mono font-black text-blue-400">
                                  {count} views
                                </span>
                              </div>
                              <div className="w-full h-2 rounded-full bg-zinc-900 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all"
                                  style={{ width: `${Math.max(6, pct)}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>

                {/* Basting Sauce Flavour Ranking Card */}
                <div className="bg-[#14141c] border border-white/10 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                        <TrendingUp className="w-4 h-4" />
                      </div>
                      <h3 className="text-sm font-black text-white uppercase tracking-wider">
                        Signature Sauce Flavour Battle
                      </h3>
                    </div>
                    <span className="text-xs text-zinc-400">Customer Choice</span>
                  </div>

                  {(() => {
                    const flavours = [
                      {
                        id: 'lemony',
                        name: '🍋 Lemony',
                        count: Math.max(trafficSummary.flavourPreferences?.lemony || 0, trafficOrdersData.flavourCounts?.lemony || 0),
                        color: 'from-blue-400 to-indigo-500'
                      },
                      {
                        id: 'mild',
                        name: '🌶️ Mild',
                        count: Math.max(trafficSummary.flavourPreferences?.mild || 0, trafficOrdersData.flavourCounts?.mild || 0),
                        color: 'from-blue-500 to-indigo-600'
                      },
                      {
                        id: 'bbq',
                        name: '🍶 Barbeque',
                        count: Math.max(trafficSummary.flavourPreferences?.bbq || 0, trafficOrdersData.flavourCounts?.bbq || 0),
                        color: 'from-blue-600 to-indigo-700'
                      },
                      {
                        id: 'sweet_chilli',
                        name: '🍯 Sweet Chilli',
                        count: Math.max(trafficSummary.flavourPreferences?.sweet_chilli || 0, trafficOrdersData.flavourCounts?.sweet_chilli || 0),
                        color: 'from-indigo-500 to-blue-500'
                      },
                      {
                        id: 'hot',
                        name: '🔥 Hot',
                        count: Math.max(trafficSummary.flavourPreferences?.hot || 0, trafficOrdersData.flavourCounts?.hot || 0),
                        color: 'from-blue-400 to-indigo-600'
                      },
                    ];

                    const totalFlavours = flavours.reduce((sum, f) => sum + f.count, 0) || 1;

                    return (
                      <div className="space-y-3">
                        {flavours.map((flv, idx) => {
                          const pct = Math.round((flv.count / totalFlavours) * 100);
                          return (
                            <div key={idx} className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-zinc-200">{flv.name}</span>
                                <div className="space-x-1.5 font-mono">
                                  <span className="font-black text-blue-400">{flv.count}</span>
                                  <span className="text-[11px] text-zinc-500">({pct}%)</span>
                                </div>
                              </div>
                              <div className="w-full h-2 rounded-full bg-zinc-900 overflow-hidden">
                                <div
                                  className={`h-full rounded-full bg-gradient-to-r ${flv.color} transition-all`}
                                  style={{ width: `${Math.max(4, pct)}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>

                {/* Conversion Funnel Card */}
                <div className="bg-[#14141c] border border-white/10 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                        <ShoppingBag className="w-4 h-4" />
                      </div>
                      <h3 className="text-sm font-black text-white uppercase tracking-wider">
                        Ordering Conversion Funnel
                      </h3>
                    </div>
                    <span className="text-xs text-zinc-400">Step by Step</span>
                  </div>

                  {(() => {
                    const completedOrdersCount = Math.max(
                      trafficSummary.funnel?.ordersCompleted || 0,
                      trafficOrdersData.ordersCount
                    );
                    const checkoutCount = Math.max(
                      trafficSummary.funnel?.checkoutStarts || 0,
                      completedOrdersCount
                    );
                    const cartAddsCount = Math.max(
                      trafficSummary.funnel?.cartAdds || 0,
                      trafficOrdersData.totalItemsCount,
                      completedOrdersCount
                    );
                    const menuViewsCount = Math.max(
                      trafficSummary.funnel?.menuViews || 0,
                      trafficSummary.totalPageViews || 0,
                      cartAddsCount
                    );

                    const funnelSteps = [
                      {
                        step: '1. Menu Browsed',
                        desc: 'Viewed restaurant meals',
                        count: menuViewsCount,
                        color: 'text-blue-400',
                      },
                      {
                        step: '2. Added Items to Cart',
                        desc: 'Placed food onto order tray',
                        count: cartAddsCount,
                        color: 'text-blue-400',
                      },
                      {
                        step: '3. Started Checkout',
                        desc: 'Opened delivery or collection form',
                        count: checkoutCount,
                        color: 'text-blue-400',
                      },
                      {
                        step: '4. Order Placed & Sent',
                        desc: 'Dispatched to kitchen display',
                        count: completedOrdersCount,
                        color: 'text-blue-400',
                      },
                    ];

                    return (
                      <div className="space-y-3 pt-1">
                        {funnelSteps.map((step, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-2xl bg-zinc-900/80 border border-white/5 flex items-center justify-between"
                          >
                            <div>
                              <div className={`text-xs font-bold ${step.color}`}>{step.step}</div>
                              <div className="text-[11px] text-zinc-500">{step.desc}</div>
                            </div>
                            <div className="text-base font-black text-blue-400 font-mono">
                              {step.count}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>

              </div>
            </div>

          </div>
        )}

      </main>

      {/* ── Random Winner Drawn Spotlight Modal ── */}
      {winnerModalOpen && selectedWinner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-lg bg-[#14141c] border border-amber-500/50 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-amber-950/50 space-y-6 text-center">
            <button
              type="button"
              onClick={() => setWinnerModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-600 flex items-center justify-center text-white shadow-xl shadow-amber-950/60 animate-bounce">
              <Trophy className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-black uppercase tracking-wider">
                {isDrawing ? 'Shuffling Entries...' : '🏆 Sunday Draw Winner Selected!'}
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-white">
                {selectedWinner.fullName}
              </h3>
            </div>

            {/* Winner Details Card */}
            <div className="p-4 rounded-2xl bg-zinc-900 border border-white/10 text-left text-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-white/5">
                <span className="text-zinc-400">Order / Receipt Slip:</span>
                <span className="font-mono font-bold text-amber-400 text-sm">
                  {selectedWinner.receiptNumber}
                </span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-white/5">
                <span className="text-zinc-400">Google Username to Check:</span>
                <span className="font-bold text-white bg-zinc-800 px-2 py-0.5 rounded">
                  {selectedWinner.googleReviewName}
                </span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-white/5">
                <span className="text-zinc-400">WhatsApp / Cell:</span>
                <span className="font-bold text-white">{selectedWinner.phone}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Internal Rating:</span>
                <span className="font-bold text-amber-400">{selectedWinner.rating || 5} ★</span>
              </div>

              {selectedWinner.comments && (
                <div className="pt-2 border-t border-white/5">
                  <span className="text-zinc-400 block text-[11px] mb-0.5">Feedback Note:</span>
                  <p className="text-zinc-200 italic">"{selectedWinner.comments}"</p>
                </div>
              )}
            </div>

            {/* Verification Checklist */}
            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/5 text-left text-xs space-y-2 text-zinc-300">
              <div className="text-[11px] font-black uppercase tracking-wider text-amber-400">
                3-Step Verification Checklist:
              </div>
              <ol className="space-y-1.5 pl-5 list-decimal text-zinc-300">
                <li>
                  Check Google Review under <strong>"{selectedWinner.googleReviewName}"</strong>:{' '}
                  <a
                    href={GOOGLE_REVIEW_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-400 underline inline-flex items-center gap-1 font-bold ml-1"
                  >
                    <span>Open Google Reviews</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
                <li>Match Receipt Number <strong>"{selectedWinner.receiptNumber}"</strong> in your POS.</li>
                <li>Notify customer via WhatsApp with digital voucher code for their free Wrap Meal combo!</li>
              </ol>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
              <a
                href={`https://wa.me/${getCleanWhatsAppPhone(
                  selectedWinner.phone
                )}?text=${encodeURIComponent(
                  `Hi ${selectedWinner.fullName}! 🎉 Congratulations from Wrap & Wings Co! You have won our Weekly Customer Meal Draw (Free Chicken Shwarma Wrap Meal + Side) with receipt #${selectedWinner.receiptNumber}. Please reply to claim your meal voucher code!`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Message Winner on WhatsApp</span>
              </a>

              {selectedWinner.status !== 'winner' ? (
                <button
                  type="button"
                  onClick={() => handleMarkAsWinner(selectedWinner)}
                  className="w-full sm:w-auto py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs transition-colors cursor-pointer"
                >
                  Confirm as Winner
                </button>
              ) : (
                <span className="text-xs text-emerald-400 font-black flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Recorded as Winner</span>
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Google Sheets Live Auto-Sync Webhook Modal ── */}
      {webhookModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-xl bg-[#14141c] border border-emerald-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 text-left">
            <button
              type="button"
              onClick={() => setWebhookModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">
                  Google Sheets Live Auto-Sync
                </h3>
                <p className="text-xs text-zinc-400">
                  Automatically write every customer order to your Google Sheet in real time
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-900 border border-white/5 space-y-2 text-xs text-zinc-300">
              <div className="font-bold text-amber-300">How to connect to Google Sheets (Free):</div>
              <ol className="list-decimal pl-5 space-y-1 text-zinc-300 text-[11px]">
                <li>Create a Google Sheet called <strong>"Wrap and Wings Orders"</strong>.</li>
                <li>Go to <strong>Extensions &gt; Apps Script</strong> and paste the auto-append script.</li>
                <li>Deploy as <strong>Web App</strong> (set access to <em>"Anyone"</em>) and copy the URL.</li>
                <li>Paste your Web App URL below and click Save.</li>
              </ol>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300">
                Google Apps Script Webhook URL:
              </label>
              <input
                type="url"
                value={webhookUrlInput}
                onChange={(e) => setWebhookUrlInput(e.target.value)}
                placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
                className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-white/10 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-emerald-400 transition-colors font-mono"
              />
            </div>

            {webhookSavedFeedback && (
              <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Google Sheets Webhook URL saved successfully!</span>
              </div>
            )}

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setWebhookUrlInput('');
                  setGoogleSheetsWebhookUrl('');
                  setWebhookSavedFeedback(true);
                  setTimeout(() => setWebhookSavedFeedback(false), 2000);
                }}
                className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition-colors cursor-pointer"
              >
                Clear Webhook
              </button>

              <button
                type="button"
                onClick={handleSaveWebhook}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition-colors cursor-pointer shadow-lg shadow-emerald-950/60"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Daily Executive Shift Performance Report Modal ── */}
      {dailyReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-[#14141c] border border-amber-500/40 rounded-3xl p-5 sm:p-8 shadow-2xl space-y-6 text-left my-8">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-zinc-950 font-black shadow-lg shadow-amber-950/60">
                  <Flame className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                    <span>Daily Shift Performance Report</span>
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Wrap &amp; Wings Co. • Shop 1, Uniland Centre, Pinetown
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDailyReportModalOpen(false)}
                  className="p-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  title="Close Report"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Reporting Period & Status Pill */}
            <div className="p-3.5 rounded-2xl bg-zinc-900 border border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-zinc-300">
                <Calendar className="w-4 h-4 text-amber-400" />
                <span className="font-bold">
                  Period: {trafficRange === 'today' ? "Today's Rush" : trafficRange === 'yesterday' ? 'Yesterday' : trafficRange === 'week' ? 'Past 7 Days' : 'All-Time'}
                </span>
                <span className="text-zinc-500">({trafficSummary.date})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-bold text-[11px] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>Verified Shift Metrics</span>
                </span>
              </div>
            </div>

            {/* Summary KPI Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3.5 rounded-2xl bg-zinc-950 border border-white/5 space-y-1">
                <div className="text-[11px] text-zinc-400 uppercase font-bold">Total Sales</div>
                <div className="text-xl font-mono font-black text-blue-400">
                  R{trafficOrdersData.revenue.toFixed(2)}
                </div>
                <div className="text-[10px] text-zinc-500">{trafficOrdersData.ordersCount} orders</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-950 border border-white/5 space-y-1">
                <div className="text-[11px] text-zinc-400 uppercase font-bold">Food Units Sold</div>
                <div className="text-xl font-mono font-black text-blue-400">
                  {trafficOrdersData.totalItemsCount}
                </div>
                <div className="text-[10px] text-zinc-500">items dispatched</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-950 border border-white/5 space-y-1">
                <div className="text-[11px] text-zinc-400 uppercase font-bold">Total Diners</div>
                <div className="text-xl font-mono font-black text-blue-400">
                  {trafficSummary.uniqueVisitorIds.length}
                </div>
                <div className="text-[10px] text-zinc-500">{trafficSummary.totalPageViews} page views</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-950 border border-white/5 space-y-1">
                <div className="text-[11px] text-zinc-400 uppercase font-bold">Cart Taps</div>
                <div className="text-xl font-mono font-black text-blue-400">
                  {trafficSummary.funnel.cartAdds}
                </div>
                <div className="text-[10px] text-zinc-500">items added to tray</div>
              </div>
            </div>

            {/* Section: Items Ordered Table */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-black text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Food Items Ordered Breakdown (Quantities Sold)</span>
              </h4>
              <div className="overflow-x-auto rounded-2xl border border-white/10 bg-zinc-950/80 max-h-56 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-900/90 text-zinc-400 uppercase text-[10px] tracking-wider border-b border-white/5 sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3">Meal Item</th>
                      <th className="py-2.5 px-3 text-center">Quantity Sold</th>
                      <th className="py-2.5 px-3 text-right">Share of Meals</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono">
                    {(() => {
                      const list = Object.entries(trafficOrdersData.itemsMap)
                        .filter(([_, q]) => q > 0)
                        .sort((a, b) => b[1] - a[1]);
                      if (list.length === 0) {
                        return (
                          <tr>
                            <td colSpan={3} className="py-4 text-center text-zinc-500 text-xs font-sans">
                              No meal orders logged for this period yet.
                            </td>
                          </tr>
                        );
                      }
                      const totalQty = trafficOrdersData.totalItemsCount || 1;
                      return list.map(([name, qty], idx) => (
                        <tr key={idx} className="hover:bg-white/[0.02]">
                          <td className="py-2 px-3 text-white font-sans font-bold flex items-center gap-2">
                            <span className="text-[10px] text-zinc-500">#{idx + 1}</span>
                            <span>{name}</span>
                          </td>
                          <td className="py-2 px-3 text-center text-blue-400 font-black">
                            {qty}
                          </td>
                          <td className="py-2 px-3 text-right text-zinc-400 text-[11px]">
                            {Math.round((qty / totalQty) * 100)}%
                          </td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section: Traffic Sources & Customer Contact Actions in 2 Columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-zinc-950 border border-white/5 space-y-2">
                <h4 className="font-black text-white uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-blue-400" />
                  <span>Traffic Acquisition Sources</span>
                </h4>
                <div className="space-y-1.5 text-zinc-300">
                  <div className="flex justify-between">
                    <span>Google Business / Maps:</span>
                    <span className="font-mono font-bold text-blue-400">{trafficSummary.sources.google_gmb || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>WhatsApp Broadcasts:</span>
                    <span className="font-mono font-bold text-blue-400">{trafficSummary.sources.whatsapp || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Social Media (IG/FB/TikTok):</span>
                    <span className="font-mono font-bold text-blue-400">{trafficSummary.sources.social || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Direct Web Address:</span>
                    <span className="font-mono font-bold text-blue-400">{trafficSummary.sources.direct || 0}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-950 border border-white/5 space-y-2">
                <h4 className="font-black text-white uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-blue-400" />
                  <span>Customer Contact Actions</span>
                </h4>
                <div className="space-y-1.5 text-zinc-300">
                  <div className="flex justify-between">
                    <span>WhatsApp Inquiries:</span>
                    <span className="font-mono font-bold text-blue-400">{trafficSummary.directActions.whatsappChat || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Phone Calls to Store:</span>
                    <span className="font-mono font-bold text-blue-400">{trafficSummary.directActions.phoneCall || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Maps Navigation Taps:</span>
                    <span className="font-mono font-bold text-blue-400">{trafficSummary.directActions.directions || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Review Contest Entries:</span>
                    <span className="font-mono font-bold text-blue-400">{entries.length}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions Toolbar */}
            <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyWhatsAppReport}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition-all flex items-center gap-1.5 shadow-md shadow-emerald-950/50 cursor-pointer"
                >
                  {copiedReportFeedback ? (
                    <>
                      <Check className="w-4 h-4 text-white" />
                      <span>Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <MessageCircle className="w-4 h-4" />
                      <span>Copy for WhatsApp</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => exportTrafficToCsv(trafficSummary, trafficRange.toUpperCase())}
                  className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>Download CSV</span>
                </button>

                <button
                  type="button"
                  onClick={() => exportTrafficToPdf(trafficSummary, trafficRange === 'today' ? "Today's Rush" : trafficRange === 'yesterday' ? 'Yesterday' : trafficRange === 'week' ? 'Past 7 Days' : 'All-Time', trafficOrdersData)}
                  className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-rose-400" />
                  <span>Download PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Report</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setDailyReportModalOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── Daily Orders & Sales Shift Report Modal ── */}
      {dailyOrdersReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-[#14141c] border border-amber-500/40 rounded-3xl p-5 sm:p-8 shadow-2xl space-y-6 text-left my-8">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-zinc-950 font-black shadow-lg shadow-amber-950/60">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                    <span>Daily Orders &amp; Sales Report</span>
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Wrap &amp; Wings Co. • Shift Performance (Collections &amp; Deliveries)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDailyOrdersReportModalOpen(false)}
                  className="p-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  title="Close Report"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Interactive Date Selector Bar */}
            <div className="p-3.5 rounded-2xl bg-zinc-900 border border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 text-zinc-300 font-bold">
                  <Calendar className="w-4 h-4 text-amber-400" />
                  <span>Select Date:</span>
                </div>

                <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-white/5">
                  <button
                    type="button"
                    onClick={() => shiftReportDate(-1)}
                    className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                    title="Previous Day"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>

                  <input
                    type="date"
                    value={selectedOrderDate === 'all' ? getLocalTodayDateString() : selectedOrderDate}
                    onChange={(e) => {
                      if (e.target.value) setSelectedOrderDate(e.target.value);
                    }}
                    className="bg-transparent text-white font-mono text-xs px-2 py-1 focus:outline-none cursor-pointer"
                  />

                  <button
                    type="button"
                    onClick={() => shiftReportDate(1)}
                    className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                    title="Next Day"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedOrderDate(getLocalTodayDateString())}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
                    selectedOrderDate === getLocalTodayDateString()
                      ? 'bg-amber-500 text-zinc-950 shadow-sm'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                  }`}
                >
                  Today
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const y = new Date();
                    y.setDate(y.getDate() - 1);
                    setSelectedOrderDate(formatToLocalDateString(y));
                  }}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
                    (() => {
                      const y = new Date();
                      y.setDate(y.getDate() - 1);
                      return selectedOrderDate === formatToLocalDateString(y);
                    })()
                      ? 'bg-amber-500 text-zinc-950 shadow-sm'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                  }`}
                >
                  Yesterday
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{formatReportDateLabel(selectedOrderDate)}</span>
                </span>
              </div>
            </div>

            {/* Executive KPI Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-4 rounded-2xl bg-zinc-950 border border-white/5 space-y-1">
                <div className="text-[11px] text-zinc-400 uppercase font-bold flex items-center justify-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-blue-400" />
                  <span>Total Sales</span>
                </div>
                <div className="text-2xl font-mono font-black text-blue-400">
                  R{dayOrdersData.totalRevenue.toFixed(2)}
                </div>
                <div className="text-[10px] text-zinc-500">
                  Food: R{dayOrdersData.subtotal.toFixed(0)} • Delivery: R{dayOrdersData.deliveryFees.toFixed(0)}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-950 border border-white/5 space-y-1">
                <div className="text-[11px] text-zinc-400 uppercase font-bold flex items-center justify-center gap-1">
                  <ShoppingBag className="w-3.5 h-3.5 text-blue-400" />
                  <span>Orders Placed</span>
                </div>
                <div className="text-2xl font-mono font-black text-blue-400">
                  {dayOrdersData.totalOrders}
                </div>
                <div className="text-[10px] text-zinc-500">
                  Avg Ticket: R{dayOrdersData.avgOrderValue.toFixed(2)}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-950 border border-white/5 space-y-1">
                <div className="text-[11px] text-zinc-400 uppercase font-bold flex items-center justify-center gap-1">
                  <DeliveryMotorbikeIcon className="w-3.5 h-3.5 text-blue-400" />
                  <span>Deliveries</span>
                </div>
                <div className="text-2xl font-mono font-black text-blue-400">
                  {dayOrdersData.deliveriesCount}
                </div>
                <div className="text-[10px] text-zinc-500">
                  R{dayOrdersData.deliveryRevenue.toFixed(2)} revenue
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-950 border border-white/5 space-y-1">
                <div className="text-[11px] text-zinc-400 uppercase font-bold flex items-center justify-center gap-1">
                  <ShoppingBag className="w-3.5 h-3.5 text-blue-400" />
                  <span>Collections</span>
                </div>
                <div className="text-2xl font-mono font-black text-blue-400">
                  {dayOrdersData.collectionsCount}
                </div>
                <div className="text-[10px] text-zinc-500">
                  R{dayOrdersData.collectionRevenue.toFixed(2)} revenue
                </div>
              </div>
            </div>

            {/* Additional Shift Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-zinc-950 border border-white/5 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-zinc-400 uppercase font-bold">Driver Tips</div>
                  <div className="text-lg font-mono font-black text-blue-400">
                    R{dayOrdersData.driverTips.toFixed(2)}
                  </div>
                </div>
                <Flame className="w-5 h-5 text-blue-400/80" />
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-950 border border-white/5 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-zinc-400 uppercase font-bold">Food Portions Cooked</div>
                  <div className="text-lg font-mono font-black text-blue-400">
                    {dayOrdersData.totalItemsCount} meals
                  </div>
                </div>
                <ChefHat className="w-5 h-5 text-blue-400/80" />
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-950 border border-white/5 flex items-center justify-between col-span-2 sm:col-span-1">
                <div>
                  <div className="text-[10px] text-zinc-400 uppercase font-bold">Unique Customers</div>
                  <div className="text-lg font-mono font-black text-blue-400">
                    {new Set(dayOrdersData.targetList.map((o) => (o.customer?.phone || '').replace(/\D/g, '')).filter(Boolean)).size} contacts
                  </div>
                </div>
                <Users className="w-5 h-5 text-blue-400/80" />
              </div>
            </div>

            {/* Section: Items Ordered Table */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ChefHat className="w-3.5 h-3.5" />
                  <span>Meals &amp; Items Ordered ({dayOrdersData.totalItemsCount} total portions)</span>
                </h4>
                <span className="text-[11px] text-zinc-400">Ranked by quantities cooked</span>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-white/10 bg-zinc-950/80 max-h-60 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-900/90 text-zinc-400 uppercase text-[10px] tracking-wider border-b border-white/5 sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3">Meal Item</th>
                      <th className="py-2.5 px-3 text-center">Quantity Sold</th>
                      <th className="py-2.5 px-3 text-right">Item Revenue</th>
                      <th className="py-2.5 px-3 text-right">Share of Meals</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono">
                    {(() => {
                      const list = Object.entries(dayOrdersData.itemsMap)
                        .filter(([_, d]) => d.qty > 0)
                        .sort((a, b) => b[1].qty - a[1].qty);
                      if (list.length === 0) {
                        return (
                          <tr>
                            <td colSpan={4} className="py-6 text-center text-zinc-500 text-xs font-sans">
                              No meal orders recorded for {formatReportDateLabel(selectedOrderDate)}.
                            </td>
                          </tr>
                        );
                      }
                      const totalQty = dayOrdersData.totalItemsCount || 1;
                      return list.map(([name, data], idx) => (
                        <tr key={idx} className="hover:bg-white/[0.02]">
                          <td className="py-2 px-3 text-white font-sans font-bold flex items-center gap-2">
                            <span className="text-[10px] text-zinc-500">#{idx + 1}</span>
                            <span>{name}</span>
                          </td>
                          <td className="py-2 px-3 text-center text-blue-400 font-black">
                            {data.qty}
                          </td>
                          <td className="py-2 px-3 text-right text-blue-400">
                            R{data.revenue.toFixed(2)}
                          </td>
                          <td className="py-2 px-3 text-right text-zinc-400 text-[11px]">
                            {Math.round((data.qty / totalQty) * 100)}%
                          </td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section: Suburbs & Payment Methods (2 Columns) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-zinc-950 border border-white/5 space-y-2">
                <h4 className="font-black text-white uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-400" />
                  <span>Delivery Suburbs Served</span>
                </h4>
                <div className="space-y-1.5 text-zinc-300">
                  {Object.keys(dayOrdersData.suburbsMap).length === 0 ? (
                    <div className="text-zinc-500 text-[11px]">No home deliveries on this date.</div>
                  ) : (
                    Object.entries(dayOrdersData.suburbsMap).map(([sub, count]) => (
                      <div key={sub} className="flex justify-between">
                        <span>{sub}:</span>
                        <span className="font-mono font-bold text-blue-400">{count} {count === 1 ? 'drop' : 'drops'}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-950 border border-white/5 space-y-2">
                <h4 className="font-black text-white uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-blue-400" />
                  <span>Payment Methods Breakdown</span>
                </h4>
                <div className="space-y-1.5 text-zinc-300">
                  {Object.keys(dayOrdersData.paymentMethodsMap).length === 0 ? (
                    <div className="text-zinc-500 text-[11px]">No payments recorded on this date.</div>
                  ) : (
                    Object.entries(dayOrdersData.paymentMethodsMap).map(([method, data]) => {
                      const label =
                        method === 'payfast' || method === 'yoco'
                          ? 'Online Card / Instant EFT'
                          : method === 'cod'
                          ? 'Cash on Delivery / Pickup'
                          : method === 'whatsapp'
                          ? 'WhatsApp Pay / Speedpoint'
                          : method.toUpperCase();
                      return (
                        <div key={method} className="flex justify-between">
                          <span>{label} ({data.count}):</span>
                          <span className="font-mono font-bold text-blue-400">R{data.total.toFixed(2)}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Actions Toolbar */}
            <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyDailyOrdersWhatsAppReport}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition-all flex items-center gap-1.5 shadow-md shadow-emerald-950/50 cursor-pointer"
                >
                  {copiedOrdersReportFeedback ? (
                    <>
                      <Check className="w-4 h-4 text-white" />
                      <span>Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <MessageCircle className="w-4 h-4" />
                      <span>Copy for WhatsApp</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => exportOrdersToCsv(dayOrdersData.targetList, `orders-shift-${selectedOrderDate}`)}
                  disabled={dayOrdersData.totalOrders === 0}
                  className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>Export Shift CSV</span>
                </button>

                <button
                  type="button"
                  onClick={() => exportOrdersToPdf(dayOrdersData.targetList, formatReportDateLabel(selectedOrderDate), orderMetrics)}
                  disabled={dayOrdersData.totalOrders === 0}
                  className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                >
                  <FileText className="w-4 h-4 text-rose-400" />
                  <span>Download Shift PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Report</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setDailyOrdersReportModalOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
