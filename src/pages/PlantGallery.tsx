import { Check, Flower2, Leaf, Lock, Sprout, X } from "lucide-react";
import { useState } from "react";
import { PlantStageImage } from "../components/plant/PlantStageImage";
import { Card, SectionTitle, cx } from "../components/ui";
import { PLANTS, plantById } from "../data/plants";
import { useApp } from "../hooks/useApp";
import { resolveStage } from "../services/plantGrowth";

export function PlantGallery() {
  const { data, adopt } = useApp();
  const [openId, setOpenId] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [justAdopted, setJustAdopted] = useState<string | null>(null);

  const open = openId ? plantById(openId) : undefined;
  const adoption = openId ? data.plants[openId] : undefined;
  const activePlant = data.activePlantId ? plantById(data.activePlantId) : null;
  const isActive = openId === data.activePlantId;
  const unlockedPlants = 1 + data.progress.completedStages.length * 2; // 领养不受限制，这里只做展示

  const doAdopt = () => {
    if (!open) return;
    if (activePlant && data.activePlantId !== open.id && data.settings.adoptConfirm && !confirming) {
      setConfirming(true);
      return;
    }
    adopt(open);
    setConfirming(false);
    setJustAdopted(open.id);
    setTimeout(() => setJustAdopted(null), 2600);
  };

  return (
    <div className="fade-up space-y-4">
      <Card>
        <SectionTitle
          icon={<Flower2 size={15} />}
          title="植物图鉴"
          hint="八种植物，每一株都有完整的成长阶段和自己的图片。一次只养一株。"
          action={<span className="chip">{data.activePlantId ? `当前：${plantById(data.activePlantId)?.name}` : "尚未领养"}</span>}
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {PLANTS.map((p) => {
            const ad = data.plants[p.id];
            const stage = ad ? resolveStage(p, ad.currentExp) : null;
            const active = data.activePlantId === p.id;
            const last = p.stages[p.stages.length - 1];
            return (
              <button
                key={p.id}
                onClick={() => {
                  setOpenId(p.id);
                  setConfirming(false);
                }}
                className={cx("glass group relative flex flex-col overflow-hidden p-3 text-left transition-all hover:-translate-y-1", active && "border-white/30")}
              >
                <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full blur-2xl transition-opacity" style={{ background: `${p.accent}2e` }} />
                <div className="relative flex h-[124px] items-center justify-center">
                  <PlantStageImage image={p.coverImage} alt={p.name} className="h-full w-full object-contain drop-shadow-[0_10px_24px_rgba(0,0,0,0.35)]" />
                  <div className="absolute bottom-0 right-0 flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-[#0a0c26]/85">
                    <PlantStageImage image={last.image} alt={`${p.name}最终形态`} className="h-8 w-8 object-contain" />
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <p className="text-[14px] font-semibold">{p.name}</p>
                  {active && <span className="rounded bg-[var(--color-leaf)]/20 px-1.5 py-[1px] text-[10px] text-[var(--color-leaf)]">培养中</span>}
                  {ad && !active && <span className="rounded bg-white/8 px-1.5 py-[1px] text-[10px] text-[var(--color-dim)]">{stage?.name}</span>}
                </div>
                <p className="mt-1 line-clamp-2 min-h-[30px] text-[11px] leading-relaxed text-[var(--color-muted)]">{p.description}</p>
                <div className="mt-auto flex items-center justify-between pt-2 text-[10px] text-[var(--color-muted)]">
                  <span className="inline-flex items-center gap-1">
                    <Leaf size={10} /> {p.cycle} · 最终 {last.name}
                  </span>
                  <span className="text-[#c9c1ff]">查看图鉴 →</span>
                </div>
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-[10px] text-[var(--color-dim)]">
          第一版全部植物都可以自由领养；已完成 {data.progress.completedStages.length} 个阶段，累计解锁展示 {Math.min(PLANTS.length, unlockedPlants)} 种。
        </p>
      </Card>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-[#05061a]/75 p-3 backdrop-blur-sm sm:items-center" onClick={() => setOpenId(null)}>
          <div className="glass pop-in my-auto w-full max-w-2xl p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold">{open.name}</h3>
                  <span className="chip" style={{ borderColor: `${open.accent}55`, color: open.accent }}>
                    {open.stages.length} 个成长阶段
                  </span>
                  {adoption && <span className="chip">已领养 · {resolveStage(open, adoption.currentExp).name}</span>}
                </div>
                <p className="mt-1 text-xs leading-relaxed text-[var(--color-muted)]">{open.description}</p>
                <p className="mt-1 text-[11px] text-[var(--color-dim)]">寓意：{open.meaning}</p>
              </div>
              <button onClick={() => setOpenId(null)} className="btn btn-ghost px-2 py-1" aria-label="关闭植物详情">
                <X size={14} />
              </button>
            </div>

            <div className="mt-3 -mx-1 flex gap-2 overflow-x-auto px-1 pb-2">
              {open.stages.map((s, i) => {
                const reached = adoption ? adoption.currentExp >= s.requiredExp : false;
                return (
                  <div key={s.id} className={cx("glass-soft w-[112px] shrink-0 p-2 text-center", reached && "border-[var(--color-leaf)]/40")}>
                    <div className="flex h-[86px] items-center justify-center">
                      <PlantStageImage image={s.image} alt={`${open.name}${s.name}`} className="h-full w-full object-contain" />
                    </div>
                    <p className="mt-1 text-[11px] font-medium">
                      {i + 1}. {s.name}
                    </p>
                    <p className="mt-0.5 line-clamp-2 h-[26px] text-[9px] leading-tight text-[var(--color-dim)]">{s.description}</p>
                    <p className="stat-value text-[9px] text-[var(--color-muted)]">{s.requiredExp} exp</p>
                  </div>
                );
              })}
            </div>

            {confirming ? (
              <div className="mt-3 rounded-xl border border-[#ffcf7a]/35 bg-[#ffcf7a]/10 px-3 py-2.5">
                <p className="text-[12px] text-[#ffcf7a]">当前正在培养「{activePlant?.name}」。</p>
                <p className="mt-0.5 text-[11px] text-[var(--color-muted)]">切换后首页会显示{open.name}，{activePlant?.name}的成长记录会完整保留在图鉴里，不会丢失。</p>
                <div className="mt-2 flex gap-2">
                  <button className="btn btn-primary px-3 py-1 text-xs" onClick={doAdopt}>
                    确认切换
                  </button>
                  <button className="btn btn-ghost px-3 py-1 text-xs" onClick={() => setConfirming(false)}>
                    再想想
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-[11px] text-[var(--color-dim)]">
                  {adoption ? `领养于 ${adoption.adoptedAt} · 累计浇水 ${adoption.totalWateringCount} 次 · 经验 ${adoption.currentExp}` : "领养后它会以种子形态出现在首页，随你的学习慢慢长大。"}
                </p>
                <button className={cx("btn", isActive ? "" : "btn-primary")} onClick={doAdopt} disabled={isActive}>
                  {isActive ? (
                    <>
                      <Check size={14} /> 正在培养这一株
                    </>
                  ) : adoption ? (
                    <>
                      <Sprout size={14} /> 继续培养
                    </>
                  ) : (
                    <>
                      <Sprout size={14} /> 领养这株植物
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {justAdopted && (
        <div className="pop-in fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-xl border border-[var(--color-leaf)]/40 bg-[#0b1226]/95 px-4 py-2 text-[12px] text-[var(--color-leaf)] backdrop-blur">
          <span className="inline-flex items-center gap-1.5">
            <Lock size={12} /> 已领养 {plantById(justAdopted)?.name}，去首页看看它
          </span>
        </div>
      )}
    </div>
  );
}
