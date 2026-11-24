import { ArrowRight, CalendarCheck2, CheckCircle2, ChevronRight, Compass, Flame, Sparkles, StickyNote, Target } from "lucide-react";
import { useMemo, useState } from "react";
import { RecordDialog } from "../components/learning/RecordDialog";
import { TaskRow } from "../components/learning/TaskRow";
import { MyPlantCard } from "../components/plant/MyPlantCard";
import { Bar, Card, Ring, SectionTitle, Stat, cx } from "../components/ui";
import { STAGES, TOPICS } from "../data/roadmap";
import { useApp } from "../hooks/useApp";
import { dailyLine } from "../services/encouragementService";
import { currentStage, currentTopic, overallProgress, recordsList, stageProgressOf, stats } from "../services/progressCalculator";
import { fmtCN, todayISO } from "../utils/date";
import type { PageId } from "../components/layout/nav";

export function Dashboard({ onNavigate }: { onNavigate: (p: PageId, date?: string) => void }) {
  const { data, todayPlan, toggleTask } = useApp();
  const [recordOpen, setRecordOpen] = useState(false);
  const today = todayISO();
  const plan = todayPlan();
  const stage = currentStage(data);
  const topic = currentTopic(data);
  const overall = overallProgress(data);
  const sp = stageProgressOf(data, stage);
  const s = stats(data);
  const done = plan.tasks.filter((t) => t.done).length;
  const pct = plan.tasks.length ? Math.round((done / plan.tasks.length) * 100) : 0;
  const record = data.records[today];
  const covered = data.progress.pointsDone[topic.id] ?? 0;
  const lastRecord = recordsList(data).filter((r) => r.date < today).at(-1);

  const upcoming = useMemo(() => {
    const idx = TOPICS.findIndex((t) => t.id === topic.id);
    return TOPICS.slice(idx + 1, idx + 4);
  }, [topic.id]);

  const scene = record ? (record.mastery === "full" ? "module_done" : record.mastery === "basic" ? "task_done" : "struggle") : s.streak >= 3 ? "streak" : "task_done";

  return (
    <div className="fade-up grid grid-cols-1 gap-4 xl:grid-cols-12">
      {/* hero */}
      <Card className="relative overflow-hidden xl:col-span-7" glow>
        <div className="pointer-events-none absolute -left-16 -top-20 h-56 w-56 rounded-full bg-[#5f8bff]/25 blur-3xl" />
        <div className="relative">
          <div className="flex flex-wrap items-center gap-2">
            <span className="chip border-[var(--color-accent)]/40 text-[#c9c1ff]">
              <Compass size={12} /> 第 {stage.index} 阶段 · {stage.name}
            </span>
            <span className="chip">
              <Target size={12} /> 第 {topic.week} 周
            </span>
            {stage.index === 1 && <span className="chip">第 1 阶段共 8 周</span>}
          </div>

          <p className="mt-4 text-[11px] tracking-[0.18em] text-[var(--color-dim)]">今日主题</p>
          <h2 className="mt-1 text-balance text-[22px] font-semibold leading-tight lg:text-[26px]">{plan.topicTitle}</h2>
          <p className="mt-1.5 text-xs text-[var(--color-muted)]">{fmtCN(today)} · 预计 {plan.totalMinutes} 分钟 · {plan.tasks.length} 个任务</p>

          <div className="mt-4">
            <div className="mb-1.5 flex items-center justify-between text-[11px]">
              <span className="text-[var(--color-muted)]">今日进度</span>
              <span className="stat-value text-[var(--color-dim)]">
                {done}/{plan.tasks.length} 项 · {pct}%
              </span>
            </div>
            <Bar value={pct} />
          </div>

          <div className="mt-4">
            <p className="mb-1.5 flex flex-wrap items-center gap-2 text-[11px] text-[var(--color-muted)]">
              本周知识点
              <span className="stat-value text-[var(--color-dim)]">
                已学 {covered}/{topic.points.length}
              </span>
              <span className="ml-auto flex items-center gap-2 text-[10px] text-[var(--color-dim)]">
                <span className="text-[var(--color-accent)]">▸ 今天</span>
                <span className="text-[var(--color-leaf)]">✓ 已学</span>
                <span>待学</span>
              </span>
            </p>
            <div className="flex flex-wrap gap-1.5">
              {topic.points.map((pt, i) => {
                const isToday = plan.points.includes(pt);
                const learned = i < covered;
                return (
                  <span
                    key={pt}
                    className={cx(
                      "rounded-lg border px-2 py-1 text-[11px]",
                      isToday
                        ? "border-[var(--color-accent)]/70 bg-[var(--color-accent)]/20 font-medium text-white"
                        : learned
                          ? "border-[var(--color-leaf)]/40 bg-[var(--color-leaf)]/10 text-[var(--color-leaf)]"
                          : "border-white/8 bg-white/4 text-[var(--color-dim)]",
                    )}
                  >
                    {isToday ? "▸ " : learned ? "✓ " : ""}
                    {pt}
                  </span>
                );
              })}
            </div>
            {plan.previousPoints.length > 0 && (
              <p className="mt-2 text-[11px] text-[var(--color-dim)]">
                接着昨天：上一节学了 {plan.previousPoints.join("、")}
                {plan.points.length > 0 && <> → 今天继续 {plan.points[0]}</>}
              </p>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button className="btn btn-primary" onClick={() => onNavigate("plan")}>
              {done ? "继续今天的学习" : "开始今天的学习"} <ArrowRight size={14} />
            </button>
            <button className="btn" onClick={() => setRecordOpen(true)}>
              <CalendarCheck2 size={14} /> {record ? "查看 / 修改今日记录" : "结束今天的学习"}
            </button>
            <button className="btn" onClick={() => onNavigate("notes", today)}>
              <StickyNote size={14} /> {data.notes[today] ? "查看今日笔记" : "今日重点笔记"}
            </button>
            {record && (
              <span className="chip border-[var(--color-leaf)]/40 text-[var(--color-leaf)]">
                <CheckCircle2 size={12} /> 今天已记录
              </span>
            )}
          </div>

          {lastRecord && (
            <p className="mt-3 text-[11px] text-[var(--color-dim)]">
              昨天：{lastRecord.completedTasks}/{lastRecord.totalTasks} 项 ·{" "}
              {{ full: "完全掌握", basic: "基本掌握", review: "还需要复习", none: "没有完成" }[lastRecord.mastery]}
              {lastRecord.mastery === "review" && " · 今天已为你安排了回看任务"}
            </p>
          )}
        </div>
      </Card>

      {/* plant */}
      <div className="xl:col-span-5">
        <MyPlantCard onOpen={() => onNavigate("journey")} />
      </div>

      {/* tasks */}
      <Card className="xl:col-span-7">
        <SectionTitle
          icon={<Target size={15} />}
          title="今天的任务"
          hint="知识回顾 → 新知识 → 练习 → 独立实践 → 总结"
          action={
            <button className="btn btn-ghost whitespace-nowrap px-2 py-1 text-[11px]" onClick={() => onNavigate("plan")}>
              打开计划 <ChevronRight size={12} />
            </button>
          }
        />
        <div className="space-y-2">
          {plan.tasks.map((t) => (
            <TaskRow key={t.id} task={t} onToggle={() => toggleTask(today, t.id)} />
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between text-[11px] text-[var(--color-dim)]">
          <span>完成 {Math.min(done, plan.tasks.length)} 项后记得结束学习，植物才会浇水</span>
          <button className="btn btn-primary px-3 py-1.5 text-xs" onClick={() => setRecordOpen(true)}>
            {record ? "更新记录" : "完成学习"}
          </button>
        </div>
      </Card>

      {/* stats + direction */}
      <div className="xl:col-span-5 space-y-4">
        <Card>
          <SectionTitle icon={<Flame size={15} />} title="学习统计" />
          <div className="flex items-center gap-4">
            <Ring value={overall.pct} size={78} label="总进度" />
            <div className="grid flex-1 grid-cols-2 gap-2">
              <Stat label="当前阶段" value={`${sp.pct}%`} sub={`${sp.done}/${sp.total} 模块`} />
              <Stat label="累计学习" value={s.studyDays} unit="天" sub={`${s.minutes} 分钟`} />
              <Stat label="完成任务" value={s.tasks} sub={`前置掌握 ${s.modules} 个模块`} />
              <Stat label="连续学习" value={s.streak} unit="天" sub={s.streak >= 3 ? "保持住这个节奏" : "从今天开始"} />
            </div>
          </div>
          <div className="mt-3">
            <Bar value={sp.pct} tone="leaf" height={4} />
            <p className="mt-1.5 text-[10px] text-[var(--color-dim)]">
              当前阶段：{stage.name}（{sp.done}/{sp.total} · 预计 {stage.weeks} 周）
            </p>
          </div>
        </Card>

        <Card>
          <SectionTitle icon={<Compass size={15} />} title="接下来的方向" hint="按学习路线自动排" />
          {upcoming.length === 0 ? (
            <p className="text-xs text-[var(--color-dim)]">已经是最后一个模块了。</p>
          ) : (
            <ol className="space-y-2">
              {upcoming.map((t, i) => (
                <li key={t.id} className="glass-soft flex items-center gap-2 px-3 py-2">
                  <span className="stat-value text-[10px] text-[var(--color-dim)]">0{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px]">{t.title}</p>
                    <p className="truncate text-[10px] text-[var(--color-dim)]">
                      {STAGES.find((x) => x.id === t.stageId)?.name} · 第 {t.week} 周
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>

      {/* encouragement */}
      <div className="xl:col-span-12">
        <div className="glass flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-start gap-2 text-sm text-[var(--color-ink)]/90">
            <Sparkles size={15} className="mt-0.5 shrink-0 text-[var(--color-leaf)]" />
            {dailyLine(scene, today)}
          </p>
          <button className="btn btn-ghost shrink-0 px-3 py-1.5 text-[11px]" onClick={() => onNavigate("journal")}>
            写今天的成长日记 <ChevronRight size={12} />
          </button>
        </div>
      </div>

      <RecordDialog date={today} open={recordOpen} onClose={() => setRecordOpen(false)} />
    </div>
  );
}
