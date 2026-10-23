import * as THREE from "three";
import { profiles } from "./profiles";
import { buildCarWithCount, type CarBuild } from "./buildCar";
import * as glsl from "../shaders";
import type { StageCar } from "../types";

// One particle car on the stage: geometry from buildCar() plus its own uniforms, so two
// cars can be on stage at once while one dissolves and the next one forms.

export interface CarPoints {
  slug: string;
  build: CarBuild;
  points: THREE.Points;
  uniforms: {
    uExplode: { value: number };
    uForm: { value: number };
    uHead: { value: number };
    uTime: { value: number };
    uSize: { value: number };
    uPR: { value: number };
    uFade: { value: number };
  };
  dispose(): void;
}

/** A stable seed per car, so the same car always draws the same sculpture. */
function seedOf(slug: string): number {
  let h = 2166136261;
  for (let i = 0; i < slug.length; i++) h = Math.imul(h ^ slug.charCodeAt(i), 16777619);
  return (h >>> 0) % 100000;
}

export function createCarPoints(car: StageCar, particles: number, shared: { uTime: { value: number }; uPR: { value: number } }, pointSize: number): CarPoints {
  const build = buildCarWithCount(
    { profile: profiles[car.body], engineLayout: car.engineLayout, hybrid: car.hybrid, drivetrain: car.drivetrain, seed: car.slug === "lamborghini-revuelto" ? 1337 : seedOf(car.slug) },
    Math.min(particles, 12_000),
  );
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(build.position, 3));
  g.setAttribute("aExplode", new THREE.BufferAttribute(build.explode, 3));
  g.setAttribute("aScatter", new THREE.BufferAttribute(build.scatter, 3));
  g.setAttribute("aColor", new THREE.BufferAttribute(build.color, 3));
  g.setAttribute("aComp", new THREE.BufferAttribute(build.comp, 1));
  g.setAttribute("aRnd", new THREE.BufferAttribute(build.rnd, 1));
  g.setAttribute("aBright", new THREE.BufferAttribute(build.bright, 1));
  const uniforms = {
    uExplode: { value: 0 },
    uForm: { value: 0 },
    uHead: { value: 0 },
    uTime: shared.uTime,
    uSize: { value: pointSize },
    uPR: shared.uPR,
    uFade: { value: 1 },
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
  return {
    slug: car.slug,
    build,
    points,
    uniforms,
    dispose() {
      points.removeFromParent();
      g.dispose();
      material.dispose();
    },
  };
}
