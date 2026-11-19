import { CheckCircle2, ChevronDown, Flag, Layers, Target } from "lucide-react";
import { useState } from "react";
import { Bar, Card, SectionTitle, cx } from "../components/ui";
import { STAGES, stageById } from "../data/roadmap";
import { useApp } from "../hooks/useApp";
import { currentStage, stageProgressOf } from "../services/progressCalculator";
import type { LearningStage } from "../types";

export function Roadmap() {
  const { data } = useApp();
  const cur = currentStage(data);
  const [open, setOpen] = useState<string>(cur.id);

  return (
    <div className="fade-up space-y-4">
      <Card>
        <SectionTitle icon={<Flag size={15} />} title="六个长期阶段" hint="当前阶段会被自动高亮，植物图鉴的解锁也看这里" />
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {STAGES.map((s) => {
            const p = stageProgressOf(data, s);
            const done = data.progress.completedStages.includes(s.id);
            return (
              <div key={s.id} className={cx("glass-soft px-3 py-2.5", s.id === cur.id && "border-[var(--color-accent)]/50")}>
                <div className="flex items-center justify-between text-[10px] text-[var(--color-dim)]">
                  <span>阶段 {s.index}</span>
                  {done && <CheckCircle2 size={12} className="text-[var(--color-leaf)]" />}
                </div>
                <p className="mt-0.5 truncate text-[12px] font-medium">{s.name}</p>
                <div className="mt-2">
                  <Bar value={p.pct} height={3} tone={done ? "leaf" : "accent"} />
                </div>
                <p className="stat-value mt-1 text-[10px] text-[var(--color-dim)]">
                  {p.done}/{p.total}
                </p>
              </div>
            );
          })}
        </div>
      </Card>

      {STAGES.map((stage) => (
        <StageCard key={stage.id} stage={stage} open={open === stage.id} onToggle={() => setOpen(open === stage.id ? "" : stage.id)} />
      ))}
    </div>
  );
}

function StageCard({ stage, open, onToggle }: { stage: LearningStage; open: boolean; onToggle: () => void }) {
  const { data } = useApp();
  const p = stageProgressOf(data, stage);
  const done = data.progress.completedStages.includes(stage.id);
  const items = stage.weeklyPlans ?? [{ week: 1, title: "阶段内容", goal: stage.goal, modules: [{ id: stage.id, week: 1, title: "知识点", points: stage.topics }] }];

  return (
    <Card className="p-0">
      <button onClick={onToggle} className="flex w-full items-start gap-3 p-4 text-left">
        <div
          className={cx(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-semibold",
            done ? "bg-[var(--color-leaf)]/20 text-[var(--color-leaf)]" : stage.id === "stage-1" ? "bg-gradient-to-br from-[#8b7bff] to-[#5f8bff] text-white" : "bg-white/8 text-[var(--color-muted)]",
          )}
        >
          {done ? <CheckCircle2 size={16} /> : stage.index}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[15px] font-semibold">{stage.name}</h3>
            <span className="chip">{stage.weeks} 周</span>
            {stage.index === 1 && <span className="chip border-[#ffcf7a]/40 text-[#ffcf7a]">当前重点</span>}
          </div>
          <p className="mt-1 text-xs leading-relaxed text-[var(--color-muted)]">{stage.goal}</p>
          <div className="mt-2 flex items-center gap-2">
            <div className="w-32">
              <Bar value={p.pct} height={4} tone={done ? "leaf" : "accent"} />
            </div>
            <span className="stat-value text-[10px] text-[var(--color-dim)]">
              {p.done}/{p.total} 模块 · {p.pct}%
            </span>
          </div>
        </div>
        <ChevronDown size={16} className={cx("mt-1 shrink-0 text-[var(--color-dim)] transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="fade-up border-t border-white/8 px-4 pb-4 pt-3">
          <div className="space-y-2">
            {items.map((w) => (
              <div key={`${stage.id}-${w.week}`} className="glass-soft px-3 py-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="chip">第 {w.week} 周</span>
                  <p className="text-[13px] font-medium">{w.title}</p>
                </div>
                {w.goal && <p className="mt-1 text-[11px] text-[var(--color-dim)]">{w.goal}</p>}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {w.modules.flatMap((m) => m.points).map((pt) => (
                    <span key={pt} className="rounded-lg bg-white/6 px-2 py-1 text-[11px] text-[var(--color-muted)]">
                      {pt}
                    </span>
                  ))}
                </div>
                {w.modules[0]?.project && (
                  <p className="mt-2 flex items-center gap-1.5 text-[11px] text-[#ffcf7a]">
                    <Layers size={11} /> 实践项目：{w.modules[0].project}
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-[var(--color-muted)]">
            <Target size={12} className="text-[var(--color-leaf)]" />
            阶段目标：{stageById(stage.id)?.goal}
          </div>
        </div>
      )}
    </Card>
  );
}
