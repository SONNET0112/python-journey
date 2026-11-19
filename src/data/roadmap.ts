import type { LearningModule, LearningStage, Topic, WeeklyPlan } from "../types";

const week1Points = ["Class 与 Object", "__init__ 的作用", "self 是什么", "实例属性与实例方法", "创建多个对象", "对象之间的关系"];
const week2Points = ["封装", "继承", "多态与方法重写", "类属性", "类方法与静态方法", "组合"];
const week3Points = ["open 与 with", "文件读写", "JSON 序列化", "pathlib 路径处理", "异常处理", "数据持久化"];
const week4Points = ["Type Hints", "Optional 与 Union", "BaseModel", "Field 与校验", "数据序列化", "结构化数据建模"];
const week5Points = ["同步与异步", "阻塞与非阻塞", "协程", "async / await", "asyncio.gather", "异步异常处理"];
const week6Points = ["HTTP 基础", "GET 与 POST", "Headers 与 Body", "状态码", "requests 与 aiohttp", "API Key 与环境变量", "超时与重试"];
const week7Points = ["venv 与 pip", "requirements.txt", "pyproject.toml", "模块与包", "logging", "pytest"];
const week8Points = ["项目结构拆分", "模型 API 配置", "异步调用", "结构化响应", "对话历史", "日志与异常处理", "测试与收尾"];

const w = (week: number, title: string, goal: string, points: string[], project: string): WeeklyPlan => ({
  week,
  title,
  goal,
  modules: [{ id: `s1-w${week}`, week, title, points, project }],
});

export const STAGE_ONE_WEEKS: WeeklyPlan[] = [
  w(1, "面向对象基础", "从函数式写法过渡到用类和对象表达现实中的事物。", week1Points, "User 用户管理系统"),
  w(2, "面向对象进阶", "掌握封装、继承、多态与组合，写出可扩展的类结构。", week2Points, "模型调用管理系统"),
  w(3, "文件操作与数据管理", "让程序的数据能真正存下来、读回来。", week3Points, "给用户管理系统增加 JSON 保存"),
  w(4, "类型提示与 Pydantic", "用类型和模型约束数据结构，减少运行时错误。", week4Points, "结构化用户数据管理"),
  w(5, "异步编程", "理解协程与事件循环，让 I/O 等待不再阻塞。", week5Points, "异步任务执行器"),
  w(6, "HTTP 与 API", "搞清楚一次网络请求到底发生了什么。", week6Points, "模型 API 调用客户端"),
  w(7, "Python 工程化", "把脚本整理成可维护、可测试、可交付的工程。", week7Points, "整理前七周的项目为标准工程"),
  w(8, "综合项目", "把八周所学合成一个完整的小型 AI Agent 客户端。", week8Points, "简易 AI Agent 客户端"),
];

const stageTwoTopics = ["操作系统基础", "进程与线程", "内存管理", "文件系统", "IP 与 DNS", "TCP 与 UDP", "HTTP 与 HTTPS", "端口与连接", "Linux 常用命令"];

const stageThreeTopics = ["FastAPI 入门", "REST API 设计", "Pydantic 请求响应模型", "SQL 基础", "SQLite 与 PostgreSQL", "CRUD 实现", "数据库设计", "认证与权限"];

const stageFourTopics = ["LLM 基础", "Token 与上下文", "Prompt 与 System Prompt", "模型 API 调用", "流式输出", "结构化输出", "Function Calling", "错误处理与成本控制"];

const stageFiveTopics = ["Agent 基本原理", "Agent 执行循环", "工具调用", "多步骤任务", "Embedding", "向量数据库", "RAG 检索流程", "文档切分", "MCP", "多 Agent 与状态管理"];

const stageSixTopics = ["Git 工作流", "Dockerfile", "Docker Compose", "环境变量与配置", "Linux 部署", "Nginx 反向代理", "HTTPS 与证书", "日志与监控", "测试与安全加固"];

export const STAGES: LearningStage[] = [
  {
    id: "stage-1",
    index: 1,
    name: "Python 工程能力",
    goal: "从会写脚本，走到能独立搭出一个结构清晰、可测试、可交付的 Python 项目。",
    weeks: 8,
    topics: STAGE_ONE_WEEKS.map((v) => v.title),
    project: "简易 AI Agent 客户端",
    weeklyPlans: STAGE_ONE_WEEKS,
  },
  {
    id: "stage-2",
    index: 2,
    name: "计算机基础与网络",
    goal: "知道你的代码跑在什么之上，出了问题能自己定位。",
    weeks: 3,
    topics: stageTwoTopics,
    project: "在 Linux 环境运行 Python 服务",
  },
  {
    id: "stage-3",
    index: 3,
    name: "后端开发与数据库",
    goal: "能设计数据表、写出规范的接口，并把服务跑起来。",
    weeks: 4,
    topics: stageThreeTopics,
    project: "开发一个完整的后端服务",
  },
  {
    id: "stage-4",
    index: 4,
    name: "大模型应用开发",
    goal: "理解模型 API 的边界，写出稳定、可控的 AI 应用。",
    weeks: 4,
    topics: stageFourTopics,
    project: "开发一个 AI 应用",
  },
  {
    id: "stage-5",
    index: 5,
    name: "Agent 与 RAG",
    goal: "让模型会用工具、会检索，能完成多步骤任务。",
    weeks: 5,
    topics: stageFiveTopics,
    project: "开发个人 AI 助手",
  },
  {
    id: "stage-6",
    index: 6,
    name: "工程交付与部署",
    goal: "把自己的作品真正部署上线，并且持续维护。",
    weeks: 4,
    topics: stageSixTopics,
    project: "完整部署一个 AI 应用",
  },
];

/** Flat, ordered topic list — the queue the daily plan walks through. */

export const TOPICS: Topic[] = (() => {
  const list: Topic[] = [];
  for (const plan of STAGE_ONE_WEEKS) {
    const m: LearningModule = plan.modules[0];
    list.push({ id: m.id, title: `${m.title}`, stageId: "stage-1", week: plan.week, points: m.points, project: m.project });
  }
  for (const stage of STAGES.slice(1)) {
    const per = 3;
    for (let i = 0; i < stage.topics.length || i === 0; i += per) {
      const chunk = stage.topics.slice(i, i + per);
      if (!chunk.length) break;
      list.push({
        id: `${stage.id}-t${i / per + 1}`,
        title: chunk.join(" · "),
        stageId: stage.id,
        week: Math.ceil((i + 1) / per),
        points: chunk,
        project: i === 0 ? stage.project : undefined,
      });
    }
  }
  return list;
})();

export const topicById = (id: string) => TOPICS.find((t) => t.id === id);
export const stageById = (id: string) => STAGES.find((s) => s.id === id);
