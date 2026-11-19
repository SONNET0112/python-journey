import { expect, test, type Page } from "@playwright/test";

const errors: string[] = [];
test.beforeEach(async ({ page }) => {
  errors.length = 0;
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  page.on("pageerror", (e) => errors.push(String(e)));
});

const nav = (page: Page, label: string) => page.getByRole("button", { name: label, exact: true }).first();

test("首页完整渲染且没有控制台错误", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "今日成长" })).toBeVisible();
  await expect(page.getByText("今日主题")).toBeVisible();
  await expect(page.getByText("今天的任务")).toBeVisible();
  await expect(page.locator("text=接下来的方向")).toBeVisible();
  await expect(page.getByText("学习统计")).toBeVisible();
  const tasks = page.getByRole("button", { name: /^完成任务：/ });
  expect(await tasks.count()).toBeGreaterThanOrEqual(4);
  expect(errors).toEqual([]);
});

test("领养植物 → 首页展示 → 刷新后仍在", async ({ page }) => {
  await page.goto("/");
  await nav(page, "植物图鉴").click();
  await expect(page.getByText("八种植物，每一株都有完整的成长阶段和自己的图片。一次只养一株。")).toBeVisible();
  const cards = page.getByRole("button", { name: /查看图鉴/ });
  await expect(cards).toHaveCount(8);

  await page.getByRole("button", { name: /查看图鉴/ }).first().click();
  await expect(page.getByText("寓意：")).toBeVisible();
  await expect(page.getByText(/1\. 种子/)).toBeVisible();
  await page.getByRole("button", { name: /领养这株植物/ }).click();
  await expect(page.getByText(/去首页看看它/)).toBeVisible();
  await page.getByRole("button", { name: "关闭植物详情" }).click();

  await nav(page, "首页").click();
  await expect(page.getByRole("heading", { name: "我的向日葵" })).toBeVisible();
  await expect(page.getByText("今日浇水")).toBeVisible();

  await page.reload();
  await expect(page.getByRole("heading", { name: "我的向日葵" })).toBeVisible();
  expect(errors).toEqual([]);
});

test("完成任务 → 结束学习 → 成长反馈 → 数据持久化", async ({ page }) => {
  await page.goto("/");
  // adopt first so exp has somewhere to go
  await nav(page, "植物图鉴").click();
  await page.getByRole("button", { name: /查看图鉴/ }).first().click();
  await page.getByRole("button", { name: /领养这株植物/ }).click();
  await page.getByRole("button", { name: "关闭植物详情" }).click();

  await nav(page, "首页").click();
  const tasks = page.getByRole("button", { name: /^完成任务：/ });
  const n = await tasks.count();
  for (let i = 0; i < n; i++) await page.getByRole("button", { name: /^完成任务：/ }).first().click();
  await expect(page.getByText(`${n}/${n} 项 · 100%`)).toBeVisible();

  await page.getByRole("button", { name: "结束今天的学习" }).first().click();
  await page.getByRole("button", { name: /完全掌握/ }).click();
  await page.getByPlaceholder("例如：终于搞懂了 self 指的是实例本身，不是类。").fill("今天搞懂了 self 指的是实例。");
  await page.getByRole("button", { name: "完成并领取成长" }).click();

  await expect(page.getByText("今天的努力已经收下了")).toBeVisible();
  await expect(page.getByText("成长经验")).toBeVisible();
  await expect(page.getByText("知识模块推进：面向对象基础")).toBeVisible();
  await page.getByRole("button", { name: "收下，明天继续" }).click();

  await expect(page.getByText("今天已记录")).toBeVisible();

  await page.reload();
  await expect(page.getByText("今天已记录")).toBeVisible();
  await nav(page, "学习记录").click();
  await expect(page.getByText("完全掌握").first()).toBeVisible();
  await expect(page.getByText("今天搞懂了 self 指的是实例。")).toBeVisible();
  expect(errors).toEqual([]);
});

