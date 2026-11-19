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

await page.screenshot({ path: "shots/live-dashboard.png" });
await browser.close();

console.log(JSON.stringify({ url: URL, title, h1, tasks, bgLoaded, noteValue, plantVisible, errors }, null, 2));
