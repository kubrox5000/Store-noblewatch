import React, { useState, useEffect } from 'react';
import {
  Star,
  ShieldCheck,
  Truck,
  RotateCcw,
  Zap,
  ShoppingBag,
  Play,
  Maximize2,
  CheckCircle2,
  Clock,
  Sparkles,
  MessageCircle,
  Share2,
  ArrowRight,
  ArrowLeft,
  Check,
} from 'lucide-react';
import { Product } from '../types';
import {
  formatPrice,
  getProductColors,
  calculateTierOffers,
  getBundlePriceForQuantity,
} from '../utils/constants';
import { trackPixelViewContent } from '../utils/trackingPixels';
import { useStore } from '../context/StoreContext';
import { useLanguage } from '../context/LanguageContext';
import {
  translateColorName,
  localizeTierBadge,
  localizeProductFeature,
  translateProductSubtitle,
  translateProductDescription,
  translateReviewComment,
  translateCityName,
} from '../i18n/storefront';

interface ProductDetailPageProps {
  product: Product;
  onBack: () => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({ product, onBack }) => {
  const { setCheckoutProduct, addToCart, reviews, settings, showToast } = useStore();
  const { lang, isFr } = useLanguage();

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [multiColors, setMultiColors] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'desc' | 'care'>('desc');
  const [isZoomed, setIsZoomed] = useState(false);
  const [reviewsLimit, setReviewsLimit] = useState(6);

  const productColors = getProductColors(product);
  const activeColor = productColors[selectedColorIndex] || productColors[0];

  useEffect(() => {
    trackPixelViewContent(product);
  }, [product.id]);

  // Sync multiColors when quantity or color changes
  useEffect(() => {
    const defaultColor = activeColor?.name || productColors[0]?.name || 'أسود ملكي';
    setMultiColors((prev) => {
      const updated = [...prev];
      for (let i = updated.length; i < quantity; i++) {
        const nextColor = productColors[i % productColors.length]?.name || defaultColor;
        updated.push(nextColor);
      }
      return updated.slice(0, quantity);
    });
  }, [quantity, activeColor, productColors]);

  // When color changes, if it maps to an image index, change the active image
  const handleColorChange = (index: number) => {
    setSelectedColorIndex(index);
    const color = productColors[index];
    if (color && typeof color.imageIndex === 'number' && product.images[color.imageIndex]) {
      setActiveImageIndex(color.imageIndex);
    }
    if (color) {
      setMultiColors((prev) => {
        const updated = [...prev];
        if (updated.length > 0) updated[0] = color.name;
        return updated;
      });
    }
  };

  const handleInstantBuy = () => {
    const defaultColor = activeColor ? activeColor.name : productColors[0]?.name || 'أسود ملكي';
    const finalColors = quantity > 1
      ? Array.from({ length: quantity }, (_, i) => multiColors[i] || productColors[i % productColors.length]?.name || defaultColor)
      : [defaultColor];

    const allSame = finalColors.length > 1 && finalColors.every((c) => c === finalColors[0]);

    const formattedColor = quantity > 1
      ? (allSame
          ? `${translateColorName(finalColors[0], lang)} (${quantity} ${isFr ? 'pièces' : 'قطع'})`
          : finalColors.map((c, i) => `${isFr ? 'Montre' : 'ساعة'} ${i + 1}: ${translateColorName(c, lang)}`).join(' + '))
      : translateColorName(defaultColor, lang);

    setCheckoutProduct({
      product,
      color: formattedColor,
      quantity,
      selectedColors: finalColors,
    });
  };

  const handleAddToCart = () => {
    const defaultColor = activeColor ? activeColor.name : productColors[0]?.name || 'أسود ملكي';
    const finalColors = quantity > 1
      ? Array.from({ length: quantity }, (_, i) => multiColors[i] || productColors[i % productColors.length]?.name || defaultColor)
      : [defaultColor];

    const allSame = finalColors.length > 1 && finalColors.every((c) => c === finalColors[0]);

    const formattedColor = quantity > 1
      ? (allSame
          ? `${translateColorName(finalColors[0], lang)} (${quantity} ${isFr ? 'pièces' : 'قطع'})`
          : finalColors.map((c, i) => `${isFr ? 'Montre' : 'ساعة'} ${i + 1}: ${translateColorName(c, lang)}`).join(' + '))
      : defaultColor;

    const currentBundle = getBundlePriceForQuantity(product, quantity, lang);

    addToCart(product, quantity, formattedColor, finalColors, currentBundle.bundleLabel);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: isFr
          ? `${product.name} - Boutique Noblewatch Maroc`
          : `${product.name} - متجر Noblewatch المغربي`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast(
        isFr ? 'Lien du produit copié pour le partage' : 'تم نسخ رابط الساعة لمشاركته',
        'info'
      );
    }
  };

