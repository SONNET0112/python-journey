import { BookOpen, Pencil, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { Card, Empty, Field, SectionTitle } from "../components/ui";
import { useApp } from "../hooks/useApp";
import type { GrowthJournal } from "../types";
import { fmtCN, todayISO } from "../utils/date";

const BLANK = { date: todayISO(), learned: "", solved: "", proud: "", confused: "", message: "" };

export function Journal() {
  const { data, addJournal, updateJournal, deleteJournal } = useApp();
  const [draft, setDraft] = useState<typeof BLANK | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const openNew = () => {
    setDraft({ ...BLANK, date: todayISO() });
    setEditingId(null);
  };

  const openEdit = (j: GrowthJournal) => {
    setDraft({ date: j.date, learned: j.learned, solved: j.solved, proud: j.proud, confused: j.confused, message: j.message });
    setEditingId(j.id);
  };

  const save = () => {
    if (!draft) return;
    if (editingId) updateJournal(editingId, draft);
    else addJournal(draft);
    setDraft(null);
    setEditingId(null);
  };

  const entries = [...data.journal].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="fade-up space-y-4">
      <Card>
        <SectionTitle
          icon={<BookOpen size={15} />}
          title="成长日记"
          hint="不用写得好，写下来就已经在整理了"
          action={
            <button className="btn btn-primary px-3 py-1.5 text-xs" onClick={openNew}>
              <Plus size={13} /> 写一篇
            </button>
          }
        />

        {data.records[todayISO()] && (
          <div className="glass-soft mb-3 flex flex-wrap items-center gap-2 px-3 py-2 text-[11px] text-[var(--color-muted)]">
            <span className="text-[var(--color-leaf)]">今天已有学习记录</span>
            <span>
              {data.records[todayISO()].completedTasks}/{data.records[todayISO()].totalTasks} 项 · {data.records[todayISO()].minutes} 分钟 ·{" "}
              {{ full: "完全掌握", basic: "基本掌握", review: "还需要复习", none: "没有完成" }[data.records[todayISO()].mastery]}
            </span>
            <span className="truncate text-[var(--color-dim)]">{data.records[todayISO()].summary}</span>
          </div>
        )}

        {entries.length === 0 ? (
          <Empty>还没有日记。今天学了什么，用三句话记下来试试。</Empty>
        ) : (
          <div className="space-y-3">
            {entries.map((j) => (
              <article key={j.id} className="glass-soft px-4 py-3">
                <div className="mb-1.5 flex items-center justify-between">
                  <p className="text-[12px] text-[var(--color-muted)]">{fmtCN(j.date)}</p>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(j)} aria-label="编辑日记" className="rounded p-1 text-[var(--color-dim)] hover:text-white">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => setConfirmDelete(j.id)} aria-label="删除日记" className="rounded p-1 text-[var(--color-dim)] hover:text-[#ff8f8f]">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                <dl className="grid grid-cols-1 gap-1.5 text-[12px] sm:grid-cols-2">
                  {[
                    ["今天学到了", j.learned],
                    ["解决的问题", j.solved],
                    ["最有成就感", j.proud],
                    ["还不理解", j.confused],
                  ]
                    .filter(([, v]) => v.trim())
                    .map(([k, v]) => (
                      <div key={k}>
                        <dt className="text-[10px] text-[var(--color-dim)]">{k}</dt>
                        <dd className="leading-relaxed text-[var(--color-ink)]/90">{v}</dd>
                      </div>
                    ))}
                </dl>
                {j.message.trim() && (
                  <p className="mt-2 border-l-2 border-[var(--color-accent)] pl-2.5 text-[12px] italic leading-relaxed text-[var(--color-muted)]">「{j.message}」</p>
                )}
              </article>
            ))}
          </div>
        )}
      </Card>

      {draft && (
        <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-[#05061a]/75 p-3 backdrop-blur-sm sm:items-center" onClick={() => setDraft(null)}>
          <div className="glass pop-in my-auto w-full max-w-xl p-5" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold">{editingId ? "修改日记" : "今天的成长日记"}</h3>
              <button onClick={() => setDraft(null)} className="btn btn-ghost px-2 py-1" aria-label="关闭日记编辑">
                <X size={14} />
              </button>
            </div>
            <div className="space-y-3">
              <Field label="日期">
                <input type="date" className="input" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} />
              </Field>
              <Field label="今天学到了什么？">
                <textarea className="input min-h-[64px] resize-none" value={draft.learned} onChange={(e) => setDraft({ ...draft, learned: e.target.value })} />
              </Field>
              <Field label="今天解决了什么问题？">
                <textarea className="input min-h-[52px] resize-none" value={draft.solved} onChange={(e) => setDraft({ ...draft, solved: e.target.value })} />
              </Field>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="最有成就感的事">
                  <textarea className="input min-h-[52px] resize-none" value={draft.proud} onChange={(e) => setDraft({ ...draft, proud: e.target.value })} />
                </Field>
                <Field label="还有什么不理解">
                  <textarea className="input min-h-[52px] resize-none" value={draft.confused} onChange={(e) => setDraft({ ...draft, confused: e.target.value })} />
                </Field>
              </div>
              <Field label="想对未来的自己说什么？">
                <textarea className="input min-h-[52px] resize-none" value={draft.message} onChange={(e) => setDraft({ ...draft, message: e.target.value })} />
              </Field>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button className="btn btn-ghost" onClick={() => setDraft(null)}>
                取消
              </button>
              <button className="btn btn-primary" onClick={save}>
                {editingId ? "保存修改" : "保存日记"}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#05061a]/75 p-4 backdrop-blur-sm" onClick={() => setConfirmDelete(null)}>
          <div className="glass pop-in w-full max-w-sm p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-semibold">删除这篇日记？</h3>
            <p className="mt-1 text-xs text-[var(--color-dim)]">删除后无法恢复。</p>
            <div className="mt-4 flex justify-end gap-2">
              <button className="btn btn-ghost" onClick={() => setConfirmDelete(null)}>
                取消
              </button>
              <button
                className="btn"
                onClick={() => {
                  deleteJournal(confirmDelete);
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
