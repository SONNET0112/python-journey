import { STAGES, TOPICS, stageById, topicById } from "../data/roadmap";
import type { AppData, LearningStage, Topic } from "../types";
import { addDays, todayISO } from "../utils/date";

export const totalTopics = () => TOPICS.length;

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

export function encouragementScene(data: AppData): string {
  const today = data.records[todayISO()];
  if (!today) return data.progress.streak >= 3 ? "streak" : "task_done";
  if (today.mastery === "review" || today.mastery === "none") return "struggle";
  if (today.mastery === "basic") return "task_done";
  return "module_done";
}
