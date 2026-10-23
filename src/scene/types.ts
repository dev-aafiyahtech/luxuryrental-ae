import type { BodyStyle, CarSpecs } from "@/content/types";

/** Scroll progress of the four homepage chapters, each 0 → 1 across its chapter. */
export interface ChapterState {
  c1: number;
  c2: number;
  c3: number;
  c4: number;
}

/** Final readable state of each chapter (reduced motion, and the rail's snap targets). */
export const SNAP: readonly ChapterState[] = [
  { c1: 0.06, c2: 0, c3: 0, c4: 0 },
  { c1: 1, c2: 0.55, c3: 0, c4: 0 },
  { c1: 1, c2: 1, c3: 0.7, c4: 0 },
  { c1: 1, c2: 1, c3: 1, c4: 1 },
];

/** What the particle sculpture needs to know about a car. */
export interface StageCar {
  slug: string;
  body: BodyStyle;
  engineLayout: CarSpecs["engineLayout"];
  hybrid: boolean;
  drivetrain: CarSpecs["drivetrain"];
}

/** Device tier: "high" desktop GPU, "low" phones and small screens, "static" no WebGL at all. */
export type Tier = "high" | "low" | "static";

export type CalloutPart = "cabin" | "body" | "wheels" | "powertrain";
