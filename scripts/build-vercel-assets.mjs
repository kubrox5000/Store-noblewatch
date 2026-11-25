import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import esbuild from 'esbuild';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

function generateStaticFallbacks() {
  const storePath = path.join(ROOT, 'data', 'store.json');
  if (!fs.existsSync(storePath)) {
    console.warn('⚠️ data/store.json not found, skipping static fallback generation.');
    return;
  }

  const raw = JSON.parse(fs.readFileSync(storePath, 'utf-8'));
  const products = Array.isArray(raw.products) ? raw.products : [];
  const categories = Array.isArray(raw.categories) ? raw.categories : [];
  const allReviews = Array.isArray(raw.reviews) ? raw.reviews : [];

  const { adminPasswordHash: _pw, promoCodes: _promo, ...publicSettings } = raw.settings || {};
  const publicOrderSecurity = { ...(publicSettings.orderSecurity || {}) };
  delete publicOrderSecurity.promoCodes;
  publicSettings.orderSecurity = publicOrderSecurity;

  const approvedReviews = [];
  const statsAcc = {};
  let fiveStarsCount = 0;
  let fourStarsCount = 0;

  for (const r of allReviews) {
    if (!r || !r.isApproved) continue;
    approvedReviews.push(r);
    const rating = Number(r.rating) || 5;
    if (rating === 5) fiveStarsCount += 1;
    else if (rating === 4) fourStarsCount += 1;

    if (!statsAcc[r.productId]) {
      statsAcc[r.productId] = { sum: 0, count: 0 };
    }
    statsAcc[r.productId].count += 1;
    statsAcc[r.productId].sum += rating;
  }

  const reviewsStatsByProduct = {};
  for (const [productId, b] of Object.entries(statsAcc)) {
    reviewsStatsByProduct[productId] = {
      count: b.count,
      avgRating: Number((b.sum / b.count).toFixed(1)),
    };
  }

  const publicDir = path.join(ROOT, 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const storePublicPayload = {
    success: true,
    isAdminAuthenticated: false,
    isSlim: true,
    data: {
      settings: publicSettings,
      categories,
      products,
      orders: [],
      reviews: approvedReviews.slice(0, 36),
      reviewsStatsByProduct,
      reviewsSummary: {
        totalCount: approvedReviews.length,
        fiveStarsCount,
        fourStarsCount,
      },
      hasMoreReviews: approvedReviews.length > 36,
    },
  };

  fs.writeFileSync(
    path.join(publicDir, 'store-public.json'),
    JSON.stringify(storePublicPayload),
    'utf-8'
  );
  fs.writeFileSync(
    path.join(publicDir, 'reviews-public.json'),
    JSON.stringify({ success: true, reviews: approvedReviews }),
    'utf-8'
  );

  console.log(
    `✅ Generated static public JSON fallbacks: ${products.length} products, ${approvedReviews.length} approved reviews`
  );
}

async function bundleVercelApi() {
  const apiDir = path.join(ROOT, 'api');
  if (!fs.existsSync(apiDir)) {
    fs.mkdirSync(apiDir, { recursive: true });
  }

  await esbuild.build({
    entryPoints: [path.join(ROOT, 'src', 'vercelHandler.ts')],
    outfile: path.join(apiDir, 'index.js'),
    bundle: true,
    platform: 'node',
    target: 'node20',
    format: 'esm',
    packages: 'external',
    sourcemap: false,
    minify: false,
  });

  console.log('✅ Bundled Vercel serverless API -> api/index.js');
}

async function main() {
  generateStaticFallbacks();
  await bundleVercelApi();
}

main().catch((err) => {
  console.error('Failed to build Vercel assets:', err);
  process.exit(1);
});
