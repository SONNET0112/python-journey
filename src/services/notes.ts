import type { DailyNote, NoteTag, ReviewStatus, Topic, WrongQuestion } from "../types";

export const NOTE_FIELDS = [
  { key: "keyPoint", label: "今日重点", hint: "今天最重要的知识点，一句话说清" },
  { key: "confusion", label: "今日困惑", hint: "卡住的地方、没想明白的问题" },
  { key: "understanding", label: "我的理解", hint: "用你自己的语言解释一遍" },
  { key: "code", label: "代码片段", hint: "关键代码、可复用的写法" },
  { key: "toReview", label: "待复习内容", hint: "还没完全掌握、下次要先看的" },
  { key: "extra", label: "学习补充", hint: "链接、参考资料、随手记" },
] as const;

export type NoteField = (typeof NOTE_FIELDS)[number]["key"];

export const tagsForTopic = (topic: Topic): NoteTag[] =>
  topic.points.map((label) => ({ label, topicId: topic.id, stageId: topic.stageId, week: topic.week }));

export function emptyNote(input: { date: string; stageId: string; week: number; topicId: string; topicTitle: string; taskId?: string | null }): DailyNote {
  return {
    date: input.date,
    stageId: input.stageId,
    week: input.week,
    topicId: input.topicId,
    topicTitle: input.topicTitle,
    taskId: input.taskId ?? null,
    keyPoint: "",
    confusion: "",
    understanding: "",
    code: "",
    toReview: "",
    extra: "",
    tags: [],
    updatedAt: new Date().toISOString(),
  };
}

/** A note with every field blank is treated as "no note" so empty dates stay clean. */
export const noteHasContent = (n: DailyNote | undefined): boolean =>
  !!n && NOTE_FIELDS.some((f) => n[f.key].trim().length > 0);

export function noteMatches(note: DailyNote, query: string, stageId: string): boolean {
  if (stageId && note.stageId !== stageId) return false;
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [note.topicTitle, note.keyPoint, note.confusion, note.understanding, note.code, note.toReview, note.extra, ...note.tags.map((t) => t.label)]
    .join("\n")
    .toLowerCase();
  return haystack.includes(q);
}

export const STATUS_LABEL: Record<ReviewStatus, string> = { unlearned: "未掌握", reviewing: "复习中", mastered: "已掌握" };
export const STATUS_TONE: Record<ReviewStatus, string> = { unlearned: "#ff8f8f", reviewing: "#ffb56b", mastered: "#57d9a3" };

export function mistakeMatches(m: WrongQuestion, query: string, status: ReviewStatus | "all", stageId: string): boolean {
  if (status !== "all" && m.status !== status) return false;
  if (stageId && m.stageId !== stageId) return false;
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [m.title, m.content, m.reason, m.myAnswer, m.correctAnswer, ...m.points].join("\n").toLowerCase().includes(q);
}

/**
 * Which mistakes deserve a slot in today's plan: same topic first, then shared
 * knowledge points. Mastered ones are never resurfaced, and nothing is
 * auto-marked as mastered.
 */
export function mistakesToReview(topic: Topic, mistakes: WrongQuestion[], limit = 2): WrongQuestion[] {
  return mistakes
    .filter((m) => m.status !== "mastered")
    .map((m) => ({
      m,
      score: (m.topicId === topic.id ? 2 : 0) + m.points.filter((p) => topic.points.includes(p)).length,
    }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || b.m.reviewCount - a.m.reviewCount)
    .slice(0, limit)
    .map((x) => x.m);
}

/** Knowledge points the learner has already got wrong twice or more. */
export function weakPoints(mistakes: WrongQuestion[]): string[] {
  const counts = new Map<string, number>();
  for (const m of mistakes) {
    if (m.status === "mastered") continue;
    for (const p of m.points) counts.set(p, (counts.get(p) ?? 0) + 1);
  }
  return [...counts.entries()].filter(([, n]) => n >= 2).map(([p]) => p);
}
