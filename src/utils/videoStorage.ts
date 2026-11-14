// Utility for local video caching in IndexedDB and automatic video metadata/thumbnail extraction

const DB_NAME = 'noblewatch_media_db';
const DB_VERSION = 1;
const STORE_NAME = 'videos';

function openDatabase(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return resolve(null);
    }
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

/**
 * Cache video file/blob locally in IndexedDB so it survives container restarts
 */
export async function cacheVideoFile(urlOrKey: string, file: Blob): Promise<boolean> {
  const db = await openDatabase();
  if (!db) return false;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(file, urlOrKey);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
}

/**
 * Retrieve cached video blob URL if available
 */
export async function getCachedVideoBlobUrl(urlOrKey: string): Promise<string | null> {
  const db = await openDatabase();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(urlOrKey);
      req.onsuccess = () => {
        if (req.result instanceof Blob) {
          const blobUrl = URL.createObjectURL(req.result);
          resolve(blobUrl);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

/**
 * Extract an actual video frame thumbnail, duration, and aspect ratio directly from the uploaded file
 */
export function extractVideoMetadata(file: File): Promise<{
  poster: string;
  duration: string;
  aspect: '16:9' | '9:16';
}> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      return resolve({ poster: '', duration: '0:30', aspect: '16:9' });
    }

    try {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;
      video.crossOrigin = 'anonymous';
      const blobUrl = URL.createObjectURL(file);
      video.src = blobUrl;

      let resolved = false;
      const finish = (poster: string, duration: string, aspect: '16:9' | '9:16') => {
        if (resolved) return;
        resolved = true;
        try {
          URL.revokeObjectURL(blobUrl);
        } catch {}
        resolve({ poster, duration, aspect });
      };

      // Fallback timeout after 4 seconds
      const timeout = setTimeout(() => {
        finish('', '0:30', '16:9');
      }, 4000);

      video.onloadedmetadata = () => {
        const isVertical = (video.videoHeight || 0) > (video.videoWidth || 0);
        const aspect: '16:9' | '9:16' = isVertical ? '9:16' : '16:9';
        const dur = video.duration && !isNaN(video.duration) ? video.duration : 30;
        const mins = Math.floor(dur / 60);
        const secs = Math.floor(dur % 60);
        const durationFormatted = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

        // Seek to 0.5s or 10% of video to capture a meaningful frame
        video.currentTime = Math.min(1.0, Math.max(0.2, dur * 0.1));

        video.onseeked = () => {
          clearTimeout(timeout);
          try {
            const canvas = document.createElement('canvas');
            const targetWidth = isVertical ? 480 : 854;
            const targetHeight = isVertical ? 854 : 480;
            canvas.width = targetWidth;
            canvas.height = targetHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
              const poster = canvas.toDataURL('image/jpeg', 0.85);
              finish(poster, durationFormatted, aspect);
              return;
            }
          } catch (e) {
            console.warn('Canvas export failed:', e);
          }
          finish('', durationFormatted, aspect);
        };
      };

      video.onerror = () => {
        clearTimeout(timeout);
        finish('', '0:30', '16:9');
      };
    } catch {
      resolve({ poster: '', duration: '0:30', aspect: '16:9' });
    }
  });
}
