import { User } from "lucide-react";
import { cx } from "@/app/lib/cx";

export function Avatar({ url, size = 36, square = false, className = "" }: {
  url?: string | null; size?: number; square?: boolean; className?: string;
}) {
  const radiusClass = square ? "rounded-2xl" : "rounded-full";

  if (url) {
    return (
      <img
        src={url}
        alt="Photo de profil"
        className={cx(radiusClass, "object-cover shrink-0", className)}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className={cx(radiusClass, "flex items-center justify-center shrink-0", className)}
      style={{ width: size, height: size, background: "linear-gradient(135deg,#fbc2ad,#fceccd)" }}
    >
      <User className="text-white" style={{ width: size * 0.55, height: size * 0.55 }} strokeWidth={2} />
    </div>
  );
}
