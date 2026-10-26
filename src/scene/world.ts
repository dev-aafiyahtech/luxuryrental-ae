import * as THREE from "three";
import { mulberry } from "./math";
import * as glsl from "./shaders";
import { BURJ_H, BURJ_TIP, COAST, LAKE, PLOTS, SZR, buildBurj, buildSkyline, coastX } from "./dubai";
import type { Budget } from "./tier";

// The night city around the car, ported from the prototype's initGL(): sky dome with desert
// haze, stars, instanced towers with lit windows, aviation beacons, streets with traffic, the
// helipad/road/studio floor and the Velocity Tunnel. The city reads as Dubai (dubai.ts): the
// Burj Khalifa at the centre, Sheikh Zayed Road's tower corridor, Emirates Towers, the Museum
// of the Future, the Address Downtown, the Marina with Cayan Tower and the Burj Al Arab.

/** The helipad roof the car lands on, and its height. */
export const PAD = new THREE.Vector3(46, 0, 64);
export const PAD_H = 58;
/** Car centre on the roof. */
export const C = new THREE.Vector3(PAD.x, PAD_H, PAD.z);

export interface World {
  sky: THREE.Mesh;
  stars: THREE.Points;
  city: THREE.InstancedMesh;
  /** The Burj Khalifa (with its glow and tip light) and the other landmarks. */
  tall: THREE.Group;
  beacons: THREE.Points;
  ground: THREE.Mesh;
  floor: THREE.Mesh;
  streaks: THREE.LineSegments;
  common: {
    uCity: { value: number };
    uTime: { value: number };
    uFogD: { value: number };
    uFogC: { value: THREE.Vector3 };
    uCam: { value: THREE.Vector3 };
  };
  floorU: { uPad: { value: number }; uRoad: { value: number }; uStudio: { value: number }; uHead: { value: number }; uTravel: { value: number } };
  streakU: { uTravel: { value: number }; uSpeed: { value: number }; uOpacity: { value: number }; uLen: { value: number } };
  /** Point-size uniforms that follow the renderer's pixel ratio. */
  prUniforms: { value: number }[];
}

const additive = { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending } as const;

