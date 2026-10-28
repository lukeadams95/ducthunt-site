import type { ImageMetadata } from 'astro';
import svcAirDuct from '../assets/svc-air-duct.jpg';
import svcDryerVent from '../assets/svc-dryer-vent.webp';

/** Production origin (www; the apex 301s here). Keep in sync with `site` in astro.config.mjs. */
export const SITE = 'https://www.ducthunt.com';

export const business = {
  name: 'Duct Hunt LLC',
  owner: 'Derek Craig',
  phone: '(816) 655-8105',
  tel: 'tel:+18166558105',
  telE164: '+1-816-655-8105',
  email: 'ducthuntllc@gmail.com',
  city: 'North Kansas City',
  region: 'MO',
  rating: '4.9',
  reviewCount: 54,
  googleUrl: 'https://maps.app.goo.gl/PBD3ime9AN7Ch6dj8',
  /** Canonical Google Maps URL for the Business Profile (CID from the profile's place ID); used as schema.org sameAs/hasMap */
  googleCidUrl: 'https://www.google.com/maps?cid=15023503640910196470',
  /** Map pin of the Google Business Profile */
  geo: { lat: 39.147813, lng: -94.5762644 },
  /** Weekly hours, shown in the footer and in schema.org data */
  hours: [
    { days: 'Monday – Friday', time: '8 AM – 7 PM', schemaDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '08:00', closes: '19:00' },
    { days: 'Saturday – Sunday', time: 'Closed' },
  ],
  mapEmbed:
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3094.193352238411!2d-94.5787695206543!3d39.147583700000006!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x87c0f0b3325532b3%3A0xd07e34f6a63d6ef6!2sDuct%20Hunt!5e0!3m2!1sen!2sph!4v1791612120683!5m2!1sen!2sph',
};

export type PageKey =
  | 'home'
  | 'services'
  | 'duct'
  | 'dryer'
  | 'reviews'
  | 'why'
  | 'area'
  | 'faq'
  | 'quote'
  | 'blog'
  | 'post'
  | 'notfound';

export interface Service {
  key: 'duct' | 'dryer';
  /** Value used in ?service= on the quote page */
  slug: string;
  num: string;
  name: string;
  href: string;
  blurb: string;
  photo: string;
  img: ImageMetadata;
  pos: string;
  bullets: string[];
}

export const services: Service[] = [
  {
    key: 'duct',
    slug: 'air-duct',
    num: '01',
    name: 'Air Duct Cleaning',
    href: '/services/air-duct-cleaning/',
    blurb: 'Remove dust, debris and buildup from your supply and return ducts. Performed to NADCA standards.',
    photo: 'Portable duct cleaning vacuum with its hose run into a Kansas City home',
    img: svcAirDuct,
    pos: '50% 60%',
    bullets: ['Supply and return vents', 'Main trunk lines and blower area', 'Before & after photos', 'Performed to NADCA standards'],
  },
  {
    key: 'dryer',
    slug: 'dryer-vent',
    num: '02',
    name: 'Dryer Vent Cleaning',
    href: '/services/dryer-vent-cleaning/',
    blurb: 'Clear lint from the full dryer vent line so your dryer runs better and safer.',
    photo: 'Technician blowing lint out of an exterior dryer vent hood',
    img: svcDryerVent,
    pos: '50% 45%',
    bullets: ['Full vent line and dryer duct', 'Lint buildup removal', 'Flat-fee pricing', 'Helps your dryer run faster and safer'],
  },
];

export const serviceByKey = (k: Service['key']) => services.find((s) => s.key === k)!;

/** Breadcrumb trail per page, mirroring the header nav. Drives the visible breadcrumb and BreadcrumbList schema. */
export const crumbsFor = (page: PageKey): { name: string; href: string }[] => {
  const home = { name: 'Home', href: '/' };
  const svcs = { name: 'Services', href: '/services/' };
  const leaf: Partial<Record<PageKey, { name: string; href: string }[]>> = {
    services: [svcs],
    duct: [svcs, { name: 'Air Duct Cleaning', href: '/services/air-duct-cleaning/' }],
    dryer: [svcs, { name: 'Dryer Vent Cleaning', href: '/services/dryer-vent-cleaning/' }],
    reviews: [{ name: 'Reviews', href: '/reviews/' }],
    why: [{ name: 'Why Duct Hunt', href: '/why-duct-hunt/' }],
    area: [{ name: 'Service Area', href: '/service-area/' }],
    faq: [{ name: 'FAQ', href: '/faq/' }],
    quote: [{ name: 'Free Quote', href: '/quote/' }],
    blog: [{ name: 'Blog', href: '/blog/' }],
  };
  return page === 'home' || page === 'notfound' ? [] : [home, ...(leaf[page] ?? [])];
};

/** Options for the "Service needed" field on every quote form. */
export const serviceOptions = ['Air Duct Cleaning', 'Dryer Vent Cleaning', 'Not sure yet'];
export const customerTypes = ['Homeowner', 'Builder', 'Remodeler', 'Flipper'];

export const quoteChecks = [
  'Upfront pricing',
  'No hidden fees',
  'Before & after photos',
  'All work guaranteed',
  'Often next-day availability',
  'Owner does every job',
];

/** Placeholder list from the design. Confirm with Derek before launch. */
export const homeCities = [
  'Kansas City, MO',
  'Kansas City, KS',
  'Overland Park',
  'Olathe',
  "Lee's Summit",
  'Independence',
  'Shawnee',
  'Lenexa',
  'Blue Springs',
  'Liberty',
  'Raytown',
  'Gladstone',
];

export const areaGroups = [
  {
    t: 'Northland (MO)',
    state: 'MO',
    cities: ['North Kansas City', 'Kansas City North', 'Gladstone', 'Liberty', 'Parkville', 'Riverside', 'Platte City', 'Kearney', 'Smithville'],
  },
  {
    t: 'Kansas City & East (MO)',
    state: 'MO',
    cities: ['Kansas City', 'Independence', 'Raytown', "Lee's Summit", 'Blue Springs', 'Grandview', 'Belton'],
  },
  {
    t: 'Kansas Side (KS)',
    state: 'KS',
    cities: ['Kansas City KS', 'Overland Park', 'Olathe', 'Lenexa', 'Shawnee', 'Leawood', 'Prairie Village', 'Mission'],
  },
];

export const areaCounties = ['Clay County, MO', 'Platte County, MO', 'Jackson County, MO', 'Wyandotte County, KS', 'Johnson County, KS'];

export const footerCities =
  "North Kansas City, Kansas City, Independence, Lee's Summit, Liberty, Gladstone, Overland Park, Olathe, Lenexa, Shawnee.";
