import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/**
 * Blog posts: one Markdown file per post in src/content/blog/.
 * Every file in the folder is published on the next build, so commit a post on
 * the day it should go live. Files starting with "_" are ignored.
 */
const blog = defineCollection({
  loader: glob({ pattern: ['**/*.md', '!**/_*.md'], base: './src/content/blog' }),
  schema: ({ image }) =>
    z
      .object({
        title: z.string().min(1),
        /** URL slug: /blog/<slug>/. Lowercase letters, numbers and hyphens. */
        slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
        /** Publish date, YYYY-MM-DD */
        date: z.coerce.date(),
        /** Optional last-updated date, YYYY-MM-DD (defaults to date) */
        updated: z.coerce.date().optional(),
        /** Meta description and the excerpt on /blog/ */
        description: z.string().min(1),
        /** Optional photo, relative to the .md file, e.g. ./images/my-post.jpg */
        image: image().optional(),
        imageAlt: z.string().optional(),
        draft: z.boolean().optional(),
      })
      .refine((d) => !d.image || !!d.imageAlt, { message: 'imageAlt is required when image is set', path: ['imageAlt'] }),
});

export const collections = { blog };
