import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { ACHIEVEMENTS } from "../data/achievements";
import { plantById } from "../data/plants";
import { STAGES, TOPICS, topicById } from "../data/roadmap";
import { evaluate, unlockAll } from "../services/achievementService";
import { pickLine } from "../services/encouragementService";
import { EXP, grow, newAdoption, water, wateredOn } from "../services/plantGrowth";
import { currentTopic } from "../services/progressCalculator";
import { emptyNote, mistakesToReview, tagsForTopic, weakPoints } from "../services/notes";
import { addTask, generatePlan, removeTask, withTaskMinutes, withTaskTitle } from "../services/taskGenerator";
import { defaultData, defaultSettings, exportJSON, importJSON, load, save } from "../services/storage";
import type { AppData, DailyNote, DayPlan, DayState, Difficulty, Energy, GrowthJournal, Mastery, Plant, ReviewStatus, TaskSection, UserSettings, Will, WrongQuestion } from "../types";
import { addDays, todayISO, weekdayOf } from "../utils/date";

export interface Feedback {
  date: string;
  exp: number;
  tasksDone: number;
  totalTasks: number;
  minutes: number;
  advanced: string | null;
  upgradedFromName: string | null;
  upgradedToName: string | null;
  upgradedImage: string | null;
  stageName: string | null;
  achievements: { name: string; description: string }[];
  line: string;
  alreadyRecorded: boolean;
}

interface Ctx {
  data: AppData;
  feedback: Feedback | null;
  dismissFeedback: () => void;
  todayPlan: () => DayPlan;
  planFor: (date: string) => DayPlan | undefined;
  ensurePlan: (date: string) => void;
  regeneratePlan: (date: string) => boolean;
  dayState: (date: string) => DayState;
  setDayState: (date: string, patch: Partial<DayState>) => void;
  toggleTask: (date: string, taskId: string) => void;
  editTaskTitle: (date: string, taskId: string, title: string) => void;
  editTaskMinutes: (date: string, taskId: string, minutes: number) => void;
  addTaskToPlan: (date: string, section: TaskSection, title: string) => void;
  removeTaskFromPlan: (date: string, taskId: string) => void;
  updateSettings: (patch: Partial<UserSettings>) => void;
  saveRecord: (date: string, mastery: Mastery, summary: string) => void;
  adopt: (plant: Plant) => void;
  releasePlant: () => void;
  noteFor: (date: string) => DailyNote;
  saveNote: (date: string, patch: Partial<DailyNote>) => void;
  deleteNote: (date: string) => void;
  addMistake: (input: Omit<WrongQuestion, "id" | "status" | "reviewCount" | "lastReviewedAt" | "createdAt"> & { status?: ReviewStatus }) => void;
  updateMistake: (id: string, patch: Partial<WrongQuestion>) => void;
  deleteMistake: (id: string) => void;
  setMistakeStatus: (id: string, status: ReviewStatus) => void;
  addJournal: (entry: Omit<GrowthJournal, "id" | "createdAt">) => void;
  updateJournal: (id: string, patch: Partial<GrowthJournal>) => void;
  deleteJournal: (id: string) => void;
  importData: (text: string) => { ok: boolean; error?: string };
  resetAll: () => void;
}

const AppContext = createContext<Ctx | null>(null);

