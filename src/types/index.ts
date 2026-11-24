/** Learning system --------------------------------------------------------- */

export type Mastery = "full" | "basic" | "review" | "none";
export type Energy = "high" | "normal" | "tired";
export type Will = "eager" | "normal" | "reluctant";
export type Difficulty = "easy" | "normal" | "challenge";

export type TaskSection = "review" | "learn" | "practice" | "independent" | "summary";

export interface DailyTask {
  id: string;
  section: TaskSection;
  title: string;
  minutes: number;
  done: boolean;
  /** a practice-project task earns a much larger plant reward */
  kind?: "project";
}

export interface DayPlan {
  date: string; // YYYY-MM-DD
  topicId: string;
  topicTitle: string;
  stageId: string;
  week: number;
  /** the exact knowledge points this day teaches — the next slice, never the first slice again */
  points: string[];
  /** what yesterday actually covered, used for the review task and the continuity line */
  previousPoints: string[];
  tasks: DailyTask[];
  totalMinutes: number;
  energy: Energy;
  will: Will;
  difficulty: Difficulty;
  /** true once the user hand-edited the plan — regeneration must never touch it again */
  edited?: boolean;
}

export interface StudyRecord {
  date: string;
  minutes: number;
  completedTasks: number;
  totalTasks: number;
  mastery: Mastery;
  summary: string;
  /** exp granted for that day, capped */
  exp: number;
}

export interface Topic {
  id: string;
  title: string;
  stageId: string;
  week: number;
  points: string[];
  project?: string;
}

export interface LearningModule {
  id: string;
  title: string;
  points: string[];
  project?: string;
  week: number;
}

export interface WeeklyPlan {
  week: number;
  title: string;
  goal: string;
  modules: LearningModule[];
}

export interface LearningStage {
  id: string;
  index: number;
  name: string;
  goal: string;
  weeks: number;
  topics: string[];
  project: string;
  weeklyPlans?: WeeklyPlan[];
}

/** Plant system ----------------------------------------------------------- */

export interface PlantStage {
  id: string;
  name: string;
  description: string;
  image: string; // relative to src/assets, e.g. plants/rose/bud.svg
  requiredExp: number;
}

export interface Plant {
  id: string;
  name: string;
  description: string;
  meaning: string;
  coverImage: string;
  accent: string;
  cycle: string;
  stages: PlantStage[];
}

export interface PlantGrowthRecord {
  date: string;
  type: "adopt" | "water" | "stage" | "exp";
  title: string;
  detail: string;
  stageId: string;
  image: string;
}

export interface PlantAdoption {
  plantId: string;
  adoptedAt: string;
  currentStageId: string;
  currentExp: number;
  totalWateringCount: number;
  growthRecords: PlantGrowthRecord[];
}

/** Journal + reward systems ------------------------------------------------ */

export interface GrowthJournal {
  id: string;
  date: string;
  learned: string;
  solved: string;
  proud: string;
  confused: string;
  message: string;
  createdAt: string;
}

/** Notes & mistakes -------------------------------------------------------- */

export type ReviewStatus = "unlearned" | "reviewing" | "mastered";

/** A knowledge point a note or a mistake is filed under — the searchable dimension. */
export interface NoteTag {
  label: string;
  topicId: string;
  stageId: string;
  week: number;
}

export interface DailyNote {
  date: string;
  stageId: string;
  week: number;
  topicId: string;
  topicTitle: string;
  taskId: string | null;
  keyPoint: string;
  confusion: string;
  understanding: string;
  code: string;
  toReview: string;
  extra: string;
  tags: NoteTag[];
  updatedAt: string;
}

export interface WrongQuestion {
  id: string;
  title: string;
  content: string;
  myAnswer: string;
  correctAnswer: string;
  reason: string;
  points: string[];
  topicId: string;
  stageId: string;
  createdAt: string;
  sourceTaskId: string | null;
  sourceTaskTitle: string | null;
  status: ReviewStatus;
  reviewCount: number;
  lastReviewedAt: string | null;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: string;
}

export interface Encouragement {
  scene: string;
  lines: string[];
}

/** Settings + persisted root ---------------------------------------------- */

export interface UserSettings {
  defaultMinutes: number;
  minutesByWeekday: Record<string, number>; // "1".."0" → minutes
  restDays: number[]; // weekday numbers 0-6
  energy: Energy;
  difficulty: Difficulty;
  adoptConfirm: boolean;
}

export interface UserProgress {
  topicIndex: number;
  /** topicId → how many of its knowledge points are already learned */
  pointsDone: Record<string, number>;
  completedTopicIds: string[];
  /** topicId → times it came back as "还需要复习" */
  reviewCount: Record<string, number>;
  totalStudyDays: number;
  streak: number;
  lastStudyDate: string | null;
  completedStages: string[];
  completedProjects: string[];
  stagePointsDone: Record<string, number>;
}

export interface DayState {
  energy: Energy;
  will: Will;
  difficulty: Difficulty;
  note: string;
  /** one-off minutes for this date; empty means "use the weekday default" */
  minutes?: number;
}

export interface AppData {
  version: number;
  settings: UserSettings;
  progress: UserProgress;
  plans: Record<string, DayPlan>;
  records: Record<string, StudyRecord>;
  /** per-date energy / will / difficulty / note the plan was generated from */
  dayStates: Record<string, DayState>;
  /** plantId → adoption; only one is active at a time */
  plants: Record<string, PlantAdoption>;
  activePlantId: string | null;
  journal: GrowthJournal[];
  /** one note per date — keyed by date so dates can never overwrite each other */
  notes: Record<string, DailyNote>;
  wrongQuestions: WrongQuestion[];
  achievements: Record<string, string>;
  seenEncouragements: string[];
  lastFeedbackDate: string | null;
}
