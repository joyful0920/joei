import { z } from "zod";

export const MovieSchema = z.object({
  id: z.number(),
  title: z.string().nullable().optional().default(""),
  original_title: z.string().nullable().optional().default(""),
  original_language: z.string().nullable().optional().default(""),
  overview: z.string().nullable().optional().default(""),
  poster_path: z.string().nullable().optional(),
  backdrop_path: z.string().nullable().optional(),
  release_date: z.string().nullable().optional().default(""),
  vote_average: z.number().nullable().optional().default(0),
  vote_count: z.number().nullable().optional().default(0),
  genre_ids: z.array(z.number()).nullable().optional().default([]),
  popularity: z.number().nullable().optional().default(0),
});
export type Movie = z.infer<typeof MovieSchema>;

export const PaginatedMoviesSchema = z.object({
  page: z.number(),
  results: z.array(MovieSchema),
  total_pages: z.number(),
  total_results: z.number(),
  dates: z
    .object({
      maximum: z.string().optional(),
      minimum: z.string().optional(),
    })
    .optional(),
});
export type PaginatedMovies = z.infer<typeof PaginatedMoviesSchema>;

export const GenreSchema = z.object({
  id: z.number(),
  name: z.string(),
});

export const MovieDetailSchema = MovieSchema.extend({
  runtime: z.number().nullable().optional(),
  genres: z.array(GenreSchema).nullable().optional().default([]),
  tagline: z.string().nullable().optional().default(""),
  status: z.string().nullable().optional().default(""),
  homepage: z.string().nullable().optional().default(""),
});
export type MovieDetail = z.infer<typeof MovieDetailSchema>;

export const VideoSchema = z.object({
  id: z.string(),
  key: z.string(),
  name: z.string().default(""),
  site: z.string().default(""),
  type: z.string().default(""),
  official: z.boolean().optional().default(false),
  iso_639_1: z.string().optional().default(""),
  published_at: z.string().optional().default(""),
});
export type Video = z.infer<typeof VideoSchema>;

export const VideosResponseSchema = z.object({
  id: z.number(),
  results: z.array(VideoSchema),
});
export type VideosResponse = z.infer<typeof VideosResponseSchema>;
