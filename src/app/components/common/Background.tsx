import { useTh } from "@/app/theme/theme";
import { mkCSS } from "@/app/theme/global-styles";

export function Background() {
  const th = useTh();
  return <style>{mkCSS(th.isDark, th.grad1)}</style>;
}
