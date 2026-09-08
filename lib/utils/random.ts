// Générateur pseudo-aléatoire seedé — garantit qu'une session est
// reproductible à partir de sa seed, tout en étant différente d'une
// session à l'autre.

export function mulberry32(seed: number) {
  let a = seed;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type RNG = () => number;

export function randRange(rng: RNG, min: number, max: number): number {
  return min + rng() * (max - min);
}

export function randInt(rng: RNG, min: number, max: number): number {
  return Math.floor(randRange(rng, min, max + 1));
}

export function pick<T>(rng: RNG, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

// Tirage gaussien approché (somme de 3 uniformes) — plus réaliste que
// l'uniforme pur pour distribuer les niveaux scolaires.
export function randGauss(rng: RNG, mean: number, stdDev: number): number {
  const u = (rng() + rng() + rng()) / 3; // approx normale centrée
  return mean + (u - 0.5) * 2 * stdDev * 1.7;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function newSeed(): number {
  return Math.floor(Math.random() * 2 ** 31);
}
