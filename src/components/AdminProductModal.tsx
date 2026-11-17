import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Sparkles,
  Plus,
  Trash2,
  Palette,
  Eye,
  Loader2,
  Save,
  AlertTriangle,
} from 'lucide-react';
import { Product } from '../types';
import { calculateTierOffers, formatPrice } from '../utils/constants';
import { ImageUploader } from './ImageUploader';
import { VideoUploader } from './VideoUploader';

interface AdminProductModalProps {
  product: Partial<Product>;
  onClose: () => void;
  onSave: (payload: Partial<Product>, existingId?: string) => Promise<{ ok: boolean; message?: string }>;
}

const CATEGORY_OPTIONS = [
  { value: 'men', label: 'ساعات رجالية' },
  { value: 'women', label: 'ساعات نسائية' },
  { value: 'men-accessories', label: 'إكسسوارات رجالية' },
  { value: 'women-accessories', label: 'إكسسوارات نسائية' },
  { value: 'luxury', label: 'تشكيلة فاخرة (Luxury)' },
];

function buildInitialForm(p: Partial<Product>): Partial<Product> {
  const baseCategory = String(p.category || 'men').trim() || 'men';
  return {
    ...p,
    category: baseCategory,
    categories: Array.isArray(p.categories) && p.categories.length > 0 ? [...p.categories] : [baseCategory],
    images: Array.isArray(p.images) ? [...p.images] : [],
    colors: Array.isArray(p.colors) ? p.colors.map((c) => ({ ...c })) : [],
    videos: Array.isArray(p.videos) ? p.videos.map((v) => ({ ...v })) : [],
    features: Array.isArray(p.features) ? [...p.features] : [],
    specs: {
      brand: 'Noblewatch',
      model: '',
      movement: '',
      caseMaterial: '',
      strapMaterial: '',
      dialColor: '',
      caseDiameter: '',
      caseThickness: '',
      glass: '',
      clasp: '',
      waterResistance: '',
      warranty: 'ضمان رسمي لمدة سنة كاملة',
      ...(p.specs || {}),
    },
    tieredPricing: {
      enabled: p.tieredPricing?.enabled !== false,
      mode: p.tieredPricing?.mode || 'auto',
      twoPiecesDiscountPercent: p.tieredPricing?.twoPiecesDiscountPercent ?? 16,
      threePiecesDiscountPercent: p.tieredPricing?.threePiecesDiscountPercent ?? 24,
      twoPiecesPrice: p.tieredPricing?.twoPiecesPrice,
      threePiecesPrice: p.tieredPricing?.threePiecesPrice,
      twoPiecesBadge: p.tieredPricing?.twoPiecesBadge || 'الأكثر طلباً ⭐',
      threePiecesBadge: p.tieredPricing?.threePiecesBadge || 'أفضل توفير 🔥',
    },
  };
}

