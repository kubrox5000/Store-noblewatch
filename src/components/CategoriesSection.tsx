import React, { useTransition } from 'react';
import { Watch, Sparkles, Shield, Heart } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useLanguage } from '../context/LanguageContext';

export const CategoriesSection: React.FC = () => {
  const { selectedCategory, setSelectedCategory, products } = useStore();
  const { isFr } = useLanguage();
  const [, startTransition] = useTransition();

  const categoryItems = [
    {
      id: 'all',
      name: isFr ? 'Tous les produits' : 'جميع المنتجات',
      desc: isFr ? 'Montres & Accessoires' : 'الساعات والإكسسوارات',
      icon: Watch,
    },
    {
      id: 'men',
      name: isFr ? 'Montres Homme' : 'ساعات رجالية',
      desc: isFr ? 'Présence et élégance' : 'حضور وأناقة رجالية',
      icon: Shield,
    },
    {
      id: 'women',
      name: isFr ? 'Montres Femme' : 'ساعات نسائية',
      desc: isFr ? 'Finesse et éclat' : 'رقة وألماس وبريق',
      icon: Heart,
    },
    {
      id: 'men-accessories',
      name: isFr ? 'Accessoires Homme' : 'إكسسوارات رجالية',
      desc: isFr ? 'Bracelets & portefeuilles' : 'أساور، أزرار ومحافظ',
      icon: Shield,
    },
    {
      id: 'women-accessories',
      name: isFr ? 'Accessoires Femme' : 'إكسسوارات نسائية',
      desc: isFr ? 'Parures & bracelets' : 'أطقم ناعمة وأساور مرصعة',
      icon: Sparkles,
    },
  ];

  const handleSelect = (catId: string) => {
    startTransition(() => {
      setSelectedCategory(catId);
    });
    const el = document.getElementById('products-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="py-8 sm:py-12 bg-[#f8f9fb] border-b border-gray-200/60">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-6 sm:mb-8">
          <div className="inline-block px-3 py-1 rounded-full bg-white text-[11px] sm:text-xs font-bold text-[#996515] border border-[#c5a869]/30 shadow-sm mb-2">
            {isFr ? 'Collection de montres et accessoires de luxe' : 'تشكيلة الساعات والإكسسوارات الفاخرة'}
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight text-balance">
            {isFr ? 'Parcourir par catégorie' : 'تصفح حسب الفئة'}
          </h2>
          <div className="w-12 h-1 bg-[#c5a869] mx-auto mt-2 rounded-full"></div>
        </div>

        {/* Categories cards grid (1 featured full-width + 2x2 balanced grid on mobile, 5-col on desktop) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 sm:gap-4">
          {categoryItems.map((cat, idx) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            const count =
              cat.id === 'all'
                ? products.length
                : products.filter(
                    (p) => p.category === cat.id || (p.categories && p.categories.includes(cat.id))
                  ).length;
            const isFeaturedAll = idx === 0;

            return (
              <button
                key={cat.id}
                onClick={() => handleSelect(cat.id)}
                className={`relative group rounded-2xl transition-all duration-300 border cursor-pointer ${
                  isFeaturedAll
                    ? 'col-span-2 sm:col-span-1 p-3.5 sm:p-4 flex flex-row sm:flex-col items-center justify-between sm:justify-center text-start sm:text-center gap-3 sm:gap-0'
                    : 'p-3.5 sm:p-4 flex flex-col items-center text-center'
                } ${
                  isSelected
                    ? 'bg-[#fefaf0] border-[#c5a869] shadow-md sm:scale-[1.02]'
                    : 'bg-white border-gray-200 hover:border-[#c5a869]/50 hover:bg-gray-50/80 shadow-xs'
                }`}
              >
                <div
                  className={`flex items-center gap-3 sm:contents ${isFeaturedAll ? '' : 'contents'}`}
                >
                  <div
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 ${
                      isFeaturedAll ? 'sm:mb-3' : 'mb-2 sm:mb-3'
                    } ${
                      isSelected
                        ? 'gold-gradient-bg text-black shadow-md'
                        : 'bg-[#fbf7ee] text-[#b8860b] group-hover:bg-[#f5ebd2]'
                    }`}
                  >
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>

                  <div className={isFeaturedAll ? 'sm:contents' : 'contents'}>
                    <span
                      className={`block text-xs font-bold transition-colors ${
                        isSelected ? 'text-[#996515]' : 'text-gray-800 group-hover:text-black'
                      }`}
                    >
                      {cat.name}
                    </span>
                    {isFeaturedAll && (
                      <span className="block sm:hidden text-[11px] text-gray-500 mt-0.5">
                        {cat.desc}
                      </span>
                    )}
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold ${
                    isFeaturedAll
                      ? 'px-2.5 py-1 rounded-full bg-gray-100 sm:bg-transparent sm:p-0 text-gray-700 sm:text-gray-500 sm:mt-1 shrink-0'
                      : 'text-gray-500 mt-0.5 sm:mt-1 font-medium'
                  }`}
                >
                  {count}{' '}
                  {isFr
                    ? cat.id.includes('accessories')
                      ? 'articles'
                      : 'modèles'
                    : cat.id.includes('accessories')
                    ? 'قطعة'
                    : 'موديل'}
                </span>

                {isSelected && (
                  <span className="hidden sm:block absolute -bottom-1.5 w-6 h-1 rounded-full bg-[#c5a869]"></span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
