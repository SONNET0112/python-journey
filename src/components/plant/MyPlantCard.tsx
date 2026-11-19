import { Droplets, Sparkles } from "lucide-react";
import { plantById } from "../../data/plants";
import { useApp } from "../../hooks/useApp";
import { stageProgress, wateredOn } from "../../services/plantGrowth";
import { dailyLine } from "../../services/encouragementService";
import { todayISO } from "../../utils/date";
import { Bar } from "../ui";
import { PlantStageImage } from "./PlantStageImage";

export function MyPlantCard({ onOpen, openLabel = "查看成长历程" }: { onOpen: () => void; openLabel?: string }) {
  const { data } = useApp();
  const today = todayISO();
  const plant = data.activePlantId ? plantById(data.activePlantId) : null;
  const adoption = data.activePlantId ? data.plants[data.activePlantId] : null;

  if (!plant || !adoption) {
    return (
      <div className="glass flex flex-col items-center justify-center p-6 text-center">
        <div className="mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-white/6">
          <Droplets size={28} className="text-[var(--color-accent)]" />
        </div>
        <p className="text-sm font-medium">还没有领养植物</p>
        <p className="mt-1 max-w-[220px] text-xs leading-relaxed text-[var(--color-dim)]">学习会变成水。去图鉴挑一株，让它替你把努力留下来。</p>
        <button onClick={onOpen} className="btn btn-primary mt-4">
          去植物图鉴
        </button>
      </div>
    );
  }

  const gp = stageProgress(plant, adoption.currentExp);
  const watered = wateredOn(adoption, today);

  return (
    <div className="glass relative overflow-hidden p-5">
      <div className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full blur-3xl breathe" style={{ background: `${plant.accent}33` }} />

      <div className="mb-1 flex items-start justify-between">
        <div>
          <p className="text-[11px] tracking-[0.18em] text-[var(--color-dim)]">我的植物</p>
          <h2 className="mt-0.5 text-base font-semibold">我的{plant.name}</h2>
        </div>
        <span className="chip" style={{ borderColor: `${plant.accent}55`, color: plant.accent }}>
          {gp.current.name}
        </span>
      </div>

      <div className="relative mx-auto my-1 flex h-[188px] w-full max-w-[260px] items-center justify-center">
        <div className="absolute h-32 w-32 rounded-full opacity-70 blur-2xl breathe" style={{ background: `${plant.accent}30` }} />
        <PlantStageImage image={gp.current.image} alt={`${plant.name} · ${gp.current.name}`} animate className="relative h-full w-full object-contain drop-shadow-[0_10px_30px_rgba(0,0,0,0.35)]" />
      </div>

      <p className="mb-3 text-center text-[11px] text-[var(--color-muted)]">{gp.current.description}</p>

      <div className="mb-1 flex items-end justify-between text-[11px]">
        <span className="text-[var(--color-muted)]">成长进度 {Math.round(gp.done * 100)}%</span>
        <span className="text-[var(--color-dim)]">{gp.next ? `距「${gp.next.name}」还差 ${gp.remaining} 经验` : "已到最终形态"}</span>
      </div>
      <Bar value={gp.done * 100} tone="leaf" />

      <div className="mt-3 grid grid-cols-2 gap-2 text-center">
        <div className="glass-soft px-2 py-2">
          <p className="stat-value text-sm font-semibold">{adoption.totalWateringCount}</p>
          <p className="text-[10px] text-[var(--color-dim)]">累计浇水</p>
        </div>
        <div className="glass-soft px-2 py-2">
          <p className={`text-sm font-semibold ${watered ? "text-[var(--color-leaf)]" : "text-[var(--color-muted)]"}`}>{watered ? "已完成" : "还没"}</p>
          <p className="text-[10px] text-[var(--color-dim)]">今日浇水</p>
        </div>
      </div>

      <p className="mt-3 flex items-start gap-1.5 text-[11px] leading-relaxed text-[var(--color-muted)]">
        <Sparkles size={12} className="mt-0.5 shrink-0 text-[var(--color-accent)]" />
        {dailyLine("plant_upgrade", today)}
      </p>

      <button onClick={onOpen} className="btn btn-ghost mt-3 w-full py-1.5 text-xs">
        {openLabel}
      </button>
    </div>
  );
}