  // Product reviews
  const productReviews = reviews.filter((r) => r.productId === product.id && r.isApproved);

  return (
    <div className="min-h-screen bg-[#f8f9fb] text-gray-900 pb-24">
      {/* Breadcrumbs Navigation */}
      <div className="bg-white border-b border-gray-200 py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap">
            <button
              onClick={onBack}
              className="hover:text-black flex items-center gap-1 text-[#996515] font-bold"
            >
              {isFr ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
              <span>{isFr ? 'Accueil' : 'الرئيسية'}</span>
            </button>
            <span>/</span>
            <span>
              {product.category?.includes('accessories') ||
              (product.categories && product.categories.includes('accessories'))
                ? isFr
                  ? 'Accessoires de luxe'
                  : 'الإكسسوارات الفاخرة'
                : isFr
                ? 'Montres de luxe'
                : 'ساعات اليد الفاخرة'}
            </span>
            <span>/</span>
            <span className="text-gray-900 font-bold truncate max-w-xs">{product.name}</span>
          </div>

          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs transition"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isFr ? 'Partager' : 'مشاركة'}</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-16">
        {/* ================= SECTION 1 & 2: PRIMARY INFO & PHOTO GALLERY ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Gallery Column */}
          <div className="lg:col-span-7 space-y-4">
            {/* Main Stage Image with Zoom */}
            <div
              className="relative w-full aspect-square sm:aspect-[4/3] lg:aspect-square rounded-2xl bg-white border border-gray-200 overflow-hidden group shadow-md flex items-center justify-center p-4 cursor-zoom-in"
              onClick={() => setIsZoomed(!isZoomed)}
            >
              <img
                src={product.images[activeImageIndex] || product.images[0]}
                alt={product.name}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/assets/watches_and_accessories_hero.jpg';
                }}
                className={`w-full h-full object-contain rounded-xl transition-all duration-300 ${
                  isZoomed ? 'scale-150' : 'group-hover:scale-105'
                }`}
              />

              {/* Floating badges */}
              <div className={`absolute top-4 flex flex-col gap-2 ${isFr ? 'left-4' : 'right-4'}`}>
                {product.discountPercent > 0 && (
                  <span className="px-3 py-1 rounded-full bg-rose-600 text-white font-black text-xs shadow-md">
                    {isFr ? `-${product.discountPercent}%` : `خصم ${product.discountPercent}%`}
                  </span>
                )}
                {product.isNew && (
                  <span className="px-2.5 py-0.5 rounded-full bg-[#c5a869] text-black font-extrabold text-[11px] shadow">
                    {isFr ? 'Nouveau modèle' : 'موديل حديث'}
                  </span>
                )}
              </div>

              <div
                className={`absolute bottom-4 p-2 rounded-xl bg-white/90 backdrop-blur-md text-gray-800 text-xs border border-gray-200 flex items-center gap-1.5 shadow-sm ${
                  isFr ? 'right-4' : 'left-4'
                }`}
              >
                <Maximize2 className="w-3.5 h-3.5 text-[#b8860b]" />
                <span>{isFr ? 'Cliquez pour zoomer' : 'اضغط للتكبير والتفاصيل'}</span>
              </div>
            </div>

