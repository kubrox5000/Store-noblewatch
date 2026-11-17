import 'dotenv/config';
import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { app, processConfirmedToPreparingTransitions } from './src/server/app.ts';
import { injectDynamicSeoIntoHtml, resolvePublicOrigin } from './src/server/seoHtml.ts';
import { getStoreSnapshot } from './src/db/storeRepo.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Serve static assets & videos
app.use(
  '/assets',
  express.static(path.join(__dirname, 'public', 'assets'), {
    maxAge: '7d',
    etag: true,
    lastModified: true,
  })
);
app.use(
  '/videos',
  express.static(path.join(__dirname, 'public', 'videos'), {
    maxAge: '7d',
    etag: true,
    lastModified: true,
  })
);

// Serve favicon
app.get('/favicon.ico', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=604800');
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
