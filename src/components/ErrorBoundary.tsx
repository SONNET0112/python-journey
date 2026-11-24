import { Component, type ErrorInfo, type ReactNode } from "react";

interface State {
  error: Error | null;
}

/**
 * A crash used to leave a black page with only a console error. Anything that
 * throws now shows what happened plus a way out.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("界面崩溃", error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="glass w-full max-w-md p-6">
          <p className="text-xs tracking-[0.2em] text-[var(--color-dim)]">SOMETHING BROKE</p>
          <h1 className="mt-1 text-lg font-semibold">页面没能加载出来</h1>
          <p className="mt-2 text-xs leading-relaxed text-[var(--color-muted)]">
            通常是浏览器里存的旧数据和新版本对不上。先「重新加载」；如果还是这样，再清空本地数据（笔记、错题、植物都会清掉，建议先尝试重新加载）。
          </p>
          <pre className="mt-3 max-h-32 overflow-auto rounded-xl bg-black/30 p-2.5 text-[10px] leading-relaxed text-[#ffc9c9]">{String(error.message || error)}</pre>
          <div className="mt-4 flex flex-wrap gap-2">
            <button className="btn btn-primary" onClick={() => window.location.reload()}>
              重新加载
            </button>
            <button
              className="btn"
              onClick={() => {
                if (!window.confirm("清空本地数据后无法恢复，确定继续？")) return;
                localStorage.removeItem("python-journey.data");
                window.location.reload();
              }}
            >
              清空本地数据
            </button>
            <button className="btn btn-ghost" onClick={() => navigator.clipboard?.writeText(`${error.message}\n${error.stack ?? ""}`)}>
              复制报错
            </button>
          </div>
        </div>
      </div>
    );
  }
}
