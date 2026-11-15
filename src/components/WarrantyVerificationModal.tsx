import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  X,
  MessageCircle,
  Award,
  Loader2,
  Search,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useLanguage } from '../context/LanguageContext';
import type { Order } from '../types';
import { translateColorName } from '../i18n/storefront';
import { translateCityName } from '../i18n/catalogTranslations';
import { buildWhatsAppUrl } from '../utils/constants';

export const WarrantyVerificationModal: React.FC = () => {
  const { orders, settings, isWarrantyCheckOpen, setIsWarrantyCheckOpen } = useStore();
  const { lang, isFr } = useLanguage();
  const [orderId, setOrderId] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [fetchedOrder, setFetchedOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [hasManualSearch, setHasManualSearch] = useState(false);

  useEffect(() => {
    const parseHash = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#warranty')) {
        const qIdx = hash.indexOf('?');
        if (qIdx !== -1) {
          const params = new URLSearchParams(hash.substring(qIdx));
          const id = params.get('id');
          if (id) {
            setOrderId(id);
            setSearchInput(id);
            return;
          }
        }
      }
      setOrderId(null);
    };

    parseHash();
    window.addEventListener('hashchange', parseHash);
    return () => window.removeEventListener('hashchange', parseHash);
  }, []);

  useEffect(() => {
    if (!orderId) {
      if (!hasManualSearch) {
        setFetchedOrder(null);
        setNotFound(false);
      }
      return;
    }

    const stripped = orderId.trim().replace(/^NW-WR-/i, '').toUpperCase();
    const localMatch = orders.find(
      (o) =>
        o.id === orderId ||
        o.orderNumber.toUpperCase() === orderId.toUpperCase() ||
        o.orderNumber.toUpperCase() === stripped
    );
    if (localMatch) {
      setFetchedOrder(localMatch);
      setNotFound(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setNotFound(false);

    fetch(`/api/orders/public/${encodeURIComponent(orderId)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return;
        if (data?.success && data.order) {
          setFetchedOrder(data.order);
        } else {
          setNotFound(true);
        }
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [orderId, orders, hasManualSearch]);

  if (!orderId && !isWarrantyCheckOpen) return null;

  const currentOrder =
    fetchedOrder ||
    (orderId
      ? orders.find(
          (o) =>
            o.id === orderId ||
            o.orderNumber.toUpperCase() === orderId.toUpperCase() ||
            o.orderNumber.toUpperCase() === orderId.replace(/^NW-WR-/i, '').toUpperCase()
        ) || null
      : null);

  const handleManualSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const raw = searchInput.trim();
    if (!raw) return;

    setHasManualSearch(true);
    setNotFound(false);

    const upper = raw.toUpperCase();
    const stripped = upper.replace(/^NW-WR-/, '');
    const cleanedPhone = raw.replace(/[\s\-.]/g, '');

    const localFound = orders.find(
      (o) =>
        o.orderNumber.toUpperCase() === upper ||
        o.orderNumber.toUpperCase() === stripped ||
        o.phone.replace(/[\s\-.]/g, '') === cleanedPhone
    );

    if (localFound) {
      setOrderId(localFound.orderNumber);
      setFetchedOrder(localFound);
      setNotFound(false);
      return;
    }

    setIsLoading(true);
    setFetchedOrder(null);
    setOrderId(null);

    try {
      const res = await fetch(`/api/orders/lookup?q=${encodeURIComponent(raw)}`);
      if (res.ok) {
        const data = await res.json();
        if (data?.success && data.order) {
          setFetchedOrder(data.order);
          setOrderId(data.order.orderNumber);
          setNotFound(false);
          return;
        }
      }
      setNotFound(true);
    } catch {
      setNotFound(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setOrderId(null);
    setFetchedOrder(null);
    setNotFound(false);
    setHasManualSearch(false);
    setSearchInput('');
    setIsWarrantyCheckOpen(false);
    if (window.location.hash.startsWith('#warranty')) {
      window.location.hash = '';
    }
  };

  const storeName = settings?.storeName || 'Noblewatch';
  const issueDate = currentOrder?.date ? new Date(currentOrder.date) : new Date();
  const validIssueDate = Number.isNaN(issueDate.getTime()) ? new Date() : issueDate;
  const expiryDate = new Date(validIssueDate.getTime());
  expiryDate.setFullYear(expiryDate.getFullYear() + 1);

  const now = new Date();
  const msRemaining = expiryDate.getTime() - now.getTime();
  const daysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));
  const isVoided =
    currentOrder?.status === 'ملغى' || currentOrder?.status === 'مرتجع';
  const isExpired = msRemaining <= 0;
  const isValid = Boolean(currentOrder) && !isVoided && !isExpired;

  const fmtDate = (d: Date) =>
    d.toLocaleDateString(isFr ? 'fr-MA' : 'ar-MA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  return (
    <div
      dir={isFr ? 'ltr' : 'rtl'}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg rounded-3xl bg-white border-2 border-[#c5a869] shadow-2xl overflow-hidden my-4">
        {/* Top Brand Header */}
        <div className="bg-[#11131a] text-white p-5 flex items-center justify-between border-b border-[#c5a869]/50">
          <div className="flex items-center gap-3" dir="ltr">
            <div className="w-11 h-11 rounded-full p-0.5 bg-gradient-to-br from-[#dfb76c] via-[#c5a869] to-[#9d7e35] flex-shrink-0">
              <img
                src="/favicon.svg"
                alt={storeName}
                className="w-full h-full rounded-full object-contain bg-[#08090d]"
              />
            </div>
            <div className="text-left">
              <div className="text-xl font-serif font-black leading-none text-white">
                <span className="text-[#c5a869] italic">{storeName.charAt(0)}</span>
                <span>{storeName.slice(1)}</span>
              </div>
              <span className="text-[9px] tracking-widest text-[#c5a869] font-mono uppercase">
                OFFICIAL WARRANTY VERIFICATION
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white cursor-pointer"
            aria-label={isFr ? 'Fermer' : 'إغلاق'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-4">
          {/* Interactive Warranty Lookup Form */}
          <div className="rounded-2xl bg-[#fefaf0] border border-[#c5a869]/50 p-4 space-y-3">
            <div className="flex items-start gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#11131a] text-[#e5c985] flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-950">
                  {isFr ? 'Vérification de votre certificat de garantie' : 'التحقق من شهادة الضمان الرسمية'}
                </h3>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  {isFr
                    ? 'Saisissez le numéro de certificat (NW-WR-...), le numéro de commande ou votre téléphone'
                    : 'أدخل رقم الشهادة (NW-WR-...) أو رقم الطلب أو رقم الهاتف للتحقق من صلاحية الضمان'}
                </p>
              </div>
            </div>

            <form onSubmit={handleManualSearch} className="space-y-2.5">
              <div className="relative">
                <input
                  type="text"
                  required
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder={
                    isFr
                      ? 'Ex : NW-WR-NW-88421, NW-88421 ou 0661239847'
                      : 'مثال: NW-WR-NW-88421 أو NW-88421 أو 0661239847'
                  }
                  className={`w-full bg-white border border-[#c5a869]/70 rounded-xl py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#996515] transition ${
                    isFr ? 'pl-10 pr-3' : 'pr-10 pl-3'
                  }`}
                />
                <Search
                  className={`w-4 h-4 text-[#996515] absolute top-1/2 -translate-y-1/2 ${
                    isFr ? 'left-3.5' : 'right-3.5'
                  }`}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-xl gold-gradient-bg text-black font-extrabold text-xs shadow-sm hover:brightness-105 active:scale-95 transition disabled:opacity-60 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>
                  {isLoading
                    ? isFr
                      ? 'Vérification en cours...'
                      : 'جاري التحقق...'
                    : isFr
                    ? 'Vérifier la garantie'
                    : 'تحقق من شهادة الضمان'}
                </span>
              </button>
            </form>
          </div>

          {isLoading ? (
            <div className="py-8 text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#b8860b] mx-auto" />
              <p className="text-sm font-bold text-slate-700">
                {isFr
                  ? 'Vérification du certificat de garantie...'
                  : 'جاري التحقق من شهادة الضمان الرسمية...'}
              </p>
            </div>
          ) : notFound ? (
            <div className="py-6 px-4 rounded-2xl bg-rose-50 border border-rose-200 text-center space-y-2.5">
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <XCircle className="w-7 h-7" />
              </div>
              <h3 className="text-base font-black text-slate-900">
                {isFr ? 'Certificat introuvable' : 'لم يتم العثور على شهادة الضمان'}
              </h3>
              <p className="text-xs text-slate-600">
                {isFr
                  ? 'Vérifiez le numéro saisi (numéro de certificat, commande ou téléphone) et réessayez.'
                  : 'تأكد من كتابة رقم الشهادة أو رقم الطلب أو رقم الهاتف بشكل صحيح ثم أعد المحاولة.'}
              </p>
            </div>
          ) : !currentOrder ? null : (
            <>
              {/* Authenticity Status Banner */}
              <div
                className={`p-4 rounded-2xl border flex items-center gap-3 ${
                  isValid
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}
              >
                {isValid ? (
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 flex-shrink-0" />
                ) : (
                  <XCircle className="w-8 h-8 text-rose-600 flex-shrink-0" />
                )}
                <div>
                  <div className="font-black text-sm">
                    {isValid
                      ? isFr
                        ? 'Garantie officielle authentique et active (1 An)'
                        : 'شهادة ضمان أصلية ومفعّلة (ضمان لمدة عام واحد)'
                      : isVoided
                      ? isFr
                        ? 'Garantie annulée (commande annulée ou retournée)'
                        : 'الضمان ملغى (الطلب ملغى أو مرتجع)'
                      : isFr
                      ? 'Garantie expirée (1 an dépassé)'
                      : 'انتهت مدة صلاحية الضمان (سنة واحدة)'}
                  </div>
                  <div className="text-xs opacity-80 mt-0.5 font-mono" dir="ltr">
                    NW-WR-{currentOrder.orderNumber}
                  </div>
                </div>
              </div>

              {/* Coverage Details */}
              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">
                    {isFr ? 'Bénéficiaire :' : 'صاحب الشهادة (الزبون):'}
                  </span>
                  <span className="font-black text-slate-900">{currentOrder.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{isFr ? 'Ville :' : 'المدينة:'}</span>
                  <span className="font-bold text-slate-900">{translateCityName(currentOrder.city, lang)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">
                    {isFr ? "Date d'achat :" : 'تاريخ الشراء والإصدار:'}
                  </span>
                  <span className="font-bold text-slate-900">{fmtDate(validIssueDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">
                    {isFr ? 'Valable jusqu’au :' : 'صالحة إلى غاية:'}
                  </span>
                  <span className="font-black text-emerald-700">{fmtDate(expiryDate)}</span>
                </div>
                {isValid && (
                  <div className="flex justify-between pt-2 border-t border-slate-200">
                    <span className="text-slate-600 flex items-center gap-1 font-bold">
                      <Clock className="w-3.5 h-3.5 text-[#b8860b]" />
                      <span>{isFr ? 'Jours restants :' : 'المدة المتبقية:'}</span>
                    </span>
                    <span className="font-black text-[#8a5a00]">
                      {daysRemaining} {isFr ? 'jours' : 'يوم'}
                    </span>
                  </div>
                )}
              </div>

              {/* Covered Items */}
              <div className="space-y-2">
                <div className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-[#b8860b]" />
                  <span>
                    {isFr
                      ? 'Produits couverts (Garantie 1 an défaut de fabrication) :'
                      : 'المنتجات المشمولة بضمان العطب المصنعي (سنة كاملة):'}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {currentOrder.items.map((it, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50/60 border border-[#c5a869]/40 text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-950">{it.name}</div>
                        <div className="text-[11px] text-slate-600">
                          {translateColorName(it.color, lang)} •{' '}
                          {isFr ? `Qté: ${it.quantity}` : `الكمية: ${it.quantity}`}
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                        {isFr ? '1 An' : 'سنة كاملة'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Support Action */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                <a
                  href={buildWhatsAppUrl(
                    settings?.whatsappNumber,
                    isFr
                      ? `Bonjour ${storeName}, je souhaite contacter le service garantie pour ma commande ${currentOrder.orderNumber}.`
                      : `السلام عليكم متجر ${storeName}، أتواصل معكم بخصوص شهادة الضمان الخاصة بالطلب رقم ${currentOrder.orderNumber}`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>
                    {isFr ? 'Contacter le service garantie' : 'تواصل مع خدمة الضمان عبر واتساب'}
                  </span>
                </a>
                <button
                  type="button"
                  onClick={handleClose}
                  className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs cursor-pointer"
                >
                  {isFr ? 'Fermer' : 'إغلاق'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
