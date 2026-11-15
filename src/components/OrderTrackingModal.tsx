import React, { useState } from 'react';
import { X, Search, Clock, Truck, AlertCircle } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useLanguage } from '../context/LanguageContext';
import { STATUS_COLORS, formatPrice } from '../utils/constants';
import { translateOrderStatus } from '../i18n/storefront';
import { translateCityName } from '../i18n/catalogTranslations';
import { Order } from '../types';

export const OrderTrackingModal: React.FC = () => {
  const { isTrackingOpen, setIsTrackingOpen, orders } = useStore();
  const { lang, isFr } = useLanguage();
  const [searchInput, setSearchInput] = useState('');
  const [matchedOrder, setMatchedOrder] = useState<Order | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  if (!isTrackingOpen) return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const raw = searchInput.trim();
    const query = raw.toUpperCase();
    if (!query) return;

    setHasSearched(true);
    const localFound = orders.find(
      (o) =>
        o.orderNumber.toUpperCase() === query ||
        o.phone.replace(/[\s\-\.]/g, '') === query.replace(/[\s\-\.]/g, '')
    );
    if (localFound) {
      setMatchedOrder(localFound);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(`/api/orders/lookup?q=${encodeURIComponent(raw)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.order) {
          setMatchedOrder(data.order);
          return;
        }
      }
      setMatchedOrder(null);
    } catch {
      setMatchedOrder(null);
    } finally {
      setIsSearching(false);
    }
  };

  const handleClose = () => {
    setIsTrackingOpen(false);
    setMatchedOrder(null);
    setHasSearched(false);
    setSearchInput('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div
        className={`relative w-full max-w-lg rounded-3xl bg-white border border-gray-200 shadow-2xl p-6 sm:p-8 space-y-6 my-8 ${
          isFr ? 'text-left' : 'text-right'
        }`}
      >
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#996515] flex items-center justify-center border border-amber-200/50">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">
                {isFr ? 'Suivre votre commande au Maroc' : 'تتبع حالة طلبك في المغرب'}
              </h3>
              <p className="text-xs text-gray-500">
                {isFr
                  ? 'Saisissez le numéro de commande ou votre téléphone'
                  : 'أدخل رقم الطلب أو رقم هاتفك لمعرفة موقع شحنتك'}
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-1.5 rounded-xl text-gray-400 hover:text-gray-800 hover:bg-gray-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search input form */}
        <form onSubmit={handleSearch} className="space-y-3">
          <div className="relative">
            <input
              type="text"
              required
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={isFr ? 'Ex : NW-88421 ou 0661239847' : 'مثال: NW-88421 أو 0661239847'}
              className={`w-full bg-gray-50 border border-gray-200 rounded-xl py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#996515] focus:bg-white transition ${
                isFr ? 'pl-11 pr-4' : 'pr-11 pl-4'
              }`}
            />
            <Search
              className={`w-4 h-4 text-gray-400 absolute top-1/2 -translate-y-1/2 ${
                isFr ? 'left-4' : 'right-4'
              }`}
            />
          </div>

          <button
            type="submit"
            disabled={isSearching}
            className="w-full py-3 rounded-xl gold-gradient-bg text-black font-extrabold text-xs shadow-md hover:brightness-105 active:scale-95 transition disabled:opacity-60"
          >
            {isSearching
              ? isFr
                ? 'Recherche en cours...'
                : 'جاري البحث...'
              : isFr
              ? 'Rechercher et suivre la commande'
              : 'بحث وتتبع الطلب'}
          </button>
        </form>

        {/* Search results */}
        {hasSearched && (
          <div>
            {matchedOrder ? (
              <div className="space-y-5 rounded-2xl bg-gray-50 border border-gray-200 p-5">
                {/* Header info */}
                <div className="flex items-center justify-between border-b border-gray-200/70 pb-3">
                  <div>
                    <span className="text-xs font-mono font-bold text-[#996515]">
                      {matchedOrder.orderNumber}
                    </span>
                    <h4 className="text-sm font-bold text-gray-900">{matchedOrder.customerName}</h4>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold border ${
                      STATUS_COLORS[matchedOrder.status]?.bg || 'bg-amber-500/10'
                    } ${STATUS_COLORS[matchedOrder.status]?.text || 'text-amber-800'} ${
                      STATUS_COLORS[matchedOrder.status]?.border || 'border-amber-500/30'
                    }`}
                  >
                    {translateOrderStatus(matchedOrder.status, lang)}
                  </span>
                </div>

                {/* Items & Amount */}
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between gap-3 text-gray-600">
                    <span>{isFr ? 'Ville et adresse :' : 'المدينة والعنوان:'}</span>
                    <span className="text-gray-900 font-semibold">
                      {translateCityName(matchedOrder.city, lang)} - {matchedOrder.address}
                    </span>
                  </div>
                  <div className="flex justify-between gap-3 text-gray-600">
                    <span>{isFr ? 'Montant à payer :' : 'المبلغ المستحق نقداً:'}</span>
                    <span className="text-emerald-700 font-bold">
                      {formatPrice(matchedOrder.totalAmount, lang)}{' '}
                      {isFr ? '(Paiement à la livraison)' : '(الدفع عند الاستلام)'}
                    </span>
                  </div>
                </div>

                {/* Progression Timeline */}
                <div className="pt-3 border-t border-gray-200/70 space-y-3">
                  <h5 className="text-xs font-bold text-[#996515] flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5" />
                    <span>{isFr ? 'Historique de la livraison :' : 'مسار تحديثات الشحنة:'}</span>
                  </h5>

                  <div
                    className={`space-y-3 border-amber-300 ${
                      isFr ? 'pl-2 border-l-2' : 'pr-2 border-r-2'
                    }`}
                  >
                    {matchedOrder.history?.map((step, idx) => (
                      <div key={idx} className={`relative ${isFr ? 'pl-4' : 'pr-4'}`}>
                        <span
                          className={`absolute top-1 w-2.5 h-2.5 rounded-full bg-[#c5a869] ${
                            isFr ? '-left-[9px]' : '-right-[9px]'
                          }`}
                        ></span>
                        <div className="text-xs font-bold text-gray-900">
                          {translateOrderStatus(step.status, lang)}
                        </div>
                        <div className="text-[11px] text-gray-600">{step.note}</div>
                        <div className="text-[10px] text-gray-400 font-mono">
                          {new Date(step.time).toLocaleString(isFr ? 'fr-MA' : 'ar-MA')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {matchedOrder.adminNotes && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/60 text-xs text-amber-900">
                    <strong className="text-gray-900 block mb-0.5">
                      {isFr ? 'Note de livraison :' : 'ملاحظة شركة التوصيل:'}
                    </strong>
                    {matchedOrder.adminNotes}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 text-center space-y-2">
                <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
                <h4 className="text-sm font-bold text-gray-900">
                  {isFr ? 'Aucune commande trouvée' : 'لم يتم العثور على أي طلب'}
                </h4>
                <p className="text-xs text-gray-600">
                  {isFr
                    ? 'Vérifiez le numéro de téléphone ou de commande, ou contactez notre service client.'
                    : 'تأكد من إدخال رقم الهاتف بشكل صحيح، أو تواصل مع خدمة العملاء للمساعدة.'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
