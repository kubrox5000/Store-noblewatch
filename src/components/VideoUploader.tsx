import React, { useState, useRef } from 'react';
import {
  Film,
  UploadCloud,
  Play,
  Trash2,
  Plus,
  Link as LinkIcon,
  Check,
  Loader2,
  Clock,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { WatchVideo } from '../types';
import {
  cacheVideoFile,
  getCachedVideoBlobUrl,
  extractVideoMetadata,
} from '../utils/videoStorage';

interface VideoUploaderProps {
  videos: WatchVideo[];
  onChange: (videos: WatchVideo[]) => void;
  productImages?: string[];
  maxVideos?: number;
  onUploadingChange?: (isUploading: boolean) => void;
}

// Dedicated preview player that resolves IndexedDB blob URL if available
const VideoPlayerItem: React.FC<{ vid: WatchVideo }> = ({ vid }) => {
  const [playUrl, setPlayUrl] = useState<string>(vid.url);

  React.useEffect(() => {
    let isMounted = true;
    getCachedVideoBlobUrl(vid.url).then((blobUrl) => {
      if (isMounted && blobUrl) {
        setPlayUrl(blobUrl);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [vid.url]);

  return (
    <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black flex items-center justify-center border border-white/10 group">
      <video
        key={playUrl}
        src={playUrl}
        poster={vid.poster}
        controls
        playsInline
        preload="metadata"
        className="w-full h-full object-contain bg-black"
      />
      {vid.aspect && (
        <span className="absolute top-2 right-2 bg-black/80 backdrop-blur-md text-[#c5a869] border border-[#c5a869]/40 text-[10px] font-bold px-2 py-0.5 rounded shadow pointer-events-none">
          {vid.aspect === '9:16' ? 'فيديو طولي (9:16)' : '16:9'}
        </span>
      )}
    </div>
  );
};

export const VideoUploader: React.FC<VideoUploaderProps> = ({
  videos = [],
  onChange,
  productImages = [],
  maxVideos = 4,
  onUploadingChange,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadProgressText, setUploadProgressText] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form for manual URL adding
  const [showUrlForm, setShowUrlForm] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newDuration, setNewDuration] = useState('0:30');
  const [newPoster, setNewPoster] = useState(productImages[0] || '');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const setUploadingState = (uploading: boolean) => {
    setIsUploading(uploading);
    if (onUploadingChange) {
      onUploadingChange(uploading);
    }
  };

  // Quick preset videos available in public/videos
  const PRESET_VIDEOS = [
    {
      title: 'استعراض 360° لحركة العقارب والفخامة',
      url: '/videos/video_prod-1.mp4',
      duration: '0:35',
      poster: productImages[0] || 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=800&q=80',
    },
    {
      title: 'معاينة واقعية للمينا الكريستالية والمعدن',
      url: '/videos/video_prod-2.mp4',
      duration: '0:28',
      poster: productImages[0] || 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80',
    },
    {
      title: 'اختبار دقة التوقيت ومقاومة الماء',
      url: '/videos/video_prod-3.mp4',
      duration: '0:20',
      poster: productImages[0] || 'https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?auto=format&fit=crop&w=800&q=80',
    },
  ];

  // Upload video file safely via chunked upload (2.5MB chunks - bypasses all Cloud Run/proxy limits)
  const handleUploadFile = async (file: File) => {
    if (!file.type.startsWith('video/') && !file.name.match(/\.(mp4|webm|mov|m4v|avi|mkv)$/i)) {
      setError('يرجى اختيار ملف فيديو صالح بصيغة MP4 أو WebM أو MOV');
      return;
    }

    if (videos.length >= maxVideos) {
      setError(`وصلت للحد الأقصى المسموح به (${maxVideos} فيديوهات)`);
      return;
    }

    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    setUploadProgress(0);
    setUploadProgressText(`بدء معالجة واستخراج لقطات الفيديو (${sizeMb} ميغابايت)...`);
    setError(null);
    setUploadingState(true);

    try {
      // 1. Extract real snapshot from user's video frame, exact duration, and aspect ratio
      const metadata = await extractVideoMetadata(file);

      const CHUNK_SIZE = 2.5 * 1024 * 1024; // 2.5MB per chunk (strictly safe under Cloud Run 32MB limit)
      const totalChunks = Math.max(1, Math.ceil(file.size / CHUNK_SIZE));
      const uploadId = `vup_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

      // Cache file locally in IndexedDB under uploadId
      await cacheVideoFile(uploadId, file);

      let finalVideoUrl: string | null = null;

      // Function to upload a single chunk with retry
      const uploadChunk = async (chunkIndex: number): Promise<any> => {
        const start = chunkIndex * CHUNK_SIZE;
        const end = Math.min(file.size, start + CHUNK_SIZE);
        const chunkBlob = file.slice(start, end);

        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            const resp = await new Promise<any>((resolve, reject) => {
              const xhr = new XMLHttpRequest();
              const url = `/api/upload-video-chunk?uploadId=${encodeURIComponent(uploadId)}&chunkIndex=${chunkIndex}&totalChunks=${totalChunks}&filename=${encodeURIComponent(file.name)}`;
              xhr.open('POST', url);
              const adminToken = localStorage.getItem('noblewatch_admin_token');
              if (adminToken) {
                xhr.setRequestHeader('Authorization', `Bearer ${adminToken}`);
              }
              xhr.setRequestHeader('Content-Type', 'application/octet-stream');
              xhr.setRequestHeader('X-Upload-Id', uploadId);
              xhr.setRequestHeader('X-Chunk-Index', String(chunkIndex));
              xhr.setRequestHeader('X-Total-Chunks', String(totalChunks));
              xhr.setRequestHeader('X-Filename', encodeURIComponent(file.name));

              xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                  try {
                    const data = JSON.parse(xhr.responseText);
                    resolve(data);
                  } catch (e) {
                    reject(e);
                  }
                } else {
                  reject(new Error(`Server returned ${xhr.status}`));
                }
              };

              xhr.onerror = () => reject(new Error('Network error on chunk'));
              xhr.ontimeout = () => reject(new Error('Timeout on chunk'));
              xhr.send(chunkBlob);
            });

            return resp;
          } catch (err) {
            if (attempt === 3) throw err;
            await new Promise((r) => setTimeout(r, 600));
          }
        }
      };

      // Upload chunks sequentially
      for (let i = 0; i < totalChunks; i++) {
        const percent = Math.min(99, Math.round(((i + 1) / totalChunks) * 100));
        setUploadProgress(percent);
        setUploadProgressText(`جاري رفع الفيديو... ${percent}% (الجزء ${i + 1} من ${totalChunks})`);

        const result = await uploadChunk(i);
        if (result && result.isComplete && result.url) {
          finalVideoUrl = result.url;
        }
      }

      if (finalVideoUrl) {
        // Cache file locally in IndexedDB under final server URL
        await cacheVideoFile(finalVideoUrl, file);

        const cleanTitle = file.name
          .replace(/\.[^/.]+$/, '')
          .replace(/[-_]/g, ' ')
          .trim();

        const newVideoItem: WatchVideo = {
          title: cleanTitle.length > 2 ? cleanTitle : 'فيديو توضيحي للساعة',
          url: finalVideoUrl,
          poster: metadata.poster || productImages[0] || '',
          duration: metadata.duration || '0:30',
          aspect: metadata.aspect || '16:9',
        };

        onChange([...videos, newVideoItem]);
        setUploadProgress(100);
        setUploadProgressText('اكتمل رفع الفيديو بنجاح!');
        setTimeout(() => setUploadProgress(0), 1500);
        setUploadingState(false);
        return;
      }

      // If chunked upload didn't return a final URL, try single direct streaming
      setUploadProgressText('جاري إنهاء المعالجة...');
      const fallbackUrl = await new Promise<string | null>((resolve) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `/api/upload-video?filename=${encodeURIComponent(file.name)}`);
        const adminToken = localStorage.getItem('noblewatch_admin_token');
        if (adminToken) {
          xhr.setRequestHeader('Authorization', `Bearer ${adminToken}`);
        }
        xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const d = JSON.parse(xhr.responseText);
              if (d.success && d.url) return resolve(d.url);
            } catch {}
          }
          resolve(null);
        };
        xhr.onerror = () => resolve(null);
        xhr.send(file);
      });

      if (fallbackUrl) {
        await cacheVideoFile(fallbackUrl, file);

        const cleanTitle = file.name
          .replace(/\.[^/.]+$/, '')
          .replace(/[-_]/g, ' ')
          .trim();

        const newVideoItem: WatchVideo = {
          title: cleanTitle.length > 2 ? cleanTitle : 'فيديو توضيحي للساعة',
          url: fallbackUrl,
          poster: metadata.poster || productImages[0] || '',
          duration: metadata.duration || '0:30',
          aspect: metadata.aspect || '16:9',
        };

        onChange([...videos, newVideoItem]);
        setUploadProgress(100);
        setUploadProgressText('اكتمل رفع الفيديو بنجاح!');
        setTimeout(() => setUploadProgress(0), 1500);
        setUploadingState(false);
        return;
      }

      setError('تعذر حفظ ملف الفيديو على السيرفر، يرجى المحاولة مرة أخرى أو اختيار ملف أصغر');
      setUploadingState(false);
    } catch (err) {
      console.error('Video upload error:', err);
      setError('حدث خطأ أثناء رفع ملف الفيديو. يرجى إعادة المحاولة');
      setUploadingState(false);
    }
  };

  const handleAddManualVideo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl.trim()) return;

    const newVideoItem: WatchVideo = {
      title: newTitle.trim() || 'معاينة حية ومباشرة للساعة',
      url: newUrl.trim(),
      duration: newDuration.trim() || '0:30',
      poster: newPoster || productImages[0] || '',
      aspect: '16:9',
    };

    onChange([...videos, newVideoItem]);
    setNewUrl('');
    setNewTitle('');
    setShowUrlForm(false);
  };

  const handleAddPreset = (preset: typeof PRESET_VIDEOS[0]) => {
    const exists = videos.some((v) => v.url === preset.url);
    if (!exists) {
      onChange([
        ...videos,
        {
          title: preset.title,
          url: preset.url,
          duration: preset.duration,
          poster: productImages[0] || preset.poster,
          aspect: '16:9',
        },
      ]);
    }
  };

  const handleRemoveVideo = (index: number) => {
    onChange(videos.filter((_, i) => i !== index));
  };

  const handleUpdateVideo = (index: number, updates: Partial<WatchVideo>) => {
    const updated = [...videos];
    updated[index] = { ...updated[index], ...updates };
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      {/* Header and counter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
        <div>
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Film className="w-4 h-4 text-[#c5a869]" />
            <span>فيديوهات الساعة والمعاينة الحية</span>
            <span className="text-xs font-normal text-[#c5a869] bg-[#c5a869]/15 border border-[#c5a869]/30 px-2 py-0.5 rounded-full">
              {videos.length} / {maxVideos} فيديو
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            ارفع فيديوهات واقعية توضح حركة العقارب ولمعان الفولاذ، أو أدخل رابط الفيديو من يوتيوب أو التخزين.
          </p>
        </div>

        {/* Quick presets buttons */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 sm:pt-0">
          <span className="text-[11px] text-gray-400">إضافة فيديو نموذجي:</span>
          {PRESET_VIDEOS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleAddPreset(preset)}
              disabled={videos.length >= maxVideos}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-gray-300 hover:text-white transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Play className="w-2.5 h-2.5 text-[#c5a869] fill-[#c5a869]" />
              <span>{preset.title.slice(0, 18)}...</span>
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Upload Zone & URL Toggle */}
      {videos.length < maxVideos && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* 1. Direct File Upload Box */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              if (e.dataTransfer.files?.[0]) {
                handleUploadFile(e.dataTransfer.files[0]);
              }
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center text-center cursor-pointer transition ${
              dragOver
                ? 'border-[#c5a869] bg-[#c5a869]/10'
                : 'border-white/15 bg-white/[0.02] hover:bg-white/[0.05] hover:border-[#c5a869]/40'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/webm,video/quicktime,video/*"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  handleUploadFile(e.target.files[0]);
                  e.target.value = '';
                }
              }}
              className="hidden"
            />

            {isUploading ? (
              <div className="flex flex-col items-center gap-2 text-[#c5a869] w-full max-w-xs">
                <Loader2 className="w-7 h-7 animate-spin" />
                <span className="text-xs font-bold text-center">{uploadProgressText || 'جاري رفع ومعالجة ملف الفيديو...'}</span>
                {uploadProgress > 0 && (
                  <div className="w-full bg-white/10 rounded-full h-2 mt-1 overflow-hidden border border-white/10">
                    <div
                      className="h-full bg-gradient-to-r from-[#dfb76c] via-[#c5a869] to-[#9d7e35] transition-all duration-300 rounded-full"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="w-10 h-10 rounded-xl bg-[#c5a869]/10 border border-[#c5a869]/25 flex items-center justify-center text-[#c5a869] mb-2">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-white mb-0.5">
                  ارفع أي فيديو من حاسوبك أو هاتفك
                </span>
                <span className="text-[11px] text-gray-400">
                  يدعم جميع أحجام وصيغ الفيديو MP4، WebM، MOV (سحب وإفلات أو نقر)
                </span>
              </>
            )}
          </div>

          {/* 2. Add via URL Button / Form */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 flex flex-col justify-between">
            {!showUrlForm ? (
              <div className="flex flex-col items-center justify-center text-center h-full py-2">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-300 mb-2">
                  <LinkIcon className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-white mb-1">
                  إضافة فيديو عبر الرابط المباشر
                </span>
                <p className="text-[11px] text-gray-400 mb-3">
                  إذا كان الفيديو مستضافاً في رابط خارجي أو في مجلد /videos
                </p>
                <button
                  type="button"
                  onClick={() => setShowUrlForm(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-white font-semibold transition cursor-pointer"
                >
                  + إدخال رابط الفيديو
                </button>
              </div>
            ) : (
              <form onSubmit={handleAddManualVideo} className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <LinkIcon className="w-3.5 h-3.5 text-[#c5a869]" />
                    <span>إدخال رابط الفيديو</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowUrlForm(false)}
                    className="text-gray-400 hover:text-white text-xs cursor-pointer"
                  >
                    إلغاء
                  </button>
                </div>

                <input
                  type="text"
                  required
                  placeholder="رابط الفيديو (مثال: /videos/video_prod-1.mp4 أو https://...)"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="w-full bg-[#1b1f2b] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#c5a869] text-left"
                  dir="ltr"
                />

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="عنوان الفيديو (مثال: معاينة 360°)"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-[#1b1f2b] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#c5a869]"
                  />
                  <input
                    type="text"
                    placeholder="المدة (مثال: 0:35)"
                    value={newDuration}
                    onChange={(e) => setNewDuration(e.target.value)}
                    className="w-full bg-[#1b1f2b] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#c5a869] text-center"
                    dir="ltr"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 rounded-xl gold-gradient-bg text-black font-bold text-xs shadow hover:brightness-110 cursor-pointer"
                >
                  تأكيد وإضافة الفيديو
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* List of currently attached videos */}
      {videos.length === 0 ? (
        <div className="text-center py-5 rounded-2xl border border-dashed border-white/10 text-gray-500 text-xs">
          لم يتم إرفاق أي فيديو لهذه الساعة بعد. اختر ملفاً من جهازك أو اختر أحد الفيديوهات النموذجية أعلاه.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          {videos.map((vid, idx) => (
            <div
              key={idx}
              className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-[#c5a869]/40 transition space-y-3"
            >
              {/* Video Player Preview with Cached Blob Resolution */}
              <VideoPlayerItem vid={vid} />

              {/* Title and details inputs */}
              <div className="space-y-2">
                <div>
                  <label className="block text-[11px] text-gray-400 mb-1">عنوان الفيديو التوضيحي:</label>
                  <input
                    type="text"
                    value={vid.title}
                    onChange={(e) => handleUpdateVideo(idx, { title: e.target.value })}
                    className="w-full bg-[#1b1f2b] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white font-bold focus:outline-none focus:border-[#c5a869]"
                    placeholder="مثال: فخامة حركة العقارب والمينا"
                  />
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 bg-[#1b1f2b] border border-white/10 rounded-xl px-2.5 py-1 text-xs">
                    <Clock className="w-3 h-3 text-gray-400" />
                    <span className="text-[10px] text-gray-400">المدة:</span>
                    <input
                      type="text"
                      value={vid.duration || '0:30'}
                      onChange={(e) => handleUpdateVideo(idx, { duration: e.target.value })}
                      className="w-14 bg-transparent text-center font-mono text-xs text-white focus:outline-none"
                      dir="ltr"
                    />
                  </div>

                  {productImages.length > 0 && (
                    <div className="flex items-center gap-1 text-[11px] text-gray-400">
                      <span>الغلاف:</span>
                      <select
                        value={vid.poster || productImages[0]}
                        onChange={(e) => handleUpdateVideo(idx, { poster: e.target.value })}
                        className="bg-[#1b1f2b] text-[10px] text-[#c5a869] rounded px-2 py-1 border border-white/10 focus:outline-none cursor-pointer"
                      >
                        {productImages.map((img, imgIdx) => (
                          <option key={imgIdx} value={img}>
                            صورة {imgIdx + 1}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => handleRemoveVideo(idx)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-500/20 text-xs transition cursor-pointer"
                    title="حذف هذا الفيديو"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>حذف</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
