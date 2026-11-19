import type { DailyTask, DayPlan, Difficulty, Energy, TaskSection, Topic, Will } from "../types";

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
  energy: Energy;
  will: Will;
  difficulty: Difficulty;
  /** how many times this topic already came back as "还需要复习" */
  reviewCount: number;
  restDay?: boolean;
  previousTopic?: Topic;
  /** mistakes due for review today (already filtered by the store) */
  mistakes?: { title: string; reason: string }[];
  /** knowledge points the learner has already got wrong at least twice */
  weakPoints?: string[];
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
    return basePlan(input, tasks, "休息日");
  }

  const alloc = allocate(minutes);
  // tired → half the practice load even if the clock allows more
  const practiceScale = energy === "tired" ? 0.7 : 1;
  const tasks: DailyTask[] = [];

  const reviewTitle =
    reviewCount > 0
      ? `回看昨天没掌握的部分：${topic.points[0]}（第 ${reviewCount + 1} 次）`
      : input.previousTopic
        ? `回顾昨天：${input.previousTopic.points[input.previousTopic.points.length - 1]}`
        : `回顾基础：${topic.points[0]}`;
  const mistakeReviews = input.mistakes ?? [];
  tasks.push({
    id: taskId(date, "review", 0),
    section: "review",
    title: reviewTitle,
    minutes: Math.max(3, alloc.review - mistakeReviews.length * 5),
    done: false,
  });
  mistakeReviews.forEach((m, i) => {
    tasks.push({
      id: taskId(date, "review", i + 1),
      section: "review",
      title: `错题复习：${m.title}${m.reason ? `（上次错在：${m.reason}）` : ""}`,
      minutes: 5,
      done: false,
    });
  });

  // repeated struggle → smaller bites: only the first point, plus a micro drill
  const split = reviewCount >= 2;
  let learnCount = minutes < 25 ? 1 : minutes < 45 ? 2 : 3;
  if (split) learnCount = Math.min(learnCount, 1);
  if (will === "reluctant") learnCount = Math.max(1, learnCount - 1);
  if (will === "eager" && minutes >= 45) learnCount = Math.min(topic.points.length, learnCount + 1);
  const points = split ? topic.points.slice(0, 1) : topic.points.slice(0, learnCount);
  points.forEach((p, i) => {
    tasks.push({
      id: taskId(date, "learn", i),
      section: "learn",
      title: split ? `只看一小块：${p}（先弄懂它是什么）` : `理解 ${p}：先用自己的话解释一遍`,
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
      : `动手写：用 ${topic.points[0]} 写一段能跑的最小示例`,
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
        : `独立实践：合上教程，自己把 ${topic.points[points.length - 1]} 用一遍`,
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
      title: `挑战一下：把 ${topic.points[0]} 讲给自己听，并说出它什么时候不该用`,
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

  return basePlan(input, tasks, topic.title);
}

function basePlan(input: GenerateInput, tasks: DailyTask[], title: string): DayPlan {
  return {
    date: input.date,
    topicId: input.topic.id,
    topicTitle: title,
    stageId: input.topic.stageId,
    week: input.topic.week,
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
