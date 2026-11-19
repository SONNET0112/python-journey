import { ChartLine, Clock, NotebookText, TrendingUp } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, Empty, SectionTitle, Stat } from "../components/ui";
import { useApp } from "../hooks/useApp";
import { recordsList, stats, trendSeries } from "../services/progressCalculator";
import { fmtCN } from "../utils/date";
import type { Mastery } from "../types";

const MASTERY: Record<Mastery, { label: string; tone: string }> = {
  full: { label: "完全掌握", tone: "#57d9a3" },
  basic: { label: "基本掌握", tone: "#8b7bff" },
  review: { label: "还需要复习", tone: "#ffb56b" },
  none: { label: "没有完成", tone: "#8e8fb5" },
};

export function StudyRecords() {
  const { data } = useApp();
  const s = stats(data);
  const records = recordsList(data).reverse();
  const series = trendSeries(data, 14);

  return (
    <div className="fade-up space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="累计学习天数" value={s.studyDays} unit="天" sub={`连续 ${s.streak} 天`} />
        <Stat label="累计学习时长" value={s.minutes} unit="分钟" sub={`近 7 天 ${s.weekMinutes} 分钟`} />
        <Stat label="累计完成任务" value={s.tasks} unit="个" sub={`平均每周完成率 ${s.weekRate}%`} />
        <Stat label="已掌握模块" value={s.modules} unit="个" sub={`完成项目 ${s.projects} 个 · 阶段 ${s.stages}/6`} />
      </div>

      <Card>
        <SectionTitle icon={<TrendingUp size={15} />} title="最近 14 天" hint="真实的每日记录，没有记录的日期就是 0" />
        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series} margin={{ top: 6, right: 6, left: -22, bottom: 0 }}>
              <defs>
                <linearGradient id="minGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b7bff" stopOpacity={0.55} />
                  <stop offset="100%" stopColor="#8b7bff" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.07)" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: "#8e8fb5", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#8e8fb5", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "rgba(14,15,40,0.94)", border: "1px solid rgba(255,255,255,0.14)", borderRadius: 12, fontSize: 12 }}
                labelStyle={{ color: "#a6a5c9" }}
              />
              <Area type="linear" dataKey="分钟" stroke="#b3a6ff" strokeWidth={2} fill="url(#minGrad)" isAnimationActive={false} dot={{ r: 2.5, fill: "#c9c1ff", strokeWidth: 0 }} activeDot={{ r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card>
        <SectionTitle icon={<NotebookText size={15} />} title="学习记录" hint={`共 ${records.length} 条`} />
        {records.length === 0 ? (
          <Empty>还没有学习记录。去首页完成今天的学习，第一条记录会出现在这里。</Empty>
        ) : (
          <div className="-mx-1 overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-left">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-[var(--color-dim)]">
                  <th className="px-2 py-2 font-normal">日期</th>
                  <th className="px-2 py-2 font-normal">任务</th>
                  <th className="px-2 py-2 font-normal">时长</th>
                  <th className="px-2 py-2 font-normal">掌握情况</th>
                  <th className="px-2 py-2 font-normal">总结</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => {
                  const m = MASTERY[r.mastery];
                  return (
                    <tr key={r.date} className="border-t border-white/8 text-[12px]">
                      <td className="whitespace-nowrap px-2 py-2.5 text-[var(--color-muted)]">{fmtCN(r.date)}</td>
                      <td className="stat-value px-2 py-2.5">
                        {r.completedTasks}/{r.totalTasks}
                      </td>
                      <td className="stat-value whitespace-nowrap px-2 py-2.5">
                        <span className="inline-flex items-center gap-1">
                          <Clock size={11} className="text-[var(--color-dim)]" /> {r.minutes}′
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-2 py-2.5">
                        <span className="rounded-md px-1.5 py-0.5 text-[11px]" style={{ background: `${m.tone}22`, color: m.tone }}>
                          {m.label}
                        </span>
                      </td>
                      <td className="max-w-[260px] px-2 py-2.5 text-[11px] text-[var(--color-muted)]">
                        <span className="line-clamp-2">{r.summary || "—"}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <p className="flex items-center gap-1.5 px-1 text-[10px] text-[var(--color-dim)]">
        <ChartLine size={11} /> 所有数字来自本机 localStorage 中的学习记录，导出后可在设置里查看原始 JSON。
      </p>
    </div>
  );
}