            {/* Thumbnails Row */}
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setActiveImageIndex(idx);
                    setIsZoomed(false);
                  }}
                  className={`relative aspect-square rounded-xl bg-white overflow-hidden border-2 transition-all p-1 ${
                    activeImageIndex === idx
                      ? 'border-[#c5a869] ring-2 ring-[#c5a869]/30 scale-105 shadow-sm'
                      : 'border-gray-200 hover:border-gray-300 opacity-80 hover:opacity-100'
                  }`}
                >
                  <img
                    src={img}
                    alt={`زاوية ${idx + 1}`}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/assets/watches_and_accessories_hero.jpg';
                    }}
                    className="w-full h-full object-cover rounded-lg"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Product Primary Details Column */}
          <div className={`lg:col-span-5 space-y-6 ${isFr ? 'text-left' : 'text-right'}`}>
            {/* Title & SKU */}
            <div>
              <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                <span className="text-[#996515] font-mono font-bold tracking-wider">
                  {isFr ? `Réf. modèle : ${product.sku}` : `رمز الموديل: ${product.sku}`}
                </span>
                <span className="text-emerald-800 bg-emerald-50 border border-emerald-300 px-2.5 py-0.5 rounded-full font-bold">
                  {product.stock > 0
                    ? isFr
                      ? 'En stock au Maroc'
                      : 'متوفر بالمخزون المغربي'
                    : isFr
                    ? 'Rupture temporaire'
                    : 'نفد المخزون مؤقتاً'}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 leading-tight">
                {product.name}
              </h1>

              {product.subtitle && (
                <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                  {translateProductSubtitle(product.subtitle, lang)}
                </p>
              )}
            </div>

            {/* Ratings Bar */}
            <div className="flex items-center gap-3 py-2 border-y border-gray-200">
              <div className="flex items-center gap-1 text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.floor(product.rating)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm font-bold text-gray-900">{product.rating}</span>
              <span className="text-xs text-gray-500">
                {isFr
                  ? `(${product.reviewCount} avis clients vérifiés au Maroc)`
                  : `(${product.reviewCount} تقييم حقيقي من زبناء المغرب)`}
              </span>
            </div>

            {/* Moroccan Price Display */}
            <div className="p-4 rounded-2xl bg-[#fefaf0] border border-[#c5a869]/40 shadow-sm">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-xs text-gray-600 block mb-1">
                    {isFr
                      ? 'Prix spécial Paiement à la livraison :'
                      : 'السعر الخاص بالدفع عند الاستلام:'}
                  </span>
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl sm:text-4xl font-black text-gray-900">
                      {formatPrice(product.price, lang)}
                    </span>
                    {product.originalPrice > product.price && (
                      <span className="text-base text-gray-400 line-through">
                        {formatPrice(product.originalPrice, lang)}
                      </span>
                    )}
                  </div>
                </div>

                <div className={isFr ? 'text-right' : 'text-left'}>
                  <span className="inline-block px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold">
                    {isFr ? 'Livraison gratuite 0 DH' : 'توصيل مجاني 0 درهم'}
                  </span>
                </div>
              </div>

              {/* Fast Reassurance */}
              <div className="mt-3 pt-3 border-t border-[#c5a869]/20 flex items-center justify-between text-xs text-gray-700 font-semibold gap-2 flex-wrap">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{isFr ? 'Vérifiez votre montre avant de payer' : 'افحص ساعتك قبل أن تدفع'}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#996515]" />
                  <span>{isFr ? 'Garantie officielle 1 an' : 'ضمان رسمي لمدة سنة'}</span>
                </span>
              </div>
            </div>

            {/* Colors Selector - Only displayed when 1 piece is selected */}
            {quantity === 1 && (
              <div className="space-y-2 animate-in fade-in duration-200">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-800 font-bold">
                    {isFr ? 'Couleur sélectionnée :' : 'اللون المختار:'}{' '}
                    <span className="text-[#996515] font-black">
                      {translateColorName(activeColor?.name || '', lang)}
                    </span>
                  </span>
                  <span className="text-gray-500 text-[11px]">
                    {isFr
                      ? `(${productColors.length} couleurs disponibles)`
                      : `(${productColors.length} ألوان متوفرة)`}
                  </span>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  {productColors.map((color, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleColorChange(idx)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                        selectedColorIndex === idx
                          ? 'bg-[#fefaf0] border-[#c5a869] text-gray-900 shadow-sm ring-1 ring-[#c5a869] font-black scale-105'
                          : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <span
                        className="w-4 h-4 rounded-full border border-gray-300 flex-shrink-0"
                        style={{ backgroundColor: color.code }}
                      />
                      <span>{translateColorName(color.name, lang)}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ================= TIERED BUNDLE PRICING (Buy 1, 2, 3) ================= */}
            {(() => {
              const tierOffers = calculateTierOffers(product, lang);
              const currentBundle = getBundlePriceForQuantity(product, quantity, lang);

              return (
                <div className="space-y-3 p-4 rounded-2xl bg-gradient-to-b from-[#fbf8ef] to-white border-2 border-[#c5a869]/40 shadow-xs">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs font-black text-gray-900 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-[#c5a869]" />
                      <span>
                        {isFr
                          ? 'Offres packs économies (Achetez plus, économisez plus) :'
                          : 'عروض باقات التوفير (اشتري أكثر ووفر أكثر):'}
                      </span>
                    </span>
                    {currentBundle.savingsMAD > 0 && (
                      <span className="text-[11px] font-black text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <span>
                          {isFr ? 'Économisez' : 'وفرت'} {formatPrice(currentBundle.savingsMAD, lang)}
                        </span>
                        <span>🎉</span>
                      </span>
                    )}
                  </div>

                  {/* 3 Tier Offer Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {tierOffers.map((tier) => {
                      const isSelected = quantity === tier.quantity;
                      return (
                        <button
                          key={tier.quantity}
                          type="button"
                          onClick={() => setQuantity(tier.quantity)}
                          className={`relative p-3 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                            isFr ? 'text-left' : 'text-right'
                          } ${
                            isSelected
                              ? 'bg-white border-[#c5a869] shadow-md ring-2 ring-[#c5a869]/30 scale-[1.02]'
                              : 'bg-white/80 border-gray-200 hover:border-gray-300 hover:bg-white'
                          }`}
                        >
                          {tier.badge && (
                            <div className={`absolute -top-2 ${isFr ? 'right-2' : 'left-2'}`}>
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-black shadow-xs bg-[#c5a869] text-black">
                                {localizeTierBadge(tier.badge, lang)}
                              </span>
                            </div>
                          )}

                          <div>
                            <div className="flex items-center justify-between">
                              <span
                                className={`text-xs font-black ${
                                  isSelected ? 'text-[#996515]' : 'text-gray-900'
                                }`}
                              >
                                {tier.label}
                              </span>
                              <span
                                className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                                  isSelected
                                    ? 'border-[#c5a869] bg-[#c5a869] text-white'
                                    : 'border-gray-300'
                                }`}
                              >
                                {isSelected && <Check className="w-2 h-2 stroke-[3]" />}
                              </span>
                            </div>
                            <p className="text-[10px] text-gray-500 line-clamp-1 mt-0.5">
                              {tier.subLabel}
                            </p>
                          </div>

                          <div className="mt-2 pt-1.5 border-t border-gray-100">
                            <div className="flex items-baseline justify-between">
                              <span className="text-sm font-black text-gray-900">
                                {formatPrice(tier.totalPrice, lang)}
                              </span>
                              {tier.quantity > 1 && (
                                <span className="text-[10px] text-gray-400 line-through">
                                  {formatPrice(tierOffers[0].totalPrice * tier.quantity, lang)}
                                </span>
                              )}
                            </div>
                            {tier.quantity > 1 && (
                              <span className="block text-[10px] text-emerald-800 font-bold mt-0.5">
                                {isFr
                                  ? `(${formatPrice(tier.unitPrice, lang)} / pièce)`
                                  : `(${formatPrice(tier.unitPrice, lang)} للقطعة)`}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* When quantity > 1, show dedicated watch color selector */}
                  {quantity > 1 && (
                    <div className="pt-3 border-t border-[#c5a869]/20 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-gray-900 flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#c5a869]" />
                          <span>
                            {isFr
                              ? `Couleurs du pack (${quantity} pièces) :`
                              : `تحديد ألوان الساعات في الباقة (${quantity} قطع):`}
                          </span>
                        </span>
                        <span className="text-[11px] text-gray-500 font-semibold">
                          {isFr ? 'Choisissez la couleur de chaque montre' : 'اختر لون كل ساعة على حدة'}
                        </span>
                      </div>

                      <div className="space-y-2.5">
                        {Array.from({ length: quantity }).map((_, itemIdx) => {
                          const currentPieceColor =
                            multiColors[itemIdx] ||
                            productColors[itemIdx % productColors.length]?.name ||
                            productColors[0]?.name;
                          return (
                            <div
                              key={itemIdx}
                              className="p-3 rounded-xl bg-white border border-gray-200/90 shadow-2xs space-y-2"
                            >
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-gray-800 flex items-center gap-1.5">
                                  <span className="w-4 h-4 rounded-full gold-gradient-bg text-black font-black text-[10px] flex items-center justify-center">
                                    {itemIdx + 1}
                                  </span>
                                  <span>
                                    {isFr ? `Montre N° ${itemIdx + 1} :` : `لون الساعة رقم (${itemIdx + 1}):`}
                                  </span>
                                </span>
                                <span className="text-[11px] font-black text-[#996515] bg-[#c5a869]/15 border border-[#c5a869]/30 px-2.5 py-0.5 rounded-full">
                                  {translateColorName(currentPieceColor || '', lang)}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 flex-wrap">
                                {productColors.map((color, cIdx) => {
                                  const isChosen = currentPieceColor === color.name;
                                  return (
                                    <button
                                      key={cIdx}
                                      type="button"
                                      onClick={() => {
                                        const next = [...multiColors];
                                        next[itemIdx] = color.name;
                                        setMultiColors(next);
                                      }}
                                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition cursor-pointer select-none ${
                                        isChosen
                                          ? 'bg-[#fefaf0] border-[#c5a869] text-gray-900 font-black shadow-xs ring-1 ring-[#c5a869]'
                                          : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                                      }`}
                                    >
                                      <span
                                        className="w-3.5 h-3.5 rounded-full border border-gray-300 flex-shrink-0"
                                        style={{ backgroundColor: color.code }}
                                      />
                                      <span>{translateColorName(color.name, lang)}</span>
                                      {isChosen && <Check className="w-3 h-3 text-[#c5a869] stroke-[3]" />}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-200 text-[11px] font-bold text-gray-700 flex items-center justify-between flex-wrap gap-2">
                        <span>{isFr ? 'Votre sélection :' : 'تشكيلة باقتك:'}</span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {multiColors.slice(0, quantity).map((cName, idx) => (
                            <span key={idx} className="bg-white px-2 py-0.5 rounded border border-gray-200 text-[#996515]">
                              {isFr ? `Montre ${idx + 1}:` : `ساعة ${idx + 1}:`}{' '}
                              <strong className="text-gray-900">{translateColorName(cName, lang)}</strong>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Stock Urgency */}
            {product.stock <= 8 && product.stock > 0 && (
              <div className="text-xs text-amber-700 font-bold animate-pulse flex items-center gap-1.5 pt-1">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                <span>
                  {isFr
                    ? `Dépêchez-vous ! Plus que ${product.stock} pièces en stock`
                    : `سارع بالطلب! باقي ${product.stock} قطع فقط متوفرة في المخزن`}
                </span>
              </div>
            )}

            {/* Action Buttons: COD primary + Add to Cart */}
            <div className="space-y-3 pt-2">
              <button
                onClick={handleInstantBuy}
                className="w-full flex items-center justify-center gap-2.5 py-4 rounded-xl gold-gradient-bg text-black font-black text-base shadow-lg shadow-[#c5a869]/25 hover:brightness-105 active:scale-[0.98] transition cursor-pointer"
              >
                <Zap className="w-5 h-5 fill-black" />
                <span>
                  {isFr
                    ? 'Commander maintenant - Paiement à la livraison'
                    : 'اطلب الآن - الدفع عند الاستلام (خلص ملي توصلك)'}
                </span>
              </button>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleAddToCart}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-800 font-bold text-xs transition cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4 text-[#996515]" />
                  <span>{isFr ? 'Ajouter au panier' : 'أضف إلى السلة'}</span>
                </button>

                <a
                  href={`https://wa.me/${(settings?.whatsappNumber || '+212612345678').replace(/\+/g, '')}?text=${encodeURIComponent(
                    isFr
                      ? `Bonjour, je souhaite commander la montre ${product.name} (Réf : ${product.sku}) couleur : ${translateColorName(activeColor?.name || '', lang)}`
                      : `السلام عليكم، بغيت نطلب ساعة ${product.name} (رمز: ${product.sku}) بلون: ${activeColor?.name || 'الافتراضي'}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold text-xs transition"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  <span>{isFr ? 'Commander via WhatsApp' : 'طلب مباشر عبر واتساب'}</span>
                </a>
              </div>
            </div>

            {/* 3 Pillars Summary Box */}
            <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-sm space-y-2 text-xs text-gray-700">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#b8860b] flex-shrink-0" />
                <span>
                  {isFr ? (
                    <>
                      <strong className="text-gray-900">Livraison gratuite & rapide :</strong> réception sous
                      24 à 48h partout au Maroc.
                    </>
                  ) : (
                    <>
                      <strong className="text-gray-900">توصيل مجاني وسريع:</strong> يصلك خلال 24 إلى 48 ساعة
                      لجميع مدن المغرب.
                    </>
                  )}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>
                  {isFr ? (
                    <>
                      <strong className="text-gray-900">Vérification avant paiement :</strong> ouvrez le colis
                      et inspectez la montre devant le livreur.
                    </>
                  ) : (
                    <>
                      <strong className="text-gray-900">معاينة قبل الدفع:</strong> تفتح الطرد وتفحص الساعة
                      قبل تسليم المبلغ للموزع.
                    </>
                  )}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <span>
                  {isFr ? (
                    <>
                      <strong className="text-gray-900">Échange & Garantie :</strong> échange sous 7 jours et
                      garantie officielle 1 an.
                    </>
                  ) : (
                    <>
                      <strong className="text-gray-900">استبدال وضمان:</strong> إمكانية الاستبدال خلال 7
                      أيام وضمان رسمي لمدة سنة.
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ================= SECTION 3: VIDEO SHOWCASE ================= */}
        {product.videos && product.videos.length > 0 && (
          <div
            id="video-section"
            className={`rounded-3xl bg-white border border-gray-200 p-6 sm:p-10 space-y-6 shadow-sm ${
              isFr ? 'text-left' : 'text-right'
            }`}
          >
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#fefaf0] text-xs font-bold text-[#996515] border border-[#c5a869]/30 mb-2">
                <Play className="w-3.5 h-3.5 fill-[#b8860b] text-[#b8860b]" />
                <span>{isFr ? 'Aperçu vidéo en direct' : 'معاينة حية ومباشرة'}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900">
                {isFr ? 'Découvrez la montre de près 🎬' : 'اكتشف الساعة عن قرب 🎬'}
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                {isFr
                  ? 'Admirez le mouvement des aiguilles, les reflets du cadran et la finition du bracelet avant d’acheter'
                  : 'شاهد حركة العقارب، وانعكاس الضوء على المينا الكريستالية، ودقة تفاصيل السوار قبل الشراء'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {product.videos.map((vid, idx) => (
                <div
                  key={idx}
                  className="relative rounded-2xl bg-white border border-gray-200 overflow-hidden shadow-md flex flex-col justify-between"
                >
                  <div className="relative aspect-video w-full bg-black flex items-center justify-center">
                    <video
                      src={vid.url}
                      poster={vid.poster}
                      controls
                      playsInline
                      preload="metadata"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="p-4 bg-gray-50 flex items-center justify-between border-t border-gray-200">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">{vid.title}</h4>
                      <span className="text-[11px] text-gray-500">
                        {isFr ? 'Vidéo démonstrative HD' : 'فيديو توضيحي بدقة عالية'}
                      </span>
                    </div>
                    {vid.duration && (
                      <span className="text-xs font-mono font-bold text-[#996515] bg-[#fefaf0] px-2.5 py-1 rounded-full border border-[#c5a869]/30">
                        {vid.duration}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= SECTION 4 & 5: SPECS & RICH DESCRIPTION TABS ================= */}
        <div className="rounded-3xl bg-white border border-gray-200 overflow-hidden shadow-sm">
          {/* Tabs Navigation */}
          <div className="flex items-center overflow-x-auto border-b border-gray-200 bg-gray-50/80 px-4">
            <button
              onClick={() => setActiveTab('desc')}
              className={`py-4 px-5 text-sm font-bold transition-all border-b-2 whitespace-nowrap cursor-pointer ${
                activeTab === 'desc'
                  ? 'border-[#c5a869] text-[#996515]'
                  : 'border-transparent text-gray-600 hover:text-black'
              }`}
            >
              {isFr ? 'Description & Caractéristiques' : 'وصف الساعة ومميزاتها'}
            </button>
            <button
              onClick={() => setActiveTab('care')}
              className={`py-4 px-5 text-sm font-bold transition-all border-b-2 whitespace-nowrap cursor-pointer ${
                activeTab === 'care'
                  ? 'border-[#c5a869] text-[#996515]'
                  : 'border-transparent text-gray-600 hover:text-black'
              }`}
            >
              {isFr ? 'Utilisation & Garantie 🛡️' : 'إرشادات الاستخدام والضمان 🛡️'}
            </button>
          </div>

          {/* Tab Content */}
          <div className={`p-6 sm:p-10 ${isFr ? 'text-left' : 'text-right'}`}>
            {/* 1. Description & Features */}
            {activeTab === 'desc' && (
              <div className="space-y-6 max-w-4xl">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {isFr ? 'À propos de ce modèle' : 'عن هذا الموديل'}
                  </h3>
                  <p className="text-sm sm:text-base text-gray-700 leading-relaxed whitespace-pre-line">
                    {translateProductDescription(product.description, lang)}
                  </p>
                </div>

                {(() => {
                  const rawFeatures = product.features && product.features.length > 0 ? product.features : [];
                  const hasWarranty = rawFeatures.some(
                    (f) => f.includes('ضمان') || f.toLowerCase().includes('garantie')
                  );
                  const allFeatures = hasWarranty
                    ? rawFeatures
                    : ['ضمان معتمد لمدة سنة كاملة ضد أي عيوب مصنعية', ...rawFeatures];

                  return (
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-[#b8860b]" />
                        <span>{isFr ? 'Points forts exclusifs :' : 'أهم المميزات الحصرية:'}</span>
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {allFeatures.map((feat, idx) => {
                          const isWarranty =
                            feat.includes('ضمان') || feat.toLowerCase().includes('garantie');
                          return (
                            <div
                              key={idx}
                              className={`flex items-start gap-3 p-3.5 rounded-xl border text-xs sm:text-sm transition ${
                                isWarranty
                                  ? 'bg-[#fefaf0] border-[#c5a869]/50 text-gray-900 ring-1 ring-[#c5a869]/25 shadow-xs'
                                  : 'bg-gray-50 border-gray-200 text-gray-800'
                              }`}
                            >
                              {isWarranty ? (
                                <ShieldCheck className="w-5 h-5 text-[#996515] flex-shrink-0 mt-0.5" />
                              ) : (
                                <CheckCircle2 className="w-5 h-5 text-[#b8860b] flex-shrink-0 mt-0.5" />
                              )}
                              <span className={isWarranty ? 'font-bold text-[#996515]' : 'font-medium'}>
                                {localizeProductFeature(feat, lang)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* 4. Care & Warranty */}
            {activeTab === 'care' && (
              <div className="max-w-3xl space-y-4 text-xs sm:text-sm text-gray-700 leading-relaxed">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {isFr ? 'Conditions de garantie & entretien' : 'شروط الضمان والعناية بالساعة'}
                </h3>
                <p>
                  {isFr
                    ? "Chaque montre Noblewatch est fabriquée en acier inoxydable de haute qualité avec un placage durable. Pour préserver son éclat pendant des années :"
                    : 'ساعة Noblewatch مصنوعة من أجود أنواع الفولاذ المقاوم للصدأ ومطلية بتقنيات كهربائية متقدمة. للحفاظ على لمعانها لعشرات السنين:'}
                </p>
                <ul className={`list-disc list-inside space-y-2 text-gray-700 ${isFr ? 'pl-2' : 'pr-2'}`}>
                  {isFr ? (
                    <>
                      <li>Évitez le contact direct avec les parfums concentrés ou produits chimiques.</li>
                      <li>Nettoyez le verre et le boîtier avec un chiffon doux en microfibre.</li>
                      <li>Assurez-vous que la couronne est bien fermée avant tout contact avec l’eau.</li>
                      <li>La garantie couvre tout défaut de fabrication du mouvement avec réparation ou remplacement gratuit.</li>
                    </>
                  ) : (
                    <>
                      <li>تجنب تعريض الساعة مباشرة للعطور المركزة أو المنظفات الكيميائية الحارقة.</li>
                      <li>امسح زجاج وهيكل الساعة بقطعة قماش ناعمة (Microfiber) عند الحاجة.</li>
                      <li>تأكد من إحكام إغلاق تاج ضبط الوقت (Crown) قبل أي تلامس مع الماء.</li>
                      <li>يشمل الضمان صيانة عطل المحرك الميكانيكي أو الكهربائي واستبدال أي قطعة مصنعية معيبة مجاناً.</li>
                    </>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* ================= SECTION 6: CUSTOMER REVIEWS ================= */}
        <div
          className={`rounded-3xl bg-white border border-gray-200 p-6 sm:p-10 space-y-6 shadow-sm ${
            isFr ? 'text-left' : 'text-right'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs text-[#996515] font-bold mb-1">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span>{isFr ? 'Avis vérifiés' : 'تقييمات موثقة'}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900">
                {isFr ? 'Avis de nos clients sur cette montre ⭐' : 'شنو قالو زبناءنا على الساعة؟ ⭐'}
              </h2>
            </div>

            <div className="flex items-center gap-3 bg-[#fefaf0] border border-[#c5a869]/30 px-4 py-2.5 rounded-2xl">
              <span className="text-2xl font-black text-amber-600">{product.rating}</span>
              <div className={isFr ? 'text-left' : 'text-right'}>
                <div className="flex items-center gap-1 text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                  ))}
                </div>
                <span className="text-[10px] text-gray-600 font-semibold">
                  {isFr ? 'Note moyenne globale' : 'معدل التقييمات العامة'}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {productReviews.length > 0 ? (
              <>
                {productReviews.slice(0, reviewsLimit).map((rev) => (
                  <div
                    key={rev.id}
                    className="p-5 rounded-2xl bg-gray-50 border border-gray-200 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-amber-500">
                        {[...Array(rev.rating)].map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                        ))}
                      </div>
                      <span className="text-xs text-gray-500">{rev.date}</span>
                    </div>

                    <p className="text-sm text-gray-800 leading-relaxed font-normal italic">
                      "{translateReviewComment(rev.comment, lang)}"
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-200 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900">{rev.author}</span>
                        <span className="text-gray-500 font-normal">({translateCityName(rev.city, lang)})</span>
                      </div>
                      <span className="text-[11px] text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        {isFr ? 'Acheteur vérifié ✓' : 'مشتري مؤكد ✓'}
                      </span>
                    </div>
                  </div>
                ))}

                {productReviews.length > reviewsLimit && (
                  <div className="col-span-1 md:col-span-2 text-center pt-3">
                    <button
                      onClick={() => setReviewsLimit((prev) => prev + 6)}
                      className="px-6 py-2.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-xs font-bold text-gray-800 transition shadow-sm cursor-pointer"
                    >
                      {isFr
                        ? `Voir plus d'avis (+6 sur ${productReviews.length})`
                        : `عرض المزيد من التقييمات لهذا الموديل (+6 من أصل ${productReviews.length} تقييم)`}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="col-span-2 text-center py-8 text-gray-500 text-xs">
                {isFr
                  ? 'Soyez le premier à évaluer cette montre après réception !'
                  : 'كن أول من يقيّم هذه الساعة بعد استلامها!'}
              </div>
            )}
          </div>
        </div>

        {/* ================= SECTION 7: HOW TO ORDER IN MOROCCO ================= */}
        <div className="rounded-3xl bg-white border border-gray-200 p-6 sm:p-10 text-center space-y-8 shadow-sm">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900">
              {isFr ? 'Comment commander facilement ?' : 'كيفاش تطلب المنتوج ديالك؟'}
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              {isFr
                ? '3 étapes simples et rapides sans aucune carte bancaire'
                : '3 خطوات بسيطة ومباشرة بدون الحاجة لأي بطاقة بنكية'}
            </p>
          </div>

          <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 ${isFr ? 'text-left' : 'text-right'}`}>
            {/* Step 1 */}
            <div className="p-6 rounded-2xl bg-[#fafafa] border border-gray-200 relative shadow-sm">
              <span
                className={`absolute top-4 w-8 h-8 rounded-full gold-gradient-bg text-black font-black flex items-center justify-center text-sm shadow ${
                  isFr ? 'right-4' : 'left-4'
                }`}
              >
                1
              </span>
              <h3 className="text-base font-bold text-gray-900 mb-2">
                {isFr ? 'Choisissez votre modèle' : 'اختر المنتج واللون'}
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                {isFr
                  ? 'Sélectionnez la couleur et le pack souhaité puis cliquez sur « Commander maintenant ».'
                  : 'حدد اللون المفضل لديك والكمية، ثم اضغط على زر "اطلب الآن".'}
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-2xl bg-[#fafafa] border border-gray-200 relative shadow-sm">
              <span
                className={`absolute top-4 w-8 h-8 rounded-full gold-gradient-bg text-black font-black flex items-center justify-center text-sm shadow ${
                  isFr ? 'right-4' : 'left-4'
                }`}
              >
                2
              </span>
              <h3 className="text-base font-bold text-gray-900 mb-2">
                {isFr ? 'Confirmez la livraison' : 'أكد معلومات التوصيل'}
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                {isFr
                  ? 'Saisissez votre nom, téléphone, ville et adresse. Notre équipe confirme rapidement par appel ou WhatsApp.'
                  : 'املأ اسمك ورقم هاتفك ومدينتك. سيتصل بك فريقنا هاتفياً أو عبر الواتساب لتأكيد الإرسال.'}
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-2xl bg-[#fafafa] border border-gray-200 relative shadow-sm">
              <span
                className={`absolute top-4 w-8 h-8 rounded-full gold-gradient-bg text-black font-black flex items-center justify-center text-sm shadow ${
                  isFr ? 'right-4' : 'left-4'
                }`}
              >
                3
              </span>
              <h3 className="text-base font-bold text-gray-900 mb-2">
                {isFr ? 'Payez à la réception' : 'توصل بالطلب حتى لباب دارك'}
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                {isFr
                  ? 'Ouvrez le colis devant le livreur, vérifiez votre montre puis réglez en espèces.'
                  : 'يسلمك الموزع الساعة، تفتحها وتتأكد من جودتها ثم تدفع المبلغ المتفق عليه نقداً.'}
              </p>
            </div>
          </div>

          <div className="pt-4">
            <button
              onClick={handleInstantBuy}
              className="inline-flex items-center gap-2 px-10 py-4 rounded-xl gold-gradient-bg text-black font-black text-base shadow-xl hover:brightness-105 active:scale-95 transition cursor-pointer"
            >
              <Zap className="w-5 h-5 fill-black" />
              <span>
                {isFr
                  ? 'Confirmer ma commande - Paiement à la livraison'
                  : 'أكد طلبك الآن - الدفع عند الاستلام'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ================= STICKY MOBILE ACTION BAR ================= */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-gray-200/90 px-3 py-2.5 z-40 shadow-2xl flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <img
            src={product.images[activeImageIndex] || product.images[0] || '/assets/luxury_watch_hero.jpg'}
            alt={product.name}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = '/assets/luxury_watch_hero.jpg';
            }}
            className="w-10 h-10 rounded-lg object-cover border border-gray-200 flex-shrink-0 shadow-xs"
          />
          <div className={`truncate ${isFr ? 'text-left' : 'text-right'}`}>
            <span className="text-[10px] text-gray-500 block truncate leading-none mb-1">
              {product.name}
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-sm font-black text-gray-900 leading-none">
                {formatPrice(getBundlePriceForQuantity(product, quantity, lang).totalPrice, lang)}
              </span>
              <span className="text-[9px] text-emerald-700 font-bold bg-emerald-50 px-1 rounded">
                {isFr ? 'Livraison 0 DH' : 'توصيل 0DH'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <a
            href={`https://wa.me/${(settings?.whatsappNumber || '+212612345678').replace(/\+/g, '')}?text=${encodeURIComponent(
              isFr
                ? `Bonjour, je souhaite commander ${product.name} (Réf : ${product.sku})`
                : `السلام عليكم، بغيت نطلب ساعة ${product.name} (رمز: ${product.sku})`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 active:scale-95 transition"
            title={isFr ? 'Commander via WhatsApp' : 'طلب عبر الواتساب'}
          >
            <MessageCircle className="w-5 h-5 text-emerald-600" />
          </a>

          <button
            onClick={handleInstantBuy}
            className="px-4 py-2.5 rounded-xl gold-gradient-bg text-black font-extrabold text-xs shadow-md active:scale-95 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Zap className="w-4 h-4 fill-black" />
            <span>{isFr ? 'Commander' : 'اطلب الآن'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
