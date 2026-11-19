import { Droplets, Flame, Sprout } from "lucide-react";
import { plantById } from "../../data/plants";
import { useApp } from "../../hooks/useApp";
import { overallProgress } from "../../services/progressCalculator";
import { stageProgress } from "../../services/plantGrowth";
import { todayISO } from "../../utils/date";
import { PlantStageImage } from "../plant/PlantStageImage";
import { Bar, cx } from "../ui";
import { NAV, type PageId } from "./nav";

export function Sidebar({ page, onNavigate }: { page: PageId; onNavigate: (p: PageId) => void }) {
  const { data } = useApp();
  const overall = overallProgress(data);
  const plant = data.activePlantId ? plantById(data.activePlantId) : null;
  const adoption = data.activePlantId ? data.plants[data.activePlantId] : null;
  const gp = plant && adoption ? stageProgress(plant, adoption.currentExp) : null;
  const watered = !!adoption?.growthRecords.some((r) => r.date === todayISO() && r.type === "water");

  return (
    <aside className="hidden w-[252px] shrink-0 flex-col gap-4 p-4 lg:flex">
      <div className="flex items-center gap-2.5 px-1 pt-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#8b7bff] to-[#57d9a3] shadow-[0_8px_24px_-10px_rgba(139,123,255,0.9)]">
          <Sprout size={18} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold leading-tight">Python Journey</p>
          <p className="text-[10px] text-[var(--color-dim)]">学习成长花园</p>
        </div>
      </div>

      <nav className="glass flex flex-col gap-0.5 p-2">
        {NAV.map((item) => {
          const Icon = item.icon;
          const on = item.id === page;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={cx(
                "flex items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[13px] transition-colors",
                on ? "bg-white/12 text-white" : "text-[var(--color-muted)] hover:bg-white/6 hover:text-white",
              )}
            >
              <Icon size={16} className={on ? "text-[var(--color-accent)]" : ""} />
              {item.label}
              {on && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[var(--color-leaf)]" />}
            </button>
          );
        })}
      </nav>

      <div className="glass p-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs text-[var(--color-muted)]">总学习进度</p>
          <span className="stat-value text-xs text-[var(--color-dim)]">
            {overall.done}/{overall.total}
          </span>
        </div>
        <Bar value={overall.pct} />
        <div className="mt-2 flex items-center gap-3 text-[11px] text-[var(--color-dim)]">
          <span className="inline-flex items-center gap-1">
            <Flame size={12} className="text-[#ffb56b]" /> {data.progress.streak} 天连续
          </span>
          <span className="inline-flex items-center gap-1">
            <Droplets size={12} className="text-[#7fc6ff]" /> {adoption?.totalWateringCount ?? 0} 次浇水
          </span>
        </div>
      </div>

      {plant && adoption && gp ? (
        <button onClick={() => onNavigate("journey")} className="glass group mt-auto overflow-hidden p-3 text-left transition-transform hover:-translate-y-0.5">
          <div className="flex items-center gap-2">
            <PlantStageImage image={gp.current.image} alt={plant.name} className="h-14 w-14 shrink-0 object-contain" />
            <div className="min-w-0">
              <p className="truncate text-xs font-medium">我的{plant.name}</p>
              <p className="text-[10px] text-[var(--color-dim)]">
                {gp.current.name} · {watered ? "今日已浇水" : "今日未浇水"}
              </p>
            </div>
          </div>
          <div className="mt-2">
            <Bar value={gp.done * 100} tone="leaf" height={4} />
          </div>
        </button>
      ) : (
        <button onClick={() => onNavigate("gallery")} className="glass mt-auto p-3 text-left text-xs text-[var(--color-muted)] transition-transform hover:-translate-y-0.5">
          <p className="font-medium text-white">还没有植物</p>
          <p className="mt-0.5 text-[var(--color-dim)]">去图鉴领养一株，让学习有个形状 →</p>
        </button>
      )}
    </aside>
  );
}
