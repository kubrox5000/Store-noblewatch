import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  UploadCloud,
  Image as ImageIcon,
  Trash2,
  Star,
  Check,
  Loader2,
  Plus,
  Link as LinkIcon,
  AlertCircle,
  Eye,
  Maximize2,
  X,
} from 'lucide-react';

interface ImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
  label?: string;
  helperText?: string;
  allowMultiple?: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = React.memo(({
  images = [],
  onChange,
  maxImages = 8,
  label = 'صور المنتج من الحاسوب',
  helperText = 'يمكنك سحب وإفلات الصور أو اختيار ملفات JPG, PNG, WEBP من جهازك',
  allowMultiple = true,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInputValue, setUrlInputValue] = useState('');
  const [previewModalImage, setPreviewModalImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to compress image client-side to ensure it is lightweight and permanent
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const raw = e.target?.result as string;
        const img = new Image();
        img.onload = () => {
          try {
            const maxWidth = 1200;
            const maxHeight = 1200;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > maxWidth) {
                height = Math.round((height * maxWidth) / width);
                width = maxWidth;
              }
            } else {
              if (height > maxHeight) {
                width = Math.round((width * maxHeight) / height);
                height = maxHeight;
              }
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              const compressed = canvas.toDataURL('image/jpeg', 0.82);
              resolve(compressed);
              return;
            }
          } catch {
            // fallback to raw
          }
          resolve(raw);
        };
        img.onerror = () => resolve(raw);
        img.src = raw;
      };
      reader.onerror = () => resolve('/assets/luxury_watch_hero.jpg');
      reader.readAsDataURL(file);
    });
  };

  // Upload a single file and return compact persistent /uploads/... URL (falling back to compressed dataUrl if offline)
  const uploadFileToServer = async (file: File): Promise<string> => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error('الملف المختار ليس صورة صالحة');
    }

    // Compress client-side to lightweight JPEG (~60-110KB)
    const compressedDataUrl = await compressImage(file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataUrl: compressedDataUrl,
          filename: file.name,
          mimeType: 'image/jpeg',
        }),
      });
      if (res.ok) {
        const data = await res.json().catch(() => null);
        if (data?.success && data?.url) {
          return data.url;
        }
      }
    } catch {
      // Fallback safely to compressed data URL
    }

    return compressedDataUrl;
  };

  // Process chosen or dropped files
  const handleFiles = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    if (files.length === 0) return;

    setUploadError(null);
    setIsUploading(true);

    try {
      const remainingSlots = allowMultiple ? Math.max(0, maxImages - images.length) : 1;
      const filesToUpload = allowMultiple ? files.slice(0, remainingSlots) : [files[0]];

      if (filesToUpload.length === 0) {
        setUploadError(`لقد وصلت للحد الأقصى المسموح (${maxImages} صور)`);
        setIsUploading(false);
        return;
      }

      const uploadPromises = filesToUpload.map((f) => uploadFileToServer(f));
      const uploadedUrls = await Promise.all(uploadPromises);

      if (allowMultiple) {
        onChange([...images, ...uploadedUrls]);
      } else {
        onChange([uploadedUrls[0]]);
      }
    } catch (err: any) {
      setUploadError(err.message || 'حدث خطأ أثناء تحميل الصور من الحاسوب');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Add via URL
  const handleAddUrl = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = urlInputValue.trim();
    if (!trimmed) return;

    if (allowMultiple) {
      if (images.length >= maxImages) {
        setUploadError(`لقد وصلت للحد الأقصى المسموح (${maxImages} صور)`);
        return;
      }
      onChange([...images, trimmed]);
    } else {
      onChange([trimmed]);
    }

    setUrlInputValue('');
    setShowUrlInput(false);
  };

  // Set image as primary (move to index 0)
  const handleSetPrimary = (index: number) => {
    if (index === 0) return;
    const target = images[index];
    const rest = images.filter((_, i) => i !== index);
    onChange([target, ...rest]);
  };

  // Remove image
  const handleRemove = (index: number) => {
    const updated = images.filter((_, i) => i !== index);
    onChange(updated);
  };

  return (
    <div className="space-y-3 text-right">
      <div className="flex items-center justify-between">
        <label className="block text-gray-200 font-bold text-xs flex items-center gap-1.5">
          <UploadCloud className="w-4 h-4 text-[#c5a869]" />
          <span>{label}</span>
          {images.length > 0 && (
            <span className="text-[10px] text-gray-400 font-normal">
              ({images.length} من {maxImages})
            </span>
          )}
        </label>

        <button
          type="button"
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="text-[11px] text-[#c5a869] hover:underline flex items-center gap-1 cursor-pointer"
        >
          <LinkIcon className="w-3 h-3" />
          <span>{showUrlInput ? 'إخفاء خيار الرابط' : 'استخدام رابط URL بدلاً من الحاسوب'}</span>
        </button>
      </div>

      {/* URL Fallback Bar (Optional) */}
      {showUrlInput && (
        <div className="p-3 rounded-xl bg-[#1a1e2a] border border-[#c5a869]/30 flex items-center gap-2">
          <input
            type="url"
            value={urlInputValue}
            onChange={(e) => setUrlInputValue(e.target.value)}
            placeholder="https://images.unsplash.com/... (ألصق رابط الصورة هنا)"
            className="flex-1 bg-[#12141c] border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#c5a869] text-left"
            dir="ltr"
          />
          <button
            type="button"
            onClick={handleAddUrl}
            className="px-3.5 py-2 rounded-lg gold-gradient-bg text-black font-bold text-xs hover:brightness-110 flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>إضافة</span>
          </button>
        </div>
      )}

      {/* Main Drag & Drop / Click to Upload Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files) {
            handleFiles(e.dataTransfer.files);
          }
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 ${
          dragOver
            ? 'border-[#c5a869] bg-[#c5a869]/10 scale-[1.01]'
            : 'border-white/15 bg-[#141722] hover:border-[#c5a869]/60 hover:bg-[#181c28]'
        } ${isUploading ? 'opacity-60 pointer-events-none' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp,image/gif,image/avif,image/svg+xml"
          multiple={allowMultiple}
          className="hidden"
          onChange={(e) => {
            if (e.target.files) {
              handleFiles(e.target.files);
            }
          }}
        />

        <div className="flex flex-col items-center justify-center space-y-2.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#c5a869]/20 to-[#9d7e35]/10 border border-[#c5a869]/30 flex items-center justify-center text-[#c5a869] shadow-inner">
            {isUploading ? (
              <Loader2 className="w-6 h-6 animate-spin text-[#c5a869]" />
            ) : (
              <UploadCloud className="w-6 h-6" />
            )}
          </div>

          <div className="space-y-1">
            <p className="text-sm font-bold text-white">
              {isUploading ? (
                'جاري رفع الصور من الحاسوب...'
              ) : (
                <>
                  <span className="text-[#c5a869] underline underline-offset-4 ml-1">
                    انقر لاختيار صور من جهازك
                  </span>
                  أو اسحبها وأفلتها هنا
                </>
              )}
            </p>
            <p className="text-[11px] text-gray-400">{helperText}</p>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] text-gray-300">
            <span>💻 تحميل مباشر من الحاسوب أو الهاتف</span>
            <span>•</span>
            <span>يدعم عدة صور في نفس الوقت</span>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {uploadError && (
        <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Uploaded Images Gallery Grid with Management */}
      {images.length > 0 && (
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between text-[11px] text-gray-400">
            <span>الصور المرفوعة (اسحب أو انقر لتعيين الصورة الرئيسية):</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <Check className="w-3 h-3" />
              جاهزة للعرض
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {images.map((imgUrl, index) => {
              const isPrimary = index === 0;
              return (
                <div
                  key={`${imgUrl}-${index}`}
                  className={`group relative rounded-xl overflow-hidden border transition-all ${
                    isPrimary
                      ? 'border-[#c5a869] ring-2 ring-[#c5a869]/30 bg-[#1c1810]'
                      : 'border-white/10 bg-[#141722] hover:border-white/30'
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="aspect-square w-full relative bg-black/40 flex items-center justify-center overflow-hidden">
                    <img
                      src={imgUrl}
                      alt={`صورة ${index + 1}`}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/assets/luxury_watch_hero.jpg';
                      }}
                      className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                      loading="lazy"
                    />

                    {/* Primary Badge */}
                    {isPrimary ? (
                      <div className="absolute top-1.5 right-1.5 z-10 bg-[#c5a869] text-black text-[9px] font-black px-1.5 py-0.5 rounded-md shadow flex items-center gap-0.5">
                        <Star className="w-2.5 h-2.5 fill-black" />
                        <span>الرئيسية</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSetPrimary(index);
                        }}
                        title="تعيين كصورة رئيسية للمنتج"
                        className="absolute top-1.5 right-1.5 z-10 bg-black/70 hover:bg-[#c5a869] text-gray-300 hover:text-black p-1 rounded-md opacity-0 group-hover:opacity-100 transition shadow"
                      >
                        <Star className="w-3 h-3" />
                      </button>
                    )}

                    {/* Overlay Actions on Hover */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewModalImage(imgUrl);
                        }}
                        title="معاينة بالحجم الكامل"
                        className="p-1.5 rounded-lg bg-white/20 hover:bg-white/40 text-white transition"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemove(index);
                        }}
                        title="حذف هذه الصورة"
                        className="p-1.5 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-white transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Caption */}
                  <div className="p-1.5 text-center text-[10px] text-gray-400 bg-[#0d0f16] truncate">
                    {isPrimary ? (
                      <span className="text-[#c5a869] font-bold">الصورة 1 (الواجهة)</span>
                    ) : (
                      <span>صورة {index + 1}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal: Fullscreen Preview */}
      {previewModalImage &&
        createPortal(
          <div
            dir="rtl"
            className="fixed inset-0 z-[95] flex items-center justify-center p-4 bg-black/90"
            onClick={() => setPreviewModalImage(null)}
          >
            <div
              className="relative max-w-3xl max-h-[90vh] p-2 bg-[#141722] border border-white/20 rounded-2xl shadow-2xl flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setPreviewModalImage(null)}
                className="absolute top-3 right-3 z-10 p-2 rounded-xl bg-black/70 hover:bg-black text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <img
                src={previewModalImage}
                alt="معاينة الصورة"
                className="max-h-[80vh] w-auto object-contain rounded-xl"
              />
            </div>
          </div>,
          document.body
        )}
    </div>
  );
});
