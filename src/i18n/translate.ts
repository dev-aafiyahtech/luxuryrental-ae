// Message lookup shared by the server dictionaries, the client provider and the static
// translator. Safe to import anywhere (no server-only APIs).

export type Vars = Record<string, string | number>;
type Tree = Record<string, unknown>;

/** Look up "a.b.c" in a message tree and fill {placeholders}. Returns the key if missing. */
export function translate(messages: Tree | undefined, key: string, vars?: Vars): string {
  const value = key.split(".").reduce<unknown>((node, part) => (node && typeof node === "object" ? (node as Tree)[part] : undefined), messages);
  if (typeof value !== "string") return key;
  return vars ? value.replace(/\{(\w+)\}/g, (_, name: string) => String(vars[name] ?? `{${name}}`)) : value;
}

const isTree = (v: unknown): v is Tree => !!v && typeof v === "object" && !Array.isArray(v);

/**
 * A translation laid over the English messages, key by key, so a string the translator hasn't
 * reached yet shows in English instead of as a raw key.
 */
export function withFallback<T extends Tree>(base: T, over: Tree | undefined): T {
  if (!over) return base;
  const out: Tree = { ...base };
  for (const [k, v] of Object.entries(over)) {
    if (typeof v === "string" && v.trim() === "") continue;
    out[k] = isTree(base[k]) && isTree(v) ? withFallback(base[k] as Tree, v) : v;
  }
  return out as T;
}
