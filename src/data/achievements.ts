import type { Achievement } from "../types";

export const ACHIEVEMENTS: Achievement[] = [
  { id: "first-seed", name: "第一颗种子", description: "第一次完成学习打卡。", icon: "Sprout", condition: "完成 1 次每日学习记录" },
  { id: "first-module", name: "初次发芽", description: "完成第一个知识模块。", icon: "Leaf", condition: "掌握第 1 个知识模块" },
  { id: "water-7", name: "坚持浇水", description: "累计学习打卡 7 次。", icon: "Droplets", condition: "累计 7 天学习记录" },
  { id: "first-project", name: "独立生长", description: "完成第一个实践项目。", icon: "Hammer", condition: "完成任意一个周实践项目" },
  { id: "stage-1", name: "根系扎稳", description: "完成第一阶段全部模块。", icon: "TreePine", condition: "完成「Python 工程能力」阶段" },
  { id: "all-stages", name: "初次绽放", description: "完成全部六个学习阶段。", icon: "Flower2", condition: "完成六个阶段" },
  { id: "fruit", name: "花开有果", description: "走完整条学习路线。", icon: "Trophy", condition: "完成最终学习路线" },
  { id: "journal", name: "记录者", description: "写下第一篇成长日记。", icon: "NotebookPen", condition: "创建 1 篇成长日记" },
];
