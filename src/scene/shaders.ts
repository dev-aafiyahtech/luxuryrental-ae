// GLSL for the homepage stage, ported from the approved prototype (three r128) to r186.
// three still accepts GLSL1-style ShaderMaterial source on WebGL2 (it adds the
// `in`/`out`/`pc_fragColor` defines). None of these shaders include
// <colorspace_fragment>, so they write their colours straight to the sRGB canvas, exactly
// as r128 did with linear output: the look matches qa/screenshots.

const FOG_FN = /* glsl */ `
uniform float uFogD; uniform vec3 uFogC; uniform vec3 uCam;
vec3 fogDD(vec3 col, float dd){ return mix(col, uFogC, 1.0 - exp(-uFogD * uFogD * dd)); } // dd: squared distance
vec3 applyFog(vec3 col, vec3 w){ vec3 d = w - uCam; return fogDD(col, dot(d, d)); }`;

/**
 * Behind the chapter 1 copy the city steps back (darker, flatter) so the headline stays
 * readable: the start side of the screen on desktop, the lower half on phones. uCalm.xyz is a
 * screen axis in pixels (t = x·fragX + y·fragY + z, 0 to 1 across the screen, set by the
 * stage for the language and layout), uCalm.w the strength (fading as the copy scrolls away).
 * Needs FOG_FN first (uFogC).
 */
const CALM_FN = /* glsl */ `
uniform vec4 uCalm;
vec3 calm(vec3 col){
  if (uCalm.w <= 0.0) return col;
  float k = (1.0 - smoothstep(0.3, 0.6, dot(gl_FragCoord.xy, uCalm.xy) + uCalm.z)) * uCalm.w;
  return mix(col, vec3(dot(col, vec3(0.3, 0.5, 0.2))) * 0.5 + uFogC * 0.3, k);
}`;

/** Sky dome with the desert haze on the horizon. */
export const sky = {
  vertex: /* glsl */ `varying vec3 vDir;
    void main(){ vDir = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = p.xyww; }`,
  fragment: /* glsl */ `uniform float uCity; varying vec3 vDir;
    void main(){ float h = vDir.y;
      vec3 col = mix(vec3(0.10, 0.17, 0.15), vec3(0.016, 0.045, 0.047), smoothstep(-0.02, 0.38, h));
      col += vec3(0.30, 0.27, 0.19) * exp(-abs(h - 0.01) * 22.0) * 0.6;
      col = mix(vec3(0.090, 0.190, 0.190), col, uCity);
      gl_FragColor = vec4(col, 1.0); }`,
};

export const stars = {
  vertex: /* glsl */ `attribute float aPh; uniform float uTime, uPR; varying float vA;
    void main(){ gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = (1.0 + aPh * 1.3) * uPR;
      vA = 0.25 + 0.5 * (0.5 + 0.5 * sin(uTime * 0.8 + aPh * 40.0)); }`,
  fragment: /* glsl */ `uniform float uCity; varying float vA;
    void main(){ float d = length(gl_PointCoord - 0.5); gl_FragColor = vec4(vec3(1.0, 0.95, 0.86) * smoothstep(0.5, 0.0, d) * vA * uCity, 1.0); }`,
};

