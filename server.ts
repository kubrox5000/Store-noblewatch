import dotenv from 'dotenv';
dotenv.config({ override: true });
import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { app, processConfirmedToPreparingTransitions } from './src/server/app.ts';
import { injectDynamicSeoIntoHtml, resolvePublicOrigin } from './src/server/seoHtml.ts';
import { getStoreSnapshot } from './src/db/storeRepo.ts';

import zlib from 'zlib';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const WEBP_CACHE_DIR = path.join(__dirname, 'public', '.webp-cache');

// Fast WebP + responsive thumbnail (?w=480) negotiation for /assets/*
app.use('/assets', (req: Request, res: Response, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return next();
  const accept = String(req.headers.accept || '');
  if (!accept.includes('image/webp')) return next();

  let rawRel = '';
  try {
    rawRel = decodeURIComponent(req.path || '').replace(/^\/+/, '');
  } catch {
    return next();
  }
  if (!rawRel || rawRel.includes('..') || !/\.(jpg|jpeg|png|webp)$/i.test(rawRel)) {
    return next();
  }

  const requestedWidth = Number(req.query.w || 0);
  const variant = requestedWidth > 0 && requestedWidth <= 560 ? 'thumb.webp' : 'full.webp';
  const candidate = path.join(WEBP_CACHE_DIR, `${rawRel}.${variant}`);
  if (!candidate.startsWith(WEBP_CACHE_DIR) || !fs.existsSync(candidate)) {
    return next();
  }

  res.setHeader('Content-Type', 'image/webp');
  res.setHeader('Vary', 'Accept');
  res.setHeader('Cache-Control', 'public, max-age=2592000, stale-while-revalidate=86400');
  return res.sendFile(candidate);
});

// Serve static assets & videos with long-lived browser caching
app.use(
  '/assets',
  express.static(path.join(__dirname, 'public', 'assets'), {
    maxAge: '30d',
    etag: true,
    lastModified: true,
    setHeaders: (res, filePath) => {
      res.setHeader('Cache-Control', 'public, max-age=2592000, stale-while-revalidate=86400');
      if (/\.(jpg|jpeg|png|webp)$/i.test(filePath)) {
        res.setHeader('Vary', 'Accept');
      }
    },
  })
);
app.use(
  '/videos',
  express.static(path.join(__dirname, 'public', 'videos'), {
    maxAge: '30d',
    etag: true,
    lastModified: true,
    setHeaders: (res) => {
      res.setHeader('Cache-Control', 'public, max-age=2592000, stale-while-revalidate=86400');
    },
  })
);

// Serve favicon
app.get('/favicon.ico', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=2592000');
  res.sendFile(path.join(__dirname, 'public', 'favicon.svg'));
});

// ----------------- START SERVER WITH VITE DEV OR STATIC DIST ----------------- //

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    const distIndexPath = path.join(distPath, 'index.html');
    const cachedDistIndexHtml = fs.existsSync(distIndexPath)
      ? fs.readFileSync(distIndexPath, 'utf-8')
      : '';

    app.use(
      express.static(distPath, {
        index: false,
        maxAge: '1y',
        etag: true,
        setHeaders: (res, filePath) => {
          if (filePath.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache');
          } else if (filePath.includes(`${path.sep}assets${path.sep}`)) {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          }
        },
      })
    );
    app.get('*', async (req, res) => {
      res.setHeader('Cache-Control', 'no-cache');
      if (cachedDistIndexHtml) {
        try {
          const origin = resolvePublicOrigin(req);
          const productId =
            typeof req.query.product === 'string' ? req.query.product : null;
          const html = await injectDynamicSeoIntoHtml(
            cachedDistIndexHtml,
            origin,
            productId
          );
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          const acceptEncoding = String(req.headers['accept-encoding'] || '');
          if (acceptEncoding.includes('gzip')) {
            res.setHeader('Content-Encoding', 'gzip');
            res.setHeader('Vary', 'Accept-Encoding');
            return res.send(zlib.gzipSync(Buffer.from(html, 'utf-8')));
          }
          return res.send(html);
        } catch {
          // Fallback to static file on error
        }
      }
      return res.sendFile(distIndexPath);
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Noblewatch luxury store server running at http://0.0.0.0:${PORT}`);
    // Pre-warm DB snapshot & RAM cache immediately on boot so first request is instant
    getStoreSnapshot().catch((err) => {
      console.error('Warmup error:', err);
    });
    setInterval(async () => {
      try {
        const snap = await getStoreSnapshot();
        if (Array.isArray(snap.orders) && snap.orders.some((o: any) => o.status === 'تم التأكيد')) {
          await processConfirmedToPreparingTransitions(snap);
        }
      } catch (err) {
        console.error('Error in auto-transition scheduler:', err);
      }
    }, 10000);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
