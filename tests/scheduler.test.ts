import { describe, expect, it } from "vitest";
import { TOPICS } from "../src/data/roadmap";
import { generatePlan } from "../src/services/taskGenerator";
import {
  REVIEW_INTERVALS,
  advanceReview,
  costOf,
  daysFor,
  dueReviews,
  isRetired,
  pickPoints,
  reviewKey,
  scheduleAfterLearn,
  slotsFor,
} from "../src/services/scheduler";
import type { ReviewItem, Topic } from "../src/types";

const hard: Topic = {
  id: "t-hard",
  title: "难点",
  stageId: "stage-1",
  week: 1,
  points: ["简单点", "很难的点", "普通点"],
  difficulty: { 简单点: 1, 很难的点: 3, 普通点: 2 },
};

describe("session budget", () => {
  it("30 分钟给 2 个名额，疲惫/不想学各减一个，但至少 1 个", () => {
    expect(slotsFor(30)).toBe(2);
    expect(slotsFor(30, "tired")).toBe(1);
    expect(slotsFor(30, "normal", "reluctant")).toBe(1);
    expect(slotsFor(15, "tired", "reluctant")).toBe(1);
    expect(slotsFor(90)).toBe(5);
  });

  it("难点占两个名额", () => {
    expect(costOf(hard, "很难的点")).toBe(2);
    expect(costOf(hard, "简单点")).toBe(1);
    expect(pickPoints(hard, 0, 2)).toEqual(["简单点"]);
    expect(pickPoints(hard, 1, 1)).toEqual(["很难的点"]); // 名额不够也至少推进一个，不会卡死
    expect(pickPoints(hard, 1, 2)).toEqual(["很难的点"]);
    expect(pickPoints(hard, 1, 3)).toEqual(["很难的点", "普通点"]);
  });

  it("预估天数按名额和难度算", () => {
    const six = TOPICS[0]; // 6 个常规点
    expect(daysFor(six, 0, 2)).toBe(3);
    expect(daysFor(six, 4, 2)).toBe(1);
    // 1 + 2 + 1 = 4 个名额，每天 2 个 → 三天（难点单独占满一天）
    expect(daysFor(hard, 0, 2)).toBe(3);
  });
});

describe("spaced repetition queue", () => {
  const base = scheduleAfterLearn("s1-w1", ["Class 与 Object"], "2026-11-01", []);

  it("新学的点第二天回访，之后按 1/3/7/21 天走", () => {
    expect(base).toHaveLength(1);
    expect(base[0].due).toBe("2026-11-02");
    let items: ReviewItem[] = base;
    const dates: string[] = [];
    for (let round = 0; round < REVIEW_INTERVALS.length; round++) {
      const due = items[0].due;
      dates.push(due);
      items = advanceReview(items, base[0].key, due);
    }
    expect(dates).toEqual(["2026-11-02", "2026-11-05", "2026-11-12", "2026-12-03"]);
    expect(isRetired(items[0])).toBe(true);
  });

  it("只在到期当天及之后出现，学太早不重复排", () => {
    expect(dueReviews(base, "2026-11-01")).toHaveLength(0);
    expect(dueReviews(base, "2026-11-02")).toHaveLength(1);
  });

  it("已退出的点不再出现，并且每天有上限", () => {
    const many = scheduleAfterLearn(
      "s1-w1",
      ["a", "b", "c", "d"],
      "2026-11-01",
      [],
    ).map((x) => ({ ...x, due: "2026-11-02" }));
    expect(dueReviews(many, "2026-11-05", 2)).toHaveLength(2);
    const retired = many.map((x) => ({ ...x, stage: REVIEW_INTERVALS.length }));
    expect(dueReviews(retired, "2026-11-05", 2)).toHaveLength(0);
  });

  it("重新学同一个点会重置回第一次", () => {
    const advanced = advanceReview(base, base[0].key, "2026-11-02");
    const again = scheduleAfterLearn("s1-w1", ["Class 与 Object"], "2026-11-10", advanced);
    expect(again).toHaveLength(1);
    expect(again[0].stage).toBe(0);
    expect(again[0].due).toBe("2026-11-11");
  });

  it("复习任务带 reviewKey，能被记录结算", () => {
    const plan = generatePlan({
      date: "2026-11-02",
      topic: TOPICS[0],
      minutes: 30,
      energy: "normal",
      will: "normal",
      difficulty: "normal",
      reviewCount: 0,
      startPoint: 2,
      reviewItems: base,
    });
    const task = plan.tasks.find((t) => t.reviewKey);
    expect(task?.reviewKey).toBe(reviewKey("s1-w1", "Class 与 Object"));
    expect(task?.title).toContain("间隔复习（第 1 次）");
  });
});

