// GLSL for the homepage stage, ported from the approved prototype (three r128) to r186.
// three still accepts GLSL1-style ShaderMaterial source on WebGL2 (it adds the
// `in`/`out`/`pc_fragColor` defines). None of these shaders include
// <colorspace_fragment>, so they write their colours straight to the sRGB canvas, exactly
// as r128 did with linear output: the look matches qa/screenshots.

const FOG_FN = /* glsl */ `
uniform float uFogD; uniform vec3 uFogC; uniform vec3 uCam;
vec3 applyFog(vec3 col, vec3 w){ float d = distance(w, uCam); float f = 1.0 - exp(-uFogD * uFogD * d * d); return mix(col, uFogC, f); }`;

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
  fragment: /* glsl */ `uniform float uCity; ${FOG_FN}
    varying vec3 vW; varying vec3 vN; varying float vSeed;
    float hash(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
    void main(){
      vec3 col = vec3(0.024, 0.055, 0.055);
      if (abs(vN.y) < 0.5) {
        vec2 t = normalize(vec2(-vN.z, vN.x));
        vec2 cell = vec2(dot(vW.xz, t) / 1.25, vW.y / 1.6);
        vec2 id = floor(cell), f = fract(cell);
        float win = step(0.16, f.x) * step(f.x, 0.84) * step(0.2, f.y) * step(f.y, 0.8);
        float lit = step(0.6, hash(vec3(id, vSeed * 97.0 + floor(vN.x * 3.0 + vN.z * 5.0))));
        vec3 warm = mix(vec3(0.96, 0.78, 0.50), vec3(1.0, 0.93, 0.82), hash(vec3(id.yx, vSeed * 13.0)));
        float near = smoothstep(750.0, 220.0, distance(vW, uCam));
        col += warm * (win * lit * (0.5 + 0.5 * hash(vec3(id, 3.1))) * near + 0.2 * (1.0 - near));
        col += vec3(0.045, 0.085, 0.085) * win * (1.0 - lit) * near;
        col += vec3(0.55, 0.50, 0.36) * 0.35 * exp(-vW.y * 0.06);
      } else { col *= 1.4; }
      gl_FragColor = vec4(applyFog(col, vW) * uCity, 1.0);
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

/** Street grid with moving traffic. */
export const ground = {
  vertex: /* glsl */ `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
  fragment: /* glsl */ `uniform float uCity, uTime; ${FOG_FN}
    varying vec3 vW;
    float ln(float v, float sp, float w){ float f = abs(fract(v / sp + 0.5) - 0.5) * sp; return 1.0 - smoothstep(0.0, w, f); }
    void main(){
      float gx = vW.x + 7.0, gz = vW.z + 7.0;
      float mnr = max(ln(gx, 14.0, 0.22), ln(gz, 14.0, 0.22));
      float maj = max(ln(gx, 42.0, 0.7), ln(gz, 42.0, 0.7));
      float l1 = ln(gx - 1.4, 42.0, 0.3) * step(0.78, fract((vW.z + uTime * 22.0) / 11.0));
      float l2 = ln(gx + 1.4, 42.0, 0.3) * step(0.78, fract((vW.z - uTime * 19.0) / 13.0));
      float l3 = ln(gz - 1.4, 42.0, 0.3) * step(0.78, fract((vW.x + uTime * 20.0) / 12.0));
      float l4 = ln(gz + 1.4, 42.0, 0.3) * step(0.78, fract((vW.x - uTime * 24.0) / 10.0));
      vec3 col = vec3(0.014, 0.035, 0.035);
      col += vec3(0.55, 0.50, 0.36) * (maj * 0.5 + mnr * 0.16);
      col += vec3(1.0, 0.86, 0.62) * (l1 + l3) * 1.1 + vec3(0.98, 0.25, 0.2) * (l2 + l4) * 0.9;
      col *= 1.0 - smoothstep(260.0, 420.0, length(vW.xz)) * 0.6;
      gl_FragColor = vec4(applyFog(col, vW) * uCity, 1.0);
    }`,
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
      col += gold * pad * uPad;
      float fade = 1.0 - smoothstep(8.0, 40.0, abs(vP.x));
      float edges = ring(abs(vP.y), 2.6, 0.05);
      float centre = step(0.55, fract((vP.x + uTravel) / 3.2)) * ring(vP.y, 0.0, 0.05);
      float side = step(0.8, fract((vP.x + uTravel) / 1.6)) * ring(abs(vP.y), 5.2, 0.04);
      col += ice * (edges * 0.55 + centre * 0.9 + side * 0.4) * fade * uRoad;
      float tick = step(0.86, fract(ang / 6.2831853 * 72.0)) * (1.0 - smoothstep(0.0, 0.02, abs(r - 4.9) - 0.18));
      float rings = ring(r, 4.6, 0.03) + ring(r, 5.3, 0.02) * 0.7 + ring(r, 8.0, 0.025) * 0.5 + ring(r, 12.0, 0.03) * 0.3;
      col += champ * (rings * 0.55 + tick * 0.6) * uStudio;
      col += champ * exp(-r * r / 9.0) * 0.12 * max(uStudio, max(uPad, uRoad));
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
      gl_PointSize = max(1.0, size * uPR * (10.0 / max(0.5, -mv.z)));
      float a = mix(0.32, 0.8, aBright);
      a *= mix(1.0, e, isPower);
      a *= mix(1.0, 0.45 + 1.2 * uHead, isHead);
      float isBody = 1.0 - step(0.5, aComp);
      a *= mix(1.0, mix(0.45, 1.0, smoothstep(0.3, 0.75, aBright)), e * isBody * uXray);
      a *= mix(0.55, 1.0, f);
      a *= uFade;
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
