import { Sprout } from "lucide-react";
import { useState } from "react";
import { plantImage } from "../../data/plants";
import { cx } from "../ui";

/** Every plant image goes through here: missing asset → a styled placeholder, never a broken icon. */
export function PlantStageImage({ image, alt, className, animate }: { image: string; alt: string; className?: string; animate?: boolean }) {
  const [failed, setFailed] = useState(false);
  const src = plantImage(image);
  if (!src || failed) {
    return (
      <div className={cx("flex items-center justify-center rounded-2xl bg-gradient-to-br from-white/10 to-white/[0.03]", className)}>
        <div className="text-center">
          <Sprout className="mx-auto text-[var(--color-leaf)]/70" size={36} />
          <p className="mt-1 text-[10px] text-[var(--color-dim)]">图片待补</p>
        </div>
      </div>
    );
  }
  return <img src={src} alt={alt} onError={() => setFailed(true)} draggable={false} className={cx(animate && "sway", className)} />;
}
