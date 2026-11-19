import { ENCOURAGEMENTS } from "../data/encouragements";

/** Picks the least-recently seen line for a scene, so the same sentence doesn't repeat. */
export function pickLine(scene: string, seen: string[]): { line: string; seen: string[] } {
  const pool = ENCOURAGEMENTS.find((e) => e.scene === scene)?.lines ?? ENCOURAGEMENTS[0].lines;
  const fresh = pool.filter((l) => !seen.includes(l));
  const line = (fresh.length ? fresh : pool)[0];
  const nextSeen = [...seen.filter((l) => l !== line), line].slice(-40);
  return { line, seen: nextSeen };
}

export const lineFor = (scene: string): string => (ENCOURAGEMENTS.find((e) => e.scene === scene)?.lines[0] ?? ENCOURAGEMENTS[0].lines[0]);

/** Same sentence for the whole day, a different one tomorrow. */
export function dailyLine(scene: string, date: string): string {
  const pool = ENCOURAGEMENTS.find((e) => e.scene === scene)?.lines ?? ENCOURAGEMENTS[0].lines;
  const seed = date.split("-").reduce((s, p) => s + Number(p), 0);
  return pool[seed % pool.length];
}