/** Towers: instanced boxes (and the supertall's tiers) with procedural lit windows. */
export const tower = {
  vertex: /* glsl */ `attribute float aSeed; uniform float uSeedFallback;
    varying vec3 vW; varying vec3 vN; varying float vSeed;
    void main(){
      vec4 wp;
      #ifdef USE_INSTANCING
        wp = modelMatrix * instanceMatrix * vec4(position, 1.0); vSeed = aSeed;
      #else
        wp = modelMatrix * vec4(position, 1.0); vSeed = uSeedFallback;
      #endif
      vW = wp.xyz; vN = normalize(mat3(modelMatrix) * normal);
      gl_Position = projectionMatrix * viewMatrix * wp;
    }`,
  fragment: /* glsl */ `uniform float uCity; ${FOG_FN} ${CALM_FN}
    varying vec3 vW; varying vec3 vN; varying float vSeed;
    float hash(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
    void main(){
      vec3 col = vec3(0.024, 0.055, 0.055);
      if (abs(vN.y) < 0.5) {
        vec2 t = normalize(vec2(-vN.z, vN.x));
        vec2 cell = vec2(dot(vW.xz, t) / 1.25, vW.y / 1.6);
        float face = floor(vN.x * 3.0 + vN.z * 5.0);
        float near = smoothstep(750.0, 220.0, distance(vW, uCam));
        // Far away the windows merge into clusters of lit floors (filtered), varied per tower,
        // so the skyline keeps texture instead of turning into flat blocks.
        vec2 sc = cell / vec2(3.0, 2.0);
        float sv = hash(vec3(floor(sc), vSeed * 53.0 + face));
        float cluster = mix(0.3 + 2.1 * sv * sv * sv, 0.82, smoothstep(0.35, 0.8, max(fwidth(sc.x), fwidth(sc.y))));
        col += vec3(0.98, 0.855, 0.66) * 0.17 * (0.6 + 0.8 * fract(vSeed * 7.31)) * cluster * (1.0 - near);
        // Individual windows only where they can be seen (most of the opening view is far away).
        if (near > 0.0) {
          vec2 id = floor(cell), f = fract(cell);
          float win = step(0.16, f.x) * step(f.x, 0.84) * step(0.2, f.y) * step(f.y, 0.8);
          float lit = step(0.6, hash(vec3(id, vSeed * 97.0 + face)));
          vec3 warm = mix(vec3(0.96, 0.78, 0.50), vec3(1.0, 0.93, 0.82), hash(vec3(id.yx, vSeed * 13.0)));
          col += warm * win * lit * (0.5 + 0.5 * hash(vec3(id, 3.1))) * near;
          col += vec3(0.045, 0.085, 0.085) * win * (1.0 - lit) * near;
        }
        col += vec3(0.55, 0.50, 0.36) * 0.35 * exp(-vW.y * 0.06);
      } else { col *= 1.4; }
      gl_FragColor = vec4(calm(applyFog(col, vW)) * uCity, 1.0);
    }`,
};

/** Aviation beacons on the tallest roofs. */
export const beacons = {
  vertex: /* glsl */ `attribute float aPh; uniform float uTime, uPR; varying float vB;
    void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv;
      gl_PointSize = 3.0 * uPR * clamp(260.0 / -mv.z, 0.8, 3.0);
      float f = fract(uTime * 0.45 + aPh); vB = smoothstep(0.0, 0.08, f) * (1.0 - smoothstep(0.22, 0.36, f)); }`,
  fragment: /* glsl */ `uniform float uCity; varying float vB;
    void main(){ float d = length(gl_PointCoord - 0.5); gl_FragColor = vec4(vec3(0.97, 0.28, 0.22) * smoothstep(0.5, 0.0, d) * vB * uCity * 1.4, 1.0); }`,
};

/**
 * The ground: streets with moving traffic, Sheikh Zayed Road (parallel to the coast), the
 * low-rise districts as a carpet of small lights, the lake at the Burj Khalifa's foot and the
 * sea, with the Burj Al Arab's light on the water. Lines and dashes are filtered (from the
 * pixel's footprint), so the far city doesn't shimmer in the long opening view. The ground is
 * drawn in three pieces so each pixel runs only its own work: LAND (inland of the beach),
 * SEA (offshore) and, with neither defined, the strip along the shore where they meet. LITE
 * (the low tier) also leaves out the sea's glints and the far traffic lane's average.
 */