const buildPlan = (d: AppData, date: string, state: DayState): DayPlan => {
  const topic = TOPICS[Math.min(d.progress.topicIndex, TOPICS.length - 1)];
  const lastDone = d.progress.completedTopicIds[d.progress.completedTopicIds.length - 1];
  const minutes = state.minutes ?? d.settings.minutesByWeekday[String(weekdayOf(date))] ?? d.settings.defaultMinutes;
  return generatePlan({
    date,
    topic,
    minutes,
    energy: state.energy,
    will: state.will,
    difficulty: state.difficulty,
    reviewCount: d.progress.reviewCount[topic.id] ?? 0,
    restDay: d.settings.restDays.includes(weekdayOf(date)),
    previousTopic: lastDone ? topicById(lastDone) : undefined,
    mistakes: mistakesToReview(topic, d.wrongQuestions).map((m) => ({ title: m.title, reason: m.reason })),
    weakPoints: weakPoints(d.wrongQuestions),
  });
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => load());
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  useEffect(() => {
    save(data);
  }, [data]);

  const dayStateOf = useCallback(
    (d: AppData, date: string): DayState => {
      const s: DayState = d.dayStates[date] ?? { energy: d.settings.energy, will: "normal", difficulty: d.settings.difficulty, note: "" };
      const plan = d.plans[date];
      return plan && !d.dayStates[date] ? { energy: plan.energy, will: plan.will, difficulty: plan.difficulty, note: s.note } : s;
    },
    [],
  );

  // seed today's plan once, and never touch a plan that already exists
  useEffect(() => {
    const today = todayISO();
    setData((d) => (d.plans[today] ? d : { ...d, plans: { ...d.plans, [today]: buildPlan(d, today, dayStateOf(d, today)) } }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ensurePlan = useCallback(
    (date: string) => {
      setData((d) => (d.plans[date] ? d : { ...d, plans: { ...d.plans, [date]: buildPlan(d, date, dayStateOf(d, date)) } }));
    },
    [dayStateOf],
  );

  const regeneratePlan = useCallback(
    (date: string) => {
      const existing = data.plans[date];
      // never overwrite finished work or a hand-edited plan
      if (existing && (existing.edited || existing.tasks.some((t) => t.done) || data.records[date])) return false;
      setData((d) => ({ ...d, plans: { ...d.plans, [date]: buildPlan(d, date, dayStateOf(d, date)) } }));
      return true;
    },
    [data, dayStateOf],
  );

  const setDayState = useCallback((date: string, patch: Partial<DayState>) => {
    setData((d) => ({
      ...d,
      dayStates: { ...d.dayStates, [date]: { ...dayStateOf(d, date), ...patch } },
    }));
  }, [dayStateOf]);

  const patchPlan = useCallback((date: string, fn: (p: DayPlan) => DayPlan) => {
    setData((d) => {
      const plan = d.plans[date];
      if (!plan) return d;
      return { ...d, plans: { ...d.plans, [date]: fn(plan) } };
    });
  }, []);

  const toggleTask = useCallback(
    (date: string, taskId: string) =>
      patchPlan(date, (p) => {
        if (p.tasks.some((t) => t.id === taskId && t.done)) return p; // 已完成任务不会被覆盖
        return { ...p, tasks: p.tasks.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t)) };
      }),
    [patchPlan],
  );

  const updateSettings = useCallback((patch: Partial<UserSettings>) => {
    setData((d) => ({ ...d, settings: { ...d.settings, ...patch } }));
  }, []);

  const saveRecord: Ctx["saveRecord"] = useCallback(
    (date, mastery, summary) => {
      const d = data;
      const plan = d.plans[date];
      const already = d.records[date];
      if (!plan) return;
      const doneTasks = plan.tasks.filter((t) => t.done);
      const minutes = doneTasks.reduce((s, t) => s + t.minutes, 0);

      if (already) {
        // editing an existing record keeps the awarded exp intact
        setData((cur) => ({ ...cur, records: { ...cur.records, [date]: { ...already, mastery, summary } } }));
        return;
      }

      const topic = topicById(plan.topicId) ?? currentTopic(d);
      const completed = d.progress.completedTopicIds;
      const advanced = (mastery === "full" || mastery === "basic") && !completed.includes(topic.id);
      const reviewCount = { ...d.progress.reviewCount };
      if (mastery === "review") reviewCount[topic.id] = (reviewCount[topic.id] ?? 0) + 1;
      if (mastery === "full") delete reviewCount[topic.id];

      const completedTopicIds = advanced ? [...completed, topic.id] : completed;
      const topicIndex = advanced ? Math.min(d.progress.topicIndex + 1, TOPICS.length - 1) : d.progress.topicIndex;

      const projectDone = plan.tasks.some((t) => t.kind === "project" && t.done);
      const completedProjects =
        projectDone && topic.project && !d.progress.completedProjects.includes(topic.project)
          ? [...d.progress.completedProjects, topic.project]
          : d.progress.completedProjects;

      const stageTopics = TOPICS.filter((t) => t.stageId === topic.stageId);
      const stageDone = stageTopics.every((t) => completedTopicIds.includes(t.id));
      const completedStages =
        stageDone && !d.progress.completedStages.includes(topic.stageId) ? [...d.progress.completedStages, topic.stageId] : d.progress.completedStages;

      const yesterday = addDays(date, -1);
      const streak = d.progress.lastStudyDate === yesterday ? d.progress.streak + 1 : d.progress.lastStudyDate === date ? d.progress.streak : 1;

      const exp =
        Math.min(doneTasks.length * EXP.perTask, EXP.taskDayCap) +
        EXP.record +
        (summary.trim() ? EXP.summary : 0) +
        (advanced ? EXP.module : 0) +
        (projectDone ? EXP.project : 0) +
        (stageDone ? EXP.stage : 0);

      const record = { date, minutes, completedTasks: doneTasks.length, totalTasks: plan.tasks.length, mastery, summary, exp };

      let plants = d.plants;
      let upgradedFromName: string | null = null;
      let upgradedToName: string | null = null;
      let upgradedImage: string | null = null;
      if (d.activePlantId) {
        const plant = plantById(d.activePlantId);
        const adoption = plants[d.activePlantId];
        if (plant && adoption) {
          const g = grow(adoption, plant, exp, date, `完成 ${doneTasks.length} 个任务，${minutes} 分钟学习`);
          upgradedFromName = g.upgraded ? g.fromStage.name : null;
          upgradedToName = g.upgraded ? g.toStage.name : null;
          upgradedImage = g.upgraded ? g.toStage.image : null;
          const watered = mastery === "none" ? { adoption: g.adoption } : water(g.adoption, plant, date);
          plants = { ...plants, [plant.id]: watered.adoption };
        }
      }

      const scene = stageDone
        ? "stage_done"
        : upgradedToName
          ? resolveStageIndex(d.activePlantId, upgradedToName) >= 5
            ? "bloom"
            : "plant_upgrade"
          : projectDone
            ? "project_done"
            : advanced
              ? "module_done"
              : mastery === "review" || mastery === "none"
                ? "struggle"
                : "task_done";
      const picked = pickLine(scene, d.seenEncouragements);

      const next: AppData = unlockAll({
        ...d,
        records: { ...d.records, [date]: record },
        plants,
        progress: {
          ...d.progress,
          topicIndex,
          completedTopicIds,
          reviewCount,
          completedProjects,
          completedStages,
          streak,
          lastStudyDate: date,
          totalStudyDays: new Set([...Object.keys(d.records), date]).size,
        },
        seenEncouragements: picked.seen,
        lastFeedbackDate: date,
      });

      const newAch = Object.keys(next.achievements).filter((id) => !d.achievements[id]);
      setData(next);
      setFeedback({
        date,
        exp,
        tasksDone: doneTasks.length,
        totalTasks: plan.tasks.length,
        minutes,
        advanced: advanced ? topic.title : null,
        upgradedFromName,
        upgradedToName,
        upgradedImage,
        stageName: stageDone ? (STAGES.find((s) => s.id === topic.stageId)?.name ?? null) : null,
        achievements: newAch.map((id) => {
          const a = ACHIEVEMENTS.find((x) => x.id === id)!;
          return { name: a.name, description: a.description };
        }),
        line: picked.line,
        alreadyRecorded: false,
      });
    },
    [data],
  );

  const adopt: Ctx["adopt"] = useCallback((plant) => {
    setData((d) => {
      const date = todayISO();
      const existing = d.plants[plant.id];
      const adoption = existing ?? newAdoption(plant, date);
      return { ...d, plants: { ...d.plants, [plant.id]: adoption }, activePlantId: plant.id };
    });
  }, []);

  const releasePlant = useCallback(() => setData((d) => ({ ...d, activePlantId: null })), []);

  const noteFor = useCallback(
    (date: string): DailyNote => {
      const existing = data.notes[date];
      if (existing) return existing;
      const plan = data.plans[date];
      const topic = plan ? (topicById(plan.topicId) ?? currentTopic(data)) : currentTopic(data);
      const fresh = emptyNote({
        date,
        stageId: plan?.stageId ?? topic.stageId,
        week: plan?.week ?? topic.week,
        topicId: plan?.topicId ?? topic.id,
        topicTitle: plan?.topicTitle ?? topic.title,
        taskId: plan?.tasks.find((t) => t.section === "learn")?.id ?? null,
      });
      // tag with the day's knowledge points so "self" and friends are searchable
      return { ...fresh, tags: tagsForTopic(topic) };
    },
    [data],
  );

  const saveNote = useCallback(
    (date: string, patch: Partial<DailyNote>) => {
      setData((d) => {
        const base = d.notes[date] ?? noteFor(date);
        const next: DailyNote = { ...base, ...patch, date, updatedAt: new Date().toISOString() };
        return { ...d, notes: { ...d.notes, [date]: next } };
      });
    },
    [noteFor],
  );

  const deleteNote = useCallback((date: string) => {
    setData((d) => {
      const notes = { ...d.notes };
      delete notes[date];
      return { ...d, notes };
    });
  }, []);

  const addMistake: Ctx["addMistake"] = useCallback((input) => {
    const now = new Date().toISOString();
    const mistake: WrongQuestion = {
      ...input,
      id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      status: input.status ?? "unlearned",
      reviewCount: 0,
      lastReviewedAt: null,
      createdAt: now,
    };
    setData((d) => ({ ...d, wrongQuestions: [mistake, ...d.wrongQuestions] }));
  }, []);

  const updateMistake = useCallback((id: string, patch: Partial<WrongQuestion>) => {
    setData((d) => ({ ...d, wrongQuestions: d.wrongQuestions.map((m) => (m.id === id ? { ...m, ...patch } : m)) }));
  }, []);

  const deleteMistake = useCallback((id: string) => {
    setData((d) => ({ ...d, wrongQuestions: d.wrongQuestions.filter((m) => m.id !== id) }));
  }, []);

  const setMistakeStatus = useCallback((id: string, status: ReviewStatus) => {
    const at = todayISO();
    setData((d) => ({
      ...d,
      wrongQuestions: d.wrongQuestions.map((m) =>
        m.id === id ? { ...m, status, lastReviewedAt: status === "mastered" ? at : m.lastReviewedAt, reviewCount: status === "reviewing" ? m.reviewCount + 1 : m.reviewCount } : m,
      ),
    }));
  }, []);

  const addJournal: Ctx["addJournal"] = useCallback((entry) => {
    const j: GrowthJournal = { ...entry, id: `j-${Date.now()}`, createdAt: new Date().toISOString() };
    setData((d) => unlockAll({ ...d, journal: [j, ...d.journal] }));
  }, []);

  const updateJournal = useCallback((id: string, patch: Partial<GrowthJournal>) => {
    setData((d) => ({ ...d, journal: d.journal.map((j) => (j.id === id ? { ...j, ...patch } : j)) }));
  }, []);

  const deleteJournal = useCallback((id: string) => {
    setData((d) => ({ ...d, journal: d.journal.filter((j) => j.id !== id) }));
  }, []);

  const importData = useCallback((text: string) => {
    const parsed = importJSON(text);
    if (!parsed.ok) return { ok: false, error: parsed.error };
    setData(parsed.data);
    return { ok: true };
  }, []);

  const resetAll = useCallback(() => setData(defaultData()), []);

  const todayPlan = useCallback(() => data.plans[todayISO()] ?? buildPlan(data, todayISO(), dayStateOf(data, todayISO())), [data, dayStateOf]);

  const value = useMemo<Ctx>(
    () => ({
      data,
      feedback,
      dismissFeedback: () => setFeedback(null),
      todayPlan,
      planFor: (date) => data.plans[date],
      ensurePlan,
      regeneratePlan,
      dayState: (date) => dayStateOf(data, date),
      setDayState,
      toggleTask,
      editTaskTitle: (date, id, title) => patchPlan(date, (p) => withTaskTitle(p, id, title)),
      editTaskMinutes: (date, id, m) => patchPlan(date, (p) => withTaskMinutes(p, id, m)),
      addTaskToPlan: (date, section, title) => patchPlan(date, (p) => addTask(p, section, title)),
      removeTaskFromPlan: (date, id) => patchPlan(date, (p) => removeTask(p, id)),
      updateSettings,
      saveRecord,
      adopt,
      releasePlant,
      noteFor,
      saveNote,
      deleteNote,
      addMistake,
      updateMistake,
      deleteMistake,
      setMistakeStatus,
      addJournal,
      updateJournal,
      deleteJournal,
      importData,
      resetAll,
    }),
    [data, feedback, todayPlan, ensurePlan, regeneratePlan, dayStateOf, setDayState, toggleTask, patchPlan, updateSettings, saveRecord, adopt, releasePlant, noteFor, saveNote, deleteNote, addMistake, updateMistake, deleteMistake, setMistakeStatus, addJournal, updateJournal, deleteJournal, importData, resetAll],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

function resolveStageIndex(plantId: string | null, stageName: string): number {
  const plant = plantId ? plantById(plantId) : undefined;
  return plant ? plant.stages.findIndex((s) => s.name === stageName) : 0;
}

export function useApp(): Ctx {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp 必须在 AppProvider 内使用");
  return ctx;
}

export { EXP, wateredOn, evaluate, defaultSettings, exportJSON };
export type { Energy, Will, Difficulty, Mastery, TaskSection };
