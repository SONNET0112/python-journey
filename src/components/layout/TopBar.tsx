import { CalendarDays, Flame, Menu, Sprout } from "lucide-react";
import { useApp } from "../../hooks/useApp";
import { fmtCN, todayISO } from "../../utils/date";
import { NAV, type PageId } from "./nav";
import { cx } from "../ui";

export function TopBar({ page, onNavigate }: { page: PageId; onNavigate: (p: PageId) => void }) {
  const { data, todayPlan } = useApp();
  const item = NAV.find((n) => n.id === page)!;
  const plan = todayPlan();
  const done = plan.tasks.filter((t) => t.done).length;

  return (
    <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div className="flex items-start gap-2">
        <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#8b7bff] to-[#57d9a3] lg:hidden">
          <Sprout size={16} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight lg:text-[22px]">{item.title}</h1>
          <p className="mt-0.5 text-xs text-[var(--color-dim)]">{item.hint}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="chip">
          <CalendarDays size={12} /> {fmtCN(todayISO())}
        </span>
        <span className="chip">
          <Flame size={12} className="text-[#ffb56b]" /> 连续 {data.progress.streak} 天
        </span>
        <span className="chip">
          今日 {done}/{plan.tasks.length} 项
        </span>
        <button className="btn btn-ghost px-2.5 py-1.5 lg:hidden" onClick={() => onNavigate("settings")} aria-label="打开设置">
          <Menu size={14} />
        </button>
      </div>
    </header>
  );
}

export function MobileNav({ page, onNavigate }: { page: PageId; onNavigate: (p: PageId) => void }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[#0a0b22]/85 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
      <div className="flex overflow-x-auto">
        {NAV.map((item) => {
          const Icon = item.icon;
          const on = item.id === page;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={cx("flex min-w-[62px] flex-1 flex-col items-center gap-1 py-2.5 text-[10px] transition-colors", on ? "text-white" : "text-[var(--color-dim)]")}
            >
              <Icon size={17} className={on ? "text-[var(--color-accent)]" : ""} />
              {item.short}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
