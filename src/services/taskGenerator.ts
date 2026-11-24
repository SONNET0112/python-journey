import type { DailyTask, DayPlan, Difficulty, Energy, ReviewItem, TaskSection, Topic, Will } from "../types";
import { isRetired, pickPoints, reviewTask, slotsFor } from "./scheduler";

const SECTION_LABEL: Record<TaskSection, string> = {
  review: "知识回顾",
  learn: "新知识",
  practice: "实际练习",
  independent: "独立实践",
  summary: "学习总结",
};

export const sectionLabel = (s: TaskSection) => SECTION_LABEL[s];

interface Allocation {
  review: number;
  learn: number;
  practice: number;
  independent: number;
  summary: number;
}

/** Minute split by session length — short sessions lose the independent block entirely. */
export function allocate(total: number): Allocation {
  const tier: Allocation =
    total <= 20
      ? { review: 4, learn: 6, practice: 7, independent: 0, summary: 3 }
      : total <= 35
        ? { review: 5, learn: 10, practice: 12, independent: 0, summary: 3 }
        : total <= 60
          ? { review: 8, learn: 15, practice: 20, independent: 10, summary: 7 }
          : { review: 10, learn: 20, practice: 35, independent: 15, summary: 10 };
  const base = tier.review + tier.learn + tier.practice + tier.independent + tier.summary;
  const k = total / base;
  const scale = (n: number) => (n === 0 ? 0 : Math.max(2, Math.round((n * k) / 1)));
  return {
    review: scale(tier.review),
    learn: scale(tier.learn),
    practice: scale(tier.practice),
    independent: scale(tier.independent),
    summary: scale(tier.summary),
  };
}

export interface GenerateInput {
  date: string;
  topic: Topic;
  minutes: number;
  /** how many points of this topic are already learned — the plan continues from here */
  startPoint?: number;
  energy: Energy;
  will: Will;
  difficulty: Difficulty;
  /** how many times this topic already came back as "还需要复习" */
  reviewCount: number;
  restDay?: boolean;
  previousTopic?: Topic;
  /** points covered by the previous plan, quoted in the review task */
  previousPoints?: string[];
  /** mistakes due for review today (already filtered by the store) */
  mistakes?: { title: string; reason: string }[];
  /** knowledge points the learner has already got wrong at least twice */
  weakPoints?: string[];
  /** points whose spaced-repetition date has arrived */
  reviewItems?: ReviewItem[];
  /** weekly consolidation day: no new points, reviews + project only */
  consolidation?: boolean;
  mode?: "normal" | "rest" | "consolidation";
  projected?: boolean;
}

const taskId = (date: string, section: string, i: number) => `${date}-${section}-${i}`;

