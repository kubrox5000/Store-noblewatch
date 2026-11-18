import React, { useState, useRef, useMemo } from 'react';
import {
  Play,
  Pause,
  X,
  Sparkles,
  ShoppingBag,
  Eye,
  CheckCircle2,
  Clock,
  Film,
  Maximize2,
  Volume2,
  VolumeX,
  RotateCcw,
  ShieldCheck,
  Truck,
  Layers,
  ChevronRight,
  ChevronLeft,
  Watch,
  Gem,
  Filter,
  Flame,
  Percent,
  Sparkle,
  Compass,
  Activity,
  Award,
  ChevronDown,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useLanguage } from '../context/LanguageContext';
import { Product, WatchVideo } from '../types';
import {
  formatPrice,
  getProductColors,
  calculateTierOffers,
  getBundlePriceForQuantity,
} from '../utils/constants';
import {
  translateColorName,
  translateProductSubtitle,
  translateProductDescription,
} from '../i18n/storefront';
import { getCachedVideoBlobUrl } from '../utils/videoStorage';

interface VideoItem {
  product: Product;
  video: WatchVideo;
}

export type VideoCategoryFilterId =
  | 'all'
  | 'men-watches'
  | 'women-watches'
  | 'men-accessories'
  | 'women-accessories';

interface CategoryFilterDef {
  id: VideoCategoryFilterId;
  label: string;
  labelFr: string;
  icon?: any;
  group: 'all' | 'watches' | 'accessories';
}

const CATEGORY_FILTERS: CategoryFilterDef[] = [
  { id: 'all', label: 'جميع الفيديوهات', labelFr: 'Toutes les vidéos', icon: Film, group: 'all' },
  { id: 'men-watches', label: 'ساعات رجالية', labelFr: 'Montres Homme', icon: Watch, group: 'watches' },
  { id: 'women-watches', label: 'ساعات نسائية', labelFr: 'Montres Femme', icon: Sparkles, group: 'watches' },
  { id: 'men-accessories', label: 'إكسسوارات رجال', labelFr: 'Accessoires Homme', icon: Layers, group: 'accessories' },
  { id: 'women-accessories', label: 'إكسسوارات نساء', labelFr: 'Accessoires Femme', icon: Sparkle, group: 'accessories' },
];

const INITIAL_VIDEO_LIMIT = 6;
const VIDEO_LIMIT_STEP = 9;

const isAccessoryProduct = (p: Product) =>
  p.category === 'accessories' ||
  p.category === 'men-accessories' ||
  p.category === 'women-accessories' ||
  Boolean(p.categories?.some((c: string) => c.includes('accessories')));

const matchesVideoFilter = (p: Product, filterId: VideoCategoryFilterId): boolean => {
  const isAcc = isAccessoryProduct(p);
  switch (filterId) {
    case 'all':
      return true;
    case 'men-watches':
      return !isAcc && (p.category === 'men' || Boolean(p.categories?.includes('men')));
    case 'women-watches':
      return !isAcc && (p.category === 'women' || Boolean(p.categories?.includes('women')));
    case 'men-accessories':
      return isAcc && (p.category === 'men-accessories' || Boolean(p.categories?.includes('men-accessories')));
    case 'women-accessories':
      return isAcc && (p.category === 'women-accessories' || Boolean(p.categories?.includes('women-accessories')));
    default:
      return true;
  }
};

