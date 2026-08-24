export const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export const rand = () => Math.random();

export const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

export const noise = (eta: number) => (Math.random() * 2 - 1) * eta;

export const d6 = (eta: number) => Math.max(1, Math.min(6, Math.round(3 + noise(eta) * 3)));

export const pickWeighted = <T,>(entries: [T, number][]): T => {
  const total = entries.reduce((s, e) => s + Math.max(0, e[1]), 0);
  if (total <= 0) return entries[0][0];
  let roll = Math.random() * total;
  for (const [v, w] of entries) {
    roll -= Math.max(0, w);
    if (roll <= 0) return v;
  }
  return entries[entries.length - 1][0];
};
