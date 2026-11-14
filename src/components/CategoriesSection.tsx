import React from 'react';
import { Watch, Sparkles, Shield, Heart } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useLanguage } from '../context/LanguageContext';

export const CategoriesSection: React.FC = () => {
  const { selectedCategory, setSelectedCategory, products } = useStore();
  const { isFr } = useLanguage();

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
    setSelectedCategory(catId);
    const el = document.getElementById('products-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="py-12 bg-[#f8f9fb] border-b border-gray-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-8">
          <div className="inline-block px-3 py-1 rounded-full bg-white text-xs font-bold text-[#996515] border border-[#c5a869]/30 shadow-sm mb-2">
            {isFr ? 'Collection de montres et accessoires de luxe' : 'تشكيلة الساعات والإكسسوارات الفاخرة'}
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            {isFr ? 'Parcourir par catégorie' : 'تصفح حسب الفئة'}
          </h2>
          <div className="w-12 h-1 bg-[#c5a869] mx-auto mt-2 rounded-full"></div>
        </div>

        {/* Categories cards grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-5 gap-3 sm:gap-4">
          {categoryItems.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            const count =
              cat.id === 'all'
                ? products.length
                : products.filter(
                    (p) => p.category === cat.id || (p.categories && p.categories.includes(cat.id))
                  ).length;

            return (
              <button
                key={cat.id}
                onClick={() => handleSelect(cat.id)}
                className={`relative group p-3 sm:p-4 rounded-2xl flex flex-col items-center text-center transition-all duration-300 border cursor-pointer ${
                  isSelected
                    ? 'bg-[#fefaf0] border-[#c5a869] shadow-md scale-[1.02]'
                    : 'bg-white border-gray-200 hover:border-[#c5a869]/50 hover:bg-gray-50/80 shadow-xs'
                }`}
              >
                <div
                  className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-2 sm:mb-3 transition-transform group-hover:scale-110 ${
                    isSelected
                      ? 'gold-gradient-bg text-black shadow-md'
                      : 'bg-[#fbf7ee] text-[#b8860b] group-hover:bg-[#f5ebd2]'
                  }`}
                >
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>

                <span
                  className={`text-[11px] sm:text-xs font-bold transition-colors ${
                    isSelected ? 'text-[#996515]' : 'text-gray-800 group-hover:text-black'
                  }`}
                >
                  {cat.name}
                </span>

                <span className="text-[9px] sm:text-[10px] text-gray-500 mt-0.5 sm:mt-1 font-medium">
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
                  <span className="absolute -bottom-1.5 w-6 h-1 rounded-full bg-[#c5a869]"></span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
