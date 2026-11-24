// Live smoke test against the deployed Pages URL (real Chrome, real user flow).
import { chromium } from "playwright";

const URL = process.argv[2] || "https://sonnet0112.github.io/python-journey/";
const browser = await chromium.launch({ channel: "chrome" });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const errors = [];
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
page.on("pageerror", (e) => errors.push(String(e)));

await page.goto(URL, { waitUntil: "networkidle" });
const title = await page.title();
const h1 = await page.locator("h1").first().innerText();
const tasks = await page.getByRole("button", { name: /^完成任务：/ }).count();
const bgLoaded = await page.evaluate(() => {
  const el = document.querySelector("div[style*='background-image']");
  return !!el && getComputedStyle(el).backgroundImage.includes("cosmos");
});

// adopt + note + mistake, then reload to prove localStorage survives
await page.getByRole("button", { name: "植物图鉴", exact: true }).first().click();
await page.getByRole("button", { name: /查看图鉴/ }).first().click();
await page.getByRole("button", { name: /领养这株植物/ }).click();
await page.getByRole("button", { name: "关闭植物详情" }).click();

await page.getByRole("button", { name: "学习笔记", exact: true }).first().click();
await page.getByLabel(/今日重点/).fill("线上验证：self 指向实例");
await page.waitForTimeout(900);

await page.reload({ waitUntil: "networkidle" });
await page.getByRole("button", { name: "学习笔记", exact: true }).first().click();
const noteValue = await page.getByLabel(/今日重点/).inputValue();
await page.getByRole("button", { name: "首页", exact: true }).first().click();
const plantVisible = await page.getByRole("heading", { name: "我的向日葵" }).isVisible();

// continuity check on the deployed build: master today, then look at tomorrow's plan
const pad = (x) => String(x).padStart(2, "0");
const d = new Date();
const today = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const t = new Date(`${today}T12:00:00`);
t.setDate(t.getDate() + 1);
const tomorrow = `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`;

await page.getByRole("button", { name: "首页", exact: true }).first().click();
// today's plan may already be recorded from an earlier run — record only if needed
if (await page.getByRole("button", { name: "结束今天的学习" }).first().isVisible()) {
  const nTasks = await page.getByRole("button", { name: /^完成任务：/ }).count();
  for (let i = 0; i < nTasks; i++) await page.getByRole("button", { name: /^完成任务：/ }).first().click();
  await page.getByRole("button", { name: "结束今天的学习" }).first().click();
  await page.getByRole("button", { name: /完全掌握/ }).click();
  await page.getByRole("button", { name: "完成并领取成长" }).click();
  await page.getByRole("button", { name: "收下，明天继续" }).click();
}

await page.getByRole("button", { name: "学习计划", exact: true }).first().click();
await page.getByRole("button", { name: `选择日期 ${tomorrow}` }).click();
const continuity = await page.evaluate(() => document.body.innerText);
const continuityOk = continuity.includes("上一节") && continuity.includes("回顾昨天");
const learnedSoFar = (continuity.match(/主题进度 (\d+)\/\d+/) || [])[1] ?? null;

await page.screenshot({ path: "shots/live-dashboard.png" });
await browser.close();

console.log(JSON.stringify({ url: URL, title, h1, tasks, bgLoaded, noteValue, plantVisible, continuityOk, learnedSoFar, errors }, null, 2));
