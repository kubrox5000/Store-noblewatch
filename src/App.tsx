import React, { Suspense, lazy, useEffect, useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { StoreProvider, useStore } from './context/StoreContext';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { TrustGuarantees } from './components/TrustGuarantees';
import { CategoriesSection } from './components/CategoriesSection';
import { HowToOrderSection } from './components/HowToOrderSection';
import { ProductGrid } from './components/ProductGrid';
import { Footer } from './components/Footer';
import { initTrackingPixels, trackPixelPageView } from './utils/trackingPixels';
import { applyDynamicSeo } from './utils/seo';
import { buildWhatsAppUrl } from './utils/constants';
import { CheckCircle, AlertCircle, Info, Sparkles, Compass, ShoppingBag, MessageCircle } from 'lucide-react';

// Code-split below-the-fold sections and heavy modals to shrink initial First Load JS
const ProductVideoSection = lazy(() =>
  import('./components/ProductVideoSection').then((m) => ({ default: m.ProductVideoSection }))
);
const WhyChooseUs = lazy(() =>
  import('./components/WhyChooseUs').then((m) => ({ default: m.WhyChooseUs }))
);
const CustomerReviews = lazy(() =>
  import('./components/CustomerReviews').then((m) => ({ default: m.CustomerReviews }))
);
const ProductDetailPage = lazy(() =>
  import('./components/ProductDetailPage').then((m) => ({ default: m.ProductDetailPage }))
);
const CodCheckoutModal = lazy(() =>
  import('./components/CodCheckoutModal').then((m) => ({ default: m.CodCheckoutModal }))
);
const CartDrawer = lazy(() =>
  import('./components/CartDrawer').then((m) => ({ default: m.CartDrawer }))
);
const OrderTrackingModal = lazy(() =>
  import('./components/OrderTrackingModal').then((m) => ({ default: m.OrderTrackingModal }))
);
const AdminDashboard = lazy(() =>
  import('./components/AdminDashboard').then((m) => ({ default: m.AdminDashboard }))
);
const PoliciesModal = lazy(() =>
  import('./components/PoliciesModal').then((m) => ({ default: m.PoliciesModal }))
);
const CustomerOrderActionModal = lazy(() =>
  import('./components/CustomerOrderActionModal').then((m) => ({ default: m.CustomerOrderActionModal }))
);
const WarrantyVerificationModal = lazy(() =>
  import('./components/WarrantyVerificationModal').then((m) => ({ default: m.WarrantyVerificationModal }))
);

const ProductDetailSkeleton: React.FC = () => {
  const { isFr } = useLanguage();
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse" dir={isFr ? 'ltr' : 'rtl'}>
      <div className="h-5 w-40 bg-gray-200 rounded-lg mb-6" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="aspect-square rounded-3xl bg-gray-200/80" />
        <div className="space-y-4 py-4">
          <div className="h-8 w-3/4 bg-gray-200 rounded-xl" />
          <div className="h-5 w-1/2 bg-gray-200 rounded-lg" />
          <div className="h-12 w-1/3 bg-amber-100 rounded-xl mt-4" />
          <div className="h-32 w-full bg-gray-100 rounded-2xl mt-6" />
          <div className="h-14 w-full bg-amber-200/60 rounded-2xl mt-4" />
        </div>
      </div>
    </div>
  );
};

