import type { ImageMetadata } from 'astro';
import { getImage } from 'astro:assets';
import hero from '../assets/hero.webp';
import poster from '../assets/dryer-vent-poster.jpg';

type Format = 'avif' | 'webp';

const quality: Record<Format, number> = { avif: 54, webp: 72 };

export interface SourceSet {
  type: string;
  srcset: string;
}

export interface ResponsiveImage {
  sources: SourceSet[];
  /** WebP fallback used as the img src. */
  src: string;
  width: number;
  height: number;
  /** AVIF candidate preloaded for the mobile LCP width. */
  preloadHref: string;
  avifSrcset: string;
}

async function sourcesFor(src: ImageMetadata, widths: number[], preloadWidth: number): Promise<ResponsiveImage> {
  const formats: Format[] = ['avif', 'webp'];
  const sources: SourceSet[] = [];
  let preloadHref = '';
  for (const format of formats) {
    const imgs = await Promise.all(
      widths.map((width) => getImage({ src, width, format, quality: quality[format] })),
    );
    sources.push({
      type: `image/${format}`,
      srcset: imgs.map((img) => `${img.src} ${img.attributes.width}w`).join(', '),
    });
    if (format === 'avif') {
      const pick = imgs.find((img) => img.attributes.width === preloadWidth) ?? imgs[0];
      preloadHref = pick.src;
    }
  }
  const fallback = await getImage({ src, width: preloadWidth, format: 'webp', quality: quality.webp });
  return {
    sources,
    src: fallback.src,
    width: fallback.attributes.width,
    height: fallback.attributes.height,
    preloadHref,
    avifSrcset: sources[0].srcset,
  };
}

/** Full-bleed page hero (quote and interior pages). Mobile Lighthouse picks 768w. */
export const heroSizes = '100vw';
export const pageHero = () => sourcesFor(hero, [640, 768, 1280, 1920], 768);

/**
 * Homepage dryer-vent still, already cropped to the square the lens shows.
 * The lens is about 100vw − 108px of chrome on a phone, capped at 560px.
 * Mobile Lighthouse picks 560w.
 */
export const posterSizes = '(max-width: 720px) calc(100vw - 108px), 560px';
export const homePoster = () => sourcesFor(poster, [400, 560, 720], 560);
