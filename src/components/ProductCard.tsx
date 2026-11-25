import React, { useState } from 'react';
import { ShoppingBag, Eye, Star, Zap } from 'lucide-react';
import { Product } from '../types';
import { formatPrice, getProductColors, getOptimizedImageUrl } from '../utils/constants';
import { useStore } from '../context/StoreContext';
import { useLanguage } from '../context/LanguageContext';
import { translateColorName, translateProductSubtitle } from '../i18n/storefront';

interface ProductCardProps {
  product: Product;
  priority?: boolean;
}

const preloadedImages = new Set<string>();
const prefetchProductDetail = (fullImgUrl?: string) => {
  import('./ProductDetailPage').catch(() => {});
  if (fullImgUrl && !preloadedImages.has(fullImgUrl)) {
    preloadedImages.add(fullImgUrl);
    const img = new Image();
    img.decoding = 'async';
    img.src = fullImgUrl;
  }
};

export const ProductCard: React.FC<ProductCardProps> = React.memo(({ product, priority = false }) => {
  const { setActiveProductId, setCheckoutProduct, addToCart, reviewsStatsByProduct } = useStore();
  const { lang, isFr } = useLanguage();
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const reviewStats = reviewsStatsByProduct[product.id];
  const displayReviewCount = reviewStats ? reviewStats.count : Number(product.reviewCount || 0);
  const displayRating = reviewStats ? reviewStats.avgRating : Number(product.rating || 5);

  const productColors = getProductColors(product);
  const activeColor = productColors[selectedColorIndex] || productColors[0];
  const fullDisplayImage =
    (activeColor && typeof activeColor.imageIndex === 'number' && product.images?.[activeColor.imageIndex]) ||
    product.images?.[0] ||
    '/assets/luxury_watch_hero.jpg';
  const displayImage = getOptimizedImageUrl(fullDisplayImage, 480);

  const handleQuickOrder = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCheckoutProduct({
      product,
      color: activeColor ? activeColor.name : productColors[0]?.name || 'أسود ملكي',
      quantity: 1,
    });
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product, 1, activeColor ? activeColor.name : productColors[0]?.name);
  };

  return (
    <div
      onClick={() => setActiveProductId(product.id)}
      onMouseEnter={() => {
        setIsHovered(true);
        prefetchProductDetail(getOptimizedImageUrl(fullDisplayImage, 1000));
      }}
      onTouchStart={() => prefetchProductDetail(getOptimizedImageUrl(fullDisplayImage, 1000))}
      onMouseLeave={() => setIsHovered(false)}
      className="perf-card group relative rounded-2xl bg-white border border-gray-200/90 hover:border-[#c5a869] transition-all duration-300 shadow-sm hover:shadow-xl flex flex-col justify-between overflow-hidden cursor-pointer"
    >
      {/* Top Badges */}
      <div className="absolute top-2 right-2 left-2 sm:top-3 sm:right-3 sm:left-3 flex items-start justify-between gap-1 z-10 pointer-events-none">
        <div className="flex flex-col gap-1 items-start shrink-0">
          {product.discountPercent > 0 && (
            <span className="px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-rose-600 text-white text-[9px] sm:text-[11px] font-black shadow-sm sm:shadow-md tracking-wider tabular-nums">
              -{product.discountPercent}%
            </span>
          )}
          {product.isNew && (
            <span className="px-1.5 sm:px-2 py-0.5 rounded-full bg-[#c5a869] text-black text-[9px] sm:text-[10px] font-bold shadow-sm">
              {isFr ? 'Nouveau' : 'جديد'}
            </span>
          )}
        </div>

        {product.stock <= 8 && product.stock > 0 && (
          <span className="px-1.5 sm:px-2 py-0.5 rounded-full bg-amber-50/95 text-amber-800 border border-amber-300 text-[9px] sm:text-[10px] font-bold truncate max-w-[68%]">
            {isFr ? `Plus que ${product.stock}` : `باقي ${product.stock} حبات`}
          </span>
        )}
      </div>

      {/* Product Image Section */}
      <div className="relative w-full aspect-square bg-[#f8f9fa] overflow-hidden flex items-center justify-center p-2 sm:p-4">
        <img
          src={displayImage}
          alt={product.name}
          onError={(e) => {
            const el = e.currentTarget as HTMLImageElement;
            if (!el.dataset.fallback && fullDisplayImage && el.src !== fullDisplayImage) {
              el.dataset.fallback = '1';
              el.src = fullDisplayImage;
            } else {
              el.src = '/assets/luxury_watch_hero.jpg';
            }
          }}
          className={`w-full h-full object-cover rounded-xl transition-transform duration-500 ${
            isHovered ? 'scale-105' : 'scale-100'
          }`}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          decoding="async"
        />

        {/* Hover Quick Actions Overlay */}
        <div
          className={`hidden sm:flex absolute inset-0 bg-black/20 items-center justify-center gap-3 transition-opacity duration-200 ${
            isHovered ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setActiveProductId(product.id);
            }}
            className="p-3 rounded-full bg-white text-gray-900 shadow-xl hover:scale-110 transition-transform"
            title={
              isFr
                ? 'Voir les détails'
                : product.category?.includes('accessories')
                ? 'معاينة تفاصيل المنتج'
                : 'معاينة تفاصيل الساعة'
            }
          >
            <Eye className="w-5 h-5 text-gray-800" />
          </button>
        </div>
      </div>

      {/* Product Content Details */}
      <div
        className={`p-2.5 sm:p-5 flex-1 flex flex-col justify-between space-y-2 sm:space-y-3 ${
          isFr ? 'text-left' : 'text-right'
        }`}
      >
        {/* Rating and SKU */}
        <div className="flex items-center justify-between text-[11px] sm:text-xs text-gray-500">
          <div className="flex items-center gap-1 text-amber-500">
            <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-amber-400 text-amber-400" />
            <span className="font-bold text-gray-800">{displayRating}</span>
            <span className="text-gray-400 text-[10px] sm:text-xs">({displayReviewCount})</span>
          </div>
          <span className="hidden sm:inline font-mono text-[11px] text-gray-400">{product.sku}</span>
        </div>

        {/* Product Name */}
        <div>
          <h3 className="text-xs sm:text-base font-bold text-gray-900 group-hover:text-[#996515] transition-colors line-clamp-2 leading-tight sm:leading-snug">
            {product.name}
          </h3>
          {product.subtitle && (
            <p className="hidden sm:block text-xs text-gray-500 mt-1 line-clamp-1">
              {translateProductSubtitle(product.subtitle, lang)}
            </p>
          )}
        </div>

        {/* Color Swatches */}
        {productColors && productColors.length > 1 && (
          <div className="flex items-center gap-1.5 pt-0.5" onClick={(e) => e.stopPropagation()}>
            <span className="text-[10px] sm:text-[11px] text-gray-500">
              {isFr ? 'Couleur :' : 'اللون:'}
            </span>
            <div className="flex items-center gap-1">
              {productColors.map((color, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedColorIndex(idx)}
                  className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border transition-all ${
                    selectedColorIndex === idx
                      ? 'scale-125 border-[#c5a869] ring-2 ring-[#c5a869]/40'
                      : 'border-gray-300 hover:scale-110'
                  }`}
                  style={{ backgroundColor: color.code }}
                  title={translateColorName(color.name, lang)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Price & Free Delivery Tag */}
        <div className="pt-1.5 sm:pt-2 border-t border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
            <div className="flex items-baseline gap-1.5 sm:gap-2">
              <span className="text-sm sm:text-xl font-black text-gray-900">
                {formatPrice(product.price, lang)}
              </span>
              {product.originalPrice > product.price && (
                <span className="text-[10px] sm:text-xs text-gray-400 line-through">
                  {formatPrice(product.originalPrice, lang)}
                </span>
              )}
            </div>

            <span className="inline-block text-[9px] sm:text-[10px] text-emerald-800 font-bold bg-emerald-50 border border-emerald-200 px-1.5 sm:px-2 py-0.5 rounded-full w-fit">
              {isFr ? 'Livraison gratuite 🇲🇦' : 'توصيل مجاني 🇲🇦'}
            </span>
          </div>

          {/* Tier discount teaser */}
          <div className="flex items-center gap-1 mt-1 text-[9px] sm:text-[10px] font-bold text-[#996515]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#c5a869] flex-shrink-0" />
            <span className="sm:hidden truncate">
              {isFr ? 'Remises 2 ou 3 pièces 🎁' : 'عروض توفير 2 و3 قطع 🎁'}
            </span>
            <span className="hidden sm:inline">
              {isFr
                ? 'Remises pour 2 ou 3 pièces commandées 🎁'
                : 'عروض توفير عند طلب قطعتين أو 3 قطع 🎁'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div
          className="flex flex-col sm:grid sm:grid-cols-2 gap-1.5 sm:gap-2 pt-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={handleQuickOrder}
            className="w-full min-h-[36px] sm:min-h-[38px] flex items-center justify-center gap-1 py-2 sm:py-2.5 px-2 rounded-xl gold-gradient-bg text-black font-extrabold text-[11px] sm:text-xs shadow hover:brightness-105 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
            title={isFr ? 'Commande rapide avec paiement à la livraison' : 'طلب سريع مع الدفع عند الاستلام'}
          >
            <Zap className="w-3 h-3 fill-black flex-shrink-0" />
            <span>{isFr ? 'Commander' : 'اطلب الآن'}</span>
          </button>

          <button
            onClick={handleAddToCart}
            className="w-full min-h-[34px] sm:min-h-[38px] flex items-center justify-center gap-1 py-1.5 sm:py-2.5 px-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-200 text-[10px] sm:text-xs font-bold active:scale-95 transition-all cursor-pointer whitespace-nowrap"
          >
            <ShoppingBag className="w-3 h-3 text-[#b8860b] flex-shrink-0" />
            <span>{isFr ? 'Panier' : 'السلة'}</span>
          </button>
        </div>
      </div>
    </div>
  );
});
