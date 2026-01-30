export function clampNumber(value, min, max, fallback = min) {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.min(max, Math.max(min, num));
}

export function clampInt(v, min, max, fallback) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.round(n)));
}

export function normalizeColor(value, fallback) {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

export function roundN(n) {
  return Math.round((n || 0) * 1000) / 1000;
}

export function vec3ToArr(v) {
  if (!v) return null;
  return [roundN(v.x), roundN(v.y), roundN(v.z)];
}

export function eulerToArr(e) {
  if (!e) return null;
  return [roundN(e.x), roundN(e.y), roundN(e.z)];
}
