import type { BrandCopy, CarCopy } from "./copy";

// Arabic marketing copy for cars and brands, the same shapes as copy.ts. Facts and numbers must
// match cars.ts and rules.ts (interpolate them, as copy.ts does). Missing entries fall back to English.

export const carCopyAr: Record<string, CarCopy | undefined> = {};

export const brandCopyAr: Record<string, BrandCopy | undefined> = {};
