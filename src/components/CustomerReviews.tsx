import React, { useState, useMemo } from 'react';
import {
  Star,
  CheckCircle,
  MessageSquarePlus,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  MapPin,
  X,
  TrendingUp,
  ThumbsUp,
  Award,
  Camera,
  UploadCloud,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useLanguage } from '../context/LanguageContext';
import { MOROCCAN_CITIES } from '../utils/constants';
import {
  formatCityLabel,
  translateReviewComment,
  translateCityName,
} from '../i18n/storefront';
import { MALE_AVATARS, FEMALE_AVATARS, isFemaleName } from '../utils/reviewAvatars';

const ITEMS_PER_PAGE = 9;

export const CustomerReviews: React.FC = () => {
  const { reviews, products, submitReview } = useStore();
  const { lang, isFr } = useLanguage();
  const [modalOpen, setModalOpen] = useState(false);
  const [author, setAuthor] = useState('');
  const [city, setCity] = useState(MOROCCAN_CITIES[0].replace(/\s*\([^)]*\)/g, '').trim());
  const [productId, setProductId] = useState(products[0]?.id || '');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [customerPhoto, setCustomerPhoto] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCityFilter, setSelectedCityFilter] = useState('all');
  const [selectedRatingFilter, setSelectedRatingFilter] = useState<number | 'all'>('all');
  const [selectedProductFilter, setSelectedProductFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Fast O(1) product lookup Map
  const productById = useMemo(
    () => new Map(products.map((p) => [p.id, p])),
    [products]
  );

  // Filter approved reviews only
  const approvedReviews = useMemo(() => {
    return reviews.filter((r) => r.isApproved);
  }, [reviews]);

  const { totalCount, fiveStarsCount, fourStarsCount, fiveStarPercent, fourStarPercent } = useMemo(() => {
    const total = approvedReviews.length;
    let five = 0;
    let four = 0;
    for (let i = 0; i < approvedReviews.length; i++) {
      const r = approvedReviews[i];
      if (r.rating === 5) five += 1;
      else if (r.rating === 4) four += 1;
    }
    return {
      totalCount: total,
      fiveStarsCount: five,
      fourStarsCount: four,
      fiveStarPercent: total > 0 ? Math.round((five / total) * 100) : 90,
      fourStarPercent: total > 0 ? Math.round((four / total) * 100) : 10,
    };
  }, [approvedReviews]);

  // Filtered reviews based on user selections
  const filteredReviews = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const cityFilterLower = selectedCityFilter !== 'all' ? selectedCityFilter.toLowerCase() : '';

    return approvedReviews.filter((r) => {
      if (selectedRatingFilter !== 'all' && r.rating !== selectedRatingFilter) {
        return false;
      }
      if (cityFilterLower) {
        const rawMatch = r.city.toLowerCase().includes(cityFilterLower);
        if (!rawMatch && !translateCityName(r.city, 'fr').toLowerCase().includes(cityFilterLower)) {
          return false;
        }
      }
      if (selectedProductFilter !== 'all' && r.productId !== selectedProductFilter) {
        return false;
      }
      if (q) {
        if (r.comment.toLowerCase().includes(q)) return true;
        if (r.author.toLowerCase().includes(q)) return true;
        if (r.city.toLowerCase().includes(q)) return true;
        if (translateCityName(r.city, 'fr').toLowerCase().includes(q)) return true;
        if (translateReviewComment(r.comment, 'fr').toLowerCase().includes(q)) return true;
        return false;
      }
      return true;
    });
  }, [approvedReviews, selectedRatingFilter, selectedCityFilter, selectedProductFilter, searchQuery]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredReviews.length / ITEMS_PER_PAGE) || 1;
  const currentReviews = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredReviews.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredReviews, currentPage]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      const section = document.getElementById('reviews-section');
      if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handleFilterReset = () => {
    setSearchQuery('');
    setSelectedCityFilter('all');
    setSelectedRatingFilter('all');
    setSelectedProductFilter('all');
    setCurrentPage(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!author.trim() || !comment.trim()) return;

    setSubmitting(true);
    await submitReview({
      author: author.trim(),
      city,
      productId: productId || products[0]?.id,
      rating,
      comment: comment.trim(),
      customerPhoto: customerPhoto || undefined,
    });
    setSubmitting(false);
    setModalOpen(false);
    setAuthor('');
    setComment('');
    setCustomerPhoto('');
  };

  return (
    <section id="reviews-section" className="py-16 bg-white border-b border-gray-200/80 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className={`flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 ${isFr ? 'text-left' : 'text-right'}`}>
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fefaf0] text-xs font-bold text-[#996515] border border-[#c5a869]/30 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-[#b8860b]" />
              <span>{isFr ? 'Expériences réelles de nos clients 🇲🇦' : 'تجارب زبناء المتجر الحقيقية 🇲🇦'}</span>
            </div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2">
              <span>{isFr ? 'Avis de nos clients au Maroc' : 'آراء زبناءنا بالمغرب'}</span>
              <span className="text-lg font-mono px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                {totalCount} {isFr ? 'avis' : 'تقييم'}
              </span>
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {isFr
                ? 'Retours authentiques de nos clients satisfaits dans tout le Royaume du Maroc'
                : 'ملاحظات وتجارب حقيقية بالدارجة المغربية لزبنائنا الكرام من مختلف ربوع المملكة'}
            </p>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 text-xs font-bold shadow-sm hover:shadow transition self-start sm:self-auto cursor-pointer"
          >
            <MessageSquarePlus className="w-4 h-4 text-[#b8860b]" />
            <span>{isFr ? 'Partagez votre avis' : 'شاركنا رأيك في مشترياتك'}</span>
          </button>
        </div>

        {/* Rating Breakdown & Stats Banner */}
        <div className={`mb-10 p-6 rounded-3xl bg-gradient-to-r from-[#faf8f4] via-[#fcfbf9] to-[#faf8f4] border border-[#c5a869]/25 shadow-sm ${isFr ? 'text-left' : 'text-right'}`}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
            <div className={`flex items-center justify-center md:justify-start gap-4 border-b md:border-b-0 border-gray-200/80 pb-4 md:pb-0 ${isFr ? 'md:border-r md:pr-6' : 'md:border-l md:pl-6'}`}>
              <div className="text-center">
                <span className="text-5xl font-black text-gray-900 tracking-tight">4.9</span>
                <span className="text-xs text-gray-500 block font-semibold mt-0.5">
                  {isFr ? 'sur 5.0' : 'من 5.0'}
                </span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-xs font-bold text-gray-700">
                  {isFr ? `Basé sur ${totalCount} avis vérifiés` : `بناءً على ${totalCount} تقييم موثق`}
                </p>
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full font-bold border border-emerald-200">
                  <CheckCircle className="w-3 h-3 text-emerald-600" />
                  <span>{isFr ? '100% commandes livrées' : '100% طلبات مؤكدة تم تسليمها'}</span>
                </span>
              </div>
            </div>

            {/* Progress Bars */}
            <div className={`md:col-span-2 space-y-2 border-b md:border-b-0 border-gray-200/80 pb-4 md:pb-0 text-xs ${isFr ? 'md:border-r md:pr-6' : 'md:border-l md:pl-6'}`}>
              <div className="flex items-center gap-3">
                <span className={`w-16 font-bold text-gray-700 ${isFr ? 'text-left' : 'text-right'}`}>
                  {isFr ? '5 étoiles' : '5 نجوم'}
                </span>
                <div className="flex-1 h-3 rounded-full bg-gray-200 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-l from-amber-400 to-[#c5a869] rounded-full transition-all duration-500"
                    style={{ width: `${fiveStarPercent}%` }}
                  />
                </div>
                <span className={`w-12 font-mono text-gray-600 font-bold ${isFr ? 'text-right' : 'text-left'}`}>
                  {fiveStarsCount}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className={`w-16 font-bold text-gray-700 ${isFr ? 'text-left' : 'text-right'}`}>
                  {isFr ? '4 étoiles' : '4 نجوم'}
                </span>
                <div className="flex-1 h-3 rounded-full bg-gray-200 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-l from-amber-300 to-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${fourStarPercent}%` }}
                  />
                </div>
                <span className={`w-12 font-mono text-gray-600 font-bold ${isFr ? 'text-right' : 'text-left'}`}>
                  {fourStarsCount}
                </span>
              </div>
            </div>

            {/* Quick Guarantees Badge */}
            <div className="flex flex-col items-center md:items-start justify-center gap-2 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-[#b8860b]" />
                <span className="font-bold text-gray-900">
                  {isFr ? 'Satisfaction : 98,4%' : 'نسبة الرضا: 98.4%'}
                </span>
              </div>
              <p className={`text-[11px] text-gray-500 text-center ${isFr ? 'md:text-left' : 'md:text-right'}`}>
                {isFr
                  ? 'Droit de vérification et contrôle devant chez vous avant le paiement'
                  : 'حق المعاينة والفحص عند باب المنزل قبل الدفع نقداً للموزع'}
              </p>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="mb-8 p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-4">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder={
                  isFr
                    ? 'Rechercher dans les avis (ex : livraison, garantie, qualité...)'
                    : 'ابحث في آراء الزبائن (مثال: التوصيل، الموزع، الضمان، الكرونوغراف، الماء...)'
                }
                className={`w-full bg-white border border-gray-200 rounded-xl py-2.5 text-xs sm:text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#c5a869] focus:ring-1 focus:ring-[#c5a869] ${
                  isFr ? 'pl-10 pr-4' : 'pr-10 pl-4'
                }`}
              />
              <Search
                className={`w-4 h-4 text-gray-400 absolute top-1/2 -translate-y-1/2 ${
                  isFr ? 'left-3.5' : 'right-3.5'
                }`}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className={`absolute top-1/2 -translate-y-1/2 text-gray-400 hover:text-black p-1 ${
                    isFr ? 'right-3' : 'left-3'
                  }`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 whitespace-nowrap">{isFr ? 'Ville :' : 'المدينة:'}</span>
              <select
                value={selectedCityFilter}
                onChange={(e) => {
                  setSelectedCityFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-white border border-gray-200 rounded-xl py-2 px-3 text-xs text-gray-800 focus:outline-none focus:border-[#c5a869]"
              >
                <option value="all">{isFr ? `Toutes les villes (${totalCount})` : `كل المدن (${totalCount})`}</option>
                {MOROCCAN_CITIES.map((c) => {
                  const canonicalCity = c.startsWith('أخرى') ? 'أخرى' : c.replace(/\s*\([^)]*\)/g, '').trim();
                  return (
                    <option key={c} value={canonicalCity}>
                      {formatCityLabel(c, lang)}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 whitespace-nowrap">{isFr ? 'Modèle :' : 'الساعة:'}</span>
              <select
                value={selectedProductFilter}
                onChange={(e) => {
                  setSelectedProductFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-white border border-gray-200 rounded-xl py-2 px-3 text-xs text-gray-800 focus:outline-none focus:border-[#c5a869] max-w-[160px] truncate"
              >
                <option value="all">{isFr ? 'Tous les produits' : 'جميع الساعات والإكسسوارات'}</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name.slice(0, 22)}...
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-gray-200">
              <button
                onClick={() => {
                  setSelectedRatingFilter('all');
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  selectedRatingFilter === 'all'
                    ? 'bg-amber-100 text-amber-900 shadow-sm'
                    : 'text-gray-600 hover:text-black'
                }`}
              >
                {isFr ? 'Tous' : 'الكل'}
              </button>
              <button
                onClick={() => {
                  setSelectedRatingFilter(5);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition ${
                  selectedRatingFilter === 5
                    ? 'bg-amber-100 text-amber-900 shadow-sm'
                    : 'text-gray-600 hover:text-black'
                }`}
              >
                <span>{isFr ? '5 ★' : '5 نجوم'}</span>
                <span className="text-[10px] opacity-75">({fiveStarsCount})</span>
              </button>
              <button
                onClick={() => {
                  setSelectedRatingFilter(4);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition ${
                  selectedRatingFilter === 4
                    ? 'bg-amber-100 text-amber-900 shadow-sm'
                    : 'text-gray-600 hover:text-black'
                }`}
              >
                <span>{isFr ? '4 ★' : '4 نجوم'}</span>
                <span className="text-[10px] opacity-75">({fourStarsCount})</span>
              </button>
            </div>
          </div>

          {(searchQuery || selectedCityFilter !== 'all' || selectedRatingFilter !== 'all' || selectedProductFilter !== 'all') && (
            <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-200">
              <span className="text-gray-600 font-semibold">
                {isFr ? (
                  <>
                    Résultats : <strong>{filteredReviews.length}</strong> avis trouvé(s)
                  </>
                ) : (
                  <>
                    نتائج التصفية: تم العثور على <strong>{filteredReviews.length}</strong> تقييم
                  </>
                )}
              </span>
              <button
                onClick={handleFilterReset}
                className="text-[#996515] hover:underline font-bold flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                <span>{isFr ? 'Réinitialiser les filtres' : 'إعادة ضبط الفلاتر'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Reviews Cards Grid */}
        {currentReviews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(() => {
              const usedOnPage = new Set<string>();

              return currentReviews.map((rev, cardIndex) => {
                const matchedProduct = rev.productId ? productById.get(rev.productId) : undefined;
                const isFemale = isFemaleName(rev.author);
                const pool = isFemale ? FEMALE_AVATARS : MALE_AVATARS;

                let avatarUrl = rev.customerPhoto;
                // If missing, or already used by another card on this page, pick an unused one
                if (!avatarUrl || usedOnPage.has(avatarUrl)) {
                  const unused = pool.find((url) => !usedOnPage.has(url));
                  avatarUrl = unused || pool[(cardIndex + (isFemale ? 3 : 7)) % pool.length];
                }
                usedOnPage.add(avatarUrl);

                return (
                  <div
                    key={rev.id}
                    className={`p-4 sm:p-6 rounded-2xl bg-[#fafafa] border border-gray-200/90 shadow-xs hover:shadow-md flex flex-col justify-between space-y-3 sm:space-y-4 hover:border-[#c5a869]/60 transition ${
                      isFr ? 'text-left' : 'text-right'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-500 font-mono">{rev.date}</span>
                        {rev.isVerified && (
                          <span className="flex items-center gap-1 text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                            <span>{isFr ? 'Achat vérifié' : 'طلب مؤكد'}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-sm text-gray-800 leading-relaxed font-normal italic">
                      "{translateReviewComment(rev.comment, lang)}"
                    </p>

                    {matchedProduct && (
                      <div className="text-[11px] text-gray-500 bg-white px-2.5 py-1 rounded-lg border border-gray-200/60 truncate">
                        <span className="text-[#996515] font-semibold">
                          {isFr ? 'Modèle : ' : 'الموديل: '}
                        </span>
                        <span>{matchedProduct.name}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-3 pt-3 border-t border-gray-200">
                      <img
                        src={avatarUrl}
                        alt={rev.author}
                        loading="lazy"
                        decoding="async"
                        className="w-10 h-10 rounded-full object-cover border border-[#c5a869]/40 shadow-sm flex-shrink-0"
                      />
                      <div className="truncate">
                        <h4 className="text-sm font-bold text-gray-900 truncate">{rev.author}</h4>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          <span>{translateCityName(rev.city, lang)}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        ) : (
          <div className="text-center py-16 bg-gray-50 rounded-3xl border border-gray-200 space-y-3">
            <Search className="w-8 h-8 text-gray-400 mx-auto" />
            <h4 className="text-base font-bold text-gray-800">
              {isFr ? 'Aucun avis ne correspond à votre recherche' : 'لا توجد تقييمات مطابقة لبحثك'}
            </h4>
            <p className="text-xs text-gray-500">
              {isFr
                ? 'Essayez avec d’autres mots-clés ou modifiez les filtres sélectionnés'
                : 'جرب البحث بكلمات أخرى أو تغيير الفلاتر المختارة'}
            </p>
            <button
              onClick={handleFilterReset}
              className="px-4 py-2 rounded-xl bg-white border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-100"
            >
              {isFr ? `Afficher les ${totalCount} avis` : `عرض جميع الـ ${totalCount} تقييم`}
            </button>
          </div>
        )}

        {/* Pagination & Count Navigation */}
        {filteredReviews.length > ITEMS_PER_PAGE && (
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-200 pt-6">
            <div className="text-xs text-gray-500">
              {isFr ? (
                <>
                  Affichage{' '}
                  <strong className="text-gray-900 font-mono">
                    {(currentPage - 1) * ITEMS_PER_PAGE + 1}
                  </strong>{' '}
                  à{' '}
                  <strong className="text-gray-900 font-mono">
                    {Math.min(currentPage * ITEMS_PER_PAGE, filteredReviews.length)}
                  </strong>{' '}
                  sur <strong className="text-gray-900 font-mono">{filteredReviews.length}</strong> avis
                </>
              ) : (
                <>
                  عرض{' '}
                  <strong className="text-gray-900 font-mono">
                    {(currentPage - 1) * ITEMS_PER_PAGE + 1}
                  </strong>{' '}
                  إلى{' '}
                  <strong className="text-gray-900 font-mono">
                    {Math.min(currentPage * ITEMS_PER_PAGE, filteredReviews.length)}
                  </strong>{' '}
                  من أصل <strong className="text-gray-900 font-mono">{filteredReviews.length}</strong> تقييم
                </>
              )}
            </div>

            {/* Pagination Buttons */}
            <div className="flex items-center gap-1.5" dir="ltr">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
                title="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Dynamic Pages */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let p = i + 1;
                if (totalPages > 5 && currentPage > 3) {
                  p = currentPage - 2 + i;
                  if (p > totalPages) p = totalPages - 4 + i;
                }
                return (
                  <button
                    key={p}
                    onClick={() => handlePageChange(p)}
                    className={`w-9 h-9 rounded-xl text-xs font-bold font-mono transition ${
                      currentPage === p
                        ? 'gold-gradient-bg text-black shadow-sm font-black'
                        : 'border border-gray-200 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}

              {totalPages > 5 && currentPage < totalPages - 2 && (
                <span className="px-2 text-gray-400 font-mono">...</span>
              )}

              {totalPages > 5 && currentPage < totalPages - 2 && (
                <button
                  onClick={() => handlePageChange(totalPages)}
                  className="w-9 h-9 rounded-xl border border-gray-200 text-xs font-bold font-mono text-gray-700 hover:bg-gray-100"
                >
                  {totalPages}
                </button>
              )}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
                title="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Submit Review Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className={`relative w-full max-w-lg rounded-3xl bg-white border border-gray-200 p-6 sm:p-8 shadow-2xl space-y-5 ${
              isFr ? 'text-left' : 'text-right'
            }`}
          >
            <div className="flex items-center justify-between border-b border-gray-200 pb-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
                <span>{isFr ? 'Ajouter un avis client' : 'إضافة تقييم زبون جديد'}</span>
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-black hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-700 font-semibold mb-1">
                  {isFr ? 'Nom complet' : 'اسمك الكامل'}
                </label>
                <input
                  type="text"
                  required
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder={isFr ? 'Ex : Youssef Alami ou Salma Mansouri' : 'مثال: يوسف العلمي أو سلمى المنصوري'}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2.5 text-gray-900 focus:outline-none focus:bg-white focus:border-[#c5a869]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">
                    {isFr ? 'Ville' : 'المدينة'}
                  </label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2.5 text-gray-900 focus:outline-none focus:bg-white focus:border-[#c5a869]"
                  >
                    {MOROCCAN_CITIES.map((c) => {
                      const canonicalCity = c.startsWith('أخرى') ? 'أخرى' : c.replace(/\s*\([^)]*\)/g, '').trim();
                      return (
                        <option key={c} value={canonicalCity}>
                          {formatCityLabel(c, lang)}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-1">
                    {isFr ? 'Produit acheté' : 'المنتج المشترى (ساعة أو إكسسوار)'}
                  </label>
                  <select
                    value={productId}
                    onChange={(e) => setProductId(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2.5 text-gray-900 focus:outline-none focus:bg-white focus:border-[#c5a869]"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name.slice(0, 25)}...
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">
                  {isFr ? 'Votre note' : 'التقييم بالنجوم'}
                </label>
                <div className="flex items-center gap-2 py-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 hover:scale-125 transition-transform"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-gray-700 font-bold mx-2">
                    {isFr ? `${rating} sur 5` : `${rating} من 5`}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">
                  {isFr ? 'Votre avis sur le produit et la livraison *' : 'رأيك فالمنتج والتوصيل (بالدارجة أو العربية) *'}
                </label>
                <textarea
                  required
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={
                    isFr
                      ? 'Ex : Montre conforme aux photos, livraison rapide et livreur très professionnel...'
                      : 'مثال: الطلبية جاتني نقية كيفما فالتصاور والتعامل ديال الموزع كان ممتاز، شكراً لكم...'
                  }
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-gray-900 focus:outline-none focus:bg-white focus:border-[#c5a869]"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-[#c5a869]" />
                    <span>
                      {isFr ? 'Photo du produit reçu (optionnel)' : 'صورة المنتج بعد الاستلام (تحميل من جهازك - اختياري)'}
                    </span>
                  </span>
                  {customerPhoto && (
                    <button
                      type="button"
                      onClick={() => setCustomerPhoto('')}
                      className="text-xs text-rose-500 hover:underline"
                    >
                      {isFr ? 'Supprimer' : 'إلغاء الصورة'}
                    </button>
                  )}
                </label>

                {customerPhoto ? (
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-[#c5a869]">
                    <img src={customerPhoto} alt="Client" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 hover:bg-gray-100 cursor-pointer text-xs text-gray-600 transition">
                    <UploadCloud className="w-4 h-4 text-[#c5a869]" />
                    <span>
                      {isFr ? 'Cliquez pour choisir une photo depuis votre appareil' : 'انقر لاختيار صورة من الحاسوب أو الهاتف'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = async () => {
                            const dataUrl = reader.result as string;
                            try {
                              const res = await fetch('/api/upload', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  dataUrl,
                                  filename: file.name,
                                  mimeType: file.type,
                                }),
                              });
                              const data = await res.json();
                              if (data.success && data.url) {
                                setCustomerPhoto(data.url);
                              } else {
                                setCustomerPhoto(dataUrl);
                              }
                            } catch {
                              setCustomerPhoto(dataUrl);
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold cursor-pointer"
                >
                  {isFr ? 'Annuler' : 'إلغاء'}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl gold-gradient-bg text-black font-extrabold shadow hover:brightness-105 disabled:opacity-50 cursor-pointer"
                >
                  {submitting
                    ? isFr
                      ? 'Publication...'
                      : 'جاري النشر...'
                    : isFr
                    ? 'Publier mon avis'
                    : 'نشر التقييم'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
