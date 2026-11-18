import React, { useState, useMemo } from 'react';
import {
  X,
  LayoutDashboard,
  Package,
  ShoppingBag,
  MessageSquare,
  Settings,
  Image,
  Plus,
  Edit2,
  Trash2,
  Copy,
  Printer,
  Download,
  Eye,
  EyeOff,
  CheckCircle,
  Clock,
  Truck,
  TrendingUp,
  AlertTriangle,
  Search,
  Check,
  Save,
  Lock,
  LogOut,
  Upload,
  Mail,
  Globe,
  Instagram,
  Facebook,
  Youtube,
  MessageCircle,
  ExternalLink,
  FileText,
  ShieldCheck,
  Phone,
  Palette,
  Loader2,
  Sparkles,
  Tag,
  Percent,
  Sliders,
  CheckCheck,
  Send,
  Smartphone,
  CheckCircle2,
  XCircle,
  RotateCcw,
  FileSpreadsheet,
  BarChart3,
  Star,
  Ban,
  RefreshCw,
  ShieldAlert,
  Calendar,
  Activity,
  ChevronDown,
} from 'lucide-react';
import { SocialLinks, StorePolicies, SecurityBlockLog, OrderSecuritySettings, TrackingPixelsSettings, PromoCode } from '../types';
import {
  extractFacebookPixelId,
  extractGoogleTagId,
  extractTiktokPixelId,
  isValidFacebookPixelId,
  isValidGoogleTagId,
  isValidTiktokPixelId,
  getGoogleTagType,
  initTrackingPixels,
  runPixelVerificationTest,
  getPixelDiagnostics,
  type PixelsDiagnosticReport,
} from '../utils/trackingPixels';
import { useStore } from '../context/StoreContext';
import { useAuth } from '../context/AuthContext';
import { WarrantyCertificateModal } from './WarrantyCertificateModal';
import { PromoCodeVoucherModal } from './PromoCodeVoucherModal';
import { Product, Order, OrderItem, OrderStatus, Review, StoreSettings } from '../types';
import {
  MOROCCAN_CITIES,
  STATUS_COLORS,
  formatPrice,
  normalizeMoroccanPhone,
  calculateTierOffers,
  getBundlePriceForQuantity,
  getProductColors,
  getWhatsAppCustomerOrderUrl,
  generateCustomerConfirmationMessage,
  formatPhoneForWhatsApp,
  sanitizePhoneText,
  buildWhatsAppUrl,
  exportOrdersToOzonExpressXlsx,
  generateCustomerShippedMessage,
  getWhatsAppCustomerShippedUrl,
} from '../utils/constants';
import { ImageUploader } from './ImageUploader';
import { AdminProductModal } from './AdminProductModal';

