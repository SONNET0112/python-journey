import { Award, ArrowRight, Droplets, Sparkles, X } from "lucide-react";
import { useApp } from "../../hooks/useApp";
import { PlantStageImage } from "../plant/PlantStageImage";

export function FeedbackDialog() {
  const { feedback, dismissFeedback } = useApp();
  if (!feedback) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#05061a]/75 p-3 backdrop-blur-sm sm:items-center">
      <div className="glass pop-in relative w-full max-w-md overflow-hidden p-6">
        <div className="pointer-events-none absolute -top-24 left-1/2 h-52 w-52 -translate-x-1/2 rounded-full bg-[#8b7bff]/35 blur-3xl breathe" />
        <button onClick={dismissFeedback} className="btn btn-ghost absolute right-3 top-3 px-2 py-1" aria-label="关闭反馈">
          <X size={14} />
        </button>

        <p className="text-center text-[11px] tracking-[0.2em] text-[var(--color-dim)]">TODAY&apos;S GROWTH</p>
        <h3 className="mt-1 text-center text-lg font-semibold">今天的努力已经收下了</h3>

        {feedback.upgradedImage && (
          <div className="mt-4 flex items-center justify-center gap-3">
            <PlantStageImage image={feedback.upgradedImage} alt={feedback.upgradedToName ?? "植物"} className="h-28 w-28 object-contain opacity-90" />
          </div>
        )}

        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="glass-soft px-2 py-2.5">
            <p className="stat-value text-base font-semibold text-[var(--color-leaf)]">+{feedback.exp}</p>
            <p className="text-[10px] text-[var(--color-dim)]">成长经验</p>
          </div>
          <div className="glass-soft px-2 py-2.5">
            <p className="stat-value text-base font-semibold">
              {feedback.tasksDone}/{feedback.totalTasks}
            </p>
            <p className="text-[10px] text-[var(--color-dim)]">完成任务</p>
          </div>
          <div className="glass-soft px-2 py-2.5">
            <p className="stat-value text-base font-semibold">{feedback.minutes}</p>
            <p className="text-[10px] text-[var(--color-dim)]">学习分钟</p>
          </div>
        </div>

        <div className="mt-3 space-y-1.5 text-[13px]">
          {feedback.upgradedToName && (
            <p className="flex items-center gap-2 text-[var(--color-leaf)]">
              <Sparkles size={14} /> 植物成长：{feedback.upgradedFromName} → {feedback.upgradedToName}
            </p>
          )}
          {!feedback.upgradedToName && (
            <p className="flex items-center gap-2 text-[var(--color-muted)]">
              <Droplets size={14} /> 这次没有升级，但经验都记在植物身上了。
            </p>
          )}
          {feedback.advanced && (
            <p className="flex items-center gap-2 text-[var(--color-muted)]">
              <ArrowRight size={14} /> 知识模块推进：{feedback.advanced}
            </p>
          )}
          {feedback.stageName && (
            <p className="flex items-center gap-2 text-[#ffd479]">
              <Award size={14} /> 阶段完成：{feedback.stageName}
            </p>
          )}
        </div>

        {feedback.achievements.length > 0 && (
          <div className="mt-3 rounded-xl border border-[#ffd479]/30 bg-[#ffd479]/10 px-3 py-2">
            <p className="text-[10px] text-[#ffd479]">新解锁徽章</p>
            {feedback.achievements.map((a) => (
              <p key={a.name} className="text-[13px]">
                {a.name} · <span className="text-[var(--color-muted)]">{a.description}</span>
              </p>
            ))}
          </div>
        )}

        <p className="mt-4 border-l-2 border-[var(--color-accent)] pl-3 text-[13px] leading-relaxed text-[var(--color-ink)]/90">{feedback.line}</p>

        <button onClick={dismissFeedback} className="btn btn-primary mt-5 w-full">
          收下，明天继续
        </button>
      </div>
    </div>
  );
}
