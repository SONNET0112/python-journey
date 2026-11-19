// Screenshot pass for visual review: seeds a realistic state, then captures each page.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

const OUT = resolve(import.meta.dirname, "..", "shots");
mkdirSync(OUT, { recursive: true });

const today = new Date();
const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

const browser = await chromium.launch({ channel: "chrome" });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();

await page.goto("http://localhost:5188/");

// adopt sunflower
await page.getByRole("button", { name: "植物图鉴", exact: true }).first().click();
await page.getByRole("button", { name: /查看图鉴/ }).first().click();
await page.getByRole("button", { name: /领养这株植物/ }).click();
await page.getByRole("button", { name: "关闭植物详情" }).click();

// finish today's tasks + record
await page.getByRole("button", { name: "首页", exact: true }).first().click();
const n = await page.getByRole("button", { name: /^完成任务：/ }).count();
for (let i = 0; i < n; i++) await page.getByRole("button", { name: /^完成任务：/ }).first().click();
await page.getByRole("button", { name: "结束今天的学习" }).first().click();
await page.getByPlaceholder("例如：终于搞懂了 self 指的是实例本身，不是类。").fill("今天终于搞懂了 self 指向实例本身。");
await page.getByRole("button", { name: "完成并领取成长" }).click();
await page.screenshot({ path: resolve(OUT, "01-feedback.png") });
await page.getByRole("button", { name: "收下，明天继续" }).click();

await page.screenshot({ path: resolve(OUT, "02-dashboard.png"), fullPage: true });
// seed a note and one mistake so the new pages aren't empty in the shots
await page.getByRole("button", { name: "学习笔记", exact: true }).first().click();
await page.getByLabel(/今日重点/).fill("class 是模板，对象是照着模板造出来的东西");
await page.getByLabel(/今日困惑/).fill("__init__ 到底什么时候被调用？");
await page.getByLabel(/我的理解/).fill("self 就是刚造出来的那个对象自己，写在方法里用来指回它。");
await page.getByLabel(/代码片段/).fill("class User: def __init__(self, name): self.name = name");
await page.waitForTimeout(900);
await page.screenshot({ path: resolve(OUT, "11-notes.png"), fullPage: false });

await page.getByRole("button", { name: "错题本", exact: true }).first().click();
await page.getByRole("button", { name: /新增错题/ }).first().click();
await page.getByLabel("题目名称").fill("self 指向的是类还是实例？");
await page.getByPlaceholder("把题目或当时的任务原样贴进来").fill("在 __init__ 里写的 self，指的是 User 类本身还是刚创建的对象？");
await page.getByLabel("我的原始答案").fill("指向类本身");
await page.getByLabel("正确答案").fill("指向刚创建的实例");
await page.getByLabel(/错误原因/).fill("把类当成对象了");
await page.getByPlaceholder("self, __init__, 实例属性").fill("self, __init__");
await page.getByRole("button", { name: "加入错题本", exact: true }).last().click();
await page.waitForTimeout(400);
await page.screenshot({ path: resolve(OUT, "12-mistakes.png"), fullPage: false });

for (const [label, file] of [
  ["学习计划", "03-plan"],
  ["学习记录", "04-records"],
  ["错题本", "12-mistakes"],
  ["学习笔记", "11-notes"],
  ["植物图鉴", "05-gallery"],
  ["成长历程", "06-journey"],
  ["学习路线", "07-roadmap"],
  ["成长日记", "08-journal"],
  ["设置", "09-settings"],
]) {
  await page.getByRole("button", { name: label, exact: true }).first().click();
  await page.waitForTimeout(350);
  await page.screenshot({ path: resolve(OUT, `${file}.png`), fullPage: false });
}

const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const mp = await mobile.newPage();
await mp.goto("http://localhost:5188/");
await mp.evaluate((state) => localStorage.setItem("python-journey.data", state), await page.evaluate(() => localStorage.getItem("python-journey.data")));
await mp.reload();
await mp.waitForTimeout(400);
await mp.screenshot({ path: resolve(OUT, "10-mobile-dashboard.png"), fullPage: true });

await browser.close();
console.log("shots saved");
