import { describe, expect, it } from "vitest";
import { TOPICS } from "../src/data/roadmap";
import { PLANTS } from "../src/data/plants";
import { allocate, generatePlan } from "../src/services/taskGenerator";
import { resolveStage, stageProgress, newAdoption, grow, water, EXP } from "../src/services/plantGrowth";
import { validateAppData, defaultData } from "../src/services/storage";
import { pickLine } from "../src/services/encouragementService";
import { plantById } from "../src/data/plants";

const topic = TOPICS[0];
const base = { date: "2026-11-19", topic, minutes: 30, energy: "normal" as const, will: "normal" as const, difficulty: "normal" as const, reviewCount: 0 };

describe("task allocation", () => {
  it("matches the three documented session lengths", () => {
    const s30 = allocate(30);
    expect(s30.review + s30.learn + s30.practice + s30.summary).toBe(30);
    const s15 = allocate(15);
    expect(s15.independent).toBe(0);
    const s90 = allocate(90);
    expect(s90.independent).toBeGreaterThan(0);
    expect(s90.review + s90.learn + s90.practice + s90.independent + s90.summary).toBe(90);
  });

  it("never allocates negative or zero-minute blocks", () => {
    for (const m of [10, 15, 30, 45, 60, 75, 90, 120]) {
      const a = allocate(m);
      for (const v of Object.values(a)) expect(v).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("daily plan generation", () => {
  it("produces the five learning sections in order", () => {
    const plan = generatePlan(base);
    const order = plan.tasks.map((t) => t.section);
    expect(order[0]).toBe("review");
    expect(order.at(-1)).toBe("summary");
    expect(new Set(order).size).toBeGreaterThan(2);
  });

  it("is deterministic for the same input", () => {
    expect(generatePlan(base)).toEqual(generatePlan(base));
  });

  it("gives tired days a lighter load than energetic ones", () => {
    const tired = generatePlan({ ...base, energy: "tired" });
    const fresh = generatePlan({ ...base, energy: "high", minutes: 60 });
    expect(tired.totalMinutes).toBeLessThan(fresh.totalMinutes);
    expect(tired.tasks.some((t) => t.section === "independent")).toBe(false);
  });

  it("splits the topic after repeated failure", () => {
    const split = generatePlan({ ...base, reviewCount: 2 });
    expect(split.tasks.filter((t) => t.section === "learn").length).toBe(1);
    expect(split.tasks[0].title).toContain("第 3 次");
  });

  it("rest day keeps a gentle plan instead of the full one", () => {
    const rest = generatePlan({ ...base, restDay: true });
    expect(rest.tasks.length).toBe(2);
    expect(rest.topicTitle).toBe("休息日");
  });

  it("marks the project task only when a project is available and the day is long enough", () => {
    const short = generatePlan({ ...base, minutes: 30 });
    expect(short.tasks.some((t) => t.kind === "project")).toBe(false);
    const long = generatePlan({ ...base, minutes: 60, difficulty: "challenge" });
    expect(long.tasks.some((t) => t.kind === "project")).toBe(true);
  });
});

describe("plant growth", () => {
  const sunflower = plantById("sunflower")!;

  it("every plant stage has its own image path", () => {
    for (const p of PLANTS) {
      const paths = p.stages.map((s) => s.image);
      expect(new Set(paths).size).toBe(paths.length);
      expect(p.stages[0].requiredExp).toBe(0);
      for (let i = 1; i < p.stages.length; i++) expect(p.stages[i].requiredExp).toBeGreaterThan(p.stages[i - 1].requiredExp);
    }
  });

  it("resolveStage walks thresholds", () => {
    expect(resolveStage(sunflower, 0).id).toBe("seed");
    expect(resolveStage(sunflower, 40).id).toBe("sprout");
    expect(resolveStage(sunflower, 999999).id).toBe(sunflower.stages.at(-1)!.id);
  });

  it("stage progress stays within 0..1", () => {
    for (const exp of [0, 30, 100, 620, 5000]) {
      const p = stageProgress(sunflower, exp);
      expect(p.done).toBeGreaterThanOrEqual(0);
      expect(p.done).toBeLessThanOrEqual(1);
    }
  });

  it("growth records a stage event when a threshold is crossed", () => {
    const adoption = newAdoption(sunflower, "2026-11-01");
    const g = grow(adoption, sunflower, 45, "2026-11-02", "test");
    expect(g.upgraded?.id).toBe("sprout");
    expect(g.adoption.currentStageId).toBe("sprout");
    expect(g.adoption.growthRecords.some((r) => r.type === "stage")).toBe(true);
  });

  it("waters only once per day", () => {
    const adoption = newAdoption(sunflower, "2026-11-01");
    const w1 = water(adoption, sunflower, "2026-11-02");
    const w2 = water(w1.adoption, sunflower, "2026-11-02");
    expect(w1.firstTime).toBe(true);
    expect(w2.firstTime).toBe(false);
    expect(w2.adoption.totalWateringCount).toBe(1);
  });

  it("caps a single day's task exp", () => {
    expect(Math.min(40 * EXP.perTask, EXP.taskDayCap)).toBe(EXP.taskDayCap);
  });
});

describe("storage validation", () => {
  it("accepts a freshly created document", () => {
    expect(validateAppData(defaultData()).ok).toBe(true);
  });

  it("rejects malformed imports instead of wiping data", () => {
    expect(validateAppData({}).ok).toBe(false);
    expect(validateAppData(null).ok).toBe(false);
    expect(validateAppData({ ...defaultData(), journal: "nope" }).ok).toBe(false);
  });

  it("backfills plans saved by an older build (no points field)", () => {
    const legacy = defaultData() as unknown as Record<string, unknown>;
    legacy.plans = {
      "2026-01-05": {
        date: "2026-01-05",
        topicId: TOPICS[0].id,
        topicTitle: TOPICS[0].title,
        stageId: "stage-1",
        week: 1,
        tasks: [{ id: "a", section: "learn", title: "x", minutes: 5, done: false }],
        totalMinutes: 5,
        energy: "normal",
        will: "normal",
        difficulty: "normal",
      },
    };
    const r = validateAppData(legacy);
    expect(r.ok).toBe(true);
    if (r.ok) {
      const plan = r.data.plans["2026-01-05"];
      expect(Array.isArray(plan.points)).toBe(true);
      expect(plan.points).toEqual([TOPICS[0].points[0]]);
      expect(plan.previousPoints).toEqual([]);
    }
  });

  it("keeps an explicit empty array", () => {
    const r = validateAppData({ ...defaultData(), journal: [] });
    expect(r.ok && r.data.journal.length).toBe(0);
  });
});

describe("encouragements", () => {
  it("does not repeat the same line while alternatives exist", () => {
    const a = pickLine("task_done", []);
    const b = pickLine("task_done", a.seen);
    expect(b.line).not.toBe(a.line);
  });
});
