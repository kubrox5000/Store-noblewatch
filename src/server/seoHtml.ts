import { getStoreSnapshot } from '../db/storeRepo.ts';

function escapeHtmlAttr(str: string): string {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function clampText(text: string, maxLen: number): string {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLen) return clean;
  return `${clean.slice(0, maxLen - 1).trim()}…`;
}

export function resolvePublicOrigin(req: {
  protocol?: string;
  headers?: Record<string, any>;
  get?: (name: string) => string | undefined;
}): string {
  if (process.env.APP_URL) {
    return process.env.APP_URL.replace(/\/+$/, '');
  }
  const forwardedProto = String(req.headers?.['x-forwarded-proto'] || '').split(',')[0].trim();
  const proto = forwardedProto || req.protocol || 'https';
  const host = String(
    req.headers?.['x-forwarded-host'] || req.get?.('host') || 'localhost:3000'
  )
    .split(',')[0]
    .trim();
  return `${proto}://${host}`;
}

export async function injectDynamicSeoIntoHtml(
  htmlTemplate: string,
  origin: string,
  productId?: string | null
): Promise<string> {
  const cleanOrigin = origin.replace(/\/+$/, '');
  let html = htmlTemplate;

  // Always upgrade canonical, og:image, twitter:image relative URLs to full origin URLs
  let canonicalUrl = `${cleanOrigin}/`;
  let pageTitle = 'Noblewatch | متجر الساعات والإكسسوارات الفاخرة بالمغرب';
  let pageDescription =
    'تسوق أرقى ساعات اليد الفاخرة والإكسسوارات للرجال والنساء بالمغرب مع Noblewatch. جودة أصلية، ضمان سنة، توصيل مجاني 0 درهم والدفع عند الاستلام.';
  let ogType = 'website';
  let ogImage = `${cleanOrigin}/assets/watches_and_accessories_hero.jpg`;
  let extraJsonLd = '';

  if (productId) {
    try {
      const db = await getStoreSnapshot();
      const prod = Array.isArray(db.products)
        ? db.products.find((p: any) => p.id === productId && p.isPublished !== false)
        : null;

      if (prod) {
        canonicalUrl = `${cleanOrigin}/?product=${encodeURIComponent(prod.id)}`;
        pageTitle = `${prod.name} | Noblewatch المغرب`;
        pageDescription = clampText(
          `اطلب ${prod.name} بسعر ${prod.price} درهم مع توصيل مجاني 0 درهم بالمغرب، ضمان سنة رسمي، والدفع عند الاستلام بعد المعاينة.`,
          158
        );
        ogType = 'product';
        const firstImg = Array.isArray(prod.images) ? prod.images[0] : '';
        if (firstImg && typeof firstImg === 'string' && !firstImg.startsWith('data:')) {
          ogImage = /^https?:\/\//i.test(firstImg)
            ? firstImg
            : `${cleanOrigin}${firstImg.startsWith('/') ? '' : '/'}${firstImg}`;
        }

        const prodSchema = {
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: prod.name,
          description: clampText(prod.description || pageDescription, 300),
          sku: prod.sku || prod.id,
          image: [ogImage],
          brand: { '@type': 'Brand', name: 'Noblewatch' },
          offers: {
            '@type': 'Offer',
            url: canonicalUrl,
            priceCurrency: 'MAD',
            price: Number(prod.price || 0),
            availability:
              Number(prod.stock) > 0
                ? 'https://schema.org/InStock'
                : 'https://schema.org/OutOfStock',
          },
        };
        extraJsonLd = `<script id="noblewatch-ssr-product-jsonld" type="application/ld+json">${JSON.stringify(
          prodSchema
        ).replace(/<\/script/gi, '<\\/script')}</script>`;
      }
    } catch {
      // Fallback safely to base tags
    }
  }

  const safeTitle = escapeHtmlAttr(pageTitle);
  const safeDesc = escapeHtmlAttr(pageDescription);
  const safeUrl = escapeHtmlAttr(canonicalUrl);
  const safeImg = escapeHtmlAttr(ogImage);

  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${safeTitle}</title>`);
  if (/<link\s+rel="canonical"/i.test(html)) {
    html = html.replace(
      /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i,
      `<link rel="canonical" href="${safeUrl}" />`
    );
  } else {
    html = html.replace('</head>', `  <link rel="canonical" href="${safeUrl}" />\n  </head>`);
  }
  html = html.replace(
    /<meta\s+name="description"[\s\S]*?content="[^"]*"\s*\/?>/i,
    `<meta name="description" content="${safeDesc}" />`
  );
  html = html.replace(
    /<meta\s+property="og:type"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:type" content="${escapeHtmlAttr(ogType)}" />`
  );
  html = html.replace(
    /<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:title" content="${safeTitle}" />`
  );
  html = html.replace(
    /<meta\s+property="og:description"[\s\S]*?content="[^"]*"\s*\/?>/i,
    `<meta property="og:description" content="${safeDesc}" />`
  );
  html = html.replace(
    /<meta\s+property="og:image"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:image" content="${safeImg}" />`
  );
  html = html.replace(
    /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="twitter:title" content="${safeTitle}" />`
  );
  html = html.replace(
    /<meta\s+name="twitter:description"[\s\S]*?content="[^"]*"\s*\/?>/i,
    `<meta name="twitter:description" content="${safeDesc}" />`
  );
  html = html.replace(
    /<meta\s+name="twitter:image"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="twitter:image" content="${safeImg}" />`
  );

  if (extraJsonLd) {
    html = html.replace('</head>', `  ${extraJsonLd}\n  </head>`);
  }

  return html;
}