export const ground = {
  vertex: /* glsl */ `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
  fragment: /* glsl */ `uniform float uCity, uTime; ${FOG_FN} ${CALM_FN}
    uniform vec4 uLake;  // lake centre x, z and radii x, z
    uniform vec2 uRoad;  // Sheikh Zayed Road: centre line's distance inland, half-width
    uniform vec4 uCoast; // a point on the shoreline (x, z) and the inland normal (x, z)
    uniform vec4 uRefl;  // the Burj Al Arab: x, z, half-width, height
    varying vec3 vW;
    // A soft line of width w, d from its centre: at least a pixel (aa) wide, dimmed to keep
    // its weight.
    float lineAt(float d, float w, float aa){ float k = max(w, aa); return (1.0 - smoothstep(0.0, k, d)) * (w / k); }
    // The same for a line every sp units, fading to its average brightness once the period
    // itself is only a few pixels.
    float ln(float v, float sp, float w, float aa){
      return mix(lineAt(abs(fract(v / sp + 0.5) - 0.5) * sp, w, aa), w / sp, smoothstep(0.2, 0.5, aa / sp));
    }
    float hash2(vec2 p){ vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
    // 1 on the lit part of a dash pattern (duty = dark share), filtered the same way.
    float dash(float v, float period, float duty, float aa){
      aa /= period;
      return mix(smoothstep(duty - aa, duty + aa, fract(v / period)), 1.0 - duty, smoothstep(0.2, 0.5, aa));
    }
    // A tall lit tower's light (o: x, z, half-width, height) on the water between it and the
    // camera (dv: from the camera to this point), shimmering along its length.
    float towerLight(vec4 o, vec3 dv, float k, float speed){
      vec2 toB = o.xy - uCam.xz;
      float lb = max(length(toB), 1.0), p2 = dot(dv.xz, dv.xz), ip = inversesqrt(max(p2, 1.0)), lp = p2 * ip;
      return (1.0 - smoothstep(o.z * 0.4, o.z, abs(dv.x * toB.y - dv.z * toB.x) * ip)) * step(lp, lb)
        * (1.0 - smoothstep(o.w * 0.5, o.w, max(lb - lp, 0.0) * uCam.y * ip)) * (0.6 + 0.4 * sin(lp * k + uTime * speed));
    }
    void main(){
      vec3 dv = vW - uCam;
      float dd = dot(dv, dv);
      vec2 n = uCoast.zw, tc = vec2(n.y, -n.x), rel = vW.xz - uCoast.xy;
      float inl = dot(rel, n), alongC = dot(rel, tc);
      // The pixel's footprint along x, z, inland and along the coast (one pair of derivatives,
      // taken outside any branch)
      vec2 dX = dFdx(vW.xz), dY = dFdy(vW.xz);
      float fx = abs(dX.x) + abs(dY.x), fz = abs(dX.y) + abs(dY.y);
      float fi = abs(dot(dX, n)) + abs(dot(dY, n)), fa = abs(dot(dX, tc)) + abs(dot(dY, tc));
      vec3 gold = vec3(0.55, 0.50, 0.36);
      vec3 col = vec3(0.014, 0.035, 0.035);
      #if defined(LAND)
      float land = 1.0;
      #elif defined(SEA)
      float land = 0.0;
      #else
      float land = smoothstep(-1.5, 1.5, inl + 14.0 * abs(fract(alongC * 0.0011) - 0.5));
      #endif
      #ifndef SEA
      if (land > 0.0) {
        float dR = inl - uRoad.x, ax = abs(dR);
        float road = (1.0 - smoothstep(uRoad.y - 0.8, uRoad.y + 0.8, ax)) * land;
        float grid = land - road;
        if (max(fx, fz) < 7.0) {
          // Streets every 14 units, avenues every 42 with a lane of traffic each way beside
          // their centre line (white headlights one way, red tail lights the other)
          float gx = vW.x + 7.0, gz = vW.z + 7.0;
          float ox = (fract(gx / 42.0 + 0.5) - 0.5) * 42.0, oz = (fract(gz / 42.0 + 0.5) - 0.5) * 42.0;
          float sx = step(0.0, ox), sz = step(0.0, oz);
          float mnr = max(ln(gx, 14.0, 0.22, fx), ln(gz, 14.0, 0.22, fz));
          float maj = max(lineAt(abs(ox), 0.7, fx), lineAt(abs(oz), 0.7, fz));
          float tx = lineAt(abs(abs(ox) - 1.4), 0.3, fx) * dash(vW.z + uTime * mix(-19.0, 22.0, sx), mix(13.0, 11.0, sx), 0.78, fz);
          float tz = lineAt(abs(abs(oz) - 1.4), 0.3, fz) * dash(vW.x + uTime * mix(-24.0, 20.0, sz), mix(10.0, 12.0, sz), 0.78, fx);
          vec3 head = vec3(1.1, 0.946, 0.682), tail = vec3(0.882, 0.225, 0.18);
          col += (gold * (maj * 0.5 + mnr * 0.16) + mix(tail, head, sx) * tx + mix(tail, head, sz) * tz) * grid;
          #ifndef LITE
          // the other lane, once both share a pixel, at its average
          col += (mix(head, tail, sx) * lineAt(abs(ox) + 1.4, 0.3, fx) + mix(head, tail, sz) * lineAt(abs(oz) + 1.4, 0.3, fz)) * 0.22 * grid;
          #endif
        } else {
          // Far away: the streets' average glow
          col += gold * 0.0215 * grid;
        }
        // Sheikh Zayed Road: a wide, warmly lit highway with dense traffic both ways
        if (ax < uRoad.y + 3.0 + fi * 2.0) {
          float lane = floor(ax / 2.0);
          float cars = ln(ax - 1.0, 2.0, 0.32, fi) * dash(alongC * sign(dR) + uTime * (21.0 + lane * 4.0) + lane * 5.3, 7.0 + lane, 0.55, fa);
          col += gold * road * 0.22 + gold * (lineAt(ax, 0.45, fi) + lineAt(abs(ax - uRoad.y), 0.4, fi)) * 0.9 * land;
          col += mix(vec3(1.0, 0.9, 0.74), vec3(0.98, 0.26, 0.2), step(0.0, dR)) * cars * road * 1.2;
        }
        float fromBurj = length(vW.xz);
        col *= 1.0 - smoothstep(260.0, 420.0, fromBurj) * 0.45 * grid;
        // Low-rise districts: a carpet of small warm lights from the coast to Downtown
        float sprawl = smoothstep(150.0, 320.0, fromBurj) * (1.0 - smoothstep(2600.0, 3300.0, fromBurj))
          * smoothstep(120.0, 480.0, sqrt(dd)) * smoothstep(6.0, 40.0, inl) * grid;
        if (sprawl > 0.0) {
          vec2 q = vW.xz / 3.5, qi = floor(q);
          float qh = hash2(qi), qa = (fx + fz) / 3.5;
          vec2 qf = fract(q) - 0.5 - (fract(qh * vec2(31.7, 57.3)) - 0.5) * 0.6;
          float spot = (1.0 - smoothstep(0.13, 0.13 + qa, length(qf))) * step(0.66, qh) * (0.4 + 1.8 * fract(qh * 13.7));
          col += vec3(1.0, 0.82, 0.55) * mix(spot, 0.0234, smoothstep(0.12, 0.45, qa)) * 2.8 * sprawl;
        }
        // The lake at the Burj Khalifa's foot, with the tower's light on the water
        float lr = length((vW.xz - uLake.xy) / uLake.zw);
        if (lr < 1.3) {
          vec3 water = vec3(0.008, 0.03, 0.034) + vec3(0.42, 0.36, 0.25) * towerLight(vec4(0.0, 0.0, 10.0, 364.0), dv, 3.1, 1.6);
          col = mix(col, water, 1.0 - smoothstep(0.94, 1.0, lr)) + gold * exp(-abs(lr - 1.0) * 26.0) * 0.6;
        }
      }
      #endif
      // The sea, catching the haze on the horizon, the Burj Al Arab's light on the water and a
      // few glints near the camera
      #ifndef LAND
      if (land < 1.0) {
        float gz1 = 1.0 - abs(dv.y) * inversesqrt(dd), gz2 = gz1 * gz1;
        vec3 sea = vec3(0.008, 0.026, 0.032) + vec3(0.12, 0.108, 0.076) * gz2 * gz2 * gz2 + vec3(0.205, 0.187, 0.154) * towerLight(uRefl, dv, 1.7, 1.3);
        #ifndef LITE
        if (fx < 0.88) {
          float h = hash2(floor(vW.xz / 2.2));
          float glint = step(0.992, fract(h * 7.31 + floor(uTime * 0.7 + h * 7.0) * 0.618034)) * (1.0 - smoothstep(0.22, 0.88, fx));
          sea += vec3(0.315, 0.2975, 0.245) * glint;
        }
        #endif
        col = mix(sea, col, land);
      }
      #endif
      // The beach road's lights along the shore
      if (abs(inl) < 20.0 + fi * 2.0) col += gold * lineAt(abs(inl), 0.7, fi) * 0.9;
      gl_FragColor = vec4(calm(fogDD(col, dd)) * uCity, 1.0);
    }`,
};

/**
 * Landmark facades (the Burj Khalifa, the Burj Al Arab, Emirates Towers, the Address, the
 * sail, the Museum of the Future): procedural night lighting in the palette. Every piece
 * carries aFace (x: distance along its outline, y/z: distance to the nearest sharp vertical
 * edge on either side, w: the piece's top) and aSpan (x: the piece's base, y: kind, z: seed).
 * Kinds: 0 glass with windows and fins, 1 floodlit metal (spires), 2 luminous fabric (the
 * sail), 3 lit crown, 4 lit calligraphy windows, 5 plain podium, 6 glass behind a white
 * X-braced exoskeleton, 7 dark deck with a lit rim (the helipad, the island).
 * Fine patterns are filtered with fwidth, so towers seen from afar keep their silhouette and
 * edge lines without shimmering.
 */
export const facade = {
  vertex: /* glsl */ `attribute vec4 aFace; attribute vec3 aSpan;
    varying vec3 vW; varying vec3 vN; varying vec4 vFace; varying vec3 vSpan;
    void main(){
      vec4 wp = modelMatrix * vec4(position, 1.0);
      vW = wp.xyz; vN = mat3(modelMatrix) * normal; vFace = aFace; vSpan = aSpan;
      gl_Position = projectionMatrix * viewMatrix * wp;
    }`,
  fragment: /* glsl */ `uniform float uCity, uTime, uFogK, uCalmK;
    uniform float uFogD; uniform vec3 uFogC; uniform vec3 uCam; ${CALM_FN}
    uniform vec3 uGlass, uGold, uIvory;
    uniform vec4 uGrid; // fin spacing, floor height, lit share, window strength
    uniform vec4 uGlow; // fins, sharp edges, setback band, uplight from the ledge below
    uniform vec3 uMisc; // gold glow near the ground, sky sheen, floodlit top from this height
    varying vec3 vW; varying vec3 vN; varying vec4 vFace; varying vec3 vSpan;
    float hash(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
    float lines(float x, float period, float hw){
      float w = fwidth(x), d = abs(fract(x / period + 0.5) - 0.5) * period;
      return mix(1.0 - smoothstep(max(hw - w, 0.0), hw + w, d), 2.0 * hw / period, smoothstep(0.2, 0.5, w / period));
    }
    float edgeLine(float d, float hw){
      float w = fwidth(d), k = max(hw, w * 0.8);
      return (1.0 - smoothstep(k * 0.5, k + w, d)) * sqrt(hw / k);
    }
    void main(){
      vec3 N = normalize(vN), V = normalize(uCam - vW);
      float y = vW.y, kind = vSpan.y, seed = vSpan.z;
      float facing = abs(dot(V, N));
      vec3 col = uGlass + vec3(0.07, 0.12, 0.115) * pow(1.0 - facing, 3.0) * uMisc.y;
      float sideFace = 1.0 - step(0.55, abs(N.y));
      // Edge lights read most along the silhouette, least on edges facing the camera head-on.
      float e = edgeLine(min(vFace.y, vFace.z), 0.2) * (0.3 + 0.7 * (1.0 - smoothstep(0.6, 0.98, facing)));
      // Seen up close (the end of the descent) the lights step back, so the car stays the subject.
      float d = distance(vW, uCam), near = mix(0.55, 1.0, smoothstep(80.0, 260.0, d));
      if (kind > 6.5) {
        // Deck and island rim: dark, a fine line of gold lights along the top edge
        float lip = 1.0 - smoothstep(0.0, 0.22 + fwidth(y) * 1.5, vFace.w - y);
        col = sideFace > 0.5 ? uGlass * 0.8 + uGold * lip * (0.45 + 0.55 * lines(vFace.x, 1.6, 0.25)) * 0.9 : uGlass * 0.6;
      } else if (kind < 0.5 || kind > 3.5) {
        if (sideFace > 0.5) {
          float u = vFace.x;
          vec2 cell = vec2(u / uGrid.x, y / uGrid.y);
          vec2 id = floor(cell), f = fract(cell);
          float crisp = 1.0 - smoothstep(0.3, 0.75, max(fwidth(cell.x), fwidth(cell.y)));
          float share = kind > 3.5 ? 0.55 : uGrid.z;
          float lit = step(1.0 - share, hash(vec3(id, seed * 41.0 + 3.0)));
          float pane = smoothstep(0.1, 0.2, f.x) * (1.0 - smoothstep(0.8, 0.9, f.x)) * smoothstep(0.2, 0.3, f.y) * (1.0 - smoothstep(0.7, 0.8, f.y));
          float win = mix(share * 0.4, pane * lit * (0.55 + 0.45 * hash(vec3(id.yx, seed + 7.0))), crisp);
          vec3 warm = mix(uGold, uIvory, hash(vec3(id, seed + 1.0)) * 0.7);
          col += warm * win * uGrid.w * (kind > 3.5 ? 1.8 : 1.0) * near;
          col += uIvory * lines(u, uGrid.x, uGrid.x * 0.09) * uGlow.x * near;
          col += mix(uGold, uIvory, 0.55) * e * uGlow.y;
          col += uGold * (1.0 - smoothstep(0.0, 1.1 + fwidth(y), vFace.w - y)) * uGlow.z * near;
          float nose = exp(-min(vFace.y, vFace.z) / 3.0);
          col += uGold * uGlow.w * exp(-max(y - vSpan.x, 0.0) * 0.085) * (0.25 + 0.75 * nose) * near;
          col += uIvory * 0.2 * smoothstep(uMisc.z - 24.0, uMisc.z, y);
          col += mix(uGold, uIvory, 0.5) * 0.07 * max(dot(N, vec3(0.6, 0.0, 0.8)), 0.0);
          // The Burj Al Arab's white steel exoskeleton: big X braces across the wing faces
          if (kind > 5.5) col += uIvory * (max(lines(u + y * 0.9, 34.0, 0.55), lines(u - y * 0.9, 34.0, 0.55)) * 0.45 + lines(y, 22.0, 0.35) * 0.15);
        } else {
          col = uGlass * 1.25 + uGold * 0.14 * uGlow.z;
        }
        if (kind > 4.5 && kind < 5.5) col = uGlass * 0.9 + uGold * 0.12 * exp(-max(vFace.w - y, 0.0) * 0.6);
      } else if (kind < 1.5) {
        float t = max(y - vSpan.x, 0.0);
        col = uGlass * 0.6 + uIvory * (0.62 * exp(-t * 0.024) + 0.12) + uIvory * lines(y, 3.4, 0.4) * 0.3 * exp(-t * 0.02);
        col += uIvory * 0.35 * pow(1.0 - facing, 2.0);
        col = mix(uGlass, col, near * near);
      } else if (kind < 2.5) {
        float t = clamp((y - vSpan.x) / max(vFace.w - vSpan.x, 1.0), 0.0, 1.0);
        col = mix(uGlass, uIvory, 0.5 - 0.22 * t) + uGold * 0.12 + uIvory * lines(y, 5.5, 0.35) * 0.12;
        col += uGold * e * 0.5;
      } else {
        col += uGold * (0.18 + 0.5 * exp(-max(vFace.w - y, 0.0) * 0.12)) + mix(uGold, uIvory, 0.5) * e * 0.6;
      }
      col += uGold * uMisc.x * exp(-y * 0.03) * near;
      float fd = uFogD * uFogK;
      col = mix(col, uFogC, 1.0 - exp(-fd * fd * d * d));
      gl_FragColor = vec4(mix(col, calm(col), uCalmK) * uCity, 1.0);
    }`,
};

/** Soft gold glow behind the Burj Khalifa: a camera-facing card turning about the tower's axis. */
export const halo = {
  vertex: /* glsl */ `uniform vec3 uCenter; uniform vec2 uSize; uniform float uBack;
    varying vec2 vP; varying float vD;
    void main(){
      vec3 toCam = cameraPosition - uCenter; toCam.y = 0.0;
      vec3 fwd = normalize(toCam + vec3(1e-4, 0.0, 0.0));
      vec3 right = vec3(fwd.z, 0.0, -fwd.x);
      vec3 p = uCenter - fwd * uBack + right * position.x * uSize.x + vec3(0.0, position.y * uSize.y, 0.0);
      vP = position.xy; vD = distance(p, cameraPosition);
      gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
    }`,
  fragment: /* glsl */ `uniform float uCity, uFogD, uStrength; uniform vec3 uColor;
    varying vec2 vP; varying float vD;
    void main(){
      float x = vP.x, y = vP.y;
      float g = exp(-x * x * 7.0) * (1.0 - smoothstep(0.45, 1.0, y)) * (0.35 + 0.65 * exp(-y * 2.5));
      g += exp(-x * x * 36.0) * 0.5 * (1.0 - smoothstep(0.2, 0.85, y));
      float fd = uFogD * 0.6;
      gl_FragColor = vec4(uColor * g * uStrength * exp(-fd * fd * vD * vD) * uCity, 1.0);
    }`,
};

/** The red aviation light at the Burj Khalifa's tip: larger and softer than the roof beacons. */
export const tipLight = {
  vertex: /* glsl */ `uniform float uTime, uPR; varying float vB;
    void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv;
      gl_PointSize = uPR * clamp(6000.0 / -mv.z, 10.0, 36.0);
      float f = fract(uTime * 0.5); vB = 0.5 + 0.5 * smoothstep(0.0, 0.08, f) * (1.0 - smoothstep(0.3, 0.5, f)); }`,
  fragment: /* glsl */ `uniform float uCity; varying float vB;
    void main(){ float d = length(gl_PointCoord - 0.5) * 2.0;
      float m = exp(-d * d * 28.0) * 1.5 + exp(-d * d * 5.0) * 0.3;
      gl_FragColor = vec4(vec3(1.0, 0.27, 0.2) * m * vB * uCity, 1.0); }`,
};

/** Floor under the car: helipad → road → studio turntable. */
export const floor = {
  vertex: /* glsl */ `varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragment: /* glsl */ `uniform float uPad, uRoad, uStudio, uHead, uTravel; varying vec2 vP;
    float ring(float r, float at, float w){ return 1.0 - smoothstep(0.0, w, abs(r - at)); }
    void main(){
      float r = length(vP), ang = atan(vP.y, vP.x);
      vec3 gold = vec3(0.92, 0.83, 0.62), ice = vec3(0.62, 0.88, 0.88), champ = vec3(0.96, 0.92, 0.86);
      vec3 col = vec3(0.0);
      float pad = ring(r, 6.4, 0.1) + 0.45 * ring(r, 5.5, 0.05) + 0.7 * step(0.5, fract(ang / 6.2831853 * 48.0)) * ring(r, 7.3, 0.06);
      // The pad's rings and ticks fade out from afar instead of aliasing (chapter 1 opens far away).
      float near = 1.0 - smoothstep(0.08, 0.35, fwidth(r));
      col += gold * pad * uPad * near;
      float fade = 1.0 - smoothstep(8.0, 40.0, abs(vP.x));
      float edges = ring(abs(vP.y), 2.6, 0.05);
      float centre = step(0.55, fract((vP.x + uTravel) / 3.2)) * ring(vP.y, 0.0, 0.05);
      float side = step(0.8, fract((vP.x + uTravel) / 1.6)) * ring(abs(vP.y), 5.2, 0.04);
      col += ice * (edges * 0.55 + centre * 0.9 + side * 0.4) * fade * uRoad;
      float tick = step(0.86, fract(ang / 6.2831853 * 72.0)) * (1.0 - smoothstep(0.0, 0.02, abs(r - 4.9) - 0.18));
      float rings = ring(r, 4.6, 0.03) + ring(r, 5.3, 0.02) * 0.7 + ring(r, 8.0, 0.025) * 0.5 + ring(r, 12.0, 0.03) * 0.3;
      col += champ * (rings * 0.55 + tick * 0.6) * uStudio;
      col += champ * exp(-r * r / 9.0) * 0.12 * max(uStudio, max(uPad * near, uRoad));
      col += vec3(0.85, 0.93, 1.0) * exp(-pow(vP.x - 6.5, 2.0) / 14.0 - vP.y * vP.y / 3.0) * step(2.0, vP.x) * 0.45 * uHead;
      col *= 1.0 - smoothstep(16.0, 44.0, r);
      gl_FragColor = vec4(col, 1.0);
    }`,
};

/** Velocity Tunnel streaks: line segments wrapped around the travel axis. */
export const streaks = {
  vertex: /* glsl */ `attribute float aA, aR, aX, aE, aS, aH; uniform float uTravel, uSpeed, uOpacity, uLen; varying float vA; varying float vH;
    void main(){
      float x = mod(aX - uTravel * (0.55 + 0.9 * aS), uLen) - uLen * 0.5;
      x += aE * (0.3 + uSpeed * (2.0 + 6.0 * aS));
      vec3 p = vec3(x, sin(aA) * aR, cos(aA) * aR);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      vA = mix(1.0, 0.05, aE) * (1.0 - smoothstep(uLen * 0.28, uLen * 0.5, abs(x))) * uOpacity * (0.35 + 0.65 * aS);
      vH = aH;
    }`,
  fragment: /* glsl */ `varying float vA; varying float vH; void main(){ gl_FragColor = vec4(mix(vec3(0.66, 0.90, 0.90), vec3(0.92, 0.83, 0.62), vH) * vA, 1.0); }`,
};

/**
 * The light-sculpture car. Additions to the prototype: `uFade` dissolves a car away when
 * another one takes its place, loose dust drifts slowly with `uTime` (the ambient motion the
 * Pause control stops), and `uPaint` lets the formed car take on its own image colour
 * (`aPaint`) over the colour-by-part palette (`aColor`); loose dust always stays gold. With
 * `uXray` (image cars) the exploded body fades its panels to line-work around the powertrain.
 */
export const car = {
  vertex: /* glsl */ `attribute vec3 aExplode, aScatter, aColor, aPaint; attribute float aComp, aRnd, aBright;
    uniform float uExplode, uForm, uHead, uTime, uSize, uPR, uFade, uPaint, uXray;
    varying vec3 vColor; varying float vAlpha;
    void main(){
      float e = clamp(uExplode * 1.3 - aRnd * 0.3, 0.0, 1.0); e = e * e * (3.0 - 2.0 * e);
      vec3 p = position + aExplode * e;
      p.y += sin(uTime * 1.3 + aRnd * 40.0) * 0.035 * e;
      float f = clamp(uForm * 1.35 - aRnd * 0.35, 0.0, 1.0); f = f * f * (3.0 - 2.0 * f);
      vec3 dust = aScatter + vec3(sin(uTime * 0.21 + aRnd * 31.0), sin(uTime * 0.17 + aRnd * 53.0) * 0.6, cos(uTime * 0.19 + aRnd * 47.0)) * 0.35;
      p = mix(dust, p, f);
      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      gl_Position = projectionMatrix * mv;
      float isHead = step(3.5, aComp) * step(aComp, 4.5);
      float isPower = step(2.5, aComp) * step(aComp, 3.5);
      float size = uSize * (0.75 + 0.8 * aBright) * (1.0 + isHead * uHead * 1.6);
      float px = size * uPR * (10.0 / max(0.5, -mv.z));
      gl_PointSize = max(1.0, px);
      float a = mix(0.32, 0.8, aBright);
      a *= mix(1.0, e, isPower);
      a *= mix(1.0, 0.45 + 1.2 * uHead, isHead);
      float isBody = 1.0 - step(0.5, aComp);
      a *= mix(1.0, mix(0.45, 1.0, smoothstep(0.3, 0.75, aBright)), e * isBody * uXray);
      a *= mix(0.55, 1.0, f);
      a *= uFade;
      // Points smaller than a pixel keep their true weight (seen from afar, the dust is faint).
      a *= min(1.0, px * px * 4.0);
      vColor = mix(aColor, aPaint, uPaint * f * (1.0 - isHead)); vAlpha = a;
    }`,
  fragment: /* glsl */ `varying vec3 vColor; varying float vAlpha;
    void main(){ float d = length(gl_PointCoord - 0.5); float m = smoothstep(0.5, 0.0, d); gl_FragColor = vec4(vColor * m * m * vAlpha, 1.0); }`,
};

export const headGlow = {
  vertex: /* glsl */ `uniform float uHead, uPR; void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = uPR * 70.0 * uHead * (6.0 / max(1.0, -mv.z)); }`,
  fragment: /* glsl */ `uniform float uHead; void main(){ float d = length(gl_PointCoord - 0.5); gl_FragColor = vec4(vec3(0.85, 0.94, 1.0) * exp(-d * d * 18.0) * uHead, 1.0); }`,
};

export const beam = {
  vertex: /* glsl */ `varying float vV; void main(){ vV = uv.y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragment: /* glsl */ `uniform float uHead; varying float vV; void main(){ gl_FragColor = vec4(vec3(0.8, 0.9, 1.0) * pow(vV, 1.6) * uHead * 0.16, 1.0); }`,
};
