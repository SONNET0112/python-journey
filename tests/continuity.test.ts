import { describe, expect, it } from "vitest";
import { TOPICS } from "../src/data/roadmap";
import { generatePlan } from "../src/services/taskGenerator";
import { advancePoints } from "../src/services/progressCalculator";
import type { Mastery } from "../src/types";

const topic = TOPICS[0]; // 面向对象基础, 6 个知识点

/** Replays exactly what the store does, so the "is it continuous?" question has a real answer. */
function simulate(days: number, masteryOf: (day: number) => Mastery) {
  let topicIndex = 0;
  let covered = 0;
  const out: { day: number; topic: string; taught: string[]; review: string; covered: number }[] = [];
  let previousPoints: string[] = [];
  for (let d = 1; d <= days; d++) {
    const t = TOPICS[topicIndex];
    const plan = generatePlan({
      date: `2026-11-${String(d).padStart(2, "0")}`,
      topic: t,
      minutes: 30,
      energy: "normal",
      will: "normal",
      difficulty: "normal",
      reviewCount: 0,
      startPoint: covered,
      previousPoints,
    });
    const mastery = masteryOf(d);
    const cursor = advancePoints(t, covered, plan.points.length, mastery);
    if (cursor.finished) {
      topicIndex = Math.min(topicIndex + 1, TOPICS.length - 1);
      covered = 0;
    } else {
      covered = cursor.covered;
    }
    previousPoints = plan.points;
    out.push({ day: d, topic: t.title, taught: plan.points, review: plan.tasks[0].title, covered: cursor.covered });
  }
  return out;
}

describe("knowledge continuity across days", () => {
  it("walks all 6 points of a week before changing topic", () => {
    const days = simulate(4, () => "full");
    expect(days[0].topic).toBe(topic.title);
    expect(days[0].taught).toEqual(topic.points.slice(0, 2));
    expect(days[1].taught).toEqual(topic.points.slice(2, 4));
    expect(days[2].taught).toEqual(topic.points.slice(4, 6));
    const seen = days.slice(0, 3).flatMap((d) => d.taught);
    expect(new Set(seen).size).toBe(topic.points.length);
    expect(days[3].topic).not.toBe(topic.title); // only now do we move on
  });

  it("quotes yesterday's points in today's review task", () => {
    const days = simulate(3, () => "full");
    expect(days[1].review).toContain("回顾昨天");
    expect(days[1].review).toContain(topic.points[0]);
    expect(days[2].review).toContain(topic.points[2]);
  });

  it("needs a real mastery answer to move the cursor", () => {
    const days = simulate(3, (d) => (d === 1 ? "review" : "full"));
    expect(days[1].taught).toEqual(topic.points.slice(0, 2)); // nothing advanced on "还需要复习"
    expect(days[0].taught).toEqual(days[1].taught);
  });

  it("basic mastery still advances, none does not", () => {
    const basic = simulate(2, () => "basic");
    expect(basic[1].taught).toEqual(topic.points.slice(2, 4));
    const none = simulate(2, () => "none");
    expect(none[1].taught).toEqual(topic.points.slice(0, 2));
  });

  it("stages 2–6 are single-point topics so every day has one clear thread", () => {
    const later = TOPICS.filter((t) => t.stageId !== "stage-1");
    expect(later.every((t) => t.points.length === 1 && t.title === t.points[0])).toBe(true);
  });

  it("advancePoints never overflows a topic", () => {
    const r = advancePoints(topic, 5, 3, "full");
    expect(r.covered).toBe(6);
    expect(r.finished).toBe(true);
    expect(advancePoints(topic, 6, 2, "full").covered).toBe(6);
  });
});
