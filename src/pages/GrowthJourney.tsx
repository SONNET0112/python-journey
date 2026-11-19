import { Award, CalendarDays, Droplets, Flower2, Sprout, Star } from "lucide-react";
import { MyPlantCard } from "../components/plant/MyPlantCard";
import { PlantStageImage } from "../components/plant/PlantStageImage";
import { Bar, Card, Empty, SectionTitle } from "../components/ui";
import { ACHIEVEMENTS } from "../data/achievements";
import { plantById } from "../data/plants";
import { useApp } from "../hooks/useApp";
import { stageProgress } from "../services/plantGrowth";
import { fmtCN } from "../utils/date";

const ICONS: Record<string, typeof Award> = { Sprout, Leaf: Sprout, Droplets, Hammer: Star, TreePine: Sprout, Flower2, Trophy: Award, NotebookPen: Star };

export function GrowthJourney({ onOpenGallery }: { onOpenGallery: () => void }) {
  const { data } = useApp();
  const plant = data.activePlantId ? plantById(data.activePlantId) : null;
  const adoption = data.activePlantId ? data.plants[data.activePlantId] : null;
  const gp = plant && adoption ? stageProgress(plant, adoption.currentExp) : null;
  const events = adoption ? [...adoption.growthRecords].reverse().filter((r) => r.type !== "exp").slice(0, 40) : [];
  const expEvents = adoption ? adoption.growthRecords.filter((r) => r.type === "exp").length : 0;

  return (
    <div className="fade-up grid grid-cols-1 gap-4 xl:grid-cols-12">
      <div className="space-y-4 xl:col-span-4">
        <MyPlantCard onOpen={onOpenGallery} openLabel="去植物图鉴看看" />
        {plant && adoption && gp && (
          <Card>
            <SectionTitle icon={<CalendarDays size={15} />} title="成长档案" />
            <ul className="space-y-2 text-[12px]">
              {[
                ["领养日期", adoption.adoptedAt],
                ["当前形态", gp.current.name],
                ["累计经验", `${adoption.currentExp} exp`],
                ["累计浇水", `${adoption.totalWateringCount} 次`],
                ["成长事件", `${events.length} 条`],
                ["学习记录", `${Object.keys(data.records).length} 天`],
              ].map(([k, v]) => (
                <li key={k} className="flex items-center justify-between border-b border-white/6 pb-1.5 last:border-0">
                  <span className="text-[var(--color-dim)]">{k}</span>
                  <span className="stat-value">{v}</span>
                </li>
              ))}
            </ul>
            <div className="mt-3">
              <div className="mb-1 flex justify-between text-[10px] text-[var(--color-dim)]">
                <span>距离「{gp.next?.name ?? "最终形态"}」</span>
                <span>{gp.next ? `${gp.remaining} exp` : "已完成"}</span>
              </div>
              <Bar value={gp.done * 100} tone="leaf" height={5} />
            </div>
          </Card>
        )}

        <Card>
          <SectionTitle icon={<Award size={15} />} title="成长徽章" hint="只由真实行为解锁" />
          <div className="grid grid-cols-2 gap-2">
            {ACHIEVEMENTS.map((a) => {
              const at = data.achievements[a.id];
              const Icon = ICONS[a.icon] ?? Award;
              return (
                <div key={a.id} className={`glass-soft px-2.5 py-2 ${at ? "" : "opacity-55"}`} title={a.condition}>
                  <div className="flex items-center gap-1.5">
                    <span className={`flex h-6 w-6 items-center justify-center rounded-lg ${at ? "bg-[#ffd479]/20 text-[#ffd479]" : "bg-white/8 text-[var(--color-dim)]"}`}>
                      <Icon size={13} />
                    </span>
                    <p className="text-[11px] font-medium">{a.name}</p>
                  </div>
                  <p className="mt-1 text-[9px] leading-tight text-[var(--color-dim)]">{a.condition}</p>
                  <p className="mt-0.5 text-[9px] text-[var(--color-muted)]">{at ? `解锁于 ${at}` : "未解锁"}</p>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <div className="xl:col-span-8">
        <Card>
          <SectionTitle
            icon={<Sprout size={15} />}
            title="成长时间线"
            hint={plant ? `${plant.name}的每一次变化` : "领养植物后开始记录"}
            action={<span className="chip">{expEvents} 次成长</span>}
          />
          {!adoption ? (
            <div className="space-y-3">
              <Empty>还没有正在培养的植物。</Empty>
              <button className="btn btn-primary w-full" onClick={onOpenGallery}>
                <Flower2 size={14} /> 去植物图鉴领养
              </button>
            </div>
          ) : events.length === 0 ? (
            <Empty>还没有成长事件，完成一次学习就会有一条。</Empty>
          ) : (
            <ol className="relative ml-2 space-y-4 border-l border-white/10 pl-4">
              {events.map((e, i) => (
                <li key={`${e.date}-${e.type}-${i}`} className="relative">
                  <span className="absolute -left-[21px] top-2 h-2.5 w-2.5 rounded-full bg-gradient-to-br from-[#8b7bff] to-[#57d9a3] shadow-[0_0_10px_rgba(139,123,255,0.8)]" />
                  <div className="flex gap-3">
                    <PlantStageImage image={e.image} alt={e.title} className="h-14 w-14 shrink-0 rounded-xl object-contain" />
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium">{e.title}</p>
                      <p className="mt-0.5 text-[11px] text-[var(--color-muted)]">{e.detail}</p>
                      <p className="mt-1 text-[10px] text-[var(--color-dim)]">
                        {fmtCN(e.date)}
                        {e.type === "water" && (
                          <span className="ml-2 inline-flex items-center gap-0.5 text-[#7fc6ff]">
                            <Droplets size={10} /> 浇水
                          </span>
                        )}
                        {e.type === "stage" && <span className="ml-2 text-[var(--color-leaf)]">形态进阶</span>}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>
    </div>
  );
}