export const AdminProductModal: React.FC<AdminProductModalProps> = React.memo(
  ({ product, onClose, onSave }) => {
    const [form, setForm] = useState<Partial<Product>>(() => buildInitialForm(product));
    const [newColorName, setNewColorName] = useState('');
    const [newColorCode, setNewColorCode] = useState('#111111');
    const [newColorImageIndex, setNewColorImageIndex] = useState(0);
    const [newFeatureText, setNewFeatureText] = useState('');
    const [isVideoUploading, setIsVideoUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    useEffect(() => {
      setForm(buildInitialForm(product));
      setNewColorName('');
      setNewColorCode('#111111');
      setNewColorImageIndex(0);
      setNewFeatureText('');
      setFormError(null);
    }, [product]);

    const scrollToSection = (sectionId?: string) => {
      if (sectionId) {
        const el = document.getElementById(sectionId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
          return;
        }
      }
      const container = document.getElementById('admin-product-modal-scroll');
      if (container) container.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = async (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      if (isSaving) return;

      if (isVideoUploading) {
        setFormError('يرجى الانتظار بضع ثوانٍ حتى يكتمل رفع الفيديو أولاً.');
        scrollToSection();
        return;
      }

      const trimmedName = String(form.name || '').trim();
      if (!trimmedName) {
        setFormError('يرجى إدخال اسم الساعة الكامل أولاً.');
        scrollToSection();
        return;
      }

      const numericPrice = Number(form.price);
      if (form.price === ('' as any) || !Number.isFinite(numericPrice) || numericPrice <= 0) {
        setFormError('يرجى إدخال سعر بيع صحيح أكبر من 0.');
        scrollToSection();
        return;
      }

      const numericStock =
        form.stock !== undefined && form.stock !== null && form.stock !== ('' as any)
          ? Number(form.stock)
          : 10;
      if (!Number.isFinite(numericStock) || numericStock < 0) {
        setFormError('يرجى إدخال كمية مخزون صحيحة (0 أو أكثر).');
        scrollToSection();
        return;
      }

      const rawOrig =
        form.originalPrice !== undefined && form.originalPrice !== null && form.originalPrice !== ('' as any)
          ? Number(form.originalPrice)
          : numericPrice;
      const validOrig = Number.isFinite(rawOrig) && rawOrig >= 0 ? rawOrig : numericPrice;

      setFormError(null);
      setIsSaving(true);
      try {
        const primaryCat = String(form.category || 'men').trim() || 'men';
        const payload: Partial<Product> = {
          ...form,
          name: trimmedName,
          sku: String(form.sku || '').trim() || `NW-${Math.floor(100 + Math.random() * 900)}`,
          category: primaryCat,
          categories:
            Array.isArray(form.categories) && form.categories.length > 0
              ? Array.from(new Set([primaryCat, ...form.categories.filter(Boolean)]))
              : [primaryCat],
          price: numericPrice,
          originalPrice: validOrig,
          stock: Math.floor(numericStock),
          images: Array.isArray(form.images) ? form.images.filter(Boolean) : [],
          colors: Array.isArray(form.colors) ? form.colors : [],
          videos: Array.isArray(form.videos) ? form.videos : [],
          features: Array.isArray(form.features)
            ? form.features.map((f) => String(f || '').trim()).filter(Boolean)
            : [],
          tieredPricing: {
            enabled: form.tieredPricing?.enabled !== false,
            mode: form.tieredPricing?.mode || 'auto',
            twoPiecesDiscountPercent:
              form.tieredPricing?.twoPiecesDiscountPercent !== undefined &&
              form.tieredPricing?.twoPiecesDiscountPercent !== ('' as any)
                ? Number(form.tieredPricing.twoPiecesDiscountPercent)
                : 16,
            threePiecesDiscountPercent:
              form.tieredPricing?.threePiecesDiscountPercent !== undefined &&
              form.tieredPricing?.threePiecesDiscountPercent !== ('' as any)
                ? Number(form.tieredPricing.threePiecesDiscountPercent)
                : 24,
            twoPiecesPrice:
              form.tieredPricing?.twoPiecesPrice !== undefined &&
              form.tieredPricing?.twoPiecesPrice !== ('' as any)
                ? Number(form.tieredPricing.twoPiecesPrice)
                : undefined,
            threePiecesPrice:
              form.tieredPricing?.threePiecesPrice !== undefined &&
              form.tieredPricing?.threePiecesPrice !== ('' as any)
                ? Number(form.tieredPricing.threePiecesPrice)
                : undefined,
            twoPiecesBadge: form.tieredPricing?.twoPiecesBadge?.trim() || 'الأكثر طلباً ⭐',
            threePiecesBadge: form.tieredPricing?.threePiecesBadge?.trim() || 'أفضل توفير 🔥',
          },
        };

        const result = await onSave(payload, form.id);
        if (result.ok) {
          onClose();
        } else {
          setFormError(result.message || 'تعذر حفظ التعديلات، يرجى المحاولة مرة أخرى.');
          scrollToSection();
        }
      } catch {
        setFormError('حدث خطأ غير متوقع أثناء الحفظ، يرجى المحاولة مرة أخرى.');
        scrollToSection();
      } finally {
        setIsSaving(false);
      }
    };

    const currentCat = form.category || 'men';
    const hasKnownCategory = CATEGORY_OPTIONS.some((opt) => opt.value === currentCat);

    const modalContent = (
      <div
        id="admin-product-modal-scroll"
        dir="rtl"
        className="fixed inset-0 z-[80] flex items-start justify-center p-3 sm:p-6 bg-black/85 overflow-y-auto text-right"
      >
        <div className="relative w-full max-w-3xl rounded-3xl bg-[#141720] border border-white/10 p-5 sm:p-8 space-y-6 text-right my-3 sm:my-6 shadow-2xl">
          {/* Sticky Top Bar with Header, Save & Quick Actions */}
          <div className="sticky top-0 z-30 bg-[#141720] -mx-5 -mt-5 px-5 pt-5 pb-3 sm:-mx-8 sm:-mt-8 sm:px-8 sm:pt-6 border-b border-white/10 space-y-3 shadow-lg rounded-t-3xl">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#c5a869]" />
                  <span>{form.id ? 'تعديل بيانات ومواصفات المنتج' : 'إضافة ساعة يد أو إكسسوار جديد'}</span>
                </h3>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  يمكنك تعديل الاسم، السعر، الصور، الألوان، باقات التوفير، والفيديوهات وحفظها فوراً
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isVideoUploading || isSaving}
                  onClick={() => handleSubmit()}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl gold-gradient-bg text-black font-extrabold text-xs shadow hover:brightness-110 active:scale-95 transition cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>{isSaving ? 'جاري الحفظ...' : 'حفظ سريع'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => scrollToSection()}
                  className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-amber-300 border border-white/10 text-xs font-bold transition cursor-pointer"
                  title="الرجوع إلى أعلى النموذج لتعديل الاسم والسعر"
                >
                  <span>⬆️</span>
                  <span>الأعلى</span>
                </button>

                <button
                  type="button"
                  disabled={isSaving}
                  onClick={onClose}
                  className="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition cursor-pointer disabled:opacity-50"
                  title="إغلاق"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-200 text-xs font-bold flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFormError(null)}
                  className="p-1 rounded hover:bg-white/10 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Quick Section Jump Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] text-gray-400 border-t border-white/5 pt-2">
              <span className="text-gray-500 font-semibold whitespace-nowrap ml-1">الانتقال السريع:</span>
              <button
                type="button"
                onClick={() => scrollToSection('prod-basic-info')}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-[#c5a869]/20 hover:text-amber-300 text-gray-300 font-bold transition cursor-pointer whitespace-nowrap"
              >
                📝 الاسم والسعر
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('prod-bundles-section')}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-[#c5a869]/20 hover:text-amber-300 text-gray-300 font-bold transition cursor-pointer whitespace-nowrap"
              >
                🎁 باقات التوفير
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('prod-photos-section')}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-[#c5a869]/20 hover:text-amber-300 text-gray-300 font-bold transition cursor-pointer whitespace-nowrap"
              >
                🖼️ الصور
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('prod-colors-section')}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-[#c5a869]/20 hover:text-amber-300 text-gray-300 font-bold transition cursor-pointer whitespace-nowrap"
              >
                🎨 الألوان
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('prod-video-section')}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-[#c5a869]/20 hover:text-amber-300 text-gray-300 font-bold transition cursor-pointer whitespace-nowrap"
              >
                🎥 الفيديوهات
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('prod-features-section')}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-[#c5a869]/20 hover:text-amber-300 text-gray-300 font-bold transition cursor-pointer whitespace-nowrap"
              >
                ✨ المميزات الحصرية
              </button>
            </div>
          </div>

          <form noValidate onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div id="prod-basic-info" className="grid grid-cols-1 sm:grid-cols-2 gap-4 scroll-mt-28">
              <div>
                <label className="block text-gray-300 font-semibold mb-1">اسم الساعة الكامل *</label>
                <input
                  type="text"
                  placeholder="مثال: ساعة رويال كرونوغراف أسود وذهبي"
                  value={form.name || ''}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-[#1b1f2b] border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#c5a869]"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">رمز الموديل (SKU)</label>
                <input
                  type="text"
                  placeholder="مثال: NW-105 (أو اتركه فارغاً)"
                  value={form.sku || ''}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                  className="w-full bg-[#1b1f2b] border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#c5a869] text-left"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">السعر الحالي بالدرهم (MAD) *</label>
                <input
                  type="number"
                  placeholder="مثال: 349"
                  value={form.price !== undefined && form.price !== null ? form.price : ''}
                  onChange={(e) =>
                    setForm({ ...form, price: e.target.value === '' ? ('' as any) : Number(e.target.value) })
                  }
                  className="w-full bg-[#1b1f2b] border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#c5a869]"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">السعر قبل التخفيض (MAD)</label>
                <input
                  type="number"
                  placeholder="مثال: 499 (اختياري)"
                  value={form.originalPrice !== undefined && form.originalPrice !== null ? form.originalPrice : ''}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      originalPrice: e.target.value === '' ? ('' as any) : Number(e.target.value),
                    })
                  }
                  className="w-full bg-[#1b1f2b] border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#c5a869]"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">الكمية المتوفرة فالمخزون *</label>
                <input
                  type="number"
                  placeholder="مثال: 15"
                  value={form.stock !== undefined && form.stock !== null ? form.stock : ''}
                  onChange={(e) =>
                    setForm({ ...form, stock: e.target.value === '' ? ('' as any) : Number(e.target.value) })
                  }
                  className="w-full bg-[#1b1f2b] border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#c5a869]"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">التصنيف الأساسي</label>
                <select
                  value={currentCat}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value, categories: [e.target.value] })
                  }
                  className="w-full bg-[#1b1f2b] border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#c5a869]"
                >
                  {CATEGORY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                  {!hasKnownCategory && <option value={currentCat}>{currentCat}</option>}
                </select>
              </div>

              {/* ================= COMPREHENSIVE TIERED BUNDLE CONTROL PANEL ================= */}
              <div
                id="prod-bundles-section"
                className="sm:col-span-2 p-4 sm:p-5 rounded-2xl bg-[#1b1f2b] border border-white/10 space-y-4 scroll-mt-28"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-[#c5a869]/20 border border-[#c5a869]/40 flex items-center justify-center text-[#c5a869]">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <span>عروض باقات التوفير (اشتري 1، 2، 3 بتمن لزيادة المبيعات)</span>
                      </h4>
                      <p className="text-[11px] text-gray-400">
                        ميزة مضاعفة المبيعات: تتيح للزبون شراء قطعتين أو 3 قطع بأسعار تشجيعية وتوفير فوري
                      </p>
                    </div>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer select-none bg-[#141720] border border-white/10 px-3 py-1.5 rounded-xl hover:border-white/20">
                    <input
                      type="checkbox"
                      checked={form.tieredPricing?.enabled !== false}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          tieredPricing: {
                            ...form.tieredPricing,
                            enabled: e.target.checked,
                          },
                        })
                      }
                      className="w-4 h-4 rounded text-[#c5a869] focus:ring-[#c5a869] bg-transparent"
                    />
                    <span
                      className={`text-xs font-bold ${
                        form.tieredPricing?.enabled !== false ? 'text-amber-400' : 'text-gray-400'
                      }`}
                    >
                      {form.tieredPricing?.enabled !== false ? 'العروض مُفعلة 🚀' : 'معطلة (بيع فردي فقط)'}
                    </span>
                  </label>
                </div>

                {form.tieredPricing?.enabled !== false ? (
                  <div className="space-y-4 pt-1">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="text-xs font-semibold text-gray-300">
                        طريقة تحديد وتطبيق التخفيضات:
                      </span>
                      <div className="flex items-center bg-[#141720] p-1 rounded-xl border border-white/10 text-xs">
                        <button
                          type="button"
                          onClick={() =>
                            setForm({
                              ...form,
                              tieredPricing: {
                                ...form.tieredPricing,
                                mode: 'auto',
                              },
                            })
                          }
                          className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                            (form.tieredPricing?.mode || 'auto') === 'auto'
                              ? 'bg-[#c5a869] text-black shadow-xs font-black'
                              : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          ⚡ حساب تلقائي بالنسبة (%)
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setForm({
                              ...form,
                              tieredPricing: {
                                ...form.tieredPricing,
                                mode: 'custom',
                              },
                            })
                          }
                          className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                            form.tieredPricing?.mode === 'custom'
                              ? 'bg-[#c5a869] text-black shadow-xs font-black'
                              : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          ✍️ أسعار محددة بالدرهم (MAD)
                        </button>
                      </div>
                    </div>

                    {(form.tieredPricing?.mode || 'auto') === 'auto' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-[#141720] border border-white/5">
                        <div>
                          <label className="block text-gray-300 text-xs font-semibold mb-1">
                            نسبة تخفيض باقة قطعتين (%)
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              min="1"
                              max="70"
                              placeholder="16"
                              value={form.tieredPricing?.twoPiecesDiscountPercent ?? 16}
                              onChange={(e) =>
                                setForm({
                                  ...form,
                                  tieredPricing: {
                                    ...form.tieredPricing,
                                    twoPiecesDiscountPercent:
                                      e.target.value === '' ? ('' as any) : Number(e.target.value),
                                  },
                                })
                              }
                              className="w-full bg-[#1b1f2b] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#c5a869] pl-8"
                            />
                            <span className="absolute left-3 top-2.5 text-xs text-gray-400 font-bold">%</span>
                          </div>
                        </div>

                        <div>
                          <label className="block text-gray-300 text-xs font-semibold mb-1">
                            نسبة تخفيض باقة 3 قطع (%)
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              min="1"
                              max="80"
                              placeholder="24"
                              value={form.tieredPricing?.threePiecesDiscountPercent ?? 24}
                              onChange={(e) =>
                                setForm({
                                  ...form,
                                  tieredPricing: {
                                    ...form.tieredPricing,
                                    threePiecesDiscountPercent:
                                      e.target.value === '' ? ('' as any) : Number(e.target.value),
                                  },
                                })
                              }
                              className="w-full bg-[#1b1f2b] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#c5a869] pl-8"
                            />
                            <span className="absolute left-3 top-2.5 text-xs text-gray-400 font-bold">%</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {form.tieredPricing?.mode === 'custom' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-[#141720] border border-white/5">
                        <div>
                          <label className="block text-gray-300 text-xs font-semibold mb-1">
                            سعر باقة قطعتين الإجمالي (MAD) *
                          </label>
                          <input
                            type="number"
                            placeholder="مثال: 499"
                            value={form.tieredPricing?.twoPiecesPrice ?? ''}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                tieredPricing: {
                                  ...form.tieredPricing,
                                  twoPiecesPrice: e.target.value === '' ? undefined : Number(e.target.value),
                                },
                              })
                            }
                            className="w-full bg-[#1b1f2b] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#c5a869]"
                          />
                        </div>

                        <div>
                          <label className="block text-gray-300 text-xs font-semibold mb-1">
                            سعر باقة 3 قطع الإجمالي (MAD) *
                          </label>
                          <input
                            type="number"
                            placeholder="مثال: 689"
                            value={form.tieredPricing?.threePiecesPrice ?? ''}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                tieredPricing: {
                                  ...form.tieredPricing,
                                  threePiecesPrice: e.target.value === '' ? undefined : Number(e.target.value),
                                },
                              })
                            }
                            className="w-full bg-[#1b1f2b] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#c5a869]"
                          />
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-gray-400 text-[11px] mb-1">نص شارة باقة قطعتين</label>
                        <input
                          type="text"
                          placeholder="الأكثر طلباً ⭐"
                          value={form.tieredPricing?.twoPiecesBadge || 'الأكثر طلباً ⭐'}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              tieredPricing: {
                                ...form.tieredPricing,
                                twoPiecesBadge: e.target.value,
                              },
                            })
                          }
                          className="w-full bg-[#141720] border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-[#c5a869]"
                        />
                      </div>

                      <div>
                        <label className="block text-gray-400 text-[11px] mb-1">نص شارة باقة 3 قطع</label>
                        <input
                          type="text"
                          placeholder="أفضل توفير 🔥"
                          value={form.tieredPricing?.threePiecesBadge || 'أفضل توفير 🔥'}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              tieredPricing: {
                                ...form.tieredPricing,
                                threePiecesBadge: e.target.value,
                              },
                            })
                          }
                          className="w-full bg-[#141720] border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-[#c5a869]"
                        />
                      </div>
                    </div>

                    {(() => {
                      const previewOffers = calculateTierOffers(form as any);
                      return (
                        <div className="p-3.5 rounded-xl bg-[#141720] border border-white/10 space-y-2">
                          <div className="flex items-center justify-between text-xs text-gray-300">
                            <span className="font-bold flex items-center gap-1.5 text-amber-400">
                              <Eye className="w-3.5 h-3.5" />
                              <span>معاينة حية لشكل الباقات للمشتري في المتجر:</span>
                            </span>
                            <span className="text-[10px] text-gray-400">
                              السعر الفردي: {formatPrice(Number(form.price) || 0)}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {previewOffers.map((t) => (
                              <div
                                key={t.quantity}
                                className="p-2.5 rounded-xl bg-[#1b1f2b] border border-white/10 text-right space-y-1"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-white">{t.label}</span>
                                  {t.badge && (
                                    <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-[#c5a869] text-black">
                                      {t.badge}
                                    </span>
                                  )}
                                </div>
                                <div className="text-sm font-black text-amber-400">{formatPrice(t.totalPrice)}</div>
                                <div className="text-[10px] text-gray-400 flex items-center justify-between">
                                  <span>({formatPrice(t.unitPrice)}/قطعة)</span>
                                  {t.savingsMAD > 0 && (
                                    <span className="text-emerald-400 font-bold">وفر {formatPrice(t.savingsMAD)}</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-[#141720] border border-white/5 text-center text-xs text-gray-400">
                    عروض الباقات معطلة لهذا المنتج حالياً ({formatPrice(Number(form.price) || 0)}).
                  </div>
                )}
              </div>

              <div id="prod-photos-section" className="sm:col-span-2 scroll-mt-28">
                <ImageUploader
                  images={form.images || []}
                  onChange={(newImages) => setForm({ ...form, images: newImages })}
                  maxImages={8}
                  label="صور الساعة (تحميل مباشر من الحاسوب أو الهاتف)"
                  helperText="اختر صور الساعة من حاسوبك. يمكنك رفع عدة صور في نفس الوقت وتحديد الصورة الرئيسية للساعة بنقرة واحدة."
                />
              </div>

              {/* الألوان المتوفرة للمنتج */}
              <div
                id="prod-colors-section"
                className="sm:col-span-2 rounded-2xl bg-[#161a25] border border-white/10 p-4 sm:p-5 space-y-4 scroll-mt-28"
              >
                <div className="border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2 text-white font-bold text-sm">
                    <Palette className="w-4 h-4 text-[#c5a869]" />
                    <span>الألوان المتوفرة لهذا الموديل</span>
                    <span className="text-xs font-normal text-[#c5a869] bg-[#c5a869]/15 border border-[#c5a869]/30 px-2 py-0.5 rounded-full">
                      {(form.colors || []).length} ألوان
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    أدخل اسم كل لون ودرجته واربطه بالصورة المخصصة له ليتمكن الزبون من اختياره عند الشراء.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-3 rounded-xl bg-black/30 border border-white/5 items-end">
                  <div className="sm:col-span-5">
                    <label className="block text-xs font-semibold text-gray-300 mb-1">اسم اللون (بالعربية)</label>
                    <input
                      type="text"
                      value={newColorName}
                      onChange={(e) => setNewColorName(e.target.value)}
                      placeholder="مثال: أسود كربوني، ذهبي عيار 18..."
                      className="w-full bg-[#1b1f2b] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#c5a869]"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-xs font-semibold text-gray-300 mb-1">درجة اللون</label>
                    <div className="flex items-center gap-2 bg-[#1b1f2b] border border-white/10 rounded-xl px-2.5 py-1.5">
                      <input
                        type="color"
                        value={newColorCode}
                        onChange={(e) => setNewColorCode(e.target.value)}
                        className="w-7 h-7 rounded-lg border-0 bg-transparent cursor-pointer p-0"
                      />
                      <span className="text-xs font-mono text-gray-300 uppercase">{newColorCode}</span>
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-300 mb-1">الصورة المرتبطة</label>
                    <select
                      value={newColorImageIndex}
                      onChange={(e) => setNewColorImageIndex(Number(e.target.value))}
                      className="w-full bg-[#1b1f2b] border border-white/10 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-[#c5a869]"
                    >
                      {(form.images || []).length > 0 ? (
                        (form.images || []).map((_, imgIdx) => (
                          <option key={imgIdx} value={imgIdx}>
                            الصورة {imgIdx + 1} {imgIdx === 0 ? '(الرئيسية)' : ''}
                          </option>
                        ))
                      ) : (
                        <option value={0}>الصورة 1</option>
                      )}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (!newColorName.trim()) return;
                        setForm({
                          ...form,
                          colors: [
                            ...(form.colors || []),
                            {
                              name: newColorName.trim(),
                              code: newColorCode,
                              accent: '#c5a869',
                              imageIndex: newColorImageIndex,
                            },
                          ],
                        });
                        setNewColorName('');
                      }}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl gold-gradient-bg text-black font-bold text-xs shadow hover:brightness-110 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>إضافة لون</span>
                    </button>
                  </div>
                </div>

                {(form.colors || []).length === 0 ? (
                  <div className="text-center py-4 text-xs text-gray-500 border border-dashed border-white/10 rounded-xl">
                    لم تتم إضافة أي لون بعد.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
                    {(form.colors || []).map((c, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/10 hover:border-[#c5a869]/40 transition group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <label className="relative cursor-pointer flex-shrink-0">
                            <span
                              className="w-6 h-6 rounded-full border border-white/30 block shadow-inner"
                              style={{ backgroundColor: c.code }}
                            />
                            <input
                              type="color"
                              value={c.code}
                              onChange={(e) => {
                                const updated = [...(form.colors || [])];
                                updated[idx] = { ...updated[idx], code: e.target.value };
                                setForm({ ...form, colors: updated });
                              }}
                              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                              title="تغيير درجة اللون"
                            />
                          </label>

                          <div className="min-w-0">
                            <input
                              type="text"
                              value={c.name}
                              onChange={(e) => {
                                const updated = [...(form.colors || [])];
                                updated[idx] = { ...updated[idx], name: e.target.value };
                                setForm({ ...form, colors: updated });
                              }}
                              className="bg-transparent text-xs font-bold text-white border-b border-transparent hover:border-white/20 focus:border-[#c5a869] focus:outline-none w-full"
                              placeholder="اسم اللون"
                            />
                            <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-0.5">
                              <span>مرتبط بـ:</span>
                              <select
                                value={c.imageIndex || 0}
                                onChange={(e) => {
                                  const updated = [...(form.colors || [])];
                                  updated[idx] = { ...updated[idx], imageIndex: Number(e.target.value) };
                                  setForm({ ...form, colors: updated });
                                }}
                                className="bg-[#1b1f2b] text-[10px] text-[#c5a869] rounded px-1.5 py-0.5 border border-white/10 focus:outline-none cursor-pointer"
                              >
                                {(form.images || []).length > 0 ? (
                                  (form.images || []).map((_, imgIdx) => (
                                    <option key={imgIdx} value={imgIdx}>
                                      صورة {imgIdx + 1}
                                    </option>
                                  ))
                                ) : (
                                  <option value={0}>صورة 1</option>
                                )}
                              </select>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            const updated = (form.colors || []).filter((_, i) => i !== idx);
                            setForm({ ...form, colors: updated });
                          }}
                          className="text-gray-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition cursor-pointer flex-shrink-0"
                          title="حذف هذا اللون"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* فيديوهات الساعة والمعاينة الحية */}
              <div
                id="prod-video-section"
                className="sm:col-span-2 rounded-2xl bg-[#161a25] border border-white/10 p-4 sm:p-5 scroll-mt-28"
              >
                <VideoUploader
                  videos={form.videos || []}
                  onChange={(newVideos) => setForm({ ...form, videos: newVideos })}
                  productImages={form.images || []}
                  maxVideos={4}
                  onUploadingChange={setIsVideoUploading}
                />
              </div>

              {/* أهم المميزات الحصرية */}
              <div
                id="prod-features-section"
                className="sm:col-span-2 rounded-2xl bg-[#161a25] border border-white/10 p-4 sm:p-5 space-y-4 scroll-mt-28"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#c5a869]" />
                      <span>أهم المميزات الحصرية (تظهر في صفحة المنتج)</span>
                    </h4>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      يمكنك تعديل نص أي ميزة، إعادة ترتيبها، إضافة ميزات جديدة أو حذفها نهائياً
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] bg-[#c5a869]/20 text-amber-300 border border-[#c5a869]/40 px-2.5 py-1 rounded-full font-bold">
                      {(form.features || []).length} ميزة
                    </span>
                    {(form.features || []).length > 0 && (
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, features: [] })}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 text-[11px] font-bold transition cursor-pointer"
                        title="حذف جميع المميزات"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>حذف الكل</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    placeholder="أضف ميزة حصرية جديدة (مثال: مقاومة للماء 5ATM، علبة فاخرة...)"
                    value={newFeatureText}
                    onChange={(e) => setNewFeatureText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const trimmed = newFeatureText.trim();
                        if (!trimmed) return;
                        setForm({ ...form, features: [...(form.features || []), trimmed] });
                        setNewFeatureText('');
                      }
                    }}
                    className="flex-1 bg-[#1b1f2b] border border-white/10 rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none focus:border-[#c5a869]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const trimmed = newFeatureText.trim();
                      if (!trimmed) return;
                      setForm({ ...form, features: [...(form.features || []), trimmed] });
                      setNewFeatureText('');
                    }}
                    className="px-4 py-2 rounded-xl gold-gradient-bg text-black font-bold text-xs flex items-center justify-center gap-1.5 hover:brightness-110 cursor-pointer whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة ميزة</span>
                  </button>
                </div>

                {(form.features || []).length === 0 ? (
                  <div className="text-center py-4 text-gray-500 text-[11px] bg-[#1b1f2b]/50 rounded-xl border border-dashed border-white/10">
                    لا توجد مميزات مضافة حالياً.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {(form.features || []).map((feat, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 p-2 rounded-xl bg-[#1b1f2b] border border-white/10"
                      >
                        <span className="w-6 h-6 rounded-lg bg-[#c5a869]/15 text-[#c5a869] font-bold text-[11px] flex items-center justify-center flex-shrink-0">
                          {idx + 1}
                        </span>
                        <input
                          type="text"
                          value={feat}
                          onChange={(e) => {
                            const updated = [...(form.features || [])];
                            updated[idx] = e.target.value;
                            setForm({ ...form, features: updated });
                          }}
                          className="flex-1 bg-[#141720] border border-white/10 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-[#c5a869]"
                        />
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => {
                              if (idx === 0) return;
                              const updated = [...(form.features || [])];
                              [updated[idx - 1], updated[idx]] = [updated[idx], updated[idx - 1]];
                              setForm({ ...form, features: updated });
                            }}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 disabled:opacity-30 cursor-pointer text-[10px]"
                            title="تحريك لأعلى"
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            disabled={idx === (form.features || []).length - 1}
                            onClick={() => {
                              const list = [...(form.features || [])];
                              if (idx >= list.length - 1) return;
                              [list[idx], list[idx + 1]] = [list[idx + 1], list[idx]];
                              setForm({ ...form, features: list });
                            }}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 disabled:opacity-30 cursor-pointer text-[10px]"
                            title="تحريك لأسفل"
                          >
                            ▼
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = (form.features || []).filter((_, i) => i !== idx);
                              setForm({ ...form, features: updated });
                            }}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition cursor-pointer"
                            title="حذف هذه الميزة"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-gray-300 font-semibold mb-1">الوصف العام والمميزات</label>
                <textarea
                  rows={3}
                  value={form.description || ''}
                  placeholder="اكتب وصفاً جذاباً للساعة، تفاصيل المينا والسوار والمحرك..."
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full bg-[#1b1f2b] border border-white/10 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-[#c5a869]"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 py-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isPublished !== false}
                  onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
                  className="w-4 h-4 rounded accent-[#c5a869]"
                />
                <span className="text-gray-300 font-semibold">نشر المنتج في المتجر مباشرة</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(form.isSpecialOffer)}
                  onChange={(e) => setForm({ ...form, isSpecialOffer: e.target.checked })}
                  className="w-4 h-4 rounded accent-[#c5a869]"
                />
                <span className="text-gray-300 font-semibold">إضافة إلى قسم العروض الخاصة</span>
              </label>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => scrollToSection()}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-amber-300 border border-white/10 text-xs font-bold transition cursor-pointer"
              >
                <span>⬆️</span>
                <span>الصعود لأعلى النموذج</span>
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl bg-white/5 text-gray-300 hover:bg-white/10 disabled:opacity-50 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isVideoUploading || isSaving}
                  className="px-6 py-2.5 rounded-xl gold-gradient-bg text-black font-extrabold shadow hover:brightness-110 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {(isVideoUploading || isSaving) && <Loader2 className="w-4 h-4 animate-spin text-black" />}
                  <span>
                    {isVideoUploading
                      ? 'جاري رفع الفيديو... يرجى الانتظار'
                      : isSaving
                      ? 'جاري حفظ ونشر المنتج...'
                      : 'حفظ ونشر المنتج'}
                  </span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    );

    if (typeof document !== 'undefined') {
      return createPortal(modalContent, document.body);
    }
    return modalContent;
  }
);
