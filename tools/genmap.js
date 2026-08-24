#!/usr/bin/env node
// Generates src/data/geometry.ts from real India state boundaries (udit-001 districts GeoJSON).
// Real shapes, fictional names: each game region maps to real state(s).
const fs = require('fs');

const SRC = process.argv[2] || '/tmp/opencode/india-districts.geojson';
const OUT = __dirname + '/../src/data/geometry.ts';

// game region id -> [real state names], fictional capital name + [lon, lat]
const MAP = {
  kashyapmir: { states: ['Jammu and Kashmir'], city: 'Shrinagar', cityAt: [74.8, 34.08] },
  ladvi: { states: ['Ladakh'], city: 'Lehpur', cityAt: [77.58, 34.16] },
  himagiri: { states: ['Himachal Pradesh'], city: 'Shimlapur', cityAt: [77.17, 31.1] },
  panchanad: { states: ['Punjab', 'Chandigarh'], city: 'Chandimandir', cityAt: [76.78, 30.73] },
  haryali: { states: ['Haryana'], city: 'Faridnagar', cityAt: [77.31, 28.41] },
  indraprastha: { states: ['Delhi'], city: 'Indraprastha', cityAt: [77.1, 28.62] },
  kedarkhand: { states: ['Uttarakhand'], city: 'Dehradun', cityAt: [78.03, 30.32] },
  uttardesh: { states: ['Uttar Pradesh'], city: 'Awadhpur', cityAt: [80.95, 26.85] },
  rajputana: { states: ['Rajasthan'], city: 'Jaypura', cityAt: [75.79, 26.91] },
  gurjaratra: { states: ['Gujarat', 'Dadra and Nagar Haveli and Daman and Diu'], city: 'Ashaval', cityAt: [72.58, 23.03] },
  gomantak: { states: ['Goa'], city: 'Panajipur', cityAt: [73.83, 15.49] },
  madhyadesh: { states: ['Madhya Pradesh'], city: 'Bhojpal', cityAt: [77.41, 23.26] },
  dandak: { states: ['Chhattisgarh'], city: 'Raipura', cityAt: [81.63, 21.25] },
  magadh: { states: ['Bihar'], city: 'Patliputra', cityAt: [85.14, 25.59] },
  vananchal: { states: ['Jharkhand'], city: 'Ranchinagar', cityAt: [85.31, 23.34] },
  gaurdesh: { states: ['West Bengal'], city: 'Kalika', cityAt: [88.36, 22.57] },
  neeladri: { states: ['Sikkim'], city: 'Gangtokpur', cityAt: [88.51, 27.33] },
  kamarupa: { states: ['Assam'], city: 'Pragjyotish', cityAt: [91.78, 26.14] },
  udayachal: { states: ['Arunachal Pradesh'], city: 'Itanagari', cityAt: [93.62, 27.08] },
  meghvan: { states: ['Meghalaya'], city: 'Shillongi', cityAt: [91.88, 25.57] },
  purvanachal: { states: ['Manipur', 'Nagaland', 'Mizoram', 'Tripura'], city: 'Imphalvatika', cityAt: [93.94, 24.82] },
  kalinga: { states: ['Odisha'], city: 'Bhubaneswarpur', cityAt: [85.82, 20.3] },
  marudesh: { states: ['Maharashtra'], city: 'Mumtara', cityAt: [72.88, 19.08] },
  telingana: { states: ['Telangana'], city: 'Bhagyanagar', cityAt: [78.49, 17.39] },
  andhradesam: { states: ['Andhra Pradesh', 'Puducherry'], city: 'Amaravatipuram', cityAt: [80.51, 16.51] },
  karnata: { states: ['Karnataka'], city: 'Bendakaluru', cityAt: [77.59, 12.97] },
  tamizhagam: { states: ['Tamil Nadu'], city: 'Chennaiyur', cityAt: [80.27, 13.08] },
  cheralam: { states: ['Kerala'], city: 'Kochchi', cityAt: [76.27, 9.93] },
};

const W = 1000, H = 1000, MARGIN = 24;

const gj = JSON.parse(fs.readFileSync(SRC, 'utf8'));

// collect rings per state
const stateRings = {};
for (const f of gj.features) {
  const st = f.properties.st_nm;
  if (!st) continue;
  const geom = f.geometry;
  if (!geom) continue;
  const polys = geom.type === 'Polygon' ? [geom.coordinates] : geom.type === 'MultiPolygon' ? geom.coordinates : [];
  (stateRings[st] ??= []).push(...polys);
}