/** Pure: same input always produces the same plan, so re-rendering never shifts the day. */
export function generatePlan(input: GenerateInput): DayPlan {
  const { date, topic, minutes, energy, will, difficulty, reviewCount } = input;

  if (input.restDay) {
    const tasks: DailyTask[] = [
      { id: taskId(date, "rest", 0), section: "review", title: `随意翻一翻：${topic.title}（今天可以只做这些）`, minutes: 10, done: false },
      { id: taskId(date, "rest", 1), section: "summary", title: "写一句：今天休息得怎么样", minutes: 5, done: false },
    ];
    return basePlan(input, tasks, "休息日", [], "rest");
  }

  const alloc = allocate(minutes);
  // tired → half the practice load even if the clock allows more
  const practiceScale = energy === "tired" ? 0.7 : 1;
  const tasks: DailyTask[] = [];
  const spaced = (input.reviewItems ?? []).filter((r) => !isRetired(r));
  const start = Math.max(0, Math.min(input.startPoint ?? 0, topic.points.length - 1));

  // 综合日：不学新点，只把这一周的东西串起来 — 交错练习比继续堆新内容更有用
  if (input.consolidation) {
    spaced.slice(0, 3).forEach((item, i) => tasks.push(reviewTask(item, date, i)));
    const fresh = topic.points.slice(Math.max(0, start - 4), start);
    tasks.push({
      id: taskId(date, "practice", 0),
      section: "practice",
      title: fresh.length
        ? `综合练习：把 ${fresh.join("、")} 串起来写一个小程序（不学新内容）`
        : `综合练习：把这一周学过的点串起来，写一个能跑的小程序`,
      minutes: Math.round(minutes * 0.55),
      done: false,
    });
    tasks.push({
      id: taskId(date, "summary", 0),
      section: "summary",
      title: "周总结：这一周哪一块最不熟？写下来，下周优先补",
      minutes: Math.max(5, Math.round(minutes * 0.2)),
      done: false,
    });
    return basePlan(input, tasks, `${topic.title} · 综合练习日`, [], "consolidation");
  }

  const prevPts = input.previousPoints ?? [];
  const reviewTitle =
    reviewCount > 0
      ? `回看还没掌握的部分：${topic.points[Math.min(input.startPoint ?? 0, topic.points.length - 1)]}（第 ${reviewCount + 1} 次）`
      : prevPts.length
        ? `回顾昨天：${prevPts.join("、")}`
        : (input.startPoint ?? 0) > 0
          ? `回顾上一节：${topic.points[(input.startPoint ?? 0) - 1]}（今天接着往后学）`
          : input.previousTopic
            ? `回顾上一节：${input.previousTopic.points[input.previousTopic.points.length - 1]}`
            : `回顾基础：${topic.points[0]}`;
  const mistakeReviews = input.mistakes ?? [];
  // 间隔复习优先：到期的最多 2 个点，每个 4 分钟，剩下的时间才留给"回顾昨天"
  const due = spaced.slice(0, minutes >= 60 ? 2 : 1);
  tasks.push({
    id: taskId(date, "review", 0),
    section: "review",
    title: reviewTitle,
    minutes: Math.max(3, alloc.review - mistakeReviews.length * 5 - due.length * 4),
    done: false,
  });
  due.forEach((item, i) => tasks.push(reviewTask(item, date, i + 1)));
  mistakeReviews.forEach((m, i) => {
    tasks.push({
      id: taskId(date, "review", i + 1),
      section: "review",
      title: `错题复习：${m.title}${m.reason ? `（上次错在：${m.reason}）` : ""}`,
      minutes: 5,
      done: false,
    });
  });

  // 名额由时长和状态决定；难点占两个名额，这样"塞满"不会变成"消化不了"
  const slots = slotsFor(minutes, energy, will) + (will === "eager" && minutes >= 45 ? 1 : 0);
  // repeated struggle → smaller bites: only the next single point
  const split = reviewCount >= 2;
  const points = split ? topic.points.slice(start, start + 1) : pickPoints(topic, start, slots);
  points.forEach((p, i) => {
    tasks.push({
      id: taskId(date, "learn", i),
      section: "learn",
      title: split
        ? `只看一小块：${p}（先弄懂它是什么）`
        : `理解 ${p}：先用自己的话解释一遍${i === 0 && start > 0 ? "（接着上次的顺序）" : ""}`,
      minutes: Math.round(alloc.learn / points.length),
      done: false,
    });
  });

  const practiceMinutes = Math.round(alloc.practice * practiceScale);
  tasks.push({
    id: taskId(date, "practice", 0),
    section: "practice",
    title: split
      ? `跟着写 5 行代码，只验证 ${topic.points[0]} 这一件事`
      : `动手写：用 ${points[0]} 写一段能跑的最小示例`,
    minutes: practiceMinutes,
    done: false,
  });

  if (alloc.independent > 0 && energy !== "tired" && will !== "reluctant") {
    const isProject = !!topic.project && difficulty !== "easy" && minutes >= 40;
    tasks.push({
      id: taskId(date, "independent", 0),
      section: "independent",
      title: isProject
        ? `独立实践：不看教程，推进「${topic.project}」`
        : `独立实践：合上教程，自己把 ${points[points.length - 1]} 用一遍`,
      minutes: Math.round(alloc.independent * practiceScale),
      done: false,
      kind: isProject ? "project" : undefined,
    });
  }

  const weak = (input.weakPoints ?? []).filter((p) => topic.points.includes(p) || p === topic.title);
  if (weak.length && energy !== "tired") {
    tasks.push({
      id: taskId(date, "practice", 1),
      section: "practice",
      title: `同一个点你已经错了两次以上，再练一遍：${weak[0]}`,
      minutes: 8,
      done: false,
    });
  }

  if (difficulty === "challenge" && energy !== "tired") {
    tasks.push({
      id: taskId(date, "independent", 1),
      section: "independent",
      title: `挑战一下：把 ${points[0]} 讲给自己听，并说出它什么时候不该用`,
      minutes: 10,
      done: false,
    });
  }

  tasks.push({
    id: taskId(date, "summary", 0),
    section: "summary",
    title: "总结：写下今天卡住的第一个问题和你的答案",
    minutes: alloc.summary,
    done: false,
  });

  return basePlan(input, tasks, topic.title, points);
}

function basePlan(input: GenerateInput, tasks: DailyTask[], title: string, points: string[] = [], mode: "normal" | "rest" | "consolidation" = "normal"): DayPlan {
  return {
    date: input.date,
    topicId: input.topic.id,
    topicTitle: title,
    stageId: input.topic.stageId,
    week: input.topic.week,
    points,
    mode,
    projected: input.projected,
    previousPoints: input.previousPoints ?? [],
    tasks,
    totalMinutes: tasks.reduce((s, t) => s + t.minutes, 0),
    energy: input.energy,
    will: input.will,
    difficulty: input.difficulty,
  };
}

/** Manual edits mark the plan so regeneration never overwrites it. */
export function withTaskTitle(plan: DayPlan, taskIdValue: string, title: string): DayPlan {
  return {
    ...plan,
    edited: true,
    tasks: plan.tasks.map((t) => (t.id === taskIdValue ? { ...t, title } : t)),
  };
}

export function withTaskMinutes(plan: DayPlan, taskIdValue: string, minutes: number): DayPlan {
  const tasks = plan.tasks.map((t) => (t.id === taskIdValue ? { ...t, minutes: Math.max(2, Math.min(120, Math.round(minutes))) } : t));
  return { ...plan, edited: true, tasks, totalMinutes: tasks.reduce((s, t) => s + t.minutes, 0) };
}

export function addTask(plan: DayPlan, section: TaskSection, title: string, minutes = 10): DayPlan {
  const n = plan.tasks.filter((t) => t.section === section).length;
  const tasks = [...plan.tasks, { id: taskId(plan.date, `${section}-custom`, n), section, title, minutes, done: false }];
  return { ...plan, edited: true, tasks, totalMinutes: tasks.reduce((s, t) => s + t.minutes, 0) };
}

export function removeTask(plan: DayPlan, taskIdValue: string): DayPlan {
  const tasks = plan.tasks.filter((t) => t.id !== taskIdValue);
  return { ...plan, edited: true, tasks, totalMinutes: tasks.reduce((s, t) => s + t.minutes, 0) };
}
