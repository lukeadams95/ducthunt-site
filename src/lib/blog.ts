import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'blog'>;

/** Published posts, newest first. */
export const getPosts = async (): Promise<Post[]> =>
  (await getCollection('blog', (p) => !p.data.draft)).sort(
    (a, b) => b.data.date.valueOf() - a.data.date.valueOf() || a.data.title.localeCompare(b.data.title),
  );

/** YYYY-MM-DD (dates are stored as UTC midnight, so format in UTC) */
export const isoDate = (d: Date) => d.toISOString().slice(0, 10);

export const displayDate = (d: Date) =>
  d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
