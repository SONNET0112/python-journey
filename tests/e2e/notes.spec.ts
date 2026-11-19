import { expect, test, type Page } from "@playwright/test";
import { addDays, todayISO } from "../../src/utils/date";

const errors: string[] = [];
test.beforeEach(async ({ page }) => {
  errors.length = 0;
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  page.on("pageerror", (e) => errors.push(String(e)));
});

const nav = (page: Page, label: string) => page.getByRole("button", { name: label, exact: true }).first();
const today = todayISO();
const yesterday = addDays(today, -1);

test("每天独立笔记：切换日期再回来内容不丢，刷新仍在", async ({ page }) => {
  await page.goto("/");
  await nav(page, "学习笔记").click();

  const keyPoint = page.getByLabel(/今日重点/);
  await keyPoint.fill("今天搞懂了 self 指向实例");
  // autosave is debounced; wait for the saved indicator
  await expect(page.getByText(/已保存/)).toBeVisible({ timeout: 5000 });

  await page.getByRole("button", { name: `选择日期 ${yesterday}` }).click();
  await expect(page.getByLabel(/今日重点/)).toHaveValue("");
  await page.getByLabel(/今日重点/).fill("昨天只有一点点：类是模板");
  await expect(page.getByText(/已保存/)).toBeVisible({ timeout: 5000 });

  await page.getByRole("button", { name: `选择日期 ${today}` }).click();
  await expect(page.getByLabel(/今日重点/)).toHaveValue("今天搞懂了 self 指向实例");
  await page.getByRole("button", { name: `选择日期 ${yesterday}` }).click();
  await expect(page.getByLabel(/今日重点/)).toHaveValue("昨天只有一点点：类是模板");

  await page.reload();
  await nav(page, "学习笔记").click();
  await page.getByRole("button", { name: `选择日期 ${today}` }).click();
  await expect(page.getByLabel(/今日重点/)).toHaveValue("今天搞懂了 self 指向实例");

  await page.getByRole("button", { name: `选择日期 ${yesterday}` }).click();
  await expect(page.getByLabel(/今日重点/)).toHaveValue("昨天只有一点点：类是模板");
  expect(errors).toEqual([]);
});

test("按知识点搜索笔记", async ({ page }) => {
  await page.goto("/");
  await nav(page, "学习笔记").click();
  await page.getByLabel(/今日重点/).fill("self 就是实例本身");
  await expect(page.getByText(/已保存/)).toBeVisible({ timeout: 5000 });

  await page.getByPlaceholder("例如：self / 异常处理 / 2026-11").fill("self");
  await expect(page.getByRole("button", { name: /11 月 .* self 就是实例本身/ })).toBeVisible();
  await page.getByPlaceholder("例如：self / 异常处理 / 2026-11").fill("绝对不存在的关键字");
  await expect(page.getByText("没有匹配的笔记")).toBeVisible();
  expect(errors).toEqual([]);
});

test("删除笔记后该日期恢复为空", async ({ page }) => {
  await page.goto("/");
  await nav(page, "学习笔记").click();
  await page.getByLabel(/今日重点/).fill("临时笔记");
  await expect(page.getByText(/已保存/)).toBeVisible({ timeout: 5000 });
  await page.getByRole("button", { name: /删除这天的笔记/ }).click();
  await page.getByRole("button", { name: "确认删除" }).click();
  await expect(page.getByLabel(/今日重点/)).toHaveValue("");
  await page.reload();
  await nav(page, "学习笔记").click();
  await expect(page.getByLabel(/今日重点/)).toHaveValue("");
});

test("从练习任务加入错题本，并参与后续复习计划", async ({ page }) => {
  await page.goto("/");
  await nav(page, "学习计划").click();

  await page.getByRole("button", { name: /^加入错题本：/ }).first().click();
  const dialog = page.getByRole("heading", { name: "新增错题" });
  await expect(dialog).toBeVisible();
  await expect(page.getByLabel("题目名称")).not.toHaveValue("");
  await page.getByPlaceholder("把题目或当时的任务原样贴进来").fill("为什么 self 不是类？");
  await page.getByPlaceholder("self, __init__, 实例属性").fill("self, __init__");
  await page.getByLabel(/错误原因/).fill("把 self 当成了类");
  await page.getByRole("button", { name: "加入错题本", exact: true }).last().click();

  await nav(page, "错题本").click();
  await expect(page.getByRole("heading", { name: "错题本", level: 1 })).toBeVisible();
  await expect(page.getByText("未掌握").first()).toBeVisible();
  await expect(page.getByText("错因：").first()).toBeVisible();

  // an unlearned mistake with the same topic must show up when a new day's plan is generated
  await nav(page, "学习计划").click();
  const future = addDays(today, 7);
  await page.getByRole("button", { name: `选择日期 ${future}` }).click();
  await expect(page.getByText(/错题复习：/).first()).toBeVisible();

  await page.reload();
  await nav(page, "错题本").click();
  await expect(page.getByText("为什么 self 不是类？")).toBeVisible();
  expect(errors).toEqual([]);
});

test("错题掌握状态手动修改并持久化", async ({ page }) => {
  await page.goto("/");
  await nav(page, "错题本").click();
  await page.getByRole("button", { name: /新增错题/ }).first().click();
  await page.getByLabel("题目名称").fill("with 的作用");
  await page.getByPlaceholder("self, __init__, 实例属性").fill("with");
  await page.getByRole("button", { name: "加入错题本", exact: true }).last().click();
  await expect(page.getByText("with 的作用")).toBeVisible();

  const card = page.locator("article", { hasText: "with 的作用" });
  await card.getByRole("button", { name: "已掌握" }).click();
  await expect(card.locator("span").filter({ hasText: "已掌握" }).first()).toBeVisible();

  await page.reload();
  await nav(page, "错题本").click();
  await expect(page.locator("article", { hasText: "with 的作用" }).locator("span").filter({ hasText: "已掌握" }).first()).toBeVisible();

  // editing keeps the rest of the record
  await page.getByRole("button", { name: /编辑错题/ }).first().click();
  await page.getByPlaceholder("self, __init__, 实例属性").fill("with, 上下文管理器");
  await page.getByRole("button", { name: "保存修改" }).click();
  await expect(page.getByText("上下文管理器")).toBeVisible();
  expect(errors).toEqual([]);
});

test("错题本搜索与筛选", async ({ page }) => {
  await page.goto("/");
  await nav(page, "错题本").click();
  await page.getByRole("button", { name: /新增错题/ }).first().click();
  await page.getByLabel("题目名称").fill("类属性与实例属性");
  await page.getByPlaceholder("self, __init__, 实例属性").fill("类属性");
  await page.getByRole("button", { name: "加入错题本", exact: true }).last().click();

  await page.getByPlaceholder("搜索题目、错误原因、知识点").fill("类属性");
  await expect(page.getByText("类属性与实例属性")).toBeVisible();
  await page.getByPlaceholder("搜索题目、错误原因、知识点").fill("zzz");
  await expect(page.getByText("没有符合条件的错题。")).toBeVisible();
  await page.getByPlaceholder("搜索题目、错误原因、知识点").fill("");
  await page.getByRole("button", { name: "已掌握", exact: true }).first().click();
  await expect(page.getByText("没有符合条件的错题。")).toBeVisible();
});

test("移动端 390：笔记与错题页没有横向溢出", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  for (const label of ["笔记", "错题"]) {
    await page.locator("nav.fixed button", { hasText: label }).first().click();
    await page.waitForTimeout(300);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, `${label} 溢出 ${overflow}px`).toBeLessThanOrEqual(1);
  }
});
