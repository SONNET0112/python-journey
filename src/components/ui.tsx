import type { ReactNode } from "react";

export const cx = (...v: (string | false | null | undefined)[]) => v.filter(Boolean).join(" ");

export function Card({ children, className, glow }: { children: ReactNode; className?: string; glow?: boolean }) {
  return <div className={cx("glass p-5", glow && "glow-accent", className)}>{children}</div>;
}

export function SectionTitle({ icon, title, hint, action }: { icon?: ReactNode; title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-start justify-between gap-3">
      <div className="flex items-center gap-2">
        {icon && <span className="text-[var(--color-accent)]">{icon}</span>}
        <div>
          <h2 className="text-[15px] font-semibold tracking-wide">{title}</h2>
          {hint && <p className="mt-0.5 text-xs text-[var(--color-dim)]">{hint}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

export function Bar({ value, tone = "accent", height = 6 }: { value: number; tone?: "accent" | "leaf" | "dim"; height?: number }) {
  const bg =
    tone === "leaf"
      ? "linear-gradient(90deg,#4fd39b,#8ff0c4)"
      : tone === "dim"
        ? "rgba(255,255,255,0.35)"
        : "linear-gradient(90deg,#8b7bff,#5f8bff)";
  return (
    <div className="w-full overflow-hidden rounded-full bg-white/10" style={{ height }}>
      <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: bg }} />
    </div>
  );
}

export function Ring({ value, size = 68, stroke = 6, label }: { value: number; size?: number; stroke?: number; label?: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#ringGrad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - Math.min(1, Math.max(0, value / 100)))}
          className="transition-[stroke-dashoffset] duration-700"
        />
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#9b8bff" />
            <stop offset="100%" stopColor="#57d9a3" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="stat-value text-sm font-semibold">{Math.round(value)}%</span>
        {label && <span className="text-[10px] text-[var(--color-dim)]">{label}</span>}
      </div>
    </div>
  );
}

export function Stat({ label, value, unit, sub }: { label: string; value: ReactNode; unit?: string; sub?: string }) {
  return (
    <div className="glass-soft px-3 py-2.5">
      <p className="text-[11px] text-[var(--color-dim)]">{label}</p>
      <p className="stat-value mt-1 text-lg font-semibold">
        {value}
        {unit && <span className="ml-1 text-[11px] font-normal text-[var(--color-muted)]">{unit}</span>}
      </p>
      {sub && <p className="mt-0.5 text-[10px] text-[var(--color-dim)]">{sub}</p>}
    </div>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs text-[var(--color-muted)]">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[10px] text-[var(--color-dim)]">{hint}</span>}
    </label>
  );
}

export function Seg<T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="seg">
      {options.map((o) => (
        <button key={o.value} type="button" data-on={o.value === value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="glass-soft px-4 py-8 text-center text-sm text-[var(--color-dim)]">{children}</div>;
}
