import { CalendarDays, Clock, Coffee, Plus, RefreshCw, Sparkles, StickyNote, Wand2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { RecordDialog } from "../components/learning/RecordDialog";
import { MistakeDialog, type MistakeDraft } from "../components/mistake/MistakeDialog";
import { SECTION_TONE, TaskRow } from "../components/learning/TaskRow";
import { Bar, Card, Field, SectionTitle, Seg, cx } from "../components/ui";
import { useApp } from "../hooks/useApp";
import { sectionLabel } from "../services/taskGenerator";
import { topicById } from "../data/roadmap";
import type { Difficulty, Energy, TaskSection, Will } from "../types";
import { addDays, fmtCN, todayISO, weekdayOf } from "../utils/date";

const SECTIONS: TaskSection[] = ["review", "learn", "practice", "independent", "summary"];
const WEEKDAY_LABEL = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

export function StudyPlan({ onOpenNotes }: { onOpenNotes: (date: string) => void }) {
  const { data, planFor, ensurePlan, regeneratePlan, dayState, setDayState, toggleTask, editTaskTitle, editTaskMinutes, addTaskToPlan, removeTaskFromPlan, updateSettings } = useApp();
  const [date, setDate] = useState(todayISO());
  const [editing, setEditing] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftMinutes, setDraftMinutes] = useState(10);
  const [newSection, setNewSection] = useState<TaskSection>("practice");
  const [newTitle, setNewTitle] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [recordOpen, setRecordOpen] = useState(false);
  const [mistakeDraft, setMistakeDraft] = useState<Partial<MistakeDraft> | null>(null);

  useEffect(() => {
    ensurePlan(date);
  }, [date, ensurePlan]);

  const plan = planFor(date);
  const state = dayState(date);
  const weekday = weekdayOf(date);
  const minutes = state.minutes ?? data.settings.minutesByWeekday[String(weekday)] ?? data.settings.defaultMinutes;
  const isRest = data.settings.restDays.includes(weekday);
  const record = data.records[date];
  const [offset, setOffset] = useState(0);
  const days = Array.from({ length: 14 }, (_, i) => addDays(todayISO(), i - 3 + offset));
  const monthLabel = `${Number(days[0].slice(5, 7))} 月 – ${Number(days[13].slice(5, 7))} 月`;

  const setMinutes = (m: number) => updateSettings({ minutesByWeekday: { ...data.settings.minutesByWeekday, [String(weekday)]: m } });

  const regen = () => {
    const ok = regeneratePlan(date);
    setMsg(ok ? "已按今天的设置重新生成计划" : "这一天已有完成的任务或手动修改过的计划，不会被覆盖");
    setTimeout(() => setMsg(null), 4000);
  };

  return (
    <div className="fade-up grid grid-cols-1 gap-4 xl:grid-cols-12">
      <div className="space-y-4 xl:col-span-4">
        <Card>
          <SectionTitle
            icon={<CalendarDays size={15} />}
            title="选择日期"
            hint={monthLabel}
            action={
              <div className="flex gap-1">
                <button className="btn btn-ghost px-2 py-1 text-[11px]" onClick={() => setOffset(offset - 7)} aria-label="上一周">
                  ←
                </button>
                <button className="btn btn-ghost px-2 py-1 text-[11px]" onClick={() => setOffset(0)}>
                  今天
                </button>
                <button className="btn btn-ghost px-2 py-1 text-[11px]" onClick={() => setOffset(offset + 7)} aria-label="下一周">
                  →
                </button>
              </div>
            }
          />
          <div className="grid grid-cols-7 gap-1">
            {days.map((d) => {
              const on = d === date;
              const r = data.records[d];
              const rest = data.settings.restDays.includes(weekdayOf(d));
              return (
                <button
                  key={d}
                  aria-label={`选择日期 ${d}`}
                  onClick={() => setDate(d)}
                  className={cx(
                    "flex flex-col items-center rounded-lg py-1.5 text-[11px] transition-all",
                    on ? "bg-gradient-to-br from-[#8b7bff] to-[#5f8bff] text-white" : "bg-white/5 text-[var(--color-muted)] hover:bg-white/10",
                  )}
                >
                  <span className={cx("text-[9px]", on ? "text-white/80" : "text-[var(--color-dim)]")}>{WEEKDAY_LABEL[weekdayOf(d)]}</span>
                  <span className="stat-value font-medium">{Number(d.slice(8))}</span>
                  <span className={cx("mt-0.5 h-1 w-1 rounded-full", r ? "bg-[#57d9a3]" : rest ? "bg-white/25" : "bg-transparent")} />
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-[10px] text-[var(--color-dim)]">绿点 = 已有学习记录；灰点 = 休息日</p>
        </Card>

        <Card>
          <SectionTitle icon={<Sparkles size={15} />} title="那天的状态" hint="影响任务的数量、难度和时间分配" />
          <div className="space-y-3">
            <div>
              <p className="mb-1.5 text-xs text-[var(--color-muted)]">精力状态</p>
              <Seg<Energy>
                value={state.energy}
                onChange={(v) => setDayState(date, { energy: v })}
                options={[
                  { value: "high", label: "充沛" },
                  { value: "normal", label: "一般" },
                  { value: "tired", label: "疲惫" },
                ]}
              />
            </div>
            <div>
              <p className="mb-1.5 text-xs text-[var(--color-muted)]">学习意愿</p>
              <Seg<Will>
                value={state.will}
                onChange={(v) => setDayState(date, { will: v })}
                options={[
                  { value: "eager", label: "积极" },
                  { value: "normal", label: "正常" },
                  { value: "reluctant", label: "不太想学" },
                ]}
              />
            </div>
            <div>
              <p className="mb-1.5 text-xs text-[var(--color-muted)]">难度偏好</p>
              <Seg<Difficulty>
                value={state.difficulty}
                onChange={(v) => setDayState(date, { difficulty: v })}
                options={[
                  { value: "easy", label: "轻松" },
                  { value: "normal", label: "正常" },
                  { value: "challenge", label: "挑战" },
                ]}
              />
            </div>
            <Field label="当天备注">
              <input className="input" placeholder="例如：今天只有地铁上的 20 分钟" value={state.note} onChange={(e) => setDayState(date, { note: e.target.value })} />
            </Field>
            <div>
              <p className="mb-1.5 flex items-center justify-between text-xs text-[var(--color-muted)]">
                那天想学多久 <span className="text-[var(--color-dim)]">{WEEKDAY_LABEL[weekday]}默认 {minutes} 分钟</span>
              </p>
              <div className="seg flex-wrap">
                {[15, 30, 45, 60, 90].map((m) => (
                  <button key={m} type="button" data-on={minutes === m} onClick={() => setMinutes(m)}>
                    {m}′
                  </button>
                ))}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-[11px] text-[var(--color-muted)]">只改这一天</span>
                <input
                  type="number"
                  min={5}
                  max={180}
                  className="input w-20"
                  placeholder="分钟"
                  value={state.minutes ?? ""}
                  onChange={(e) => setDayState(date, { minutes: e.target.value ? Math.max(5, Math.min(180, Number(e.target.value))) : undefined })}
                />
                <span className="text-[10px] text-[var(--color-dim)]">留空则用每周默认值</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button className="btn btn-primary flex-1" onClick={regen}>
                <Wand2 size={14} /> 按这些设置生成
              </button>
              <button
                className="btn"
                onClick={() => {
                  const rest = data.settings.restDays.includes(weekday) ? data.settings.restDays.filter((d) => d !== weekday) : [...data.settings.restDays, weekday];
                  updateSettings({ restDays: rest });
                }}
              >
                <Coffee size={14} /> {isRest ? "取消休息日" : "设为休息日"}
              </button>
            </div>
            {msg && <p className="rounded-lg bg-white/6 px-2 py-1.5 text-[11px] text-[var(--color-muted)]">{msg}</p>}
          </div>
        </Card>
      </div>

      <div className="space-y-4 xl:col-span-8">
        <Card>
          <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-[15px] font-semibold">{plan?.topicTitle ?? "加载中"}</h2>
                <span className="chip">{fmtCN(date)}</span>
                {isRest && <span className="chip border-[#ffcf7a]/40 text-[#ffcf7a]">休息日</span>}
                {plan?.edited && <span className="chip">手动调整过</span>}
              </div>
              <p className="mt-1 flex items-center gap-1 text-[11px] text-[var(--color-dim)]">
                <Clock size={11} /> 预计 {plan?.totalMinutes ?? 0} 分钟 · {plan?.tasks.filter((t) => t.done).length ?? 0}/{plan?.tasks.length ?? 0} 已完成
                {record && <span className="ml-2 text-[var(--color-leaf)]">已记录 · 掌握情况见学习记录</span>}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="btn px-3 py-1.5 text-xs" onClick={() => onOpenNotes(date)}>
                <StickyNote size={13} /> {data.notes[date] ? "查看笔记" : date === todayISO() ? "今日重点笔记" : "当天重点笔记"}
              </button>
              <button className="btn btn-primary px-3 py-1.5 text-xs" onClick={() => setRecordOpen(true)}>
                {record ? "修改记录" : "结束这一天"}
              </button>
            </div>
          </div>

          {plan && plan.points.length > 0 && (
            <div className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border border-white/8 bg-white/5 px-3 py-2 text-[11px] text-[var(--color-muted)]">
              <span className="text-[var(--color-dim)]">{plan.previousPoints.length > 0 ? "上一节" : "已学"}</span>
              <span>
                {(plan.previousPoints.length
                  ? plan.previousPoints
                  : (topicById(plan.topicId)?.points ?? []).slice(0, data.progress.pointsDone[plan.topicId] ?? 0).filter((p) => !plan.points.includes(p))
                ).join("、") || "（这是这一主题的起点）"}
              </span>
              <span className="text-[var(--color-dim)]">→</span>
              <span className="text-[var(--color-accent)]">今天</span>
              <span className="text-white">{plan.points.join("、")}</span>
              <span className="ml-auto text-[var(--color-dim)]">
                主题进度 {(data.progress.pointsDone[plan.topicId] ?? 0)}/{topicById(plan.topicId)?.points.length ?? 1}
              </span>
            </div>
          )}

          {plan && plan.totalMinutes > 0 && (
            <div className="mb-3">
              <Bar
                value={plan.tasks.length ? (plan.tasks.filter((t) => t.done).length / plan.tasks.length) * 100 : 0}
                height={5}
              />
            </div>
          )}

          <div className="space-y-3">
            {SECTIONS.map((section) => {
              const tasks = plan?.tasks.filter((t) => t.section === section) ?? [];
              if (!tasks.length) return null;
              return (
                <div key={section}>
                  <p className="mb-1.5 flex items-center gap-1.5 text-[11px]" style={{ color: SECTION_TONE[section] }}>
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: SECTION_TONE[section] }} />
                    {sectionLabel(section)}
                    <span className="text-[var(--color-dim)]">· {tasks.reduce((s, t) => s + t.minutes, 0)} 分钟</span>
                  </p>
                  <div className="space-y-2">
                    {tasks.map((t) =>
                      editing === t.id ? (
                        <div key={t.id} className="glass-soft space-y-2 p-2.5">
                          <input className="input" value={draftTitle} onChange={(e) => setDraftTitle(e.target.value)} autoFocus />
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min={2}
                              max={120}
                              className="input w-20"
                              value={draftMinutes}
                              onChange={(e) => setDraftMinutes(Number(e.target.value))}
                            />
                            <span className="text-[11px] text-[var(--color-dim)]">分钟</span>
                            <div className="ml-auto flex gap-2">
                              <button
                                className="btn px-2.5 py-1 text-xs"
                                onClick={() => {
                                  if (draftTitle.trim()) editTaskTitle(date, t.id, draftTitle.trim());
                                  editTaskMinutes(date, t.id, draftMinutes);
                                  setEditing(null);
                                }}
                              >
                                保存
                              </button>
                              <button className="btn btn-ghost px-2 py-1" onClick={() => setEditing(null)} aria-label="取消编辑">
                                <X size={12} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <TaskRow
                          key={t.id}
                          task={t}
                          onNote={() => onOpenNotes(date)}
                          onMistake={
                            t.section === "practice" || t.section === "independent"
                              ? () =>
                                  setMistakeDraft({
                                    title: t.title,
                                    content: `${plan?.topicTitle ?? ""}
${t.title}`,
                                    points: (plan ? topicById(plan.topicId)?.points : []) ?? [],
                                    topicId: plan?.topicId ?? "",
                                    stageId: plan?.stageId ?? "stage-1",
                                    sourceTaskId: t.id,
                                    sourceTaskTitle: t.title,
                                    status: "unlearned",
                                  })
                              : undefined
                          }
                          editable
                          onToggle={() => toggleTask(date, t.id)}
                          onEdit={() => {
                            setEditing(t.id);
                            setDraftTitle(t.title);
                            setDraftMinutes(t.minutes);
                          }}
                          onRemove={() => removeTaskFromPlan(date, t.id)}
                        />
                      ),
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 border-t border-white/8 pt-3">
            <p className="mb-2 text-[11px] text-[var(--color-muted)]">加一个自己的任务</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <select className="input sm:w-32" value={newSection} onChange={(e) => setNewSection(e.target.value as TaskSection)}>
                {SECTIONS.map((s) => (
                  <option key={s} value={s} className="bg-[#12132e]">
                    {sectionLabel(s)}
                  </option>
                ))}
              </select>
              <input className="input flex-1" placeholder="例如：把 User 类改成用字典存储" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
              <button
                className="btn btn-primary px-3"
                onClick={() => {
                  if (!newTitle.trim()) return;
                  addTaskToPlan(date, newSection, newTitle.trim());
                  setNewTitle("");
                }}
              >
                <Plus size={14} /> 添加
              </button>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start gap-2 text-[11px] leading-relaxed text-[var(--color-muted)]">
            <RefreshCw size={13} className="mt-0.5 shrink-0 text-[var(--color-accent)]" />
            <p>
              计划不是日历自动翻页：只有你记录了「完全掌握 / 基本掌握」，知识点才会前进；「还需要复习」会保留当前知识点并在下一次多安排回顾；
              连续三次没掌握时，任务会被自动拆成更小的块。已经完成的任务和你手动改过的计划永远不会被重新生成覆盖。
            </p>
          </div>
        </Card>
      </div>

      <RecordDialog date={date} open={recordOpen} onClose={() => setRecordOpen(false)} />
      <MistakeDialog open={!!mistakeDraft} initial={mistakeDraft ?? undefined} onClose={() => setMistakeDraft(null)} />
    </div>
  );
}
