import { useEffect, useState } from "react";
import { CheckCircle2, CircleDashed, RotateCcw, Sparkles, X } from "lucide-react";
import { useApp } from "../../hooks/useApp";
import type { Mastery } from "../../types";
import { cx } from "../ui";

const OPTIONS: { value: Mastery; title: string; hint: string; icon: typeof CheckCircle2; tone: string }[] = [
  { value: "full", title: "完全掌握", hint: "推进下一个知识点", icon: CheckCircle2, tone: "#57d9a3" },
  { value: "basic", title: "基本掌握", hint: "可以推进，之后安排复习", icon: Sparkles, tone: "#8b7bff" },
  { value: "review", title: "还需要复习", hint: "保留当前知识点，加练习题", icon: RotateCcw, tone: "#ffb56b" },
  { value: "none", title: "今天没有完成", hint: "任务保留，不算失败", icon: CircleDashed, tone: "#8e8fb5" },
];

export function RecordDialog({ date, open, onClose }: { date: string; open: boolean; onClose: () => void }) {
  const { data, planFor, saveRecord } = useApp();
  const plan = planFor(date);
  const existing = data.records[date];
  const [mastery, setMastery] = useState<Mastery>("full");
  const [summary, setSummary] = useState("");

  useEffect(() => {
    if (!open) return;
    setMastery(existing?.mastery ?? "full");
    setSummary(existing?.summary ?? "");
  }, [open, existing]);

  if (!open) return null;

  const submit = () => {
    saveRecord(date, mastery, summary);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#05061a]/70 p-3 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div className="glass pop-in w-full max-w-lg p-5" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-base font-semibold">结束今天的学习</h3>
            <p className="mt-0.5 text-xs text-[var(--color-dim)]">
              {plan?.topicTitle ?? "今日计划"} · 已完成 {plan?.tasks.filter((t) => t.done).length ?? 0}/{plan?.tasks.length ?? 0} 项
            </p>
          </div>
          <button onClick={onClose} className="btn btn-ghost px-2 py-1" aria-label="关闭">
            <X size={14} />
          </button>
        </div>

        <p className="mb-2 text-xs text-[var(--color-muted)]">今天这个知识点掌握到什么程度？</p>
        <div className="mb-4 grid grid-cols-2 gap-2">
          {OPTIONS.map((o) => {
            const Icon = o.icon;
            const on = mastery === o.value;
            return (
              <button
                key={o.value}
                onClick={() => setMastery(o.value)}
                className={cx("glass-soft flex items-start gap-2 p-2.5 text-left transition-all", on ? "border-white/40 bg-white/12" : "hover:bg-white/8")}
                style={on ? { boxShadow: `0 0 0 1px ${o.tone}66, 0 12px 30px -18px ${o.tone}` } : undefined}
              >
                <Icon size={15} style={{ color: o.tone }} className="mt-0.5 shrink-0" />
                <span>
                  <span className="block text-[13px] font-medium">{o.title}</span>
                  <span className="block text-[10px] leading-snug text-[var(--color-dim)]">{o.hint}</span>
                </span>
              </button>
            );
          })}
        </div>

        <p className="mb-1.5 text-xs text-[var(--color-muted)]">今天学到了什么 / 卡在哪里（写下来才算真的结束）</p>
        <textarea
          className="input min-h-[76px] resize-none"
          placeholder="例如：终于搞懂了 self 指的是实例本身，不是类。"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
        />

        <div className="mt-4 flex items-center justify-between gap-2">
          <span className="text-[10px] text-[var(--color-dim)]">{existing ? "已记录过这一天，再次保存只更新掌握情况" : "保存后会得到成长经验并浇一次水"}</span>
          <button className="btn btn-primary" onClick={submit}>
            {existing ? "更新记录" : "完成并领取成长"}
          </button>
        </div>
      </div>
    </div>
  );
}
