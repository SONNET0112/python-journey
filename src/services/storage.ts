import type { AppData, DayPlan, UserSettings } from "../types";
import { TOPICS } from "../data/roadmap";
import { todayISO } from "../utils/date";

export const STORAGE_KEY = "python-journey.data";
export const SCHEMA_VERSION = 4;

export const defaultSettings = (): UserSettings => ({
  defaultMinutes: 30,
  minutesByWeekday: { "1": 30, "2": 30, "3": 30, "4": 30, "5": 30, "6": 45, "0": 20 },
  restDays: [0],
  weeklyRhythm: true,
  energy: "normal",
  difficulty: "normal",
  adoptConfirm: true,
});

export const defaultData = (): AppData => ({
  version: SCHEMA_VERSION,
  settings: defaultSettings(),
  progress: {
    topicIndex: 0,
    pointsDone: {},
    completedTopicIds: [],
    reviewCount: {},
    totalStudyDays: 0,
    streak: 0,
    lastStudyDate: null,
    completedStages: [],
    completedProjects: [],
    stagePointsDone: {},
    reviews: [],
  },
  plans: {},
  records: {},
  dayStates: {},
  plants: {},
  activePlantId: null,
  journal: [],
  notes: {},
  wrongQuestions: [],
  achievements: {},
  seenEncouragements: [],
  lastFeedbackDate: null,
});

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

/** Only accepts a structurally sound document — a bad import must never overwrite good data. */
export function validateAppData(raw: unknown): { ok: true; data: AppData } | { ok: false; error: string } {
  if (!isObj(raw)) return { ok: false, error: "文件内容不是有效的 JSON 对象" };
  if (typeof raw.version !== "number") return { ok: false, error: "缺少数据版本号" };
  if (!isObj(raw.settings)) return { ok: false, error: "缺少 settings" };
  if (!isObj(raw.progress)) return { ok: false, error: "缺少 progress" };
  if (!isObj(raw.plans) || !isObj(raw.records)) return { ok: false, error: "plans / records 结构不正确" };
  if (!Array.isArray(raw.journal)) return { ok: false, error: "journal 必须是数组" };
  if (!isObj(raw.achievements)) return { ok: false, error: "achievements 结构不正确" };
  const base = defaultData();
  const data: AppData = {
    ...base,
    ...(raw as unknown as AppData),
    version: SCHEMA_VERSION,
    settings: { ...base.settings, ...(raw.settings as unknown as UserSettings) },
    progress: { ...base.progress, ...(raw.progress as unknown as AppData["progress"]) },
    plans: raw.plans as Record<string, DayPlan>,
    records: raw.records as AppData["records"],
    dayStates: isObj(raw.dayStates) ? (raw.dayStates as AppData["dayStates"]) : {},
    journal: raw.journal as AppData["journal"],
    notes: isObj(raw.notes) ? (raw.notes as AppData["notes"]) : {},
    wrongQuestions: Array.isArray(raw.wrongQuestions) ? (raw.wrongQuestions as AppData["wrongQuestions"]) : [],
    plants: isObj(raw.plants) ? (raw.plants as AppData["plants"]) : {},
    activePlantId: typeof raw.activePlantId === "string" ? raw.activePlantId : null,
    seenEncouragements: Array.isArray(raw.seenEncouragements) ? (raw.seenEncouragements as string[]) : [],
  };
  // older builds stored plans without `points`; harmless, but the UI must never read them as undefined
  const plans: Record<string, DayPlan> = {};
  for (const [date, plan] of Object.entries(data.plans as Record<string, DayPlan>)) {
    const topic = TOPICS.find((t) => t.id === plan?.topicId);
    const learnCount = plan?.tasks?.filter((t) => t.section === "learn").length || 2;
    const start = topic ? (data.progress?.pointsDone?.[topic.id] ?? 0) : 0;
    plans[date] = {
      ...plan,
      tasks: Array.isArray(plan?.tasks) ? plan.tasks : [],
      points: Array.isArray(plan?.points) && plan.points.length ? plan.points : (topic ? topic.points.slice(start, start + learnCount) : []),
      previousPoints: Array.isArray(plan?.previousPoints) ? plan.previousPoints : [],
    };
  }
  // 未来计划只是"按节奏的预览"，旧的（或未编辑的）一律丢掉，打开时按当前进度重新推演
  const today = todayISO();
  for (const [date, plan] of Object.entries(plans)) {
    if (date > today && !plan.edited && !plan.tasks.some((t) => t.done) && !data.records[date]) delete plans[date];
  }
  data.plans = plans;
  // v4 added the spaced-repetition queue
  if (!Array.isArray(data.progress.reviews)) data.progress = { ...data.progress, reviews: [] };

  // v2 had no per-point cursor: treat fully completed topics as fully learned
  if (!isObj((raw as Record<string, unknown>).progress) || !isObj(((raw as Record<string, unknown>).progress as Record<string, unknown>).pointsDone)) {
    const done: Record<string, number> = {};
    for (const id of data.progress.completedTopicIds) {
      const t = TOPICS.find((x) => x.id === id);
      if (t) done[id] = t.points.length;
    }
    data.progress = { ...data.progress, pointsDone: done };
  }
  return { ok: true, data };
}

/** Seeds on first run only; an existing document is never replaced. */
export function load(): AppData {
  try {
    const text = localStorage.getItem(STORAGE_KEY);
    if (!text) {
      const fresh = defaultData();
      save(fresh);
      return fresh;
    }
    const parsed = validateAppData(JSON.parse(text));
    if (!parsed.ok) return defaultData();
    return parsed.data;
  } catch {
    return defaultData();
  }
}

export function save(data: AppData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("保存失败", e);
  }
}

export const exportJSON = (data: AppData): string => JSON.stringify(data, null, 2);

export function importJSON(text: string): { ok: true; data: AppData } | { ok: false; error: string } {
  try {
    return validateAppData(JSON.parse(text));
  } catch (e) {
    return { ok: false, error: `JSON 解析失败：${(e as Error).message}` };
  }
}
