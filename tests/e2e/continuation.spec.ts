import { expect, test, type Page } from "@playwright/test";
import { addDays, todayISO } from "../../src/utils/date";

const CARRIED = ["Class 与 Object", "__init__ 的作用"];
const NEXT = ["self 是什么", "实例属性与实例方法"];
const WEEKDAYS = { "1": 30, "2": 30, "3": 30, "4": 30, "5": 30, "6": 30, "0": 30 };

/** 每天都是普通学习日（关掉休息日/综合日），用例就跟星期几无关 */
const SETTINGS = { defaultMinutes: 30, minutesByWeekday: WEEKDAYS, restDays: [], weeklyRhythm: false, energy: "normal", difficulty: "normal", adoptConfirm: true };

const planOf = (date: string, points: string[], done = false) => ({
  date,
  topicId: "s1-w1",
  topicTitle: "面向对象基础",
  stageId: "stage-1",
  week: 1,
  points,
  previousPoints: [] as string[],
  mode: "normal",
  tasks: points.map((p, i) => ({ id: `${date}-learn-${i}`, section: "learn", title: `理解 ${p}`, minutes: 10, done })),
  totalMinutes: points.length * 10,
  energy: "normal",
  will: "normal",
  difficulty: "normal",
});

const EMPTY_PROGRESS = {
  topicIndex: 0,
  pointsDone: {} as Record<string, number>,
  completedTopicIds: [] as string[],
  reviewCount: {},
  totalStudyDays: 0,
  streak: 0,
  lastStudyDate: null as string | null,
  completedStages: [] as string[],
  completedProjects: [] as string[],
  stagePointsDone: {},
  reviews: [] as unknown[],
};

/** 页面脚本执行前写入数据，否则应用挂载时的第一次保存会把种子覆盖掉 */
async function bootWith(page: Page, data: unknown) {
  await page.addInitScript((json: string) => {
    try {
      localStorage.setItem("python-journey.data", json);
    } catch {
      // about:blank 上没有 localStorage
    }
  }, JSON.stringify(data));
  await page.goto("/");
}

const stored = (page: Page) =>
  page.evaluate(
    () =>
      JSON.parse(localStorage.getItem("python-journey.data")!) as {
        plans: Record<string, { points: string[]; projected?: boolean; continuation?: boolean }>;
      },
  );

/**
 * 昨天一个任务都没勾、也没记录 → 今天必须接着昨天的内容，不能按日历往前翻一天。
 * 旧版本会把"昨天在计划页看过的今天预览计划"当成今天的计划，于是直接教第二天的内容。
 */
test("昨天没学：今天继续昨天的内容，不往后翻一天", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));

  const today = todayISO();
  const yesterday = addDays(today, -1);

  await bootWith(page, {
    version: 4,
    settings: SETTINGS,
    progress: EMPTY_PROGRESS,
    plans: {
      [yesterday]: planOf(yesterday, CARRIED),
      // 昨天在计划页里看过"明天"，留下一份按节奏推算的预览
      [today]: { ...planOf(today, NEXT), previousPoints: CARRIED, projected: true },
    },
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

  await expect(page.getByRole("button", { name: `完成任务：理解 ${CARRIED[0]}：先用自己的话解释一遍` })).toBeVisible();
  await expect(page.getByRole("button", { name: `完成任务：理解 ${CARRIED[1]}：先用自己的话解释一遍` })).toBeVisible();
  await expect(page.getByRole("button", { name: /^完成任务：理解 self 是什么/ })).toHaveCount(0);
  await expect(page.getByText(/上次没学完：Class 与 Object、__init__ 的作用/)).toBeVisible();

  const saved = await stored(page);
  expect(saved.plans[today].points).toEqual(CARRIED);
  expect(saved.plans[today].projected).toBeFalsy();
  expect(saved.plans[today].continuation).toBe(true);
  expect(saved.plans[yesterday].points).toEqual(CARRIED);
  expect(errors).toEqual([]);
});

/** 反过来：昨天真的学过了，今天就必须往前走，不能原地打转。 */
test("昨天学过并记录：今天往前走，不重复昨天", async ({ page }) => {
  const today = todayISO();
  const yesterday = addDays(today, -1);

  await bootWith(page, {
    version: 4,
    settings: SETTINGS,
    progress: { ...EMPTY_PROGRESS, pointsDone: { "s1-w1": 2 }, totalStudyDays: 1, streak: 1, lastStudyDate: yesterday },
    plans: {
      [yesterday]: planOf(yesterday, CARRIED, true),
    },
    records: { [yesterday]: { date: yesterday, minutes: 20, completedTasks: 2, totalTasks: 2, mastery: "full", summary: "", exp: 20 } },
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

  await expect(page.getByRole("button", { name: /^完成任务：理解 self 是什么/ })).toBeVisible();
  await expect.poll(async () => (await stored(page)).plans[today]?.points).toEqual(NEXT);
  expect((await stored(page)).plans[today].continuation).toBeFalsy();
});
