import * as THREE from "three";
import { clamp01, lerp, sm } from "./math";
import { buildWorld, C } from "./world";
import { BAA_SPINE, OPENING } from "./dubai";
import { buildFor, createCarPoints, type CarPoints } from "./car/carPoints";
import { loadParticleSet } from "./car/particleSet";
import * as glsl from "./shaders";
import { budgets } from "./tier";
import type { CalloutPart, ChapterState, StageCar } from "./types";

// The homepage's cinematic stage: a port of the approved prototype's WebGL scene (three r128)
// to three r186 / WebGL2, split into modules. The page drives it: it calls frame() with the
// chapter progress, and setSelected() when the Kinetic Sculpture tab changes. The stage owns
// its canvas, so a remount (Next keeps hidden routes alive with <Activity> and re-runs
// effects) always starts from a fresh WebGL context; dispose() also aborts any particle-set
// download still running.
//
// The sculpture is sampled from each car's own side image (car/particleSet.ts), so the camera
// sees it mostly side-on (D-13): the descent ends a little in front of the flank, the tunnel
// tracks alongside, the Kinetic Sculpture yaws slowly across the side, and only the finale
// swings to a front three-quarter, while the car is light, to show the headlights ignite.

export interface StageOptions {
  /** Element the canvas fills (the sticky stage layer). */
  container: HTMLElement;
  /** Callout layer; children carry data-anchor="cabin|body|wheels|powertrain". */
  overlay?: HTMLElement | null;
  tier: "high" | "low";
  /** The opening car (hero rank 1), shown on the helipad and in the tunnel. */
  hero: StageCar;
  /** The Kinetic Sculpture car. */
  selected: StageCar;
}

export interface Stage {
  /** Render one frame. `ambient` false freezes time-based motion (reduced motion, Pause). */
  frame(state: ChapterState, dt: number, time: number, ambient: boolean): void;
  /** Swap the sculpture car; animated as a dissolve when `animate`, otherwise instant. */
  setSelected(car: StageCar, animate: boolean): void;
  /** True while a car swap is still dissolving (the page keeps rendering until it ends). */
  busy(): boolean;
  /** Development aid: per-car uniforms and swap state. */
  debug(): unknown;
  dispose(): void;
}

/**
 * Chapter 1 opens out at sea behind the Burj Al Arab, on the Burj Khalifa (at the origin)
 * across the whole city, the tower on the end side of the screen beside the copy. A long lens
 * keeps it large from 2,350 units away; the camera then flies in and down onto the Burj Al
 * Arab's helipad (C) as the lens widens to the usual view, the Burj Khalifa staying in sight.
 */
const BURJ_LOOK_Y = [182, 196] as const;
/** Opening lens: vertical field of view in degrees (the usual 40 / 50 by the landing). */
const OPEN_FOV = { desk: 14.5, mob: 26 } as const;
/**
 * View offsets [x mirrored for right-to-left, y, x not mirrored] per chapter, as a share of
 * the screen. Chapter 1 eases from framing the Burj to framing the car (BURJ_* → index 0).
 * Phones keep the Burj a little left of centre in both languages (the copy is full width).
 */
const OFFSETS = {
  desk: [[0.1, 0.07], [0, 0.27], [-0.15, 0.07], [0.13, 0.1]],
  mob: [[0, 0.1], [0, 0.25], [0, -0.12], [0, 0.2]],
} as const;
const BURJ_FRAME = { desk: [-0.18, 0.071, 0], mob: [0, 0.24, 0.08] } as const;
/** Fog colour: a warmer desert haze for the opening view, the usual colour by the landing. */
const HAZE = new THREE.Vector3(0.07, 0.115, 0.105), FOG = new THREE.Vector3(0.03, 0.075, 0.075);
/** Camera on +z looks at the car's flank with the nose to the right, as in the side images. */
const SIDE = Math.PI / 2;
const AZ1 = SIDE - 0.24; // end of the descent: a touch in front of side-on
const AZ2 = SIDE + 0.16; // tunnel: tracking alongside, a touch behind
const AZ3 = SIDE - 0.1; // Kinetic Sculpture: a slow yaw across the side
const AZ4 = SIDE - 0.62; // finale: front three-quarter for the headlights
const R1 = 9.0, R2 = 8.6, R3 = 9.0, R4 = 7.8;
const SWAP_SECONDS = 1.3;
const APPEAR_SECONDS = 0.8;
/** How much of its own colour the formed car shows over the colour-by-part palette. */
const PAINT = { formed: 0.5, tunnel: 0.22, kinetic: 0.18 };