// lon/lat bounds of relevant states (exclude islands far out)
const usedStates = new Set(Object.values(MAP).flatMap((m) => m.states));
let minLon = 180, maxLon = -180, minLat = 90, maxLat = -90;
for (const st of usedStates) {
  for (const poly of stateRings[st] || []) {
    for (const [lon, lat] of poly[0]) {
      if (lon < 60 || lon > 105 || lat < 5 || lat > 40) continue;
      minLon = Math.min(minLon, lon); maxLon = Math.max(maxLon, lon);
      minLat = Math.min(minLat, lat); maxLat = Math.max(maxLat, lat);
    }
  }
}
const midLat = ((minLat + maxLat) / 2) * Math.PI / 180;
const kx = Math.cos(midLat);
// fit preserving aspect
const spanX = (maxLon - minLon) * kx, spanY = maxLat - minLat;
const scale = Math.min((W - 2 * MARGIN) / spanX, (H - 2 * MARGIN) / spanY);
const offX = (W - spanX * scale) / 2, offY = (H - spanY * scale) / 2;
const px = (lon, lat) => [Math.round(offX + (lon - minLon) * kx * scale), Math.round(offY + (maxLat - lat) * scale)];

// Douglas-Peucker
const perp = (p, a, b) => {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const l2 = dx * dx + dy * dy;
  if (!l2) return Math.hypot(p[0] - a[0], p[1] - a[1]);
  let t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
};
function dp(pts, tol) {
  if (pts.length < 5) return pts;
  let maxD = 0, idx = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const d = perp(pts[i], pts[0], pts[pts.length - 1]);
    if (d > maxD) { maxD = d; idx = i; }
  }
  if (maxD <= tol) return [pts[0], pts[pts.length - 1]];
  return [...dp(pts.slice(0, idx + 1), tol).slice(0, -1), ...dp(pts.slice(idx), tol)];
}

const ringArea = (pts) => {
  let a = 0;
  for (let i = 0; i < pts.length - 1; i++) a += pts[i][0] * pts[i + 1][1] - pts[i + 1][0] * pts[i][1];
  return Math.abs(a / 2);
};

const TOL = 3.2; // projected units
const geo = {};
for (const [id, m] of Object.entries(MAP)) {
  const rings = [];
  for (const st of m.states) {
    for (const poly of stateRings[st] || []) {
      const outer = poly[0].map(([lon, lat]) => px(lon, lat));
      rings.push(dp(outer, TOL));
    }
  }
  rings.sort((a, b) => ringArea(b) - ringArea(a));
  const keep = rings.filter((r) => ringArea(r) > 40).slice(0, m.states.length > 1 ? 4 : 1);
  // drop rings fully inside another kept ring (enclaves like Puducherry-in-TN etc.)
  const inside = (r, q) => {
    let ins = 0;
    for (const p of q) { let c = false; const n = r.length; for (let i = 0, j = n - 1; i < n; j = i++) { if (((r[i][1] > p[1]) !== (r[j][1] > p[1])) && (p[0] < ((r[j][0] - r[i][0]) * (p[1] - r[i][1])) / (r[j][1] - r[i][1]) + r[i][0])) c = !c; } if (c) ins++; }
    return ins > q.length * 0.6;
  };
  const finalRings = [];
  for (const r of keep) {
    if (!finalRings.some((f) => inside(f, r) || ringArea(f) > ringArea(r) * 20)) finalRings.push(r);
  }
  const main = finalRings.reduce((a, b) => (ringArea(a) > ringArea(b) ? a : b));
  const cx = Math.round(main.reduce((s, p) => s + p[0], 0) / main.length);
  const cy = Math.round(main.reduce((s, p) => s + p[1], 0) / main.length);
  geo[id] = { rings: finalRings, center: [cx, cy], cityAt: px(m.cityAt[0], m.cityAt[1]), city: m.city };
}

// neighbors: min distance between ring point sets
const ids = Object.keys(geo);
const dist = (a, b) => {
  let best = 1e9;
  for (const p of a) for (const q of b) {
    const d = Math.hypot(p[0] - q[0], p[1] - q[1]);
    if (d < best) best = d;
  }
  return best;
};
const neighbors = {};
for (let i = 0; i < ids.length; i++) {
  neighbors[ids[i]] = [];
  for (let j = 0; j < ids.length; j++) {
    if (i === j) continue;
    let best = 1e9;
    for (const ra of geo[ids[i]].rings) for (const rb of geo[ids[j]].rings) best = Math.min(best, dist(ra, rb));
    if (best < 9) neighbors[ids[i]].push(ids[j]);
  }
}

let out = `// AUTO-GENERATED by tools/genmap.js from real India state boundaries (udit-001/india-maps-data).\n// Real geometry, fictional names. Do not edit by hand.\nimport { RegionGeometry } from '../types';\n\nexport const GEOMETRY: Record<string, RegionGeometry> = ${JSON.stringify(
  Object.fromEntries(Object.entries(geo).map(([id, g]) => [id, { rings: g.rings, center: g.center, cityAt: g.cityAt, city: g.city, neighbors: neighbors[id] }])),
  null,
  1
)};\n`;
fs.writeFileSync(OUT, out);

const pts = Object.values(geo).flatMap((g) => g.rings.flat());
console.log('regions:', ids.length, '| rings:', Object.values(geo).reduce((s, g) => s + g.rings.length, 0), '| avg pts/ring:', Math.round(pts.length / Object.values(geo).reduce((s, g) => s + g.rings.length, 0)), '| bytes:', out.length);
console.log('neighbors sample uttardesh:', neighbors.uttardesh.join(','));
console.log('neighbors sample tamizhagam:', neighbors.tamizhagam.join(','));
