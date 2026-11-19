import { BookX, Check, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { MistakeDialog, type MistakeDraft } from "../components/mistake/MistakeDialog";
import { Card, Empty, SectionTitle, Seg, Stat, cx } from "../components/ui";
import { STAGES } from "../data/roadmap";
import { useApp } from "../hooks/useApp";
import { STATUS_LABEL, STATUS_TONE, mistakeMatches } from "../services/notes";
import type { ReviewStatus } from "../types";

export function Mistakes() {
  const { data, setMistakeStatus, deleteMistake } = useApp();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<ReviewStatus | "all">("all");
  const [stageId, setStageId] = useState("");
  const [dialog, setDialog] = useState<{ open: boolean; initial?: Partial<MistakeDraft> }>({ open: false });
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const all = data.wrongQuestions;
  const list = useMemo(() => all.filter((m) => mistakeMatches(m, query, status, stageId)), [all, query, status, stageId]);
  const counts = {
    unlearned: all.filter((m) => m.status === "unlearned").length,
    reviewing: all.filter((m) => m.status === "reviewing").length,
    mastered: all.filter((m) => m.status === "mastered").length,
  };

  return (
    <div className="fade-up space-y-4">
      <div className="grid grid-cols-3 gap-3 lg:grid-cols-3">
        <Stat label="未掌握" value={counts.unlearned} unit="题" sub="会优先进入每日复习" />
        <Stat label="复习中" value={counts.reviewing} unit="题" sub="正在反复练的题" />
        <Stat label="已掌握" value={counts.mastered} unit="题" sub="不再自动出现在计划里" />
      </div>

      <Card>
        <SectionTitle
          icon={<BookX size={15} />}
          title="错题本"
          hint="错过的题不会自己变好：状态只能由你手动改"
          action={
            <button className="btn btn-primary px-3 py-1.5 text-xs" onClick={() => setDialog({ open: true })}>
              <Plus size={13} /> 新增错题
            </button>
          }
        />

        <div className="mb-3 flex flex-col gap-2 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-dim)]" />
            <input className="input pl-8" placeholder="搜索题目、错误原因、知识点" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <Seg<ReviewStatus | "all">
            value={status}
            onChange={setStatus}
            options={[
              { value: "all", label: "全部" },
              { value: "unlearned", label: "未掌握" },
              { value: "reviewing", label: "复习中" },
              { value: "mastered", label: "已掌握" },
            ]}
          />
          <select className="input lg:w-40" value={stageId} onChange={(e) => setStageId(e.target.value)}>
            <option value="" className="bg-[#12132e]">
              全部阶段
            </option>
            {STAGES.map((s) => (
              <option key={s.id} value={s.id} className="bg-[#12132e]">
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {list.length === 0 ? (
          <Empty>{all.length === 0 ? "还没有错题。可以从学习计划里的任务点「加入错题本」，或在这里手动新增。" : "没有符合条件的错题。"}</Empty>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {list.map((m) => {
              const tone = STATUS_TONE[m.status];
              return (
                <article key={m.id} className="glass-soft flex flex-col p-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-[13px] font-semibold leading-snug">{m.title}</h3>
                    <span className="shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-medium" style={{ background: tone, color: "#0a0b1e" }}>
                      {STATUS_LABEL[m.status]}
                    </span>
                  </div>
                  {m.content && <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-[var(--color-muted)]">{m.content}</p>}
                  {m.reason && (
                    <p className="mt-2 rounded-lg border-l-2 border-[#ff8f8f]/60 bg-[#ff8f8f]/8 px-2 py-1.5 text-[11px] leading-relaxed text-[#ffc9c9]">
                      错因：{m.reason}
                    </p>
                  )}
                  {(m.myAnswer || m.correctAnswer) && (
                    <div className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                      {m.myAnswer && (
                        <p className="rounded-lg bg-white/5 px-2 py-1.5 text-[10px] leading-relaxed text-[var(--color-muted)]">
                          <span className="text-[#ff9a9a]">我的答案 </span>
                          {m.myAnswer}
                        </p>
                      )}
                      {m.correctAnswer && (
                        <p className="rounded-lg bg-[var(--color-leaf)]/10 px-2 py-1.5 text-[10px] leading-relaxed text-[#c6f5df]">
                          <span className="text-[var(--color-leaf)]">正确答案 </span>
                          {m.correctAnswer}
                        </p>
                      )}
                    </div>
                  )}
                  {m.points.filter(Boolean).length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {m.points.filter(Boolean).map((p) => (
                        <span key={p} className="rounded bg-white/9 px-1.5 py-0.5 text-[10px] text-[#c9c8e4]">
                          {p}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-auto pt-2">
                    <p className="text-[10px] text-[var(--color-muted)]">
                      {m.createdAt.slice(0, 10)}
                      {m.sourceTaskTitle && <span className="truncate"> · 来自「{m.sourceTaskTitle}」</span>}
                      {m.reviewCount > 0 && <span> · 复习 {m.reviewCount} 次</span>}
                    </p>
                    <div className="mt-2 flex items-center gap-1">
                      {(Object.keys(STATUS_LABEL) as ReviewStatus[]).map((s) => (
                        <button
                          key={s}
                          onClick={() => setMistakeStatus(m.id, s)}
                          className={cx(
                            "rounded-md border px-1.5 py-1 text-[10px] transition-colors",
                            m.status === s ? "border-white/30 bg-white/12 text-white" : "border-white/10 text-[var(--color-dim)] hover:text-white",
                          )}
                        >
                          {m.status === s && <Check size={9} className="mr-0.5 inline" />}
                          {STATUS_LABEL[s]}
                        </button>
                      ))}
                      <span className="ml-auto flex gap-1">
                        <button
                          onClick={() =>
                            setDialog({
                              open: true,
                              initial: { ...m, points: m.points },
                            })
                          }
                          aria-label={`编辑错题：${m.title}`}
                          className="rounded p-1 text-[var(--color-dim)] hover:text-white"
                        >
                          <Pencil size={12} />
                        </button>
                        <button onClick={() => setConfirmDelete(m.id)} aria-label={`删除错题：${m.title}`} className="rounded p-1 text-[var(--color-dim)] hover:text-[#ff8f8f]">
                          <Trash2 size={12} />
                        </button>
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </Card>

      <MistakeDialog open={dialog.open} initial={dialog.initial} onClose={() => setDialog({ open: false })} />

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#05061a]/75 p-4 backdrop-blur-sm" onClick={() => setConfirmDelete(null)}>
          <div className="glass pop-in w-full max-w-sm p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-semibold">删除这道错题？</h3>
            <p className="mt-1 text-xs text-[var(--color-dim)]">删除后不会再出现在复习计划里。</p>
            <div className="mt-4 flex justify-end gap-2">
              <button className="btn btn-ghost" onClick={() => setConfirmDelete(null)}>
                取消
              </button>
              <button
                className="btn"
                onClick={() => {
                  deleteMistake(confirmDelete);
                  setConfirmDelete(null);
                }}
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
