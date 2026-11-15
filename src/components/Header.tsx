import React, { useState } from 'react';
import {
  ShoppingBag,
  Search,
  MessageCircle,
  Menu,
  X,
  Truck,
  Clock,
  ShieldCheck,
  Globe,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useLanguage } from '../context/LanguageContext';
import { localizeSettingText } from '../i18n/storefront';
import { buildWhatsAppUrl, sanitizePhoneText } from '../utils/constants';

export const Header: React.FC = () => {
  const {
    settings,
    cartCount,
    setIsCartOpen,
    setActiveProductId,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    setIsTrackingOpen,
    setIsWarrantyCheckOpen,
  } = useStore();
  const { lang, isFr, toggleLang, setLang } = useLanguage();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const handleNavClick = (catId?: string, action?: 'tracking' | 'warranty' | 'home' | 'reviews') => {
    setActiveProductId(null);
    setMobileMenuOpen(false);

    if (action === 'home') {
      setSelectedCategory('all');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (action === 'tracking') {
      setIsTrackingOpen(true);
    } else if (action === 'warranty') {
      setIsWarrantyCheckOpen(true);
    } else if (action === 'reviews') {
      const el = document.getElementById('reviews-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else if (catId) {
      setSelectedCategory(catId);
      const el = document.getElementById('products-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const announcementText = localizeSettingText(
    settings?.announcementText,
    ['توصيل مجاني لجميع أنحاء المغرب 🇲🇦 والدفع عند الاستلام'],
    'Livraison GRATUITE partout au Maroc 🇲🇦 et paiement à la livraison',
    lang
  );

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
      {/* 1. Top Announcement Bar */}
      <div className="bg-gradient-to-r from-[#997838] via-[#c5a869] to-[#997838] text-black text-xs font-semibold py-1.5 px-4 text-center tracking-wide flex items-center justify-between">
        <div className="hidden sm:flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1 font-bold">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-800 animate-pulse"></span>
            {isFr ? 'Maroc 🇲🇦' : 'المغرب 🇲🇦'}
          </span>
          <span className="opacity-40">|</span>
          <span className="flex items-center gap-1">
            <Truck className="w-3.5 h-3.5" />
            {isFr ? 'Livraison dans toutes les villes' : 'توصيل لجميع المدن والقرى'}
          </span>
        </div>

        <div className="flex-1 text-center font-bold">{announcementText}</div>

        <div className="hidden sm:flex items-center gap-3 text-xs">
          <a
            href={buildWhatsAppUrl(
              settings?.whatsappNumber,
              isFr
                ? 'Bonjour, je souhaite obtenir des renseignements sur les montres et accessoires Noblewatch.'
                : 'السلام عليكم، بغيت نستفسر على ساعات وإكسسوارات Noblewatch'
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:underline font-bold"
          >
            <MessageCircle className="w-3.5 h-3.5 text-black" />
            <span>{isFr ? 'Contactez-nous sur WhatsApp' : 'تواصل معنا عبر واتساب'}</span>
          </a>
        </div>
      </div>

      {/* 2. Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-3 sm:gap-4">
          {/* Mobile Toggle + Brand Logo */}
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-gray-700 hover:text-black hover:bg-gray-100"
              aria-label={isFr ? 'Menu' : 'القائمة'}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Brand Logo */}
            <button
              onClick={() => handleNavClick(undefined, 'home')}
              className={`flex items-center gap-2.5 group cursor-pointer ${isFr ? 'text-left' : 'text-right'}`}
            >
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full p-0.5 bg-gradient-to-br from-[#dfb76c] via-[#c5a869] to-[#9d7e35] shadow-md flex-shrink-0 group-hover:scale-105 transition-transform">
                <img
                  src="/favicon.svg"
                  alt="Noblewatch Logo"
                  className="w-full h-full rounded-full object-contain"
                />
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-serif font-black tracking-tight text-gray-900 group-hover:text-[#b8860b] transition-colors leading-none">
                  <span className="gold-gradient-text font-serif italic tracking-tighter text-3xl sm:text-4xl">N</span>
                  <span className="tracking-wide">oblewatch</span>
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[9px] tracking-widest text-[#996515] uppercase font-mono px-1.5 py-0.2 border border-[#c5a869]/40 bg-[#fefaf0] rounded">
                    GENEVE • MAROC
                  </span>
                </div>
              </div>
            </button>
          </div>

          {/* Desktop Live Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-2 xl:mx-5">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  isFr
                    ? 'Rechercher une montre, un accessoire, un modèle...'
                    : 'ابحث عن ساعة يد، إكسسوار، موديل...'
                }
                className={`w-full bg-gray-50 border border-gray-200 rounded-full py-2.5 text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:bg-white focus:border-[#c5a869] focus:ring-2 focus:ring-[#c5a869]/20 transition shadow-inner ${
                  isFr ? 'pl-11 pr-8' : 'pr-11 pl-8'
                }`}
              />
              <Search
                className={`w-4 h-4 text-gray-400 absolute top-1/2 -translate-y-1/2 ${
                  isFr ? 'left-4' : 'right-4'
                }`}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className={`absolute top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-800 text-xs bg-gray-200 rounded-full p-1 ${
                    isFr ? 'right-3' : 'left-3'
                  }`}
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Action Buttons + Language Switcher */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* Language Toggle Button (AR / FR) */}
            <button
              type="button"
              onClick={toggleLang}
              aria-label={isFr ? 'Passer en arabe' : 'تغيير اللغة إلى الفرنسية'}
              title={isFr ? 'العربية' : 'Français'}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-full text-xs font-extrabold text-gray-800 bg-[#fefaf0] hover:bg-[#f7eccb] border border-[#c5a869]/60 shadow-xs transition cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-[#996515]" />
              <span className="font-mono tracking-wide">{isFr ? 'العربية' : 'FR'}</span>
            </button>

            {/* Mobile Search Toggle */}
            <button
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              className="md:hidden p-2 rounded-full text-gray-600 hover:text-black hover:bg-gray-100"
              title={isFr ? 'Rechercher' : 'بحث'}
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Direct Order Tracking Button */}
            <button
              onClick={() => setIsTrackingOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold text-gray-700 hover:text-black hover:bg-gray-100 border border-gray-200 transition cursor-pointer"
              title={isFr ? 'Suivre votre commande' : 'تتبع مسار طلبك'}
            >
              <Clock className="w-3.5 h-3.5 text-[#b8860b]" />
              <span>{isFr ? 'Suivi commande' : 'تتبع الطلب'}</span>
            </button>

            {/* Direct Warranty Verification Button */}
            <button
              onClick={() => setIsWarrantyCheckOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold text-gray-800 bg-amber-50/70 hover:bg-amber-100/80 border border-[#c5a869]/60 transition cursor-pointer"
              title={isFr ? 'Vérifier votre certificat de garantie' : 'تحقق من شهادة الضمان الرسمية'}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#996515]" />
              <span>{isFr ? 'Vérifier garantie' : 'تحقق من الضمان'}</span>
            </button>

            {/* WhatsApp Quick Order */}
            <a
              href={buildWhatsAppUrl(
                settings?.whatsappNumber,
                isFr
                  ? 'Bonjour, je souhaite vérifier la disponibilité des montres et la livraison au Maroc.'
                  : 'السلام عليكم، أريد الاستفسار عن توفر الساعات والإكسسوارات والتوصيل في المغرب'
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isFr ? 'Commander via WhatsApp' : 'واتساب للطلب'}</span>
            </a>

            {/* Cart Trigger with Counter */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center justify-center p-2.5 rounded-full bg-white border border-gray-300 text-gray-800 hover:border-[#c5a869] transition group shadow-sm hover:shadow cursor-pointer"
              title={isFr ? 'Panier' : 'سلة المشتريات'}
            >
              <ShoppingBag className="w-5 h-5 text-[#b8860b] group-hover:scale-110 transition-transform" />
              {cartCount > 0 && (
                <span
                  className={`absolute -top-1.5 bg-[#c5a869] text-black text-[11px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-md ${
                    isFr ? '-right-1.5' : '-left-1.5'
                  }`}
                >
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar Expansion */}
        {mobileSearchOpen && (
          <div className="md:hidden pb-3 pt-1">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  isFr
                    ? 'Rechercher une montre, un accessoire...'
                    : 'ابحث عن ساعة يد، إكسسوار فاخر، موديل...'
                }
                className={`w-full bg-gray-50 border border-[#c5a869] rounded-full py-2.5 text-sm text-gray-900 placeholder-gray-500 focus:outline-none ${
                  isFr ? 'pl-11 pr-4' : 'pr-11 pl-4'
                }`}
                autoFocus
              />
              <Search
                className={`w-4 h-4 text-[#b8860b] absolute top-1/2 -translate-y-1/2 ${
                  isFr ? 'left-4' : 'right-4'
                }`}
              />
            </div>
          </div>
        )}

        {/* Desktop Category Nav Links Bar */}
        <div className="hidden lg:flex items-center justify-between border-t border-gray-200/80 py-2.5 text-xs">
          <nav className="flex items-center gap-6">
            <button
              onClick={() => handleNavClick(undefined, 'home')}
              className="text-gray-900 hover:text-[#b8860b] font-bold transition cursor-pointer"
            >
              {isFr ? 'Accueil' : 'الرئيسية'}
            </button>
            <button
              onClick={() => handleNavClick('all')}
              className="text-gray-600 hover:text-[#b8860b] font-medium transition cursor-pointer"
            >
              {isFr ? 'Tous les produits' : 'جميع المنتجات'}
            </button>
            <button
              onClick={() => handleNavClick('men')}
              className="text-gray-600 hover:text-[#b8860b] font-medium transition cursor-pointer"
            >
              {isFr ? 'Montres Homme' : 'ساعات رجالية'}
            </button>
            <button
              onClick={() => handleNavClick('women')}
              className="text-gray-600 hover:text-[#b8860b] font-medium transition cursor-pointer"
            >
              {isFr ? 'Montres Femme' : 'ساعات نسائية'}
            </button>
            <button
              onClick={() => handleNavClick('men-accessories')}
              className="text-gray-600 hover:text-[#b8860b] font-medium transition cursor-pointer"
            >
              {isFr ? 'Accessoires Homme' : 'إكسسوارات رجالية'}
            </button>
            <button
              onClick={() => handleNavClick('women-accessories')}
              className="text-gray-600 hover:text-[#b8860b] font-medium transition cursor-pointer"
            >
              {isFr ? 'Accessoires Femme' : 'إكسسوارات نسائية'}
            </button>
          </nav>

          <div className="flex items-center gap-4 text-gray-500 text-xs">
            <button
              onClick={() => {
                setActiveProductId(null);
                const el = document.getElementById('videos-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-[#996515] hover:text-black transition font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>{isFr ? 'Vidéos des montres 🎥' : 'فيديوهات الساعات 🎥'}</span>
            </button>
            <span>•</span>
            <button
              onClick={() => handleNavClick(undefined, 'reviews')}
              className="hover:text-gray-900 transition font-medium cursor-pointer"
            >
              {isFr ? 'Avis clients ⭐' : 'شنو قالو زبناءنا ⭐'}
            </button>
            <span>•</span>
            <button
              onClick={() => handleNavClick(undefined, 'tracking')}
              className="hover:text-gray-900 transition font-medium cursor-pointer"
            >
              {isFr ? 'Suivre ma commande' : 'طريقة تتبع الطلب'}
            </button>
            <span>•</span>
            <button
              onClick={() => handleNavClick(undefined, 'warranty')}
              className="text-[#996515] hover:text-black transition font-bold flex items-center gap-1 cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{isFr ? 'Vérifier garantie' : 'تحقق من الضمان'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-6 space-y-4 shadow-xl animate-in slide-in-from-top-4 duration-200">
          {/* Mobile Language Selector Strip */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#fefaf0] border border-[#c5a869]/40">
            <span className="text-xs font-bold text-gray-800 flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#996515]" />
              <span>{isFr ? 'Langue du site' : 'لغة الموقع'}</span>
            </span>
            <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-gray-200 text-xs">
              <button
                type="button"
                onClick={() => setLang('ar')}
                className={`px-3 py-1 rounded-md font-bold transition ${
                  !isFr ? 'bg-[#c5a869] text-black' : 'text-gray-600'
                }`}
              >
                العربية
              </button>
              <button
                type="button"
                onClick={() => setLang('fr')}
                className={`px-3 py-1 rounded-md font-bold transition ${
                  isFr ? 'bg-[#c5a869] text-black' : 'text-gray-600'
                }`}
              >
                Français
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pb-4 border-b border-gray-200">
            <button
              onClick={() => handleNavClick(undefined, 'home')}
              className={`${isFr ? 'text-left' : 'text-right'} p-3 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-900 font-bold text-sm`}
            >
              {isFr ? 'Accueil' : 'الرئيسية'}
            </button>
            <button
              onClick={() => handleNavClick('all')}
              className={`${isFr ? 'text-left' : 'text-right'} p-3 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-800 text-sm font-semibold`}
            >
              {isFr ? 'Tous les produits' : 'جميع المنتجات'}
            </button>
            <button
              onClick={() => handleNavClick('men')}
              className={`${isFr ? 'text-left' : 'text-right'} p-3 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-800 text-sm font-semibold`}
            >
              {isFr ? 'Montres Homme' : 'ساعات رجالية'}
            </button>
            <button
              onClick={() => handleNavClick('women')}
              className={`${isFr ? 'text-left' : 'text-right'} p-3 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-800 text-sm font-semibold`}
            >
              {isFr ? 'Montres Femme' : 'ساعات نسائية'}
            </button>
            <button
              onClick={() => handleNavClick('men-accessories')}
              className={`${isFr ? 'text-left' : 'text-right'} p-3 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-800 text-sm font-semibold`}
            >
              {isFr ? '👔 Accessoires Homme' : '👔 إكسسوارات رجالية'}
            </button>
            <button
              onClick={() => handleNavClick('women-accessories')}
              className={`${isFr ? 'text-left' : 'text-right'} p-3 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-800 text-sm font-semibold`}
            >
              {isFr ? '💍 Accessoires Femme' : '💍 إكسسوارات نسائية'}
            </button>
          </div>

          <div className="space-y-2 pt-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setActiveProductId(null);
                const el = document.getElementById('videos-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 text-sm text-gray-900 font-bold"
            >
              <span className="flex items-center gap-2">
                <span className="text-[#996515]">🎥</span>
                {isFr ? 'Voir les vidéos réelles des montres' : 'شاهد فيديوهات الساعات عن قرب'}
              </span>
              <span className="text-xs text-[#996515] font-black">
                {isFr ? 'Regarder →' : 'مشاهدة ←'}
              </span>
            </button>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setIsTrackingOpen(true);
              }}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-800 font-medium"
            >
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#b8860b]" />
                {isFr ? 'Suivre ma commande au Maroc' : 'تتبع مسار طلبك بالمغرب'}
              </span>
              <span className="text-xs text-[#b8860b] font-bold">
                {isFr ? 'Suivre →' : 'متابعة ←'}
              </span>
            </button>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setIsWarrantyCheckOpen(true);
              }}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-[#fefaf0] border border-[#c5a869]/60 text-sm text-gray-900 font-bold"
            >
              <span className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#996515]" />
                {isFr ? 'Vérifier mon certificat de garantie' : 'تحقق من شهادة الضمان'}
              </span>
              <span className="text-xs text-[#996515] font-black">
                {isFr ? 'Vérifier →' : 'تحقق الآن ←'}
              </span>
            </button>
          </div>

          <div className="pt-2">
            <a
              href={buildWhatsAppUrl(
                settings?.whatsappNumber,
                isFr
                  ? 'Bonjour, je souhaite contacter le service client Noblewatch.'
                  : 'السلام عليكم، أريد التواصل مع خدمة العملاء في Noblewatch'
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition"
            >
              <MessageCircle className="w-4 h-4" />
              <span>
                {isFr ? 'Contacter sur WhatsApp' : 'تواصل عبر واتساب'}
                {sanitizePhoneText(settings?.whatsappNumber)
                  ? ` (${sanitizePhoneText(settings?.whatsappNumber)})`
                  : ''}
              </span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
