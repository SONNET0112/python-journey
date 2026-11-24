import { describe, expect, it } from "vitest";
import { TOPICS } from "../src/data/roadmap";
import { generatePlan } from "../src/services/taskGenerator";
import { advancePoints, planToResume } from "../src/services/progressCalculator";
import type { AppData, DayPlan, Mastery } from "../src/types";

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

/** 昨天没学的那一天：今天要接着它的内容，而不是按日历往前翻一天。 */
function planOn(date: string, points: string[], done = false): DayPlan {
  return {
    date,
    topicId: topic.id,
    topicTitle: topic.title,
    stageId: topic.stageId,
    week: topic.week,
    points,
    previousPoints: [],
    mode: "normal" as const,
    tasks: points.map((p, i) => ({ id: `${date}-${i}`, section: "learn" as const, title: `理解 ${p}`, minutes: 10, done: done && i === 0 })),
    totalMinutes: points.length * 10,
    energy: "normal" as const,
    will: "normal" as const,
    difficulty: "normal" as const,
  };
}

const day = (data: { plans?: Record<string, ReturnType<typeof planOn>>; records?: AppData["records"] }) =>
  ({ plans: {}, records: {}, ...data }) as unknown as AppData;

describe("a skipped day does not advance the plan", () => {
  it("resumes the last plan when it was never studied", () => {
    const d = day({ plans: { "2026-11-24": planOn("2026-11-24", topic.points.slice(0, 2)) } });
    expect(planToResume(d, "2026-11-25", topic.id)?.date).toBe("2026-11-24");
  });

  it("does not resume once a task was ticked or a record exists", () => {
    const ticked = day({ plans: { "2026-11-24": planOn("2026-11-24", topic.points.slice(0, 2), true) } });
    expect(planToResume(ticked, "2026-11-25", topic.id)).toBeUndefined();
    const recorded = day({
      plans: { "2026-11-24": planOn("2026-11-24", topic.points.slice(0, 2)) },
      records: { "2026-11-24": { date: "2026-11-24", minutes: 20, completedTasks: 4, totalTasks: 6, mastery: "full", summary: "", exp: 20 } },
    });
    expect(planToResume(recorded, "2026-11-25", topic.id)).toBeUndefined();
  });

  it("skips a skipped rest day and picks the last teaching day", () => {
    const d = day({
      plans: {
        "2026-11-22": planOn("2026-11-22", topic.points.slice(0, 2)),
        "2026-11-23": { ...planOn("2026-11-23", []), mode: "rest" as const },
      },
    });
    expect(planToResume(d, "2026-11-25", topic.id)?.date).toBe("2026-11-22");
  });

  it("ignores plans for another topic", () => {
    const d = day({ plans: { "2026-11-24": { ...planOn("2026-11-24", ["x"]), topicId: "s1-w2" } } });
    expect(planToResume(d, "2026-11-25", topic.id)).toBeUndefined();
  });

  it("tells the truth in the review task instead of quoting a day that never happened", () => {
    const carried = topic.points.slice(0, 2);
    const plan = generatePlan({
      date: "2026-11-25",
      topic,
      minutes: 30,
      energy: "normal",
      will: "normal",
      difficulty: "normal",
      reviewCount: 0,
      startPoint: 0,
      previousPoints: carried,
      continuation: true,
    });
    expect(plan.tasks[0].title).toContain("接着上次没学完");
    expect(plan.tasks[0].title).toContain(carried[0]);
    expect(plan.tasks[0].title).not.toContain("回顾昨天");
    // 今天教的就是上次没学完的那两个点，一个不漏也一个不跳
    expect(plan.points).toEqual(carried);
  });
});