export const AdminDashboard: React.FC = () => {
  const {
    isAdminOpen,
    setIsAdminOpen,
    isAdmin,
    setIsAdmin,
    settings,
    products,
    orders,
    reviews,
    updateOrderStatus,
    updateOrderDetails,
    markOrderWhatsAppSent,
    deleteOrder,
    clearAllOrders,
    addProduct,
    updateProduct,
    deleteProduct,
    duplicateProduct,
    toggleReviewApproval,
    deleteReview,
    updateSettings,
    refreshData,
    showToast,
    syncAllToCloud,
    resetToDefaultData,
  } = useStore();

  const handleExportProductsJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(products, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `noblewatch_products_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('تم تحميل ملف النسخة الاحتياطية لمنتجاتك بنجاح', 'success');
  };

  const { user: authUser, signInWithGoogle, signOutUser, getFreshToken } = useAuth();
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordChangeFeedback, setPasswordChangeFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'stats' | 'product_stats' | 'orders' | 'new_orders' | 'preparing_orders' | 'shipped_orders' | 'cancelled_orders' | 'products' | 'reviews' | 'settings'>('stats');
  const [selectedAnalyticsProductId, setSelectedAnalyticsProductId] = useState<string>('');
  const [analyticsProductSearch, setAnalyticsProductSearch] = useState<string>('');
  const [isAnalyticsProductDropdownOpen, setIsAnalyticsProductDropdownOpen] = useState<boolean>(false);
  const analyticsPickerRef = React.useRef<HTMLDivElement>(null);
  const [wholesalePriceInput, setWholesalePriceInput] = useState<string>('');
  const [shippingCostInput, setShippingCostInput] = useState<string>('');
  const [isSavingWholesalePrice, setIsSavingWholesalePrice] = useState<boolean>(false);
  const [statsDateFrom, setStatsDateFrom] = useState<string>('');
  const [statsDateTo, setStatsDateTo] = useState<string>('');
  const [productStatsDateFrom, setProductStatsDateFrom] = useState<string>('');
  const [productStatsDateTo, setProductStatsDateTo] = useState<string>('');

  // Orders filters
  const [orderSearch, setOrderSearch] = useState('');
  const [newOrdersSearch, setNewOrdersSearch] = useState('');
  const [preparingOrdersSearch, setPreparingOrdersSearch] = useState('');
  const [shippedOrdersSearch, setShippedOrdersSearch] = useState('');
  const [cancelledOrdersSearch, setCancelledOrdersSearch] = useState('');
  const [cancelledOrdersStatusFilter, setCancelledOrdersStatusFilter] = useState<'all' | 'ملغى' | 'مرتجع'>('all');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [orderCityFilter, setOrderCityFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [isSavingOrderEdit, setIsSavingOrderEdit] = useState(false);
  const [printingOrder, setPrintingOrder] = useState<Order | null>(null);
  const [sentShippedNoticeIds, setSentShippedNoticeIds] = useState<Record<string, boolean>>({});

  // Products filters & editing
  const [productSearch, setProductSearch] = useState('');
  const [isEditingProduct, setIsEditingProduct] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);

  // Reviews filters & pagination (prevents rendering 1,200+ DOM nodes at once)
  const [reviewsSearch, setReviewsSearch] = useState('');
  const [reviewsPage, setReviewsPage] = useState(1);
  const REVIEWS_PER_PAGE = 24;

  // Settings editing state
  const [localSettings, setLocalSettingsState] = useState<StoreSettings | null>(settings);
  const localSettingsRef = React.useRef<StoreSettings | null>(settings);
  const isSettingsDirtyRef = React.useRef(false);
  const setLocalSettings = React.useCallback(
    (next: StoreSettings | null, markDirty: boolean = true) => {
      if (markDirty) {
        isSettingsDirtyRef.current = true;
      }
      localSettingsRef.current = next;
      setLocalSettingsState(next);
    },
    []
  );
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsSaveFeedback, setSettingsSaveFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [securityLogs, setSecurityLogs] = useState<SecurityBlockLog[]>([]);
  const [manualBlockPhoneInput, setManualBlockPhoneInput] = useState('');
  const [isLoadingSecurityLogs, setIsLoadingSecurityLogs] = useState(false);
  const [newPromoCodeInput, setNewPromoCodeInput] = useState('');
  const [newPromoTypeInput, setNewPromoTypeInput] = useState<'percent' | 'fixed'>('percent');
  const [newPromoValueInput, setNewPromoValueInput] = useState('10');
  const [newPromoMinOrderInput, setNewPromoMinOrderInput] = useState('0');
  const [previewPromoVoucher, setPreviewPromoVoucher] = useState<PromoCode | null>(null);

  const fetchSecurityOverview = React.useCallback(async () => {
    const token = localStorage.getItem('noblewatch_admin_token');
    if (!token) return;
    setIsLoadingSecurityLogs(true);
    try {
      const res = await fetch('/api/security/overview', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setSecurityLogs(Array.isArray(data.logs) ? data.logs : []);
      }
    } catch {
      // ignore error
    } finally {
      setIsLoadingSecurityLogs(false);
    }
  }, []);

  React.useEffect(() => {
    if (isAdminOpen && isAdmin && activeTab === 'settings') {
      fetchSecurityOverview();
    }
  }, [isAdminOpen, isAdmin, activeTab, fetchSecurityOverview]);

  // Sync settings from server snapshot when not actively editing unsaved changes
  React.useEffect(() => {
    if (settings && (!localSettingsRef.current || !isSettingsDirtyRef.current)) {
      localSettingsRef.current = settings;
      setLocalSettingsState(settings);
    }
  }, [settings]);

  // Toggle body print class while delivery receipt preview is open
  React.useEffect(() => {
    if (printingOrder) {
      document.body.classList.add('printing-delivery-slip');
    } else {
      document.body.classList.remove('printing-delivery-slip');
    }
    return () => {
      document.body.classList.remove('printing-delivery-slip');
    };
  }, [printingOrder]);

  const newOrders = useMemo(
    () => (Array.isArray(orders) ? orders.filter((o) => o.status === 'جديد') : []),
    [orders]
  );

  const preparingOrders = useMemo(
    () => (Array.isArray(orders) ? orders.filter((o) => o.status === 'قيد التجهيز') : []),
    [orders]
  );
  const preparingOrdersCount = preparingOrders.length;

  const shippedOrders = useMemo(
    () => (Array.isArray(orders) ? orders.filter((o) => o.status === 'تم الشحن') : []),
    [orders]
  );

  const cancelledOrders = useMemo(
    () => (Array.isArray(orders) ? orders.filter((o) => o.status === 'ملغى' || o.status === 'مرتجع') : []),
    [orders]
  );

  const matchesOrderSearch = (o: Order, rawQuery: string): boolean => {
    const q = rawQuery.toLowerCase().trim();
    if (!q) return true;
    const digitsQuery = q.replace(/[\s\-\.\+]/g, '');
    const normalizedPhone = (o.phone || '').toLowerCase().replace(/[\s\-\.\+]/g, '');
    if ((o.orderNumber || '').toLowerCase().includes(q)) return true;
    if ((o.customerName || '').toLowerCase().includes(q)) return true;
    if ((o.phone || '').toLowerCase().includes(q)) return true;
    if (digitsQuery && normalizedPhone.includes(digitsQuery)) return true;
    if ((o.city || '').toLowerCase().includes(q)) return true;
    if ((o.address || '').toLowerCase().includes(q)) return true;
    if ((o.notes || '').toLowerCase().includes(q)) return true;
    if (
      Array.isArray(o.items) &&
      o.items.some(
        (it) =>
          (it.name || '').toLowerCase().includes(q) ||
          (it.color || '').toLowerCase().includes(q) ||
          (Array.isArray(it.selectedColors) && it.selectedColors.some((c) => c.toLowerCase().includes(q)))
      )
    ) {
      return true;
    }
    return false;
  };

  const filteredNewOrders = useMemo(
    () => newOrders.filter((o) => matchesOrderSearch(o, newOrdersSearch)),
    [newOrders, newOrdersSearch]
  );

  const filteredPreparingOrders = useMemo(
    () => preparingOrders.filter((o) => matchesOrderSearch(o, preparingOrdersSearch)),
    [preparingOrders, preparingOrdersSearch]
  );

  const filteredShippedOrders = useMemo(
    () => shippedOrders.filter((o) => matchesOrderSearch(o, shippedOrdersSearch)),
    [shippedOrders, shippedOrdersSearch]
  );

  const filteredCancelledOrders = useMemo(
    () =>
      cancelledOrders.filter(
        (o) =>
          (cancelledOrdersStatusFilter === 'all' || o.status === cancelledOrdersStatusFilter) &&
          matchesOrderSearch(o, cancelledOrdersSearch)
      ),
    [cancelledOrders, cancelledOrdersStatusFilter, cancelledOrdersSearch]
  );

  // Date normalization & range helpers for Analytics
  const toLocalDateKey = (dateInput: string | Date): string => {
    if (!dateInput) return '';
    if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput.trim())) {
      return dateInput.trim();
    }
    const d = new Date(dateInput);
    if (Number.isNaN(d.getTime())) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const getDatePresetRange = (
    preset: 'all' | 'today' | 'yesterday' | 'last7' | 'thisMonth' | 'last30'
  ): { from: string; to: string } => {
    if (preset === 'all') return { from: '', to: '' };
    const now = new Date();
    const today = toLocalDateKey(now);
    if (preset === 'today') return { from: today, to: today };
    if (preset === 'yesterday') {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      const yStr = toLocalDateKey(y);
      return { from: yStr, to: yStr };
    }
    if (preset === 'last7') {
      const d = new Date(now);
      d.setDate(d.getDate() - 6);
      return { from: toLocalDateKey(d), to: today };
    }
    if (preset === 'thisMonth') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: toLocalDateKey(start), to: today };
    }
    const d30 = new Date(now);
    d30.setDate(d30.getDate() - 29);
    return { from: toLocalDateKey(d30), to: today };
  };

  const isOrderInDateRange = (ord: Order, fromDate: string, toDate: string): boolean => {
    if (!fromDate && !toDate) return true;
    const orderKey = toLocalDateKey(ord.date);
    if (!orderKey) return false;
    const minDate = fromDate && toDate && fromDate > toDate ? toDate : fromDate;
    const maxDate = fromDate && toDate && fromDate > toDate ? fromDate : toDate;
    if (minDate && orderKey < minDate) return false;
    if (maxDate && orderKey > maxDate) return false;
    return true;
  };

  const statsFilteredOrders = useMemo(
    () => (orders || []).filter((o) => isOrderInDateRange(o, statsDateFrom, statsDateTo)),
    [orders, statsDateFrom, statsDateTo]
  );

  const productStatsFilteredOrders = useMemo(
    () => (orders || []).filter((o) => isOrderInDateRange(o, productStatsDateFrom, productStatsDateTo)),
    [orders, productStatsDateFrom, productStatsDateTo]
  );

  // Compute comprehensive analytics for any store product
  const computeProductAnalytics = (
    prod: Product,
    overrideWholesalePrice?: number,
    overrideShippingCost?: number,
    ordersSource: Order[] = orders || []
  ) => {
    let totalOrders = 0;
    let totalUnits = 0;
    let activeUnits = 0;
    let activeOrdersCount = 0;
    let newCount = 0;
    let confirmedPendingPrepCount = 0;
    let preparingCount = 0;
    let shippedCount = 0;
    let deliveredCount = 0;
    let deliveredUnits = 0;
    let cancelledCount = 0;
    let returnedCount = 0;
    let deliveredRevenue = 0;
    let potentialRevenue = 0;
    let multiUnitOrders = 0;

    const colorCounts: Record<string, number> = {};
    const cityCounts: Record<string, { total: number; delivered: number }> = {};

    (ordersSource || []).forEach((ord) => {
      const matchingItems = (ord.items || []).filter(
        (it) => it.productId === prod.id || it.name === prod.name
      );
      if (matchingItems.length === 0) return;

      totalOrders += 1;
      const orderUnitsForProd = matchingItems.reduce(
        (sum, it) => sum + Math.max(1, Number(it.quantity) || 1),
        0
      );
      totalUnits += orderUnitsForProd;
      if (orderUnitsForProd >= 2) {
        multiUnitOrders += 1;
      }

      // Compute revenue attributable to this product in the order
      const allItemsPriceSum = (ord.items || []).reduce((s, it) => s + (Number(it.price) || 0), 0);
      const matchingPriceSum = matchingItems.reduce((s, it) => s + (Number(it.price) || 0), 0);
      const prodOrderValue =
        ord.items && ord.items.length === matchingItems.length
          ? Number(ord.totalAmount) || matchingPriceSum
          : allItemsPriceSum > 0
          ? Math.round(((Number(ord.totalAmount) || allItemsPriceSum) * matchingPriceSum) / allItemsPriceSum)
          : matchingPriceSum;

      if (ord.status === 'جديد' || ord.status === 'قيد التأكيد') newCount += 1;
      else if (ord.status === 'تم التأكيد') confirmedPendingPrepCount += 1;
      else if (ord.status === 'قيد التجهيز') preparingCount += 1;
      else if (ord.status === 'تم الشحن') shippedCount += 1;
      else if (ord.status === 'تم التسليم') {
        deliveredCount += 1;
        deliveredUnits += orderUnitsForProd;
        deliveredRevenue += prodOrderValue;
      } else if (ord.status === 'ملغى') cancelledCount += 1;
      else if (ord.status === 'مرتجع') returnedCount += 1;

      if (ord.status !== 'ملغى' && ord.status !== 'مرتجع') {
        potentialRevenue += prodOrderValue;
        activeUnits += orderUnitsForProd;
        activeOrdersCount += 1;
      }

      // Colors breakdown
      matchingItems.forEach((it) => {
        const qty = Math.max(1, Number(it.quantity) || 1);
        if (Array.isArray(it.selectedColors) && it.selectedColors.length > 0) {
          for (let i = 0; i < qty; i++) {
            const c = it.selectedColors[i] || it.color || 'غير محدد';
            colorCounts[c] = (colorCounts[c] || 0) + 1;
          }
        } else {
          const c = it.color || 'غير محدد';
          colorCounts[c] = (colorCounts[c] || 0) + qty;
        }
      });

      // City breakdown
      const cityKey = (ord.city || 'غير محددة').trim();
      if (!cityCounts[cityKey]) {
        cityCounts[cityKey] = { total: 0, delivered: 0 };
      }
      cityCounts[cityKey].total += 1;
      if (ord.status === 'تم التسليم') {
        cityCounts[cityKey].delivered += 1;
      }
    });

    const cancelledOrReturnedCount = cancelledCount + returnedCount;
    const finalizedCount = deliveredCount + cancelledOrReturnedCount;
    const deliveryRate = finalizedCount > 0 ? Math.round((deliveredCount / finalizedCount) * 100) : 0;
    const overallDeliveryShare = totalOrders > 0 ? Math.round((deliveredCount / totalOrders) * 100) : 0;
    const confirmedProgressedCount = confirmedPendingPrepCount + preparingCount + shippedCount + deliveredCount;
    const confirmationRate = totalOrders > 0 ? Math.round((confirmedProgressedCount / totalOrders) * 100) : 0;
    const cancelReturnRate = totalOrders > 0 ? Math.round((cancelledOrReturnedCount / totalOrders) * 100) : 0;
    const avgUnitsPerOrder = totalOrders > 0 ? Number((totalUnits / totalOrders).toFixed(2)) : 0;

    // Wholesale cost, Shipping cost per order & Net Profit calculations
    const rawWholesale =
      overrideWholesalePrice !== undefined
        ? overrideWholesalePrice
        : Number(prod.wholesalePrice) || 0;
    const wholesalePrice = Number.isFinite(rawWholesale) && rawWholesale >= 0 ? rawWholesale : 0;

    const rawShipping =
      overrideShippingCost !== undefined
        ? overrideShippingCost
        : Number(prod.shippingCostPerOrder) || 0;
    const shippingCostPerOrder = Number.isFinite(rawShipping) && rawShipping >= 0 ? rawShipping : 0;

    const deliveredCost = Math.round(wholesalePrice * deliveredUnits);
    const deliveredShippingCost = Math.round(shippingCostPerOrder * deliveredCount);
    const totalDeliveredCost = deliveredCost + deliveredShippingCost;
    const netDeliveredProfit = Math.round(deliveredRevenue - totalDeliveredCost);
    const profitMarginPercent =
      deliveredRevenue > 0 ? Math.round((netDeliveredProfit / deliveredRevenue) * 100) : 0;
    const activeCost = Math.round(wholesalePrice * activeUnits);
    const activeShippingCost = Math.round(shippingCostPerOrder * activeOrdersCount);
    const activeTotalCost = activeCost + activeShippingCost;
    const expectedNetProfit = Math.round(potentialRevenue - activeTotalCost);
    const unitProfitMargin = Math.round((Number(prod.price) || 0) - wholesalePrice - shippingCostPerOrder);

    const prodReviews = (reviews || []).filter((r) => r.productId === prod.id);
    const avgRating =
      prodReviews.length > 0
        ? Number((prodReviews.reduce((s, r) => s + r.rating, 0) / prodReviews.length).toFixed(1))
        : prod.rating || 5;

    const topColors = Object.entries(colorCounts)
      .map(([color, count]) => ({ color, count }))
      .sort((a, b) => b.count - a.count);

    const topCities = Object.entries(cityCounts)
      .map(([city, stats]) => ({ city, ...stats }))
      .sort((a, b) => b.total - a.total);

    // Winning product verdict
    let verdict: 'winner' | 'promising' | 'review' | 'insufficient' = 'insufficient';
    if (totalOrders === 0) {
      verdict = 'insufficient';
    } else if (
      (finalizedCount > 0 && deliveryRate >= 60 && totalOrders >= 2) ||
      (totalOrders >= 3 && cancelReturnRate <= 30 && confirmationRate >= 50)
    ) {
      verdict = 'winner';
    } else if (cancelReturnRate > 45) {
      verdict = 'review';
    } else {
      verdict = 'promising';
    }

    return {
      product: prod,
      totalOrders,
      totalUnits,
      activeUnits,
      activeOrdersCount,
      newCount,
      confirmedPendingPrepCount,
      preparingCount,
      shippedCount,
      deliveredCount,
      deliveredUnits,
      cancelledCount,
      returnedCount,
      cancelledOrReturnedCount,
      finalizedCount,
      deliveredRevenue,
      potentialRevenue,
      wholesalePrice,
      shippingCostPerOrder,
      deliveredCost,
      deliveredShippingCost,
      totalDeliveredCost,
      netDeliveredProfit,
      profitMarginPercent,
      activeCost,
      activeShippingCost,
      activeTotalCost,
      expectedNetProfit,
      unitProfitMargin,
      multiUnitOrders,
      deliveryRate,
      overallDeliveryShare,
      confirmationRate,
      cancelReturnRate,
      avgUnitsPerOrder,
      reviewCount: prodReviews.length,
      avgRating,
      topColors,
      topCities,
      verdict,
    };
  };

  const selectedAnalyticsProduct = useMemo(() => {
    if (!products || products.length === 0) return null;
    return products.find((p) => p.id === selectedAnalyticsProductId) || products[0];
  }, [products, selectedAnalyticsProductId]);

  const analyticsProductOrderCounts = useMemo(() => {
    const countsById: Record<string, number> = {};
    const countsByName: Record<string, number> = {};
    (productStatsFilteredOrders || []).forEach((ord) => {
      const seenIds = new Set<string>();
      const seenNames = new Set<string>();
      (ord.items || []).forEach((it) => {
        if (it.productId && !seenIds.has(it.productId)) {
          seenIds.add(it.productId);
          countsById[it.productId] = (countsById[it.productId] || 0) + 1;
        }
        if (it.name && !seenNames.has(it.name)) {
          seenNames.add(it.name);
          countsByName[it.name] = (countsByName[it.name] || 0) + 1;
        }
      });
    });
    const map: Record<string, number> = {};
    (products || []).forEach((p) => {
      map[p.id] = countsById[p.id] || countsByName[p.name] || 0;
    });
    return map;
  }, [products, productStatsFilteredOrders]);

  const filteredAnalyticsProducts = useMemo(() => {
    const q = analyticsProductSearch.trim().toLowerCase();
    if (!q) return products || [];
    return (products || []).filter((p) => {
      const catLabel = p.category === 'men' ? 'رجالي men' : p.category === 'women' ? 'نسائي women' : 'إكسسوارات accessories';
      return (
        (p.name || '').toLowerCase().includes(q) ||
        (p.sku || '').toLowerCase().includes(q) ||
        (p.colors || []).some((c) => (c.name || '').toLowerCase().includes(q)) ||
        catLabel.includes(q)
      );
    });
  }, [products, analyticsProductSearch]);

  React.useEffect(() => {
    if (!isAnalyticsProductDropdownOpen) return;
    const handleOutsideClick = (event: MouseEvent) => {
      if (analyticsPickerRef.current && !analyticsPickerRef.current.contains(event.target as Node)) {
        setIsAnalyticsProductDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isAnalyticsProductDropdownOpen]);

  React.useEffect(() => {
    if (!selectedAnalyticsProduct) {
      setWholesalePriceInput('');
      setShippingCostInput('');
      return;
    }
    const wp = Number(selectedAnalyticsProduct.wholesalePrice);
    const sc = Number(selectedAnalyticsProduct.shippingCostPerOrder);
    setWholesalePriceInput(wp > 0 ? String(wp) : '');
    setShippingCostInput(sc > 0 ? String(sc) : '');
  }, [
    selectedAnalyticsProduct?.id,
    selectedAnalyticsProduct?.wholesalePrice,
    selectedAnalyticsProduct?.shippingCostPerOrder,
  ]);

  const selectedProductStats = useMemo(() => {
    if (activeTab !== 'product_stats' || !selectedAnalyticsProduct) return null;
    const trimmed = wholesalePriceInput.trim();
    const parsed = trimmed === '' ? 0 : Number(trimmed);
    const liveOverride =
      trimmed === ''
        ? 0
        : Number.isFinite(parsed) && parsed >= 0
        ? parsed
        : undefined;

    const trimmedShipping = shippingCostInput.trim();
    const parsedShipping = trimmedShipping === '' ? 0 : Number(trimmedShipping);
    const liveShippingOverride =
      trimmedShipping === ''
        ? 0
        : Number.isFinite(parsedShipping) && parsedShipping >= 0
        ? parsedShipping
        : undefined;

    return computeProductAnalytics(
      selectedAnalyticsProduct,
      liveOverride,
      liveShippingOverride,
      productStatsFilteredOrders
    );
  }, [
    activeTab,
    selectedAnalyticsProduct,
    productStatsFilteredOrders,
    reviews,
    wholesalePriceInput,
    shippingCostInput,
  ]);

  const allProductsAnalyticsList = useMemo(() => {
    if (activeTab !== 'stats' && activeTab !== 'product_stats') return [];
    return (products || [])
      .map((p) => computeProductAnalytics(p, undefined, undefined, productStatsFilteredOrders))
      .sort((a, b) => b.totalOrders - a.totalOrders || b.deliveredRevenue - a.deliveredRevenue);
  }, [activeTab, products, productStatsFilteredOrders, reviews]);

  // Keep selectedOrder synchronized if orders update via auto-transition
  React.useEffect(() => {
    if (!selectedOrder) return;
    const latest = orders.find((o) => o.id === selectedOrder.id);
    if (latest && (latest.status !== selectedOrder.status || latest.customerAction !== selectedOrder.customerAction)) {
      setSelectedOrder(latest);
    }
  }, [orders, selectedOrder]);

  if (!isAdminOpen) return null;

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordInput }),
      });
      const data = await res.json();
      if (data.success && data.token) {
        localStorage.setItem('noblewatch_admin_token', data.token);
        localStorage.setItem('noblewatch_admin_auth', 'true');
        setIsAdmin(true);
        setLoginError('');
        await refreshData();
      } else {
        setLoginError(data.message || 'كلمة المرور غير صحيحة');
      }
    } catch {
      setLoginError('تعذر الاتصال بالخادم');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordChangeFeedback(null);

    if (!authUser && !currentPasswordInput) {
      setPasswordChangeFeedback({ type: 'error', text: 'يرجى إدخال كلمة المرور الحالية' });
      return;
    }
    if (newPasswordInput.trim().length < 4) {
      setPasswordChangeFeedback({
        type: 'error',
        text: 'يجب أن تتكون كلمة المرور الجديدة من 4 أحرف أو أرقام على الأقل',
      });
      return;
    }
    if (newPasswordInput !== confirmPasswordInput) {
      setPasswordChangeFeedback({
        type: 'error',
        text: 'كلمتا المرور الجديدتان غير متطابقتين',
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const adminToken = localStorage.getItem('noblewatch_admin_token');
      if (authUser) {
        const token = await getFreshToken();
        if (token) headers.Authorization = `Bearer ${token}`;
      } else if (adminToken) {
        headers.Authorization = `Bearer ${adminToken}`;
      }

      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          currentPassword: currentPasswordInput,
          newPassword: newPasswordInput,
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.token) {
          localStorage.setItem('noblewatch_admin_token', data.token);
        }
        setPasswordChangeFeedback({
          type: 'success',
          text: data.message || 'تم تغيير كلمة مرور لوحة التحكم وحفظها بنجاح',
        });
        setCurrentPasswordInput('');
        setNewPasswordInput('');
        setConfirmPasswordInput('');
        showToast('تم تغيير كلمة مرور لوحة التحكم بنجاح', 'success');
      } else {
        setPasswordChangeFeedback({
          type: 'error',
          text: data.message || 'تعذر تغيير كلمة المرور',
        });
      }
    } catch {
      setPasswordChangeFeedback({
        type: 'error',
        text: 'تعذر الاتصال بالخادم، يرجى المحاولة مجدداً',
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoginError('');
    setIsGoogleSigningIn(true);
    try {
      const res = await signInWithGoogle();
      if (res?.token) {
        const verifyRes = await fetch('/api/admin/google-login', {
          method: 'POST',
          headers: { Authorization: `Bearer ${res.token}` },
        });
        const verifyData = await verifyRes.json();
        if (verifyData.success && verifyData.token) {
          localStorage.setItem('noblewatch_admin_token', verifyData.token);
          localStorage.setItem('noblewatch_admin_auth', 'true');
          setIsAdmin(true);
          await refreshData();
          showToast(`مرحباً ${res.user.displayName || res.user.email}، تم تسجيل الدخول بنجاح`, 'success');
        } else {
          await signOutUser().catch(() => {});
          setLoginError(verifyData.message || 'هذا الحساب غير مصرح له بالدخول إلى لوحة التحكم');
        }
      }
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user') {
        setLoginError('تعذر تسجيل الدخول عبر حساب Google، يرجى المحاولة مرة أخرى');
      }
    } finally {
      setIsGoogleSigningIn(false);
    }
  };

  const handleLogout = () => {
    setIsAdmin(false);
    localStorage.removeItem('noblewatch_admin_auth');
    localStorage.removeItem('noblewatch_admin_token');
    localStorage.removeItem('qevorin_admin_auth');
    setPasswordInput('');
    signOutUser().catch(() => {});
  };

  // ---------------- ANALYTICS CALCULATIONS ----------------
  const totalOrdersCount = orders.length;
  const newOrdersCount = newOrders.length;

  // Date-filtered stats for لوحة الإحصائيات (Tab 1)
  const statsTotalOrdersCount = statsFilteredOrders.length;
  const statsNewOrdersCount = statsFilteredOrders.filter((o) => o.status === 'جديد').length;
  const statsPreparingOrdersCount = statsFilteredOrders.filter((o) => o.status === 'قيد التجهيز').length;
  const statsConfirmedOrdersCount = statsFilteredOrders.filter(
    (o) => o.status === 'تم التأكيد' || o.status === 'قيد التجهيز'
  ).length;
  const statsDeliveredOrdersCount = statsFilteredOrders.filter((o) => o.status === 'تم التسليم').length;
  const statsShippedOrdersCount = statsFilteredOrders.filter((o) => o.status === 'تم الشحن').length;
  const statsCancelledOrdersCount = statsFilteredOrders.filter(
    (o) => o.status === 'ملغى' || o.status === 'مرتجع'
  ).length;
  const statsOnlyCancelledCount = statsFilteredOrders.filter((o) => o.status === 'ملغى').length;
  const statsOnlyReturnedCount = statsFilteredOrders.filter((o) => o.status === 'مرتجع').length;

  // Real delivered revenue in MAD (date-filtered)
  const statsDeliveredRevenue = statsFilteredOrders
    .filter((o) => o.status === 'تم التسليم')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  // Low stock products
  const lowStockProducts = products.filter((p) => p.stock <= 5);

  // Filtered Orders
  const filteredOrders = orders.filter((o) => {
    if (orderStatusFilter !== 'all' && o.status !== orderStatusFilter) return false;
    if (orderCityFilter !== 'all' && !o.city.includes(orderCityFilter)) return false;
    return matchesOrderSearch(o, orderSearch);
  });

  // Export orders to CSV
  const handleExportCSV = () => {
    const headers = ['رقم الطلب', 'التاريخ', 'اسم العميل', 'رقم الهاتف', 'المدينة', 'العنوان', 'المنتجات', 'المبلغ بالدرهم', 'الحالة'];
    const rows = orders.map((o) => [
      o.orderNumber,
      new Date(o.date).toLocaleDateString('ar-MA'),
      `"${o.customerName}"`,
      `"${o.phone}"`,
      `"${o.city}"`,
      `"${o.address}"`,
      `"${o.items.map((it) => `${it.name} (${it.color}) x${it.quantity}`).join(' + ')}"`,
      o.totalAmount,
      o.status,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `noblewatch_orders_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('تم تصدير الطلبات إلى ملف CSV بنجاح', 'success');
  };

  // Export preparing orders to Ozon Express Excel (.xlsx) template
  const handleExportPreparingXlsx = async (ordersToExport: Order[], customFilename?: string) => {
    if (!ordersToExport || ordersToExport.length === 0) {
      showToast('لا توجد طلبات قيد التجهيز لتصديرها حالياً', 'error');
      return;
    }
    try {
      await exportOrdersToOzonExpressXlsx(ordersToExport, customFilename);
      showToast(
        ordersToExport.length === 1
          ? `تم تحميل ملف Excel (.xlsx) للطلب ${ordersToExport[0].orderNumber} بنموذج شركة الشحن بنجاح`
          : `تم تحميل ملف Excel (.xlsx) لـ ${ordersToExport.length} طلب بنموذج شركة الشحن بنجاح`,
        'success'
      );
    } catch {
      showToast('حدث خطأ أثناء إنشاء ملف Excel، يرجى المحاولة مرة أخرى', 'error');
    }
  };

  // WhatsApp Customer Confirmation Actions
  const handleSendCustomerWhatsApp = (order: Order, customMessage?: string) => {
    const storeName = settings?.storeName || 'Noblewatch';
    let url: string;
    if (customMessage && customMessage.trim()) {
      url = buildWhatsAppUrl(order.phone, customMessage);
    } else {
      url = getWhatsAppCustomerOrderUrl(order, storeName);
    }
    window.open(url, '_blank', 'noopener,noreferrer');
    markOrderWhatsAppSent(order.id);
    showToast(`تم فتح محادثة واتساب للطلب ${order.orderNumber} وتحديث حالة الإرسال للزبون "${order.customerName}"`, 'success');
  };

  const handleCopyCustomerWhatsAppText = (order: Order, customMessage?: string) => {
    const storeName = settings?.storeName || 'Noblewatch';
    const text = customMessage && customMessage.trim() ? customMessage : generateCustomerConfirmationMessage(order, storeName);
    navigator.clipboard.writeText(text);
    showToast('تم نسخ نص رسالة تأكيد الطلب للزبون بنجاح!', 'info');
  };

  // WhatsApp Shipped (24h Delivery) Notification Actions
  const handleSendShippedWhatsApp = (order: Order) => {
    const storeName = settings?.storeName || 'Noblewatch';
    const url = getWhatsAppCustomerShippedUrl(order, storeName);
    window.open(url, '_blank', 'noopener,noreferrer');
    setSentShippedNoticeIds((prev) => ({ ...prev, [order.id]: true }));
    showToast(`تم فتح واتساب لإرسال إشعار الشحن والتوصيل خلال 24 ساعة للزبون "${order.customerName}"`, 'success');
  };

  const handleCopyShippedWhatsAppText = (order: Order) => {
    const storeName = settings?.storeName || 'Noblewatch';
    const text = generateCustomerShippedMessage(order, storeName);
    navigator.clipboard.writeText(text);
    showToast(`تم نسخ رسالة إشعار الشحن (24 ساعة) للطلب ${order.orderNumber}`, 'info');
  };

  // Edit New Order Actions
  const handleStartEditOrder = (order: Order) => {
    setEditingOrder(JSON.parse(JSON.stringify(order)));
  };

  const recalcOrderTotals = (items: OrderItem[], shippingFee: number) => {
    const subtotal = items.reduce((sum, it) => sum + (Number(it.price) || 0), 0);
    return { subtotal, totalAmount: subtotal + (Number(shippingFee) || 0) };
  };

  const handleSaveOrderEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;
    if (!editingOrder.customerName.trim() || !editingOrder.phone.trim() || !editingOrder.city.trim() || !editingOrder.address.trim()) {
      showToast('يرجى ملء الاسم، رقم الهاتف، المدينة، والعنوان', 'error');
      return;
    }
    setIsSavingOrderEdit(true);
    try {
      const normalizedItems: OrderItem[] = (editingOrder.items || []).map((it) => {
        const qty = Math.max(1, Number(it.quantity) || 1);
        const colorsArr = Array.from({ length: qty }, (_, idx) =>
          (it.selectedColors && it.selectedColors[idx]) || it.color || 'أسود ملكي'
        );
        return {
          ...it,
          quantity: qty,
          color: colorsArr[0] || it.color,
          selectedColors: qty > 1 ? colorsArr : [colorsArr[0]],
          price: Math.max(0, Number(it.price) || 0),
        };
      });

      const computedSubtotal = normalizedItems.reduce((sum, it) => sum + it.price, 0);
      const finalTotal = Math.max(0, Number(editingOrder.totalAmount) || computedSubtotal);

      const ok = await updateOrderDetails(editingOrder.id, {
        customerName: editingOrder.customerName.trim(),
        phone: editingOrder.phone.trim(),
        city: editingOrder.city.trim(),
        address: editingOrder.address.trim(),
        notes: (editingOrder.notes || '').trim(),
        items: normalizedItems,
        subtotal: computedSubtotal,
        totalAmount: finalTotal,
      });

      if (ok) {
        setEditingOrder(null);
      }
    } finally {
      setIsSavingOrderEdit(false);
    }
  };

  // Product Editing Actions
  const handleStartAddProduct = () => {
    setEditingProduct({
      name: '',
      sku: '',
      category: 'men',
      categories: ['men'],
      price: '' as any,
      originalPrice: '' as any,
      stock: '' as any,
      isNew: true,
      isSpecialOffer: false,
      isPublished: true,
      colors: [],
      images: [],
      videos: [],
      specs: {
        brand: 'Noblewatch',
        model: '',
        movement: '',
        caseMaterial: '',
        strapMaterial: '',
        dialColor: '',
        caseDiameter: '',
        caseThickness: '',
        glass: '',
        clasp: '',
        waterResistance: '',
        warranty: 'ضمان رسمي لمدة سنة كاملة',
      },
      boxContents: [],
      description: '',
      features: ['ضمان معتمد لمدة سنة كاملة ضد أي عيوب مصنعية'],
      tieredPricing: {
        enabled: true,
        mode: 'auto',
        twoPiecesDiscountPercent: 16,
        threePiecesDiscountPercent: 24,
        twoPiecesBadge: 'الأكثر طلباً ⭐',
        threePiecesBadge: 'أفضل توفير 🔥',
      },
    });
    setIsEditingProduct(true);
  };

  const handleSaveProductModal = React.useCallback(
    async (payload: Partial<Product>, existingId?: string) => {
      return existingId ? updateProduct(existingId, payload) : addProduct(payload);
    },
    [updateProduct, addProduct]
  );

  const handleCloseProductModal = React.useCallback(() => {
    setIsEditingProduct(false);
    setEditingProduct(null);
  }, []);

  const handleSaveWholesalePrice = async () => {
    if (!selectedAnalyticsProduct || isSavingWholesalePrice) return;
    const trimmedWholesale = wholesalePriceInput.trim();
    const parsedWholesale = trimmedWholesale === '' ? 0 : Number(trimmedWholesale);
    if (!Number.isFinite(parsedWholesale) || parsedWholesale < 0) {
      showToast('يرجى إدخال سعر شراء بالجملة صحيح (0 أو أكثر)', 'error');
      return;
    }

    const trimmedShipping = shippingCostInput.trim();
    const parsedShipping = trimmedShipping === '' ? 0 : Number(trimmedShipping);
    if (!Number.isFinite(parsedShipping) || parsedShipping < 0) {
      showToast('يرجى إدخال مصاريف شحن صحيحة لكل طلبية (0 أو أكثر)', 'error');
      return;
    }

    setIsSavingWholesalePrice(true);
    try {
      const res = await updateProduct(selectedAnalyticsProduct.id, {
        wholesalePrice: parsedWholesale,
        shippingCostPerOrder: parsedShipping,
      });
      if (res.ok) {
        showToast(
          `تم حفظ سعر الجملة (${formatPrice(parsedWholesale)}) ومصاريف الشحن (${formatPrice(parsedShipping)}/طلب) وحساب الربح الصافي`,
          'success'
        );
      }
    } finally {
      setIsSavingWholesalePrice(false);
    }
  };

  const defaultOrderSecurity: OrderSecuritySettings = {
    preventDuplicates: true,
    duplicateWindowHours: 24,
    rapidCooldownMinutes: 5,
    preventFakeOrders: true,
    preventBots: true,
    requireHumanCheck: true,
    autoBlockHighCancelPhones: true,
    autoBlockCancelThreshold: 2,
    maxOrdersPerIpPerHour: 4,
    blockedPhones: [],
  };

  const currentOrderSecurity: OrderSecuritySettings = {
    ...defaultOrderSecurity,
    ...(localSettings?.orderSecurity || settings?.orderSecurity || {}),
  };

  const updateOrderSecurityField = <K extends keyof OrderSecuritySettings>(
    field: K,
    value: OrderSecuritySettings[K]
  ) => {
    if (!localSettings) return;
    setLocalSettings({
      ...localSettings,
      orderSecurity: {
        ...currentOrderSecurity,
        [field]: value,
      },
    });
  };

  const defaultTrackingPixels: TrackingPixelsSettings = {
    facebookEnabled: false,
    facebookPixelId: '',
    googleEnabled: false,
    googleTagId: '',
    googleAdsConversionLabel: '',
    tiktokEnabled: false,
    tiktokPixelId: '',
  };

  const currentTrackingPixels: TrackingPixelsSettings = {
    ...defaultTrackingPixels,
    ...(localSettings?.trackingPixels || settings?.trackingPixels || {}),
  };

  const updateTrackingPixelFields = (patch: Partial<TrackingPixelsSettings>) => {
    const base = localSettingsRef.current || localSettings;
    if (!base) return;
    const basePixels: TrackingPixelsSettings = {
      ...defaultTrackingPixels,
      ...(base.trackingPixels || {}),
    };
    setLocalSettings({
      ...base,
      trackingPixels: {
        ...basePixels,
        ...patch,
      },
    });
  };

  const updateTrackingPixelField = <K extends keyof TrackingPixelsSettings>(
    field: K,
    value: TrackingPixelsSettings[K]
  ) => {
    updateTrackingPixelFields({ [field]: value } as Partial<TrackingPixelsSettings>);
  };

  const normalizeSocialUrlClient = (raw?: string): string => {
    const clean = String(raw || '')
      .replace(/[\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g, '')
      .trim();
    if (!clean) return '';
    if (/^https?:\/\//i.test(clean)) return clean;
    if (clean.startsWith('//')) return `https:${clean}`;
    return `https://${clean.replace(/^\/+/, '')}`;
  };

  const [pixelReport, setPixelReport] = useState<PixelsDiagnosticReport | null>(null);
  const [isVerifyingPixels, setIsVerifyingPixels] = useState(false);

  React.useEffect(() => {
    if (activeTab === 'settings' && localSettings?.trackingPixels) {
      initTrackingPixels(localSettings.trackingPixels);
      setPixelReport(getPixelDiagnostics(localSettings.trackingPixels));
    }
  }, [activeTab]);

  const handleSaveSettings = async (
    targetSettings: StoreSettings | null = localSettingsRef.current || localSettings,
    customSuccessText?: string
  ): Promise<boolean> => {
    const source = targetSettings || localSettingsRef.current || localSettings;
    if (!source || isSavingSettings) return false;
    setIsSavingSettings(true);
    setSettingsSaveFeedback(null);
    try {
      const cleanWhatsApp = sanitizePhoneText(source.whatsappNumber);
      const cleanContact = sanitizePhoneText(source.contactPhone);
      const rawSocial = source.socialLinks || {};
      const cleanedPixels: TrackingPixelsSettings = {
        facebookEnabled: Boolean(source.trackingPixels?.facebookEnabled),
        facebookPixelId: extractFacebookPixelId(source.trackingPixels?.facebookPixelId),
        googleEnabled: Boolean(source.trackingPixels?.googleEnabled),
        googleTagId: extractGoogleTagId(source.trackingPixels?.googleTagId),
        googleAdsConversionLabel: String(source.trackingPixels?.googleAdsConversionLabel || '').trim(),
        tiktokEnabled: Boolean(source.trackingPixels?.tiktokEnabled),
        tiktokPixelId: extractTiktokPixelId(source.trackingPixels?.tiktokPixelId),
      };
      const cleanedTarget: StoreSettings = {
        ...source,
        whatsappNumber: cleanWhatsApp,
        contactPhone: cleanContact,
        socialLinks: {
          ...rawSocial,
          instagram: normalizeSocialUrlClient(rawSocial.instagram),
          facebook: normalizeSocialUrlClient(rawSocial.facebook),
          tiktok: normalizeSocialUrlClient(rawSocial.tiktok),
          youtube: normalizeSocialUrlClient(rawSocial.youtube),
          ...(cleanWhatsApp ? { whatsapp: cleanWhatsApp } : {}),
        },
        trackingPixels: cleanedPixels,
      };
      const savedOk = await updateSettings(cleanedTarget);
      if (savedOk) {
        isSettingsDirtyRef.current = false;
        setLocalSettings(cleanedTarget, false);
        setSettingsSaveFeedback({
          type: 'success',
          text:
            customSuccessText ||
            'تم حفظ جميع المعلومات والتعديلات بنجاح وتطبيقها فوراً على المتجر.',
        });
        return true;
      }
      setSettingsSaveFeedback({
        type: 'error',
        text: 'تم رفض أو فشل حفظ المعلومات! يرجى التحقق من صلاحية الجلسة أو البيانات المدخلة والمحاولة مجدداً.',
      });
      return false;
    } catch {
      setSettingsSaveFeedback({
        type: 'error',
        text: 'فشل حفظ المعلومات بسبب تعذر الاتصال بالخادم، يرجى المحاولة مجدداً.',
      });
      return false;
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleSaveAndVerifyPixels = async () => {
    const base = localSettingsRef.current || localSettings;
    if (!base) return;
    const basePixels: TrackingPixelsSettings = {
      ...defaultTrackingPixels,
      ...(base.trackingPixels || {}),
    };
    const fbId = extractFacebookPixelId(basePixels.facebookPixelId);
    const gId = extractGoogleTagId(basePixels.googleTagId);
    const ttId = extractTiktokPixelId(basePixels.tiktokPixelId);
    const cleanedPixels: TrackingPixelsSettings = {
      facebookEnabled: Boolean(basePixels.facebookEnabled),
      facebookPixelId: fbId,
      googleEnabled: Boolean(basePixels.googleEnabled),
      googleTagId: gId,
      googleAdsConversionLabel: String(basePixels.googleAdsConversionLabel || '').trim(),
      tiktokEnabled: Boolean(basePixels.tiktokEnabled),
      tiktokPixelId: ttId,
    };

    if (cleanedPixels.facebookEnabled && !isValidFacebookPixelId(cleanedPixels.facebookPixelId)) {
      showToast('معرف Facebook Pixel غير صالح — يجب أن يتكون من 10 إلى 20 رقماً فقط', 'error');
      setPixelReport(getPixelDiagnostics(cleanedPixels));
      return;
    }

    if (cleanedPixels.googleEnabled && !isValidGoogleTagId(cleanedPixels.googleTagId)) {
      showToast('معرف Google Pixel غير صالح — يجب أن يبدأ بـ G- أو AW- أو GTM-', 'error');
      setPixelReport(getPixelDiagnostics(cleanedPixels));
      return;
    }

    if (cleanedPixels.tiktokEnabled && !isValidTiktokPixelId(cleanedPixels.tiktokPixelId)) {
      showToast('معرف TikTok Pixel غير صالح — يجب أن يتكون من 10 إلى 30 حرفاً ورقماً فقط (مثل CXXXXXXXXXXXXXXX)', 'error');
      setPixelReport(getPixelDiagnostics(cleanedPixels));
      return;
    }

    const updatedSettings: StoreSettings = {
      ...base,
      trackingPixels: cleanedPixels,
    };
    setLocalSettings(updatedSettings, true);
    setIsVerifyingPixels(true);

    try {
      const savedOk = await handleSaveSettings(
        updatedSettings,
        'تم حفظ إعدادات البيكسل وروابط التواصل والتعديلات بنجاح وتطبيقها على المتجر.'
      );
      const report = await runPixelVerificationTest(cleanedPixels);
      setPixelReport(report);

      if (savedOk) {
        const fbOk = !cleanedPixels.facebookEnabled || (report.facebook.formatValid && report.facebook.sdkReady);
        const gOk = !cleanedPixels.googleEnabled || (report.google.formatValid && report.google.sdkReady);
        const ttOk = !cleanedPixels.tiktokEnabled || (report.tiktok.formatValid && report.tiktok.sdkReady);
        if (fbOk && gOk && ttOk) {
          showToast('تم حفظ إعدادات البيكسل وروابط التواصل والتحقق من اشتغالها بنجاح', 'success');
        }
      }
    } finally {
      setIsVerifyingPixels(false);
    }
  };

  const handleBlockPhone = async (rawPhone: string) => {
    const norm = normalizeMoroccanPhone(rawPhone);
    if (!norm || norm.length < 8) {
      showToast('يرجى إدخال رقم هاتف مغربي صالح للحظر', 'error');
      return;
    }
    try {
      const token = localStorage.getItem('noblewatch_admin_token');
      const res = await fetch('/api/security/block-phone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ phone: norm }),
      });
      const data = await res.json();
      if (data.success) {
        setManualBlockPhoneInput('');
        if (localSettings && data.orderSecurity) {
          setLocalSettings({ ...localSettings, orderSecurity: data.orderSecurity });
        }
        await refreshData();
        await fetchSecurityOverview();
        showToast(`تم حظر الرقم ${norm} من إرسال أي طلبات جديدة`, 'success');
      } else {
        showToast(data.message || 'تعذر حظر الرقم', 'error');
      }
    } catch {
      showToast('تعذر الاتصال بالخادم', 'error');
    }
  };

  const handleUnblockPhone = async (rawPhone: string) => {
    const norm = normalizeMoroccanPhone(rawPhone);
    try {
      const token = localStorage.getItem('noblewatch_admin_token');
      const res = await fetch('/api/security/unblock-phone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ phone: norm }),
      });
      const data = await res.json();
      if (data.success) {
        if (localSettings && data.orderSecurity) {
          setLocalSettings({ ...localSettings, orderSecurity: data.orderSecurity });
        }
        await refreshData();
        showToast(`تم إلغاء حظر الرقم ${norm}`, 'info');
      }
    } catch {
      showToast('تعذر الاتصال بالخادم', 'error');
    }
  };

  const handleClearSecurityLogs = async () => {
    try {
      const token = localStorage.getItem('noblewatch_admin_token');
      const res = await fetch('/api/security/clear-logs', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.success) {
        setSecurityLogs([]);
        showToast('تم مسح سجل المحاولات المحجوبة', 'info');
      }
    } catch {
      showToast('تعذر مسح السجل', 'error');
    }
  };

  return (
    <>
    <div dir="rtl" className="fixed inset-0 z-50 overflow-y-auto bg-[#0b0d13] text-right">
      <div className="min-h-screen max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Admin Navigation Bar */}
        <div className="flex items-center justify-between bg-[#151822] border border-white/10 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAdminOpen(false)}
              className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10"
              title="إغلاق والرجوع للمتجر"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full p-0.5 bg-gradient-to-br from-[#dfb76c] via-[#c5a869] to-[#9d7e35] shadow-md flex-shrink-0">
                <img
                  src="/favicon.svg"
                  alt="Noblewatch Logo"
                  className="w-full h-full rounded-full object-contain"
                />
              </div>
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <span className="gold-gradient-text font-serif italic text-xl">Noblewatch</span>
                  <span>لوحة التحكم الإدارية</span>
                </h2>
                <span className="text-[11px] text-[#c5a869]">إدارة المخزون، الطلبات، والزبائن</span>
              </div>
            </div>
          </div>

          {isAdmin && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-3 py-1 rounded-full hidden sm:inline-block">
                {authUser?.email ? `متصل: ${authUser.email}` : 'متصل كمسؤول (Admin)'}
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-400 hover:bg-rose-900/40 text-xs font-semibold"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>تسجيل خروج</span>
              </button>
            </div>
          )}
        </div>

        {/* ================= IF NOT AUTHENTICATED: LOGIN FORM ================= */}
        {!isAdmin ? (
          <div className="max-w-md mx-auto my-16 rounded-3xl bg-[#141720] border border-white/10 p-8 text-center space-y-6 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl gold-gradient-bg text-black flex items-center justify-center mx-auto shadow-lg">
              <Lock className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-bold text-white">تسجيل الدخول للمدير</h3>
              <p className="text-xs text-gray-400">
                أدخل كلمة المرور للوصول إلى لوحة إدارة الساعات والإكسسوارات والطلبات
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4 text-right">
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">كلمة المرور</label>
                <input
                  type="password"
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="أدخل كلمة مرور لوحة التحكم"
                  className="w-full bg-[#1b1f2b] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#c5a869] text-left"
                  dir="ltr"
                />
                {loginError && <p className="text-xs text-rose-400 mt-2">{loginError}</p>}
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl gold-gradient-bg text-black font-black text-sm shadow-xl hover:brightness-110 active:scale-95 transition"
              >
                دخول إلى لوحة التحكم
              </button>
            </form>

            <div className="relative flex items-center py-1">
              <div className="flex-grow border-t border-white/10" />
              <span className="flex-shrink mx-3 text-[11px] text-gray-500">أو</span>
              <div className="flex-grow border-t border-white/10" />
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isGoogleSigningIn}
              className="w-full py-3 rounded-xl bg-white text-gray-900 hover:bg-gray-100 font-bold text-xs shadow-lg flex items-center justify-center gap-2.5 active:scale-95 transition disabled:opacity-60 cursor-pointer"
            >
              {isGoogleSigningIn ? (
                <Loader2 className="w-4 h-4 animate-spin text-gray-700" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              )}
              <span>تسجيل الدخول بحساب Google</span>
            </button>

            <div className="p-3 rounded-xl bg-white/5 text-[11px] text-gray-400">
              💡 كلمة المرور الافتراضية قبل التغيير هي: <code className="text-[#c5a869]">admin123</code> (يمكنك تغييرها من الإعدادات).
            </div>
          </div>
        ) : (
          /* ================= AUTHENTICATED ADMIN DASHBOARD ================= */
          <div className="space-y-6">
            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-white/10">
              <button
                onClick={() => setActiveTab('stats')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  activeTab === 'stats'
                    ? 'gold-gradient-bg text-black shadow-md'
                    : 'bg-[#151822] text-gray-300 hover:text-white'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>لوحة الإحصائيات</span>
              </button>

              <button
                onClick={() => setActiveTab('product_stats')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  activeTab === 'product_stats'
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-black shadow-lg shadow-amber-500/20'
                    : 'bg-[#151822] text-amber-300 hover:text-white border border-amber-500/30'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>إحصائيات المنتج</span>
              </button>

              <button
                onClick={() => setActiveTab('orders')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  activeTab === 'orders'
                    ? 'gold-gradient-bg text-black shadow-md'
                    : 'bg-[#151822] text-gray-300 hover:text-white'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>إدارة الطلبات</span>
                <span className="text-[10px] text-gray-400">({orders.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('new_orders')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer relative ${
                  activeTab === 'new_orders'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20'
                    : 'bg-[#151822] text-emerald-400 hover:text-white border border-emerald-500/30'
                }`}
              >
                <Clock className={`w-4 h-4 ${activeTab === 'new_orders' ? 'text-white' : 'text-emerald-400'}`} />
                <span>طلبات جديدة</span>
                {newOrdersCount > 0 ? (
                  <span className="px-1.5 py-0.5 rounded-full bg-emerald-500 text-black text-[10px] font-black animate-pulse">
                    {newOrdersCount}
                  </span>
                ) : (
                  <span className={`text-[10px] ${activeTab === 'new_orders' ? 'text-white/80' : 'text-gray-400'}`}>(0)</span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('preparing_orders')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer relative ${
                  activeTab === 'preparing_orders'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/20'
                    : 'bg-[#151822] text-purple-400 hover:text-white border border-purple-500/30'
                }`}
              >
                <Package className={`w-4 h-4 ${activeTab === 'preparing_orders' ? 'text-white' : 'text-purple-400'}`} />
                <span>طلبات قيد التجهيز</span>
                {preparingOrdersCount > 0 ? (
                  <span className="px-1.5 py-0.5 rounded-full bg-purple-400 text-black text-[10px] font-black">
                    {preparingOrdersCount}
                  </span>
                ) : (
                  <span className={`text-[10px] ${activeTab === 'preparing_orders' ? 'text-white/80' : 'text-gray-400'}`}>(0)</span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('shipped_orders')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer relative ${
                  activeTab === 'shipped_orders'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20'
                    : 'bg-[#151822] text-cyan-400 hover:text-white border border-cyan-500/30'
                }`}
              >
                <Truck className={`w-4 h-4 ${activeTab === 'shipped_orders' ? 'text-white' : 'text-cyan-400'}`} />
                <span>طلبات مشحونة</span>
                {shippedOrders.length > 0 ? (
                  <span className="px-1.5 py-0.5 rounded-full bg-cyan-400 text-black text-[10px] font-black">
                    {shippedOrders.length}
                  </span>
                ) : (
                  <span className={`text-[10px] ${activeTab === 'shipped_orders' ? 'text-white/80' : 'text-gray-400'}`}>(0)</span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('cancelled_orders')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer relative ${
                  activeTab === 'cancelled_orders'
                    ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-lg shadow-rose-500/20'
                    : 'bg-[#151822] text-rose-400 hover:text-white border border-rose-500/30'
                }`}
              >
                <XCircle className={`w-4 h-4 ${activeTab === 'cancelled_orders' ? 'text-white' : 'text-rose-400'}`} />
                <span>طلبات ملغى</span>
                {cancelledOrders.length > 0 ? (
                  <span className="px-1.5 py-0.5 rounded-full bg-rose-400 text-black text-[10px] font-black">
                    {cancelledOrders.length}
                  </span>
                ) : (
                  <span className={`text-[10px] ${activeTab === 'cancelled_orders' ? 'text-white/80' : 'text-gray-400'}`}>(0)</span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('products')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  activeTab === 'products'
                    ? 'gold-gradient-bg text-black shadow-md'
                    : 'bg-[#151822] text-gray-300 hover:text-white'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>إدارة المنتوجات ({products.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('reviews')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  activeTab === 'reviews'
                    ? 'gold-gradient-bg text-black shadow-md'
                    : 'bg-[#151822] text-gray-300 hover:text-white'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>إدارة التقييمات ({reviews.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  activeTab === 'settings'
                    ? 'gold-gradient-bg text-black shadow-md'
                    : 'bg-[#151822] text-gray-300 hover:text-white'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>تخصيص المتجر والسياسات</span>
              </button>
            </div>

            {/* ================= TAB 1: ANALYTICS & STATS ================= */}
            {activeTab === 'stats' && (
              <div className="space-y-6">
                {/* Date Range Filter Bar for Store Analytics */}
                {(() => {
                  const presets: Array<{
                    id: 'all' | 'today' | 'yesterday' | 'last7' | 'thisMonth' | 'last30';
                    label: string;
                  }> = [
                    { id: 'all', label: 'كل الفترات' },
                    { id: 'today', label: 'اليوم' },
                    { id: 'yesterday', label: 'أمس' },
                    { id: 'last7', label: 'آخر 7 أيام' },
                    { id: 'thisMonth', label: 'هذا الشهر' },
                    { id: 'last30', label: 'آخر 30 يوماً' },
                  ];
                  const isFiltered = Boolean(statsDateFrom || statsDateTo);

                  return (
                    <div className="p-4 sm:p-5 rounded-2xl bg-[#151822] border border-[#c5a869]/25 shadow-lg space-y-3">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-[#c5a869]/15 border border-[#c5a869]/30 text-[#c5a869] flex items-center justify-center flex-shrink-0">
                            <Calendar className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="text-sm font-black text-white">تصفية الإحصائيات حسب التاريخ</h3>
                            <p className="text-[11px] text-gray-400">
                              {isFiltered
                                ? `عرض نتائج ${statsFilteredOrders.length} طلب من أصل ${orders.length} في الفترة المختارة`
                                : `عرض الإحصائيات الشاملة لجميع الطلبات (${orders.length} طلب)`}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                          {presets.map((p) => {
                            const r = getDatePresetRange(p.id);
                            const active = statsDateFrom === r.from && statsDateTo === r.to;
                            return (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => {
                                  setStatsDateFrom(r.from);
                                  setStatsDateTo(r.to);
                                }}
                                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition cursor-pointer ${
                                  active
                                    ? 'bg-[#c5a869] text-black font-black shadow'
                                    : 'bg-[#10131c] text-gray-300 border border-white/10 hover:border-[#c5a869]/40 hover:text-white'
                                }`}
                              >
                                {p.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-end gap-3 pt-3 border-t border-white/5">
                        <div>
                          <label className="block text-[11px] font-bold text-gray-300 mb-1">من تاريخ:</label>
                          <input
                            type="date"
                            value={statsDateFrom}
                            onChange={(e) => setStatsDateFrom(e.target.value)}
                            className="bg-[#10131c] border border-white/15 focus:border-[#c5a869] rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none [color-scheme:dark]"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-gray-300 mb-1">إلى تاريخ:</label>
                          <input
                            type="date"
                            value={statsDateTo}
                            onChange={(e) => setStatsDateTo(e.target.value)}
                            className="bg-[#10131c] border border-white/15 focus:border-[#c5a869] rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none [color-scheme:dark]"
                          />
                        </div>

                        {isFiltered && (
                          <button
                            type="button"
                            onClick={() => {
                              setStatsDateFrom('');
                              setStatsDateTo('');
                            }}
                            className="px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>إعادة ضبط التاريخ</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* 6 Isolated Main KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                  {/* 1. الطلبات المسجلة في النظام */}
                  <button
                    type="button"
                    onClick={() => setActiveTab('orders')}
                    className="group text-right p-5 rounded-2xl bg-gradient-to-b from-[#c5a869]/10 to-[#151822] border border-[#c5a869]/25 hover:border-[#c5a869]/60 transition shadow-lg space-y-3 cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-300 group-hover:text-white transition">
                        الطلبات المسجلة في النظام
                      </span>
                      <div className="w-9 h-9 rounded-xl bg-[#c5a869]/20 text-[#c5a869] border border-[#c5a869]/30 flex items-center justify-center flex-shrink-0">
                        <ShoppingBag className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="text-2xl font-black text-white">
                      {statsTotalOrdersCount} <span className="text-sm font-bold text-gray-400">طلب</span>
                    </div>
                    <span className="text-[11px] text-[#c5a869] block">
                      {statsDateFrom || statsDateTo ? 'طلبات الفترة المختارة' : 'إجمالي جميع الطلبات المسجلة'}
                    </span>
                  </button>

                  {/* 2. الطلبات الجديدة */}
                  <button
                    type="button"
                    onClick={() => setActiveTab('new_orders')}
                    className="group text-right p-5 rounded-2xl bg-gradient-to-b from-amber-500/10 to-[#151822] border border-amber-500/25 hover:border-amber-400/60 transition shadow-lg space-y-3 cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-300 group-hover:text-white transition">
                        الطلبات الجديدة
                      </span>
                      <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
                        <Clock className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="text-2xl font-black text-amber-400">
                      {statsNewOrdersCount} <span className="text-sm font-bold text-amber-300/80">طلب</span>
                    </div>
                    <span className="text-[11px] text-gray-400 block">
                      طلبات واردة بانتظار التأكيد
                    </span>
                  </button>

                  {/* 3. الطلبات قيد التجهيز */}
                  <button
                    type="button"
                    onClick={() => setActiveTab('preparing_orders')}
                    className="group text-right p-5 rounded-2xl bg-gradient-to-b from-purple-500/10 to-[#151822] border border-purple-500/25 hover:border-purple-400/60 transition shadow-lg space-y-3 cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-300 group-hover:text-white transition">
                        الطلبات قيد التجهيز
                      </span>
                      <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center flex-shrink-0">
                        <Package className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="text-2xl font-black text-purple-400">
                      {statsPreparingOrdersCount} <span className="text-sm font-bold text-purple-300/80">طلب</span>
                    </div>
                    <span className="text-[11px] text-gray-400 block">
                      جاري تجهيزها وتغليفها للشحن
                    </span>
                  </button>

                  {/* 4. الطلبات المشحونة */}
                  <button
                    type="button"
                    onClick={() => setActiveTab('shipped_orders')}
                    className="group text-right p-5 rounded-2xl bg-gradient-to-b from-cyan-500/10 to-[#151822] border border-cyan-500/25 hover:border-cyan-400/60 transition shadow-lg space-y-3 cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-300 group-hover:text-white transition">
                        الطلبات المشحونة
                      </span>
                      <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
                        <Truck className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="text-2xl font-black text-cyan-400">
                      {statsShippedOrdersCount} <span className="text-sm font-bold text-cyan-300/80">طلب</span>
                    </div>
                    <span className="text-[11px] text-gray-400 block">
                      جاري توصيلها مع شركة الشحن
                    </span>
                  </button>

                  {/* 4. الطلبات المسلمة */}
                  <button
                    type="button"
                    onClick={() => {
                      setOrderStatusFilter('تم التسليم');
                      setActiveTab('orders');
                    }}
                    className="group text-right p-5 rounded-2xl bg-gradient-to-b from-emerald-500/10 to-[#151822] border border-emerald-500/25 hover:border-emerald-400/60 transition shadow-lg space-y-3 cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-300 group-hover:text-white transition">
                        الطلبات المسلمة
                      </span>
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="text-2xl font-black text-emerald-400">
                      {statsDeliveredOrdersCount} <span className="text-sm font-bold text-emerald-300/80">طلب</span>
                    </div>
                    <span className="text-[11px] text-emerald-300/90 font-semibold block">
                      المحصل: {formatPrice(statsDeliveredRevenue)}
                    </span>
                  </button>

                  {/* 5. الطلبات الملغاة أو المرتجعة */}
                  <button
                    type="button"
                    onClick={() => setActiveTab('cancelled_orders')}
                    className="group text-right p-5 rounded-2xl bg-gradient-to-b from-rose-500/10 to-[#151822] border border-rose-500/25 hover:border-rose-400/60 transition shadow-lg space-y-3 cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-300 group-hover:text-white transition">
                        الطلبات الملغاة أو المرتجعة
                      </span>
                      <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
                        <XCircle className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="text-2xl font-black text-rose-400">
                      {statsCancelledOrdersCount} <span className="text-sm font-bold text-rose-300/80">طلب</span>
                    </div>
                    <span className="text-[11px] text-gray-400 block">
                      {statsOnlyCancelledCount} ملغى | {statsOnlyReturnedCount} مرتجع
                    </span>
                  </button>
                </div>

                {/* Secondary Row: Low stock & Top watches */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Low Stock Warning Box */}
                  <div className="p-6 rounded-2xl bg-[#151822] border border-white/5 space-y-4">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-amber-400" />
                      <span>تنبيهات المخزون المنخفض (أقل من 5 حبات)</span>
                    </h3>

                    {lowStockProducts.length > 0 ? (
                      <div className="space-y-3">
                        {lowStockProducts.map((p) => (
                          <div
                            key={p.id}
                            className="flex items-center justify-between p-3 rounded-xl bg-white/5 text-xs"
                          >
                            <div className="flex items-center gap-3">
                              <img
                                src={p.images[0] || '/assets/luxury_watch_hero.jpg'}
                                alt={p.name}
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).src = '/assets/luxury_watch_hero.jpg';
                                }}
                                className="w-10 h-10 rounded-lg object-cover"
                              />
                              <div>
                                <span className="font-bold text-white block">{p.name}</span>
                                <span className="text-gray-400 font-mono">{p.sku}</span>
                              </div>
                            </div>
                            <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 font-bold">
                              باقي: {p.stock} حبات
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400">
                        جميع الساعات والإكسسوارات تتوفر بكميات كافية في المستودع.
                      </p>
                    )}
                  </div>

                  {/* Quick Order Status Breakdown */}
                  <div className="p-6 rounded-2xl bg-[#151822] border border-white/5 space-y-4">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-[#c5a869]" />
                      <span>توزيع حالات الطلبات الحالية</span>
                    </h3>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-[#1b1f2c] border border-white/5 flex justify-between">
                        <span className="text-amber-400 font-bold">جديد (قيد الانتظار):</span>
                        <span className="font-mono font-bold text-white">{statsNewOrdersCount}</span>
                      </div>
                      <div className="p-3 rounded-xl bg-[#1b1f2c] border border-white/5 flex justify-between">
                        <span className="text-indigo-400 font-bold">تم التأكيد / قيد التجهيز:</span>
                        <span className="font-mono font-bold text-white">{statsConfirmedOrdersCount}</span>
                      </div>
                      <div className="p-3 rounded-xl bg-[#1b1f2c] border border-white/5 flex justify-between">
                        <span className="text-cyan-400 font-bold">تم الشحن مع الموزع:</span>
                        <span className="font-mono font-bold text-white">{statsShippedOrdersCount}</span>
                      </div>
                      <div className="p-3 rounded-xl bg-[#1b1f2c] border border-white/5 flex justify-between">
                        <span className="text-emerald-400 font-bold">تم التسليم النهائي:</span>
                        <span className="font-mono font-bold text-white">{statsDeliveredOrdersCount}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ================= TAB: PRODUCT STATS (إحصائيات المنتج) ================= */}
            {activeTab === 'product_stats' && (
              <div className="space-y-6">
                {!selectedProductStats ? (
                  <div className="p-12 text-center rounded-3xl bg-[#151822] border border-white/5 space-y-3">
                    <BarChart3 className="w-12 h-12 text-[#c5a869] mx-auto" />
                    <h3 className="text-lg font-bold text-white">لا توجد منتجات في المتجر حالياً</h3>
                    <p className="text-xs text-gray-400">أضف منتجاً واحداً على الأقل لعرض إحصائياته وتحليل أدائه.</p>
                  </div>
                ) : (
                  <>
                    {/* Date Range Filter Bar for Product Analytics */}
                    {(() => {
                      const presets: Array<{
                        id: 'all' | 'today' | 'yesterday' | 'last7' | 'thisMonth' | 'last30';
                        label: string;
                      }> = [
                        { id: 'all', label: 'كل الفترات' },
                        { id: 'today', label: 'اليوم' },
                        { id: 'yesterday', label: 'أمس' },
                        { id: 'last7', label: 'آخر 7 أيام' },
                        { id: 'thisMonth', label: 'هذا الشهر' },
                        { id: 'last30', label: 'آخر 30 يوماً' },
                      ];
                      const isFiltered = Boolean(productStatsDateFrom || productStatsDateTo);

                      return (
                        <div className="p-4 sm:p-5 rounded-2xl bg-[#151822] border border-[#c5a869]/25 shadow-lg space-y-3">
                          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-9 h-9 rounded-xl bg-[#c5a869]/15 border border-[#c5a869]/30 text-[#c5a869] flex items-center justify-center flex-shrink-0">
                                <Calendar className="w-4 h-4" />
                              </div>
                              <div>
                                <h3 className="text-sm font-black text-white">تصفية إحصائيات المنتج حسب التاريخ</h3>
                                <p className="text-[11px] text-gray-400">
                                  {isFiltered
                                    ? `احتساب إحصائيات المنتج والأرباح الصافية من ${productStatsFilteredOrders.length} طلب في الفترة المختارة`
                                    : `احتساب إحصائيات المنتج من جميع الطلبات (${orders.length} طلب)`}
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-1.5">
                              {presets.map((p) => {
                                const r = getDatePresetRange(p.id);
                                const active = productStatsDateFrom === r.from && productStatsDateTo === r.to;
                                return (
                                  <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => {
                                      setProductStatsDateFrom(r.from);
                                      setProductStatsDateTo(r.to);
                                    }}
                                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition cursor-pointer ${
                                      active
                                        ? 'bg-[#c5a869] text-black font-black shadow'
                                        : 'bg-[#10131c] text-gray-300 border border-white/10 hover:border-[#c5a869]/40 hover:text-white'
                                    }`}
                                  >
                                    {p.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-end gap-3 pt-3 border-t border-white/5">
                            <div>
                              <label className="block text-[11px] font-bold text-gray-300 mb-1">من تاريخ:</label>
                              <input
                                type="date"
                                value={productStatsDateFrom}
                                onChange={(e) => setProductStatsDateFrom(e.target.value)}
                                className="bg-[#10131c] border border-white/15 focus:border-[#c5a869] rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none [color-scheme:dark]"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-gray-300 mb-1">إلى تاريخ:</label>
                              <input
                                type="date"
                                value={productStatsDateTo}
                                onChange={(e) => setProductStatsDateTo(e.target.value)}
                                className="bg-[#10131c] border border-white/15 focus:border-[#c5a869] rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none [color-scheme:dark]"
                              />
                            </div>

                            {isFiltered && (
                              <button
                                type="button"
                                onClick={() => {
                                  setProductStatsDateFrom('');
                                  setProductStatsDateTo('');
                                }}
                                className="px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>إعادة ضبط التاريخ</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Product Picker & Snapshot Card */}
                    <div className="p-5 rounded-2xl bg-gradient-to-r from-[#1c1810] via-[#171923] to-[#151822] border border-[#c5a869]/30 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-xl">
                      <div className="flex items-center gap-4">
                        <img
                          src={selectedProductStats.product.images[0] || '/assets/luxury_watch_hero.jpg'}
                          alt={selectedProductStats.product.name}
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = '/assets/luxury_watch_hero.jpg';
                          }}
                          className="w-16 h-16 rounded-2xl object-cover border border-[#c5a869]/40 flex-shrink-0"
                        />
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-extrabold text-white">
                              تحليل المنتج: {selectedProductStats.product.name}
                            </h3>
                            <span className="px-2 py-0.5 rounded-md bg-white/10 text-gray-300 font-mono text-[10px]">
                              {selectedProductStats.product.sku}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-300">
                            <span>
                              السعر: <strong className="text-[#c5a869]">{formatPrice(selectedProductStats.product.price)}</strong>
                            </span>
                            <span>•</span>
                            <span>
                              المخزون الحالي:{' '}
                              <strong className={selectedProductStats.product.stock <= 5 ? 'text-amber-400' : 'text-emerald-400'}>
                                {selectedProductStats.product.stock} قطعة
                              </strong>
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                              <strong>{selectedProductStats.avgRating}</strong>
                              <span className="text-gray-400">({selectedProductStats.reviewCount} تقييم)</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div ref={analyticsPickerRef} className="w-full lg:w-96 relative z-30">
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-[11px] font-bold text-[#c5a869]">
                            اختر المنتج المراد تحليله:
                          </label>
                          <span className="text-[10px] text-gray-400 font-semibold">
                            ({filteredAnalyticsProducts.length} / {products.length} ساعة)
                          </span>
                        </div>

                        {/* Search input + Dropdown Toggle */}
                        <div className="flex items-center gap-1.5">
                          <div className="relative flex-1">
                            <Search className="w-3.5 h-3.5 text-[#c5a869] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                              type="text"
                              value={analyticsProductSearch}
                              onFocus={() => setIsAnalyticsProductDropdownOpen(true)}
                              onChange={(e) => {
                                setAnalyticsProductSearch(e.target.value);
                                setIsAnalyticsProductDropdownOpen(true);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Escape') {
                                  setIsAnalyticsProductDropdownOpen(false);
                                } else if (e.key === 'Enter' && filteredAnalyticsProducts.length > 0) {
                                  e.preventDefault();
                                  setSelectedAnalyticsProductId(filteredAnalyticsProducts[0].id);
                                  setIsAnalyticsProductDropdownOpen(false);
                                }
                              }}
                              placeholder="ابحث باسم الساعة أو الرمز (SKU)..."
                              className="w-full bg-[#10131c] border border-[#c5a869]/40 rounded-xl pr-9 pl-8 py-2.5 text-xs font-bold text-white placeholder-gray-400 focus:outline-none focus:border-[#c5a869]"
                            />
                            {analyticsProductSearch && (
                              <button
                                type="button"
                                onClick={() => {
                                  setAnalyticsProductSearch('');
                                  setIsAnalyticsProductDropdownOpen(true);
                                }}
                                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white cursor-pointer"
                                title="مسح البحث"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => setIsAnalyticsProductDropdownOpen((prev) => !prev)}
                            className="px-3 py-2.5 rounded-xl bg-[#10131c] border border-[#c5a869]/40 hover:border-[#c5a869] text-[#c5a869] flex items-center gap-1 text-xs font-bold transition cursor-pointer flex-shrink-0"
                            title="عرض قائمة الساعات"
                          >
                            <ChevronDown
                              className={`w-4 h-4 transition-transform duration-150 ${
                                isAnalyticsProductDropdownOpen ? 'rotate-180' : ''
                              }`}
                            />
                          </button>
                        </div>

                        {/* Searchable Dropdown List */}
                        {isAnalyticsProductDropdownOpen && (
                          <div className="absolute right-0 left-0 mt-1.5 rounded-2xl bg-[#10131c] border border-[#c5a869]/50 shadow-2xl overflow-hidden max-h-72 overflow-y-auto divide-y divide-white/5">
                            {filteredAnalyticsProducts.length === 0 ? (
                              <div className="p-4 text-center text-xs text-gray-400">
                                لا توجد أي ساعة مطابقة للبحث «{analyticsProductSearch}»
                              </div>
                            ) : (
                              filteredAnalyticsProducts.map((p) => {
                                const count = analyticsProductOrderCounts[p.id] || 0;
                                const isSelected = p.id === selectedProductStats.product.id;
                                return (
                                  <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => {
                                      setSelectedAnalyticsProductId(p.id);
                                      setIsAnalyticsProductDropdownOpen(false);
                                    }}
                                    className={`w-full flex items-center justify-between gap-2.5 px-3 py-2.5 text-right transition cursor-pointer ${
                                      isSelected
                                        ? 'bg-[#c5a869]/20 text-white'
                                        : 'hover:bg-white/5 text-gray-200'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <img
                                        src={p.images?.[0] || '/assets/luxury_watch_hero.jpg'}
                                        alt={p.name}
                                        loading="lazy"
                                        onError={(e) => {
                                          (e.currentTarget as HTMLImageElement).src =
                                            '/assets/luxury_watch_hero.jpg';
                                        }}
                                        className="w-9 h-9 rounded-lg object-cover border border-white/10 flex-shrink-0"
                                      />
                                      <div className="min-w-0">
                                        <div className="text-xs font-bold truncate">{p.name}</div>
                                        <div className="flex items-center gap-2 text-[10px] text-gray-400">
                                          <span className="font-mono">{p.sku}</span>
                                          <span>•</span>
                                          <span className="text-[#c5a869] font-bold">
                                            {formatPrice(p.price)}
                                          </span>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-1.5 flex-shrink-0">
                                      <span
                                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                          count > 0
                                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                            : 'bg-white/5 text-gray-400 border border-white/10'
                                        }`}
                                      >
                                        {count} طلب
                                      </span>
                                      {isSelected && <Check className="w-3.5 h-3.5 text-[#c5a869]" />}
                                    </div>
                                  </button>
                                );
                              })
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Wholesale Purchase Cost, Shipping Cost Per Order & Net Profit Calculator */}
                    <div className="p-5 rounded-2xl bg-[#151822] border border-[#c5a869]/30 shadow-lg space-y-4">
                      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
                        <div className="space-y-1">
                          <h4 className="text-sm font-black text-white flex items-center gap-2">
                            <Tag className="w-4 h-4 text-[#c5a869]" />
                            <span>سعر الجملة ومصاريف الشحن وحساب الربح الصافي</span>
                          </h4>
                          <p className="text-xs text-gray-400">
                            أدخل تكلفة شراء الحبة بالجملة ومصاريف الشحن لكل طلبية لحساب إجمالي التكاليف والربح الصافي تلقائياً من الطلبات المسلمة والنشطة.
                          </p>
                        </div>

                        <div className="flex flex-wrap items-end gap-2.5">
                          <div>
                            <label className="block text-[11px] font-bold text-gray-300 mb-1">
                              سعر الشراء بالجملة (للحبة)
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                min="0"
                                step="any"
                                value={wholesalePriceInput}
                                onChange={(e) => setWholesalePriceInput(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleSaveWholesalePrice();
                                  }
                                }}
                                placeholder="سعر الجملة للحبة..."
                                className="w-44 bg-[#10131c] border border-[#c5a869]/40 rounded-xl pr-3.5 pl-12 py-2.5 text-sm font-black text-white placeholder-gray-500 focus:outline-none focus:border-[#c5a869]"
                              />
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-[#c5a869]">
                                د.م
                              </span>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-gray-300 mb-1">
                              مصاريف الشحن (لكل طلبية)
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                min="0"
                                step="any"
                                value={shippingCostInput}
                                onChange={(e) => setShippingCostInput(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleSaveWholesalePrice();
                                  }
                                }}
                                placeholder="شحن الطلبية..."
                                className="w-44 bg-[#10131c] border border-[#c5a869]/40 rounded-xl pr-3.5 pl-12 py-2.5 text-sm font-black text-white placeholder-gray-500 focus:outline-none focus:border-[#c5a869]"
                              />
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-[#c5a869]">
                                د.م
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={handleSaveWholesalePrice}
                            disabled={isSavingWholesalePrice}
                            className="px-4 py-2.5 rounded-xl bg-[#c5a869] hover:bg-[#d5b879] disabled:opacity-60 text-black text-xs font-black flex items-center gap-1.5 transition cursor-pointer"
                          >
                            {isSavingWholesalePrice ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Save className="w-3.5 h-3.5" />
                            )}
                            <span>حفظ التكاليف وحساب الربح</span>
                          </button>

                          {(Number(selectedProductStats.product.wholesalePrice) || 0) !==
                            selectedProductStats.wholesalePrice ||
                          (Number(selectedProductStats.product.shippingCostPerOrder) || 0) !==
                            selectedProductStats.shippingCostPerOrder ? (
                            <span className="px-2.5 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-bold">
                              معاينة فورية (غير محفوظ)
                            </span>
                          ) : selectedProductStats.wholesalePrice > 0 ||
                            selectedProductStats.shippingCostPerOrder > 0 ? (
                            <span className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold">
                              ✓ محفوظ في النظام
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-white/5">
                        <div className="p-3.5 rounded-xl bg-[#10131c] border border-white/5 space-y-1">
                          <span className="text-[11px] text-gray-400 block">تكلفة الحبة + الشحن / صافي الطلب</span>
                          <div className="text-base font-black text-white">
                            {selectedProductStats.wholesalePrice > 0 ||
                            selectedProductStats.shippingCostPerOrder > 0
                              ? `${formatPrice(selectedProductStats.wholesalePrice)} + ${formatPrice(selectedProductStats.shippingCostPerOrder)} شحن`
                              : 'لم يُحدد بعد'}
                          </div>
                          <span
                            className={`text-[11px] font-bold block ${
                              selectedProductStats.unitProfitMargin >= 0 ? 'text-[#c5a869]' : 'text-rose-400'
                            }`}
                          >
                            صافي طلب الحبة الواحدة: {selectedProductStats.unitProfitMargin >= 0 ? '+' : ''}
                            {formatPrice(selectedProductStats.unitProfitMargin)}
                          </span>
                        </div>

                        <div className="p-3.5 rounded-xl bg-[#10131c] border border-white/5 space-y-1">
                          <span className="text-[11px] text-gray-400 block">
                            إجمالي التكاليف (الطلبات المسلمة)
                          </span>
                          <div className="text-lg font-black text-amber-300">
                            {formatPrice(selectedProductStats.totalDeliveredCost)}
                          </div>
                          <span className="text-[11px] text-gray-400 block leading-relaxed">
                            جملة ({selectedProductStats.deliveredUnits} قطعة): {formatPrice(selectedProductStats.deliveredCost)}
                            {' • '}
                            شحن ({selectedProductStats.deliveredCount} طلب × {formatPrice(selectedProductStats.shippingCostPerOrder)}):{' '}
                            {formatPrice(selectedProductStats.deliveredShippingCost)}
                          </span>
                        </div>

                        <div
                          className={`p-3.5 rounded-xl border space-y-1 ${
                            selectedProductStats.netDeliveredProfit >= 0
                              ? 'bg-emerald-950/40 border-emerald-500/35'
                              : 'bg-rose-950/40 border-rose-500/35'
                          }`}
                        >
                          <span className="text-[11px] text-gray-200 font-bold block">
                            الربح الصافي المحقق (المسلم)
                          </span>
                          <div
                            className={`text-xl font-black ${
                              selectedProductStats.netDeliveredProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {formatPrice(selectedProductStats.netDeliveredProfit)}
                          </div>
                          <span className="text-[11px] text-gray-300 block">
                            هامش الربح الصافي:{' '}
                            <strong
                              className={
                                selectedProductStats.profitMarginPercent >= 0
                                  ? 'text-emerald-300'
                                  : 'text-rose-300'
                              }
                            >
                              {selectedProductStats.profitMarginPercent}%
                            </strong>
                          </span>
                        </div>

                        <div className="p-3.5 rounded-xl bg-[#10131c] border border-cyan-500/25 space-y-1">
                          <span className="text-[11px] text-gray-300 font-bold block">
                            الربح الصافي المتوقع (النشط)
                          </span>
                          <div
                            className={`text-lg font-black ${
                              selectedProductStats.expectedNetProfit >= 0 ? 'text-cyan-400' : 'text-rose-400'
                            }`}
                          >
                            {formatPrice(selectedProductStats.expectedNetProfit)}
                          </div>
                          <span className="text-[11px] text-gray-400 block">
                            بعد خصم جملة {selectedProductStats.activeUnits} قطعة وشحن {selectedProductStats.activeOrdersCount} طلب غير ملغى
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Winning Product Verdict Banner */}
                    <div
                      className={`p-5 rounded-2xl border shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                        selectedProductStats.verdict === 'winner'
                          ? 'bg-gradient-to-r from-emerald-950/70 via-[#11241b] to-[#151822] border-emerald-500/40'
                          : selectedProductStats.verdict === 'promising'
                          ? 'bg-gradient-to-r from-cyan-950/70 via-[#10202b] to-[#151822] border-cyan-500/40'
                          : selectedProductStats.verdict === 'review'
                          ? 'bg-gradient-to-r from-rose-950/70 via-[#26121a] to-[#151822] border-rose-500/40'
                          : 'bg-[#151822] border-white/10'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span className="text-xs font-bold text-gray-300">تقييم الذكاء التجاري (هل المنتج رابح؟):</span>
                          {selectedProductStats.verdict === 'winner' && (
                            <span className="px-3 py-1 rounded-full bg-emerald-500 text-black text-xs font-black">
                              🔥 منتج رابح ممتاز (Winning Product)
                            </span>
                          )}
                          {selectedProductStats.verdict === 'promising' && (
                            <span className="px-3 py-1 rounded-full bg-cyan-500 text-black text-xs font-black">
                              📈 منتج واعد وقابل للتوسيع
                            </span>
                          )}
                          {selectedProductStats.verdict === 'review' && (
                            <span className="px-3 py-1 rounded-full bg-rose-500 text-white text-xs font-black">
                              ⚠️ يحتاج مراجعة (نسبة إلغاء/مرتجع مرتفعة)
                            </span>
                          )}
                          {selectedProductStats.verdict === 'insufficient' && (
                            <span className="px-3 py-1 rounded-full bg-white/10 text-gray-200 text-xs font-bold">
                              ⏳ لا توجد طلبات مسجلة بعد لهذا المنتج
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-300 leading-relaxed">
                          {selectedProductStats.verdict === 'winner'
                            ? `هذا المنتج يحقق أداءً قوياً بمعدل تسليم ${selectedProductStats.deliveryRate}% ومتوسط ${selectedProductStats.avgUnitsPerOrder} قطعة لكل طلب، بمبيعات محصلة ${formatPrice(selectedProductStats.deliveredRevenue)} وربح صافي ${formatPrice(selectedProductStats.netDeliveredProfit)}. يُنصح بزيادة الميزانية الإعلانية وتوفير المخزون.`
                            : selectedProductStats.verdict === 'promising'
                            ? `المنتج يسجل تفاعلاً جيداً (${selectedProductStats.totalOrders} طلب / ${selectedProductStats.totalUnits} قطعة) بمعدل تأكيد ${selectedProductStats.confirmationRate}%. استمر في متابعة الطلبات المشحونة لتقييم نسبة التسليم النهائية.`
                            : selectedProductStats.verdict === 'review'
                            ? `نسبة الإلغاء والمرتجع مرتفعة (${selectedProductStats.cancelReturnRate}%). يُنصح بمراجعة السعر، جودة الإعلان، أو تأكيد الطلبات هاتفياً قبل الشحن.`
                            : 'بمجرد تسجيل أولى الطلبات لهذا المنتج ستظهر هنا نسبة التأكيد، نسبة التوصيل، الألوان والمدن الأكثر مبيعاً.'}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 flex-shrink-0 bg-black/30 px-4 py-3 rounded-xl border border-white/10">
                        <div className="text-center">
                          <span className="text-[10px] text-gray-400 block">الإيراد المحصل (COD)</span>
                          <span className="text-base font-black text-white">
                            {formatPrice(selectedProductStats.deliveredRevenue)}
                          </span>
                        </div>
                        <div className="h-8 w-px bg-white/10" />
                        <div className="text-center">
                          <span className="text-[10px] text-gray-400 block">الربح الصافي المحقق</span>
                          <span
                            className={`text-base font-black ${
                              selectedProductStats.netDeliveredProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {formatPrice(selectedProductStats.netDeliveredProfit)}
                          </span>
                        </div>
                        <div className="h-8 w-px bg-white/10" />
                        <div className="text-center">
                          <span className="text-[10px] text-gray-400 block">إجمالي قيمة الطلبات النشطة</span>
                          <span className="text-base font-black text-[#c5a869]">
                            {formatPrice(selectedProductStats.potentialRevenue)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 6 Isolated KPI Cards for the Selected Product */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                      <div className="p-4 rounded-2xl bg-gradient-to-b from-[#c5a869]/10 to-[#151822] border border-[#c5a869]/25 space-y-2">
                        <span className="text-[11px] font-bold text-gray-300 block">إجمالي الطلبات</span>
                        <div className="text-2xl font-black text-white">
                          {selectedProductStats.totalOrders} <span className="text-xs text-gray-400 font-bold">طلب</span>
                        </div>
                        <span className="text-[11px] text-[#c5a869] block">
                          مجموع القطع المطلوبة: {selectedProductStats.totalUnits}
                        </span>
                      </div>

                      <div className="p-4 rounded-2xl bg-gradient-to-b from-amber-500/10 to-[#151822] border border-amber-500/25 space-y-2">
                        <span className="text-[11px] font-bold text-gray-300 block">طلبات جديدة / للتأكيد</span>
                        <div className="text-2xl font-black text-amber-400">
                          {selectedProductStats.newCount + selectedProductStats.confirmedPendingPrepCount}{' '}
                          <span className="text-xs text-amber-300/80 font-bold">طلب</span>
                        </div>
                        <span className="text-[11px] text-gray-400 block">
                          نسبة التأكيد: {selectedProductStats.confirmationRate}%
                        </span>
                      </div>

                      <div className="p-4 rounded-2xl bg-gradient-to-b from-purple-500/10 to-[#151822] border border-purple-500/25 space-y-2">
                        <span className="text-[11px] font-bold text-gray-300 block">قيد التجهيز</span>
                        <div className="text-2xl font-black text-purple-400">
                          {selectedProductStats.preparingCount}{' '}
                          <span className="text-xs text-purple-300/80 font-bold">طلب</span>
                        </div>
                        <span className="text-[11px] text-gray-400 block">جاهزة للتحضير والشحن</span>
                      </div>

                      <div className="p-4 rounded-2xl bg-gradient-to-b from-cyan-500/10 to-[#151822] border border-cyan-500/25 space-y-2">
                        <span className="text-[11px] font-bold text-gray-300 block">تم الشحن</span>
                        <div className="text-2xl font-black text-cyan-400">
                          {selectedProductStats.shippedCount}{' '}
                          <span className="text-xs text-cyan-300/80 font-bold">طلب</span>
                        </div>
                        <span className="text-[11px] text-gray-400 block">في الطريق مع شركة التوصيل</span>
                      </div>

                      <div className="p-4 rounded-2xl bg-gradient-to-b from-emerald-500/10 to-[#151822] border border-emerald-500/25 space-y-2">
                        <span className="text-[11px] font-bold text-gray-300 block">تم التسليم بنجاح</span>
                        <div className="text-2xl font-black text-emerald-400">
                          {selectedProductStats.deliveredCount}{' '}
                          <span className="text-xs text-emerald-300/80 font-bold">طلب</span>
                        </div>
                        <span className="text-[11px] text-emerald-300 font-semibold block">
                          ({selectedProductStats.deliveredUnits} قطعة مسلمة)
                        </span>
                      </div>

                      <div className="p-4 rounded-2xl bg-gradient-to-b from-rose-500/10 to-[#151822] border border-rose-500/25 space-y-2">
                        <span className="text-[11px] font-bold text-gray-300 block">ملغاة أو مرتجعة</span>
                        <div className="text-2xl font-black text-rose-400">
                          {selectedProductStats.cancelledOrReturnedCount}{' '}
                          <span className="text-xs text-rose-300/80 font-bold">طلب</span>
                        </div>
                        <span className="text-[11px] text-gray-400 block">
                          {selectedProductStats.cancelledCount} ملغى | {selectedProductStats.returnedCount} مرتجع
                        </span>
                      </div>
                    </div>

                    {/* Rates + Top Colors + Top Cities */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Rates & Bundle Metrics */}
                      <div className="p-5 rounded-2xl bg-[#151822] border border-white/5 space-y-4">
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-[#c5a869]" />
                          <span>مؤشرات الأداء والربحية</span>
                        </h4>

                        <div className="space-y-3 text-xs">
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-gray-300">نسبة التوصيل الناجح (من المنتهية):</span>
                              <span className="font-black text-emerald-400">{selectedProductStats.deliveryRate}%</span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 rounded-full transition-all"
                                style={{ width: `${selectedProductStats.deliveryRate}%` }}
                              />
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-gray-300">نسبة التأكيد والانتقال للشحن:</span>
                              <span className="font-black text-cyan-400">{selectedProductStats.confirmationRate}%</span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                              <div
                                className="h-full bg-cyan-500 rounded-full transition-all"
                                style={{ width: `${selectedProductStats.confirmationRate}%` }}
                              />
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-gray-300">نسبة الإلغاء والمرتجع:</span>
                              <span className="font-black text-rose-400">{selectedProductStats.cancelReturnRate}%</span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                              <div
                                className="h-full bg-rose-500 rounded-full transition-all"
                                style={{ width: `${selectedProductStats.cancelReturnRate}%` }}
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
                            <div className="p-2.5 rounded-xl bg-white/5 text-center">
                              <span className="text-[10px] text-gray-400 block">متوسط القطع / طلب</span>
                              <span className="text-sm font-black text-white">{selectedProductStats.avgUnitsPerOrder}</span>
                            </div>
                            <div className="p-2.5 rounded-xl bg-white/5 text-center">
                              <span className="text-[10px] text-gray-400 block">طلبات الباقات (2+ قطعة)</span>
                              <span className="text-sm font-black text-[#c5a869]">{selectedProductStats.multiUnitOrders}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Top Colors Breakdown */}
                      <div className="p-5 rounded-2xl bg-[#151822] border border-white/5 space-y-4">
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          <Palette className="w-4 h-4 text-[#c5a869]" />
                          <span>الألوان الأكثر طلباً</span>
                        </h4>

                        {selectedProductStats.topColors.length === 0 ? (
                          <p className="text-xs text-gray-400">لا توجد بيانات ألوان مطلوبة بعد لهذا المنتج.</p>
                        ) : (
                          <div className="space-y-2.5 text-xs">
                            {selectedProductStats.topColors.map((item) => {
                              const pct =
                                selectedProductStats.totalUnits > 0
                                  ? Math.round((item.count / selectedProductStats.totalUnits) * 100)
                                  : 0;
                              return (
                                <div key={item.color} className="space-y-1">
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold text-gray-200">{item.color}</span>
                                    <span className="text-[#c5a869] font-mono font-bold">
                                      {item.count} قطعة ({pct}%)
                                    </span>
                                  </div>
                                  <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                                    <div
                                      className="h-full bg-[#c5a869] rounded-full"
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Top Cities Breakdown */}
                      <div className="p-5 rounded-2xl bg-[#151822] border border-white/5 space-y-4">
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          <Globe className="w-4 h-4 text-emerald-400" />
                          <span>المدن الأكثر طلباً للمنتج</span>
                        </h4>

                        {selectedProductStats.topCities.length === 0 ? (
                          <p className="text-xs text-gray-400">لا توجد طلبات مسجلة حسب المدن بعد.</p>
                        ) : (
                          <div className="space-y-2 text-xs max-h-56 overflow-y-auto pl-1">
                            {selectedProductStats.topCities.slice(0, 8).map((c) => (
                              <div
                                key={c.city}
                                className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5"
                              >
                                <span className="font-bold text-white truncate max-w-[160px]">{c.city}</span>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <span className="px-2 py-0.5 rounded-md bg-white/10 text-gray-200 font-bold text-[10px]">
                                    {c.total} طلب
                                  </span>
                                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">
                                    {c.delivered} مسلم
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* All Products Leaderboard Comparison */}
                    <div className="p-5 rounded-2xl bg-[#151822] border border-white/5 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          <BarChart3 className="w-4 h-4 text-[#c5a869]" />
                          <span>مقارنة سريعة بين جميع منتجات المتجر (انقر على أي منتج لتحليله)</span>
                        </h4>
                        <span className="text-[11px] text-gray-400">مرتبة حسب عدد الطلبات والمبيعات</span>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-right text-xs">
                          <thead className="bg-[#10121a] text-gray-400 border-b border-white/5">
                            <tr>
                              <th className="p-3">المنتج</th>
                              <th className="p-3">الطلبات</th>
                              <th className="p-3">القطع</th>
                              <th className="p-3">مسلم</th>
                              <th className="p-3">ملغى/مرتجع</th>
                              <th className="p-3">نسبة التسليم</th>
                              <th className="p-3">سعر الجملة</th>
                              <th className="p-3">مصاريف الشحن/طلب</th>
                              <th className="p-3">الإيراد المحصل</th>
                              <th className="p-3">الربح الصافي</th>
                              <th className="p-3">التقييم التجاري</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {allProductsAnalyticsList.map((row) => {
                              const isSelected = row.product.id === selectedProductStats.product.id;
                              const effectiveRowStats = isSelected ? selectedProductStats : row;
                              return (
                                <tr
                                  key={row.product.id}
                                  onClick={() => setSelectedAnalyticsProductId(row.product.id)}
                                  className={`cursor-pointer transition ${
                                    isSelected ? 'bg-[#c5a869]/15' : 'hover:bg-white/5'
                                  }`}
                                >
                                  <td className="p-3 font-bold text-white flex items-center gap-2.5">
                                    <img
                                      src={row.product.images[0] || '/assets/luxury_watch_hero.jpg'}
                                      alt={row.product.name}
                                      onError={(e) => {
                                        (e.currentTarget as HTMLImageElement).src = '/assets/luxury_watch_hero.jpg';
                                      }}
                                      className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
                                    />
                                    <span className="truncate max-w-[180px]">{row.product.name}</span>
                                  </td>
                                  <td className="p-3 font-mono font-bold text-white">{row.totalOrders}</td>
                                  <td className="p-3 font-mono text-gray-300">{row.totalUnits}</td>
                                  <td className="p-3 font-mono font-bold text-emerald-400">{row.deliveredCount}</td>
                                  <td className="p-3 font-mono font-bold text-rose-400">{row.cancelledOrReturnedCount}</td>
                                  <td className="p-3 font-mono font-bold text-cyan-400">
                                    {row.finalizedCount > 0 ? `${row.deliveryRate}%` : '—'}
                                  </td>
                                  <td className="p-3 font-bold text-amber-300">
                                    {effectiveRowStats.wholesalePrice > 0
                                      ? formatPrice(effectiveRowStats.wholesalePrice)
                                      : '—'}
                                  </td>
                                  <td className="p-3 font-bold text-orange-300">
                                    {effectiveRowStats.shippingCostPerOrder > 0
                                      ? formatPrice(effectiveRowStats.shippingCostPerOrder)
                                      : '—'}
                                  </td>
                                  <td className="p-3 font-bold text-white">
                                    {formatPrice(effectiveRowStats.deliveredRevenue)}
                                  </td>
                                  <td
                                    className={`p-3 font-black ${
                                      effectiveRowStats.netDeliveredProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                                    }`}
                                  >
                                    {formatPrice(effectiveRowStats.netDeliveredProfit)}
                                  </td>
                                  <td className="p-3">
                                    {row.verdict === 'winner' ? (
                                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                                        🔥 منتج رابح
                                      </span>
                                    ) : row.verdict === 'promising' ? (
                                      <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold">
                                        📈 واعد
                                      </span>
                                    ) : row.verdict === 'review' ? (
                                      <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold">
                                        ⚠️ مراجعة
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 rounded-full bg-white/5 text-gray-400 text-[10px]">
                                        لا طلبات بعد
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ================= TAB 2: ORDERS MANAGEMENT ================= */}
            {activeTab === 'orders' && (
              <div className="space-y-4">
                {/* Real-time New Orders WhatsApp Dispatcher Banner */}
                {orders.some((o) => o.status === 'جديد' && !o.whatsappSent) && (
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-[#102319] to-[#151822] border border-emerald-500/40 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center flex-shrink-0 animate-pulse">
                        <MessageCircle className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 border border-emerald-500/50 text-xs font-black">
                            تنبيه طلبات جديدة ({orders.filter((o) => o.status === 'جديد' && !o.whatsappSent).length})
                          </span>
                          <span className="text-[11px] text-gray-300 hidden sm:inline">أرسل رسالة التأكيد للزبون بنقرة واحدة</span>
                        </div>
                        <p className="text-xs font-semibold text-gray-200 mt-1">
                          تحتوي الرسالة على تفاصيل الساعة والألوان ومبلغ الدفع عند الاستلام مع رابط فوري للزبون لتأكيد شحن الطلب أو إلغائه.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                      {orders
                        .filter((o) => o.status === 'جديد' && !o.whatsappSent)
                        .slice(0, 3)
                        .map((pOrd) => (
                          <button
                            key={pOrd.id}
                            onClick={() => handleSendCustomerWhatsApp(pOrd)}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md hover:shadow-emerald-500/20 transition whitespace-nowrap cursor-pointer"
                            title={`إرسال رسالة وتساب للزبون ${pOrd.customerName}`}
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>تأكيد {pOrd.customerName.split(' ')[0]} ({pOrd.orderNumber})</span>
                          </button>
                        ))}
                    </div>
                  </div>
                )}

                {/* Search & Filters */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#151822] border border-white/5">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={orderSearch}
                      onChange={(e) => setOrderSearch(e.target.value)}
                      placeholder="بحث برقم الطلب، اسم العميل، الهاتف، المدينة، العنوان أو اسم المنتج..."
                      className="w-full bg-[#1b1f2c] border border-white/10 rounded-xl py-2.5 pr-10 pl-9 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-[#c5a869]"
                    />
                    <Search className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                    {orderSearch && (
                      <button
                        type="button"
                        onClick={() => setOrderSearch('')}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition cursor-pointer"
                        title="مسح البحث"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <select
                      value={orderStatusFilter}
                      onChange={(e) => setOrderStatusFilter(e.target.value)}
                      className="bg-[#1b1f2c] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    >
                      <option value="all">جميع الحالات ({orders.length})</option>
                      <option value="جديد">جديد</option>
                      <option value="قيد التأكيد">قيد التأكيد</option>
                      <option value="تم التأكيد">تم التأكيد</option>
                      <option value="قيد التجهيز">قيد التجهيز</option>
                      <option value="تم الشحن">تم الشحن</option>
                      <option value="تم التسليم">تم التسليم</option>
                      <option value="ملغى">ملغى</option>
                      <option value="مرتجع">مرتجع</option>
                    </select>

                    <button
                      type="button"
                      onClick={handleExportCSV}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-gray-300 border border-white/10 transition cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>تصدير CSV</span>
                    </button>

                    {orders.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          if (
                            window.confirm(
                              'هل أنت متأكد من رغبتك في حذف كافة الطلبات الحالية نهائياً؟ لن تعود بعد ذلك أبداً.'
                            )
                          ) {
                            clearAllOrders();
                          }
                        }}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold transition cursor-pointer"
                        title="حذف جميع الطلبات نهائياً"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>مسح الكل</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Orders Table */}
                <div className="rounded-2xl bg-[#151822] border border-white/5 overflow-hidden shadow-xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-[#10121a] text-gray-400 border-b border-white/5 font-semibold">
                        <tr>
                          <th className="p-3.5">رقم الطلب</th>
                          <th className="p-3.5">العميل والهاتف</th>
                          <th className="p-3.5">المدينة</th>
                          <th className="p-3.5">المنتجات المطلوبة</th>
                          <th className="p-3.5">المبلغ الإجمالي</th>
                          <th className="p-3.5">حالة الطلب والتأكيد</th>
                          <th className="p-3.5 text-center">إجراءات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {filteredOrders.length > 0 ? (
                          filteredOrders.map((ord) => {
                            const statusColor = STATUS_COLORS[ord.status] || {
                              bg: 'bg-white/5',
                              text: 'text-white',
                              border: 'border-white/10',
                            };

                            return (
                              <tr key={ord.id} className="hover:bg-white/5 transition">
                                <td className="p-3.5">
                                  <span className="font-mono font-bold text-[#c5a869]">
                                    {ord.orderNumber}
                                  </span>
                                  <span className="block text-[10px] text-gray-500">
                                    {new Date(ord.date).toLocaleDateString('ar-MA')}
                                  </span>
                                </td>

                                <td className="p-3.5">
                                  <span className="font-bold text-white block">{ord.customerName}</span>
                                  <a
                                    href={`tel:${ord.phone}`}
                                    className="font-mono text-gray-400 hover:text-[#c5a869] text-[11px]"
                                    dir="ltr"
                                  >
                                    {ord.phone}
                                  </a>
                                </td>

                                <td className="p-3.5">
                                  <span className="text-gray-200">{ord.city}</span>
                                  <span className="block text-[10px] text-gray-500 truncate max-w-[140px]">
                                    {ord.address}
                                  </span>
                                </td>

                                <td className="p-3.5">
                                  {ord.items.map((it, idx) => (
                                    <div key={idx} className="text-gray-300">
                                      {it.name.slice(0, 22)}... ({it.color}) &times; {it.quantity}
                                    </div>
                                  ))}
                                </td>

                                <td className="p-3.5 font-bold text-emerald-400">
                                  {formatPrice(ord.totalAmount)}
                                </td>

                                <td className="p-3.5">
                                  <div className="space-y-1">
                                    <select
                                      value={ord.status}
                                      onChange={(e) =>
                                        updateOrderStatus(ord.id, e.target.value as OrderStatus)
                                      }
                                      className={`px-2.5 py-1 rounded-full text-xs font-bold border ${statusColor.bg} ${statusColor.text} ${statusColor.border} focus:outline-none cursor-pointer bg-[#151822]`}
                                    >
                                      <option value="جديد">جديد</option>
                                      <option value="قيد التأكيد">قيد التأكيد</option>
                                      <option value="تم التأكيد">تم التأكيد</option>
                                      <option value="قيد التجهيز">قيد التجهيز</option>
                                      <option value="تم الشحن">تم الشحن</option>
                                      <option value="تم التسليم">تم التسليم</option>
                                      <option value="ملغى">ملغى</option>
                                      <option value="مرتجع">مرتجع</option>
                                    </select>

                                    {/* WhatsApp & Customer Action Tag */}
                                    <div>
                                      {ord.customerAction === 'confirmed' ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                                          <CheckCircle2 className="w-3 h-3" /> أكده الزبون
                                        </span>
                                      ) : ord.customerAction === 'cancelled' ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-bold">
                                          <XCircle className="w-3 h-3" /> ألغاه الزبون
                                        </span>
                                      ) : ord.whatsappSent ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-medium">
                                          <CheckCheck className="w-3 h-3" /> تم إرسال وتساب
                                        </span>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => handleSendCustomerWhatsApp(ord)}
                                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/20 hover:bg-emerald-600 text-amber-300 hover:text-white border border-amber-500/40 text-[10px] font-bold transition cursor-pointer"
                                          title="انقر لإرسال رسالة وتساب للزبون لتأكيد أو إلغاء الطلب"
                                        >
                                          <Send className="w-2.5 h-2.5" /> إرسال وتساب
                                        </button>
                                      )}
                                    </div>
                                    {/* Auto-prepare instant transition hint for any pending confirmed orders */}
                                    {ord.status === 'تم التأكيد' && (
                                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-300 border border-purple-500/30 text-[10px] font-semibold">
                                        <Clock className="w-3 h-3 animate-spin" />
                                        <span>جاري نقله فوراً لقيد التجهيز...</span>
                                      </div>
                                    )}
                                  </div>
                                </td>

                                <td className="p-3.5">
                                  <div className="flex items-center justify-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => handleSendCustomerWhatsApp(ord)}
                                      className={`p-1.5 rounded-lg border transition cursor-pointer ${
                                        ord.whatsappSent
                                          ? 'bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-400 border-emerald-500/30'
                                          : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400 shadow-md animate-pulse'
                                      }`}
                                      title="إرسال رسالة تأكيد الطلب للزبون عبر واتساب"
                                    >
                                      <MessageCircle className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setSelectedOrder(ord)}
                                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 cursor-pointer"
                                      title="عرض التفاصيل"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setPrintingOrder(ord)}
                                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#c5a869] cursor-pointer"
                                      title="عرض وطباعة شهادة الضمان الرسمية (سنة كاملة)"
                                    >
                                      <Printer className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (
                                          window.confirm(
                                            `هل أنت متأكد من حذف الطلب ${ord.orderNumber} نهائياً الخاص بـ "${ord.customerName}"؟`
                                          )
                                        ) {
                                          deleteOrder(ord.id);
                                        }
                                      }}
                                      className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-rose-400 cursor-pointer"
                                      title="حذف الطلب"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={7} className="p-8 text-center text-gray-400">
                              لا توجد طلبات مطابقة لخيارات البحث
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ================= TAB: NEW ORDERS (طلبات جديدة) ================= */}
            {activeTab === 'new_orders' && (
              <div className="space-y-4">
                {/* Header Card */}
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-950/70 via-[#102319] to-[#151822] border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center flex-shrink-0">
                      <Clock className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-extrabold text-white">طلبات جديدة (صندوق الطلبات الواردة)</h3>
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                          {newOrders.length} طلبات جديدة
                        </span>
                      </div>
                      <p className="text-xs text-gray-300 mt-1">
                        أرسل رسالة التأكيد للزبون عبر واتساب بنقرة واحدة. بمجرد تأكيد الطلب (سواء من طرف الزبون أو من طرفك)، يُحذف الطلب تلقائياً من هنا ويستقر في «إدارة الطلبات».
                      </p>
                    </div>
                  </div>

                  {newOrders.length > 0 && (
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => {
                          newOrders.forEach((o, i) => {
                            setTimeout(() => {
                              handleSendCustomerWhatsApp(o);
                            }, i * 600);
                          });
                        }}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg transition cursor-pointer"
                        title="إرسال رسائل الواتساب للطلبات الجديدة تباعاً"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>إرسال وتساب للجميع ({newOrders.length})</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Search Bar for New Orders */}
                {newOrders.length > 0 && (
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#151822] border border-emerald-500/20">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={newOrdersSearch}
                        onChange={(e) => setNewOrdersSearch(e.target.value)}
                        placeholder="بحث سريع في الطلبات الجديدة (رقم الطلب، الاسم، الهاتف، المدينة، العنوان، أو المنتج)..."
                        className="w-full bg-[#1b1f2c] border border-white/10 rounded-xl py-2.5 pr-10 pl-9 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500"
                      />
                      <Search className="w-4 h-4 text-emerald-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                      {newOrdersSearch && (
                        <button
                          type="button"
                          onClick={() => setNewOrdersSearch('')}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition cursor-pointer"
                          title="مسح البحث"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="text-[11px] text-gray-300 font-semibold px-2 whitespace-nowrap">
                      عرض <strong className="text-emerald-400">{filteredNewOrders.length}</strong> من {newOrders.length}
                    </div>
                  </div>
                )}

                {/* Empty State */}
                {newOrders.length === 0 ? (
                  <div className="p-12 text-center rounded-3xl bg-[#151822] border border-white/5 space-y-4">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-inner">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-lg font-bold text-white">لا توجد أي طلبات جديدة معلقة حالياً</h4>
                      <p className="text-xs text-gray-400 max-w-md mx-auto leading-relaxed">
                        رائع! تم تأكيد ومعالجة جميع الطلبات السابقة بنجاح.
                        جميع الطلبات المؤكدة والجارية شحنها متوفرة ومحفوظة بالكامل في قسم <strong className="text-[#c5a869]">«إدارة الطلبات»</strong>.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('orders')}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl gold-gradient-bg text-black font-bold text-xs shadow-md transition cursor-pointer"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>الانتقال إلى إدارة الطلبات ({orders.length})</span>
                    </button>
                  </div>
                ) : filteredNewOrders.length === 0 ? (
                  <div className="p-10 text-center rounded-3xl bg-[#151822] border border-white/5 space-y-3">
                    <Search className="w-10 h-10 text-gray-500 mx-auto" />
                    <p className="text-sm font-bold text-white">لا توجد طلبات جديدة مطابقة لعبارة البحث "{newOrdersSearch}"</p>
                    <button
                      type="button"
                      onClick={() => setNewOrdersSearch('')}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>مسح البحث</span>
                    </button>
                  </div>
                ) : (
                  /* List of New Orders */
                  <div className="grid grid-cols-1 gap-4">
                    {filteredNewOrders.map((ord) => (
                      <div
                        key={ord.id}
                        className="p-5 rounded-2xl bg-[#151822] border border-white/10 hover:border-emerald-500/40 transition shadow-xl space-y-4 text-right"
                      >
                        {/* Top row: Order Number, Date, and Badges */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-mono font-black text-[#c5a869]">
                              {ord.orderNumber}
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                              طلب جديد
                            </span>
                            {ord.whatsappSent ? (
                              <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-semibold flex items-center gap-1">
                                <CheckCheck className="w-3 h-3" /> تم إرسال وتساب
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold flex items-center gap-1">
                                <Clock className="w-3 h-3" /> ينتظر الإرسال
                              </span>
                            )}
                          </div>

                          <span className="text-xs text-gray-400 font-mono" dir="ltr">
                            {new Date(ord.date).toLocaleString('ar-MA')}
                          </span>
                        </div>

                        {/* Customer & Order details grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                          {/* Customer Box */}
                          <div className="p-3.5 rounded-xl bg-white/5 space-y-1.5">
                            <span className="text-gray-400 text-[10px] block font-semibold">بيانات الزبون:</span>
                            <div className="font-bold text-white text-sm">{ord.customerName}</div>
                            <div className="flex items-center gap-2">
                              <Phone className="w-3.5 h-3.5 text-[#c5a869]" />
                              <a
                                href={`tel:${ord.phone}`}
                                className="font-mono text-emerald-400 hover:underline font-bold text-xs"
                                dir="ltr"
                              >
                                {ord.phone}
                              </a>
                            </div>
                            <div className="text-gray-300">
                              <strong className="text-white">المدينة:</strong> {ord.city}
                            </div>
                            <div className="text-gray-400 text-[11px] truncate" title={ord.address}>
                              {ord.address}
                            </div>
                          </div>

                          {/* Items Box */}
                          <div className="p-3.5 rounded-xl bg-white/5 space-y-2 md:col-span-2 flex flex-col justify-between">
                            <div>
                              <span className="text-gray-400 text-[10px] block font-semibold mb-1">المنتجات المطلوبة:</span>
                              <div className="space-y-1.5">
                                {ord.items.map((it, idx) => (
                                  <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between text-gray-200 gap-1 pb-1.5 border-b border-white/5 last:border-0">
                                    <div className="flex items-center gap-2">
                                      <span className="w-5 h-5 rounded-md bg-white/10 text-white text-[10px] font-bold flex items-center justify-center">
                                        {it.quantity}x
                                      </span>
                                      <span className="font-semibold text-white">
                                        {it.name} {it.bundleLabel ? `[${it.bundleLabel}]` : ''}
                                      </span>
                                    </div>

                                    {/* Color badges */}
                                    <div className="text-gray-300 text-[11px]">
                                      {it.selectedColors && it.selectedColors.length > 1 ? (
                                        <div className="flex flex-wrap gap-1">
                                          {it.selectedColors.map((col, cIdx) => (
                                            <span key={cIdx} className="px-1.5 py-0.5 rounded bg-black/40 border border-white/10 text-gray-200 text-[10px]">
                                              ساعة {cIdx + 1}: <strong className="text-[#c5a869]">{col}</strong>
                                            </span>
                                          ))}
                                        </div>
                                      ) : (
                                        <span>اللون: <strong className="text-[#c5a869]">{it.color}</strong></span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {ord.notes && (
                              <div className="text-[11px] text-amber-300 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20 mt-1">
                                <strong>ملاحظة الزبون:</strong> {ord.notes}
                              </div>
                            )}

                            <div className="flex items-center justify-between pt-2 border-t border-white/5">
                              <span className="text-gray-400">المبلغ الواجب استلامه (COD):</span>
                              <span className="font-black text-emerald-400 text-sm">
                                {formatPrice(ord.totalAmount)} (توصيل مجاني)
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons Row */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/5">
                          {/* WhatsApp Confirmation Actions */}
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleSendCustomerWhatsApp(ord)}
                              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition cursor-pointer"
                              title="فتح محادثة واتساب لإرسال رسالة التأكيد للزبون"
                            >
                              <MessageCircle className="w-4 h-4" />
                              <span>إرسال رسالة التأكيد عبر واتساب</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleCopyCustomerWhatsAppText(ord)}
                              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 text-xs font-semibold transition cursor-pointer"
                              title="نسخ نص الرسالة"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              <span>نسخ الرسالة</span>
                            </button>

                            <a
                              href={`${typeof window !== 'undefined' ? window.location.origin : ''}/#confirm-order?id=${ord.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/10 text-xs font-semibold transition"
                              title="معاينة رابط تأكيد الزبون"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>رابط الزبون</span>
                            </a>
                          </div>

                          {/* Move / Confirm / Cancel Actions */}
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={async () => {
                                await updateOrderStatus(
                                  ord.id,
                                  'تم التأكيد',
                                  'تم تأكيد الطلب مباشرة من طرف المسؤول ونقله فوراً إلى قيد التجهيز',
                                  { customerAction: 'confirmed' }
                                );
                              }}
                              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#c5a869] hover:bg-[#d8bb7a] text-black font-extrabold text-xs shadow-md transition cursor-pointer"
                              title="تأكيد الطلب ونقله تلقائياً إلى طلبات قيد التجهيز"
                            >
                              <CheckCircle className="w-4 h-4" />
                              <span>تأكيد الطلب الآن (نقل لقيد التجهيز)</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleStartEditOrder(ord)}
                              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-xs transition cursor-pointer"
                              title="تعديل بيانات الطلب (الاسم، الهاتف، المدينة، العنوان، المنتجات أو الألوان)"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              <span>تعديل الطلب</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setSelectedOrder(ord)}
                              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 text-xs cursor-pointer"
                              title="عرض كافة التفاصيل"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={async () => {
                                if (window.confirm(`هل أنت متأكد من إلغاء الطلب ${ord.orderNumber}؟`)) {
                                  await updateOrderStatus(ord.id, 'ملغى', 'تم إلغاء الطلب من قسم الطلبات الجديدة', { customerAction: 'cancelled' });
                                }
                              }}
                              className="p-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs cursor-pointer"
                              title="إلغاء الطلب"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ================= TAB: PREPARING ORDERS (طلبات قيد التجهيز) ================= */}
            {activeTab === 'preparing_orders' && (
              <div className="space-y-4">
                {/* Header Card */}
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-purple-950/70 via-[#1a132e] to-[#151822] border border-purple-500/30 space-y-3">
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/40 flex items-center justify-center flex-shrink-0">
                        <Package className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-extrabold text-white">طلبات قيد التجهيز والتغليف</h3>
                          <span className="px-2.5 py-0.5 rounded-full bg-purple-500/30 text-purple-300 border border-purple-500/40 text-[10px] font-bold">
                            {preparingOrders.length} قيد التجهيز
                          </span>
                        </div>
                        <p className="text-xs text-gray-300 mt-1">
                          تصل إلى هذا القسم تلقائياً جميع الطلبات التي تغيّرت حالتها إلى «قيد التجهيز» لتسهيل تحضير الساعات والألوان المطلوبة، تصدير ملف الإكسل المعتمد لشركة الشحن، وإصدار وطباعة شهادة الضمان الرسمية (سنة كاملة).
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
                      <button
                        type="button"
                        disabled={filteredPreparingOrders.length === 0}
                        onClick={() => handleExportPreparingXlsx(filteredPreparingOrders)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold text-xs shadow-lg shadow-emerald-950/50 transition whitespace-nowrap cursor-pointer"
                        title="تحميل جميع طلبات قيد التجهيز المعروضة بصيغة .xlsx مطابقة لنموذج Ozon Express لرفعها مباشرة"
                      >
                        <FileSpreadsheet className="w-4 h-4" />
                        <span>تحميل ملف Excel (.xlsx) لشركة الشحن ({filteredPreparingOrders.length})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveTab('orders')}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-200 border border-white/10 text-xs font-bold transition whitespace-nowrap cursor-pointer"
                      >
                        <ShoppingBag className="w-4 h-4 text-[#c5a869]" />
                        <span>كل الطلبات ({orders.length})</span>
                      </button>
                    </div>
                  </div>

                  {/* Ozon Express Template Columns Reference Strip */}
                  <div className="pt-2.5 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-[11px] text-gray-300">
                    <div className="flex items-center gap-1.5 text-emerald-300 font-semibold">
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>نموذج شركة الشحن المعتمد (.xlsx):</span>
                    </div>
                    <div className="font-mono text-[10px] text-gray-400 bg-black/30 px-2.5 py-1 rounded-lg border border-white/5 overflow-x-auto max-w-full" dir="ltr">
                      CODE SUIVI | DESTINATAIRE | TELEPHONE | ADRESSE | PRIX | VILLE | COMMENTAIRE | QUARTIER | PRODUIT
                    </div>
                  </div>
                </div>

                {/* Search Bar for Preparing Orders */}
                {preparingOrders.length > 0 && (
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#151822] border border-purple-500/20">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={preparingOrdersSearch}
                        onChange={(e) => setPreparingOrdersSearch(e.target.value)}
                        placeholder="بحث في طلبات قيد التجهيز (رقم الطلب، الاسم، الهاتف، المدينة، العنوان، أو المنتج)..."
                        className="w-full bg-[#1b1f2c] border border-white/10 rounded-xl py-2.5 pr-10 pl-9 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                      />
                      <Search className="w-4 h-4 text-purple-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                      {preparingOrdersSearch && (
                        <button
                          type="button"
                          onClick={() => setPreparingOrdersSearch('')}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition cursor-pointer"
                          title="مسح البحث"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="text-[11px] text-gray-300 font-semibold px-2 whitespace-nowrap">
                      عرض <strong className="text-purple-400">{filteredPreparingOrders.length}</strong> من {preparingOrders.length}
                    </div>
                  </div>
                )}

                {/* Empty State */}
                {preparingOrders.length === 0 ? (
                  <div className="p-12 text-center rounded-3xl bg-[#151822] border border-white/5 space-y-4">
                    <div className="w-16 h-16 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/30 flex items-center justify-center mx-auto shadow-inner">
                      <Package className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-lg font-bold text-white">لا توجد طلبات قيد التجهيز حالياً</h4>
                      <p className="text-xs text-gray-400 max-w-md mx-auto leading-relaxed">
                        كلما تم تغيير حالة أي طلب إلى <strong className="text-purple-400">«قيد التجهيز»</strong> من إدارة الطلبات أو نافذة التفاصيل، سيتم نقله وعرضه هنا تلقائياً لتجهيزه للشحن.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('orders')}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl gold-gradient-bg text-black font-bold text-xs shadow-md transition cursor-pointer"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>الذهاب إلى إدارة الطلبات</span>
                    </button>
                  </div>
                ) : filteredPreparingOrders.length === 0 ? (
                  <div className="p-10 text-center rounded-3xl bg-[#151822] border border-white/5 space-y-3">
                    <Search className="w-10 h-10 text-gray-500 mx-auto" />
                    <p className="text-sm font-bold text-white">لا توجد طلبات قيد التجهيز مطابقة لعبارة البحث "{preparingOrdersSearch}"</p>
                    <button
                      type="button"
                      onClick={() => setPreparingOrdersSearch('')}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-bold transition cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>مسح البحث</span>
                    </button>
                  </div>
                ) : (
                  /* List of Preparing Orders */
                  <div className="grid grid-cols-1 gap-4">
                    {filteredPreparingOrders.map((ord) => (
                      <div
                        key={ord.id}
                        className="p-5 rounded-2xl bg-[#151822] border border-white/10 hover:border-purple-500/40 transition shadow-xl space-y-4 text-right"
                      >
                        {/* Top row: Order Number, Date, and Badges */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-mono font-black text-[#c5a869]">
                              {ord.orderNumber}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] font-bold">
                              قيد التجهيز
                            </span>
                            {ord.customerAction === 'confirmed' && (
                              <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> أكده الزبون
                              </span>
                            )}
                          </div>

                          <span className="text-xs text-gray-400 font-mono" dir="ltr">
                            {new Date(ord.date).toLocaleString('ar-MA')}
                          </span>
                        </div>

                        {/* Customer & Order details grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                          {/* Customer Box */}
                          <div className="p-3.5 rounded-xl bg-white/5 space-y-1.5">
                            <span className="text-gray-400 text-[10px] block font-semibold">بيانات التوصيل والزبون:</span>
                            <div className="font-bold text-white text-sm">{ord.customerName}</div>
                            <div className="flex items-center gap-2">
                              <Phone className="w-3.5 h-3.5 text-[#c5a869]" />
                              <a
                                href={`tel:${ord.phone}`}
                                className="font-mono text-emerald-400 hover:underline font-bold text-xs"
                                dir="ltr"
                              >
                                {ord.phone}
                              </a>
                            </div>
                            <div className="text-gray-300">
                              <strong className="text-white">المدينة:</strong> {ord.city}
                            </div>
                            <div className="text-gray-400 text-[11px]" title={ord.address}>
                              <strong className="text-gray-300">العنوان:</strong> {ord.address}
                            </div>
                          </div>

                          {/* Items Box */}
                          <div className="p-3.5 rounded-xl bg-white/5 space-y-2 md:col-span-2 flex flex-col justify-between">
                            <div>
                              <span className="text-gray-400 text-[10px] block font-semibold mb-1">القطع والألوان المطلوب تجهيزها:</span>
                              <div className="space-y-1.5">
                                {ord.items.map((it, idx) => (
                                  <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between text-gray-200 gap-1 pb-1.5 border-b border-white/5 last:border-0">
                                    <div className="flex items-center gap-2">
                                      <span className="w-5 h-5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold flex items-center justify-center">
                                        {it.quantity}x
                                      </span>
                                      <span className="font-semibold text-white">
                                        {it.name} {it.bundleLabel ? `[${it.bundleLabel}]` : ''}
                                      </span>
                                    </div>

                                    {/* Color badges */}
                                    <div className="text-gray-300 text-[11px]">
                                      {it.selectedColors && it.selectedColors.length > 1 ? (
                                        <div className="flex flex-wrap gap-1">
                                          {it.selectedColors.map((col, cIdx) => (
                                            <span key={cIdx} className="px-1.5 py-0.5 rounded bg-black/40 border border-white/10 text-gray-200 text-[10px]">
                                              ساعة {cIdx + 1}: <strong className="text-[#c5a869]">{col}</strong>
                                            </span>
                                          ))}
                                        </div>
                                      ) : (
                                        <span>اللون: <strong className="text-[#c5a869]">{it.color}</strong></span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {ord.notes && (
                              <div className="text-[11px] text-amber-300 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20 mt-1">
                                <strong>ملاحظة للتجهيز / التغليف:</strong> {ord.notes}
                              </div>
                            )}

                            <div className="flex items-center justify-between pt-2 border-t border-white/5">
                              <span className="text-gray-400">المبلغ الواجب تحصيله (COD):</span>
                              <span className="font-black text-emerald-400 text-sm">
                                {formatPrice(ord.totalAmount)} (توصيل مجاني)
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons Row */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/5">
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setPrintingOrder(ord)}
                              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#c5a869]/20 hover:bg-[#c5a869]/30 text-[#c5a869] border border-[#c5a869]/40 font-bold text-xs transition cursor-pointer"
                              title="معاينة وطباعة أو إرسال شهادة الضمان الرسمية لمدة سنة"
                            >
                              <ShieldCheck className="w-4 h-4" />
                              <span>شهادة الضمان (سنة)</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleSendCustomerWhatsApp(ord)}
                              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/30 font-bold text-xs transition cursor-pointer"
                              title="مراسلة الزبون عبر واتساب"
                            >
                              <MessageCircle className="w-4 h-4" />
                              <span>مراسلة الزبون</span>
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleExportPreparingXlsx(
                                  [ord],
                                  `OzonExpress_${ord.orderNumber.replace(/[^a-zA-Z0-9_-]/g, '')}.xlsx`
                                )
                              }
                              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-teal-600/20 hover:bg-teal-600 text-teal-300 hover:text-white border border-teal-500/30 font-bold text-xs transition cursor-pointer"
                              title="تحميل هذا الطلب فقط بصيغة .xlsx لنموذج شركة الشحن"
                            >
                              <FileSpreadsheet className="w-4 h-4" />
                              <span>تصدير .xlsx</span>
                            </button>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={async () => {
                                await updateOrderStatus(
                                  ord.id,
                                  'تم الشحن',
                                  'تم الانتهاء من التجهيز وتسليم الطرد لشركة الشحن'
                                );
                                showToast(`تم شحن الطلب ${ord.orderNumber} ونقله إلى حالة "تم الشحن"`, 'success');
                              }}
                              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs shadow-md transition cursor-pointer"
                              title="تحويل حالة الطلب إلى تم الشحن بعد الانتهاء من التجهيز"
                            >
                              <Truck className="w-4 h-4" />
                              <span>جاهز وتم الشحن</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setSelectedOrder(ord)}
                              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 text-xs cursor-pointer"
                              title="عرض وتعديل التفاصيل"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ================= TAB: SHIPPED ORDERS (طلبات مشحونة) ================= */}
            {activeTab === 'shipped_orders' && (
              <div className="space-y-4">
                {/* Header Card */}
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-cyan-950/70 via-[#0e2230] to-[#151822] border border-cyan-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 flex items-center justify-center flex-shrink-0">
                      <Truck className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-extrabold text-white">طلبات مشحونة (متابعة التوصيل)</h3>
                        <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-[10px] font-bold">
                          {shippedOrders.length} طلبات في التوصيل
                        </span>
                      </div>
                      <p className="text-xs text-gray-300 mt-1">
                        تصل إلى هنا تلقائياً جميع الطلبات التي تغيّرت حالتها إلى «تم الشحن». يمكنك تعديل حالتها النهائية من خلال 3 خيارات فقط: <strong className="text-emerald-400">تم التسليم</strong>، <strong className="text-rose-400">ملغى</strong>، أو <strong className="text-amber-300">مرتجع</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                    {filteredShippedOrders.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          filteredShippedOrders.forEach((o, i) => {
                            setTimeout(() => {
                              handleSendShippedWhatsApp(o);
                            }, i * 600);
                          });
                        }}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow-lg transition whitespace-nowrap cursor-pointer"
                        title="إرسال رسالة إشعار الشحن والتوصيل خلال 24 ساعة لجميع الزبائن المعروضين"
                      >
                        <Send className="w-4 h-4" />
                        <span>إشعار الشحن للجميع ({filteredShippedOrders.length})</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setActiveTab('orders')}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-200 border border-white/10 text-xs font-bold transition whitespace-nowrap cursor-pointer"
                    >
                      <ShoppingBag className="w-4 h-4 text-[#c5a869]" />
                      <span>كل الطلبات ({orders.length})</span>
                    </button>
                  </div>
                </div>

                {/* Search Bar for Shipped Orders */}
                {shippedOrders.length > 0 && (
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#151822] border border-cyan-500/20">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={shippedOrdersSearch}
                        onChange={(e) => setShippedOrdersSearch(e.target.value)}
                        placeholder="بحث في الطلبات المشحونة (رقم الطلب، اسم المستلم، الهاتف، المدينة، العنوان، أو المنتج)..."
                        className="w-full bg-[#1b1f2c] border border-white/10 rounded-xl py-2.5 pr-10 pl-9 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500"
                      />
                      <Search className="w-4 h-4 text-cyan-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                      {shippedOrdersSearch && (
                        <button
                          type="button"
                          onClick={() => setShippedOrdersSearch('')}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition cursor-pointer"
                          title="مسح البحث"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="text-[11px] text-gray-300 font-semibold px-2 whitespace-nowrap">
                      عرض <strong className="text-cyan-400">{filteredShippedOrders.length}</strong> من {shippedOrders.length}
                    </div>
                  </div>
                )}

                {/* Empty State */}
                {shippedOrders.length === 0 ? (
                  <div className="p-12 text-center rounded-3xl bg-[#151822] border border-white/5 space-y-4">
                    <div className="w-16 h-16 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center justify-center mx-auto shadow-inner">
                      <Truck className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-lg font-bold text-white">لا توجد طلبات مشحونة حالياً</h4>
                      <p className="text-xs text-gray-400 max-w-md mx-auto leading-relaxed">
                        كلما تم تغيير حالة أي طلب إلى <strong className="text-cyan-400">«تم الشحن»</strong> (من قيد التجهيز أو إدارة الطلبات)، سينتقل تلقائياً إلى هذا القسم لمتابعة تسليمه.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('preparing_orders')}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition cursor-pointer"
                    >
                      <Package className="w-4 h-4" />
                      <span>عرض طلبات قيد التجهيز ({preparingOrdersCount})</span>
                    </button>
                  </div>
                ) : filteredShippedOrders.length === 0 ? (
                  <div className="p-10 text-center rounded-3xl bg-[#151822] border border-white/5 space-y-3">
                    <Search className="w-10 h-10 text-gray-500 mx-auto" />
                    <p className="text-sm font-bold text-white">لا توجد طلبات مشحونة مطابقة لعبارة البحث "{shippedOrdersSearch}"</p>
                    <button
                      type="button"
                      onClick={() => setShippedOrdersSearch('')}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>مسح البحث</span>
                    </button>
                  </div>
                ) : (
                  /* List of Shipped Orders */
                  <div className="grid grid-cols-1 gap-4">
                    {filteredShippedOrders.map((ord) => (
                      <div
                        key={ord.id}
                        className="p-5 rounded-2xl bg-[#151822] border border-white/10 hover:border-cyan-500/40 transition shadow-xl space-y-4 text-right"
                      >
                        {/* Top Row */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-mono font-black text-[#c5a869]">
                              {ord.orderNumber}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-bold flex items-center gap-1">
                              <Truck className="w-3 h-3" /> تم الشحن
                            </span>
                          </div>

                          <span className="text-xs text-gray-400 font-mono" dir="ltr">
                            {new Date(ord.date).toLocaleString('ar-MA')}
                          </span>
                        </div>

                        {/* Customer & Order details grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                          <div className="p-3.5 rounded-xl bg-white/5 space-y-1.5">
                            <span className="text-gray-400 text-[10px] block font-semibold">بيانات المستلم:</span>
                            <div className="font-bold text-white text-sm">{ord.customerName}</div>
                            <div className="flex items-center gap-2">
                              <Phone className="w-3.5 h-3.5 text-[#c5a869]" />
                              <a
                                href={`tel:${ord.phone}`}
                                className="font-mono text-emerald-400 hover:underline font-bold text-xs"
                                dir="ltr"
                              >
                                {ord.phone}
                              </a>
                            </div>
                            <div className="text-gray-300">
                              <strong className="text-white">المدينة:</strong> {ord.city}
                            </div>
                            <div className="text-gray-400 text-[11px]" title={ord.address}>
                              <strong className="text-gray-300">العنوان:</strong> {ord.address}
                            </div>
                          </div>

                          <div className="p-3.5 rounded-xl bg-white/5 space-y-2 md:col-span-2 flex flex-col justify-between">
                            <div>
                              <span className="text-gray-400 text-[10px] block font-semibold mb-1">المنتجات المشحونة:</span>
                              <div className="space-y-1.5">
                                {ord.items.map((it, idx) => (
                                  <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between text-gray-200 gap-1 pb-1.5 border-b border-white/5 last:border-0">
                                    <div className="flex items-center gap-2">
                                      <span className="w-5 h-5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold flex items-center justify-center">
                                        {it.quantity}x
                                      </span>
                                      <span className="font-semibold text-white">
                                        {it.name} {it.bundleLabel ? `[${it.bundleLabel}]` : ''}
                                      </span>
                                    </div>

                                    <div className="text-gray-300 text-[11px]">
                                      {it.selectedColors && it.selectedColors.length > 1 ? (
                                        <div className="flex flex-wrap gap-1">
                                          {it.selectedColors.map((col, cIdx) => (
                                            <span key={cIdx} className="px-1.5 py-0.5 rounded bg-black/40 border border-white/10 text-gray-200 text-[10px]">
                                              ساعة {cIdx + 1}: <strong className="text-[#c5a869]">{col}</strong>
                                            </span>
                                          ))}
                                        </div>
                                      ) : (
                                        <span>اللون: <strong className="text-[#c5a869]">{it.color}</strong></span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {ord.notes && (
                              <div className="text-[11px] text-amber-300 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20 mt-1">
                                <strong>ملاحظات:</strong> {ord.notes}
                              </div>
                            )}

                            <div className="flex items-center justify-between pt-2 border-t border-white/5">
                              <span className="text-gray-400">المبلغ المطلوب تحصيله (COD):</span>
                              <span className="font-black text-emerald-400 text-sm">
                                {formatPrice(ord.totalAmount)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Status Modification (Strictly 3 Choices Only: تم التسليم / ملغى / مرتجع) + Tools */}
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-3 border-t border-white/5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-bold text-gray-300 ml-1">تعديل حالة الطلب:</span>

                            <button
                              type="button"
                              onClick={async () => {
                                await updateOrderStatus(
                                  ord.id,
                                  'تم التسليم',
                                  'تم تأكيد تسليم الطلب وتحصيل المبلغ بنجاح'
                                );
                                showToast(`تم تحديث الطلب ${ord.orderNumber} إلى "تم التسليم"`, 'success');
                              }}
                              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md transition cursor-pointer"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>تم التسليم</span>
                            </button>

                            <button
                              type="button"
                              onClick={async () => {
                                if (window.confirm(`هل تريد تغيير حالة الطلب ${ord.orderNumber} إلى "ملغى"؟`)) {
                                  await updateOrderStatus(
                                    ord.id,
                                    'ملغى',
                                    'تم تعديل حالة الطلب المشحون إلى ملغى'
                                  );
                                }
                              }}
                              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 font-bold text-xs transition cursor-pointer"
                            >
                              <XCircle className="w-4 h-4" />
                              <span>ملغى</span>
                            </button>

                            <button
                              type="button"
                              onClick={async () => {
                                if (window.confirm(`هل تريد تسجيل الطلب ${ord.orderNumber} كـ "مرتجع"؟`)) {
                                  await updateOrderStatus(
                                    ord.id,
                                    'مرتجع',
                                    'تم إرجاع الطلب المشحون (مرتجع)'
                                  );
                                }
                              }}
                              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-700/60 hover:bg-zinc-600 text-zinc-200 hover:text-white border border-zinc-500/40 font-bold text-xs transition cursor-pointer"
                            >
                              <RotateCcw className="w-4 h-4" />
                              <span>مرتجع</span>
                            </button>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleSendShippedWhatsApp(ord)}
                              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-extrabold text-xs transition cursor-pointer ${
                                sentShippedNoticeIds[ord.id]
                                  ? 'bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40'
                                  : 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-md'
                              }`}
                              title="إرسال رسالة احترافية للزبون تؤكد شحن طلبه مع شركة التوصيل ووصوله خلال 24 ساعة"
                            >
                              {sentShippedNoticeIds[ord.id] ? (
                                <CheckCheck className="w-4 h-4" />
                              ) : (
                                <Send className="w-4 h-4" />
                              )}
                              <span>
                                {sentShippedNoticeIds[ord.id]
                                  ? 'تم إرسال إشعار 24 ساعة (إعادة إرسال)'
                                  : 'إرسال إشعار التوصيل (24 ساعة)'}
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleCopyShippedWhatsAppText(ord)}
                              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 text-xs font-semibold transition cursor-pointer"
                              title="نسخ نص رسالة إشعار الشحن خلال 24 ساعة"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              <span>نسخ رسالة الشحن</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setPrintingOrder(ord)}
                              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-[#c5a869] border border-white/10 text-xs cursor-pointer"
                              title="شهادة الضمان الرسمية (سنة كاملة)"
                            >
                              <ShieldCheck className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => setSelectedOrder(ord)}
                              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 text-xs cursor-pointer"
                              title="عرض التفاصيل"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ================= TAB: CANCELLED & RETURNED ORDERS (طلبات ملغى) ================= */}
            {activeTab === 'cancelled_orders' && (
              <div className="space-y-4">
                {/* Header Card */}
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-rose-950/70 via-[#28121b] to-[#151822] border border-rose-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center flex-shrink-0">
                      <XCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-extrabold text-white">طلبات ملغى ومرتجعة</h3>
                        <span className="px-2.5 py-0.5 rounded-full bg-rose-500/30 text-rose-300 border border-rose-500/40 text-[10px] font-bold">
                          {cancelledOrders.filter((o) => o.status === 'ملغى').length} ملغى
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-zinc-500/30 text-zinc-200 border border-zinc-500/40 text-[10px] font-bold">
                          {cancelledOrders.filter((o) => o.status === 'مرتجع').length} مرتجع
                        </span>
                      </div>
                      <p className="text-xs text-gray-300 mt-1">
                        تصل إلى هنا تلقائياً جميع الطلبات التي تغيّرت حالتها إلى <strong className="text-rose-400">«ملغى»</strong> أو <strong className="text-zinc-300">«مرتجع»</strong> لمتابعتها أو استعادتها أو حذفها.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab('orders')}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-200 border border-white/10 text-xs font-bold transition whitespace-nowrap cursor-pointer"
                  >
                    <ShoppingBag className="w-4 h-4 text-[#c5a869]" />
                    <span>كل الطلبات ({orders.length})</span>
                  </button>
                </div>

                {/* Search & Filter Bar for Cancelled/Returned Orders */}
                {cancelledOrders.length > 0 && (
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#151822] border border-rose-500/20">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={cancelledOrdersSearch}
                        onChange={(e) => setCancelledOrdersSearch(e.target.value)}
                        placeholder="بحث في الطلبات الملغاة والمرتجعة (رقم الطلب، الاسم، الهاتف، المدينة، العنوان، أو المنتج)..."
                        className="w-full bg-[#1b1f2c] border border-white/10 rounded-xl py-2.5 pr-10 pl-9 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-rose-500"
                      />
                      <Search className="w-4 h-4 text-rose-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                      {cancelledOrdersSearch && (
                        <button
                          type="button"
                          onClick={() => setCancelledOrdersSearch('')}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition cursor-pointer"
                          title="مسح البحث"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <select
                        value={cancelledOrdersStatusFilter}
                        onChange={(e) => setCancelledOrdersStatusFilter(e.target.value as 'all' | 'ملغى' | 'مرتجع')}
                        className="bg-[#1b1f2c] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                      >
                        <option value="all">الكل ({cancelledOrders.length})</option>
                        <option value="ملغى">ملغى فقط ({cancelledOrders.filter((o) => o.status === 'ملغى').length})</option>
                        <option value="مرتجع">مرتجع فقط ({cancelledOrders.filter((o) => o.status === 'مرتجع').length})</option>
                      </select>

                      <div className="text-[11px] text-gray-300 font-semibold px-2 whitespace-nowrap">
                        عرض <strong className="text-rose-400">{filteredCancelledOrders.length}</strong> من {cancelledOrders.length}
                      </div>
                    </div>
                  </div>
                )}

                {/* Empty State */}
                {cancelledOrders.length === 0 ? (
                  <div className="p-12 text-center rounded-3xl bg-[#151822] border border-white/5 space-y-4">
                    <div className="w-16 h-16 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto shadow-inner">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-lg font-bold text-white">لا توجد طلبات ملغاة أو مرتجعة حالياً</h4>
                      <p className="text-xs text-gray-400 max-w-md mx-auto leading-relaxed">
                        كلما تم تغيير حالة أي طلب إلى <strong className="text-rose-400">«ملغى»</strong> أو <strong className="text-zinc-300">«مرتجع»</strong> سيتم نقله وعرضه هنا تلقائياً.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('orders')}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl gold-gradient-bg text-black font-bold text-xs shadow-md transition cursor-pointer"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>الذهاب إلى إدارة الطلبات ({orders.length})</span>
                    </button>
                  </div>
                ) : filteredCancelledOrders.length === 0 ? (
                  <div className="p-10 text-center rounded-3xl bg-[#151822] border border-white/5 space-y-3">
                    <Search className="w-10 h-10 text-gray-500 mx-auto" />
                    <p className="text-sm font-bold text-white">لا توجد طلبات ملغاة أو مرتجعة مطابقة لخيارات البحث</p>
                    <button
                      type="button"
                      onClick={() => {
                        setCancelledOrdersSearch('');
                        setCancelledOrdersStatusFilter('all');
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-bold transition cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>إعادة ضبط البحث</span>
                    </button>
                  </div>
                ) : (
                  /* List of Cancelled / Returned Orders */
                  <div className="grid grid-cols-1 gap-4">
                    {filteredCancelledOrders.map((ord) => (
                      <div
                        key={ord.id}
                        className="p-5 rounded-2xl bg-[#151822] border border-white/10 hover:border-rose-500/40 transition shadow-xl space-y-4 text-right"
                      >
                        {/* Top Row */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
                          <div className="flex flex-wrap items-center gap-2.5">
                            <span className="text-sm font-mono font-black text-[#c5a869]">
                              {ord.orderNumber}
                            </span>
                            {ord.status === 'ملغى' ? (
                              <span className="px-2.5 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold flex items-center gap-1">
                                <XCircle className="w-3 h-3" /> ملغى
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-md bg-zinc-500/25 text-zinc-200 border border-zinc-500/40 text-[10px] font-bold flex items-center gap-1">
                                <RotateCcw className="w-3 h-3" /> مرتجع
                              </span>
                            )}
                            {ord.customerAction === 'cancelled' && (
                              <span className="px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-300 border border-rose-500/30 text-[10px] font-semibold">
                                ألغاه الزبون
                              </span>
                            )}
                          </div>

                          <span className="text-xs text-gray-400 font-mono" dir="ltr">
                            {new Date(ord.date).toLocaleString('ar-MA')}
                          </span>
                        </div>

                        {/* Customer & Order details grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                          <div className="p-3.5 rounded-xl bg-white/5 space-y-1.5">
                            <span className="text-gray-400 text-[10px] block font-semibold">بيانات الزبون:</span>
                            <div className="font-bold text-white text-sm">{ord.customerName}</div>
                            <div className="flex items-center gap-2">
                              <Phone className="w-3.5 h-3.5 text-[#c5a869]" />
                              <a
                                href={`tel:${ord.phone}`}
                                className="font-mono text-emerald-400 hover:underline font-bold text-xs"
                                dir="ltr"
                              >
                                {ord.phone}
                              </a>
                            </div>
                            <div className="text-gray-300">
                              <strong className="text-white">المدينة:</strong> {ord.city}
                            </div>
                            <div className="text-gray-400 text-[11px]" title={ord.address}>
                              <strong className="text-gray-300">العنوان:</strong> {ord.address}
                            </div>
                          </div>

                          <div className="p-3.5 rounded-xl bg-white/5 space-y-2 md:col-span-2 flex flex-col justify-between">
                            <div>
                              <span className="text-gray-400 text-[10px] block font-semibold mb-1">المنتجات:</span>
                              <div className="space-y-1.5">
                                {ord.items.map((it, idx) => (
                                  <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between text-gray-200 gap-1 pb-1.5 border-b border-white/5 last:border-0">
                                    <div className="flex items-center gap-2">
                                      <span className="w-5 h-5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold flex items-center justify-center">
                                        {it.quantity}x
                                      </span>
                                      <span className="font-semibold text-white">
                                        {it.name} {it.bundleLabel ? `[${it.bundleLabel}]` : ''}
                                      </span>
                                    </div>

                                    <div className="text-gray-300 text-[11px]">
                                      {it.selectedColors && it.selectedColors.length > 1 ? (
                                        <div className="flex flex-wrap gap-1">
                                          {it.selectedColors.map((col, cIdx) => (
                                            <span key={cIdx} className="px-1.5 py-0.5 rounded bg-black/40 border border-white/10 text-gray-200 text-[10px]">
                                              ساعة {cIdx + 1}: <strong className="text-[#c5a869]">{col}</strong>
                                            </span>
                                          ))}
                                        </div>
                                      ) : (
                                        <span>اللون: <strong className="text-[#c5a869]">{it.color}</strong></span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {(ord.notes || ord.adminNotes) && (
                              <div className="text-[11px] text-amber-300 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20 mt-1 space-y-0.5">
                                {ord.notes && (
                                  <div><strong>ملاحظة الزبون:</strong> {ord.notes}</div>
                                )}
                                {ord.adminNotes && (
                                  <div><strong>سبب / ملاحظة الإدارة:</strong> {ord.adminNotes}</div>
                                )}
                              </div>
                            )}

                            <div className="flex items-center justify-between pt-2 border-t border-white/5">
                              <span className="text-gray-400">قيمة الطلب:</span>
                              <span className="font-black text-rose-300 text-sm">
                                {formatPrice(ord.totalAmount)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Actions Row */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-white/5">
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={async () => {
                                await updateOrderStatus(
                                  ord.id,
                                  'قيد التجهيز',
                                  'تمت استعادة الطلب إلى قيد التجهيز'
                                );
                                showToast(`تمت استعادة الطلب ${ord.orderNumber} إلى «قيد التجهيز»`, 'success');
                              }}
                              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/30 font-bold text-xs transition cursor-pointer"
                              title="استعادة الطلب إلى قسم طلبات قيد التجهيز"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>استعادة لقيد التجهيز</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleSendCustomerWhatsApp(ord)}
                              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/30 font-bold text-xs transition cursor-pointer"
                              title="التواصل مع الزبون عبر واتساب"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>مراسلة الزبون</span>
                            </button>

                            {(() => {
                              const normOrdPhone = normalizeMoroccanPhone(ord.phone);
                              const isBlocked = (currentOrderSecurity.blockedPhones || []).some(
                                (bp) => normalizeMoroccanPhone(bp) === normOrdPhone
                              );
                              return isBlocked ? (
                                <button
                                  type="button"
                                  onClick={() => handleUnblockPhone(ord.phone)}
                                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-bold text-xs transition cursor-pointer"
                                  title="إلغاء حظر هذا الرقم من الطلب"
                                >
                                  <Ban className="w-3.5 h-3.5" />
                                  <span>محظور (اضغط لفك الحظر)</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleBlockPhone(ord.phone)}
                                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600/15 hover:bg-rose-600 text-amber-300 hover:text-white border border-amber-500/30 font-bold text-xs transition cursor-pointer"
                                  title="حظر هذا الرقم نهائياً من تقديم طلبات جديدة"
                                >
                                  <Ban className="w-3.5 h-3.5" />
                                  <span>حظر الرقم</span>
                                </button>
                              );
                            })()}
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedOrder(ord)}
                              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 text-xs cursor-pointer"
                              title="عرض التفاصيل"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `هل أنت متأكد من حذف الطلب ${ord.orderNumber} نهائياً الخاص بـ "${ord.customerName}"؟`
                                  )
                                ) {
                                  deleteOrder(ord.id);
                                }
                              }}
                              className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 text-xs cursor-pointer"
                              title="حذف الطلب نهائياً"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ================= TAB 3: PRODUCTS MANAGEMENT ================= */}
            {activeTab === 'products' && (
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-2xl bg-[#151822] border border-white/5">
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white">كتالوج الساعات الفاخرة</h3>
                      <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        حفظ دائم في المتصفح ومزامنة
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      إضافة موديلات جديدة، وتعديل الأسعار والمخزون، مع حفظ فوري ومزامنة تلقائية دائمة.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => syncAllToCloud()}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-gray-300 border border-white/10 transition cursor-pointer"
                      title="مزامنة فورية وتأكيد الحفظ"
                    >
                      <Save className="w-3.5 h-3.5 text-[#c5a869]" />
                      <span>مزامنة فورية</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleExportProductsJSON}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-gray-300 border border-white/10 transition cursor-pointer"
                      title="تحميل نسخة احتياطية من جميع الساعات على جهازك"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>نسخة احتياطية (JSON)</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleStartAddProduct}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl gold-gradient-bg text-black font-extrabold text-xs shadow hover:brightness-110 transition cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>إضافة ساعة جديدة</span>
                    </button>
                  </div>
                </div>

                {/* Fast Search Bar for Products */}
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="ابحث عن ساعة بالاسم أو رمز الموديل (SKU) لتعديلها فوراً..."
                    className="w-full bg-[#151822] border border-white/10 rounded-xl pr-10 pl-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#c5a869]"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {products
                    .filter((p) => {
                      const q = productSearch.trim().toLowerCase();
                      if (!q) return true;
                      return (
                        p.name.toLowerCase().includes(q) ||
                        (p.sku || '').toLowerCase().includes(q) ||
                        (p.category || '').toLowerCase().includes(q)
                      );
                    })
                    .map((p) => (
                    <div
                      key={p.id}
                      className="p-4 rounded-2xl bg-[#151822] border border-white/5 flex flex-col justify-between space-y-3"
                    >
                      <div className="flex gap-3">
                        <img
                          src={p.images[0] || '/assets/luxury_watch_hero.jpg'}
                          alt={p.name}
                          loading="lazy"
                          decoding="async"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = '/assets/luxury_watch_hero.jpg';
                          }}
                          className="w-20 h-20 rounded-xl object-cover bg-black"
                        />
                        <div className="flex-1 text-right">
                          <span className="font-mono text-[10px] text-[#c5a869]">{p.sku}</span>
                          <h4 className="text-sm font-bold text-white line-clamp-1">{p.name}</h4>
                          <div className="flex items-center gap-2 mt-1 text-xs">
                            <span className="text-white font-black">{formatPrice(p.price)}</span>
                            {p.originalPrice > p.price && (
                              <span className="text-gray-500 line-through text-[10px]">
                                {formatPrice(p.originalPrice)}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-gray-400 mt-1 block">
                            المخزون: <strong>{p.stock}</strong> حبة | الفئة: {p.category}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            p.isPublished
                              ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30'
                              : 'bg-zinc-800 text-zinc-400'
                          }`}
                        >
                          {p.isPublished ? 'منشور فالمتجر' : 'مسودة مخفية'}
                        </span>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingProduct(p);
                              setIsEditingProduct(true);
                            }}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 cursor-pointer"
                            title="تعديل"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => duplicateProduct(p.id)}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-[#c5a869] cursor-pointer"
                            title="نسخ المنتج"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`هل أنت متأكد من حذف ${p.name}؟`)) {
                                deleteProduct(p.id);
                              }
                            }}
                            className="p-2 rounded-lg bg-white/5 hover:bg-rose-500/20 text-rose-400 cursor-pointer"
                            title="حذف"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ================= TAB 4: REVIEWS MANAGEMENT ================= */}
            {activeTab === 'reviews' && (() => {
              const rq = reviewsSearch.trim().toLowerCase();
              const filteredReviews = rq
                ? reviews.filter(
                    (rev) =>
                      rev.author.toLowerCase().includes(rq) ||
                      (rev.city || '').toLowerCase().includes(rq) ||
                      rev.comment.toLowerCase().includes(rq)
                  )
                : reviews;
              const totalPages = Math.max(1, Math.ceil(filteredReviews.length / REVIEWS_PER_PAGE));
              const currentPage = Math.min(reviewsPage, totalPages);
              const pagedReviews = filteredReviews.slice(
                (currentPage - 1) * REVIEWS_PER_PAGE,
                currentPage * REVIEWS_PER_PAGE
              );

              return (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#151822] border border-white/5">
                    <div>
                      <h3 className="text-base font-bold text-white">
                        إدارة تقييمات وتعليقات الزبائن ({filteredReviews.length})
                      </h3>
                      <p className="text-xs text-gray-400">
                        مراجعة الآراء، إظهار أو إخفاء التقييمات فالمتجر (عرض {REVIEWS_PER_PAGE} تعليقاً في كل صفحة لسرعة التصفح)
                      </p>
                    </div>
                    <div className="relative w-full sm:w-72">
                      <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={reviewsSearch}
                        onChange={(e) => {
                          setReviewsSearch(e.target.value);
                          setReviewsPage(1);
                        }}
                        placeholder="ابحث بالاسم، المدينة أو نص التعليق..."
                        className="w-full bg-[#1b1f2b] border border-white/10 rounded-xl pr-9 pl-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#c5a869]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pagedReviews.map((rev) => (
                      <div
                        key={rev.id}
                        className="p-4 rounded-2xl bg-[#151822] border border-white/5 flex flex-col justify-between space-y-3"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-white">
                              {rev.author} ({rev.city})
                            </span>
                            <span className="text-amber-400 font-bold text-xs">{rev.rating} ⭐</span>
                          </div>
                          <p className="text-xs text-gray-300 italic">"{rev.comment}"</p>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs">
                          <button
                            type="button"
                            onClick={() => toggleReviewApproval(rev.id, !rev.isApproved)}
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
                              rev.isApproved
                                ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30'
                                : 'bg-zinc-800 text-zinc-400'
                            }`}
                          >
                            {rev.isApproved ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                            <span>{rev.isApproved ? 'معروض للعموم' : 'مخفي حالياً'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => deleteReview(rev.id)}
                            className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/20 cursor-pointer"
                            title="حذف"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {totalPages > 1 && (
                    <div className="flex items-center justify-between pt-2 px-4 py-3 rounded-2xl bg-[#151822] border border-white/5 text-xs">
                      <span className="text-gray-400">
                        الصفحة <strong className="text-white">{currentPage}</strong> من{' '}
                        <strong className="text-white">{totalPages}</strong>
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={currentPage <= 1}
                          onClick={() => setReviewsPage((p) => Math.max(1, p - 1))}
                          className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-200 border border-white/10 disabled:opacity-40 cursor-pointer"
                        >
                          السابق
                        </button>
                        <button
                          type="button"
                          disabled={currentPage >= totalPages}
                          onClick={() => setReviewsPage((p) => Math.min(totalPages, p + 1))}
                          className="px-3 py-1.5 rounded-xl bg-[#c5a869]/20 hover:bg-[#c5a869]/30 text-amber-300 border border-[#c5a869]/40 disabled:opacity-40 cursor-pointer"
                        >
                          التالي
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ================= TAB 5: STORE CUSTOMIZATION & POLICIES ================= */}
            {activeTab === 'settings' && localSettings && (
              <div className="space-y-6">
                {/* Header Action Bar */}
                <div className="p-5 rounded-2xl bg-[#151822] border border-white/5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <Settings className="w-5 h-5 text-[#c5a869]" />
                        <span>تخصيص المتجر، بيانات التواصل، والسياسات</span>
                      </h3>
                      <p className="text-xs text-gray-400 mt-1">
                        قم بتعديل البريد الإلكتروني الرسمي، روابط السوشيال ميديا، أرقام الهاتف وسياسات المتجر التي تظهر للزبناء
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={isSavingSettings}
                      onClick={() => handleSaveSettings(localSettings)}
                      className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl gold-gradient-bg text-black font-extrabold text-xs shadow-lg hover:brightness-110 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed transition cursor-pointer"
                    >
                      {isSavingSettings ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      <span>
                        {isSavingSettings ? 'جاري حفظ المعلومات...' : 'حفظ جميع التعديلات والسياسات'}
                      </span>
                    </button>
                  </div>

                  {settingsSaveFeedback && (
                    <div
                      role="status"
                      className={`p-3.5 rounded-xl text-xs font-bold flex items-center justify-between gap-3 ${
                        settingsSaveFeedback.type === 'success'
                          ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300'
                          : 'bg-rose-950/60 border border-rose-500/40 text-rose-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {settingsSaveFeedback.type === 'success' ? (
                          <CheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-400" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                        )}
                        <span>{settingsSaveFeedback.text}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSettingsSaveFeedback(null)}
                        className="p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
                        aria-label="إغلاق الإشعار"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* 0. Change Admin Dashboard Password */}
                <form
                  onSubmit={handleChangePassword}
                  className="p-6 rounded-2xl bg-[#151822] border border-[#c5a869]/30 space-y-5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-[#c5a869]/15 flex items-center justify-center text-[#c5a869]">
                        <Lock className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">تغيير كلمة مرور لوحة التحكم</h4>
                        <p className="text-[11px] text-gray-400">
                          قم بتعيين كلمة مرور خاصة بك لحماية لوحة الإدارة، ويتم حفظها مشفرة في قاعدة البيانات
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    {/* Current Password */}
                    <div>
                      <label className="block text-gray-300 font-semibold mb-1.5">
                        {authUser ? 'كلمة المرور الحالية (اختياري عبر Google)' : 'كلمة المرور الحالية *'}
                      </label>
                      <div className="relative">
                        <input
                          type={showCurrentPassword ? 'text' : 'password'}
                          required={!authUser}
                          value={currentPasswordInput}
                          onChange={(e) => {
                            setCurrentPasswordInput(e.target.value);
                            if (passwordChangeFeedback) setPasswordChangeFeedback(null);
                          }}
                          placeholder="أدخل كلمة المرور الحالية"
                          className="w-full bg-[#1b1f2b] border border-white/10 rounded-xl pl-10 pr-3.5 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#c5a869] text-left"
                          dir="ltr"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword((p) => !p)}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white cursor-pointer"
                          tabIndex={-1}
                        >
                          {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* New Password */}
                    <div>
                      <label className="block text-gray-300 font-semibold mb-1.5">كلمة المرور الجديدة *</label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          required
                          minLength={4}
                          value={newPasswordInput}
                          onChange={(e) => {
                            setNewPasswordInput(e.target.value);
                            if (passwordChangeFeedback) setPasswordChangeFeedback(null);
                          }}
                          placeholder="4 أحرف على الأقل"
                          className="w-full bg-[#1b1f2b] border border-white/10 rounded-xl pl-10 pr-3.5 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#c5a869] text-left"
                          dir="ltr"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword((p) => !p)}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white cursor-pointer"
                          tabIndex={-1}
                        >
                          {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm New Password */}
                    <div>
                      <label className="block text-gray-300 font-semibold mb-1.5">تأكيد كلمة المرور الجديدة *</label>
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        minLength={4}
                        value={confirmPasswordInput}
                        onChange={(e) => {
                          setConfirmPasswordInput(e.target.value);
                          if (passwordChangeFeedback) setPasswordChangeFeedback(null);
                        }}
                        placeholder="أعد كتابة كلمة المرور الجديدة"
                        className="w-full bg-[#1b1f2b] border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#c5a869] text-left"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  {passwordChangeFeedback && (
                    <div
                      className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                        passwordChangeFeedback.type === 'success'
                          ? 'bg-emerald-950/50 border border-emerald-500/30 text-emerald-300'
                          : 'bg-rose-950/50 border border-rose-500/30 text-rose-300'
                      }`}
                    >
                      {passwordChangeFeedback.type === 'success' ? (
                        <CheckCircle className="w-4 h-4 flex-shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      )}
                      <span>{passwordChangeFeedback.text}</span>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isChangingPassword}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#c5a869] hover:brightness-110 text-black font-extrabold text-xs shadow-lg disabled:opacity-50 cursor-pointer transition"
                    >
                      {isChangingPassword ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Lock className="w-4 h-4" />
                      )}
                      <span>{isChangingPassword ? 'جاري التحديث...' : 'تحديث كلمة مرور لوحة التحكم'}</span>
                    </button>
                  </div>
                </form>

                {/* 1. Official Email & Communication Channels */}
                <div className="p-6 rounded-2xl bg-[#151822] border border-white/5 space-y-5">
                  <div className="flex items-center gap-2.5 pb-3 border-b border-white/10">
                    <div className="w-8 h-8 rounded-lg bg-[#c5a869]/15 flex items-center justify-center text-[#c5a869]">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">البريد الإلكتروني الرسمي وبيانات التواصل المعتمدة</h4>
                      <p className="text-[11px] text-gray-400">تظهر في أسفل الموقع لتلقي استفسارات الزبناء الرسمية وتأكيد الطلبيات</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                    {/* Official Email */}
                    <div className="sm:col-span-2 lg:col-span-1">
                      <label className="block text-gray-300 font-semibold mb-1 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-[#c5a869]" />
                        <span>البريد الإلكتروني الرسمي للمتجر *</span>
                      </label>
                      <input
                        type="email"
                        value={localSettings.contactEmail || ''}
                        onChange={(e) =>
                          setLocalSettings({ ...localSettings, contactEmail: e.target.value })
                        }
                        placeholder="contact@noblewatch.ma"
                        className="w-full bg-[#1b1f2b] border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#c5a869] font-mono text-left"
                        dir="ltr"
                      />
                      <span className="text-[10px] text-gray-500 mt-1 block">يظهر في الفوتر ورسائل التواصل الرسمية للزبائن</span>
                    </div>

                    {/* Customer Support Phone */}
                    <div>
                      <label className="block text-gray-300 font-semibold mb-1 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-[#c5a869]" />
                        <span>هاتف خدمة العملاء والمتابعة</span>
                      </label>
                      <input
                        type="text"
                        value={localSettings.contactPhone || ''}
                        onChange={(e) =>
                          setLocalSettings({
                            ...localSettings,
                            contactPhone: sanitizePhoneText(e.target.value),
                          })
                        }
                        placeholder="+212 6 12 34 56 78"
                        className="w-full bg-[#1b1f2b] border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#c5a869] text-left font-mono"
                        dir="ltr"
                      />
                      <span className="text-[10px] text-gray-500 mt-1 block">رقم الاتصال المباشر المعروض في الهيدر والفوتر</span>
                    </div>

                    {/* WhatsApp Orders Number */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-gray-300 font-semibold flex items-center gap-1.5">
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                          <span>رقم الواتساب للطلبات والتأكيد السريع</span>
                        </label>
                        {formatPhoneForWhatsApp(localSettings.whatsappNumber || '') && (
                          <a
                            href={buildWhatsAppUrl(
                              localSettings.whatsappNumber,
                              'تجربة رابط واتساب خدمة العملاء - Noblewatch'
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-emerald-400 hover:underline flex items-center gap-1"
                          >
                            <span>تجربة فتح واتساب</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                      <input
                        type="text"
                        value={localSettings.whatsappNumber || ''}
                        onChange={(e) => {
                          const clean = sanitizePhoneText(e.target.value);
                          setLocalSettings({
                            ...localSettings,
                            whatsappNumber: clean,
                            socialLinks: {
                              ...(localSettings.socialLinks || {}),
                              whatsapp: clean,
                            },
                          });
                        }}
                        placeholder="+212612345678 أو 0612345678"
                        className="w-full bg-[#1b1f2b] border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500 text-left font-mono"
                        dir="ltr"
                      />
                      <span className="text-[10px] text-gray-500 mt-1 block">
                        الرقم المربوط بأزرار «تواصل معنا عبر واتساب» و«واتساب للطلب» (يتم تحويله تلقائياً إلى:{' '}
                        <span className="font-mono text-emerald-400" dir="ltr">
                          {formatPhoneForWhatsApp(localSettings.whatsappNumber || '') || '212612345678'}
                        </span>
                        )
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Official Social Media Channels */}
                <div className="p-6 rounded-2xl bg-[#151822] border border-white/5 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-pink-500/15 flex items-center justify-center text-pink-400">
                        <Globe className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">روابط مواقع التواصل الاجتماعي الرسمية للمتجر</h4>
                        <p className="text-[11px] text-gray-400">تفتح مباشرة عند نقر الزبناء على أيقونات التواصل الاجتماعي في الفوتر</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isSavingSettings}
                      onClick={() =>
                        handleSaveSettings(
                          localSettingsRef.current || localSettings,
                          'تم حفظ روابط التواصل الاجتماعي والإعدادات بنجاح وتطبيقها على الموقع.'
                        )
                      }
                      className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl gold-gradient-bg text-black font-extrabold text-xs shadow-lg hover:brightness-110 active:scale-95 disabled:opacity-50 cursor-pointer transition"
                    >
                      {isSavingSettings ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      <span>{isSavingSettings ? 'جاري الحفظ...' : 'حفظ روابط التواصل'}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    {/* Instagram */}
                    <div className="p-4 rounded-xl bg-[#1b1f2b] border border-white/5 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-gray-300 font-bold flex items-center gap-2">
                          <Instagram className="w-4 h-4 text-pink-400" />
                          <span>رابط حساب إنستغرام (Instagram)</span>
                        </label>
                        {localSettings.socialLinks?.instagram && (
                          <a
                            href={normalizeSocialUrlClient(localSettings.socialLinks.instagram)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-[#c5a869] hover:underline flex items-center gap-1"
                          >
                            <span>تجربة الرابط</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                      <input
                        type="text"
                        inputMode="url"
                        value={localSettings.socialLinks?.instagram || ''}
                        onChange={(e) =>
                          setLocalSettings({
                            ...localSettings,
                            socialLinks: {
                              ...(localSettings.socialLinks || {}),
                              instagram: e.target.value,
                            },
                          })
                        }
                        placeholder="https://instagram.com/noblewatch.ma"
                        className="w-full bg-[#151822] border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-pink-500 text-left font-mono"
                        dir="ltr"
                      />
                    </div>

                    {/* Facebook */}
                    <div className="p-4 rounded-xl bg-[#1b1f2b] border border-white/5 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-gray-300 font-bold flex items-center gap-2">
                          <Facebook className="w-4 h-4 text-blue-400" />
                          <span>رابط صفحة فيسبوك (Facebook)</span>
                        </label>
                        {localSettings.socialLinks?.facebook && (
                          <a
                            href={normalizeSocialUrlClient(localSettings.socialLinks.facebook)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-[#c5a869] hover:underline flex items-center gap-1"
                          >
                            <span>تجربة الرابط</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                      <input
                        type="text"
                        inputMode="url"
                        value={localSettings.socialLinks?.facebook || ''}
                        onChange={(e) =>
                          setLocalSettings({
                            ...localSettings,
                            socialLinks: {
                              ...(localSettings.socialLinks || {}),
                              facebook: e.target.value,
                            },
                          })
                        }
                        placeholder="https://facebook.com/noblewatch.ma"
                        className="w-full bg-[#151822] border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-blue-500 text-left font-mono"
                        dir="ltr"
                      />
                    </div>

                    {/* TikTok */}
                    <div className="p-4 rounded-xl bg-[#1b1f2b] border border-white/5 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-gray-300 font-bold flex items-center gap-2">
                          <svg className="w-4 h-4 fill-current text-cyan-400" viewBox="0 0 24 24">
                            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.81 4.48 6.26 6.26 0 0 0 1.9-4.48V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-.9-.07z"/>
                          </svg>
                          <span>رابط حساب تيك توك (TikTok)</span>
                        </label>
                        {localSettings.socialLinks?.tiktok && (
                          <a
                            href={normalizeSocialUrlClient(localSettings.socialLinks.tiktok)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-[#c5a869] hover:underline flex items-center gap-1"
                          >
                            <span>تجربة الرابط</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                      <input
                        type="text"
                        inputMode="url"
                        value={localSettings.socialLinks?.tiktok || ''}
                        onChange={(e) =>
                          setLocalSettings({
                            ...localSettings,
                            socialLinks: {
                              ...(localSettings.socialLinks || {}),
                              tiktok: e.target.value,
                            },
                          })
                        }
                        placeholder="https://tiktok.com/@noblewatch.ma"
                        className="w-full bg-[#151822] border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-500 text-left font-mono"
                        dir="ltr"
                      />
                    </div>

                    {/* YouTube */}
                    <div className="p-4 rounded-xl bg-[#1b1f2b] border border-white/5 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-gray-300 font-bold flex items-center gap-2">
                          <Youtube className="w-4 h-4 text-red-400" />
                          <span>رابط قناة يوتيوب (YouTube)</span>
                        </label>
                        {localSettings.socialLinks?.youtube && (
                          <a
                            href={normalizeSocialUrlClient(localSettings.socialLinks.youtube)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-[#c5a869] hover:underline flex items-center gap-1"
                          >
                            <span>تجربة الرابط</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                      <input
                        type="text"
                        inputMode="url"
                        value={localSettings.socialLinks?.youtube || ''}
                        onChange={(e) =>
                          setLocalSettings({
                            ...localSettings,
                            socialLinks: {
                              ...(localSettings.socialLinks || {}),
                              youtube: e.target.value,
                            },
                          })
                        }
                        placeholder="https://youtube.com/@noblewatch"
                        className="w-full bg-[#151822] border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-red-500 text-left font-mono"
                        dir="ltr"
                      />
                    </div>
                  </div>
                </div>

                {/* 2b. Facebook, Google & TikTok Pixel Tracking + Live Verification */}
                <div className="p-6 rounded-2xl bg-[#151822] border border-[#c5a869]/30 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-indigo-500/15 flex items-center justify-center text-indigo-400">
                        <Activity className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">
                          ربط بيكسل التتبع والإعلانات (Facebook Pixel, Google Pixel & TikTok Pixel)
                        </h4>
                        <p className="text-[11px] text-gray-400">
                          تتبع تلقائي لجميع أحداث التجارة الإلكترونية (مشاهدة المنتج، الإضافة للسلة، بدء الطلب، الشراء بعملة MAD)
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleSaveAndVerifyPixels}
                      disabled={isVerifyingPixels}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg disabled:opacity-50 cursor-pointer transition"
                    >
                      {isVerifyingPixels ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <ShieldCheck className="w-4 h-4" />
                      )}
                      <span>
                        {isVerifyingPixels
                          ? 'جاري الحفظ والفحص...'
                          : 'حفظ وفحص اشتغال البيكسل الآن'}
                      </span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-xs">
                    {/* Facebook / Meta Pixel Card */}
                    <div className="p-4 rounded-xl bg-[#1b1f2b] border border-white/10 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-blue-500/15 flex items-center justify-center text-blue-400">
                            <Facebook className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-white block">Facebook / Meta Pixel</span>
                            <span className="text-[10px] text-gray-400">Meta Ads Manager</span>
                          </div>
                        </div>

                        <label className="flex items-center gap-2 cursor-pointer">
                          <span className="text-[11px] text-gray-300 font-semibold">
                            {currentTrackingPixels.facebookEnabled ? 'مفعل' : 'معطل'}
                          </span>
                          <input
                            type="checkbox"
                            checked={Boolean(currentTrackingPixels.facebookEnabled)}
                            onChange={(e) =>
                              updateTrackingPixelField('facebookEnabled', e.target.checked)
                            }
                            className="w-4 h-4 accent-[#c5a869] cursor-pointer"
                          />
                        </label>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-gray-300 font-semibold">
                            معرف Facebook Pixel ID
                          </label>
                          {currentTrackingPixels.facebookPixelId && (
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                isValidFacebookPixelId(currentTrackingPixels.facebookPixelId)
                                  ? 'bg-emerald-500/15 text-emerald-300'
                                  : 'bg-rose-500/15 text-rose-300'
                              }`}
                            >
                              {isValidFacebookPixelId(currentTrackingPixels.facebookPixelId)
                                ? 'صيغة صحيحة'
                                : 'يجب أن يكون أرقاماً فقط (10-20 رقماً)'}
                            </span>
                          )}
                        </div>
                        <input
                          type="text"
                          value={currentTrackingPixels.facebookPixelId || ''}
                          onChange={(e) => {
                            const extracted = extractFacebookPixelId(e.target.value);
                            const wasValid = isValidFacebookPixelId(currentTrackingPixels.facebookPixelId);
                            if (!extracted) {
                              updateTrackingPixelFields({
                                facebookPixelId: '',
                                facebookEnabled: false,
                              });
                            } else if (!wasValid && isValidFacebookPixelId(extracted)) {
                              updateTrackingPixelFields({
                                facebookPixelId: extracted,
                                facebookEnabled: true,
                              });
                            } else {
                              updateTrackingPixelField('facebookPixelId', extracted);
                            }
                          }}
                          placeholder="مثال: 123456789012345 (أو الصق كود البيكسل)"
                          className="w-full bg-[#151822] border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-blue-500 text-left font-mono"
                          dir="ltr"
                        />
                        <p className="text-[10px] text-gray-500 mt-1">
                          الأحداث المرسلة تلقائياً: PageView، ViewContent، AddToCart، InitiateCheckout، Purchase
                        </p>
                      </div>

                      {/* Facebook Diagnostic Result */}
                      {pixelReport && (
                        <div
                          className={`p-3 rounded-xl border text-[11px] space-y-1.5 ${
                            !pixelReport.facebook.enabled
                              ? 'bg-gray-900/40 border-white/10 text-gray-400'
                              : pixelReport.facebook.scriptState === 'loaded' &&
                                pixelReport.facebook.sdkReady
                              ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                              : pixelReport.facebook.scriptState === 'blocked' &&
                                pixelReport.facebook.formatValid
                              ? 'bg-amber-950/40 border-amber-500/30 text-amber-300'
                              : !pixelReport.facebook.formatValid
                              ? 'bg-rose-950/40 border-rose-500/30 text-rose-300'
                              : 'bg-blue-950/40 border-blue-500/30 text-blue-300'
                          }`}
                        >
                          <div className="flex items-center justify-between font-bold">
                            <span className="flex items-center gap-1.5">
                              {!pixelReport.facebook.enabled ? (
                                <Clock className="w-3.5 h-3.5" />
                              ) : pixelReport.facebook.scriptState === 'loaded' &&
                                pixelReport.facebook.sdkReady ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              ) : pixelReport.facebook.scriptState === 'blocked' &&
                                pixelReport.facebook.formatValid ? (
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                              ) : (
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                              )}
                              <span>حالة Facebook Pixel:</span>
                            </span>
                            <span className="font-mono text-[10px]">
                              {pixelReport.facebook.sdkReady ? 'fbq() جاهز' : 'fbq غير مهيأ'}
                            </span>
                          </div>
                          <p className="leading-relaxed opacity-95">{pixelReport.facebook.note}</p>
                          {pixelReport.facebook.testEventDispatched && (
                            <div className="text-[10px] text-emerald-300 font-bold flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              <span>تم إرسال حدث اختباري (NoblewatchPixelVerify) بنجاح</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Google Pixel (GA4 / Google Ads / GTM) Card */}
                    <div className="p-4 rounded-xl bg-[#1b1f2b] border border-white/10 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-amber-500/15 flex items-center justify-center text-amber-400">
                            <BarChart3 className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-white block">
                              Google Pixel (Analytics / Ads / GTM)
                            </span>
                            <span className="text-[10px] text-gray-400">
                              يدعم G-XXXXXXXX و AW-XXXXXXXX و GTM-XXXXXXX
                            </span>
                          </div>
                        </div>

                        <label className="flex items-center gap-2 cursor-pointer">
                          <span className="text-[11px] text-gray-300 font-semibold">
                            {currentTrackingPixels.googleEnabled ? 'مفعل' : 'معطل'}
                          </span>
                          <input
                            type="checkbox"
                            checked={Boolean(currentTrackingPixels.googleEnabled)}
                            onChange={(e) =>
                              updateTrackingPixelField('googleEnabled', e.target.checked)
                            }
                            className="w-4 h-4 accent-[#c5a869] cursor-pointer"
                          />
                        </label>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-gray-300 font-semibold">
                              معرف Google Tag ID
                            </label>
                            {currentTrackingPixels.googleTagId && (
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  isValidGoogleTagId(currentTrackingPixels.googleTagId)
                                    ? 'bg-emerald-500/15 text-emerald-300'
                                    : 'bg-rose-500/15 text-rose-300'
                                }`}
                              >
                                {isValidGoogleTagId(currentTrackingPixels.googleTagId)
                                  ? getGoogleTagType(currentTrackingPixels.googleTagId).toUpperCase()
                                  : 'صيغة غير صالحة'}
                              </span>
                            )}
                          </div>
                          <input
                            type="text"
                            value={currentTrackingPixels.googleTagId || ''}
                            onChange={(e) => {
                              const extracted = extractGoogleTagId(e.target.value);
                              const wasValid = isValidGoogleTagId(currentTrackingPixels.googleTagId);
                              if (!extracted) {
                                updateTrackingPixelFields({
                                  googleTagId: '',
                                  googleEnabled: false,
                                });
                              } else if (!wasValid && isValidGoogleTagId(extracted)) {
                                updateTrackingPixelFields({
                                  googleTagId: extracted,
                                  googleEnabled: true,
                                });
                              } else {
                                updateTrackingPixelField('googleTagId', extracted);
                              }
                            }}
                            placeholder="G-XXXXXXXXXX أو AW-123456789"
                            className="w-full bg-[#151822] border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-500 text-left font-mono"
                            dir="ltr"
                          />
                        </div>

                        <div>
                          <label className="block text-gray-300 font-semibold mb-1">
                            رمز تحويل Google Ads (اختياري)
                          </label>
                          <input
                            type="text"
                            value={currentTrackingPixels.googleAdsConversionLabel || ''}
                            onChange={(e) =>
                              updateTrackingPixelField(
                                'googleAdsConversionLabel',
                                e.target.value.trim()
                              )
                            }
                            placeholder="مثال: AbCdEfGhIjK12345"
                            className="w-full bg-[#151822] border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-500 text-left font-mono"
                            dir="ltr"
                          />
                        </div>
                      </div>

                      <p className="text-[10px] text-gray-500">
                        الأحداث المرسلة تلقائياً: page_view، view_item، add_to_cart، begin_checkout، purchase
                      </p>

                      {/* Google Diagnostic Result */}
                      {pixelReport && (
                        <div
                          className={`p-3 rounded-xl border text-[11px] space-y-1.5 ${
                            !pixelReport.google.enabled
                              ? 'bg-gray-900/40 border-white/10 text-gray-400'
                              : pixelReport.google.scriptState === 'loaded' &&
                                pixelReport.google.sdkReady
                              ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                              : pixelReport.google.scriptState === 'blocked' &&
                                pixelReport.google.formatValid
                              ? 'bg-amber-950/40 border-amber-500/30 text-amber-300'
                              : !pixelReport.google.formatValid
                              ? 'bg-rose-950/40 border-rose-500/30 text-rose-300'
                              : 'bg-blue-950/40 border-blue-500/30 text-blue-300'
                          }`}
                        >
                          <div className="flex items-center justify-between font-bold">
                            <span className="flex items-center gap-1.5">
                              {!pixelReport.google.enabled ? (
                                <Clock className="w-3.5 h-3.5" />
                              ) : pixelReport.google.scriptState === 'loaded' &&
                                pixelReport.google.sdkReady ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              ) : pixelReport.google.scriptState === 'blocked' &&
                                pixelReport.google.formatValid ? (
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                              ) : (
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                              )}
                              <span>حالة Google Pixel:</span>
                            </span>
                            <span className="font-mono text-[10px]">
                              {pixelReport.google.sdkReady ? 'gtag / dataLayer جاهز' : 'غير مهيأ'}
                            </span>
                          </div>
                          <p className="leading-relaxed opacity-95">{pixelReport.google.note}</p>
                          {pixelReport.google.testEventDispatched && (
                            <div className="text-[10px] text-emerald-300 font-bold flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              <span>تم إرسال حدث اختباري (pixel_verification_test) بنجاح</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* TikTok Pixel Card */}
                    <div className="p-4 rounded-xl bg-[#1b1f2b] border border-white/10 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-pink-500/15 flex items-center justify-center text-pink-400">
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                            </svg>
                          </div>
                          <div>
                            <span className="font-bold text-white block">TikTok Pixel</span>
                            <span className="text-[10px] text-gray-400">TikTok Ads Manager</span>
                          </div>
                        </div>

                        <label className="flex items-center gap-2 cursor-pointer">
                          <span className="text-[11px] text-gray-300 font-semibold">
                            {currentTrackingPixels.tiktokEnabled ? 'مفعل' : 'معطل'}
                          </span>
                          <input
                            type="checkbox"
                            checked={Boolean(currentTrackingPixels.tiktokEnabled)}
                            onChange={(e) =>
                              updateTrackingPixelField('tiktokEnabled', e.target.checked)
                            }
                            className="w-4 h-4 accent-[#c5a869] cursor-pointer"
                          />
                        </label>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-gray-300 font-semibold">
                            معرف TikTok Pixel ID
                          </label>
                          {currentTrackingPixels.tiktokPixelId && (
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                isValidTiktokPixelId(currentTrackingPixels.tiktokPixelId)
                                  ? 'bg-emerald-500/15 text-emerald-300'
                                  : 'bg-rose-500/15 text-rose-300'
                              }`}
                            >
                              {isValidTiktokPixelId(currentTrackingPixels.tiktokPixelId)
                                ? 'صيغة صحيحة'
                                : 'صيغة غير صالحة (10-30 حرفاً ورقماً)'}
                            </span>
                          )}
                        </div>
                        <input
                          type="text"
                          value={currentTrackingPixels.tiktokPixelId || ''}
                          onChange={(e) => {
                            const extracted = extractTiktokPixelId(e.target.value);
                            const wasValid = isValidTiktokPixelId(currentTrackingPixels.tiktokPixelId);
                            if (!extracted) {
                              updateTrackingPixelFields({
                                tiktokPixelId: '',
                                tiktokEnabled: false,
                              });
                            } else if (!wasValid && isValidTiktokPixelId(extracted)) {
                              updateTrackingPixelFields({
                                tiktokPixelId: extracted,
                                tiktokEnabled: true,
                              });
                            } else {
                              updateTrackingPixelField('tiktokPixelId', extracted);
                            }
                          }}
                          placeholder="مثال: CXXXXXXXXXXXXXXX (أو الصق كود البيكسل)"
                          className="w-full bg-[#151822] border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-pink-500 text-left font-mono"
                          dir="ltr"
                        />
                        <p className="text-[10px] text-gray-500 mt-1">
                          الأحداث المرسلة تلقائياً: PageView، ViewContent، AddToCart، InitiateCheckout، CompletePayment
                        </p>
                      </div>

                      {/* TikTok Diagnostic Result */}
                      {pixelReport && (
                        <div
                          className={`p-3 rounded-xl border text-[11px] space-y-1.5 ${
                            !pixelReport.tiktok.enabled
                              ? 'bg-gray-900/40 border-white/10 text-gray-400'
                              : pixelReport.tiktok.scriptState === 'loaded' &&
                                pixelReport.tiktok.sdkReady
                              ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                              : pixelReport.tiktok.scriptState === 'blocked' &&
                                pixelReport.tiktok.formatValid
                              ? 'bg-amber-950/40 border-amber-500/30 text-amber-300'
                              : !pixelReport.tiktok.formatValid
                              ? 'bg-rose-950/40 border-rose-500/30 text-rose-300'
                              : 'bg-blue-950/40 border-blue-500/30 text-blue-300'
                          }`}
                        >
                          <div className="flex items-center justify-between font-bold">
                            <span className="flex items-center gap-1.5">
                              {!pixelReport.tiktok.enabled ? (
                                <Clock className="w-3.5 h-3.5" />
                              ) : pixelReport.tiktok.scriptState === 'loaded' &&
                                pixelReport.tiktok.sdkReady ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              ) : pixelReport.tiktok.scriptState === 'blocked' &&
                                pixelReport.tiktok.formatValid ? (
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                              ) : (
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                              )}
                              <span>حالة TikTok Pixel:</span>
                            </span>
                            <span className="font-mono text-[10px]">
                              {pixelReport.tiktok.sdkReady ? 'ttq() جاهز' : 'ttq غير مهيأ'}
                            </span>
                          </div>
                          <p className="leading-relaxed opacity-95">{pixelReport.tiktok.note}</p>
                          {pixelReport.tiktok.testEventDispatched && (
                            <div className="text-[10px] text-emerald-300 font-bold flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              <span>تم إرسال حدث اختباري (NoblewatchPixelVerify) بنجاح</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2c. Promo / Discount Codes Manager */}
                <div className="p-6 rounded-2xl bg-[#151822] border border-[#c5a869]/30 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#c5a869]/15 flex items-center justify-center text-[#c5a869]">
                        <Tag className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">
                          أكواد ورموز التخفيض للزبناء (Promo Codes)
                        </h4>
                        <p className="text-[11px] text-gray-400">
                          أنشئ وفعّل رموز الخصم التي يستعملها الزبناء في صفحة تأكيد الطلب (مثال: NOBLE10)
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Add new promo code row */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end text-xs bg-[#1b1f2b] p-4 rounded-xl border border-white/5">
                    <div className="sm:col-span-4">
                      <label className="block text-gray-400 mb-1 font-semibold">رمز التخفيض (Code)</label>
                      <input
                        type="text"
                        value={newPromoCodeInput}
                        onChange={(e) => setNewPromoCodeInput(e.target.value.toUpperCase())}
                        placeholder="مثال: EID15"
                        dir="ltr"
                        className="w-full bg-[#151822] border border-white/10 rounded-xl px-3 py-2 text-white font-mono uppercase focus:outline-none focus:border-[#c5a869]"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="block text-gray-400 mb-1 font-semibold">نوع الخصم</label>
                      <select
                        value={newPromoTypeInput}
                        onChange={(e) => setNewPromoTypeInput(e.target.value as 'percent' | 'fixed')}
                        className="w-full bg-[#151822] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#c5a869]"
                      >
                        <option value="percent">نسبة مئوية (%)</option>
                        <option value="fixed">مبلغ ثابت (MAD)</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-gray-400 mb-1 font-semibold">القيمة</label>
                      <input
                        type="number"
                        min={1}
                        max={newPromoTypeInput === 'percent' ? 90 : 5000}
                        value={newPromoValueInput}
                        onChange={(e) => setNewPromoValueInput(e.target.value)}
                        dir="ltr"
                        className="w-full bg-[#151822] border border-white/10 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-[#c5a869]"
                      />
                    </div>
                    <div className="sm:col-span-3 flex gap-2">
                      <button
                        type="button"
                        onClick={async () => {
                          const code = newPromoCodeInput.trim().toUpperCase();
                          const val = Number(newPromoValueInput) || 0;
                          const minAmt = Math.max(0, Number(newPromoMinOrderInput) || 0);
                          if (!code || code.length < 3) {
                            showToast('يرجى كتابة رمز تخفيض مكون من 3 أحرف على الأقل', 'error');
                            return;
                          }
                          if (val <= 0) {
                            showToast('يرجى تحديد قيمة خصم صحيحة', 'error');
                            return;
                          }
                          const existing: PromoCode[] = Array.isArray(localSettings.promoCodes)
                            ? localSettings.promoCodes
                            : [{ code: 'NOBLE10', type: 'percent', value: 10, active: true, minOrderAmount: 0 }];
                          const nextRule: PromoCode = {
                            code,
                            type: newPromoTypeInput,
                            value: newPromoTypeInput === 'percent' ? Math.min(90, val) : val,
                            active: true,
                            minOrderAmount: minAmt,
                          };
                          const nextList = [
                            ...existing.filter((p) => p.code.toUpperCase() !== code),
                            nextRule,
                          ];
                          const updated = { ...localSettings, promoCodes: nextList };
                          setLocalSettings(updated);
                          const ok = await handleSaveSettings(
                            updated,
                            `تم حفظ رمز التخفيض ${code} بنجاح وتفعيله في صفحة الطلب.`
                          );
                          if (ok) {
                            setNewPromoCodeInput('');
                          }
                        }}
                        className="w-full py-2 px-3 rounded-xl gold-gradient-bg text-black font-extrabold flex items-center justify-center gap-1.5 cursor-pointer hover:brightness-105"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>إضافة وحفظ</span>
                      </button>
                    </div>
                  </div>

                  {/* Active Promo Codes List */}
                  <div className="space-y-2 text-xs">
                    {(Array.isArray(localSettings.promoCodes) && localSettings.promoCodes.length > 0
                      ? localSettings.promoCodes
                      : [{ code: 'NOBLE10', type: 'percent' as const, value: 10, active: true, minOrderAmount: 0 }]
                    ).map((promo) => (
                      <div
                        key={promo.code}
                        className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-[#1b1f2b] border border-white/5"
                      >
                        <div className="flex items-center gap-3">
                          <span className="px-2.5 py-1 rounded-lg bg-[#c5a869]/15 border border-[#c5a869]/40 text-[#f3d999] font-mono font-black" dir="ltr">
                            {promo.code}
                          </span>
                          <span className="text-white font-bold">
                            خصم {promo.value} {promo.type === 'percent' ? '%' : 'MAD'}
                          </span>
                          {Number(promo.minOrderAmount) > 0 && (
                            <span className="text-gray-400 text-[11px]">
                              (الحد الأدنى: {promo.minOrderAmount} MAD)
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={() => setPreviewPromoVoucher(promo)}
                            className="px-3 py-1 rounded-lg bg-[#c5a869]/15 hover:bg-[#c5a869]/25 text-[#f3d999] border border-[#c5a869]/50 font-extrabold text-[11px] flex items-center gap-1.5 cursor-pointer transition"
                            title="معاينة وتحميل بطاقة رمز التخفيض لإرسالها للزبناء"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>تحميل بطاقة للزبون</span>
                          </button>

                          <button
                            type="button"
                            onClick={async () => {
                              const currentList: PromoCode[] = Array.isArray(localSettings.promoCodes)
                                ? localSettings.promoCodes
                                : [{ code: 'NOBLE10', type: 'percent', value: 10, active: true, minOrderAmount: 0 }];
                              const nextList = currentList.map((p) =>
                                p.code === promo.code ? { ...p, active: !p.active } : p
                              );
                              const updated = { ...localSettings, promoCodes: nextList };
                              setLocalSettings(updated);
                              await handleSaveSettings(
                                updated,
                                `تم تحديث حالة رمز التخفيض ${promo.code} وحفظه بنجاح.`
                              );
                            }}
                            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] cursor-pointer ${
                              promo.active
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-gray-700/40 text-gray-400 border border-white/10'
                            }`}
                          >
                            {promo.active ? 'مفعل' : 'معطل'}
                          </button>

                          <button
                            type="button"
                            onClick={async () => {
                              const currentList: PromoCode[] = Array.isArray(localSettings.promoCodes)
                                ? localSettings.promoCodes
                                : [{ code: 'NOBLE10', type: 'percent', value: 10, active: true, minOrderAmount: 0 }];
                              const nextList = currentList.filter((p) => p.code !== promo.code);
                              const updated = { ...localSettings, promoCodes: nextList };
                              setLocalSettings(updated);
                              await handleSaveSettings(
                                updated,
                                `تم حذف رمز التخفيض ${promo.code} وحفظ التغييرات بنجاح.`
                              );
                            }}
                            className="p-1.5 rounded-lg bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 cursor-pointer"
                            title="حذف الرمز"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Official Store Policies */}
                <div className="p-6 rounded-2xl bg-[#151822] border border-white/5 space-y-5">
                  <div className="flex items-center gap-2.5 pb-3 border-b border-white/10">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center text-blue-400">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">السياسات القانونية للمتجر (Store Policies)</h4>
                      <p className="text-[11px] text-gray-400">النصوص التي تظهر للزبائن عند فتح روابط شروط الاستخدام والضمان والإرجاع</p>
                    </div>
                  </div>

                  <div className="space-y-4 text-xs">
                    {/* Privacy Policy */}
                    <div>
                      <label className="block text-gray-300 font-bold mb-1.5 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>سياسة الخصوصية وحماية بيانات الزبائن</span>
                      </label>
                      <textarea
                        rows={3}
                        value={localSettings.policies?.privacy || ''}
                        onChange={(e) =>
                          setLocalSettings({
                            ...localSettings,
                            policies: {
                              ...(localSettings.policies || {
                                privacy: '',
                                terms: '',
                                shipping: '',
                                returns: '',
                                warranty: '',
                              }),
                              privacy: e.target.value,
                            },
                          })
                        }
                        className="w-full bg-[#1b1f2b] border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-[#c5a869] leading-relaxed"
                        placeholder="اكتب نص سياسة الخصوصية..."
                      />
                    </div>

                    {/* Terms of Service */}
                    <div>
                      <label className="block text-gray-300 font-bold mb-1.5 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-blue-400" />
                        <span>شروط الاستخدام وأحكام الطلب</span>
                      </label>
                      <textarea
                        rows={3}
                        value={localSettings.policies?.terms || ''}
                        onChange={(e) =>
                          setLocalSettings({
                            ...localSettings,
                            policies: {
                              ...(localSettings.policies || {
                                privacy: '',
                                terms: '',
                                shipping: '',
                                returns: '',
                                warranty: '',
                              }),
                              terms: e.target.value,
                            },
                          })
                        }
                        className="w-full bg-[#1b1f2b] border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-[#c5a869] leading-relaxed"
                        placeholder="اكتب شروط وأحكام الطلب..."
                      />
                    </div>

                    {/* Shipping Policy */}
                    <div>
                      <label className="block text-gray-300 font-bold mb-1.5 flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5 text-amber-400" />
                        <span>سياسة التوصيل والشحن لجميع أنحاء المغرب 🇲🇦</span>
                      </label>
                      <textarea
                        rows={3}
                        value={localSettings.policies?.shipping || ''}
                        onChange={(e) =>
                          setLocalSettings({
                            ...localSettings,
                            policies: {
                              ...(localSettings.policies || {
                                privacy: '',
                                terms: '',
                                shipping: '',
                                returns: '',
                                warranty: '',
                              }),
                              shipping: e.target.value,
                            },
                          })
                        }
                        className="w-full bg-[#1b1f2b] border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-[#c5a869] leading-relaxed"
                        placeholder="اكتب سياسة الشحن والتوصيل..."
                      />
                    </div>

                    {/* Returns & Replacement Policy */}
                    <div>
                      <label className="block text-gray-300 font-bold mb-1.5 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-indigo-400" />
                        <span>سياسة الاستبدال والإرجاع (7 أيام)</span>
                      </label>
                      <textarea
                        rows={3}
                        value={localSettings.policies?.returns || ''}
                        onChange={(e) =>
                          setLocalSettings({
                            ...localSettings,
                            policies: {
                              ...(localSettings.policies || {
                                privacy: '',
                                terms: '',
                                shipping: '',
                                returns: '',
                                warranty: '',
                              }),
                              returns: e.target.value,
                            },
                          })
                        }
                        className="w-full bg-[#1b1f2b] border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-[#c5a869] leading-relaxed"
                        placeholder="اكتب سياسة الاستبدال والإرجاع..."
                      />
                    </div>

                    {/* Warranty Policy */}
                    <div>
                      <label className="block text-gray-300 font-bold mb-1.5 flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                        <span>سياسة الضمان الرسمي المعتمد (ضمان لمدة سنة)</span>
                      </label>
                      <textarea
                        rows={3}
                        value={localSettings.policies?.warranty || ''}
                        onChange={(e) =>
                          setLocalSettings({
                            ...localSettings,
                            policies: {
                              ...(localSettings.policies || {
                                privacy: '',
                                terms: '',
                                shipping: '',
                                returns: '',
                                warranty: '',
                              }),
                              warranty: e.target.value,
                            },
                          })
                        }
                        className="w-full bg-[#1b1f2b] border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-[#c5a869] leading-relaxed"
                        placeholder="اكتب شروط وبنود الضمان الرسمي..."
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Store Branding & Homepage Visuals */}
                <div className="p-6 rounded-2xl bg-[#151822] border border-white/5 space-y-5">
                  <div className="flex items-center gap-2.5 pb-3 border-b border-white/10">
                    <div className="w-8 h-8 rounded-lg bg-[#c5a869]/15 flex items-center justify-center text-[#c5a869]">
                      <LayoutDashboard className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">هوية المتجر والشريط العلوي والواجهة</h4>
                      <p className="text-[11px] text-gray-400">تخصيص نصوص وصور الواجهة الرئيسية الترويجية</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block text-gray-300 font-semibold mb-1">اسم العلامة التجارية</label>
                      <input
                        type="text"
                        value={localSettings.storeName || ''}
                        onChange={(e) =>
                          setLocalSettings({ ...localSettings, storeName: e.target.value })
                        }
                        className="w-full bg-[#1b1f2b] border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#c5a869]"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-300 font-semibold mb-1">شعار / رسالة الشريط العلوي</label>
                      <input
                        type="text"
                        value={localSettings.announcementText || ''}
                        onChange={(e) =>
                          setLocalSettings({ ...localSettings, announcementText: e.target.value })
                        }
                        className="w-full bg-[#1b1f2b] border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#c5a869]"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-300 font-semibold mb-1">المقر الرئيسي ومستودع الشحن</label>
                      <input
                        type="text"
                        value={localSettings.city || ''}
                        onChange={(e) =>
                          setLocalSettings({ ...localSettings, city: e.target.value })
                        }
                        placeholder="الدار البيضاء، المملكة المغربية 🇲🇦"
                        className="w-full bg-[#1b1f2b] border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#c5a869]"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-300 font-semibold mb-1">شعار المتجر (Tagline)</label>
                      <input
                        type="text"
                        value={localSettings.tagline || ''}
                        onChange={(e) =>
                          setLocalSettings({ ...localSettings, tagline: e.target.value })
                        }
                        placeholder="أناقة متكاملة بجميع أنواع الساعات والإكسسوارات الفاخرة"
                        className="w-full bg-[#1b1f2b] border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#c5a869]"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-gray-300 font-semibold mb-1">عنوان الواجهة الترويجية (Hero Title)</label>
                      <input
                        type="text"
                        value={localSettings.heroTitle || ''}
                        onChange={(e) =>
                          setLocalSettings({ ...localSettings, heroTitle: e.target.value })
                        }
                        className="w-full bg-[#1b1f2b] border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#c5a869]"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-gray-300 font-semibold mb-1">وصف الواجهة (Hero Subtitle)</label>
                      <textarea
                        rows={2}
                        value={localSettings.heroSubtitle || ''}
                        onChange={(e) =>
                          setLocalSettings({ ...localSettings, heroSubtitle: e.target.value })
                        }
                        className="w-full bg-[#1b1f2b] border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#c5a869]"
                      />
                    </div>

                    <div className="sm:col-span-2 pt-2 border-t border-white/10">
                      <ImageUploader
                        images={localSettings.heroImage ? [localSettings.heroImage] : []}
                        onChange={(imgs) => {
                          if (imgs.length > 0) {
                            setLocalSettings({ ...localSettings, heroImage: imgs[0] });
                          }
                        }}
                        maxImages={1}
                        allowMultiple={false}
                        label="صورة واجهة المتجر الرئيسية (من الحاسوب)"
                        helperText="قم باختيار أو سحب صورة ساعة يد من جهاز الكمبيوتر لتعيينها كصورة رئيسية لواجهة المتجر."
                      />
                    </div>
                  </div>
                </div>

                {/* 5. Order Security Shield (Anti-Duplicate, Anti-Fake, Anti-Bot) */}
                <div className="p-6 rounded-2xl bg-[#151822] border border-emerald-500/25 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-400">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">
                          درع الحماية: منع الطلبات المتكررة والمزيفة والروبوتات
                        </h4>
                        <p className="text-[11px] text-gray-400">
                          حماية متقدمة في الخادم واستمارة الطلب تمنع التكرار، الأرقام/الأسماء الوهمية، وهجمات الروبوتات تلقائياً
                        </p>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold self-start sm:self-auto">
                      محجوب حتى الآن: {securityLogs.length} محاولة
                    </span>
                  </div>

                  {/* Protection Toggles & Thresholds */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    {/* Prevent Duplicate Orders */}
                    <div className="p-4 rounded-xl bg-[#1b1f2b] border border-white/5 space-y-3">
                      <label className="flex items-center justify-between cursor-pointer">
                        <span className="font-bold text-white">منع الطلبات المتكررة (نفس الرقم والمنتج)</span>
                        <input
                          type="checkbox"
                          checked={currentOrderSecurity.preventDuplicates}
                          onChange={(e) => updateOrderSecurityField('preventDuplicates', e.target.checked)}
                          className="w-4 h-4 accent-[#c5a869] cursor-pointer"
                        />
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] text-gray-400 mb-1">نافذة منع التكرار (ساعة)</label>
                          <input
                            type="number"
                            min={1}
                            max={168}
                            value={currentOrderSecurity.duplicateWindowHours}
                            onChange={(e) =>
                              updateOrderSecurityField('duplicateWindowHours', Math.max(1, Number(e.target.value) || 24))
                            }
                            className="w-full bg-[#151822] border border-white/10 rounded-lg px-2.5 py-1.5 text-white font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-gray-400 mb-1">فترة التهدئة السريعة (دقيقة)</label>
                          <input
                            type="number"
                            min={1}
                            max={60}
                            value={currentOrderSecurity.rapidCooldownMinutes}
                            onChange={(e) =>
                              updateOrderSecurityField('rapidCooldownMinutes', Math.max(1, Number(e.target.value) || 5))
                            }
                            className="w-full bg-[#151822] border border-white/10 rounded-lg px-2.5 py-1.5 text-white font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Prevent Fake Orders */}
                    <div className="p-4 rounded-xl bg-[#1b1f2b] border border-white/5 space-y-3">
                      <label className="flex items-center justify-between cursor-pointer">
                        <span className="font-bold text-white">منع الطلبات المزيفة والوهمية</span>
                        <input
                          type="checkbox"
                          checked={currentOrderSecurity.preventFakeOrders}
                          onChange={(e) => updateOrderSecurityField('preventFakeOrders', e.target.checked)}
                          className="w-4 h-4 accent-[#c5a869] cursor-pointer"
                        />
                      </label>
                      <p className="text-[11px] text-gray-400 leading-relaxed">
                        يرفض تلقائياً الأرقام المزيفة (مثل 0600000000 أو 0612345678)، الأسماء التجريبية (test, تجربة...)، والرموز العشوائية في الاسم أو العنوان.
                      </p>
                    </div>

                    {/* Prevent Bots */}
                    <div className="p-4 rounded-xl bg-[#1b1f2b] border border-white/5 space-y-3">
                      <label className="flex items-center justify-between cursor-pointer">
                        <span className="font-bold text-white">حماية شاملة ضد الروبوتات (Anti-Bot)</span>
                        <input
                          type="checkbox"
                          checked={currentOrderSecurity.preventBots}
                          onChange={(e) => updateOrderSecurityField('preventBots', e.target.checked)}
                          className="w-4 h-4 accent-[#c5a869] cursor-pointer"
                        />
                      </label>
                      <p className="text-[11px] text-gray-400 leading-relaxed">
                        يعمل بصمت في الخلفية بدون إزعاج الزبائن عبر الحقل المخفي (Honeypot)، فحص سرعة التعبئة والتفاعل البشري، وحظر المتصفحات الآلية.
                      </p>
                    </div>

                    {/* Auto-block high cancel + IP Rate limit */}
                    <div className="p-4 rounded-xl bg-[#1b1f2b] border border-white/5 space-y-3">
                      <label className="flex items-center justify-between cursor-pointer">
                        <span className="font-bold text-white">حظر تلقائي للأرقام كثيرة الإلغاء</span>
                        <input
                          type="checkbox"
                          checked={currentOrderSecurity.autoBlockHighCancelPhones}
                          onChange={(e) =>
                            updateOrderSecurityField('autoBlockHighCancelPhones', e.target.checked)
                          }
                          className="w-4 h-4 accent-[#c5a869] cursor-pointer"
                        />
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] text-gray-400 mb-1">حد الطلبات الملغاة للحظر</label>
                          <input
                            type="number"
                            min={1}
                            max={10}
                            value={currentOrderSecurity.autoBlockCancelThreshold}
                            onChange={(e) =>
                              updateOrderSecurityField(
                                'autoBlockCancelThreshold',
                                Math.max(1, Number(e.target.value) || 2)
                              )
                            }
                            className="w-full bg-[#151822] border border-white/10 rounded-lg px-2.5 py-1.5 text-white font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-gray-400 mb-1">حد الطلبات/ساعة لنفس الجهاز</label>
                          <input
                            type="number"
                            min={1}
                            max={30}
                            value={currentOrderSecurity.maxOrdersPerIpPerHour}
                            onChange={(e) =>
                              updateOrderSecurityField(
                                'maxOrdersPerIpPerHour',
                                Math.max(1, Number(e.target.value) || 4)
                              )
                            }
                            className="w-full bg-[#151822] border border-white/10 rounded-lg px-2.5 py-1.5 text-white font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Manual Blacklist Phones */}
                  <div className="p-4 rounded-xl bg-[#1b1f2b] border border-white/5 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
                          <Ban className="w-3.5 h-3.5 text-rose-400" />
                          <span>القائمة السوداء للأرقام المحظورة ({(currentOrderSecurity.blockedPhones || []).length})</span>
                        </h5>
                        <p className="text-[11px] text-gray-400">
                          أي رقم مضاف هنا سيتم رفض طلباته تلقائياً في المتجر
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="tel"
                          value={manualBlockPhoneInput}
                          onChange={(e) => setManualBlockPhoneInput(e.target.value)}
                          placeholder="06XXXXXXXX"
                          dir="ltr"
                          className="bg-[#151822] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white font-mono w-40 focus:outline-none focus:border-rose-400"
                        />
                        <button
                          type="button"
                          onClick={() => handleBlockPhone(manualBlockPhoneInput)}
                          className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition cursor-pointer"
                        >
                          حظر الرقم
                        </button>
                      </div>
                    </div>

                    {(currentOrderSecurity.blockedPhones || []).length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
                        {(currentOrderSecurity.blockedPhones || []).map((bp) => (
                          <span
                            key={bp}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 font-mono text-xs font-bold"
                          >
                            <span>{bp}</span>
                            <button
                              type="button"
                              onClick={() => handleUnblockPhone(bp)}
                              className="text-rose-200 hover:text-white cursor-pointer"
                              title="إلغاء الحظر"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Blocked Attempts Security Log */}
                  <div className="p-4 rounded-xl bg-[#1b1f2b] border border-white/5 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <ShieldAlert className="w-4 h-4 text-amber-400" />
                        <span>سجل المحاولات المرفوضة تلقائياً (آخر المحاولات)</span>
                      </h5>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={fetchSecurityOverview}
                          disabled={isLoadingSecurityLogs}
                          className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <RefreshCw className={`w-3 h-3 ${isLoadingSecurityLogs ? 'animate-spin' : ''}`} />
                          <span>تحديث</span>
                        </button>
                        {securityLogs.length > 0 && (
                          <button
                            type="button"
                            onClick={handleClearSecurityLogs}
                            className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-[11px] font-bold cursor-pointer"
                          >
                            مسح السجل
                          </button>
                        )}
                      </div>
                    </div>

                    {securityLogs.length === 0 ? (
                      <p className="text-xs text-gray-400 py-3 text-center">
                        لم يتم رصد أي محاولة طلب مكرر أو مزيف أو روبوت حتى الآن. الدرع يعمل في الخلفية بنجاح.
                      </p>
                    ) : (
                      <div className="max-h-60 overflow-y-auto space-y-2 pl-1">
                        {securityLogs.slice(0, 30).map((log) => (
                          <div
                            key={log.id}
                            className="p-2.5 rounded-xl bg-[#151822] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]"
                          >
                            <div className="space-y-0.5">
                              <div className="flex flex-wrap items-center gap-2">
                                <span
                                  className={`px-2 py-0.5 rounded-md font-bold ${
                                    log.reasonType === 'bot'
                                      ? 'bg-purple-500/20 text-purple-300'
                                      : log.reasonType === 'duplicate'
                                      ? 'bg-cyan-500/20 text-cyan-300'
                                      : log.reasonType === 'fake'
                                      ? 'bg-amber-500/20 text-amber-300'
                                      : log.reasonType === 'blacklist'
                                      ? 'bg-rose-500/20 text-rose-300'
                                      : 'bg-orange-500/20 text-orange-300'
                                  }`}
                                >
                                  {log.reasonType === 'bot'
                                    ? '🤖 روبوت'
                                    : log.reasonType === 'duplicate'
                                    ? '🔁 طلب مكرر'
                                    : log.reasonType === 'fake'
                                    ? '⚠️ طلب مزيف'
                                    : log.reasonType === 'blacklist'
                                    ? '⛔ رقم محظور'
                                    : '⏱️ تجاوز الحد'}
                                </span>
                                <span className="font-bold text-white">{log.reasonMessage}</span>
                              </div>
                              <div className="text-gray-400 flex flex-wrap gap-2">
                                {log.customerName && <span>الاسم: {log.customerName}</span>}
                                {log.phone && <span className="font-mono">الهاتف: {log.phone}</span>}
                                {log.city && <span>المدينة: {log.city}</span>}
                              </div>
                            </div>
                            <span className="text-gray-500 font-mono text-[10px] flex-shrink-0">
                              {new Date(log.time).toLocaleString('ar-MA')}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Save Button */}
                <div className="p-5 rounded-2xl bg-[#151822] border border-white/5 space-y-4">
                  {settingsSaveFeedback && (
                    <div
                      role="status"
                      className={`p-3.5 rounded-xl text-xs font-bold flex items-center justify-between gap-3 ${
                        settingsSaveFeedback.type === 'success'
                          ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300'
                          : 'bg-rose-950/60 border border-rose-500/40 text-rose-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {settingsSaveFeedback.type === 'success' ? (
                          <CheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-400" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                        )}
                        <span>{settingsSaveFeedback.text}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSettingsSaveFeedback(null)}
                        className="p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
                        aria-label="إغلاق الإشعار"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <span className="text-xs text-gray-400">
                      💡 احرص على حفظ التغييرات ليتم تطبيقها فوراً على كامل صفحات الموقع
                    </span>
                    <button
                      type="button"
                      disabled={isSavingSettings}
                      onClick={() => handleSaveSettings(localSettings)}
                      className="flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl gold-gradient-bg text-black font-extrabold text-sm shadow-xl hover:brightness-110 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed transition cursor-pointer"
                    >
                      {isSavingSettings ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      <span>
                        {isSavingSettings ? 'جاري حفظ المعلومات...' : 'حفظ جميع التعديلات والسياسات'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>

        {/* ================= MODAL: ORDER DETAILS & EDIT ================= */}
        {selectedOrder && (
          <div dir="rtl" className="fixed inset-0 z-[60] flex items-start justify-center p-3 sm:p-6 bg-black/80 overflow-y-auto text-right">
            <div className="relative w-full max-w-lg rounded-3xl bg-[#141720] border border-white/10 p-6 space-y-5 text-right my-4 sm:my-8 shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div>
                  <span className="text-xs font-mono font-bold text-[#c5a869]">
                    {selectedOrder.orderNumber}
                  </span>
                  <h3 className="text-base font-bold text-white">تفاصيل الطلب ومعلومات الزبون</h3>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-xl bg-white/5 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-gray-400">اسم العميل:</span>
                    <span className="font-bold text-white">{selectedOrder.customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">رقم الهاتف:</span>
                    <a
                      href={`tel:${selectedOrder.phone}`}
                      className="font-mono text-emerald-400 font-bold"
                      dir="ltr"
                    >
                      {selectedOrder.phone}
                    </a>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">المدينة:</span>
                    <span className="text-white font-medium">{selectedOrder.city}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">العنوان:</span>
                    <span className="text-white">{selectedOrder.address}</span>
                  </div>
                  {selectedOrder.notes && (
                    <div className="pt-2 border-t border-white/5 text-amber-300">
                      <strong>ملاحظات العميل:</strong> {selectedOrder.notes}
                    </div>
                  )}
                </div>

                <div className="p-3.5 rounded-xl bg-white/5 space-y-2">
                  <h4 className="font-bold text-[#c5a869]">المنتجات المطلوبة:</h4>
                  {selectedOrder.items.map((it, idx) => (
                    <div key={idx} className="space-y-1 py-1.5 border-b border-white/5 last:border-0">
                      <div className="flex justify-between items-center text-gray-200">
                        <span className="font-semibold">
                          {it.name} {it.bundleLabel ? `[${it.bundleLabel}]` : ''}
                        </span>
                        <span className="font-mono text-emerald-400 font-bold">
                          {it.quantity} &times; {formatPrice(it.price)}
                        </span>
                      </div>
                      <div className="text-gray-400 text-[11px]">
                        {it.selectedColors && it.selectedColors.length > 1 ? (
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {it.selectedColors.map((col, cIdx) => (
                              <span key={cIdx} className="px-2 py-0.5 rounded bg-white/10 text-gray-300 text-[10px]">
                                ساعة {cIdx + 1}: <strong className="text-white">{col}</strong>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span>اللون المختار: <strong className="text-white">{it.color}</strong></span>
                        )}
                      </div>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-white/5 flex justify-between font-bold text-sm text-emerald-400">
                    <span>المبلغ المطلوب استلامه (COD):</span>
                    <span>{formatPrice(selectedOrder.totalAmount)}</span>
                  </div>
                </div>

                {/* Dedicated Customer WhatsApp Confirmation Section */}
                <div className="p-4 rounded-2xl bg-gradient-to-b from-[#102419] to-[#121820] border border-emerald-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                        <MessageCircle className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-xs">رسالة تأكيد الطلب للزبون عبر واتساب</h4>
                        <p className="text-[10px] text-gray-400">تتضمن تفاصيل الطلب مع إمكانية الزبون تأكيد الطلب أو إلغائه</p>
                      </div>
                    </div>

                    {/* Customer Action & WhatsApp Status */}
                    {selectedOrder.customerAction === 'confirmed' ? (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> أكده الزبون إلكترونياً
                      </span>
                    ) : selectedOrder.customerAction === 'cancelled' ? (
                      <span className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold flex items-center gap-1">
                        <XCircle className="w-3 h-3" /> ألغاه الزبون
                      </span>
                    ) : selectedOrder.whatsappSent ? (
                      <span className="px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[10px] font-bold flex items-center gap-1">
                        <CheckCheck className="w-3 h-3" /> تم إرسال وتساب
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold flex items-center gap-1">
                        <Clock className="w-3 h-3" /> بانتظار الإرسال
                      </span>
                    )}
                  </div>

                  {/* Message Preview */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[11px] text-gray-400">
                      <span>معاينة نص الرسالة التي ستصل للزبون:</span>
                      <button
                        type="button"
                        onClick={() => handleCopyCustomerWhatsAppText(selectedOrder)}
                        className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 text-[10px] font-semibold cursor-pointer"
                      >
                        <Copy className="w-3 h-3" />
                        <span>نسخ النص</span>
                      </button>
                    </div>
                    <div
                      className="p-3 rounded-xl bg-black/50 border border-white/5 font-sans text-xs text-gray-200 leading-relaxed whitespace-pre-wrap max-h-44 overflow-y-auto"
                      dir="rtl"
                    >
                      {generateCustomerConfirmationMessage(selectedOrder, settings?.storeName)}
                    </div>
                  </div>

                  {/* Interactive Action Buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleSendCustomerWhatsApp(selectedOrder)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>إرسال للزبون عبر واتساب</span>
                    </button>
                    <a
                      href={`${typeof window !== 'undefined' ? window.location.origin : ''}/#confirm-order?id=${selectedOrder.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 font-bold text-xs transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>معاينة صفحة الزبون للتأكيد</span>
                    </a>
                  </div>
                </div>

                {/* Change Status */}
                <div>
                  <label className="block text-gray-300 font-bold mb-1">تحديث حالة الطلب:</label>
                  <select
                    value={selectedOrder.status}
                    onChange={(e) => {
                      const next = e.target.value as OrderStatus;
                      updateOrderStatus(selectedOrder.id, next);
                      setSelectedOrder({ ...selectedOrder, status: next });
                    }}
                    className="w-full bg-[#1b1f2b] border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none"
                  >
                    <option value="جديد">جديد</option>
                    <option value="قيد التأكيد">قيد التأكيد</option>
                    <option value="تم التأكيد">تم التأكيد</option>
                    <option value="قيد التجهيز">قيد التجهيز</option>
                    <option value="تم الشحن">تم الشحن</option>
                    <option value="تم التسليم">تم التسليم</option>
                    <option value="ملغى">ملغى</option>
                    <option value="مرتجع">مرتجع</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-white/10">
                <button
                  onClick={() => {
                    if (
                      window.confirm(
                        `هل أنت متأكد من حذف الطلب ${selectedOrder.orderNumber} نهائياً الخاص بـ "${selectedOrder.customerName}"؟`
                      )
                    ) {
                      deleteOrder(selectedOrder.id);
                      setSelectedOrder(null);
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>حذف الطلب</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setPrintingOrder(selectedOrder);
                      setSelectedOrder(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-[#c5a869]/20 text-[#c5a869] border border-[#c5a869]/40 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>شهادة الضمان (سنة)</span>
                  </button>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="px-4 py-2 rounded-xl bg-white/5 text-gray-300 text-xs hover:bg-white/10"
                  >
                    إغلاق
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= MODAL: OFFICIAL 1-YEAR WARRANTY CERTIFICATE ================= */}
        {printingOrder && (
          <WarrantyCertificateModal
            order={printingOrder}
            settings={settings}
            onClose={() => setPrintingOrder(null)}
          />
        )}

        {/* ================= MODAL: ADD / EDIT PRODUCT (ISOLATED MEMOIZED) ================= */}
        {isEditingProduct && editingProduct && (
          <AdminProductModal
            product={editingProduct}
            onClose={handleCloseProductModal}
            onSave={handleSaveProductModal}
          />
        )}

        {/* ================= MODAL: EDIT NEW ORDER ================= */}
        {editingOrder && (
          <div dir="rtl" className="fixed inset-0 z-[60] flex items-start justify-center p-3 sm:p-6 bg-black/85 overflow-y-auto text-right">
            <div className="relative w-full max-w-2xl bg-[#141720] border border-amber-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5 text-right my-4 sm:my-8">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center">
                    <Edit2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-extrabold text-white">
                      تعديل الطلب <span className="font-mono text-[#c5a869]">#{editingOrder.orderNumber}</span>
                    </h3>
                    <p className="text-[11px] text-gray-400">
                      عدّل بيانات الزبون، المدينة، العنوان، المنتجات، الكميات، الألوان، أو المبلغ المطلوب.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingOrder(null)}
                  className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveOrderEdit} className="space-y-5 text-xs">
                {/* Customer & Shipping Details */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                  <h4 className="font-bold text-amber-300 text-xs flex items-center gap-1.5">
                    <span>بيانات الزبون والتوصيل</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-gray-300 font-semibold mb-1">اسم الزبون الكامل *</label>
                      <input
                        type="text"
                        required
                        value={editingOrder.customerName}
                        onChange={(e) => setEditingOrder({ ...editingOrder, customerName: e.target.value })}
                        className="w-full bg-[#1b1f2c] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#c5a869]"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-300 font-semibold mb-1">رقم الهاتف *</label>
                      <input
                        type="text"
                        required
                        dir="ltr"
                        value={editingOrder.phone}
                        onChange={(e) => setEditingOrder({ ...editingOrder, phone: e.target.value })}
                        className="w-full bg-[#1b1f2c] border border-white/10 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-[#c5a869] text-left"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-300 font-semibold mb-1">المدينة *</label>
                      <select
                        value={MOROCCAN_CITIES.includes(editingOrder.city) ? editingOrder.city : '__custom__'}
                        onChange={(e) => {
                          if (e.target.value !== '__custom__') {
                            setEditingOrder({ ...editingOrder, city: e.target.value });
                          }
                        }}
                        className="w-full bg-[#1b1f2c] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#c5a869]"
                      >
                        {MOROCCAN_CITIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                        {!MOROCCAN_CITIES.includes(editingOrder.city) && (
                          <option value="__custom__">{editingOrder.city || 'مدينة أخرى'}</option>
                        )}
                      </select>
                      <input
                        type="text"
                        required
                        value={editingOrder.city}
                        onChange={(e) => setEditingOrder({ ...editingOrder, city: e.target.value })}
                        placeholder="أو اكتب اسم المدينة يدوياً"
                        className="mt-1.5 w-full bg-[#1b1f2c] border border-white/10 rounded-xl px-3 py-1.5 text-[11px] text-gray-200 focus:outline-none focus:border-[#c5a869]"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-300 font-semibold mb-1">العنوان التفصيلي *</label>
                      <input
                        type="text"
                        required
                        value={editingOrder.address}
                        onChange={(e) => setEditingOrder({ ...editingOrder, address: e.target.value })}
                        className="w-full bg-[#1b1f2c] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#c5a869]"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-gray-300 font-semibold mb-1">ملاحظة إضافية للموزع (اختياري)</label>
                      <input
                        type="text"
                        value={editingOrder.notes || ''}
                        onChange={(e) => setEditingOrder({ ...editingOrder, notes: e.target.value })}
                        placeholder="مثال: الاتصال قبل التوصيل بنصف ساعة"
                        className="w-full bg-[#1b1f2c] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#c5a869]"
                      />
                    </div>
                  </div>
                </div>

                {/* Items Section */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-amber-300 text-xs">المنتجات والألوان والكمية</h4>
                    {products.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          const firstProd = products[0];
                          const firstColors = getProductColors(firstProd);
                          const bundle = getBundlePriceForQuantity(firstProd, 1);
                          const newItem: OrderItem = {
                            productId: firstProd.id,
                            name: firstProd.name,
                            color: firstColors[0]?.name || 'أسود ملكي',
                            selectedColors: [firstColors[0]?.name || 'أسود ملكي'],
                            bundleLabel: bundle.bundleLabel,
                            price: bundle.totalPrice,
                            quantity: 1,
                            image: firstProd.images[0] || '',
                          };
                          const updatedItems = [...(editingOrder.items || []), newItem];
                          const totals = recalcOrderTotals(updatedItems, editingOrder.shippingFee);
                          setEditingOrder({
                            ...editingOrder,
                            items: updatedItems,
                            subtotal: totals.subtotal,
                            totalAmount: totals.totalAmount,
                          });
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold transition cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>إضافة ساعة أخرى</span>
                      </button>
                    )}
                  </div>

                  <div className="space-y-3">
                    {(editingOrder.items || []).map((item, idx) => {
                      const matchedProduct = products.find((p) => p.id === item.productId || p.name === item.name);
                      const availableColors = getProductColors(matchedProduct);
                      const qty = Math.max(1, Number(item.quantity) || 1);
                      const currentColors = Array.from({ length: qty }, (_, cIdx) =>
                        (item.selectedColors && item.selectedColors[cIdx]) || item.color || availableColors[0]?.name || 'أسود ملكي'
                      );

                      const updateItemAt = (patch: Partial<OrderItem>, recalcFromProduct = false) => {
                        const updatedItems = (editingOrder.items || []).map((it, i) => {
                          if (i !== idx) return it;
                          const merged = { ...it, ...patch };
                          if (recalcFromProduct) {
                            const prod = products.find((p) => p.id === merged.productId || p.name === merged.name);
                            if (prod) {
                              const bundle = getBundlePriceForQuantity(prod, Math.max(1, Number(merged.quantity) || 1));
                              merged.price = bundle.totalPrice;
                              merged.bundleLabel = bundle.bundleLabel;
                            }
                          }
                          return merged;
                        });
                        const totals = recalcOrderTotals(updatedItems, editingOrder.shippingFee);
                        setEditingOrder({
                          ...editingOrder,
                          items: updatedItems,
                          subtotal: totals.subtotal,
                          totalAmount: totals.totalAmount,
                        });
                      };

                      return (
                        <div key={idx} className="p-3 rounded-xl bg-[#1b1f2c] border border-white/10 space-y-2.5">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex-1">
                              <label className="block text-[10px] text-gray-400 mb-1">المنتج ({idx + 1})</label>
                              <select
                                value={matchedProduct?.id || '__current__'}
                                onChange={(e) => {
                                  const prod = products.find((p) => p.id === e.target.value);
                                  if (!prod) return;
                                  const cols = getProductColors(prod);
                                  const defaultCol = cols[0]?.name || 'أسود ملكي';
                                  const nextColors = Array.from({ length: qty }, () => defaultCol);
                                  updateItemAt(
                                    {
                                      productId: prod.id,
                                      name: prod.name,
                                      image: prod.images[0] || item.image,
                                      color: defaultCol,
                                      selectedColors: nextColors,
                                    },
                                    true
                                  );
                                }}
                                className="w-full bg-[#141720] border border-white/10 rounded-lg px-2.5 py-2 text-white text-xs focus:outline-none focus:border-[#c5a869]"
                              >
                                {!matchedProduct && (
                                  <option value="__current__">{item.name}</option>
                                )}
                                {products.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.name} ({formatPrice(p.price)})
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="w-full sm:w-28">
                              <label className="block text-[10px] text-gray-400 mb-1">الكمية</label>
                              <input
                                type="number"
                                min={1}
                                max={20}
                                value={qty}
                                onChange={(e) => {
                                  const nextQty = Math.max(1, parseInt(e.target.value || '1', 10) || 1);
                                  const nextColors = Array.from({ length: nextQty }, (_, cIdx) =>
                                    currentColors[cIdx] || currentColors[0] || availableColors[0]?.name || 'أسود ملكي'
                                  );
                                  updateItemAt(
                                    {
                                      quantity: nextQty,
                                      color: nextColors[0],
                                      selectedColors: nextColors,
                                    },
                                    Boolean(matchedProduct)
                                  );
                                }}
                                className="w-full bg-[#141720] border border-white/10 rounded-lg px-2.5 py-2 text-white font-bold text-center focus:outline-none focus:border-[#c5a869]"
                              />
                            </div>

                            <div className="w-full sm:w-32">
                              <label className="block text-[10px] text-gray-400 mb-1">سعر البند (درهم)</label>
                              <input
                                type="number"
                                min={0}
                                value={item.price}
                                onChange={(e) => {
                                  updateItemAt({ price: Math.max(0, Number(e.target.value) || 0) }, false);
                                }}
                                className="w-full bg-[#141720] border border-white/10 rounded-lg px-2.5 py-2 text-emerald-400 font-bold text-center focus:outline-none focus:border-[#c5a869]"
                              />
                            </div>

                            {editingOrder.items.length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const updatedItems = editingOrder.items.filter((_, i) => i !== idx);
                                  const totals = recalcOrderTotals(updatedItems, editingOrder.shippingFee);
                                  setEditingOrder({
                                    ...editingOrder,
                                    items: updatedItems,
                                    subtotal: totals.subtotal,
                                    totalAmount: totals.totalAmount,
                                  });
                                }}
                                className="self-end p-2 rounded-lg bg-rose-500/15 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 cursor-pointer"
                                title="حذف هذا المنتج من الطلب"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>

                          {/* Color selectors for each piece */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                            {currentColors.map((selectedCol, cIdx) => (
                              <div key={cIdx}>
                                <label className="block text-[10px] text-gray-400 mb-1">
                                  {qty > 1 ? `لون الساعة ${cIdx + 1}` : 'اللون المطلوب'}
                                </label>
                                <select
                                  value={
                                    availableColors.some((c) => c.name === selectedCol)
                                      ? selectedCol
                                      : '__custom_color__'
                                  }
                                  onChange={(e) => {
                                    if (e.target.value === '__custom_color__') return;
                                    const updatedColors = [...currentColors];
                                    updatedColors[cIdx] = e.target.value;
                                    updateItemAt(
                                      {
                                        color: updatedColors[0],
                                        selectedColors: updatedColors,
                                      },
                                      false
                                    );
                                  }}
                                  className="w-full bg-[#141720] border border-white/10 rounded-lg px-2.5 py-1.5 text-[#c5a869] font-semibold text-xs focus:outline-none focus:border-[#c5a869]"
                                >
                                  {availableColors.map((col) => (
                                    <option key={col.name} value={col.name}>
                                      {col.name}
                                    </option>
                                  ))}
                                  {!availableColors.some((c) => c.name === selectedCol) && (
                                    <option value="__custom_color__">{selectedCol}</option>
                                  )}
                                </select>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Total COD Amount */}
                <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="font-bold text-white block text-xs">المبلغ الإجمالي عند الاستلام (COD)</span>
                    <span className="text-[11px] text-gray-400">
                      يُحدّث تلقائياً عند تغيير المنتج أو الكمية، ويمكنك تعديله يدوياً عند الحاجة.
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      required
                      value={editingOrder.totalAmount}
                      onChange={(e) =>
                        setEditingOrder({
                          ...editingOrder,
                          totalAmount: Math.max(0, Number(e.target.value) || 0),
                        })
                      }
                      className="w-32 bg-[#141720] border border-emerald-500/40 rounded-xl px-3 py-2 text-emerald-400 font-black text-sm text-center focus:outline-none focus:border-emerald-400"
                    />
                    <span className="text-xs font-bold text-gray-300">درهم</span>
                  </div>
                </div>

                {/* Submit / Cancel Buttons */}
                <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/10">
                  <button
                    type="button"
                    disabled={isSavingOrderEdit}
                    onClick={() => setEditingOrder(null)}
                    className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-bold text-xs cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingOrderEdit}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl gold-gradient-bg text-black font-extrabold text-xs shadow-lg hover:brightness-110 disabled:opacity-50 cursor-pointer"
                  >
                    {isSavingOrderEdit ? (
                      <Loader2 className="w-4 h-4 animate-spin text-black" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>{isSavingOrderEdit ? 'جاري حفظ التعديلات...' : 'حفظ تعديلات الطلب'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* ================= MODAL: PROMO CODE DOWNLOADABLE VOUCHER ================= */}
        {previewPromoVoucher && (
          <PromoCodeVoucherModal
            promo={previewPromoVoucher}
            settings={localSettings || settings}
            onClose={() => setPreviewPromoVoucher(null)}
          />
        )}
    </>
  );
};
