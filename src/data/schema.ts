import { business, areaGroups } from './site';
import type { Faq } from './faqs';

const address = {
  '@type': 'PostalAddress',
  addressLocality: business.city,
  addressRegion: business.region,
  addressCountry: 'US',
};

const provider = { '@type': 'LocalBusiness', name: business.name };

export const localBusiness = (extra: Record<string, unknown> = {}) => ({
  '@type': 'LocalBusiness',
  name: business.name,
  telephone: business.telE164,
  email: business.email,
  address,
  areaServed: 'Kansas City metro',
  openingHoursSpecification: business.hours.flatMap((h) =>
    'opens' in h ? [{ '@type': 'OpeningHoursSpecification', dayOfWeek: h.schemaDays, opens: h.opens, closes: h.closes }] : [],
  ),
  aggregateRating: { '@type': 'AggregateRating', ratingValue: business.rating, reviewCount: String(business.reviewCount) },
  ...extra,
});

export const localBusinessWithCities = () =>
  localBusiness({
    areaServed: areaGroups.flatMap((g) => g.cities).map((name) => ({ '@type': 'City', name })),
  });

export const service = (name: string, serviceType: string) => ({
  '@type': 'Service',
  name,
  serviceType,
  provider,
  areaServed: ['Kansas City', 'North Kansas City'],
});

export const faqPage = (faqs: Faq[]) => ({
  '@type': 'FAQPage',
  mainEntity: faqs.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
});

export const graph = (...nodes: object[]) => ({ '@context': 'https://schema.org', '@graph': nodes });
