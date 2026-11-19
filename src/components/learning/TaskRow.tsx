import { BookX, Check, Clock, Pencil, StickyNote, Trash2 } from "lucide-react";
import { sectionLabel } from "../../services/taskGenerator";
import type { DailyTask } from "../../types";
import { cx } from "../ui";

export const SECTION_TONE: Record<string, string> = {
  review: "#94b8ff",
  learn: "#b2a2ff",
  practice: "#6fd6a8",
  independent: "#ffcf7a",
  summary: "#ff9fc0",
};

export function TaskRow({
  task,
  onToggle,
  onEdit,
  onRemove,
  onNote,
  onMistake,
  editable,
}: {
  task: DailyTask;
  onToggle: () => void;
  onEdit?: () => void;
  onRemove?: () => void;
  onNote?: () => void;
  onMistake?: () => void;
  editable?: boolean;
}) {
  const tone = SECTION_TONE[task.section] ?? "#9aa0c0";
  return (
    <div
      className={cx(
        "glass-soft group flex items-start gap-2.5 px-3 py-2.5 transition-all",
        task.done ? "opacity-55" : "hover:bg-white/9 hover:translate-y-[-1px]",
      )}
    >
      <button
        onClick={onToggle}
        aria-label={task.done ? `取消完成：${task.title}` : `完成任务：${task.title}`}
        aria-pressed={task.done}
        className={cx(
          "mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-md border transition-all",
          task.done ? "border-transparent bg-gradient-to-br from-[#57d9a3] to-[#8b7bff]" : "border-white/25 hover:border-white/50",
        )}
      >
        {task.done && <Check size={12} className="text-[#08122a]" strokeWidth={3} />}
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="rounded px-1.5 py-[1px] text-[10px]" style={{ background: `${tone}22`, color: tone }}>
            {sectionLabel(task.section)}
          </span>
          {task.kind === "project" && <span className="rounded bg-[#ffcf7a]/15 px-1.5 py-[1px] text-[10px] text-[#ffcf7a]">实践项目</span>}
        </div>
        <p className={cx("mt-0.5 text-[13px] leading-snug", task.done && "line-through")}>{task.title}</p>
      </div>

      <span className="mt-0.5 inline-flex shrink-0 items-center gap-0.5 text-[10px] text-[var(--color-dim)]">
        <Clock size={10} /> {task.minutes}′
      </span>

      {onNote && (
        <button onClick={onNote} aria-label={`为这个任务记笔记：${task.title}`} title="记这条笔记" className="mt-0.5 shrink-0 rounded p-1 text-[var(--color-dim)] hover:text-white">
          <StickyNote size={12} />
        </button>
      )}
      {onMistake && (
        <button onClick={onMistake} aria-label={`加入错题本：${task.title}`} title="加入错题本" className="mt-0.5 shrink-0 rounded p-1 text-[var(--color-dim)] hover:text-[#ffb56b]">
          <BookX size={12} />
        </button>
      )}

      {editable && (
        <span className="flex shrink-0 gap-1 opacity-55 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
          {onEdit && (
            <button onClick={onEdit} aria-label={`编辑任务：${task.title}`} className="rounded p-1 text-[var(--color-dim)] hover:text-white">
              <Pencil size={12} />
            </button>
          )}
          {onRemove && (
            <button onClick={onRemove} aria-label={`删除任务：${task.title}`} className="rounded p-1 text-[var(--color-dim)] hover:text-[#ff8f8f]">
              <Trash2 size={12} />
            </button>
          )}
        </span>
      )}
    </div>
  );
}
