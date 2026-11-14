import React, { useState, useEffect, useRef } from 'react';
import {
  UploadCloud,
  Trash2,
  Copy,
  Check,
  RefreshCw,
  Image as ImageIcon,
  ExternalLink,
  Loader2,
  HardDrive,
  AlertCircle,
} from 'lucide-react';
import { formatPrice } from '../utils/constants';

interface UploadedFile {
  name: string;
  url: string;
  size: number;
  createdAt: string;
}

interface MediaManagerProps {
  onSelectImage?: (url: string) => void;
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const MediaManager: React.FC<MediaManagerProps> = ({ onSelectImage, showToast }) => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('noblewatch_admin_token');
      const res = await fetch('/api/uploads', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.files)) {
        setFiles(data.files);
      }
    } catch (e) {
      console.error('Failed to fetch uploaded files', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleUploadFiles = async (fileList: FileList | File[]) => {
    const selected = Array.from(fileList);
    if (selected.length === 0) return;

    setUploading(true);
    let successCount = 0;

    for (const file of selected) {
      if (!file.type.startsWith('image/') && !file.type.includes('mp4')) {
        continue;
      }

      await new Promise<void>((resolve) => {
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const dataUrl = reader.result as string;
            const res = await fetch('/api/upload', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                dataUrl,
                filename: file.name,
                mimeType: file.type,
              }),
            });
            const result = await res.json();
            if (result.success) {
              successCount++;
            }
          } catch (e) {
            console.error('Upload failed for', file.name, e);
          } finally {
            resolve();
          }
        };
        reader.readAsDataURL(file);
      });
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';

    if (successCount > 0) {
      if (showToast) showToast(`تم رفع ${successCount} ملف بنجاح من جهازك`, 'success');
      await fetchFiles();
    }
  };

  const handleDelete = async (filename: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الصورة نهائياً من الخادم؟')) return;

    try {
      const token = localStorage.getItem('noblewatch_admin_token');
      const res = await fetch(`/api/uploads/${encodeURIComponent(filename)}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.success) {
        setFiles((prev) => prev.filter((f) => f.name !== filename));
        if (showToast) showToast('تم حذف الملف بنجاح', 'success');
      }
    } catch {
      if (showToast) showToast('فشل حذف الملف', 'error');
    }
  };

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(window.location.origin + url);
    setCopiedUrl(url);
    if (showToast) showToast('تم نسخ رابط الصورة إلى الحافظة', 'success');
    setTimeout(() => setCopiedUrl(null), 2500);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6 text-right">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#151822] border border-white/5">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-[#c5a869]" />
            <span>مكتبة الصور والوسائط المرفوعة</span>
          </h3>
          <p className="text-xs text-gray-400">
            يمكنك رفع صور الساعات مباشرة من حاسوبك واستخدامها في المتجر أو نسخ روابطها
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl gold-gradient-bg text-black font-extrabold text-xs shadow hover:brightness-110 cursor-pointer disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <UploadCloud className="w-4 h-4" />
            )}
            <span>رفع صور جديدة من الحاسوب</span>
          </button>

          <button
            onClick={fetchFiles}
            title="تحديث القائمة"
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Drag & Drop Upload Zone */}
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
            handleUploadFiles(e.dataTransfer.files);
          }
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition ${
          dragOver
            ? 'border-[#c5a869] bg-[#c5a869]/10'
            : 'border-white/10 bg-[#151822] hover:border-[#c5a869]/50 hover:bg-[#181c28]'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/mp4"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) {
              handleUploadFiles(e.target.files);
            }
          }}
        />

        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[#c5a869]/10 border border-[#c5a869]/30 flex items-center justify-center text-[#c5a869]">
            {uploading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <UploadCloud className="w-6 h-6" />
            )}
          </div>
          <p className="text-sm font-bold text-white">
            {uploading ? 'جاري رفع الملفات من الحاسوب...' : 'انقر لاختيار صور من جهازك أو اسحبها إلى هنا'}
          </p>
          <p className="text-xs text-gray-400">
            يدعم جميع صيغ الصور (JPG, PNG, WEBP, GIF) وفيديوهات المنتجات MP4
          </p>
        </div>
      </div>

      {/* Files Grid */}
      {loading ? (
        <div className="p-12 text-center text-gray-400 flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-[#c5a869]" />
          <span>جاري تحميل الصور المحفوظة...</span>
        </div>
      ) : files.length === 0 ? (
        <div className="p-12 rounded-2xl bg-[#151822] border border-white/5 text-center text-gray-400 space-y-2">
          <ImageIcon className="w-10 h-10 mx-auto text-gray-600" />
          <p className="font-bold text-white">لا توجد صور مرفوعة بعد</p>
          <p className="text-xs">اضغط على الزر بالأعلى لاختيار صور من حاسوبك وحفظها على المتجر.</p>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="text-xs text-gray-400 flex items-center justify-between">
            <span>الصور المتوفرة ({files.length} صورة)</span>
            <span className="text-[11px] text-[#c5a869]">
              إجمالي المساحة المستخدمة:{' '}
              {formatSize(files.reduce((sum, f) => sum + f.size, 0))}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {files.map((file) => (
              <div
                key={file.name}
                className="group relative rounded-2xl bg-[#151822] border border-white/5 overflow-hidden flex flex-col justify-between hover:border-[#c5a869]/40 transition"
              >
                <div className="aspect-square relative bg-black/60 overflow-hidden flex items-center justify-center">
                  <img
                    src={file.url}
                    alt={file.name}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/assets/luxury_watch_hero.jpg';
                    }}
                    className="w-full h-full object-cover transition group-hover:scale-105"
                    loading="lazy"
                  />

                  {/* Actions overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2 p-2">
                    {onSelectImage && (
                      <button
                        onClick={() => onSelectImage(file.url)}
                        title="اختيار هذه الصورة"
                        className="px-2.5 py-1.5 rounded-lg bg-[#c5a869] text-black font-bold text-xs"
                      >
                        اختيار
                      </button>
                    )}

                    <button
                      onClick={() => handleCopy(file.url)}
                      title="نسخ الرابط"
                      className="p-2 rounded-lg bg-white/20 hover:bg-white/40 text-white transition"
                    >
                      {copiedUrl === file.url ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>

                    <button
                      onClick={() => handleDelete(file.name)}
                      title="حذف نهائي"
                      className="p-2 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-white transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="p-2.5 bg-[#10121a] text-[10px] space-y-1">
                  <span className="text-white block font-mono truncate" title={file.name}>
                    {file.name}
                  </span>
                  <div className="flex items-center justify-between text-gray-500 font-mono">
                    <span>{formatSize(file.size)}</span>
                    <span>{new Date(file.createdAt).toLocaleDateString('ar-MA')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
