import { ACHIEVEMENTS } from "../data/achievements";
import { TOPICS } from "../data/roadmap";
import type { AppData, GrowthJournal } from "../types";
import { todayISO } from "../utils/date";

const unlocked = (data: AppData, id: string): boolean => {
  switch (id) {
    case "first-seed":
      return Object.keys(data.records).length >= 1;
    case "first-module":
      return data.progress.completedTopicIds.length >= 1;
    case "water-7":
      return Object.keys(data.records).length >= 7;
    case "first-project":
      return data.progress.completedProjects.length >= 1;
    case "stage-1":
      return data.progress.completedStages.includes("stage-1");
    case "all-stages":
      return data.progress.completedStages.length === 6;
    case "fruit":
      return data.progress.completedTopicIds.length === TOPICS.length;
    case "journal":
      return data.journal.length >= 1;
    default:
      return false;
  }
};

/** Returns the ids that just became true — the caller decides how to announce them. */
export function evaluate(data: AppData): string[] {
  return ACHIEVEMENTS.filter((a) => !data.achievements[a.id] && unlocked(data, a.id)).map((a) => a.id);
}

export const achievementList = (data: AppData, journals: GrowthJournal[] = data.journal) =>
  ACHIEVEMENTS.map((a) => ({ ...a, unlockedAt: data.achievements[a.id] ?? null, ready: unlocked({ ...data, journal: journals }, a.id) }));

export const unlockAll = (data: AppData): AppData => {
  const ids = evaluate(data);
  if (!ids.length) return data;
  const at = todayISO();
  const achievements = { ...data.achievements };
  for (const id of ids) achievements[id] = at;
  return { ...data, achievements };
};