export const ProductVideoSection: React.FC = () => {
  const { products, setActiveProductId, setCheckoutProduct } = useStore();
  const { lang, isFr } = useLanguage();
  const [selectedFilterId, setSelectedFilterId] = useState<VideoCategoryFilterId>('all');
  const [visibleVideosCount, setVisibleVideosCount] = useState(INITIAL_VIDEO_LIMIT);
  const [activePlayingVideo, setActivePlayingVideo] = useState<VideoItem | null>(null);

  // Modal video player states
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [activeAngleIndex, setActiveAngleIndex] = useState(0);
  const [videoError, setVideoError] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [videoMultiColors, setVideoMultiColors] = useState<string[]>([]);
  const [activePlaySrc, setActivePlaySrc] = useState<string>('');

  React.useEffect(() => {
    if (activePlayingVideo) {
      let mounted = true;
      const targetUrl = activePlayingVideo.video.url;
      setActivePlaySrc(targetUrl);
      getCachedVideoBlobUrl(targetUrl).then((blobUrl) => {
        if (mounted && blobUrl) {
          setActivePlaySrc(blobUrl);
        }
      });
      return () => {
        mounted = false;
      };
    } else {
      setActivePlaySrc('');
    }
  }, [activePlayingVideo]);

  const allVideos = useMemo<VideoItem[]>(() => {
    const items: VideoItem[] = [];
    products.forEach((prod) => {
      if (!prod.isPublished) return;
      if (!Array.isArray(prod.videos) || prod.videos.length === 0) return;

      prod.videos.forEach((vid, vIdx) => {
        const trimmedUrl = typeof vid?.url === 'string' ? vid.url.trim() : '';
        if (!trimmedUrl) return;
        items.push({
          product: prod,
          video: {
            ...vid,
            url: trimmedUrl,
            title:
              (typeof vid.title === 'string' && vid.title.trim()) ||
              `معاينة حقيقية 360° وتفاصيل ${prod.name}${prod.videos.length > 1 ? ` (${vIdx + 1})` : ''}`,
            poster:
              (typeof vid.poster === 'string' && vid.poster.trim()) ||
              prod.images?.[0] ||
              '/assets/watches_and_accessories_hero.jpg',
            aspect: vid.aspect || '16:9',
            duration: (typeof vid.duration === 'string' && vid.duration.trim()) || '0:45',
          },
        });
      });
    });
    return items;
  }, [products]);

  const filterCounts = useMemo(() => {
    const counts: Record<VideoCategoryFilterId, number> = {
      all: allVideos.length,
      'men-watches': 0,
      'women-watches': 0,
      'men-accessories': 0,
      'women-accessories': 0,
    };
    for (const item of allVideos) {
      if (matchesVideoFilter(item.product, 'men-watches')) counts['men-watches'] += 1;
      if (matchesVideoFilter(item.product, 'women-watches')) counts['women-watches'] += 1;
      if (matchesVideoFilter(item.product, 'men-accessories')) counts['men-accessories'] += 1;
      if (matchesVideoFilter(item.product, 'women-accessories')) counts['women-accessories'] += 1;
    }
    return counts;
  }, [allVideos]);

  const displayedVideos = useMemo(
    () => allVideos.filter((item) => matchesVideoFilter(item.product, selectedFilterId)),
    [allVideos, selectedFilterId]
  );

  const visibleVideos = useMemo(
    () => displayedVideos.slice(0, visibleVideosCount),
    [displayedVideos, visibleVideosCount]
  );

  const isAccessory = isAccessoryProduct;

  const handleOpenVideo = (item: VideoItem) => {
    setActivePlayingVideo(item);
    setActiveAngleIndex(0);
    setVideoError(false);
    setIsPlaying(true);
    const colors = getProductColors(item.product);
    const firstCol = colors[0]?.name || 'أسود ملكي';
    setSelectedColor(firstCol);
    setSelectedQuantity(1);
    setVideoMultiColors([
      firstCol,
      colors[1]?.name || firstCol,
      colors[2]?.name || firstCol,
    ]);
  };

  const handleQuickOrder = (product: Product, preferredColor?: string) => {
    const colors = getProductColors(product);
    const chosenColor = preferredColor || selectedColor || colors[0]?.name || 'أسود ملكي';
    const finalColors = selectedQuantity > 1
      ? Array.from({ length: selectedQuantity }, (_, i) => videoMultiColors[i] || colors[i % colors.length]?.name || chosenColor)
      : [chosenColor];
    const allSame = finalColors.length > 1 && finalColors.every((c) => c === finalColors[0]);
    const formattedColor = selectedQuantity > 1
      ? (allSame ? `${finalColors[0]} (${selectedQuantity} قطع)` : finalColors.map((c, i) => `ساعة ${i + 1}: ${c}`).join(' + '))
      : chosenColor;

    setActivePlayingVideo(null);
    setCheckoutProduct({
      product,
      color: formattedColor,
      quantity: selectedQuantity || 1,
      selectedColors: finalColors,
    });
  };


  const handleViewDetails = (productId: string) => {
    setActivePlayingVideo(null);
    setActiveProductId(productId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  if (allVideos.length === 0) return null;

  return (
    <section id="videos-section" className="py-16 bg-[#f8f9fb] border-b border-gray-200/80 scroll-mt-20">
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${isFr ? 'text-left' : 'text-right'}`}>
        {/* ================= 1. SECTION HEADER ================= */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#fefaf0] text-xs font-bold text-[#996515] border border-[#c5a869]/30 mb-3 shadow-xs">
            <Film className="w-4 h-4 text-[#b8860b]" />
            <span>{isFr ? 'Aperçu réel en vidéo 🎥' : 'معاينة حقيقية بالفيديو 🎥'}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[11px] font-mono font-bold text-gray-500">
              {isFr ? `(${allVideos.length} vidéos HD disponibles)` : `(${allVideos.length} فيديو متوفر بجودة HD)`}
            </span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight flex flex-wrap items-center gap-2.5">
                <span>
                  {isFr ? 'Découvrez nos montres et accessoires de près' : 'شاهد الساعات والإكسسوارات عن قرب'}
                </span>
                <span className="text-xs font-black text-[#996515] px-3 py-1 rounded-full bg-amber-50 border border-amber-200 shadow-xs">
                  {isFr ? 'Vidéos Haute Définition HD' : 'فيديوهات عالية الدقة HD'}
                </span>
              </h2>
              <p className="text-sm text-gray-600 mt-2 max-w-3xl leading-relaxed">
                {isFr
                  ? 'Des vidéos réalistes sous plusieurs angles mettant en valeur le cadran, l’éclat de l’acier, le cuir premium et les finitions avant votre achat.'
                  : 'فيديوهات واقعية من زوايا متعددة تبرز تفاصيل المينا، لمعان الفولاذ، فخامة الجلد، وبريق الأحجار قبل اتخاذ قرار الشراء'}
              </p>
            </div>
          </div>
        </div>

        {/* ================= 2. MAIN CATEGORY FILTER TABS ================= */}
        <div className="mb-10 bg-white/80 backdrop-blur-xs p-4 sm:p-6 rounded-3xl border border-gray-200/90 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2 text-xs font-black text-gray-900">
              <Filter className="w-4 h-4 text-[#b8860b]" />
              <span>{isFr ? 'Filtrer les vidéos par catégorie :' : 'تصفح الفيديوهات حسب الأقسام الرئيسية:'}</span>
            </div>
            <span className="text-[11px] text-[#996515] font-bold hidden sm:inline-block">
              {isFr ? 'Sélectionnez une catégorie pour afficher les vidéos' : 'اختر القسم لعرض جميع الفيديوهات المطابقة فوراً'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            {CATEGORY_FILTERS.map((cat) => {
              const count = filterCounts[cat.id];
              const isSelected = selectedFilterId === cat.id;
              const IconComp = cat.icon || Sparkles;

              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedFilterId(cat.id);
                    setVisibleVideosCount(INITIAL_VIDEO_LIMIT);
                  }}
                  className={`px-3.5 sm:px-4 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-2 shadow-xs ${
                    isSelected
                      ? 'gold-gradient-bg text-black font-black shadow-md ring-2 ring-[#c5a869]/60 scale-102'
                      : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-[#c5a869]/40 hover:text-gray-900'
                  }`}
                >
                  <IconComp className={`w-3.5 h-3.5 ${isSelected ? 'text-black' : 'text-[#b8860b]'}`} />
                  <span className="whitespace-nowrap">{isFr ? cat.labelFr : cat.label}</span>
                  <span
                    className={`font-mono text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                      isSelected ? 'bg-black/15 text-black' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    ({count})
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ================= 3. VIDEOS GRID ================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleVideos.map((item, idx) => {
            const isAcc = isAccessory(item.product);

            let badgeText = isFr ? 'Montre de luxe' : 'ساعة يد فاخرة';
            if (item.product.category === 'men-accessories') badgeText = isFr ? 'Accessoire Homme' : 'إكسسوار رجالي';
            else if (item.product.category === 'women-accessories') badgeText = isFr ? 'Accessoire Femme' : 'إكسسوار نسائي';
            else if (isAcc) badgeText = isFr ? 'Accessoire de luxe' : 'إكسسوار فاخر';
            else if (item.product.category === 'smart') badgeText = isFr ? 'Montre connectée' : 'ساعة ذكية';
            else if (item.product.category === 'sports') badgeText = isFr ? 'Montre sport' : 'ساعة رياضية';
            else if (item.product.category === 'classic') badgeText = isFr ? 'Montre classique' : 'ساعة كلاسيكية';

            return (
              <div
                key={`${item.product.id}-${idx}`}
                className="group rounded-3xl bg-white border border-gray-200/90 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between hover:border-[#c5a869]/60"
              >
                {/* Video Thumbnail Canvas */}
                <div
                  onClick={() => handleOpenVideo(item)}
                  className="relative aspect-video bg-black cursor-pointer overflow-hidden group/thumb"
                >
                  <img
                    src={item.video.poster || item.product.images[0] || '/assets/luxury_watch_hero.jpg'}
                    alt={item.video.title}
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/assets/luxury_watch_hero.jpg';
                    }}
                    className="w-full h-full object-cover group-hover/thumb:scale-108 transition-transform duration-700 opacity-90 group-hover/thumb:opacity-100"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/20" />

                  <div className="absolute top-3 right-3 left-3 flex items-center justify-between gap-2 pointer-events-none">
                    <span className="bg-black/80 backdrop-blur-md text-[#fcedb4] border border-[#c5a869]/50 text-[11px] font-bold px-2.5 py-1 rounded-lg truncate shadow max-w-[70%]">
                      {item.product.name}
                    </span>
                    <span className="bg-emerald-950/80 backdrop-blur-md text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1 shadow">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span>{isFr ? 'Aperçu HD' : 'معاينة HD'}</span>
                    </span>
                  </div>

                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full gold-gradient-bg text-black flex items-center justify-center shadow-2xl group-hover/thumb:scale-115 transition-transform duration-300">
                      <Play className="w-6 h-6 fill-black mr-0.5" />
                    </div>
                  </div>

                  <div className="absolute bottom-3 right-3 left-3 flex items-center justify-between pointer-events-none">
                    <span className="bg-black/80 backdrop-blur-md text-white text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg border border-white/20 flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-[#c5a869]" />
                      <span>{item.video.duration || '0:45'}</span>
                    </span>

                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur-md text-gray-300 border border-white/10">
                      {badgeText}
                    </span>
                  </div>
                </div>

                {/* Video Info & Product Snapshot */}
                <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3
                      onClick={() => handleOpenVideo(item)}
                      className="text-sm font-bold text-gray-900 group-hover:text-[#996515] transition line-clamp-2 cursor-pointer leading-snug"
                    >
                      {isFr ? `Aperçu réel 360° — ${item.product.name}` : item.video.title}
                    </h3>
                    <p className="text-xs text-gray-500 line-clamp-1 mt-1">
                      {item.product.subtitle
                        ? translateProductSubtitle(item.product.subtitle, lang)
                        : translateProductDescription(item.product.description, lang)}
                    </p>
                  </div>

                  {/* Available Colors Preview */}
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-100">
                    <span className="text-[11px] font-bold text-gray-500">
                      {isFr ? 'Couleurs disponibles :' : 'الألوان المتوفرة:'}
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {getProductColors(item.product).map((col, cIdx) => {
                        const colDisplay = translateColorName(col.name, lang);
                        return (
                          <button
                            key={cIdx}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleQuickOrder(item.product, col.name);
                            }}
                            className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-gray-50 hover:bg-[#c5a869]/20 border border-gray-200 hover:border-[#c5a869] text-[10px] text-gray-700 font-bold transition cursor-pointer"
                            title={isFr ? `Commander directement en ${colDisplay}` : `اطلب مباشرة بلون: ${col.name}`}
                          >
                            <span
                              className="w-2.5 h-2.5 rounded-full border border-black/20 flex-shrink-0"
                              style={{ backgroundColor: col.code }}
                            />
                            <span>{colDisplay}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Product Price & Actions Bar */}
                  <div className="p-3 rounded-2xl bg-gray-50 border border-gray-200/80 space-y-2.5">
                    <div className="flex items-center gap-3">
                      <img
                        src={item.product.images[0]}
                        alt={item.product.name}
                        loading="lazy"
                        decoding="async"
                        className="w-11 h-11 rounded-xl object-cover border border-gray-200 flex-shrink-0 shadow-xs"
                      />
                      <div className={`flex-1 min-w-0 ${isFr ? 'text-left' : 'text-right'}`}>
                        <span className="text-[11px] font-medium text-gray-500 block leading-tight mb-0.5">
                          {isFr ? 'Prix total :' : 'السعر الإجمالي:'}
                        </span>
                        <div className="flex items-baseline flex-wrap gap-x-2 gap-y-0.5">
                          <span className="text-base font-black text-gray-900 whitespace-nowrap" dir="ltr">
                            {formatPrice(item.product.price, lang)}
                          </span>
                          {item.product.originalPrice > item.product.price && (
                            <span className="text-xs text-gray-400 line-through whitespace-nowrap" dir="ltr">
                              {formatPrice(item.product.originalPrice, lang)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleOpenVideo(item)}
                        className="w-full px-3 py-2.5 rounded-xl bg-white border border-gray-300 hover:border-[#c5a869] text-gray-800 text-xs font-bold shadow-xs hover:bg-gray-50 transition cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Play className="w-3.5 h-3.5 fill-gray-800" />
                        <span>{isFr ? 'Lire la vidéo' : 'تشغيل الفيديو'}</span>
                      </button>
                      <button
                        onClick={() => {
                          const itemColors = getProductColors(item.product);
                          handleQuickOrder(item.product, itemColors[0]?.name);
                        }}
                        className="w-full px-3 py-2.5 rounded-xl gold-gradient-bg text-black text-xs font-black shadow hover:brightness-105 active:scale-95 transition cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>{isFr ? 'Commander' : 'اطلب الآن'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Load more videos button */}
        {visibleVideos.length < displayedVideos.length && (
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={() => setVisibleVideosCount((prev) => prev + VIDEO_LIMIT_STEP)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white hover:bg-[#fefaf0] border border-gray-300 hover:border-[#c5a869] text-gray-800 font-bold text-xs shadow-xs transition cursor-pointer"
            >
              <span>
                {isFr
                  ? `Voir plus de vidéos (${displayedVideos.length - visibleVideos.length} restantes)`
                  : `عرض المزيد من الفيديوهات (${displayedVideos.length - visibleVideos.length} فيديو إضافي)`}
              </span>
              <ChevronDown className="w-4 h-4 text-[#996515]" />
            </button>
          </div>
        )}

        {/* Empty State Fallback */}
        {displayedVideos.length === 0 && (
          <div className="text-center py-12 bg-white rounded-3xl border border-gray-200 p-8 shadow-xs">
            <Film className="w-12 h-12 text-[#c5a869] mx-auto mb-3 opacity-60" />
            <h3 className="text-base font-bold text-gray-900 mb-1">
              {isFr ? 'Aucune vidéo dans cette catégorie pour le moment' : 'لا توجد فيديوهات في هذا القسم حالياً'}
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              {isFr ? 'Cliquez ci-dessous pour afficher toutes les vidéos' : 'انقر على الزر أدناه لعرض جميع فيديوهات المتجر'}
            </p>
            <button
              onClick={() => setSelectedFilterId('all')}
              className="px-5 py-2.5 rounded-xl gold-gradient-bg text-black text-xs font-bold shadow"
            >
              {isFr ? `Afficher toutes les vidéos (${allVideos.length})` : `عرض جميع الفيديوهات (${allVideos.length})`}
            </button>
          </div>
        )}
      </div>

      {/* ================= HIGH-TECH VIDEO MODAL PLAYER ================= */}
      {activePlayingVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
          <div
            className={`relative w-full max-w-4xl rounded-3xl bg-[#0c0e14] border border-white/10 shadow-2xl overflow-hidden my-4 flex flex-col max-h-[92vh] ${
              isFr ? 'text-left' : 'text-right'
            }`}
          >
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/10 bg-[#12151f]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl gold-gradient-bg text-black flex items-center justify-center shadow">
                  <Film className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white line-clamp-1">
                    {isFr ? `Aperçu réel 360° — ${activePlayingVideo.product.name}` : activePlayingVideo.video.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-[#c5a869] font-bold">
                      {activePlayingVideo.product.name}
                    </span>
                    <span className="text-white/20">•</span>
                    <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{isFr ? 'Aperçu réel garanti 100%' : 'معاينة واقعية مضمونة 100%'}</span>
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setActivePlayingVideo(null)}
                className="p-2.5 rounded-2xl text-gray-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                title={isFr ? 'Fermer' : 'إغلاق'}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Stage & Angles */}
            <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden group">
              {!videoError ? (
                <video
                  ref={videoRef}
                  controls={false}
                  autoPlay
                  playsInline
                  loop
                  muted={isMuted}
                  src={activePlaySrc || activePlayingVideo.video.url}
                  poster={activePlayingVideo.video.poster || activePlayingVideo.product.images[0]}
                  onError={() => setVideoError(true)}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="relative w-full h-full flex items-center justify-center bg-[#07080b]">
                  <img
                    src={activePlayingVideo.product.images[activeAngleIndex] || activePlayingVideo.product.images[0]}
                    alt={activePlayingVideo.product.name}
                    className="w-full h-full object-contain transition-all duration-700 scale-100 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-radial from-transparent via-black/20 to-black/80 pointer-events-none" />
                  <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 pointer-events-none">
                    <span className="gold-gradient-text font-serif italic text-sm font-bold">Noblewatch</span>
                    <span className="text-[10px] text-gray-300">
                      {isFr ? 'Aperçu 360°' : 'معاينة استعراضية 360°'}
                    </span>
                  </div>
                </div>
              )}

              <div className="absolute top-4 left-4 hidden sm:flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 pointer-events-none z-10">
                <span className="gold-gradient-text font-serif italic text-sm font-bold">N</span>
                <span className="text-[10px] text-gray-300 tracking-wide font-sans">Noblewatch Studios</span>
              </div>

              <div className="absolute bottom-4 inset-x-4 flex items-center justify-between gap-3 bg-black/75 backdrop-blur-md p-2.5 rounded-2xl border border-white/15 z-20">
                <div className="flex items-center gap-2">
                  <button
                    onClick={togglePlay}
                    className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition cursor-pointer"
                    title={isPlaying ? (isFr ? 'Pause' : 'إيقاف مؤقت') : isFr ? 'Lecture' : 'تشغيل'}
                  >
                    {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
                  </button>

                  <button
                    onClick={toggleMute}
                    className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition cursor-pointer"
                    title={isMuted ? (isFr ? 'Activer le son' : 'تشغيل الصوت') : isFr ? 'Muet' : 'كتم الصوت'}
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>

                  <span className="text-xs font-mono text-gray-300 mr-2 hidden sm:inline-block">
                    {activePlayingVideo.video.duration || '0:45'} HD 1080p
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-gray-400 hidden md:inline-block ml-1">
                    {isFr ? 'Angles :' : 'زوايا المعاينة:'}
                  </span>
                  {activePlayingVideo.product.images.slice(0, 4).map((img: string, i: number) => (
                    <button
                      key={i}
                      onClick={() => {
                        setActiveAngleIndex(i);
                        setVideoError(true);
                      }}
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg overflow-hidden border transition cursor-pointer ${
                        activeAngleIndex === i && videoError
                          ? 'border-[#c5a869] ring-2 ring-[#c5a869]/40 scale-105'
                          : 'border-white/20 opacity-70 hover:opacity-100'
                      }`}
                      title={isFr ? `Angle ${i + 1}` : `زاوية ${i + 1}`}
                    >
                      <img src={img} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
                    </button>
                  ))}
                  {videoError && (
                    <button
                      onClick={() => {
                        setVideoError(false);
                        setIsPlaying(true);
                      }}
                      className="px-2 py-1 rounded-lg bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold hover:bg-emerald-600/50 transition cursor-pointer"
                    >
                      {isFr ? 'Retour vidéo' : 'الرجوع للفيديو'}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Inspection Guarantees Ribbon */}
            <div className="bg-[#0f1118] border-b border-white/5 py-2.5 px-4 sm:px-6 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-300">
              <div className="flex items-center gap-2 text-[#fcedb4]">
                <ShieldCheck className="w-4 h-4 text-[#c5a869]" />
                <span className="font-bold">
                  {isFr ? 'Droit d’inspection :' : 'حق الفحص والمعاينة:'}
                </span>
                <span className="text-gray-400">
                  {isFr
                    ? 'Vérifiez le produit entre vos mains avant de payer le livreur'
                    : 'افحص الساعة أو الإكسسوار بيدك قبل دفع أي درهم للموزع'}
                </span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-emerald-400 font-bold">
                <span className="flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5" />
                  <span>{isFr ? 'Livraison gratuite' : 'توصيل مجاني لكافة المدن'}</span>
                </span>
                <span className="text-white/20">•</span>
                <span>{isFr ? 'Garantie officielle 1 an' : 'ضمان رسمي لمدة سنة'}</span>
              </div>
            </div>

            {/* Modal Color Selection & Purchase Bar */}
            {(() => {
              const modalColors = getProductColors(activePlayingVideo.product);
              const activeColorObj = modalColors.find((c) => c.name === selectedColor);
              const currentModalPreviewImage =
                (activeColorObj && activeColorObj.imageIndex !== undefined && activePlayingVideo.product.images[activeColorObj.imageIndex]) ||
                activePlayingVideo.product.images[0] ||
                '/assets/luxury_watch_hero.jpg';

              const tierOffers = calculateTierOffers(activePlayingVideo.product, lang);
              const currentBundle = getBundlePriceForQuantity(activePlayingVideo.product, selectedQuantity, lang);

              return (
                <>
                  {/* Modal Bundle Tier Quick Switcher */}
                  <div className="bg-[#151924] border-b border-white/10 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-2.5">
                    <span className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#c5a869]" />
                      <span>{isFr ? 'Offres Packs Économie :' : 'عروض باقات التوفير:'}</span>
                    </span>

                    <div className="flex items-center gap-2 flex-wrap">
                      {tierOffers.map((t) => {
                        const isSelected = selectedQuantity === t.quantity;
                        return (
                          <button
                            key={t.quantity}
                            type="button"
                            onClick={() => setSelectedQuantity(t.quantity)}
                            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                              isSelected
                                ? 'gold-gradient-bg text-black font-black border-[#c5a869] shadow-md scale-105'
                                : 'bg-white/10 text-white hover:bg-white/15 border-white/10'
                            }`}
                          >
                            <span>{t.label}</span>
                            <span className="font-mono text-[11px] opacity-90">
                              ({formatPrice(t.totalPrice, lang)})
                            </span>
                            {t.badge && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-black/20 font-black">
                                {t.badge}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Modal Color Selection Bar */}
                  <div className="bg-[#181c28] border-b border-white/10 px-4 sm:px-6 py-3 space-y-2.5">
                    {selectedQuantity === 1 ? (
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                            <span>{isFr ? 'Choisissez la couleur :' : 'اختر لون الساعة المطلوب:'}</span>
                          </span>
                          <span className="text-xs font-bold text-gray-200 bg-white/10 px-2.5 py-0.5 rounded-full border border-white/15">
                            {translateColorName(selectedColor || modalColors[0]?.name || '', lang)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          {modalColors.map((color, idx) => {
                            const isSelected = (selectedColor || modalColors[0]?.name) === color.name;
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setSelectedColor(color.name)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs transition-all cursor-pointer border ${
                                  isSelected
                                    ? 'bg-[#c5a869] text-black font-black border-[#c5a869] shadow-lg ring-2 ring-[#c5a869]/40 scale-105'
                                    : 'bg-white/10 hover:bg-white/15 text-white border-white/15'
                                }`}
                              >
                                <span
                                  className="w-4 h-4 rounded-full border border-black/30 shadow-xs flex-shrink-0 flex items-center justify-center"
                                  style={{ backgroundColor: color.code }}
                                >
                                  {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white shadow-xs" />}
                                </span>
                                <span>{translateColorName(color.name, lang)}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-amber-400 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-[#c5a869]" />
                            <span>
                              {isFr
                                ? `Sélection des couleurs du pack (${selectedQuantity} pièces) :`
                                : `تحديد ألوان الساعات في باقة (${selectedQuantity} قطع):`}
                            </span>
                          </span>
                          <span className="text-[11px] text-gray-400">
                            {isFr ? '(Ex : Montre 1 Noir et Montre 2 Or)' : '(مثال: الساعة 1 أسود والساعة 2 أبيض)'}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {Array.from({ length: selectedQuantity }).map((_, itemIdx) => {
                            const curCol =
                              videoMultiColors[itemIdx] ||
                              modalColors[itemIdx % modalColors.length]?.name ||
                              modalColors[0]?.name;
                            return (
                              <div
                                key={itemIdx}
                                className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between gap-2 flex-wrap"
                              >
                                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                                  <span className="w-4 h-4 rounded-full gold-gradient-bg text-black font-black text-[10px] flex items-center justify-center">
                                    {itemIdx + 1}
                                  </span>
                                  <span>{isFr ? `Montre ${itemIdx + 1} :` : `ساعة ${itemIdx + 1}:`}</span>
                                </span>

                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {modalColors.map((color, idx) => {
                                    const isChosen = curCol === color.name;
                                    return (
                                      <button
                                        key={idx}
                                        type="button"
                                        onClick={() => {
                                          const next = [...videoMultiColors];
                                          next[itemIdx] = color.name;
                                          setVideoMultiColors(next);
                                        }}
                                        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] transition-all cursor-pointer border ${
                                          isChosen
                                            ? 'bg-[#c5a869] text-black font-black border-[#c5a869] shadow-xs scale-105'
                                            : 'bg-white/10 hover:bg-white/15 text-gray-300 border-white/10'
                                        }`}
                                      >
                                        <span
                                          className="w-3 h-3 rounded-full border border-black/30 flex-shrink-0"
                                          style={{ backgroundColor: color.code }}
                                        />
                                        <span>{translateColorName(color.name, lang)}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Modal Purchase & Direct Order Bar */}
                  <div className="p-4 sm:p-5 bg-[#12151f] flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3 w-full md:w-auto">
                      <img
                        src={currentModalPreviewImage}
                        alt={activePlayingVideo.product.name}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = '/assets/luxury_watch_hero.jpg';
                        }}
                        className="w-14 h-14 rounded-2xl object-cover border border-white/20 shadow-md flex-shrink-0"
                      />
                      <div className={isFr ? 'text-left' : 'text-right'}>
                        <h4 className="text-sm font-bold text-white line-clamp-1">
                          {activePlayingVideo.product.name}
                        </h4>
                        <div className="flex items-center flex-wrap gap-2 mt-1">
                          <span className="text-lg font-black text-amber-400 whitespace-nowrap" dir="ltr">
                            {formatPrice(currentBundle.totalPrice, lang)}
                          </span>
                          {currentBundle.savingsMAD > 0 ? (
                            <span className="text-xs text-gray-400 line-through whitespace-nowrap" dir="ltr">
                              {formatPrice(tierOffers[0].totalPrice * selectedQuantity, lang)}
                            </span>
                          ) : (
                            activePlayingVideo.product.originalPrice > activePlayingVideo.product.price && (
                              <span className="text-xs text-gray-400 line-through whitespace-nowrap" dir="ltr">
                                {formatPrice(activePlayingVideo.product.originalPrice * selectedQuantity, lang)}
                              </span>
                            )
                          )}
                          {currentBundle.savingsMAD > 0 ? (
                            <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                              {isFr
                                ? `Économie ${formatPrice(currentBundle.savingsMAD, lang)} 🎉`
                                : `وفرت ${formatPrice(currentBundle.savingsMAD, lang)} 🎉`}
                            </span>
                          ) : (
                            <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                              {isFr ? 'Paiement à la livraison (COD)' : 'الدفع عند الاستلام (COD)'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
                      <button
                        onClick={() => handleViewDetails(activePlayingVideo.product.id)}
                        className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition cursor-pointer"
                      >
                        {isFr ? 'Fiche complète' : 'المواصفات الكاملة'}
                      </button>

                      <button
                        onClick={() => handleQuickOrder(activePlayingVideo.product, selectedColor || modalColors[0]?.name)}
                        className="flex-1 md:flex-none px-6 py-3 rounded-xl gold-gradient-bg text-black font-black text-xs sm:text-sm shadow-xl hover:brightness-110 active:scale-95 transition cursor-pointer flex items-center justify-center gap-2"
                      >
                        <ShoppingBag className="w-4 h-4" />
                        <span>{isFr ? 'Commander après aperçu' : 'اطلب الآن بعد المعاينة'}</span>
                      </button>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </section>
  );
};
