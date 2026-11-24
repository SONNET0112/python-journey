import type { DailyTask, Energy, ReviewItem, Topic, Will } from "../types";
import { addDays } from "../utils/date";

/**
 * Pacing model, in one place so the plan, the UI and the tests cannot disagree.
 *
 * - Spacing: a learned point comes back after 1, 3, 7 and 21 days.
 * - Load: a session buys a fixed number of "slots"; a hard point costs two, everything else one.
 * - Rhythm: five days of new material, one consolidation day (reviews + project, no new
 *   points), one rest day. Never punish rest — the queue just waits.
 */
export const REVIEW_INTERVALS = [1, 3, 7, 21];

export const SLOTS: Record<number, number> = { 15: 1, 30: 2, 45: 3, 60: 4, 90: 5 };

export function slotsFor(minutes: number, energy: Energy = "normal", will: Will = "normal"): number {
  const base = SLOTS[minutes] ?? Math.max(1, Math.min(5, Math.round(minutes / 20)));
  let slots = base;
  if (energy === "tired") slots -= 1;
  if (will === "reluctant") slots -= 1;
  return Math.max(1, slots);
}

export const reviewKey = (topicId: string, point: string) => `${topicId}::${point}`;

/** level 3 (concept-dense / hands-on) takes two slots so it gets a real session. */
export const costOf = (topic: Topic, point: string): number => ((topic.difficulty?.[point] ?? 2) >= 3 ? 2 : 1);

/** Walks the cursor forward while the session budget allows; always returns at least one point. */
export function pickPoints(topic: Topic, start: number, slots: number): string[] {
  const picked: string[] = [];
  let budget = slots;
  for (let i = Math.max(0, start); i < topic.points.length; i++) {
    const cost = costOf(topic, topic.points[i]);
    if (picked.length > 0 && cost > budget) break;
    picked.push(topic.points[i]);
    budget -= cost;
    if (budget <= 0) break;
  }
  return picked;
}

export function scheduleAfterLearn(topicId: string, points: string[], date: string, existing: ReviewItem[]): ReviewItem[] {
  const next = [...existing];
  for (const point of points) {
    const key = reviewKey(topicId, point);
    const item: ReviewItem = { key, topicId, point, stage: 0, due: addDays(date, REVIEW_INTERVALS[0]), doneCount: 0 };
    const i = next.findIndex((x) => x.key === key);
    if (i >= 0) next[i] = { ...next[i], stage: 0, due: item.due };
    else next.push(item);
  }
  return next;
}

/** Only a reviewed point moves to the next interval; stage 4 means "retired from the queue". */
export function advanceReview(items: ReviewItem[], key: string, date: string): ReviewItem[] {
  return items.map((item) => {
    if (item.key !== key) return item;
    const stage = item.stage + 1;
    return {
      ...item,
      stage,
      doneCount: item.doneCount + 1,
      due: stage < REVIEW_INTERVALS.length ? addDays(date, REVIEW_INTERVALS[stage]) : date,
    };
  });
}

export const isRetired = (item: ReviewItem) => item.stage >= REVIEW_INTERVALS.length;

/** Due points, oldest first. Capped so reviews never eat the whole session. */
export function dueReviews(items: ReviewItem[], date: string, limit = 2): ReviewItem[] {
  return items
    .filter((x) => !isRetired(x) && x.due <= date)
    .sort((a, b) => a.due.localeCompare(b.due) || b.stage - a.stage)
    .slice(0, limit);
}

export const reviewTask = (item: ReviewItem, date: string, index: number): DailyTask => ({
  id: `${date}-review-item-${index}`,
  section: "review",
  title: `间隔复习（第 ${item.stage + 1} 次）：${item.point}`,
  minutes: 4,
  done: false,
  reviewKey: item.key,
});

/**
 * Days left for the current topic at this pace — used to answer "这样安排要多久".
 * A hard point still costs two sessions-slots, so it counts as its cost.
 */
export function daysFor(topic: Topic, start: number, slots: number): number {
  let budget = slots;
  let days = 1;
  let spent = 0;
  for (let i = start; i < topic.points.length; i++) {
    const cost = costOf(topic, topic.points[i]);
    if (spent + cost > budget) {
      days += 1;
      spent = 0;
      budget = slots;
    }
    spent += cost;
  }
  return Math.max(1, days);
}
