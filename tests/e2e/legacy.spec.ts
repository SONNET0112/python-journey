import { expect, test } from "@playwright/test";

/** A browser that used the previous version still has old-shaped data in localStorage. */
test("旧版本存下来的数据打开后不再白屏", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));

  await page.goto("/");
  await page.evaluate(() => {
    const d = new Date();
    const p = (x: number) => String(x).padStart(2, "0");
    const today = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
    localStorage.setItem(
      "python-journey.data",
      JSON.stringify({
        version: 2,
        settings: { defaultMinutes: 30, minutesByWeekday: { "1": 30, "2": 30, "3": 30, "4": 30, "5": 30, "6": 45, "0": 20 }, restDays: [0], energy: "normal", difficulty: "normal", adoptConfirm: true },
        progress: { topicIndex: 1, completedTopicIds: ["s1-w1"], reviewCount: {}, totalStudyDays: 1, streak: 1, lastStudyDate: today, completedStages: [], completedProjects: [], stagePointsDone: {} },
        plans: {
          [today]: {
            date: today, topicId: "s1-w2", topicTitle: "面向对象进阶", stageId: "stage-1", week: 2,
            tasks: [{ id: "t1", section: "learn", title: "理解 封装", minutes: 5, done: false }],
            totalMinutes: 5, energy: "normal", will: "normal", difficulty: "normal",
          },
        },
        records: {}, notes: {}, wrongQuestions: [], plants: {}, activePlantId: null, journal: [], achievements: {}, seenEncouragements: [], lastFeedbackDate: null,
      }),
    );
  });
  await page.reload();

  await expect(page.getByRole("heading", { name: "今日成长" })).toBeVisible();
  await expect(page.getByText("本周知识点")).toBeVisible();
  await expect(page.getByText("面向对象进阶").first()).toBeVisible();
  expect(errors).toEqual([]);
});