export function buildWorld(scene: THREE.Scene, camera: THREE.PerspectiveCamera, budget: Budget, pixelRatio: number): World {
  const rand = mulberry(7);
  const common = {
    uCity: { value: 1 },
    uTime: { value: 0 },
    uFogD: { value: 0.0021 },
    uFogC: { value: new THREE.Vector3(0.03, 0.075, 0.075) },
    uCam: { value: camera.position },
  };
  const prUniforms: { value: number }[] = [];
  const pr = () => {
    const u = { value: pixelRatio };
    prUniforms.push(u);
    return u;
  };

  // Sky dome
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(1000, 32, 16),
    new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, depthTest: false, uniforms: { uCity: common.uCity }, vertexShader: glsl.sky.vertex, fragmentShader: glsl.sky.fragment }),
  );
  sky.renderOrder = -10;
  sky.frustumCulled = false;
  scene.add(sky);

  // Stars
  const nst = budget.stars;
  const stPos = new Float32Array(nst * 3);
  const stPh = new Float32Array(nst);
  for (let i = 0; i < nst; i++) {
    const th = rand() * Math.PI * 2, y = 0.12 + rand() * 0.88, r = Math.sqrt(1 - y * y);
    stPos.set([Math.cos(th) * r * 900, y * 900, Math.sin(th) * r * 900], i * 3);
    stPh[i] = rand();
  }
  const stG = new THREE.BufferGeometry();
  stG.setAttribute("position", new THREE.BufferAttribute(stPos, 3));
  stG.setAttribute("aPh", new THREE.BufferAttribute(stPh, 1));
  const stars = new THREE.Points(stG, new THREE.ShaderMaterial({ ...additive, uniforms: { uCity: common.uCity, uTime: common.uTime, uPR: pr() }, vertexShader: glsl.stars.vertex, fragmentShader: glsl.stars.fragment }));
  stars.frustumCulled = false;
  scene.add(stars);

  // City
  const towerMat = (seed: number) => new THREE.ShaderMaterial({ uniforms: { ...common, uSeedFallback: { value: seed } }, vertexShader: glsl.tower.vertex, fragmentShader: glsl.tower.fragment });
  let towers: [number, number, number, number, number][] = [];
  const R = budget.cityRadius, SP = 14;
  for (let i = -R; i <= R; i++) {
    for (let k = -R; k <= R; k++) {
      const x = i * SP, z = k * SP, dist = Math.hypot(x, z);
      if (dist < 24 || dist > R * SP) continue;
      if (Math.abs(x - PAD.x) < 9 && Math.abs(z - PAD.z) < 9) continue;
      if (rand() < 0.1) continue;
      const fall = Math.max(0.12, 1 - dist / (R * SP));
      let h = 5 + Math.pow(rand(), 2) * 130 * fall + rand() * 8;
      if (Math.hypot(x - PAD.x, z - PAD.z) < 44) h = Math.min(h, PAD_H - 10 - rand() * 24);
      towers.push([x + (rand() - 0.5) * 2, z + (rand() - 0.5) * 2, 6 + rand() * 4, 6 + rand() * 4, Math.max(4, h)]);
    }
  }
  // Dubai's layout over the same random draw (so the helipad's surroundings don't change):
  // clear the landmark plots, the lake, Sheikh Zayed Road's corridor and the sea; between the
  // road and the coast the city is low-rise, as in Jumeirah.
  towers = towers.filter(([x, z, w]) => {
    if (PLOTS.some(([px, pz, pr]) => Math.hypot(x - px, z - pz) < pr + w / 2)) return false;
    if (Math.hypot((x - LAKE.x) / (LAKE.rx + 5), (z - LAKE.z) / (LAKE.rz + 5)) < 1) return false;
    if (Math.abs(x - SZR.x) < SZR.rows + 9) return false;
    return x < coastX(z) - 8;
  });
  for (const t of towers) if (t[0] > SZR.x) t[4] = Math.min(t[4], 4 + (t[4] % 9));
  // A ragged edge, thinning out into the low-rise districts (the ground's carpet of lights).
  const edge = R * SP;
  towers = towers.filter(([x, z]) => {
    const d = Math.hypot(x, z) / edge;
    const n = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453;
    return d < 0.68 || n - Math.floor(n) > ((d - 0.68) / 0.32) * 0.9;
  });
  const skyline = buildSkyline({ x: PAD.x, z: PAD.z, h: PAD_H }, budget.cityRadius >= 18 ? 1 : 0.75);
  towers.push(...skyline.towers);
  towers.push([PAD.x, PAD.z, 16, 16, PAD_H]);
  const boxG = new THREE.BoxGeometry(1, 1, 1);
  boxG.translate(0, 0.5, 0);
  const seeds = new Float32Array(towers.length);
  const city = new THREE.InstancedMesh(boxG, towerMat(0.5), towers.length);
  const m4 = new THREE.Matrix4();
  towers.forEach((t, k) => {
    m4.makeScale(t[2], t[4], t[3]);
    m4.setPosition(t[0], 0, t[1]);
    city.setMatrixAt(k, m4);
    seeds[k] = rand();
  });
  boxG.setAttribute("aSeed", new THREE.InstancedBufferAttribute(seeds, 1));
  city.frustumCulled = false;
  scene.add(city);

  // The Burj Khalifa and the landmarks (procedural, lit in the palette by the facade shader)
  const tall = new THREE.Group();
  const gold = new THREE.Vector3(0.93, 0.8, 0.56), ivory = new THREE.Vector3(0.97, 0.93, 0.86);
  const facadeMat = (o: { glass: [number, number, number]; grid: [number, number, number, number]; glow: [number, number, number, number]; misc: [number, number, number]; fog: number }) =>
    new THREE.ShaderMaterial({
      uniforms: {
        ...common,
        uFogK: { value: o.fog },
        uGlass: { value: new THREE.Vector3(...o.glass) },
        uGold: { value: gold },
        uIvory: { value: ivory },
        uGrid: { value: new THREE.Vector4(...o.grid) },
        uGlow: { value: new THREE.Vector4(...o.glow) },
        uMisc: { value: new THREE.Vector3(...o.misc) },
      },
      vertexShader: glsl.facade.vertex,
      fragmentShader: glsl.facade.fragment,
    });
  const burj = new THREE.Mesh(buildBurj(), facadeMat({ glass: [0.034, 0.07, 0.074], grid: [1.3, 1.6, 0.36, 0.85], glow: [0.2, 0.6, 0.5, 0.36], misc: [0.22, 1, 236], fog: 0.45 }));
  const landmarks = new THREE.Mesh(skyline.geometry, facadeMat({ glass: [0.026, 0.058, 0.06], grid: [1.4, 1.6, 0.4, 0.55], glow: [0.05, 0.45, 0.32, 0.1], misc: [0.08, 0.8, 9999], fog: 0.55 }));
  burj.frustumCulled = landmarks.frustumCulled = false;
  const haloG = new THREE.PlaneGeometry(2, 1);
  haloG.translate(0, 0.5, 0);
  const halo = new THREE.Mesh(
    haloG,
    new THREE.ShaderMaterial({
      ...additive,
      uniforms: { uCity: common.uCity, uFogD: common.uFogD, uCenter: { value: new THREE.Vector3(0, 0, 0) }, uSize: { value: new THREE.Vector2(78, BURJ_H * 1.15) }, uBack: { value: 46 }, uStrength: { value: 0.085 }, uColor: { value: gold } },
      vertexShader: glsl.halo.vertex,
      fragmentShader: glsl.halo.fragment,
    }),
  );
  halo.frustumCulled = false;
  halo.renderOrder = -1;
  const tipG = new THREE.BufferGeometry();
  tipG.setAttribute("position", new THREE.Float32BufferAttribute([BURJ_TIP.x, BURJ_TIP.y, BURJ_TIP.z], 3));
  const tip = new THREE.Points(tipG, new THREE.ShaderMaterial({ ...additive, uniforms: { uCity: common.uCity, uTime: common.uTime, uPR: pr() }, vertexShader: glsl.tipLight.vertex, fragmentShader: glsl.tipLight.fragment }));
  tip.frustumCulled = false;
  tall.add(halo, burj, landmarks, tip);
  scene.add(tall);

  // Aviation lights on the tallest roofs and the landmarks (the Burj has its own tip light)
  const beac: number[] = [...skyline.beacons];
  towers.forEach((t) => {
    if (t[4] > 46) beac.push(t[0], t[4] + 0.6, t[1]);
  });
  const bG = new THREE.BufferGeometry();
  bG.setAttribute("position", new THREE.Float32BufferAttribute(beac, 3));
  bG.setAttribute("aPh", new THREE.Float32BufferAttribute(Array.from({ length: beac.length / 3 }, () => rand()), 1));
  const beacons = new THREE.Points(bG, new THREE.ShaderMaterial({ ...additive, uniforms: { uCity: common.uCity, uTime: common.uTime, uPR: pr() }, vertexShader: glsl.beacons.vertex, fragmentShader: glsl.beacons.fragment }));
  beacons.frustumCulled = false;
  scene.add(beacons);

  // Streets with moving traffic
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(3200, 3200),
    new THREE.ShaderMaterial({
      uniforms: { ...common, uLake: { value: new THREE.Vector4(LAKE.x, LAKE.z, LAKE.rx, LAKE.rz) }, uRoad: { value: new THREE.Vector2(SZR.x, SZR.half) }, uCoast: { value: new THREE.Vector2(COAST.x0, COAST.k) } },
      vertexShader: glsl.ground.vertex,
      fragmentShader: glsl.ground.fragment,
    }),
  );
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  // Floor under the car
  const floorU = { uPad: { value: 1 }, uRoad: { value: 0 }, uStudio: { value: 0 }, uHead: { value: 0 }, uTravel: { value: 0 } };
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(90, 90), new THREE.ShaderMaterial({ ...additive, uniforms: floorU, vertexShader: glsl.floor.vertex, fragmentShader: glsl.floor.fragment }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(C.x, C.y + 0.02, C.z);
  scene.add(floor);

  // Velocity Tunnel streaks
  const NS = budget.streaks, L = 120;
  const attrs = { aA: new Float32Array(NS * 2), aR: new Float32Array(NS * 2), aX: new Float32Array(NS * 2), aE: new Float32Array(NS * 2), aS: new Float32Array(NS * 2), aH: new Float32Array(NS * 2) };
  for (let k = 0; k < NS; k++) {
    const a = rand() * Math.PI * 2, r = 2.6 + Math.pow(rand(), 0.7) * 9, x0 = rand() * L, s = rand(), h = rand() < 0.16 ? 1 : 0;
    for (let e = 0; e < 2; e++) {
      const q = k * 2 + e;
      attrs.aA[q] = a; attrs.aR[q] = r; attrs.aX[q] = x0; attrs.aE[q] = e; attrs.aS[q] = s; attrs.aH[q] = h;
    }
  }
  const sG = new THREE.BufferGeometry();
  sG.setAttribute("position", new THREE.BufferAttribute(new Float32Array(NS * 6), 3));
  for (const [k, v] of Object.entries(attrs)) sG.setAttribute(k, new THREE.BufferAttribute(v, 1));
  const streakU = { uTravel: { value: 0 }, uSpeed: { value: 0 }, uOpacity: { value: 0 }, uLen: { value: L } };
  const streaks = new THREE.LineSegments(sG, new THREE.ShaderMaterial({ ...additive, uniforms: streakU, vertexShader: glsl.streaks.vertex, fragmentShader: glsl.streaks.fragment }));
  streaks.position.set(C.x, C.y + 0.9, C.z);
  streaks.frustumCulled = false;
  scene.add(streaks);

  return { sky, stars, city, tall, beacons, ground, floor, streaks, common, floorU, streakU, prUniforms };
}
