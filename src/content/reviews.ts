import { site, type ReviewPlatform, type ReviewProfile } from "./site";

/** The deployment, as far as review badges care: pass `process.env.NODE_ENV` and `process.env.VERCEL_ENV`. */
export type DeployEnv = { NODE_ENV?: string; VERCEL_ENV?: string };

/** True on Vercel preview deployments and in `next dev`, never on a production deployment or build. */
export function isPreviewEnv(env: DeployEnv): boolean {
  if (env.VERCEL_ENV === "production") return false;
  return env.VERCEL_ENV === "preview" || env.NODE_ENV === "development";
}

/**
 * The review profile a footer badge shows, or null for no badge. Real data (`site.reviews`) always
 * wins. The illustrative `site.previewReviews` only fill in on preview deployments and in local dev,
 * so a production build (Vercel production, or a local `next build` with no VERCEL_ENV) never
 * shows an estimated rating.
 */
export function shownReview(platform: ReviewPlatform, env: DeployEnv, data: Pick<typeof site, "reviews" | "previewReviews"> = site): ReviewProfile | null {
  const real = data.reviews[platform];
  if (real) return real;
  return isPreviewEnv(env) ? data.previewReviews[platform] : null;
}
