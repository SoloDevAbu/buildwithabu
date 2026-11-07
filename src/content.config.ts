import { defineCollection } from "astro:content"
import { glob } from "astro/loaders"
import { z } from "astro/zod"

const guides = defineCollection({
  loader: glob({ pattern: "*.mdx", base: "./src/content/guides" }),
  schema: z.object({
    title: z.string(),
    description: z.string().max(170),
    answer: z.string(),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
  }),
})

export const collections = { guides }