const MainContent: React.FC = () => {
  const { lang, isFr } = useLanguage();
  const {
    activeProductId,
    setActiveProductId,
    products,
    reviews,
    toast,
    cartCount,
    isCartOpen,
    setIsCartOpen,
    checkoutProduct,
    isAdminOpen,
    isTrackingOpen,
    isWarrantyCheckOpen,
    activePolicyModal,
    settings,
  } = useStore();

  const [hasConfirmOrderHash, setHasConfirmOrderHash] = useState(() =>
    window.location.hash.startsWith('#confirm-order')
  );
  const [hasWarrantyHash, setHasWarrantyHash] = useState(() =>
    window.location.hash.startsWith('#warranty')
  );

  useEffect(() => {
    const onHash = () => {
      setHasConfirmOrderHash(window.location.hash.startsWith('#confirm-order'));
      setHasWarrantyHash(window.location.hash.startsWith('#warranty'));
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  // Prefetch frequently used storefront chunks during idle time for zero-delay transitions
  useEffect(() => {
    const prefetch = () => {
      import('./components/ProductDetailPage').catch(() => {});
      import('./components/CodCheckoutModal').catch(() => {});
    };
    const w = window as unknown as {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    if (typeof w.requestIdleCallback === 'function') {
      const id = w.requestIdleCallback(prefetch, { timeout: 1500 });
      return () => w.cancelIdleCallback?.(id);
    }
    const timer = window.setTimeout(prefetch, 700);
    return () => window.clearTimeout(timer);
  }, []);

  const selectedProduct = activeProductId
    ? products.find((p) => p.id === activeProductId)
    : null;

  useEffect(() => {
    if (settings?.trackingPixels) {
      initTrackingPixels(settings.trackingPixels);
    }
  }, [
    settings?.trackingPixels?.facebookEnabled,
    settings?.trackingPixels?.facebookPixelId,
    settings?.trackingPixels?.googleEnabled,
    settings?.trackingPixels?.googleTagId,
    settings?.trackingPixels?.googleAdsConversionLabel,
    settings?.trackingPixels?.tiktokEnabled,
    settings?.trackingPixels?.tiktokPixelId,
  ]);

  const prevRouteProductIdRef = React.useRef<string | null | undefined>(undefined);
  useEffect(() => {
    const resolvedTitle = applyDynamicSeo({
      lang,
      selectedProduct,
      products,
      reviews,
      settings,
    });
    const currentId = selectedProduct?.id || null;
    if (prevRouteProductIdRef.current !== undefined && prevRouteProductIdRef.current !== currentId) {
      trackPixelPageView(resolvedTitle || document.title);
    }
    prevRouteProductIdRef.current = currentId;
  }, [selectedProduct, lang, products, reviews, settings]);

  return (
    <div className="min-h-screen bg-[#f8f9fb] text-[#1e293b] flex flex-col font-sans selection:bg-[#c5a869] selection:text-black">
      {/* Toast notifications */}
      {toast && (
        <div
          dir="rtl"
          role="alert"
          aria-live="assertive"
          className={`fixed bottom-6 right-6 z-[120] max-w-sm rounded-2xl border p-4 shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-300 ${
            toast.type === 'success'
              ? 'bg-emerald-50 border-emerald-400 text-emerald-950'
              : toast.type === 'error'
              ? 'bg-rose-50 border-rose-400 text-rose-950'
              : 'bg-white border-[#c5a869]/50 text-gray-900'
          }`}
        >
          {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />}
          {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />}
          {toast.type === 'info' && <Info className="w-5 h-5 text-[#b8860b] flex-shrink-0" />}
          <p className="text-xs font-extrabold leading-snug">{toast.message}</p>
        </div>
      )}

      {/* Global Header */}
      <Header />

      {/* Main Body */}
      <main className="flex-1 pb-16 lg:pb-0">
        {selectedProduct ? (
          <Suspense fallback={<ProductDetailSkeleton />}>
            <ProductDetailPage
              product={selectedProduct}
              onBack={() => {
                setActiveProductId(null);
              }}
            />
          </Suspense>
        ) : (
          <>
            <HeroSection />
            <TrustGuarantees />
            <CategoriesSection />
            <HowToOrderSection />
            <ProductGrid />
            <Suspense fallback={<div className="min-h-[320px] bg-[#f8f9fb]" aria-hidden="true" />}>
              <ProductVideoSection />
              <WhyChooseUs />
              <CustomerReviews />
            </Suspense>
          </>
        )}
      </main>

      {/* Global Footer */}
      <Footer />

      {/* Lazy-Loaded Modals & Overlays (loaded only when triggered) */}
      <Suspense fallback={null}>
        {checkoutProduct && <CodCheckoutModal />}
        {isCartOpen && <CartDrawer />}
        {isTrackingOpen && <OrderTrackingModal />}
        {isAdminOpen && <AdminDashboard />}
        {activePolicyModal && <PoliciesModal />}
        {hasConfirmOrderHash && <CustomerOrderActionModal />}
        {(hasWarrantyHash || isWarrantyCheckOpen) && <WarrantyVerificationModal />}
      </Suspense>

      {/* ================= STICKY MOBILE BOTTOM NAV ================= */}
      {!selectedProduct && (
        <nav
          aria-label={isFr ? 'Navigation rapide mobile' : 'شريط التنقل السريع للهاتف'}
          className="lg:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-gray-200/90 py-1.5 px-3 z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.07)] flex items-center justify-around"
        >
          {/* Accueil / الرئيسية */}
          <button
            onClick={() => {
              setActiveProductId(null);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex flex-col items-center justify-center py-1 px-2 text-gray-700 hover:text-[#996515] active:scale-95 transition min-w-[54px]"
          >
            <Compass className="w-5 h-5 text-gray-700 mb-0.5" />
            <span className="text-[10px] font-bold">{isFr ? 'Accueil' : 'الرئيسية'}</span>
          </button>

          {/* Montres / المعروضات */}
          <button
            onClick={() => {
              setActiveProductId(null);
              const el = document.getElementById('products-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="flex flex-col items-center justify-center py-1 px-2 text-gray-700 hover:text-[#996515] active:scale-95 transition min-w-[54px]"
          >
            <Sparkles className="w-5 h-5 text-[#b8860b] mb-0.5" />
            <span className="text-[10px] font-bold">{isFr ? 'Montres' : 'الساعات'}</span>
          </button>

          {/* Vidéos / الفيديوهات */}
          <button
            onClick={() => {
              setActiveProductId(null);
              const el = document.getElementById('videos-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="flex flex-col items-center justify-center py-1 px-2 text-gray-700 hover:text-[#996515] active:scale-95 transition min-w-[54px]"
          >
            <span className="text-lg leading-none mb-0.5">🎥</span>
            <span className="text-[10px] font-bold">{isFr ? 'Vidéos' : 'فيديوهات'}</span>
          </button>

          {/* Panier / سلة المشتريات */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative flex flex-col items-center justify-center py-1 px-2 text-gray-700 hover:text-[#996515] active:scale-95 transition min-w-[54px]"
          >
            <div className="relative">
              <ShoppingBag className="w-5 h-5 text-[#b8860b] mb-0.5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-2 bg-[#c5a869] text-black text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-white shadow-xs">
                  {cartCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-bold">{isFr ? 'Panier' : 'السلة'}</span>
          </button>

          {/* WhatsApp */}
          <a
            href={buildWhatsAppUrl(
              settings?.whatsappNumber,
              isFr
                ? 'Bonjour, je souhaite obtenir des informations sur les montres et accessoires Noblewatch au Maroc.'
                : 'السلام عليكم، بغيت نستفسر على ساعات وإكسسوارات Noblewatch بالمغرب'
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center py-1 px-2 text-emerald-700 active:scale-95 transition min-w-[54px]"
          >
            <MessageCircle className="w-5 h-5 text-emerald-600 mb-0.5" />
            <span className="text-[10px] font-bold">WhatsApp</span>
          </a>
        </nav>
      )}
    </div>
  );
};

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <StoreProvider>
          <MainContent />
        </StoreProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
