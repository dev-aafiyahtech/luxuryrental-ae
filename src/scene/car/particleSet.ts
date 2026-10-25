import { particleSets } from "./particleSets";

// Loads the particle set sampled from a car's side image (tools/sample-car-particles.mjs).
// Decoded sets are cached for the session (a few hundred KB for the top 5); each request
// can be aborted, so a stage that unmounts mid-download leaves nothing running.

export interface ParticleSetMeta {
  v: number;
  slug: string;
  count: number;
  /** Metres. */
  length: number;
  width: number;
  height: number;
  /** Rear then front: [x, y, r] (model space: x tail → nose, y up from the floor). */
  wheels: [number, number, number][];
  /** z of the wheels' outer faces. */
  wheelZ: number;
  belt: number;
  /** Glasshouse x-range [rear, front]. */
  glass: [number, number];
  /** Typical sill height between the wheels. */
  sill: number;
  nose: number;
  tail: number;
  /** Head and tail lamp centres [x, y, z] (mirrored on −z), when found. */
  head: [number, number, number] | null;
  rear: [number, number, number] | null;
  /** Top of the outline, tail → nose: [x, y]. */
  roofline: [number, number][];
}

export interface ParticleSet {
  meta: ParticleSetMeta;
  count: number;
  /** Millimetres, xyz per point. */
  pos: Int16Array;
  /** sRGB bytes from the image, rgb per point. */
  col: Uint8Array;
  /** 0 body, 1 cabin, 2 wheels, 4 head lamp, 5 tail lamp. */
  part: Uint8Array;
  bright: Uint8Array;
}

export function decodeParticleSet(buf: ArrayBuffer): ParticleSet {
  const view = new DataView(buf);
  const magic = String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3));
  if (magic !== "LRPS") throw new Error("Not a particle set");
  const version = view.getUint32(4, true);
  if (version !== 1) throw new Error(`Unsupported particle set version ${version}`);
  const count = view.getUint32(8, true);
  const metaBytes = view.getUint32(12, true);
  const meta = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 16, metaBytes))) as ParticleSetMeta;
  let o = 16 + metaBytes;
  const need = o + count * 11;
  if (buf.byteLength < need || o % 2) throw new Error("Truncated particle set");
  const pos = new Int16Array(buf, o, count * 3);
  o += count * 6;
  const col = new Uint8Array(buf, o, count * 3);
  o += count * 3;
  const part = new Uint8Array(buf, o, count);
  o += count;
  const bright = new Uint8Array(buf, o, count);
  return { meta, count, pos, col, part, bright };
}

const cache = new Map<string, ParticleSet>();

/** The car's particle set, or null when it has none (the stage then builds the procedural car). */
export async function loadParticleSet(slug: string, signal: AbortSignal): Promise<ParticleSet | null> {
  const url = particleSets[slug];
  if (!url) return null;
  const hit = cache.get(url);
  if (hit) return hit;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Particle set ${url}: HTTP ${res.status}`);
  const set = decodeParticleSet(await res.arrayBuffer());
  cache.set(url, set);
  return set;
}
