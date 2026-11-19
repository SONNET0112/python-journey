import { CalendarDays, ChevronLeft, ChevronRight, Save, Search, StickyNote, Tag, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Card, Field, SectionTitle, cx } from "../components/ui";
import { STAGES } from "../data/roadmap";
import { useApp } from "../hooks/useApp";
import { NOTE_FIELDS, noteHasContent, noteMatches, tagsForTopic } from "../services/notes";
import { topicById } from "../data/roadmap";
import type { DailyNote } from "../types";
import { addDays, fmtCN, toISO, weekStart } from "../utils/date";

const WD = ["一", "二", "三", "四", "五", "六", "日"];

export function Notes({ initialDate }: { initialDate?: string }) {
  const { data, noteFor, saveNote, deleteNote } = useApp();
  const [date, setDate] = useState(initialDate ?? toISO(new Date()));
  const [month, setMonth] = useState(() => weekStart(`${(initialDate ?? toISO(new Date())).slice(0, 7)}-01`));
  const [query, setQuery] = useState("");
  const [stageId, setStageId] = useState("");
  // bumped on delete so the editor remounts with an empty draft
  const [resetKey, setResetKey] = useState(0);

  const cells = Array.from({ length: 42 }, (_, i) => addDays(month, i));
  const marked = (d: string) => noteHasContent(data.notes[d]);
  const results = useMemo(
    () =>
      Object.values(data.notes)
        .filter((n) => noteHasContent(n) && noteMatches(n, query, stageId))
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 12),
    [data.notes, query, stageId],
  );

  const monthTitle = `${cells[7].slice(0, 4)} 年 ${Number(cells[7].slice(5, 7))} 月`;

  return (
    <div className="fade-up grid grid-cols-1 gap-4 xl:grid-cols-12">
      <div className="space-y-4 xl:col-span-4">
        <Card>
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays size={15} className="text-[var(--color-accent)]" />
              <p className="text-[13px] font-medium">{monthTitle}</p>
            </div>
            <div className="flex gap-1">
              <button className="btn btn-ghost px-2 py-1" aria-label="上个月" onClick={() => setMonth(addDays(month, -28))}>
                <ChevronLeft size={13} />
              </button>
              <button
                className="btn btn-ghost px-2 py-1 text-[11px]"
                onClick={() => {
                  const t = toISO(new Date());
                  setDate(t);
                  setMonth(weekStart(`${t.slice(0, 7)}-01`));
                }}
              >
                今天
              </button>
              <button className="btn btn-ghost px-2 py-1" aria-label="下个月" onClick={() => setMonth(addDays(month, 28))}>
                <ChevronRight size={13} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-[var(--color-dim)]">
            {WD.map((w) => (
              <span key={w}>{w}</span>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {cells.map((d) => {
              const inMonth = d.slice(5, 7) === cells[7].slice(5, 7);
              const on = d === date;
              return (
                <button
                  key={d}
                  aria-label={`选择日期 ${d}`}
                  onClick={() => setDate(d)}
                  className={cx(
                    "relative flex h-8 items-center justify-center rounded-lg text-[11px] transition-colors",
                    on ? "bg-gradient-to-br from-[#8b7bff] to-[#5f8bff] text-white" : inMonth ? "bg-white/5 text-[var(--color-muted)] hover:bg-white/10" : "text-[var(--color-dim)]/45 hover:bg-white/5",
                  )}
                >
                  {Number(d.slice(8))}
                  {marked(d) && <span className={cx("absolute bottom-1 h-1 w-1 rounded-full", on ? "bg-white" : "bg-[var(--color-leaf)]")} />}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-[10px] text-[var(--color-dim)]">绿点表示这一天有笔记</p>
        </Card>

        <Card>
          <SectionTitle icon={<Search size={15} />} title="查找笔记" hint="按知识点、日期或正文内容搜索" />
          <div className="space-y-2">
            <input className="input" placeholder="例如：self / 异常处理 / 2026-11" value={query} onChange={(e) => setQuery(e.target.value)} />
            <select className="input" value={stageId} onChange={(e) => setStageId(e.target.value)}>
              <option value="" className="bg-[#12132e]">
                全部阶段
              </option>
              {STAGES.map((s) => (
                <option key={s.id} value={s.id} className="bg-[#12132e]">
                  第 {s.index} 阶段 · {s.name}
                </option>
              ))}
            </select>
            <div className="max-h-[260px] space-y-1.5 overflow-y-auto pr-1">
              {results.length === 0 ? (
                <p className="px-1 py-2 text-[11px] text-[var(--color-dim)]">没有匹配的笔记</p>
              ) : (
                results.map((n) => (
                  <button
                    key={n.date}
                    onClick={() => {
                      setDate(n.date);
                      setMonth(weekStart(`${n.date.slice(0, 7)}-01`));
                    }}
                    className={cx("glass-soft block w-full px-2.5 py-2 text-left transition-colors hover:bg-white/9", n.date === date && "border-[var(--color-accent)]/50")}
                  >
                    <p className="text-[11px] text-[var(--color-muted)]">{fmtCN(n.date)}</p>
                    <p className="truncate text-[12px]">{n.keyPoint || n.understanding || n.topicTitle}</p>
                    <p className="truncate text-[10px] text-[var(--color-dim)]">{n.tags.map((t) => t.label).slice(0, 3).join(" · ") || n.topicTitle}</p>
                  </button>
                ))
              )}
            </div>
          </div>
        </Card>
      </div>

      <div className="xl:col-span-8">
        <NoteEditor
          key={`${date}-${resetKey}`}
          date={date}
          note={noteFor(date)}
          onSave={(patch) => saveNote(date, patch)}
          onDelete={() => {
            deleteNote(date);
            setResetKey((k) => k + 1);
          }}
          hasNote={noteHasContent(data.notes[date])}
        />
      </div>
    </div>
  );
}

function NoteEditor({
  date,
  note,
  onSave,
  onDelete,
  hasNote,
}: {
  date: string;
  note: DailyNote;
  onSave: (patch: Partial<DailyNote>) => void;
  onDelete: () => void;
  hasNote: boolean;
}) {
  const [draft, setDraft] = useState(note);
  const [dirty, setDirty] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const timer = useRef<number | null>(null);
  const topic = topicById(note.topicId);

  // reset when a different date is opened — each date keeps its own text
  useEffect(() => {
    setDraft(note);
    setDirty(false);
    setSavedAt(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  useEffect(() => {
    if (!dirty) return;
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      onSave(draft);
      setDirty(false);
      setSavedAt(new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }));
    }, 700);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, dirty, date]);

  const edit = (patch: Partial<DailyNote>) => {
    setDraft((d) => ({ ...d, ...patch }));
    setDirty(true);
  };

  const availableTags = topic ? tagsForTopic(topic) : [];
  const toggleTag = (label: string) => {
    const on = draft.tags.some((t) => t.label === label);
    const base = availableTags.find((t) => t.label === label);
    if (!base) return;
    edit({ tags: on ? draft.tags.filter((t) => t.label !== label) : [...draft.tags, base] });
  };

  return (
    <Card>
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-[15px] font-semibold">{fmtCN(date)}</h2>
            <span className="chip">第 {STAGES.find((s) => s.id === draft.stageId)?.index ?? 1} 阶段</span>
            <span className="chip">第 {draft.week} 周</span>
            {hasNote && <span className="chip border-[var(--color-leaf)]/40 text-[var(--color-leaf)]">已有笔记</span>}
          </div>
          <p className="mt-1 text-[11px] text-[var(--color-muted)]">
            知识模块：{draft.topicTitle}
            {draft.taskId && <span className="text-[var(--color-dim)]"> · 已关联当天学习任务</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-[10px] text-[var(--color-dim)]">
            <Save size={11} /> {dirty ? "正在保存…" : savedAt ? `已保存 ${savedAt}` : "改动会自动保存"}
          </span>
          {hasNote && (
            <button className="btn btn-ghost px-2 py-1 text-[11px] hover:border-[#ff8f8f]/40 hover:text-[#ff9a9a]" onClick={() => setConfirmDelete(true)}>
              <Trash2 size={12} /> 删除这天的笔记
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {NOTE_FIELDS.map((f) => (
          <Field key={f.key} label={f.label} hint={f.hint}>
            <textarea
              className={cx("input resize-none", f.key === "code" ? "min-h-[92px] font-mono text-[12px]" : "min-h-[64px]")}
              value={draft[f.key]}
              placeholder={f.key === "code" ? "class User:\n    def __init__(self, name):\n        self.name = name" : f.hint}
              onChange={(e) => edit({ [f.key]: e.target.value })}
            />
          </Field>
        ))}
      </div>

      <div className="mt-3 border-t border-white/8 pt-3">
        <p className="mb-1.5 flex items-center gap-1 text-[11px] text-[var(--color-muted)]">
          <Tag size={11} /> 关联知识点（用于按知识点检索）
        </p>
        <div className="flex flex-wrap gap-1.5">
          {availableTags.map((t) => {
            const on = draft.tags.some((x) => x.label === t.label);
            return (
              <button
                key={t.label}
                onClick={() => toggleTag(t.label)}
                className={cx("rounded-lg px-2 py-1 text-[11px] transition-colors", on ? "bg-[var(--color-accent)]/25 text-white" : "bg-white/6 text-[var(--color-muted)] hover:bg-white/12")}
              >
                {on ? "✓ " : "+ "}
                {t.label}
              </button>
            );
          })}
          {availableTags.length === 0 && <span className="text-[11px] text-[var(--color-dim)]">这个知识点没有可关联的标签</span>}
        </div>
      </div>

      {!hasNote && (
        <p className="mt-3 flex items-center gap-1.5 rounded-lg bg-white/6 px-2.5 py-2 text-[11px] text-[var(--color-dim)]">
          <StickyNote size={12} /> 这一天还没有笔记，直接在上面写，停下来一会儿就会自动保存。
        </p>
      )}

      {confirmDelete && (
        <div className="mt-3 rounded-xl border border-[#ff8f8f]/35 bg-[#ff8f8f]/10 px-3 py-2">
          <p className="text-[12px] text-[#ff9a9a]">删除这一天的笔记？</p>
          <div className="mt-2 flex gap-2">
            <button
              className="btn px-3 py-1 text-xs"
              onClick={() => {
                onDelete();
                setConfirmDelete(false);
              }}
            >
              确认删除
            </button>
            <button className="btn btn-ghost px-3 py-1 text-xs" onClick={() => setConfirmDelete(false)}>
              取消
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}
