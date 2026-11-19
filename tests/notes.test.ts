import { describe, expect, it } from "vitest";
import { TOPICS } from "../src/data/roadmap";
import { generatePlan } from "../src/services/taskGenerator";
import { emptyNote, mistakesToReview, noteHasContent, noteMatches, tagsForTopic, weakPoints, STATUS_LABEL } from "../src/services/notes";
import { defaultData, validateAppData, SCHEMA_VERSION } from "../src/services/storage";
import type { WrongQuestion } from "../src/types";

const topic = TOPICS[0];

const mkMistake = (over: Partial<WrongQuestion> = {}): WrongQuestion => ({
  id: `q-${Math.random().toString(36).slice(2)}`,
  title: "self 是什么",
  content: "__init__ 里的 self 指向什么？",
  myAnswer: "类本身",
  correctAnswer: "实例本身",
  reason: "概念混淆",
  points: [topic.points[0]],
  topicId: topic.id,
  stageId: "stage-1",
  createdAt: "2026-11-19T10:00:00.000Z",
  sourceTaskId: null,
  sourceTaskTitle: null,
  status: "unlearned",
  reviewCount: 0,
  lastReviewedAt: null,
  ...over,
});

describe("daily notes", () => {
  const base = emptyNote({ date: "2026-11-19", stageId: "stage-1", week: 1, topicId: topic.id, topicTitle: topic.title });

  it("an untouched note counts as no note", () => {
    expect(noteHasContent(base)).toBe(false);
    expect(noteHasContent({ ...base, keyPoint: "class 是模板" })).toBe(true);
  });

  it("searches knowledge-point tags, not just the body", () => {
    const note = { ...base, tags: tagsForTopic(topic), extra: "记一下" };
    expect(noteMatches(note, "self", "")).toBe(true);
    expect(noteMatches(note, "self", "stage-3")).toBe(false);
    expect(noteMatches(note, "不存在的词", "")).toBe(false);
  });

  it("keeps dates independent (same fields, different date key)", () => {
    const a = { ...base, keyPoint: "A" };
    const b = { ...base, date: "2026-11-20", keyPoint: "B" };
    expect(a.keyPoint).not.toBe(b.keyPoint);
    expect(noteMatches(a, "B", "")).toBe(false);
  });
});

describe("mistake review rules", () => {
  it("never resurfaces mastered questions", () => {
    const mastered = mkMistake({ status: "mastered" });
    expect(mistakesToReview(topic, [mastered])).toEqual([]);
  });

  it("prefers questions from the current topic", () => {
    const same = mkMistake({ title: "同主题" });
    const other = mkMistake({ title: "别的主题", topicId: "stage-3-t1", points: [] });
    expect(mistakesToReview(topic, [other, same]).map((m) => m.title)).toEqual(["同主题"]);
  });

  it("is capped", () => {
    const many = Array.from({ length: 6 }, (_, i) => mkMistake({ title: `q${i}` }));
    expect(mistakesToReview(topic, many, 2)).toHaveLength(2);
  });

  it("collects points wrong twice or more, ignoring mastered", () => {
    const q = [mkMistake({ points: ["self"] }), mkMistake({ points: ["self", "x"] }), mkMistake({ points: ["y"], status: "mastered" })];
    expect(weakPoints(q)).toEqual(["self"]);
  });

  it("status labels are the three the product promises", () => {
    expect(Object.values(STATUS_LABEL)).toEqual(["未掌握", "复习中", "已掌握"]);
  });
});

describe("plan reacts to mistakes", () => {
  const base = { topic, minutes: 30, energy: "normal" as const, will: "normal" as const, difficulty: "normal" as const, reviewCount: 0 };

  it("adds a review task for a due mistake", () => {
    const plan = generatePlan({ ...base, date: "2026-11-20", mistakes: [{ title: "self 是什么", reason: "概念混淆" }] });
    const review = plan.tasks.find((t) => t.title.startsWith("错题复习"));
    expect(review).toBeTruthy();
    expect(review!.title).toContain("概念混淆");
    expect(plan.tasks[0].minutes).toBeLessThanOrEqual(5);
  });

  it("adds extra practice for a repeatedly wrong point", () => {
    const plan = generatePlan({ ...base, date: "2026-11-21", minutes: 45, weakPoints: [topic.points[0]] });
    expect(plan.tasks.some((t) => t.title.includes("再练一遍"))).toBe(true);
  });

  it("no mistakes → plan unchanged in shape", () => {
    const plan = generatePlan({ ...base, date: "2026-11-22" });
    expect(plan.tasks.some((t) => t.title.startsWith("错题复习"))).toBe(false);
  });
});

describe("schema v2 migration", () => {
  it("a v1 document loads with empty notes and mistakes", () => {
    const v1 = { ...defaultData(), version: 1 } as Record<string, unknown>;
    delete v1.notes;
    delete v1.wrongQuestions;
    const r = validateAppData(v1);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.version).toBe(SCHEMA_VERSION);
      expect(r.data.notes).toEqual({});
      expect(r.data.wrongQuestions).toEqual([]);
    }
  });

  it("keeps notes and mistakes from an exported document", () => {
    const data = defaultData();
    data.notes["2026-11-19"] = { ...emptyNote({ date: "2026-11-19", stageId: "stage-1", week: 1, topicId: topic.id, topicTitle: topic.title }), keyPoint: "keep me" };
    data.wrongQuestions.push(mkMistake());
    const r = validateAppData(JSON.parse(JSON.stringify(data)));
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.notes["2026-11-19"].keyPoint).toBe("keep me");
      expect(r.data.wrongQuestions).toHaveLength(1);
    }
  });
});
