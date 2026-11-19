import { BookOpen, BookX, CalendarDays, ChartLine, Flower2, LayoutDashboard, Route, Settings, Sprout, StickyNote, type LucideIcon } from "lucide-react";

export type PageId = "dashboard" | "roadmap" | "plan" | "records" | "notes" | "mistakes" | "gallery" | "journey" | "journal" | "settings";

export interface NavItem {
  id: PageId;
  label: string;
  short: string;
  icon: LucideIcon;
  title: string;
  hint: string;
}

export const NAV: NavItem[] = [
  { id: "dashboard", label: "首页", short: "首页", icon: LayoutDashboard, title: "今日成长", hint: "今天要学什么，一眼就知道" },
  { id: "roadmap", label: "学习路线", short: "路线", icon: Route, title: "学习路线", hint: "六个阶段，从脚本到工程" },
  { id: "plan", label: "学习计划", short: "计划", icon: CalendarDays, title: "学习计划", hint: "按状态动态生成，可随时改" },
  { id: "records", label: "学习记录", short: "记录", icon: ChartLine, title: "学习记录", hint: "真实记录的统计，不凑数" },
  { id: "notes", label: "学习笔记", short: "笔记", icon: StickyNote, title: "学习笔记", hint: "每天的重点、困惑和理解，自动按日期归档" },
  { id: "mistakes", label: "错题本", short: "错题", icon: BookX, title: "错题本", hint: "错过的题，会自己找上门来复习" },
  { id: "gallery", label: "植物图鉴", short: "图鉴", icon: Flower2, title: "植物图鉴", hint: "八种植物，选一株陪你走" },
  { id: "journey", label: "成长历程", short: "历程", icon: Sprout, title: "成长历程", hint: "每一次浇水都被记下来" },
  { id: "journal", label: "成长日记", short: "日记", icon: BookOpen, title: "成长日记", hint: "写给以后的自己" },
  { id: "settings", label: "设置", short: "设置", icon: Settings, title: "设置", hint: "时间、状态与数据" },
];