describe("weekly rhythm", () => {
  it("综合日不学新点，只做复习 + 综合练习 + 总结", () => {
    const plan = generatePlan({
      date: "2026-11-07",
      topic: TOPICS[0],
      minutes: 45,
      energy: "normal",
      will: "normal",
      difficulty: "normal",
      reviewCount: 0,
      startPoint: 4,
      consolidation: true,
      reviewItems: scheduleAfterLearn("s1-w1", ["Class 与 Object", "__init__ 的作用"], "2026-11-06", []),
    });
    expect(plan.mode).toBe("consolidation");
    expect(plan.points).toEqual([]);
    expect(plan.tasks.every((t) => t.section !== "learn")).toBe(true);
    expect(plan.tasks.some((t) => t.title.startsWith("综合练习"))).toBe(true);
    expect(plan.tasks.filter((t) => t.reviewKey).length).toBe(2);
    expect(plan.tasks.at(-1)?.section).toBe("summary");
  });

  it("休息日仍然是两件轻松的事", () => {
    const plan = generatePlan({
      date: "2026-11-08",
      topic: TOPICS[0],
      minutes: 30,
      energy: "normal",
      will: "normal",
      difficulty: "normal",
      reviewCount: 0,
      restDay: true,
    });
    expect(plan.mode).toBe("rest");
    expect(plan.tasks).toHaveLength(2);
  });
});

describe("future days differ (no more identical 25/26/27)", () => {
  it("每个未来日期都从按计划推进的位置起算", async () => {
    const { defaultData } = await import("../src/services/storage");
    const { projectCursor } = await import("../src/services/progressCalculator");
    const { addDays, todayISO } = await import("../src/utils/date");
    const d = defaultData();
    const today = todayISO();
    d.plans[today] = generatePlan({
      date: today,
      topic: TOPICS[0],
      minutes: 30,
      energy: "normal",
      will: "normal",
      difficulty: "normal",
      reviewCount: 0,
    });
    expect(d.plans[today].points).toHaveLength(2);
    expect(projectCursor(d, addDays(today, 1)).covered).toBe(2);
    expect(projectCursor(d, addDays(today, 2)).covered).toBe(4);
    expect(projectCursor(d, addDays(today, 3)).covered).toBe(0); // 第 3 天开始换主题
    expect(projectCursor(d, addDays(today, 3)).topicIndex).toBe(1);
  });

  it("休息日和综合日不推进未来进度", async () => {
    const { defaultData } = await import("../src/services/storage");
    const { projectCursor } = await import("../src/services/progressCalculator");
    const { addDays, weekdayOf, todayISO } = await import("../src/utils/date");
    const d = defaultData();
    const today = todayISO();
    d.plans[today] = generatePlan({ date: today, topic: TOPICS[0], minutes: 30, energy: "normal", will: "normal", difficulty: "normal", reviewCount: 0 });
    // 找到下一个周六（综合日）和周日（休息日）
    let sat = addDays(today, 1);
    while (weekdayOf(sat) !== 6) sat = addDays(sat, 1);
    const sun = addDays(sat, 1);
    expect(projectCursor(d, sun).covered).toBe(projectCursor(d, sat).covered);
  });
});
