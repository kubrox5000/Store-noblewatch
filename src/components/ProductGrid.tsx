import React, { useMemo, useDeferredValue, useTransition, useState, useEffect, useRef } from 'react';
import { Sparkles, Filter, ChevronDown } from 'lucide-react';
import { ProductCard } from './ProductCard';
import { useStore } from '../context/StoreContext';
import { useLanguage } from '../context/LanguageContext';
import { translateProductDescription, translateProductSubtitle } from '../i18n/storefront';

const INITIAL_GRID_COUNT = 16;
const GRID_STEP = 16;

export const ProductGrid: React.FC = () => {
  const { products, selectedCategory, setSelectedCategory, searchQuery, isLoading } = useStore();
  const { isFr } = useLanguage();
  const deferredSearch = useDeferredValue(searchQuery);
  const [, startTransition] = useTransition();
  const [visibleCount, setVisibleCount] = useState(INITIAL_GRID_COUNT);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setVisibleCount(INITIAL_GRID_COUNT);
  }, [selectedCategory, deferredSearch]);

  const filteredProducts = useMemo(() => {
    const q = deferredSearch.toLowerCase().trim();
    return products.filter((product) => {
      if (!product.isPublished) return false;

      if (selectedCategory && selectedCategory !== 'all') {
        const inPrimary = product.category === selectedCategory;
        const inArray = product.categories && product.categories.includes(selectedCategory);
        if (!inPrimary && !inArray) return false;
      }

      if (q) {
        if (product.name.toLowerCase().includes(q)) return true;
        if (product.sku.toLowerCase().includes(q)) return true;
        if (product.specs?.model?.toLowerCase().includes(q)) return true;
        if (product.description.toLowerCase().includes(q)) return true;
        if ((product.subtitle || '').toLowerCase().includes(q)) return true;
        if (translateProductDescription(product.description, 'ar').toLowerCase().includes(q)) return true;
        if (translateProductDescription(product.description, 'fr').toLowerCase().includes(q)) return true;
        if (translateProductSubtitle(product.subtitle || '', 'ar').toLowerCase().includes(q)) return true;
        if (translateProductSubtitle(product.subtitle || '', 'fr').toLowerCase().includes(q)) return true;
        return false;
      }

      return true;
    });
  }, [products, selectedCategory, deferredSearch]);

  // Progressive reveal on scroll so initial DOM stays compact & fast
  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el || visibleCount >= filteredProducts.length) return;
    if (typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisibleCount((prev) => Math.min(filteredProducts.length, prev + GRID_STEP));
        }
      },
      { rootMargin: '300px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [visibleCount, filteredProducts.length]);

  const displayedProducts = useMemo(
    () => (deferredSearch.trim() ? filteredProducts : filteredProducts.slice(0, visibleCount)),
    [filteredProducts, visibleCount, deferredSearch]
  );

  return (
    <section id="products-section" className="py-12 bg-white border-b border-gray-200/80 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className={`mb-8 text-center ${isFr ? 'sm:text-left' : 'sm:text-right'}`}>
          <div className="inline-flex items-center gap-1.5 text-xs text-[#996515] font-bold mb-1">
            <Sparkles className="w-3.5 h-3.5 text-[#b8860b]" />
            <span>{isFr ? 'Collection Exclusive 2026' : 'تشكيلة حصرية 2026'}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            {searchQuery
              ? isFr
                ? `Résultats pour : "${searchQuery}"`
                : `نتائج البحث عن: "${searchQuery}"`
              : isFr
              ? 'Produits vedettes'
              : 'منتجات مميزة'}
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            {isFr
              ? 'Découvrez les modèles de montres de luxe les plus demandés au Maroc'
              : 'إكتشف أفضل موديلات الساعات الفاخرة الأكثر طلباً في المغرب'}
          </p>
        </div>

        {/* Quick Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 no-scrollbar">
          {[
            { id: 'all', label: isFr ? 'Tous les modèles' : 'جميع المعروضات' },
            { id: 'men', label: isFr ? '👔 Montres Homme' : '👔 ساعات رجالية' },
            { id: 'women', label: isFr ? '✨ Montres Femme' : '✨ ساعات نسائية' },
            { id: 'men-accessories', label: isFr ? '💼 Accessoires Homme' : '💼 إكسسوارات رجالية' },
            { id: 'women-accessories', label: isFr ? '💍 Accessoires Femme' : '💍 إكسسوارات نسائية' },
          ].map((cat) => {
            const active = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => startTransition(() => setSelectedCategory(cat.id))}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  active
                    ? 'gold-gradient-bg text-black shadow-md shadow-[#c5a869]/20 scale-105'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Product Cards Grid */}
        {isLoading && products.length === 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={idx}
                className="rounded-2xl bg-white border border-gray-200/80 overflow-hidden animate-pulse"
              >
                <div className="aspect-square bg-gray-200/80" />
                <div className="p-3 sm:p-5 space-y-3">
                  <div className="h-3 w-16 bg-gray-200 rounded" />
                  <div className="h-4 w-5/6 bg-gray-200 rounded" />
                  <div className="h-6 w-1/2 bg-amber-100 rounded" />
                  <div className="h-9 w-full bg-gray-200 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        ) : displayedProducts.length > 0 ? (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
              {displayedProducts.map((product, idx) => (
                <ProductCard key={product.id} product={product} priority={idx < 4} />
              ))}
            </div>
            {displayedProducts.length < filteredProducts.length && (
              <div ref={loadMoreRef} className="mt-8 flex justify-center">
                <button
                  type="button"
                  onClick={() => setVisibleCount(filteredProducts.length)}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gray-50 hover:bg-[#fefaf0] border border-gray-300 hover:border-[#c5a869] text-gray-800 font-bold text-xs shadow-xs transition cursor-pointer"
                >
                  <span>
                    {isFr
                      ? `Afficher tous les modèles (${filteredProducts.length - displayedProducts.length} restants)`
                      : `عرض جميع الموديلات (${filteredProducts.length - displayedProducts.length} منتج إضافي)`}
                  </span>
                  <ChevronDown className="w-4 h-4 text-[#996515]" />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16 px-4 rounded-2xl bg-gray-50 border border-gray-200">
            <div className="w-16 h-16 rounded-full bg-white mx-auto flex items-center justify-center text-gray-400 mb-4 shadow-sm">
              <Filter className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              {isFr ? 'Aucun produit ne correspond à votre sélection' : 'لا توجد منتجات مطابقة لخياراتك'}
            </h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto mb-6">
              {isFr
                ? 'Essayez de modifier votre recherche ou choisissez une autre catégorie.'
                : 'جرب تغيير كلمات البحث أو اختيار فئة أخرى من الساعات أو الإكسسوارات المعروضة.'}
            </p>
            <button
              onClick={() => {
                setSelectedCategory('all');
              }}
              className="px-6 py-2.5 rounded-xl gold-gradient-bg text-black font-extrabold text-xs shadow hover:brightness-105 cursor-pointer"
            >
              {isFr ? 'Afficher tous les produits' : 'عرض جميع المعروضات'}
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
