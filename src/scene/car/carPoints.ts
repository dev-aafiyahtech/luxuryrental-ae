import * as THREE from "three";
import { profiles } from "./profiles";
import { buildCarWithCount, type CarBuild } from "./buildCar";
import { buildCarFromImage } from "./imageCar";
import type { ParticleSet } from "./particleSet";
import * as glsl from "../shaders";
import type { StageCar } from "../types";

// One particle car on the stage, with its own uniforms so two cars can be on stage at once
// while one dissolves and the next one forms. The points start empty: the stage fills them
// once the car's particle set (sampled from its image) has loaded, or with the procedural
// body-style car if there is no set or it fails to load.

export interface CarPoints {
  slug: string;
  /** Null until the particles are ready. */
  build: CarBuild | null;
  /** Stage time when the build arrived (for the fade-in), −1 until the stage has seen it. */
  readyAt: number;
  points: THREE.Points;
  uniforms: {
    uExplode: { value: number };
    uForm: { value: number };
    uHead: { value: number };
    uTime: { value: number };
    uSize: { value: number };
    uPR: { value: number };
    uFade: { value: number };
    uPaint: { value: number };
    uXray: { value: number };
  };
  setBuild(build: CarBuild): void;
  dispose(): void;
}

/** A stable seed per car, so the same car always draws the same sculpture. */
function seedOf(slug: string): number {
  let h = 2166136261;
  for (let i = 0; i < slug.length; i++) h = Math.imul(h ^ slug.charCodeAt(i), 16777619);
  return (h >>> 0) % 100000;
}

/** The car's sculpture: from its image when there is a particle set, else from its body style. */
export function buildFor(car: StageCar, set: ParticleSet | null, particles: number): CarBuild {
  const count = Math.min(particles, 12_000);
  const seed = car.slug === "lamborghini-revuelto" ? 1337 : seedOf(car.slug);
  const profile = profiles[car.body];
  if (set) return buildCarFromImage(set, { engine: profile.engine ?? "mid", engineLayout: car.engineLayout, hybrid: car.hybrid, drivetrain: car.drivetrain, seed }, count);
  return buildCarWithCount({ profile, engineLayout: car.engineLayout, hybrid: car.hybrid, drivetrain: car.drivetrain, seed }, count);
}

export function createCarPoints(slug: string, shared: { uTime: { value: number }; uPR: { value: number } }, pointSize: number): CarPoints {
  const g = new THREE.BufferGeometry();
  const uniforms = {
    uExplode: { value: 0 },
    uForm: { value: 0 },
    uHead: { value: 0 },
    uTime: shared.uTime,
    uSize: { value: pointSize },
    uPR: shared.uPR,
    uFade: { value: 1 },
    uPaint: { value: 0 },
    uXray: { value: 0 },
  };
  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms,
    vertexShader: glsl.car.vertex,
    fragmentShader: glsl.car.fragment,
  });
  const points = new THREE.Points(g, material);
  points.frustumCulled = false;
  points.visible = false;
  const self: CarPoints = {
    slug,
    build: null,
    readyAt: -1,
    points,
    uniforms,
    setBuild(build) {
      g.setAttribute("position", new THREE.BufferAttribute(build.position, 3));
      g.setAttribute("aExplode", new THREE.BufferAttribute(build.explode, 3));
      g.setAttribute("aScatter", new THREE.BufferAttribute(build.scatter, 3));
      g.setAttribute("aColor", new THREE.BufferAttribute(build.color, 3));
      g.setAttribute("aPaint", new THREE.BufferAttribute(build.paint, 3));
      g.setAttribute("aComp", new THREE.BufferAttribute(build.comp, 1));
      g.setAttribute("aRnd", new THREE.BufferAttribute(build.rnd, 1));
      g.setAttribute("aBright", new THREE.BufferAttribute(build.bright, 1));
      g.setDrawRange(0, build.count);
      // Image cars keep their body in place when exploded and fade its panels to line-work;
      // their points are spread over surfaces rather than lines, so they draw a touch larger.
      uniforms.uXray.value = build.source === "image" ? 1 : 0;
      uniforms.uSize.value = pointSize * (build.source === "image" ? 1.12 : 1);
      self.build = build;
      self.readyAt = -1;
    },
    dispose() {
      points.removeFromParent();
      g.dispose();
      material.dispose();
    },
  };
  return self;
}
