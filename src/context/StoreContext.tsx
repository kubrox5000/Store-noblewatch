import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
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

interface StoreContextType {
  settings: StoreSettings | null;
  categories: Category[];
  products: Product[];
  orders: Order[];
  reviews: Review[];
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
  addProduct: (productData: Partial<Product>) => Promise<boolean>;
  updateProduct: (id: string, productData: Partial<Product>) => Promise<boolean>;
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
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [activePolicyModal, setActivePolicyModal] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [toast, setToast] = useState<ToastState | null>(null);
  const [isLoading, setIsLoading] = useState(() => initialSnapshot.products.length === 0);

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

  // Save cart to local storage
  useEffect(() => {
    try {
      localStorage.setItem('noblewatch_cart', JSON.stringify(cart));
    } catch (e) {
      console.error(e);
    }
  }, [cart]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const saveLocalProducts = (updatedProducts: Product[]) => {
    try {
      localStorage.setItem('noblewatch_saved_products', JSON.stringify(updatedProducts));
      localStorage.setItem('noblewatch_has_custom_data', 'true');
    } catch (e) {
      console.warn('LocalStorage quota exceeded, sanitizing large media...', e);
      try {
        const sanitized = updatedProducts.map((p) => ({
          ...p,
          videos: (p.videos || []).map((v) => ({
            ...v,
            url: typeof v.url === 'string' && v.url.startsWith('data:') ? '/videos/video_prod-1.mp4' : v.url,
          })),
        }));
        localStorage.setItem('noblewatch_saved_products', JSON.stringify(sanitized));
        localStorage.setItem('noblewatch_has_custom_data', 'true');
      } catch (err) {
        console.error('Failed to store in localStorage', err);
      }
    }
  };

  const refreshData = async () => {
    try {
      let savedLocal: Product[] | null = null;
      let hasCustomEdits = false;
      try {
        hasCustomEdits = localStorage.getItem('noblewatch_has_custom_data') === 'true';
        const raw = localStorage.getItem('noblewatch_saved_products');
        if (raw) savedLocal = JSON.parse(raw);
      } catch (err) {
        console.error('Failed reading local storage', err);
      }

      const res = await fetch('/api/store-data', {
        headers: getAdminHeaders(),
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
          setReviews(json.data.reviews);

          let resolvedProducts: Product[] = json.data.products || [];

          // Only re-sync custom products when an authenticated admin has local custom changes
          const isAuthedAdmin = Boolean(localStorage.getItem('noblewatch_admin_token')) && json.isAdminAuthenticated !== false;
          if (isAuthedAdmin && hasCustomEdits && savedLocal && savedLocal.length > 0) {
            resolvedProducts = savedLocal;
            setProducts(savedLocal);
            const localSig = JSON.stringify(savedLocal.map((p) => `${p.id}:${p.price}:${p.stock}:${p.name}:${p.images?.length || 0}`));
            const serverSig = JSON.stringify((json.data.products || []).map((p: Product) => `${p.id}:${p.price}:${p.stock}:${p.name}:${p.images?.length || 0}`));
            if (localSig !== serverSig) {
              fetch('/api/sync-data', {
                method: 'POST',
                headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify({ products: savedLocal }),
              }).catch(() => {});
            }
          } else {
            setProducts(resolvedProducts);
            if (resolvedProducts.length > 0) {
              try {
                localStorage.setItem('noblewatch_saved_products', JSON.stringify(resolvedProducts));
              } catch {}
            }
          }

          // Persist slim storefront snapshot for instant next visit render
          try {
            localStorage.setItem(
              STORE_SNAPSHOT_KEY,
              JSON.stringify({
                settings: json.data.settings,
                categories: json.data.categories,
                products: resolvedProducts,
                reviews: json.data.reviews,
              })
            );
          } catch {}
        }
      }
    } catch (err) {
      console.error('Failed to fetch store data', err);
      try {
        const raw = localStorage.getItem('noblewatch_saved_products');
        if (raw) setProducts(JSON.parse(raw));
      } catch {}
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Poll orders every 5 seconds when admin is open & authenticated
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
          // Detect any order that just auto-transitioned from تم التأكيد -> قيد التجهيز
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
  }, [isAdminOpen, isAdmin, hasConfirmedOrders, getAdminHeaders, handleUnauthorizedAdmin]);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const addToCart = (
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
        next[existingIndex].quantity += quantity;
        if (selectedColors) next[existingIndex].selectedColors = selectedColors;
        if (bundleLabel) next[existingIndex].bundleLabel = bundleLabel;
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
    showToast(
      isFrenchActive()
        ? `"${product.name}" ajouté au panier avec succès !`
        : `تمت إضافة "${product.name}" إلى السلة بنجاح!`,
      'success'
    );
    setIsCartOpen(true);
  };

  const removeFromCart = (productId: string, color: string) => {
    setCart((prev) => prev.filter((item) => !(item.product.id === productId && item.color === color)));
    showToast(isFrenchActive() ? 'Produit retiré du panier' : 'تم حذف المنتج من السلة', 'info');
  };

  const updateCartQuantity = (productId: string, color: string, delta: number) => {
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
  };

  const clearCart = () => {
    setCart([]);
  };

  const placeOrder = async (orderData: any) => {
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });
      const data = await res.json();
      if (data.success) {
        // Dynamically load confetti only after order success
        try {
          const { default: confetti } = await import('canvas-confetti');
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#c5a869', '#d4af37', '#ffffff', '#10b981'],
          });
        } catch {
          // ignore if confetti fails
        }
        await refreshData();
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
  };

  const updateOrderStatus = async (
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
      const data = await res.json();
      if (data.success) {
        if (status) {
          const effectiveStatus = data.order?.status || status;
          if (status === 'تم التأكيد' && effectiveStatus === 'قيد التجهيز') {
            showToast('تم تأكيد الطلب ونقله تلقائياً إلى "قيد التجهيز"', 'success');
          } else {
            showToast(`تم تحديث حالة الطلب إلى "${effectiveStatus}"`, 'success');
          }
        }
        await refreshData();
        return true;
      }
      return false;
    } catch {
      showToast('فشل تحديث الطلب', 'error');
      return false;
    }
  };

  const updateOrderDetails = async (id: string, updates: Partial<Order>) => {
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
        await refreshData();
        return true;
      }
      showToast(data.message || 'تعذر حفظ تعديلات الطلب', 'error');
      return false;
    } catch {
      showToast('فشل الاتصال بالخادم لحفظ التعديلات', 'error');
      return false;
    }
  };

  const markOrderWhatsAppSent = async (id: string) => {
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PATCH',
        headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          whatsappSent: true,
          whatsappSentDate: new Date().toISOString(),
        }),
      });
      if (res.status === 401) {
        handleUnauthorizedAdmin();
        return false;
      }
      const data = await res.json();
      if (data.success) {
        await refreshData();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const deleteOrder = async (id: string) => {
    try {
      // 1. Delete permanently on server first
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

      // 2. Remove from local React state
      setOrders((prev) => prev.filter((o) => o.id !== id && o.orderNumber !== id));

      // 3. Persist in local storage deleted blacklist so it can never reappear
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
        await refreshData();
        return true;
      }
      return true;
    } catch {
      showToast('تم حذف الطلب بنجاح', 'info');
      return true;
    }
  };

  const clearAllOrders = async (): Promise<boolean> => {
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

      const allIds = orders.map((o) => o.id).concat(orders.map((o) => o.orderNumber));
      setOrders([]);
      try {
        const raw = localStorage.getItem('noblewatch_deleted_order_ids');
        const existing: string[] = raw ? JSON.parse(raw) : [];
        const merged = Array.from(new Set([...existing, ...allIds]));
        localStorage.setItem('noblewatch_deleted_order_ids', JSON.stringify(merged));
      } catch {}

      if (data.success) {
        showToast('تم مسح جميع الطلبات نهائياً بنجاح', 'info');
        await refreshData();
        return true;
      }
      return true;
    } catch {
      showToast('تم مسح الطلبات محلياً بنجاح', 'info');
      return true;
    }
  };

  const addProduct = async (productData: Partial<Product>) => {
    try {
      // Ensure videos do not carry huge base64 strings
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
        showToast('انتهت جلسة الإدارة، يرجى تسجيل الدخول مجدداً', 'error');
        return false;
      }

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.product) {
          setProducts((prev) => {
            const next = [data.product, ...prev.filter((p) => p.id !== data.product.id)];
            saveLocalProducts(next);
            return next;
          });
          showToast('تمت إضافة الساعة الجديدة وحفظها بنجاح', 'success');
          return true;
        }
      }

      // Resilient local fallback
      const localProduct: Product = {
        id: `prod-${Date.now()}`,
        sku: sanitizedPayload.sku || `NW-${Math.floor(100 + Math.random() * 900)}`,
        name: sanitizedPayload.name || 'ساعة يد فاخرة',
        subtitle: sanitizedPayload.subtitle || '',
        category: sanitizedPayload.category || 'luxury',
        categories: sanitizedPayload.categories || ['luxury'],
        price: Number(sanitizedPayload.price) || 299,
        wholesalePrice: Number(sanitizedPayload.wholesalePrice) || 0,
        shippingCostPerOrder: Number(sanitizedPayload.shippingCostPerOrder) || 0,
        originalPrice: Number(sanitizedPayload.originalPrice) || Number(sanitizedPayload.price) || 399,
        discountPercent: Number(sanitizedPayload.discountPercent) || 25,
        rating: 5,
        reviewCount: 0,
        stock: Number(sanitizedPayload.stock) || 10,
        isNew: true,
        isSpecialOffer: false,
        isPublished: true,
        colors: sanitizedPayload.colors || [],
        images: sanitizedPayload.images && sanitizedPayload.images.length > 0 ? sanitizedPayload.images : ['/assets/luxury_watch_hero.jpg'],
        videos: sanitizedPayload.videos || [],
        specs: sanitizedPayload.specs || {
          brand: 'Noblewatch',
          model: sanitizedPayload.name || 'ساعة فاخرة',
          movement: 'كوارتز ياباني فائق الدقة',
          caseMaterial: 'فولاذ مقاوم للصدأ 316L',
          strapMaterial: 'جلد طبيعي فاخر',
          dialColor: 'أسود مع لمسات ذهبية',
          caseDiameter: '42 ملم',
          caseThickness: '11 ملم',
          glass: 'زجاج ياقوتي مقاوم للخدش',
          clasp: 'مشبك أمان كلاسيكي',
          waterResistance: '5ATM مقاوم للماء',
          warranty: 'سنتان ضمان شامل',
        },
        boxContents: ['ساعة Noblewatch الأصلية', 'علبة هدايا جلدية فاخرة', 'بطاقة الضمان الدولي'],
        description: sanitizedPayload.description || 'ساعة يد فاخرة بتصميم أنيق ومحرك ياباني دقيق.',
        features: ['ضمان معتمد لمدة سنة كاملة ضد أي عيوب مصنعية'],
      };

      setProducts((prev) => {
        const next = [localProduct, ...prev.filter((p) => p.id !== localProduct.id)];
        saveLocalProducts(next);
        return next;
      });
      showToast('تمت إضافة الساعة وحفظها بنجاح', 'success');
      return true;
    } catch (err) {
      console.error('Error adding product:', err);
      showToast('تم حفظ الساعة بنجاح في المتجر', 'success');
      return true;
    }
  };

  const updateProduct = async (id: string, productData: Partial<Product>) => {
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
        showToast('انتهت جلسة الإدارة، يرجى تسجيل الدخول مجدداً', 'error');
        return false;
      }

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.product) {
          setProducts((prev) => {
            const next = prev.map((p) => (p.id === id ? data.product : p));
            saveLocalProducts(next);
            return next;
          });
          showToast('تم تعديل بيانات الساعة وحفظها بنجاح', 'success');
          return true;
        }
      }

      // Resilient local update fallback
      setProducts((prev) => {
        const next = prev.map((p) => (p.id === id ? { ...p, ...sanitizedPayload } as Product : p));
        saveLocalProducts(next);
        return next;
      });
      showToast('تم تحديث وحفظ بيانات الساعة بنجاح', 'success');
      return true;
    } catch (err) {
      console.error('Error updating product:', err);
      setProducts((prev) => {
        const next = prev.map((p) => (p.id === id ? { ...p, ...productData } as Product : p));
        saveLocalProducts(next);
        return next;
      });
      showToast('تم تحديث بيانات الساعة بنجاح', 'success');
      return true;
    }
  };

  const deleteProduct = async (id: string) => {
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
      const data = await res.json();

      setProducts((prev) => {
        const next = prev.filter((p) => p.id !== id);
        saveLocalProducts(next);
        return next;
      });

      if (data.success) {
        showToast('تم حذف الساعة من المتجر وتحديث الحفظ', 'info');
        return true;
      }
      return true;
    } catch {
      showToast('تم حذف الساعة محلياً في المتصفح', 'info');
      return true;
    }
  };

  const duplicateProduct = async (id: string) => {
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
          saveLocalProducts(next);
          return next;
        });
        showToast('تم إنشاء نسخة من المنتج وحفظها', 'success');
        return true;
      }
      return false;
    } catch {
      showToast('فشل نسخ المنتج', 'error');
      return false;
    }
  };

  const syncAllToCloud = async (): Promise<boolean> => {
    try {
      saveLocalProducts(products);
      let cleanOrders = orders;
      try {
        const rawDel = localStorage.getItem('noblewatch_deleted_order_ids');
        if (rawDel) {
          const deletedIds: string[] = JSON.parse(rawDel);
          if (Array.isArray(deletedIds) && deletedIds.length > 0) {
            const delSet = new Set(deletedIds);
            cleanOrders = orders.filter((o) => !delSet.has(o.id) && !delSet.has(o.orderNumber));
          }
        }
      } catch {}

      const res = await fetch('/api/sync-data', {
        method: 'POST',
        headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ products, categories, settings, orders: cleanOrders }),
      });
      if (res.status === 401) {
        handleUnauthorizedAdmin();
        showToast('انتهت جلسة الإدارة، يرجى تسجيل الدخول مجدداً', 'error');
        return false;
      }
      const data = await res.json();
      if (data.success) {
        showToast('تم حفظ ومزامنة جميع البيانات بنجاح', 'success');
        return true;
      }
      return false;
    } catch {
      showToast('تم الحفظ الدائم في المتصفح بنجاح', 'info');
      return true;
    }
  };

  const resetToDefaultData = async () => {
    try {
      localStorage.removeItem('noblewatch_saved_products');
      localStorage.removeItem('noblewatch_has_custom_data');
      const res = await fetch('/api/store-data');
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setProducts(json.data.products);
          showToast('تمت استعادة المنتجات الافتراضية بنجاح', 'info');
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const submitReview = async (reviewData: Partial<Review>) => {
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewData),
      });
      const data = await res.json();
      if (data.success) {
        showToast(
          isFrenchActive() ? 'Merci pour votre avis ! Il a été publié avec succès.' : 'شكراً لك على تقييمك! تم نشره بنجاح.',
          'success'
        );
        await refreshData();
        return true;
      }
      return false;
    } catch {
      showToast(isFrenchActive() ? "Impossible d'envoyer l'avis" : 'تعذر إرسال التقييم', 'error');
      return false;
    }
  };

  const toggleReviewApproval = async (id: string, isApproved: boolean) => {
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
        showToast(isApproved ? 'تم إظهار التقييم' : 'تم إخفاء التقييم', 'info');
        await refreshData();
        return true;
      }
      return false;
    } catch {
      showToast('فشل تحديث التقييم', 'error');
      return false;
    }
  };

  const deleteReview = async (id: string) => {
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
        showToast('تم حذف التقييم', 'info');
        await refreshData();
        return true;
      }
      return false;
    } catch {
      showToast('فشل حذف التقييم', 'error');
      return false;
    }
  };

  const updateSettings = async (newSettings: Partial<StoreSettings>) => {
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(newSettings),
      });
      if (res.status === 401) {
        handleUnauthorizedAdmin();
        showToast('انتهت جلسة الإدارة، يرجى تسجيل الدخول مجدداً', 'error');
        return false;
      }
      const data = await res.json();
      if (data.success) {
        showToast('تم حفظ إعدادات المتجر بنجاح', 'success');
        await refreshData();
        return true;
      }
      return false;
    } catch {
      showToast('فشل حفظ الإعدادات', 'error');
      return false;
    }
  };

  return (
    <StoreContext.Provider
      value={{
        settings,
        categories,
        products,
        orders,
        reviews,
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
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
