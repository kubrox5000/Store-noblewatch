import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import QRCode from 'qrcode';
import {
  Printer,
  Copy,
  Check,
  MessageCircle,
  ShieldCheck,
  Award,
  X,
} from 'lucide-react';
import type { Order, StoreSettings } from '../types';
import { useStore } from '../context/StoreContext';
import { buildWhatsAppUrl, normalizeMoroccanCityName } from '../utils/constants';

interface WarrantyCertificateModalProps {
  order: Order;
  settings: StoreSettings | null;
  onClose: () => void;
}

export const WarrantyCertificateModal: React.FC<WarrantyCertificateModalProps> = ({
  order,
  settings,
  onClose,
}) => {
  const { showToast } = useStore();
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);

  const storeName = settings?.storeName || 'Noblewatch';
  const certificateSerial = `NW-WR-${order.orderNumber}`;

  const warrantyUrl = useMemo(() => {
    const origin =
      typeof window !== 'undefined' && window.location?.origin
        ? window.location.origin
        : 'https://noblewatch.ma';
    return `${origin}/#warranty?id=${encodeURIComponent(order.orderNumber)}`;
  }, [order.orderNumber]);

  const { issueDateFormatted, expiryDateFormatted } = useMemo(() => {
    const raw = order.date ? new Date(order.date) : new Date();
    const issue = Number.isNaN(raw.getTime()) ? new Date() : raw;
    const expiry = new Date(issue.getTime());
    expiry.setFullYear(expiry.getFullYear() + 1);

    const fmt = (d: Date) =>
      d.toLocaleDateString('ar-MA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

    return {
      issueDateFormatted: fmt(issue),
      expiryDateFormatted: fmt(expiry),
    };
  }, [order.date]);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(warrantyUrl, {
      width: 260,
      margin: 1,
      errorCorrectionLevel: 'H',
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch((err) => {
        console.error('QR code generation error:', err);
      });

    return () => {
      cancelled = true;
    };
  }, [warrantyUrl]);

  useEffect(() => {
    const prevTitle = document.title;
    document.body.classList.add('printing-delivery-slip');
    document.title = `شهادة-ضمان-${order.orderNumber} - ${storeName}`;
    return () => {
      document.title = prevTitle;
      document.body.classList.remove('printing-delivery-slip');
    };
  }, [order.orderNumber, storeName]);

  const handleCopyVerificationLink = async () => {
    try {
      await navigator.clipboard.writeText(warrantyUrl);
      setCopiedLink(true);
      showToast('تم نسخ رابط التحقق الإلكتروني لشهادة الضمان بنجاح', 'success');
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      showToast('تعذر نسخ الرابط تلقائياً', 'error');
    }
  };

  const handleSendWhatsAppWarranty = () => {
    const msg =
      `✨ مرحباً ${order.customerName}،\n` +
      `شكراً لثقتكم في متجر *${storeName}* ⌚\n\n` +
      `✅ نرسل لكم رابط *شهادة الضمان الرسمية لمدة سنة كاملة (12 شهراً)* ضد أي عطب مصنعي لطلبيتكم رقم *#${order.orderNumber}*:\n` +
      `➡ ${warrantyUrl}\n\n` +
      `▪ رقم الشهادة: ${certificateSerial}\n` +
      `▪ صالحة إلى غاية: ${expiryDateFormatted}\n` +
      `نتمنى لكم تجربة استخدام فاخرة ✨`;

    const waUrl = buildWhatsAppUrl(order.phone, msg);
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const formattedColors = (it: Order['items'][number]) => {
    if (Array.isArray(it.selectedColors) && it.selectedColors.length > 0) {
      return it.selectedColors.join(' + ');
    }
    return it.color || 'قياسي';
  };

  const modalContent = (
    <div
      id="warranty-print-portal"
      dir="rtl"
      className="fixed inset-0 z-[60] flex items-start justify-center p-2 sm:p-6 bg-black/90 backdrop-blur-sm overflow-y-auto print:static print:block print:bg-white print:p-0 print:overflow-visible"
    >
      <div className="noblewatch-print-slip relative w-full max-w-3xl bg-[#fffdf7] text-slate-900 rounded-2xl shadow-2xl my-3 sm:my-6 p-3 sm:p-5 print:p-0 print:m-0 print:shadow-none print:rounded-none print:bg-white">
        {/* Top Screen-Only Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-3 border-b border-amber-200/70 print:hidden">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#996515]" />
            <span className="text-xs sm:text-sm font-extrabold text-slate-900">
              معاينة شهادة الضمان الرسمية (سنة كاملة) — {order.orderNumber}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-200/80 hover:bg-slate-300 text-slate-700 cursor-pointer"
            title="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Luxury Certificate Outer Gold Double Frame */}
        <div className="relative border-[3px] border-[#9d7e35] rounded-xl p-1 bg-gradient-to-br from-[#fffdf7] via-[#ffffff] to-[#fdf8eb] print:rounded-lg">
          {/* Decorative Corner Accents */}
          <span className="pointer-events-none absolute top-2 right-2 w-5 h-5 border-t-2 border-r-2 border-[#996515]" />
          <span className="pointer-events-none absolute top-2 left-2 w-5 h-5 border-t-2 border-l-2 border-[#996515]" />
          <span className="pointer-events-none absolute bottom-2 right-2 w-5 h-5 border-b-2 border-r-2 border-[#996515]" />
          <span className="pointer-events-none absolute bottom-2 left-2 w-5 h-5 border-b-2 border-l-2 border-[#996515]" />

          <div className="border border-[#c5a869]/70 rounded-lg p-4 sm:p-7 space-y-5 print:p-4 print:space-y-2.5 relative overflow-hidden print:overflow-visible">
            {/* Subtle Center Watermark Emblem */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.035]">
              <img src="/favicon.svg" alt="" className="w-72 h-72 print:w-56 print:h-56 object-contain" />
            </div>

            {/* 1. Certificate Header: Complete Site Logo + Certificate Metadata */}
            <div className="relative flex flex-col sm:flex-row print:flex-row sm:items-center print:items-center justify-between gap-4 print:gap-2.5 border-b-2 border-[#c5a869]/60 pb-4 print:pb-2.5">
              {/* Complete Site Logo */}
              <div className="flex items-center gap-3.5" dir="ltr">
                <div className="w-16 h-16 print:w-14 print:h-14 rounded-full p-0.5 bg-gradient-to-br from-[#dfb76c] via-[#c5a869] to-[#9d7e35] shadow-md flex-shrink-0 border border-[#8a5a00]/50">
                  <img
                    src="/favicon.svg"
                    alt={`${storeName} Logo`}
                    className="w-full h-full rounded-full object-contain bg-[#08090d]"
                  />
                </div>
                <div className="text-left">
                  <div className="text-3xl print:text-2xl font-serif font-black tracking-tight text-slate-950 leading-none flex items-baseline">
                    <span className="text-[#996515] font-serif italic tracking-tighter text-4xl print:text-3xl">
                      {storeName.charAt(0)}
                    </span>
                    <span className="tracking-wide">{storeName.slice(1)}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                    <span className="text-[10px] tracking-widest text-[#7a5410] uppercase font-mono font-bold px-2 py-0.5 border border-[#c5a869] bg-[#fefaf0] rounded">
                      GENEVE • MAROC
                    </span>
                    <span className="text-[10px] uppercase font-mono tracking-wider text-slate-600">
                      LUXURY TIMEPIECES
                    </span>
                  </div>
                </div>
              </div>

              {/* Certificate Serial & Dates */}
              <div className="text-right space-y-1 border-t sm:border-t-0 print:border-t-0 pt-3 sm:pt-0 print:pt-0 border-amber-200/70">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#11131a] text-[#e5c985] text-[10px] font-bold">
                  <Award className="w-3 h-3" />
                  <span>شهادة ضمان رسمية</span>
                </div>
                <h1 className="text-xl sm:text-2xl print:text-xl font-black text-slate-950 leading-tight">
                  شهادة ضمان المنتج الرسمية
                </h1>
                <div className="text-xs font-mono text-slate-700">
                  رقم الشهادة:{' '}
                  <strong className="text-slate-950 font-black" dir="ltr">
                    {certificateSerial}
                  </strong>
                </div>
              </div>
            </div>

            {/* 2. Golden Guarantee Banner */}
            <div className="relative rounded-xl bg-gradient-to-r from-[#11131a] via-[#1b1f2b] to-[#11131a] text-white p-3.5 sm:px-5 print:p-3 flex flex-col sm:flex-row print:flex-row sm:items-center print:items-center justify-between gap-2 border border-[#c5a869]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 print:w-8 print:h-8 rounded-full bg-[#c5a869]/20 border border-[#c5a869] flex items-center justify-center text-[#e5c985] flex-shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm sm:text-base print:text-sm font-black text-[#f3d999]">
                    ضمان شامل لمدة سنة كاملة (12 شهراً) ضد أي عطب مصنعي
                  </div>
                  <p className="text-[11px] text-gray-300">
                    تضمن {storeName} المنتج وجودة المحرك والتصنيع وفق أعلى المعايير
                  </p>
                </div>
              </div>
              <div className="bg-[#c5a869] text-black px-3 py-1.5 rounded-lg font-black text-xs self-start sm:self-auto print:self-auto flex-shrink-0">
                ضمان لمدة عام واحد
              </div>
            </div>

            {/* 3. Customer & Coverage Dates Grid */}
            <div className="relative grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-3.5 print:gap-2 text-xs print:text-[11px]">
              {/* Customer / Beneficiary Card */}
              <div className="rounded-xl border border-[#c5a869]/60 bg-white/90 p-3.5 print:p-2.5 space-y-1.5 print:space-y-1">
                <div className="text-[11px] font-extrabold text-[#8a5a00] uppercase border-b border-amber-100 pb-1">
                  بيانات المستفيد من الضمان (الزبون)
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">الاسم الكامل:</span>
                  <span className="font-black text-slate-950">{order.customerName}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">رقم الهاتف:</span>
                  <span className="font-mono font-bold text-slate-900" dir="ltr">
                    {order.phone}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">المدينة:</span>
                  <span className="font-bold text-slate-900">{normalizeMoroccanCityName(order.city)}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">رقم الطلب المرجعي:</span>
                  <span className="font-mono font-black text-slate-950" dir="ltr">
                    {order.orderNumber}
                  </span>
                </div>
              </div>

              {/* Warranty Validity & Store Details Card */}
              <div className="rounded-xl border border-[#c5a869]/60 bg-white/90 p-3.5 print:p-2.5 space-y-1.5 print:space-y-1">
                <div className="text-[11px] font-extrabold text-[#8a5a00] uppercase border-b border-amber-100 pb-1">
                  فترة الصلاحية وجهة الإصدار
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">تاريخ الإصدار / الشراء:</span>
                  <span className="font-bold text-slate-950">{issueDateFormatted}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">تاريخ انتهاء الضمان:</span>
                  <span className="font-black text-emerald-700">{expiryDateFormatted}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">مدة التغطية:</span>
                  <span className="font-black text-[#8a5a00]">سنة كاملة (365 يوماً)</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">خدمة ما بعد البيع:</span>
                  <span className="font-mono font-bold text-slate-900" dir="ltr">
                    {settings?.contactPhone || settings?.whatsappNumber || '+212 6 12 34 56 78'}
                  </span>
                </div>
              </div>
            </div>

            {/* 4. Covered Products Table */}
            <div className="relative overflow-hidden rounded-xl border border-[#c5a869]">
              <table className="w-full text-xs print:text-[11px] text-right border-collapse">
                <thead>
                  <tr className="bg-[#f7f0dc] text-slate-900 border-b border-[#c5a869]">
                    <th className="p-2.5 print:p-1.5 border-l border-[#c5a869]/50 font-extrabold">
                      المنتج المشمول بالضمان
                    </th>
                    <th className="p-2.5 print:p-1.5 border-l border-[#c5a869]/50 font-extrabold">اللون</th>
                    <th className="p-2.5 print:p-1.5 border-l border-[#c5a869]/50 text-center font-extrabold">
                      الكمية
                    </th>
                    <th className="p-2.5 print:p-1.5 border-l border-[#c5a869]/50 text-center font-extrabold">
                      نوع التغطية
                    </th>
                    <th className="p-2.5 print:p-1.5 text-center font-extrabold">القيمة</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {order.items.map((it, idx) => (
                    <tr key={idx} className="border-b border-amber-100 last:border-b-0">
                      <td className="p-2.5 print:p-1.5 border-l border-amber-100 font-bold text-slate-950">
                        {it.name}
                      </td>
                      <td className="p-2.5 print:p-1.5 border-l border-amber-100 text-slate-700">
                        {formattedColors(it)}
                      </td>
                      <td className="p-2.5 print:p-1.5 border-l border-amber-100 text-center font-mono font-black">
                        {it.quantity}
                      </td>
                      <td className="p-2.5 print:p-1.5 border-l border-amber-100 text-center">
                        <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-[10px]">
                          سنة كاملة (عطب مصنعي)
                        </span>
                      </td>
                      <td className="p-2.5 print:p-1.5 text-center font-mono font-bold text-slate-900" dir="ltr">
                        {it.price * it.quantity} MAD
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-[#faf6ea] border-t border-[#c5a869]">
                    <td colSpan={4} className="p-2.5 print:p-1.5 font-extrabold text-slate-800">
                      الإجمالي المؤدى (شامل التوصيل والضمان الرسمي):
                    </td>
                    <td className="p-2.5 print:p-1.5 text-center font-mono font-black text-sm print:text-xs text-slate-950" dir="ltr">
                      {order.totalAmount} MAD
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* 5. Official Warranty Clauses */}
            <div className="relative rounded-xl bg-amber-50/50 border border-[#c5a869]/50 p-3.5 print:p-2.5 space-y-1.5 print:space-y-1 text-[11px] print:text-[10.5px] text-slate-700 leading-relaxed print:leading-snug">
              <div className="font-black text-slate-950 text-xs flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#996515]" />
                <span>شروط وبنود الضمان المعتمد (سنة كاملة ضد أي عطب مصنعي):</span>
              </div>
              <ul className="list-disc pr-5 space-y-1 print:space-y-0.5">
                <li>
                  يلتزم متجر <strong>{storeName}</strong> بضمان المنتج لمدة{' '}
                  <strong>سنة كاملة (12 شهراً)</strong> من تاريخ الشراء ضد أي خلل أو عطب مصنعي في المحرك، العقارب، أو نظام التشغيل.
                </li>
                <li>
                  في حال ثبوت أي عطب مصنعي خلال فترة الضمان، يتم إصلاح القطعة أو استبدالها بالكامل مجاناً دون أي مصاريف إضافية على الزبون.
                </li>
                <li>
                  لا يشمل الضمان الأعطاب الناتجة عن الكسر، الصدمات القوية، الخدوش الخارجية للسوار أو الزجاج، أو سوء الاستخدام وتجاوز مقاومة الماء المسموحة.
                </li>
                <li>
                  تُعتبر هذه الوثيقة سارية المفعول رسمياً برقم الطلبية ورمز التحقق الرقمي (QR Code) المدون أدناه.
                </li>
              </ul>
            </div>

            {/* 6. Bottom Authenticity Block: Real Unique QR Code + Gold Seal + Authorized Signature */}
            <div className="relative grid grid-cols-1 sm:grid-cols-3 print:grid-cols-3 items-center gap-4 print:gap-2.5 pt-3 print:pt-2.5 border-t-2 border-[#c5a869]/50">
              {/* Real Unique QR Code */}
              <div className="flex items-center gap-3 print:gap-2 bg-white border border-[#c5a869]/70 rounded-xl p-2.5 print:p-2 shadow-xs">
                <div className="w-24 h-24 print:w-20 print:h-20 rounded-lg border border-slate-200 bg-white flex items-center justify-center flex-shrink-0 overflow-hidden p-1">
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt={`QR Code للتحقق من ضمان الطلب ${order.orderNumber}`}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <span className="text-[10px] text-slate-400 font-mono">QR...</span>
                  )}
                </div>
                <div className="space-y-1 text-[10px]">
                  <span className="font-black text-slate-950 block text-[11px]">
                    رمز التحقق الحقيقي (QR)
                  </span>
                  <p className="text-slate-600 leading-snug">
                    امسح الرمز بكاميرا هاتفك للتحقق المباشر من أصالة وصلاحية شهادة الضمان.
                  </p>
                  <span className="inline-block font-mono font-bold text-[#8a5a00] bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200" dir="ltr">
                    {order.orderNumber}
                  </span>
                </div>
              </div>

              {/* Official Embossed Gold Warranty Seal */}
              <div className="flex flex-col items-center justify-center text-center">
                <svg
                  viewBox="0 0 120 120"
                  className="w-24 h-24 print:w-20 print:h-20 drop-shadow-sm"
                  aria-label="الختم الرسمي للضمان"
                >
                  <defs>
                    <linearGradient id="sealGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#f3d999" />
                      <stop offset="50%" stopColor="#c5a869" />
                      <stop offset="100%" stopColor="#8a5a00" />
                    </linearGradient>
                  </defs>
                  <circle
                    cx="60"
                    cy="60"
                    r="54"
                    fill="#fffdf5"
                    stroke="url(#sealGoldGrad)"
                    strokeWidth="3"
                    strokeDasharray="4 2"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="46"
                    fill="none"
                    stroke="url(#sealGoldGrad)"
                    strokeWidth="1.5"
                  />
                  <circle cx="60" cy="60" r="35" fill="#11131a" />
                  <text
                    x="60"
                    y="52"
                    textAnchor="middle"
                    fill="#f3d999"
                    fontSize="11"
                    fontWeight="bold"
                    fontFamily="serif"
                  >
                    1 YEAR
                  </text>
                  <text
                    x="60"
                    y="66"
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="8.5"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    WARRANTY
                  </text>
                  <text
                    x="60"
                    y="79"
                    textAnchor="middle"
                    fill="#c5a869"
                    fontSize="7"
                    fontWeight="bold"
                  >
                    CERTIFIED
                  </text>
                </svg>
                <span className="text-[10px] font-extrabold text-[#7a5410] mt-1">
                  ختم الجودة والضمان المعتمد
                </span>
              </div>

              {/* Official Signature Block */}
              <div className="flex flex-col items-center justify-center text-center bg-white/80 border border-[#c5a869]/40 rounded-xl p-3 print:p-2">
                <span className="text-[10px] font-bold text-slate-500 mb-1 print:mb-0.5">
                  التوقيع المعتمد لإدارة المتجر
                </span>
                {/* Crisp Calligraphic Vector Signature */}
                <svg
                  viewBox="0 0 220 70"
                  className="w-40 h-14 print:w-36 print:h-11 text-slate-900"
                  aria-label="التوقيع الرسمي لمتجر Noblewatch"
                >
                  <path
                    d="M18 52 C26 22, 34 12, 38 46 C42 26, 55 15, 62 42 C66 28, 78 24, 86 38 C95 48, 108 18, 118 36 C125 46, 138 22, 148 34 C156 42, 174 28, 198 30"
                    fill="none"
                    stroke="#0f172a"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M28 56 Q 110 44, 196 49"
                    fill="none"
                    stroke="#996515"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                  <path
                    d="M142 18 L152 14"
                    fill="none"
                    stroke="#996515"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="w-full border-t border-slate-300 pt-1.5 mt-0.5 text-[10px] font-bold text-slate-800">
                  المدير العام وقسم الجودة — {storeName}
                </div>
                <span className="text-[9px] text-slate-500 font-mono" dir="ltr">
                  {settings?.city || 'Casablanca, Maroc'} • {settings?.contactEmail || 'contact@noblewatch.ma'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons Bar (Hidden during print) */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-4 mt-2 border-t border-amber-200/70 print:hidden">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleSendWhatsAppWarranty}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow cursor-pointer transition"
            >
              <MessageCircle className="w-4 h-4" />
              <span>إرسال رابط الشهادة للزبون عبر واتساب</span>
            </button>

            <button
              type="button"
              onClick={handleCopyVerificationLink}
              className="px-3.5 py-2.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-[#7a5410] border border-[#c5a869]/50 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-700" /> : <Copy className="w-4 h-4" />}
              <span>{copiedLink ? 'تم نسخ رابط التحقق' : 'نسخ رابط التحقق'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-5 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-[#f3d999] font-extrabold text-xs flex items-center gap-2 shadow-md cursor-pointer transition"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة / حفظ كـ PDF (Ctrl + P)</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold cursor-pointer transition"
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(modalContent, document.body);
};