test("计划页：状态影响计划、可加任务、已完成不被覆盖", async ({ page }) => {
  await page.goto("/");
  await nav(page, "学习计划").click();
  const total = page.getByText(/预计 \d+ 分钟/);
  await expect(total).toBeVisible();

  await page.getByRole("button", { name: "疲惫" }).click();
  await page.getByRole("button", { name: "不太想学" }).click();
  await page.getByRole("button", { name: /按这些设置生成/ }).click();
  await expect(page.getByText("已按今天的设置重新生成计划")).toBeVisible();
  await expect(page.getByRole("button", { name: /独立实践/ })).toHaveCount(0);

  // add a custom task
  await page.getByPlaceholder("例如：把 User 类改成用字典存储").fill("把 User 类改成用字典存储");
  await page.getByRole("button", { name: "添加" }).click();
  await expect(page.getByText("把 User 类改成用字典存储")).toBeVisible();
  await expect(page.getByText("手动调整过")).toBeVisible();

  // regeneration must refuse now
  await page.getByRole("button", { name: /按这些设置生成/ }).click();
  await expect(page.getByText(/不会被覆盖/)).toBeVisible();

  await page.reload();
  await expect(page.getByText("把 User 类改成用字典存储")).toBeVisible();
  expect(errors).toEqual([]);
});

test("成长日记：创建 / 编辑 / 删除", async ({ page }) => {
  await page.goto("/");
  await nav(page, "成长日记").click();
  await page.getByRole("button", { name: /写一篇/ }).click();
  await page.locator("textarea").first().fill("今天第一次自己写了类。");
  await page.locator("textarea").last().fill("希望三个月后能独立做完一个 Agent。");
  await page.getByRole("button", { name: "保存日记" }).click();
  await expect(page.getByText("今天第一次自己写了类。")).toBeVisible();

  await page.getByRole("button", { name: "编辑日记" }).click();
  await page.locator("textarea").first().fill("今天第一次自己写了类，并且跑起来了。");
  await page.getByRole("button", { name: "保存修改" }).click();
  await expect(page.getByText("并且跑起来了")).toBeVisible();

  await page.getByRole("button", { name: "删除日记" }).click();
  await page.getByRole("button", { name: "确认删除" }).click();
  await expect(page.getByText("还没有日记")).toBeVisible();
  expect(errors).toEqual([]);
});

test("导入非法 JSON 时保留原数据", async ({ page }) => {
  await page.goto("/");
  await nav(page, "设置").click();
  const input = page.locator('input[type="file"]');
  await input.setInputFiles({ name: "bad.json", mimeType: "application/json", buffer: Buffer.from('{"hello":"world"}') });
  await expect(page.getByText(/导入失败，原数据未改动/)).toBeVisible();

  await input.setInputFiles({
    name: "ok.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({
        version: 1,
        settings: { defaultMinutes: 45, minutesByWeekday: {}, restDays: [], energy: "normal", difficulty: "normal", adoptConfirm: true },
        progress: { topicIndex: 0, completedTopicIds: [], reviewCount: {}, totalStudyDays: 0, streak: 0, lastStudyDate: null, completedStages: [], completedProjects: [], stagePointsDone: {} },
        plans: {},
        records: {},
        journal: [],
        achievements: {},
      }),
    ),
  });
  await expect(page.getByText("数据已导入，原记录已被替换")).toBeVisible();
  expect(errors).toEqual([]);
});

test("六阶段路线与第一阶段八周计划完整", async ({ page }) => {
  await page.goto("/");
  await nav(page, "学习路线").click();
  for (const name of ["Python 工程能力", "计算机基础与网络", "后端开发与数据库", "大模型应用开发", "Agent 与 RAG", "工程交付与部署"]) {
    await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
  }
  if (!(await page.getByText("第 8 周").first().isVisible())) await page.getByRole("heading", { name: "Python 工程能力", exact: true }).click();
  for (const w of ["第 1 周", "第 4 周", "第 8 周"]) await expect(page.getByText(w, { exact: true }).first()).toBeVisible();
  await expect(page.getByText("实践项目：简易 AI Agent 客户端")).toBeVisible();
});

test.describe("小屏 320×700", () => {
  test.use({ viewport: { width: 320, height: 700 } });
  test("首页与图鉴没有横向溢出", async ({ page }) => {
    await page.goto("/");
    for (const p of ["首页", "图鉴", "计划"]) {
      await page.locator("nav.fixed button", { hasText: p }).first().click();
      await page.waitForTimeout(250);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `${p} 溢出 ${overflow}px`).toBeLessThanOrEqual(1);
    }
  });
});

test.describe("移动端 390×844", () => {
  test.use({ viewport: { width: 390, height: 844 } });
  test("所有页面没有横向溢出", async ({ page }) => {
    await page.goto("/");
    const pages = ["首页", "路线", "计划", "记录", "图鉴", "历程", "日记", "设置"];
    for (const p of pages) {
      await page.locator("nav.fixed button", { hasText: p }).first().click();
      await page.waitForTimeout(250);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `${p} 溢出 ${overflow}px`).toBeLessThanOrEqual(1);
    }
  });
});
