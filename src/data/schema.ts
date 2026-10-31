import { SITE, business, areaGroups, areaCounties, type Service } from './site';
import type { Faq } from './faqs';

/**
 * JSON-LD for every page is one @graph. The business, website and services each
 * have one stable @id, and every other node points at them by reference, so
 * search engines see a single connected entity instead of separate copies.
 */
export const ids = {
  business: `${SITE}/#business`,
  website: `${SITE}/#website`,
  logo: `${SITE}/#logo`,
  service: (s: Service) => `${SITE}${s.href}#service`,
};

const ref = (id: string) => ({ '@id': id });

const areaServed = [
  ...areaGroups.flatMap((g) =>
    g.cities.map((c) => ({ '@type': 'City', name: `${c.replace(/ KS$/, '')}, ${g.state}` })),
  ),
  ...areaCounties.map((name) => ({ '@type': 'AdministrativeArea', name })),
];

/** Absolute image URLs are resolved in Base.astro, which can run getImage(). */
export const businessNode = (img: { logo: { src: string; width: number; height: number }; photo: string }) => ({
  // HVACBusiness is the most specific schema.org LocalBusiness subtype for duct and dryer vent cleaning
  '@type': 'HVACBusiness',
  '@id': ids.business,
  name: business.name,
  url: `${SITE}/`,
  logo: { '@type': 'ImageObject', '@id': ids.logo, url: img.logo.src, width: img.logo.width, height: img.logo.height },
  image: img.photo,
  telephone: business.telE164,
  foundingDate: '2017',
  address: {
    '@type': 'PostalAddress',
    streetAddress: business.street,
    addressLocality: business.city,
    addressRegion: business.region,
    postalCode: business.postalCode,
    addressCountry: 'US',
  },
  geo: { '@type': 'GeoCoordinates', latitude: business.geo.lat, longitude: business.geo.lng },
  hasMap: business.googleCidUrl,
  sameAs: [business.googleCidUrl, ...business.profiles],
  areaServed,
  openingHoursSpecification: business.hours.flatMap((h) =>
    'opens' in h ? [{ '@type': 'OpeningHoursSpecification', dayOfWeek: h.schemaDays, opens: h.opens, closes: h.closes }] : [],
  ),
  aggregateRating: { '@type': 'AggregateRating', ratingValue: business.rating, reviewCount: business.reviewCount, bestRating: 5 },
});

export const websiteNode = () => ({
  '@type': 'WebSite',
  '@id': ids.website,
  url: `${SITE}/`,
  name: 'Duct Hunt',
  alternateName: business.name,
  publisher: ref(ids.business),
  inLanguage: 'en-US',
});

export interface Crumb {
  name: string;
  href: string;
}

export const webPageNode = (url: string, title: string, description: string, image: string, crumbs: Crumb[]) => ({
  '@type': 'WebPage',
  '@id': `${url}#webpage`,
  url,
  name: title,
  description,
  isPartOf: ref(ids.website),
  about: ref(ids.business),
  primaryImageOfPage: { '@type': 'ImageObject', url: image },
  inLanguage: 'en-US',
  ...(crumbs.length > 1 ? { breadcrumb: ref(`${url}#breadcrumb`) } : {}),
});

export const breadcrumbNode = (url: string, crumbs: Crumb[]) => ({
  '@type': 'BreadcrumbList',
  '@id': `${url}#breadcrumb`,
  itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: `${SITE}${c.href}` })),
});

export const serviceNode = (s: Service) => ({
  '@type': 'Service',
  '@id': ids.service(s),
  name: s.name,
  serviceType: s.name,
  description: s.blurb,
  url: `${SITE}${s.href}`,
  provider: ref(ids.business),
  areaServed,
});

/** Only for Q&As rendered verbatim on the same page. */
export const faqPage = (url: string, faqs: Faq[]) => ({
  '@type': 'FAQPage',
  '@id': `${url}#faq`,
  isPartOf: ref(`${url}#webpage`),
  mainEntity: faqs.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
});

/** Derek Craig, owner. One @id so every post points at the same person. */
export const authorNode = () => ({
  '@type': 'Person',
  '@id': `${SITE}/#derek-craig`,
  name: business.owner,
  jobTitle: 'Owner',
  worksFor: ref(ids.business),
});

const blogId = `${SITE}/blog/#blog`;

export const blogNode = (url: string, posts: { url: string; headline: string; datePublished: string }[]) => ({
  '@type': 'Blog',
  '@id': blogId,
  url,
  name: 'Duct Hunt Blog',
  isPartOf: ref(ids.website),
  publisher: ref(ids.business),
  mainEntityOfPage: ref(`${url}#webpage`),
  inLanguage: 'en-US',
  blogPost: posts.map((p) => ({ '@type': 'BlogPosting', '@id': `${p.url}#article`, headline: p.headline, url: p.url, datePublished: p.datePublished })),
});

export const blogPostingNode = (p: {
  url: string;
  headline: string;
  description: string;
  image: string;
  datePublished: string;
  dateModified: string;
}) => ({
  '@type': 'BlogPosting',
  '@id': `${p.url}#article`,
  headline: p.headline,
  description: p.description,
  image: [p.image],
  datePublished: p.datePublished,
  dateModified: p.dateModified,
  author: ref(`${SITE}/#derek-craig`),
  publisher: ref(ids.business),
  mainEntityOfPage: ref(`${p.url}#webpage`),
  isPartOf: { '@type': 'Blog', '@id': blogId, name: 'Duct Hunt Blog', url: `${SITE}/blog/` },
  url: p.url,
  inLanguage: 'en-US',
});
