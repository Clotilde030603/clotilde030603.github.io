import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const posts = defineCollection({
  loader: glob({ base: './src/content/posts', pattern: '*.md' }),
  schema: z.object({
    title: z.string().trim().min(1).max(180),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    summary: z.string().trim().max(500).default(''),
    category: z.string().trim().min(1).optional(),
    tags: z.array(z.string().trim().min(1).max(40).regex(/^[^/]+$/)).max(20).default([]),
    pinned: z.boolean().default(false),
    draft: z.boolean().default(false),
    sourceUrl: z.url().optional(),
  }),
});

const about = defineCollection({
  loader: glob({ base: './src/content/about', pattern: '*.md' }),
  schema: z.object({ title: z.string().trim().min(1).default('소개') }),
});

export const collections = { posts, about };
