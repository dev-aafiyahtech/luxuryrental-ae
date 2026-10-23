import * as THREE from "three";
import { mulberry } from "./math";
import * as glsl from "./shaders";
import type { Budget } from "./tier";

// The night city around the car, ported from the prototype's initGL(): sky dome with desert
// haze, stars, instanced towers with lit windows, the stepped supertall and spire, aviation
// beacons, streets with traffic, the helipad/road/studio floor and the Velocity Tunnel.

/** The helipad roof the car lands on, and its height. */
export const PAD = new THREE.Vector3(46, 0, 64);
export const PAD_H = 58;
/** Car centre on the roof. */
export const C = new THREE.Vector3(PAD.x, PAD_H, PAD.z);

export interface World {
  sky: THREE.Mesh;
  stars: THREE.Points;
  city: THREE.InstancedMesh;
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
    uFogC: { value: new THREE.Vector3(0.045, 0.028, 0.02) },
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
  const towers: [number, number, number, number, number][] = [];
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

  // The supertall: stepped, slightly twisting tiers and a spire
  const tall = new THREE.Group();
  const tallMat = towerMat(0.81);
  const tiers: [number, number, number][] = [[11, 0, 64], [9, 64, 128], [7.2, 128, 178], [5.6, 178, 222], [4.2, 222, 258], [3, 258, 288], [1.8, 288, 312]];
  tiers.forEach(([r, h0, h1], k) => {
    const g = new THREE.CylinderGeometry(r * 0.9, r, h1 - h0, 6);
    g.translate(0, (h0 + h1) / 2, 0);
    const m = new THREE.Mesh(g, tallMat);
    m.rotation.y = k * 0.3;
    tall.add(m);
  });
  const spireG = new THREE.CylinderGeometry(0.2, 1.3, 52, 6);
  spireG.translate(0, 338, 0);
  tall.add(new THREE.Mesh(spireG, tallMat));
  scene.add(tall);

  // Aviation lights on the tallest roofs
  const beac: number[] = [0, 365, 0];
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
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(3200, 3200), new THREE.ShaderMaterial({ uniforms: { ...common }, vertexShader: glsl.ground.vertex, fragmentShader: glsl.ground.fragment }));
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