export function createStage(opts: StageOptions): Stage {
  const { container, overlay, tier } = opts;
  const budget = budgets[tier];
  // Right-to-left pages put the copy on the other side, so the subject's framing mirrors too
  // (the scene itself is never mirrored). The language switch reloads the page, so this is fixed.
  const side = getComputedStyle(container).direction === "rtl" ? -1 : 1;
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block;opacity:0;transition:opacity 1.4s ease";
  container.appendChild(canvas);

  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: budget.antialias, powerPreference: "high-performance", alpha: false });
  } catch (err) {
    canvas.remove();
    throw err;
  }
  let pixelRatio = Math.min(window.devicePixelRatio || 1, budget.maxPixelRatio);
  renderer.setPixelRatio(pixelRatio);
  renderer.setClearColor(0x0f2424, 1);

  const scene = new THREE.Scene();
  // The opening looks 2,350 units across the city; nothing comes nearer than a few units.
  const camera = new THREE.PerspectiveCamera(40, 1, 1, 4500);
  const world = buildWorld(scene, camera, budget, pixelRatio);
  const { common, floorU, streakU } = world;
  const carPR = { value: pixelRatio };
  world.prUniforms.push(carPR);

  // Cars: built lazily per slug and kept until the stage is disposed (top 5 at most).
  const rig = new THREE.Group();
  rig.position.copy(C);
  scene.add(rig);
  // Each car's particles load on demand (sampled from its image); if there is no set or it
  // fails, the car is drawn from its body-style profile instead.
  const cars = new Map<string, CarPoints>();
  const loads = new AbortController();
  const carFor = (car: StageCar) => {
    let c = cars.get(car.slug);
    if (!c) {
      const cp = createCarPoints(car.slug, { uTime: common.uTime, uPR: carPR }, budget.pointSize);
      rig.add(cp.points);
      cars.set(car.slug, cp);
      c = cp;
      loadParticleSet(car.slug, loads.signal)
        .then((set) => buildFor(car, set, budget.carParticles))
        .catch((err: unknown) => {
          if (loads.signal.aborted) return null;
          console.warn(`Particle set for ${car.slug} unavailable, drawing its body style instead.`, err);
          return buildFor(car, null, budget.carParticles);
        })
        .then((build) => {
          if (!build || disposed) return;
          cp.setBuild(build);
          if (cp === current) placeLamps(cp);
          dirty = true;
        });
    }
    return c;
  };
  const hero = carFor(opts.hero);
  let current = carFor(opts.selected);
  let previous: CarPoints | null = null;
  let swap = 1; // 0 → 1 while `previous` dissolves into `current`
  let swapStart = -1;

  // Headlight glow and beams, placed at the sculpture car's lamps
  const headU = { uHead: { value: 0 }, uPR: carPR };
  const hG = new THREE.BufferGeometry();
  hG.setAttribute("position", new THREE.Float32BufferAttribute([0, 0, 0, 0, 0, 0], 3));
  const glows = new THREE.Points(hG, new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: headU, vertexShader: glsl.headGlow.vertex, fragmentShader: glsl.headGlow.fragment }));
  glows.frustumCulled = false;
  rig.add(glows);
  const coneG = new THREE.ConeGeometry(1.5, 8, 32, 1, true);
  coneG.rotateZ(Math.PI / 2);
  coneG.translate(4, 0, 0);
  const beamMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, uniforms: headU, vertexShader: glsl.beam.vertex, fragmentShader: glsl.beam.fragment });
  const beams = [1, -1].map(() => {
    const b = new THREE.Mesh(coneG, beamMat);
    b.rotation.z = -0.06;
    rig.add(b);
    return b;
  });
  const placeLamps = (c: CarPoints) => {
    if (!c.build) return;
    const [x, y, z] = c.build.lamp;
    const pos = hG.getAttribute("position") as THREE.BufferAttribute;
    pos.setXYZ(0, x, y, z);
    pos.setXYZ(1, x, y, -z);
    pos.needsUpdate = true;
    beams[0].position.set(x, y, z);
    beams[1].position.set(x, y, -z);
  };
  placeLamps(current);

  // Camera rig
  let width = 1, height = 1, rs = 1, hs = 1;
  let curve: THREE.CatmullRomCurve3 | null = null;
  const camPos = new THREE.Vector3(), camTgt = new THREE.Vector3(), tmp = new THREE.Vector3();
  const lookA = new THREE.Vector3(), lookB = new THREE.Vector3(), lookM = new THREE.Vector3();
  const orbit = (out: THREE.Vector3, az: number, r: number, h: number) => out.set(C.x + Math.cos(az) * r * rs, C.y + h * hs, C.z + Math.sin(az) * r * rs);
  const buildCurve = () => {
    // From out at sea behind the helipad (`back` units, away from the Burj Khalifa), in and down.
    const len = Math.hypot(C.x, C.z), fx = -C.x / len, fz = -C.z / len;
    const at = (back: number, right: number, y: number) => new THREE.Vector3(C.x - fx * back - fz * right, y, C.z - fz * back + fx * right);
    curve = new THREE.CatmullRomCurve3(
      // Swinging a little right on the way in keeps the Burj Al Arab clear of the Burj Khalifa.
      [at(OPENING.back, OPENING.right, OPENING.y), at(420, 46, 214), at(300, 60, 166), at(150, 44, 142), new THREE.Vector3(C.x + 15, C.y + 24, C.z + 54), orbit(new THREE.Vector3(), AZ1, R1, 1.6)],
      false,
      "centripetal",
    );
  };
  const resize = () => {
    width = Math.max(1, container.clientWidth);
    height = Math.max(1, container.clientHeight);
    const aspect = width / height;
    renderer.setSize(width, height, false);
    camera.aspect = aspect;
    camera.fov = width < 768 ? 50 : 40;
    camera.updateProjectionMatrix();
    rs = aspect >= 1.2 ? 1 : Math.min(1.9, 1.2 / aspect);
    hs = Math.sqrt(rs);
    buildCurve();
    dirty = true;
  };
  let dirty = true;
  resize();
  const ro = new ResizeObserver(() => resize());
  ro.observe(container);

  // Callouts: DOM labels pinned to projected part anchors while the car is exploded
  const centreV = new THREE.Vector3();
  let calloutsShown = true;
  const LABEL_W = 250, RAIL_W = 190;
  const placeCallouts = (explode: number) => {
    if (!overlay) return;
    const els = overlay.querySelectorAll<HTMLElement>("[data-anchor]");
    const show = sm(0.6, 0.92, explode);
    if (width < 1024 || show < 0.002) {
      if (calloutsShown) els.forEach((el) => (el.style.opacity = "0"));
      calloutsShown = false;
      return;
    }
    calloutsShown = true;
    const x0 = clamp01(explode * 1.3 - 0.15);
    const ee = x0 * x0 * (3 - 2 * x0);
    centreV.set(0, 0.8, 0).applyMatrix4(rig.matrixWorld).project(camera);
    const cx = (centreV.x * 0.5 + 0.5) * width;
    const anchors = current.build?.anchors;
    if (!anchors) return;
    els.forEach((el) => {
      const a = anchors[el.dataset.anchor as CalloutPart];
      if (!a) return;
      tmp.set(a.p[0] + a.e[0] * ee, a.p[1] + a.e[1] * ee, a.p[2] + a.e[2] * ee).applyMatrix4(rig.matrixWorld).project(camera);
      const x = (tmp.x * 0.5 + 0.5) * width, y = (-tmp.y * 0.5 + 0.5) * height;
      // Labels open away from the car's centre, unless that would run into the chapter rail
      // (on the end side: right in English, left in Arabic).
      let flip = x < cx;
      if (!flip && side > 0 && x + LABEL_W > width - RAIL_W) flip = true;
      if (flip && side < 0 && x - LABEL_W < RAIL_W) flip = false;
      el.toggleAttribute("data-flip", flip);
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      el.style.opacity = (tmp.z < 1 ? show : 0).toFixed(3);
    });
  };

  // Adaptive resolution: drop the pixel ratio if frames are consistently slow
  let slowFrames = 0, sampled = 0;
  const adapt = (dt: number) => {
    if (dt <= 0) return;
    sampled++;
    if (dt > 0.034) slowFrames++;
    if (sampled < 90) return;
    const floor = 1;
    if (slowFrames > 60 && pixelRatio > floor) {
      pixelRatio = Math.max(floor, pixelRatio - 0.25);
      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(width, height, false);
      for (const u of world.prUniforms) u.value = pixelRatio;
    }
    sampled = 0;
    slowFrames = 0;
  };

  let travel = 0, shown = false, disposed = false;
  // Framing follows the car's size (a Cullinan needs more room than a 296), eased on swaps.
  let frameK = -1;

  const presenceOf = (c: CarPoints, g: number, s: number) => {
    // Hero role (chapters 1–2) hands over to the sculpture role as chapter 3 starts; within
    // the sculpture role the previous tab's car hands over to the current one.
    let p = 0;
    if (c === hero) p += 1 - g;
    if (c === current) p += g * s;
    if (c === previous) p += g * (1 - s);
    return Math.min(1, p);
  };

  return {
    frame(S, dt, time, ambient) {
      if (disposed) return;
      const { c1, c2, c3, c4 } = S;
      if (ambient) common.uTime.value = time;
      const cityK = 1 - sm(0.1, 0.6, c2);
      const tunnel = Math.max(sm(0.15, 0.4, c2) * (1 - 0.7 * sm(0.8, 1, c2)) * (1 - sm(0, 0.25, c3)), sm(0.55, 0.8, c4) * 0.85);
      const speed = Math.max(sm(0.12, 0.45, c2) * (1 - 0.6 * sm(0.8, 1, c2)) * (1 - sm(0, 0.25, c3)), sm(0.55, 0.85, c4) * 1.15);
      const explode = sm(0.25, 0.6, c3) * (1 - sm(0.04, 0.36, c4));
      const head = sm(0.38, 0.52, c4), launch = sm(0.55, 0.9, c4);
      if (ambient) {
        travel += dt * (6 + 75 * speed);
        adapt(dt);
      }

      common.uCity.value = cityK;
      // Clear air across the city (it spans thousands of units); haze thickens as it fades out.
      common.uFogD.value = 0.00046 + (1 - cityK) * 0.004;
      common.uFogC.value.lerpVectors(HAZE, FOG, sm(0.2, 0.8, c1));
      const cityOn = cityK > 0.003;
      world.city.visible = world.ground.visible = world.tall.visible = world.beacons.visible = world.stars.visible = cityOn;
      world.streaks.visible = tunnel > 0.003;
      streakU.uOpacity.value = tunnel;
      streakU.uSpeed.value = speed;
      streakU.uTravel.value = travel;
      floorU.uPad.value = 1 - sm(0.05, 0.4, c2);
      floorU.uRoad.value = Math.max(sm(0.3, 0.5, c2) * (1 - sm(0, 0.3, c3)), sm(0.6, 0.85, c4));
      floorU.uStudio.value = sm(0.1, 0.4, c3) * (1 - 0.7 * sm(0.6, 0.85, c4));
      floorU.uHead.value = head;
      floorU.uTravel.value = travel * 0.6;

      // Car swaps
      // Car swaps run on wall-clock time, so slow frames don't stretch the dissolve.
      if (previous) {
        if (!ambient) swap = 1;
        else if (swapStart < 0) swapStart = time;
        else swap = Math.min(1, (time - swapStart) / SWAP_SECONDS);
        if (swap >= 1) previous = null;
      }
      const g = sm(0.03, 0.3, c3);
      const s = swap < 1 ? swap : 1;
      const form = sm(0.5, 0.92, c1);
      // Gold dust resolves into the car's own colour as it forms; in the tunnel and the Kinetic
      // Sculpture colour comes back to the part palette (D-13), then returns for the finale.
      const paint =
        PAINT.formed * sm(0.7, 1, c1) * (1 - sm(0.1, 0.4, c2)) +
        PAINT.tunnel * sm(0.1, 0.4, c2) * (1 - sm(0.05, 0.3, c3)) +
        PAINT.kinetic * sm(0.05, 0.3, c3) * (1 - sm(0.04, 0.36, c4)) +
        PAINT.formed * sm(0.04, 0.36, c4);
      for (const c of cars.values()) {
        if (!c.build) {
          c.points.visible = false;
          continue;
        }
        if (c.readyAt < 0) c.readyAt = time;
        const appear = ambient ? sm(0, APPEAR_SECONDS, time - c.readyAt) : 1;
        const p = presenceOf(c, g, s) * appear;
        // Sharpen so the outgoing car is mostly dust before the next one condenses.
        const dp = p >= 0.999 ? 1 : sm(0.35, 1, p);
        c.points.visible = dp > 0.002;
        c.uniforms.uForm.value = form * dp;
        c.uniforms.uFade.value = sm(0, 0.3, dp);
        c.uniforms.uExplode.value = explode;
        c.uniforms.uHead.value = c === current ? head : 0;
        c.uniforms.uPaint.value = c.build.source === "image" ? paint : 0;
      }
      headU.uHead.value = head;
      glows.visible = head > 0.003;
      beams.forEach((b) => (b.visible = head > 0.003));
      rig.position.x = C.x + 0.45 * launch;

      // Framing scale: the hero car until the sculpture takes over, then the selected one.
      const sizeOf = (c: CarPoints) => (c.build ? Math.min(1.3, Math.max(0.96, c.build.length / 4.8, c.build.height / 1.4)) : 1);
      const kTarget = lerp(sizeOf(hero), sizeOf(current), g);
      frameK = frameK < 0 || !ambient ? kTarget : frameK + (kTarget - frameK) * Math.min(1, dt * 2.5);
      const k = frameK;
      // The image cars' cabin rises about a metre when exploded; the profile car lifts more.
      const lift = current.build?.source === "image" ? 0.45 : 0.85;

      if (!curve) buildCurve();
      if (c2 <= 0.0001) {
        // Halfway through the chapter the camera is at the third point: both Burjs in view.
        curve!.getPoint(0.5 - 0.5 * Math.cos(Math.PI * Math.pow(c1, 1.2)), camPos);
        // Ease the end of the descent onto this car's framing distance.
        const e = sm(0.6, 1, c1);
        camPos.set(C.x + (camPos.x - C.x) * lerp(1, k, e), camPos.y, C.z + (camPos.z - C.z) * lerp(1, k, e));
        // Turn the view (not the target point) from the Burj Khalifa, through a frame holding both
        // towers (the Burj Al Arab's sail in front), down to the car, so the tilt stays even.
        tmp.set(C.x, C.y + 0.6 * k, C.z);
        const reach = camPos.distanceTo(tmp);
        lookA.set(0, lerp(BURJ_LOOK_Y[0], BURJ_LOOK_Y[1], sm(0, 0.5, c1)), 0).sub(camPos).normalize();
        lookM.set(BAA_SPINE[0], 70, BAA_SPINE[1]).sub(camPos).normalize();
        lookB.copy(tmp).sub(camPos).normalize();
        lookA.lerp(lookM, 0.42 * sm(0.18, 0.5, c1)).normalize();
        camTgt.copy(lookA).lerp(lookB, sm(0.55, 0.88, c1)).normalize().multiplyScalar(reach).add(camPos);
      } else if (c3 <= 0.0001) {
        const t = sm(0, 0.45, c2);
        orbit(camPos, lerp(AZ1, AZ2, t), lerp(R1, R2, t) * k, lerp(1.6, 1.0, t));
        camTgt.set(C.x + lerp(0, 0.5, t), C.y + lerp(0.6, 0.7, t) * k, C.z);
        if (ambient) {
          camPos.y += Math.sin(time * 31) * 0.012 * speed;
          camPos.z += Math.sin(time * 23) * 0.012 * speed;
        }
      } else if (c4 <= 0.0001) {
        const t = sm(0, 0.8, c3);
        orbit(camPos, lerp(AZ2, AZ3, t), lerp(R2, R3, t) * k, lerp(1.0, 1.7, t));
        camTgt.set(C.x + lerp(0.5, 0, t), C.y + (lerp(0.7, 0.75, t) + lift * explode) * k, C.z);
      } else {
        const t = sm(0, 0.5, c4);
        orbit(camPos, lerp(AZ3, AZ4, t), lerp(R3, R4, t) * k + launch * 1.4, lerp(1.7, 1.1, t) - launch * 0.2);
        camTgt.set(C.x + lerp(0, 0.9, t), C.y + (0.75 + lift * explode - 0.2 * t) * k, C.z);
      }
      camera.position.copy(camPos);
      camera.lookAt(camTgt);

      // Frame the subject beside the copy: shift the view per chapter. In chapter 1 the
      // subject is first the Burj (end side), then the car on the pad.
      const w2 = sm(0, 0.4, c2), w3 = sm(0, 0.4, c3), w4 = sm(0, 0.4, c4);
      const mob = width < 768;
      const O = mob ? OFFSETS.mob : OFFSETS.desk, B = mob ? BURJ_FRAME.mob : BURJ_FRAME.desk;
      const fb = sm(0.3, 0.75, c1);
      const W0 = 1 - w2, W1 = w2 * (1 - w3), W2 = w2 * w3 * (1 - w4), W3 = w2 * w3 * w4;
      const ox = W0 * lerp(B[0], O[0][0], fb) + W1 * O[1][0] + W2 * O[2][0] + W3 * O[3][0];
      const oy = W0 * lerp(B[1], O[0][1], fb) + W1 * O[1][1] + W2 * O[2][1] + W3 * O[3][1];
      const oxAbs = W0 * B[2] * (1 - fb);
      // The opening's long lens widens to the usual one by the landing (eased in focal length).
      const fov0 = mob ? OPEN_FOV.mob : OPEN_FOV.desk, fov1 = mob ? 50 : 40;
      const lens = Math.exp(lerp(Math.log(Math.tan((fov0 * Math.PI) / 360)), Math.log(Math.tan((fov1 * Math.PI) / 360)), sm(0.06, 0.62, c1)));
      camera.fov = (Math.atan(lens) * 360) / Math.PI;
      camera.setViewOffset(width, height, (side * ox + oxAbs) * width, oy * height, width, height);
      // While the chapter 1 copy is on screen the city behind it steps back.
      common.uCalm.value.set(side, 1 - sm(0.2, 0.42, c1), mob ? 1 : 0, 0);
      common.uRes.value.set(canvas.width, canvas.height);

      world.sky.position.copy(camera.position);
      world.stars.position.copy(camera.position);
      renderer.render(scene, camera);
      placeCallouts(explode);
      dirty = false;
      if (!shown) {
        shown = true;
        canvas.style.opacity = "1";
      }
    },

    setSelected(car, animate) {
      if (disposed || car.slug === current.slug) return;
      const next = carFor(car);
      if (animate) {
        // A swap during a swap: the half-dissolved car simply leaves.
        previous = current;
        swap = 0;
        swapStart = -1;
      } else {
        previous = null;
        swap = 1;
      }
      current = next;
      placeLamps(current);
      dirty = true;
    },

    busy() {
      return !!previous || dirty || [...cars.values()].some((c) => !c.build);
    },

    debug() {
      (window as unknown as { __world?: unknown }).__world = world; // TEMP profiling
      return {
        swap,
        current: current.slug,
        previous: previous?.slug ?? null,
        cars: [...cars.values()].map((c) => ({ slug: c.slug, source: c.build?.source ?? "loading", visible: c.points.visible, form: c.uniforms.uForm.value, fade: c.uniforms.uFade.value, explode: c.uniforms.uExplode.value, paint: c.uniforms.uPaint.value, inRig: c.points.parent === rig, count: c.build?.count ?? 0 })),
      };
    },

    dispose() {
      if (disposed) return;
      disposed = true;
      loads.abort();
      ro.disconnect();
      for (const c of cars.values()) c.dispose();
      cars.clear();
      scene.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        mesh.geometry?.dispose();
        const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else mat?.dispose();
      });
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    },
  };
}
