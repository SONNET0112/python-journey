import { STAGES, TOPICS, stageById, topicById } from "../data/roadmap";
import type { AppData, DayPlan, DayState, LearningStage, Mastery, Topic } from "../types";
import { pickPoints, slotsFor } from "./scheduler";
import { addDays, todayISO, weekdayOf } from "../utils/date";

export const totalTopics = () => TOPICS.length;

/**
 * Advances the per-topic knowledge-point cursor. Only a real mastery answer moves
 * it; "还需要复习 / 没有完成" keeps the same points for next time.
 */
export function advancePoints(topic: Topic, covered: number, taught: number, mastery: Mastery) {
  const next = mastery === "full" || mastery === "basic" ? Math.min(topic.points.length, Math.max(covered, covered + taught)) : covered;
  return { covered: next, finished: next >= topic.points.length, justFinished: next >= topic.points.length && covered < topic.points.length };
}

export function overallProgress(data: AppData) {
  const done = data.progress.completedTopicIds.length;
  const total = TOPICS.length;
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
}

export function stageProgressOf(data: AppData, stage: LearningStage) {
  const total = TOPICS.filter((t) => t.stageId === stage.id).length;
  const done = data.progress.completedTopicIds.filter((id) => topicById(id)?.stageId === stage.id).length;
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
}

export function currentStage(data: AppData): LearningStage {
  const topic = currentTopic(data);
  return (topic && stageById(topic.stageId)) ?? STAGES[0];
}

/** The topic the queue is currently parked on (never past the end). */
export function currentTopic(data: AppData): Topic {
  return TOPICS[Math.min(data.progress.topicIndex, TOPICS.length - 1)];
}

export function recordsList(data: AppData) {
  return Object.values(data.records).sort((a, b) => a.date.localeCompare(b.date));
}

export function stats(data: AppData) {
  const records = recordsList(data);
  const minutes = records.reduce((s, r) => s + r.minutes, 0);
  const tasks = records.reduce((s, r) => s + r.completedTasks, 0);
  const fullDays = records.filter((r) => r.mastery === "full" || r.mastery === "basic").length;
  const last7 = addDays(todayISO(), -6);
  const week = records.filter((r) => r.date >= last7);
  return {
    studyDays: records.length,
    minutes,
    tasks,
    modules: data.progress.completedTopicIds.length,
    projects: data.progress.completedProjects.length,
    stages: data.progress.completedStages.length,
    productiveDays: fullDays,
    streak: data.progress.streak,
    weekMinutes: week.reduce((s, r) => s + r.minutes, 0),
    weekRate: week.length ? Math.round((week.reduce((s, r) => s + r.completedTasks / Math.max(1, r.totalTasks), 0) / week.length) * 100) : 0,
  };
}

/** Last `days` days of minutes/tasks for the records chart (missing days are real zeros). */
export function trendSeries(data: AppData, days = 14) {
  const out: { date: string; 分钟: number; 任务: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = addDays(todayISO(), -i);
    const r = data.records[date];
    out.push({ date: date.slice(5), 分钟: r?.minutes ?? 0, 任务: r?.completedTasks ?? 0 });
  }
  return out;
}

export const minutesFor = (d: AppData, date: string, state?: DayState): number =>
  state?.minutes ?? d.settings.minutesByWeekday[String(weekdayOf(date))] ?? d.settings.defaultMinutes;

/**
 * Where the learner will be on `date` if every planned day is followed.
 * Future days used to all read the same cursor, so 25/26/27 showed identical
 * content — projecting forward is what makes a week's plan meaningful.
 */
export function projectCursor(d: AppData, date: string): { topicIndex: number; covered: number; prevPoints: string[] } {
  const today = todayISO();
  let idx = Math.min(d.progress.topicIndex, TOPICS.length - 1);
  let covered = d.progress.pointsDone[TOPICS[idx]?.id ?? ""] ?? 0;
  let prevPoints: string[] = [];

  const walk = (taught: number, points: string[] = []) => {
    const topic = TOPICS[idx];
    if (!topic) return;
    if (points.length) prevPoints = points;
    covered += taught;
    if (covered >= topic.points.length) {
      idx = Math.min(idx + 1, TOPICS.length - 1);
      covered = 0;
    }
  };

  for (let day = today; day < date; day = addDays(day, 1)) {
    if (d.records[day]) {
      // already reflected in the real cursor, but still the "上一节" for the next day
      const taught = d.plans[day]?.points ?? [];
      if (taught.length) prevPoints = taught;
      continue;
    }
    const planned = d.plans[day];
    if (planned) {
      walk(planned.points?.length ?? 0, planned.points ?? []);
      continue;
    }
    const wd = weekdayOf(day);
    if (d.settings.restDays.includes(wd)) continue;
    if (d.settings.weeklyRhythm && wd === 6) continue; // consolidation day teaches nothing new
    const topic = TOPICS[idx];
    const state = d.dayStates[day];
    const slots = slotsFor(minutesFor(d, day, state), state?.energy ?? d.settings.energy, state?.will ?? "normal");
    const picked = pickPoints(topic, covered, slots);
    walk(picked.length, picked);
  }
  return { topicIndex: idx, covered, prevPoints };
}

/**
 * 上次那份计划真的没动过（没记录、一个任务都没勾）时返回它：今天接着它的内容，而不是按日历往前翻一天。
 * 昨天没学 → 今天还是昨天那些知识点；学过或记录过 → undefined，正常往前走。
 */
export function planToResume(d: AppData, date: string, topicId: string): DayPlan | undefined {
  const last = Object.values(d.plans)
    .filter((p) => p.date < date && p.topicId === topicId && (p.points?.length ?? 0) > 0)
    .sort((a, b) => a.date.localeCompare(b.date))
    .at(-1);
  return last && !d.records[last.date] && !last.tasks.some((t) => t.done) ? last : undefined;
}

export function encouragementScene(data: AppData): string {
  const today = data.records[todayISO()];
  if (!today) return data.progress.streak >= 3 ? "streak" : "task_done";
  if (today.mastery === "review" || today.mastery === "none") return "struggle";
  if (today.mastery === "basic") return "task_done";
  return "module_done";
}
