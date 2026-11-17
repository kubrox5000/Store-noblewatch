import { Product, Review, StoreSettings } from '../types';
import type { Language } from '../context/LanguageContext';

const upsertMetaTag = (attrName: 'name' | 'property', attrValue: string, content: string) => {
  if (typeof document === 'undefined') return;
  let el = document.head.querySelector(`meta[${attrName}="${attrValue}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attrName, attrValue);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
};

const upsertCanonicalLink = (href: string) => {
  if (typeof document === 'undefined') return;
  let link = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
};

const upsertJsonLd = (id: string, schemaObject: Record<string, unknown>) => {
  if (typeof document === 'undefined') return;
  let script = document.getElementById(id) as HTMLScriptElement | null;
  if (!script) {
    script = document.createElement('script');
    script.id = id;
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(schemaObject);
};

const toAbsoluteUrl = (pathOrUrl: string, origin: string): string => {
  if (!pathOrUrl) return `${origin}/assets/watches_and_accessories_hero.jpg`;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return `${origin}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`;
};

const clampMetaText = (text: string, maxLen: number): string => {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLen) return clean;
  return `${clean.slice(0, maxLen - 1).trim()}…`;
};

const CATEGORY_LABELS: Record<string, { ar: string; fr: string }> = {
  men: { ar: 'ساعات رجالية', fr: 'Montres Homme' },
  women: { ar: 'ساعات نسائية', fr: 'Montres Femme' },
  'men-accessories': { ar: 'إكسسوارات رجالية', fr: 'Accessoires Homme' },
  'women-accessories': { ar: 'إكسسوارات نسائية', fr: 'Accessoires Femme' },
  luxury: { ar: 'ساعات فاخرة', fr: 'Montres de Luxe' },
  smart: { ar: 'ساعات ذكية', fr: 'Montres Connectées' },
  sports: { ar: 'ساعات رياضية', fr: 'Montres Sport' },
  classic: { ar: 'ساعات كلاسيكية', fr: 'Montres Classiques' },
};

export interface ApplySeoParams {
  lang: Language;
  selectedProduct: Product | null | undefined;
  products: Product[];
  reviews: Review[];
  settings: StoreSettings | null;
}

export function applyDynamicSeo({
  lang,
  selectedProduct,
  products,
  reviews,
  settings,
}: ApplySeoParams): string {
  if (typeof window === 'undefined' || typeof document === 'undefined') return '';

  const isFr = lang === 'fr';
  const origin = window.location.origin;
  const basePath = `${origin}${window.location.pathname}`;
  const storeName = 'Noblewatch';

  const approvedReviews = reviews.filter((r) => r.isApproved);

  if (selectedProduct) {
    const canonicalUrl = `${basePath}?product=${encodeURIComponent(selectedProduct.id)}`;
    const title = isFr
      ? `${selectedProduct.name} | ${storeName} Maroc`
      : `${selectedProduct.name} | ${storeName} المغرب`;

    const rawDesc = isFr
      ? `${selectedProduct.name} au prix de ${selectedProduct.price} DH avec livraison gratuite au Maroc, garantie 1 an et paiement à la livraison.`
      : `اطلب ${selectedProduct.name} بسعر ${selectedProduct.price} درهم مع توصيل مجاني 0 درهم بالمغرب، ضمان سنة رسمي، والدفع عند الاستلام بعد المعاينة.`;
    const description = clampMetaText(rawDesc, 158);
    const primaryImage = toAbsoluteUrl(
      selectedProduct.images?.[0] || '/assets/watches_and_accessories_hero.jpg',
      origin
    );
    const allImages = (selectedProduct.images || [])
      .filter((img) => typeof img === 'string' && !img.startsWith('data:'))
      .slice(0, 5)
      .map((img) => toAbsoluteUrl(img, origin));

    document.title = title;
    upsertCanonicalLink(canonicalUrl);
    upsertMetaTag('name', 'description', description);
    upsertMetaTag('property', 'og:type', 'product');
    upsertMetaTag('property', 'og:title', title);
    upsertMetaTag('property', 'og:description', description);
    upsertMetaTag('property', 'og:url', canonicalUrl);
    upsertMetaTag('property', 'og:image', primaryImage);
    upsertMetaTag('property', 'og:image:alt', selectedProduct.name);
    upsertMetaTag('property', 'og:locale', isFr ? 'fr_MA' : 'ar_MA');
    upsertMetaTag('name', 'twitter:title', title);
    upsertMetaTag('name', 'twitter:description', description);
    upsertMetaTag('name', 'twitter:image', primaryImage);

    const prodReviews = approvedReviews.filter((r) => r.productId === selectedProduct.id);
    const reviewCount = prodReviews.length || Number(selectedProduct.reviewCount || 0);
    const avgRating =
      prodReviews.length > 0
        ? Number(
            (
              prodReviews.reduce((acc, r) => acc + (Number(r.rating) || 5), 0) /
              prodReviews.length
            ).toFixed(1)
          )
        : Number(selectedProduct.rating || 4.9);

    const catInfo = CATEGORY_LABELS[selectedProduct.category] || {
      ar: 'ساعات وإكسسوارات',
      fr: 'Montres & Accessoires',
    };

    const productSchema: Record<string, unknown> = {
      '@type': 'Product',
      name: selectedProduct.name,
      description: clampMetaText(selectedProduct.description || description, 320),
      sku: selectedProduct.sku || selectedProduct.id,
      image: allImages.length > 0 ? allImages : [primaryImage],
      brand: {
        '@type': 'Brand',
        name: storeName,
      },
      category: isFr ? catInfo.fr : catInfo.ar,
      offers: {
        '@type': 'Offer',
        url: canonicalUrl,
        priceCurrency: 'MAD',
        price: Number(selectedProduct.price || 0),
        availability:
          Number(selectedProduct.stock) > 0
            ? 'https://schema.org/InStock'
            : 'https://schema.org/OutOfStock',
        itemCondition: 'https://schema.org/NewCondition',
        seller: {
          '@type': 'Organization',
          name: storeName,
        },
        shippingDetails: {
          '@type': 'OfferShippingDetails',
          shippingRate: {
            '@type': 'MonetaryAmount',
            value: 0,
            currency: 'MAD',
          },
          shippingDestination: {
            '@type': 'DefinedRegion',
            addressCountry: 'MA',
          },
        },
        hasMerchantReturnPolicy: {
          '@type': 'MerchantReturnPolicy',
          applicableCountry: 'MA',
          returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
          merchantReturnDays: 7,
        },
      },
    };

    if (reviewCount > 0) {
      productSchema.aggregateRating = {
        '@type': 'AggregateRating',
        ratingValue: avgRating,
        reviewCount,
        bestRating: 5,
        worstRating: 1,
      };
    }

    if (prodReviews.length > 0) {
      productSchema.review = prodReviews.slice(0, 5).map((r) => ({
        '@type': 'Review',
        author: {
          '@type': 'Person',
          name: r.author,
        },
        reviewRating: {
          '@type': 'Rating',
          ratingValue: Number(r.rating) || 5,
          bestRating: 5,
          worstRating: 1,
        },
        reviewBody: r.comment,
        datePublished: r.date,
      }));
    }

    const breadcrumbSchema = {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: isFr ? 'Accueil' : 'الرئيسية',
          item: basePath,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: isFr ? catInfo.fr : catInfo.ar,
          item: basePath,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: selectedProduct.name,
          item: canonicalUrl,
        },
      ],
    };

    upsertJsonLd('noblewatch-dynamic-jsonld', {
      '@context': 'https://schema.org',
      '@graph': [productSchema, breadcrumbSchema],
    });

    return title;
  }

  // Homepage SEO
  const canonicalUrl = basePath;
  const title = isFr
    ? 'Noblewatch | Montres & Accessoires de Luxe au Maroc'
    : 'Noblewatch | متجر الساعات والإكسسوارات الفاخرة بالمغرب';
  const description = isFr
    ? 'Découvrez nos montres de luxe et accessoires homme & femme au Maroc avec Noblewatch. Garantie 1 an, livraison gratuite 0 DH et paiement à la livraison.'
    : 'تسوق أرقى ساعات اليد الفاخرة والإكسسوارات للرجال والنساء بالمغرب مع Noblewatch. جودة أصلية، ضمان سنة، توصيل مجاني 0 درهم والدفع عند الاستلام.';
  const heroImage = toAbsoluteUrl(
    settings?.heroImage || '/assets/watches_and_accessories_hero.jpg',
    origin
  );

  document.title = title;
  upsertCanonicalLink(canonicalUrl);
  upsertMetaTag('name', 'description', description);
  upsertMetaTag('property', 'og:type', 'website');
  upsertMetaTag('property', 'og:title', title);
  upsertMetaTag('property', 'og:description', description);
  upsertMetaTag('property', 'og:url', canonicalUrl);
  upsertMetaTag('property', 'og:image', heroImage);
  upsertMetaTag(
    'property',
    'og:image:alt',
    isFr ? 'Collection montres et accessoires Noblewatch Maroc' : 'تشكيلة ساعات وإكسسوارات Noblewatch الفاخرة بالمغرب'
  );
  upsertMetaTag('property', 'og:locale', isFr ? 'fr_MA' : 'ar_MA');
  upsertMetaTag('name', 'twitter:title', title);
  upsertMetaTag('name', 'twitter:description', description);
  upsertMetaTag('name', 'twitter:image', heroImage);

  const totalReviews = approvedReviews.length;
  const avgStoreRating =
    totalReviews > 0
      ? Number(
          (
            approvedReviews.reduce((acc, r) => acc + (Number(r.rating) || 5), 0) /
            totalReviews
          ).toFixed(1)
        )
      : 4.9;

  const storeEntity: Record<string, unknown> = {
    '@type': 'OnlineStore',
    name: storeName,
    url: canonicalUrl,
    logo: toAbsoluteUrl('/favicon.svg', origin),
    image: heroImage,
    description,
    areaServed: {
      '@type': 'Country',
      name: 'Morocco',
    },
    currenciesAccepted: 'MAD',
    paymentAccepted: 'Cash on Delivery',
  };

  if (settings?.whatsappNumber) {
    storeEntity.telephone = settings.whatsappNumber;
  }

  if (totalReviews > 0) {
    storeEntity.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: avgStoreRating,
      reviewCount: totalReviews,
      bestRating: 5,
      worstRating: 1,
    };
  }

  const websiteEntity = {
    '@type': 'WebSite',
    name: storeName,
    url: canonicalUrl,
    inLanguage: ['ar-MA', 'fr-MA'],
    potentialAction: {
      '@type': 'SearchAction',
      target: `${basePath}?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  const publishedProducts = products.filter((p) => p.isPublished).slice(0, 12);
  const itemListEntity =
    publishedProducts.length > 0
      ? {
          '@type': 'ItemList',
          name: isFr ? 'Montres et Accessoires Populaires' : 'أبرز الساعات والإكسسوارات الفاخرة',
          itemListElement: publishedProducts.map((p, idx) => ({
            '@type': 'ListItem',
            position: idx + 1,
            url: `${basePath}?product=${encodeURIComponent(p.id)}`,
            name: p.name,
          })),
        }
      : null;

  const faqs = Array.isArray(settings?.faqs) ? settings.faqs : [];
  const faqEntity =
    faqs.length > 0
      ? {
          '@type': 'FAQPage',
          mainEntity: faqs.map((faq) => ({
            '@type': 'Question',
            name: faq.question,
            acceptedAnswer: {
              '@type': 'Answer',
              text: faq.answer,
            },
          })),
        }
      : null;

  const graph: Record<string, unknown>[] = [storeEntity, websiteEntity];
  if (itemListEntity) graph.push(itemListEntity);
  if (faqEntity) graph.push(faqEntity);

  upsertJsonLd('noblewatch-dynamic-jsonld', {
    '@context': 'https://schema.org',
    '@graph': graph,
  });

  return title;
}
