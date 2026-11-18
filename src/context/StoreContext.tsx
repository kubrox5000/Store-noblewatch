import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  ReactNode,
} from 'react';
import {
  Product,
  Order,
  Review,
  StoreSettings,
  Category,
  CartItem,
  OrderStatus,
} from '../types';
import { LANG_STORAGE_KEY } from './LanguageContext';
import { getBundlePriceForQuantity } from '../utils/constants';
import { trackPixelAddToCart, trackPixelPurchase } from '../utils/trackingPixels';

const isFrenchActive = () => {
  try {
    return localStorage.getItem(LANG_STORAGE_KEY) === 'fr';
  } catch {
    return false;
  }
};

interface ToastState {
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface ProductReviewStats {
  count: number;
  avgRating: number;
}

interface StoreContextType {
  settings: StoreSettings | null;
  categories: Category[];
  products: Product[];
  orders: Order[];
  reviews: Review[];
  reviewsStatsByProduct: Record<string, ProductReviewStats>;
  cart: CartItem[];
  cartCount: number;
  cartSubtotal: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  activeProductId: string | null;
  setActiveProductId: (id: string | null) => void;
  checkoutProduct: { product: Product; color: string; quantity: number; selectedColors?: string[] } | null;
  setCheckoutProduct: (val: { product: Product; color: string; quantity: number; selectedColors?: string[] } | null) => void;
  isAdmin: boolean;
  setIsAdmin: (val: boolean) => void;
  isAdminOpen: boolean;
  setIsAdminOpen: (val: boolean) => void;
  isTrackingOpen: boolean;
  setIsTrackingOpen: (val: boolean) => void;
  isWarrantyCheckOpen: boolean;
  setIsWarrantyCheckOpen: (val: boolean) => void;
  activePolicyModal: string | null;
  setActivePolicyModal: (policy: string | null) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  toast: ToastState | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  isLoading: boolean;
  addToCart: (product: Product, quantity?: number, color?: string, selectedColors?: string[], bundleLabel?: string) => void;
  removeFromCart: (productId: string, color: string) => void;
  updateCartQuantity: (productId: string, color: string, delta: number) => void;
  clearCart: () => void;
  placeOrder: (data: any) => Promise<{ success: boolean; order?: Order; message?: string; refreshChallenge?: boolean }>;
  updateOrderStatus: (
    id: string,
    status?: OrderStatus,
    adminNotes?: string,
    extra?: {
      whatsappSent?: boolean;
      whatsappSentDate?: string;
      customerAction?: 'confirmed' | 'cancelled' | 'pending';
    }
  ) => Promise<boolean>;
  updateOrderDetails: (id: string, updates: Partial<Order>) => Promise<boolean>;
  markOrderWhatsAppSent: (id: string) => Promise<boolean>;
  deleteOrder: (id: string) => Promise<boolean>;
  clearAllOrders: () => Promise<boolean>;
  addProduct: (productData: Partial<Product>) => Promise<{ ok: boolean; message?: string; product?: Product }>;
  updateProduct: (id: string, productData: Partial<Product>) => Promise<{ ok: boolean; message?: string; product?: Product }>;
  deleteProduct: (id: string) => Promise<boolean>;
  duplicateProduct: (id: string) => Promise<boolean>;
  submitReview: (reviewData: Partial<Review>) => Promise<boolean>;
  toggleReviewApproval: (id: string, isApproved: boolean) => Promise<boolean>;
  deleteReview: (id: string) => Promise<boolean>;
  updateSettings: (newSettings: Partial<StoreSettings>) => Promise<boolean>;
  refreshData: () => Promise<void>;
  syncAllToCloud: () => Promise<boolean>;
  resetToDefaultData: () => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const STORE_SNAPSHOT_KEY = 'noblewatch_store_snapshot_v1';

interface StoreSnapshot {
  settings: StoreSettings | null;
  categories: Category[];
  products: Product[];
  reviews: Review[];
}

const readInitialSnapshot = (): StoreSnapshot => {
  try {
    const raw = localStorage.getItem(STORE_SNAPSHOT_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        settings: parsed.settings || null,
        categories: Array.isArray(parsed.categories) ? parsed.categories : [],
        products: Array.isArray(parsed.products) ? parsed.products : [],
        reviews: Array.isArray(parsed.reviews) ? parsed.reviews : [],
      };
    }
    const savedProducts = localStorage.getItem('noblewatch_saved_products');
    if (savedProducts) {
      const parsedProds = JSON.parse(savedProducts);
      if (Array.isArray(parsedProds) && parsedProds.length > 0) {
        return { settings: null, categories: [], products: parsedProds, reviews: [] };
      }
    }
  } catch {
    // ignore corrupted cache
  }
  return { settings: null, categories: [], products: [], reviews: [] };
};

const getProductFromUrl = (): string | null => {
  try {
    return new URLSearchParams(window.location.search).get('product');
  } catch {
    return null;
  }
};

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [initialSnapshot] = useState<StoreSnapshot>(() => readInitialSnapshot());
  const [settings, setSettings] = useState<StoreSettings | null>(initialSnapshot.settings);
  const [categories, setCategories] = useState<Category[]>(initialSnapshot.categories);
  const [products, setProducts] = useState<Product[]>(initialSnapshot.products);
  const [orders, setOrders] = useState<Order[]>([]);
  const [reviews, setReviews] = useState<Review[]>(initialSnapshot.reviews);
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('noblewatch_cart') || localStorage.getItem('qevorin_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeProductId, setActiveProductIdState] = useState<string | null>(() => getProductFromUrl());
  const [checkoutProduct, setCheckoutProduct] = useState<{
    product: Product;
    color: string;
    quantity: number;
    selectedColors?: string[];
  } | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    const hasFlag =
      localStorage.getItem('noblewatch_admin_auth') === 'true' ||
      localStorage.getItem('qevorin_admin_auth') === 'true';
    const hasToken = Boolean(localStorage.getItem('noblewatch_admin_token'));
    return hasFlag && hasToken;
  });

  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [isWarrantyCheckOpen, setIsWarrantyCheckOpen] = useState(false);
  const [activePolicyModal, setActivePolicyModal] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(() => {
    try {
      return new URLSearchParams(window.location.search).get('q') || '';
    } catch {
      return '';
    }
  });
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [toast, setToast] = useState<ToastState | null>(null);
  const [isLoading, setIsLoading] = useState(() => initialSnapshot.products.length === 0);

  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const snapshotTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refreshPromiseRef = useRef<Promise<void> | null>(null);

  const latestRef = useRef({
    settings,
    categories,
    products,
    reviews,
    orders,
  });
  latestRef.current = { settings, categories, products, reviews, orders };

  const getAdminHeaders = useCallback((extra: Record<string, string> = {}): Record<string, string> => {
    const token = localStorage.getItem('noblewatch_admin_token');
    return token ? { ...extra, Authorization: `Bearer ${token}` } : extra;
  }, []);

  const handleUnauthorizedAdmin = useCallback(() => {
    localStorage.removeItem('noblewatch_admin_auth');
    localStorage.removeItem('qevorin_admin_auth');
    localStorage.removeItem('noblewatch_admin_token');
    setIsAdmin(false);
    setOrders([]);
  }, []);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToast({ message, type });
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
      toastTimerRef.current = null;
    }, 4000);
  }, []);

  const writeSnapshotNow = useCallback((override?: Partial<StoreSnapshot>) => {
    if (snapshotTimerRef.current) {
      clearTimeout(snapshotTimerRef.current);
      snapshotTimerRef.current = null;
    }
    try {
      const cur = latestRef.current;
      const prods = override?.products ?? cur.products;
      const revs = override?.reviews ?? cur.reviews;
      const cats = override?.categories ?? cur.categories;
      const sets = override?.settings !== undefined ? override.settings : cur.settings;
      // Strip inline base64 videos if any slipped through so localStorage never overflows
      const slimProds = prods.map((p) =>
        Array.isArray(p.videos) && p.videos.some((v) => typeof v.url === 'string' && v.url.startsWith('data:'))
          ? {
              ...p,
              videos: p.videos.map((v) => ({
                ...v,
                url: typeof v.url === 'string' && v.url.startsWith('data:') ? '/videos/video_prod-1.mp4' : v.url,
              })),
            }
          : p
      );
      localStorage.setItem(
        STORE_SNAPSHOT_KEY,
        JSON.stringify({
          settings: sets,
          categories: cats,
          products: slimProds,
          reviews: Array.isArray(revs) ? revs.slice(0, 60) : [],
        })
      );
      localStorage.removeItem('noblewatch_saved_products');
      localStorage.removeItem('noblewatch_has_custom_data');
    } catch {
      // ignore quota errors safely
    }
  }, []);

  // Non-blocking background snapshot writer (caps cached reviews at 60 so main thread & localStorage stay lightweight)
  const schedulePersistSnapshot = useCallback(
    (override?: Partial<StoreSnapshot>) => {
      if (snapshotTimerRef.current) {
        clearTimeout(snapshotTimerRef.current);
      }
      snapshotTimerRef.current = setTimeout(() => {
        snapshotTimerRef.current = null;
        writeSnapshotNow(override);
      }, 80);
    },
    [writeSnapshotNow]
  );

  // O(N) lookup map of approved review counts & averages by productId (replaces 48 x 1,218 filter scans!)
  const reviewsStatsByProduct = useMemo(() => {
    const acc: Record<string, { sum: number; count: number }> = {};
    for (let i = 0; i < reviews.length; i++) {
      const r = reviews[i];
      if (!r.isApproved) continue;
      let bucket = acc[r.productId];
      if (!bucket) {
        bucket = { sum: 0, count: 0 };
        acc[r.productId] = bucket;
      }
      bucket.count += 1;
      bucket.sum += Number(r.rating) || 5;
    }
    const result: Record<string, ProductReviewStats> = {};
    for (const [productId, b] of Object.entries(acc)) {
      result[productId] = {
        count: b.count,
        avgRating: Number((b.sum / b.count).toFixed(1)),
      };
    }
    return result;
  }, [reviews]);

  // Sync product navigation with browser History (Back / Forward) & immediate scroll top
  useEffect(() => {
    const handlePopState = () => {
      setActiveProductIdState(getProductFromUrl());
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const setActiveProductId = useCallback((id: string | null) => {
    setActiveProductIdState(id);
    try {
      const url = new URL(window.location.href);
      if (id) {
        url.searchParams.set('product', id);
      } else {
        url.searchParams.delete('product');
      }
      const nextUrl = `${url.pathname}${url.search}${url.hash}`;
      const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      if (nextUrl !== currentUrl) {
        window.history.pushState({ productId: id }, '', nextUrl);
      }
    } catch {
      // ignore history errors
    }
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, []);

  // Hidden admin access: URL hash (#admin), search param (?admin), or shortcut (Ctrl+Shift+A)
  useEffect(() => {
    const checkAdminTrigger = () => {
      if (
        window.location.hash.toLowerCase() === '#admin' ||
        window.location.search.toLowerCase().includes('admin')
      ) {
        setIsAdminOpen(true);
      }
    };

    checkAdminTrigger();
    window.addEventListener('hashchange', checkAdminTrigger);

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        setIsAdminOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('hashchange', checkAdminTrigger);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Save cart to local storage asynchronously so cart clicks never lag
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem('noblewatch_cart', JSON.stringify(cart));
      } catch (e) {
        console.error(e);
      }
    }, 30);
    return () => clearTimeout(t);
  }, [cart]);

  const refreshData = useCallback(async () => {
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }

    const promise = (async () => {
      try {
        const res = await fetch('/api/store-data', {
          headers: getAdminHeaders(),
          cache: 'no-store',
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success) {
            setSettings(json.data.settings);
            setCategories(json.data.categories);

            if (localStorage.getItem('noblewatch_admin_token') && json.isAdminAuthenticated === false) {
              handleUnauthorizedAdmin();
            }

            let serverOrders = Array.isArray(json.data.orders) ? json.data.orders : [];
            try {
              const rawDel = localStorage.getItem('noblewatch_deleted_order_ids');
              if (rawDel) {
                const deletedIds: string[] = JSON.parse(rawDel);
                if (Array.isArray(deletedIds) && deletedIds.length > 0) {
                  const delSet = new Set(deletedIds);
                  serverOrders = serverOrders.filter(
                    (o: any) => !delSet.has(o.id) && !delSet.has(o.orderNumber)
                  );
                }
              }
            } catch {}

            setOrders(serverOrders);
            setReviews(json.data.reviews || []);
            const resolvedProducts: Product[] = json.data.products || [];
            setProducts(resolvedProducts);

            schedulePersistSnapshot({
              settings: json.data.settings,
              categories: json.data.categories,
              products: resolvedProducts,
              reviews: json.data.reviews || [],
            });
          }
        }
      } catch (err) {
        console.error('Failed to fetch store data', err);
      } finally {
        setIsLoading(false);
        refreshPromiseRef.current = null;
      }
    })();

    refreshPromiseRef.current = promise;
    return promise;
  }, [getAdminHeaders, handleUnauthorizedAdmin, schedulePersistSnapshot]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Poll orders every 5 seconds when admin is open & authenticated (skip setState if nothing changed!)
  const hasConfirmedOrders = orders.some((o) => o.status === 'تم التأكيد');
  useEffect(() => {
    if (!isAdmin || (!isAdminOpen && !hasConfirmedOrders)) return;

    const pollOrders = async () => {
      try {
        const res = await fetch('/api/orders', {
          headers: getAdminHeaders(),
        });
        if (res.status === 401) {
          handleUnauthorizedAdmin();
          return;
        }
        if (!res.ok) return;
        const json = await res.json();
        if (!json.success || !Array.isArray(json.orders)) return;

        let cleanOrders: Order[] = json.orders;
        try {
          const rawDel = localStorage.getItem('noblewatch_deleted_order_ids');
          if (rawDel) {
            const deletedIds: string[] = JSON.parse(rawDel);
            if (Array.isArray(deletedIds) && deletedIds.length > 0) {
              const delSet = new Set(deletedIds);
              cleanOrders = cleanOrders.filter(
                (o) => !delSet.has(o.id) && !delSet.has(o.orderNumber)
              );
            }
          }
        } catch {}

        setOrders((prev) => {
          if (prev.length === cleanOrders.length) {
            let identical = true;
            for (let i = 0; i < prev.length; i++) {
              const a = prev[i];
              const b = cleanOrders[i];
              if (
                a.id !== b.id ||
                a.status !== b.status ||
                a.customerAction !== b.customerAction ||
                a.whatsappSent !== b.whatsappSent ||
                a.totalAmount !== b.totalAmount ||
                a.adminNotes !== b.adminNotes ||
                a.customerName !== b.customerName
              ) {
                identical = false;
                break;
              }
            }
            if (identical) return prev;
          }

          const prevStatusMap = new Map(prev.map((o) => [o.id, o.status]));
          const newlyPreparing = cleanOrders.filter(
            (o) => prevStatusMap.get(o.id) === 'تم التأكيد' && o.status === 'قيد التجهيز'
          );
          if (newlyPreparing.length > 0 && isAdminOpen && isAdmin) {
            const nums = newlyPreparing.map((o) => o.orderNumber).join('، ');
            setTimeout(() => {
              showToast(`تم نقل الطلب (${nums}) تلقائياً إلى "قيد التجهيز" فور التأكيد`, 'info');
            }, 0);
          }
          return cleanOrders;
        });
      } catch {}
    };

    const intervalId = setInterval(pollOrders, 5000);
    return () => clearInterval(intervalId);
  }, [isAdminOpen, isAdmin, hasConfirmedOrders, getAdminHeaders, handleUnauthorizedAdmin, showToast]);

  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);
  const cartSubtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [cart]
  );

  const addToCart = useCallback(
    (
      product: Product,
      quantity = 1,
      color?: string,
      selectedColors?: string[],
      bundleLabel?: string
    ) => {
      const chosenColor = color || (product.colors?.[0]?.name ?? 'افتراضي');
      setCart((prev) => {
        const existingIndex = prev.findIndex(
          (item) => item.product.id === product.id && item.color === chosenColor
        );
        if (existingIndex > -1) {
          const next = [...prev];
          next[existingIndex] = {
            ...next[existingIndex],
            quantity: next[existingIndex].quantity + quantity,
            ...(selectedColors ? { selectedColors } : {}),
            ...(bundleLabel ? { bundleLabel } : {}),
          };
          return next;
        }
        return [
          ...prev,
          {
            product,
            quantity,
            color: chosenColor,
            selectedColors,
            bundleLabel,
          },
        ];
      });
      const calc = getBundlePriceForQuantity(product, quantity);
      trackPixelAddToCart(product, quantity, calc.totalPrice / Math.max(1, quantity));
      showToast(
        isFrenchActive()
          ? `"${product.name}" ajouté au panier avec succès !`
          : `تمت إضافة "${product.name}" إلى السلة بنجاح!`,
        'success'
      );
      setIsCartOpen(true);
    },
    [showToast]
  );

  const removeFromCart = useCallback(
    (productId: string, color: string) => {
      setCart((prev) => prev.filter((item) => !(item.product.id === productId && item.color === color)));
      showToast(isFrenchActive() ? 'Produit retiré du panier' : 'تم حذف المنتج من السلة', 'info');
    },
    [showToast]
  );

  const updateCartQuantity = useCallback((productId: string, color: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId && item.color === color) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const placeOrder = useCallback(async (orderData: any) => {
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });
      const data = await res.json();
      if (data.success) {
        if (data.order) {
          trackPixelPurchase({
            orderNumber: data.order.orderNumber,
            totalAmount: Number(data.order.totalAmount) || 0,
            items: Array.isArray(data.order.items) ? data.order.items : [],
          });
          // Immediately decrement product stock locally & prepend order if admin session active
          if (Array.isArray(data.order.items) && data.order.items.length > 0) {
            setProducts((prev) => {
              const qtyByProd = new Map<string, number>();
              for (const it of data.order.items) {
                qtyByProd.set(it.productId, (qtyByProd.get(it.productId) || 0) + (Number(it.quantity) || 1));
              }
              return prev.map((p) => {
                const d = qtyByProd.get(p.id);
                return d ? { ...p, stock: Math.max(0, p.stock - d) } : p;
              });
            });
          }
          setOrders((prev) => (isAdmin ? [data.order, ...prev] : prev));
        }
        // Dynamically load confetti without blocking return
        import('canvas-confetti')
          .then(({ default: confetti }) => {
            confetti({
              particleCount: 80,
              spread: 70,
              origin: { y: 0.6 },
              colors: ['#c5a869', '#d4af37', '#ffffff', '#10b981'],
            });
          })
          .catch(() => {});
        return { success: true, order: data.order };
      }
      return {
        success: false,
        message: data.message || (isFrenchActive() ? 'Une erreur est survenue lors de la commande' : 'حدث خطأ أثناء الطلب'),
        refreshChallenge: Boolean(data.refreshChallenge),
      };
    } catch {
      return {
        success: false,
        message: isFrenchActive() ? 'Impossible de contacter le serveur, veuillez réessayer' : 'تعذر الاتصال بالخادم، يرجى المحاولة لاحقاً',
      };
    }
  }, [isAdmin]);

  const updateOrderStatus = useCallback(
    async (
      id: string,
      status?: OrderStatus,
      adminNotes?: string,
      extra?: {
        whatsappSent?: boolean;
        whatsappSentDate?: string;
        customerAction?: 'confirmed' | 'cancelled' | 'pending';
      }
    ) => {
      try {
        const payload: Record<string, any> = {};
        if (status) payload.status = status;
        if (adminNotes !== undefined) payload.adminNotes = adminNotes;
        if (extra?.whatsappSent !== undefined) payload.whatsappSent = extra.whatsappSent;
        if (extra?.whatsappSentDate !== undefined) payload.whatsappSentDate = extra.whatsappSentDate;
        if (extra?.customerAction !== undefined) payload.customerAction = extra.customerAction;

        const res = await fetch(`/api/orders/${id}`, {
          method: 'PATCH',
          headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify(payload),
        });
        if (res.status === 401) {
          handleUnauthorizedAdmin();
          showToast('انتهت جلسة الإدارة، يرجى تسجيل الدخول مجدداً', 'error');
          return false;
        }
        const data = await res.json().catch(() => null);
        if (res.ok && data?.success) {
          const updatedOrder = data.order;
          if (updatedOrder) {
            setOrders((prev) =>
              prev.map((o) => (o.id === id || o.orderNumber === id ? updatedOrder : o))
            );
          } else {
            setOrders((prev) =>
              prev.map((o) =>
                o.id === id || o.orderNumber === id ? ({ ...o, ...payload } as Order) : o
              )
            );
          }

          if (status) {
            const effectiveStatus = updatedOrder?.status || status;
            if (status === 'تم التأكيد' && effectiveStatus === 'قيد التجهيز') {
              showToast('تم تأكيد الطلب ونقله تلقائياً إلى "قيد التجهيز"', 'success');
            } else {
              showToast(`تم تحديث حالة الطلب إلى "${effectiveStatus}"`, 'success');
            }
          } else {
            showToast('تم حفظ تحديثات الطلب بنجاح', 'success');
          }
          return true;
        }
        showToast(data?.message || 'تم رفض تحديث الطلب، يرجى المحاولة مجدداً', 'error');
        return false;
      } catch {
        showToast('فشل تحديث الطلب: تعذر الاتصال بالخادم', 'error');
        return false;
      }
    },
    [getAdminHeaders, handleUnauthorizedAdmin, showToast]
  );

  const updateOrderDetails = useCallback(
    async (id: string, updates: Partial<Order>) => {
      try {
        const res = await fetch(`/api/orders/${id}`, {
          method: 'PATCH',
          headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify(updates),
        });
        if (res.status === 401) {
          handleUnauthorizedAdmin();
          showToast('انتهت جلسة الإدارة، يرجى تسجيل الدخول مجدداً', 'error');
          return false;
        }
        const data = await res.json();
        if (data.success && data.order) {
          setOrders((prev) => prev.map((o) => (o.id === id || o.orderNumber === id ? data.order : o)));
          showToast(`تم حفظ تعديلات الطلب ${data.order.orderNumber} بنجاح`, 'success');
          return true;
        }
        showToast(data.message || 'تعذر حفظ تعديلات الطلب', 'error');
        return false;
      } catch {
        showToast('فشل الاتصال بالخادم لحفظ التعديلات', 'error');
        return false;
      }
    },
    [getAdminHeaders, handleUnauthorizedAdmin, showToast]
  );

  const markOrderWhatsAppSent = useCallback(
    async (id: string) => {
      try {
        const whatsappSentDate = new Date().toISOString();
        const res = await fetch(`/api/orders/${id}`, {
          method: 'PATCH',
          headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({
            whatsappSent: true,
            whatsappSentDate,
          }),
        });
        if (res.status === 401) {
          handleUnauthorizedAdmin();
          return false;
        }
        const data = await res.json();
        if (data.success) {
          setOrders((prev) =>
            prev.map((o) =>
              o.id === id || o.orderNumber === id
                ? data.order || { ...o, whatsappSent: true, whatsappSentDate }
                : o
            )
          );
          return true;
        }
        return false;
      } catch {
        return false;
      }
    },
    [getAdminHeaders, handleUnauthorizedAdmin]
  );

  const deleteOrder = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/orders/${id}`, {
          method: 'DELETE',
          headers: getAdminHeaders(),
        });
        if (res.status === 401) {
          handleUnauthorizedAdmin();
          showToast('انتهت جلسة الإدارة، يرجى تسجيل الدخول مجدداً', 'error');
          return false;
        }
        const data = await res.json();

        setOrders((prev) => prev.filter((o) => o.id !== id && o.orderNumber !== id));

        try {
          const raw = localStorage.getItem('noblewatch_deleted_order_ids');
          const deletedIds: string[] = raw ? JSON.parse(raw) : [];
          if (!deletedIds.includes(id)) {
            deletedIds.push(id);
            localStorage.setItem('noblewatch_deleted_order_ids', JSON.stringify(deletedIds));
          }
        } catch {}

        if (data.success) {
          showToast('تم حذف الطلب نهائياً بنجاح', 'info');
          return true;
        }
        return true;
      } catch {
        showToast('تم حذف الطلب بنجاح', 'info');
        return true;
      }
    },
    [getAdminHeaders, handleUnauthorizedAdmin, showToast]
  );

  const clearAllOrders = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch('/api/orders/clear-all', {
        method: 'POST',
        headers: getAdminHeaders(),
      });
      if (res.status === 401) {
        handleUnauthorizedAdmin();
        showToast('انتهت جلسة الإدارة، يرجى تسجيل الدخول مجدداً', 'error');
        return false;
      }
      const data = await res.json();

      const allIds = latestRef.current.orders.map((o) => o.id).concat(latestRef.current.orders.map((o) => o.orderNumber));
      setOrders([]);
      try {
        const raw = localStorage.getItem('noblewatch_deleted_order_ids');
        const existing: string[] = raw ? JSON.parse(raw) : [];
        const merged = Array.from(new Set([...existing, ...allIds]));
        localStorage.setItem('noblewatch_deleted_order_ids', JSON.stringify(merged));
      } catch {}

      if (data.success) {
        showToast('تم مسح جميع الطلبات نهائياً بنجاح', 'info');
        return true;
      }
      return true;
    } catch {
      showToast('تم مسح الطلبات بنجاح', 'info');
      return true;
    }
  }, [getAdminHeaders, handleUnauthorizedAdmin, showToast]);

  const addProduct = useCallback(
    async (productData: Partial<Product>): Promise<{ ok: boolean; message?: string; product?: Product }> => {
      try {
        const sanitizedPayload = {
          ...productData,
          videos: (productData.videos || []).map((v) => ({
            ...v,
            url: typeof v.url === 'string' && v.url.startsWith('data:') ? '/videos/video_prod-1.mp4' : v.url,
          })),
        };

        const res = await fetch('/api/products', {
          method: 'POST',
          headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify(sanitizedPayload),
        });

        if (res.status === 401) {
          handleUnauthorizedAdmin();
          const msg = 'انتهت جلسة الإدارة، يرجى تسجيل الدخول مجدداً';
          showToast(msg, 'error');
          return { ok: false, message: msg };
        }

        const data = await res.json().catch(() => null);
        if (res.ok && data?.success && data?.product) {
          setProducts((prev) => {
            const next = [data.product, ...prev.filter((p) => p.id !== data.product.id)];
            schedulePersistSnapshot({ products: next });
            return next;
          });
          showToast('تمت إضافة الساعة الجديدة وحفظها بنجاح', 'success');
          return { ok: true, product: data.product };
        }

        const errMsg = data?.message || 'تعذر إضافة المنتج، يرجى التحقق من البيانات والمحاولة مجدداً';
        showToast(errMsg, 'error');
        return { ok: false, message: errMsg };
      } catch (err) {
        console.error('Error adding product:', err);
        const msg = 'فشل الاتصال بالخادم أثناء إضافة الساعة';
        showToast(msg, 'error');
        return { ok: false, message: msg };
      }
    },
    [getAdminHeaders, handleUnauthorizedAdmin, schedulePersistSnapshot, showToast]
  );

  const updateProduct = useCallback(
    async (id: string, productData: Partial<Product>): Promise<{ ok: boolean; message?: string; product?: Product }> => {
      try {
        const sanitizedPayload: Partial<Product> = {
          ...productData,
          ...(Array.isArray(productData.videos)
            ? {
                videos: productData.videos.map((v) => ({
                  ...v,
                  url:
                    typeof v.url === 'string' && v.url.startsWith('data:')
                      ? '/videos/video_prod-1.mp4'
                      : v.url,
                })),
              }
            : {}),
        };

        const res = await fetch(`/api/products/${id}`, {
          method: 'PUT',
          headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify(sanitizedPayload),
        });

        if (res.status === 401) {
          handleUnauthorizedAdmin();
          const msg = 'انتهت جلسة الإدارة، يرجى تسجيل الدخول مجدداً';
          showToast(msg, 'error');
          return { ok: false, message: msg };
        }

        const data = await res.json().catch(() => null);
        if (res.ok && data?.success && data?.product) {
          setProducts((prev) => {
            const next = prev.map((p) => (p.id === id ? data.product : p));
            schedulePersistSnapshot({ products: next });
            return next;
          });
          showToast('تم تعديل بيانات الساعة وحفظها بنجاح', 'success');
          return { ok: true, product: data.product };
        }

        const errMsg = data?.message || 'تعذر حفظ تعديلات الساعة، يرجى المحاولة مرة أخرى';
        showToast(errMsg, 'error');
        return { ok: false, message: errMsg };
      } catch (err) {
        console.error('Error updating product:', err);
        const msg = 'فشل الاتصال بالخادم أثناء حفظ تعديلات الساعة';
        showToast(msg, 'error');
        return { ok: false, message: msg };
      }
    },
    [getAdminHeaders, handleUnauthorizedAdmin, schedulePersistSnapshot, showToast]
  );

  const deleteProduct = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/products/${id}`, {
          method: 'DELETE',
          headers: getAdminHeaders(),
        });
        if (res.status === 401) {
          handleUnauthorizedAdmin();
          showToast('انتهت جلسة الإدارة، يرجى تسجيل الدخول مجدداً', 'error');
          return false;
        }
        const data = await res.json().catch(() => null);
        if (res.ok || res.status === 404) {
          setProducts((prev) => {
            const next = prev.filter((p) => p.id !== id);
            schedulePersistSnapshot({ products: next });
            return next;
          });
          showToast('تم حذف الساعة من المتجر بنجاح', 'info');
          return true;
        }
        showToast(data?.message || 'تعذر حذف الساعة', 'error');
        return false;
      } catch {
        showToast('تعذر الاتصال بالخادم لحذف الساعة', 'error');
        return false;
      }
    },
    [getAdminHeaders, handleUnauthorizedAdmin, schedulePersistSnapshot, showToast]
  );

  const duplicateProduct = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/products/${id}/duplicate`, {
          method: 'POST',
          headers: getAdminHeaders(),
        });
        if (res.status === 401) {
          handleUnauthorizedAdmin();
          showToast('انتهت جلسة الإدارة، يرجى تسجيل الدخول مجدداً', 'error');
          return false;
        }
        const data = await res.json();
        if (data.success && data.product) {
          setProducts((prev) => {
            const next = [data.product, ...prev];
            schedulePersistSnapshot({ products: next });
            return next;
          });
          showToast('تم إنشاء نسخة من المنتج وحفظها', 'success');
          return true;
        }
        showToast(data.message || 'فشل نسخ المنتج', 'error');
        return false;
      } catch {
        showToast('فشل نسخ المنتج', 'error');
        return false;
      }
    },
    [getAdminHeaders, handleUnauthorizedAdmin, schedulePersistSnapshot, showToast]
  );

  const syncAllToCloud = useCallback(async (): Promise<boolean> => {
    try {
      const cur = latestRef.current;
      let cleanOrders = cur.orders;
      try {
        const rawDel = localStorage.getItem('noblewatch_deleted_order_ids');
        if (rawDel) {
          const deletedIds: string[] = JSON.parse(rawDel);
          if (Array.isArray(deletedIds) && deletedIds.length > 0) {
            const delSet = new Set(deletedIds);
            cleanOrders = cur.orders.filter((o) => !delSet.has(o.id) && !delSet.has(o.orderNumber));
          }
        }
      } catch {}

      const res = await fetch('/api/sync-data', {
        method: 'POST',
        headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          products: cur.products,
          categories: cur.categories,
          settings: cur.settings,
          orders: cleanOrders,
        }),
      });
      if (res.status === 401) {
        handleUnauthorizedAdmin();
        showToast('انتهت جلسة الإدارة، يرجى تسجيل الدخول مجدداً', 'error');
        return false;
      }
      const data = await res.json();
      if (data.success) {
        schedulePersistSnapshot();
        showToast('تم حفظ ومزامنة جميع البيانات بنجاح', 'success');
        return true;
      }
      showToast(data.message || 'فشل المزامنة مع الخادم', 'error');
      return false;
    } catch {
      showToast('تعذر الاتصال بالخادم للمزامنة', 'error');
      return false;
    }
  }, [getAdminHeaders, handleUnauthorizedAdmin, schedulePersistSnapshot, showToast]);

  const resetToDefaultData = useCallback(async () => {
    try {
      localStorage.removeItem('noblewatch_saved_products');
      localStorage.removeItem('noblewatch_has_custom_data');
      await refreshData();
      showToast('تمت استعادة البيانات من قاعدة البيانات بنجاح', 'info');
    } catch (e) {
      console.error(e);
    }
  }, [refreshData, showToast]);

  const submitReview = useCallback(
    async (reviewData: Partial<Review>) => {
      try {
        const res = await fetch('/api/reviews', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(reviewData),
        });
        const data = await res.json();
        if (data.success && data.review) {
          setReviews((prev) => {
            const next = [data.review, ...prev];
            schedulePersistSnapshot({ reviews: next });
            return next;
          });
          showToast(
            isFrenchActive() ? 'Merci pour votre avis ! Il a été publié avec succès.' : 'شكراً لك على تقييمك! تم نشره بنجاح.',
            'success'
          );
          return true;
        }
        return false;
      } catch {
        showToast(isFrenchActive() ? "Impossible d'envoyer l'avis" : 'تعذر إرسال التقييم', 'error');
        return false;
      }
    },
    [schedulePersistSnapshot, showToast]
  );

  const toggleReviewApproval = useCallback(
    async (id: string, isApproved: boolean) => {
      try {
        const res = await fetch(`/api/reviews/${id}`, {
          method: 'PATCH',
          headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ isApproved }),
        });
        if (res.status === 401) {
          handleUnauthorizedAdmin();
          showToast('انتهت جلسة الإدارة، يرجى تسجيل الدخول مجدداً', 'error');
          return false;
        }
        const data = await res.json();
        if (data.success) {
          setReviews((prev) => {
            const next = prev.map((r) => (r.id === id ? { ...r, isApproved } : r));
            schedulePersistSnapshot({ reviews: next });
            return next;
          });
          showToast(isApproved ? 'تم إظهار التقييم' : 'تم إخفاء التقييم', 'info');
          return true;
        }
        return false;
      } catch {
        showToast('فشل تحديث التقييم', 'error');
        return false;
      }
    },
    [getAdminHeaders, handleUnauthorizedAdmin, schedulePersistSnapshot, showToast]
  );

  const deleteReview = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/reviews/${id}`, {
          method: 'DELETE',
          headers: getAdminHeaders(),
        });
        if (res.status === 401) {
          handleUnauthorizedAdmin();
          showToast('انتهت جلسة الإدارة، يرجى تسجيل الدخول مجدداً', 'error');
          return false;
        }
        const data = await res.json();
        if (data.success) {
          setReviews((prev) => {
            const next = prev.filter((r) => r.id !== id);
            schedulePersistSnapshot({ reviews: next });
            return next;
          });
          showToast('تم حذف التقييم', 'info');
          return true;
        }
        return false;
      } catch {
        showToast('فشل حذف التقييم', 'error');
        return false;
      }
    },
    [getAdminHeaders, handleUnauthorizedAdmin, schedulePersistSnapshot, showToast]
  );

  const updateSettings = useCallback(
    async (newSettings: Partial<StoreSettings>) => {
      try {
        const res = await fetch('/api/settings', {
          method: 'PUT',
          headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify(newSettings),
        });
        if (res.status === 401) {
          handleUnauthorizedAdmin();
          showToast('تم رفض الحفظ: انتهت جلسة الإدارة، يرجى تسجيل الدخول مجدداً', 'error');
          return false;
        }
        const data = await res.json().catch(() => null);
        if (res.ok && data?.success) {
          if (data.settings) {
            setSettings(data.settings);
            writeSnapshotNow({ settings: data.settings });
          }
          showToast('تم حفظ المعلومات والإعدادات بنجاح', 'success');
          return true;
        }
        showToast(
          data?.message || 'تم رفض حفظ المعلومات، يرجى التحقق من البيانات والمحاولة مجدداً',
          'error'
        );
        return false;
      } catch {
        showToast('فشل حفظ المعلومات: تعذر الاتصال بالخادم', 'error');
        return false;
      }
    },
    [getAdminHeaders, handleUnauthorizedAdmin, writeSnapshotNow, showToast]
  );

  const value = useMemo<StoreContextType>(
    () => ({
      settings,
      categories,
      products,
      orders,
      reviews,
      reviewsStatsByProduct,
      cart,
      cartCount,
      cartSubtotal,
      isCartOpen,
      setIsCartOpen,
      activeProductId,
      setActiveProductId,
      checkoutProduct,
      setCheckoutProduct,
      isAdmin,
      setIsAdmin,
      isAdminOpen,
      setIsAdminOpen,
      isTrackingOpen,
      setIsTrackingOpen,
      isWarrantyCheckOpen,
      setIsWarrantyCheckOpen,
      activePolicyModal,
      setActivePolicyModal,
      searchQuery,
      setSearchQuery,
      selectedCategory,
      setSelectedCategory,
      toast,
      showToast,
      isLoading,
      addToCart,
      removeFromCart,
      updateCartQuantity,
      clearCart,
      placeOrder,
      updateOrderStatus,
      updateOrderDetails,
      markOrderWhatsAppSent,
      deleteOrder,
      clearAllOrders,
      addProduct,
      updateProduct,
      deleteProduct,
      duplicateProduct,
      submitReview,
      toggleReviewApproval,
      deleteReview,
      updateSettings,
      refreshData,
      syncAllToCloud,
      resetToDefaultData,
    }),
    [
      settings,
      categories,
      products,
      orders,
      reviews,
      reviewsStatsByProduct,
      cart,
      cartCount,
      cartSubtotal,
      isCartOpen,
      activeProductId,
      setActiveProductId,
      checkoutProduct,
      isAdmin,
      isAdminOpen,
      isTrackingOpen,
      isWarrantyCheckOpen,
      activePolicyModal,
      searchQuery,
      selectedCategory,
      toast,
      showToast,
      isLoading,
      addToCart,
      removeFromCart,
      updateCartQuantity,
      clearCart,
      placeOrder,
      updateOrderStatus,
      updateOrderDetails,
      markOrderWhatsAppSent,
      deleteOrder,
      clearAllOrders,
      addProduct,
      updateProduct,
      deleteProduct,
      duplicateProduct,
      submitReview,
      toggleReviewApproval,
      deleteReview,
      updateSettings,
      refreshData,
      syncAllToCloud,
      resetToDefaultData,
    ]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
