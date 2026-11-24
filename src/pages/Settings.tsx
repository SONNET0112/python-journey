import { Coffee, Database, Download, Leaf, Settings as SettingsIcon, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { Card, Field, SectionTitle, Seg, cx } from "../components/ui";
import { plantById } from "../data/plants";
import { useApp } from "../hooks/useApp";
import { exportJSON } from "../services/storage";
import type { Difficulty, Energy } from "../types";
import { todayISO } from "../utils/date";

const WEEK = [
  { key: "1", label: "周一" },
  { key: "2", label: "周二" },
  { key: "3", label: "周三" },
  { key: "4", label: "周四" },
  { key: "5", label: "周五" },
  { key: "6", label: "周六" },
  { key: "0", label: "周日" },
];

export function Settings() {
  const { data, updateSettings, importData, resetAll, releasePlant } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const plant = data.activePlantId ? plantById(data.activePlantId) : null;

  const exportFile = () => {
    const blob = new Blob([exportJSON(data)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `python-journey-${todayISO()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMsg({ ok: true, text: "已导出 JSON 备份" });
  };

  const onFile = async (file: File) => {
    const text = await file.text();
    const r = importData(text);
    setMsg(r.ok ? { ok: true, text: "数据已导入，原记录已被替换" } : { ok: false, text: `导入失败，原数据未改动：${r.error}` });
  };

  return (
    <div className="fade-up grid grid-cols-1 gap-4 xl:grid-cols-12">
      <div className="space-y-4 xl:col-span-7">
        <Card>
          <SectionTitle icon={<SettingsIcon size={15} />} title="学习时间" hint="每天默认学多久，也可以按星期单独设置" />
          <div className="space-y-3">
            <Field label="默认每日学习时间">
              <div className="seg flex-wrap">
                {[15, 30, 45, 60, 90].map((m) => (
                  <button key={m} data-on={data.settings.defaultMinutes === m} onClick={() => updateSettings({ defaultMinutes: m })}>
                    {m} 分钟
                  </button>
                ))}
              </div>
            </Field>

            <div>
              <p className="mb-1.5 text-xs text-[var(--color-muted)]">每周时间表（分钟）</p>
              <div className="space-y-1.5">
                {WEEK.map((d) => {
                  const rest = data.settings.restDays.includes(Number(d.key));
                  return (
                    <div key={d.key} className="flex items-center gap-2">
                      <span className="w-12 text-[11px] text-[var(--color-muted)]">{d.label}</span>
                      <input
                        type="number"
                        min={0}
                        max={240}
                        className="input w-20"
                        value={data.settings.minutesByWeekday[d.key] ?? data.settings.defaultMinutes}
                        onChange={(e) =>
                          updateSettings({ minutesByWeekday: { ...data.settings.minutesByWeekday, [d.key]: Math.max(0, Math.min(240, Number(e.target.value))) } })
                        }
                      />
                      <button
                        className={cx("chip", rest && "border-[#ffcf7a]/40 text-[#ffcf7a]")}
                        onClick={() => updateSettings({ restDays: rest ? data.settings.restDays.filter((x) => x !== Number(d.key)) : [...data.settings.restDays, Number(d.key)] })}
                      >
                        <Coffee size={11} /> {rest ? "休息日" : "设为休息日"}
                      </button>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-white/8 pt-3">
                <div>
                  <p className="text-[12px]">每周六作为综合练习日</p>
                  <p className="text-[10px] text-[var(--color-dim)]">不学新知识点，只做到期复习 + 一个综合练习，交错练习记得更牢</p>
                </div>
                <button
                  onClick={() => updateSettings({ weeklyRhythm: !data.settings.weeklyRhythm })}
                  className={cx("relative h-6 w-11 shrink-0 rounded-full transition-colors", data.settings.weeklyRhythm ? "bg-[var(--color-accent)]" : "bg-white/15")}
                  aria-label="切换每周综合练习日"
                  aria-pressed={data.settings.weeklyRhythm}
                >
                  <span className={cx("absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all", data.settings.weeklyRhythm ? "left-[22px]" : "left-0.5")} />
                </button>
              </div>
              <p className="mt-1.5 text-[10px] text-[var(--color-dim)]">休息日只安排轻松的回顾，不推进知识点，也不会让植物枯萎。</p>
            </div>
          </div>
        </Card>

        <Card>
          <SectionTitle icon={<Leaf size={15} />} title="状态偏好" hint="生成每日计划时的默认值，可以在计划页按天覆盖" />
          <div className="space-y-3">
            <div>
              <p className="mb-1.5 text-xs text-[var(--color-muted)]">默认精力</p>
              <Seg<Energy>
                value={data.settings.energy}
                onChange={(v) => updateSettings({ energy: v })}
                options={[
                  { value: "high", label: "充沛" },
                  { value: "normal", label: "一般" },
                  { value: "tired", label: "疲惫" },
                ]}
              />
            </div>
            <div>
              <p className="mb-1.5 text-xs text-[var(--color-muted)]">默认难度</p>
              <Seg<Difficulty>
                value={data.settings.difficulty}
                onChange={(v) => updateSettings({ difficulty: v })}
                options={[
                  { value: "easy", label: "轻松" },
                  { value: "normal", label: "正常" },
                  { value: "challenge", label: "挑战" },
                ]}
              />
            </div>
          </div>
        </Card>
      </div>

      <div className="space-y-4 xl:col-span-5">
        <Card>
          <SectionTitle icon={<Leaf size={15} />} title="植物设置" />
          <div className="flex items-center justify-between border-b border-white/8 py-2">
            <div>
              <p className="text-[12px]">切换植物时二次确认</p>
              <p className="text-[10px] text-[var(--color-dim)]">避免手滑换掉正在培养的那株</p>
            </div>
            <button
              onClick={() => updateSettings({ adoptConfirm: !data.settings.adoptConfirm })}
              className={cx("relative h-6 w-11 rounded-full transition-colors", data.settings.adoptConfirm ? "bg-[var(--color-accent)]" : "bg-white/15")}
              aria-label="切换植物确认开关"
              aria-pressed={data.settings.adoptConfirm}
            >
              <span className={cx("absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all", data.settings.adoptConfirm ? "left-[22px]" : "left-0.5")} />
            </button>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div>
              <p className="text-[12px]">当前植物</p>
              <p className="text-[10px] text-[var(--color-dim)]">{plant ? `${plant.name}（进度保留）` : "尚未领养"}</p>
            </div>
            {plant && (
              <button className="btn btn-ghost px-3 py-1 text-[11px]" onClick={releasePlant}>
                解除培养
              </button>
            )}
          </div>
        </Card>

        <Card>
          <SectionTitle icon={<Database size={15} />} title="数据" hint={`本机存储 · schema v${data.version}`} />
          <div className="space-y-2">
            <button className="btn w-full" onClick={exportFile}>
              <Download size={14} /> 导出 JSON
            </button>
            <button className="btn w-full" onClick={() => fileRef.current?.click()}>
              <Upload size={14} /> 导入 JSON
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void onFile(f);
                e.target.value = "";
              }}
            />
            <button className="btn w-full hover:text-[#ff9a9a]" onClick={() => setConfirmReset(true)}>
              <Trash2 size={14} /> 恢复默认数据
            </button>
            {msg && <p className={cx("rounded-lg px-2 py-1.5 text-[11px]", msg.ok ? "bg-[var(--color-leaf)]/12 text-[var(--color-leaf)]" : "bg-[#ff8f8f]/12 text-[#ff9a9a]")}>{msg.text}</p>}
            <p className="text-[10px] leading-relaxed text-[var(--color-dim)]">
              所有数据只存在这台设备的 localStorage 里。导入会先校验结构，校验失败时原数据不会被覆盖。
            </p>
          </div>
        </Card>

        <div className="glass-soft px-4 py-3 text-[10px] leading-relaxed text-[var(--color-dim)]">
          Python Journey v1.0 · 纯前端 · 无账号 · 无后端。学习计划由本地规则生成，植物成长只由真实学习记录驱动。
        </div>
      </div>

      {confirmReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#05061a]/75 p-4 backdrop-blur-sm" onClick={() => setConfirmReset(false)}>
          <div className="glass pop-in w-full max-w-sm p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-semibold">清空全部数据？</h3>
            <p className="mt-1 text-xs leading-relaxed text-[var(--color-dim)]">学习记录、植物、日记和徽章都会被删除，且无法恢复。建议先导出备份。</p>
            <div className="mt-4 flex justify-end gap-2">
              <button className="btn btn-ghost" onClick={() => setConfirmReset(false)}>
                取消
              </button>
              <button
                className="btn"
                onClick={() => {
                  resetAll();
                  setConfirmReset(false);
                  setMsg({ ok: true, text: "已恢复默认数据" });
                }}
              >
                确认清空
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
