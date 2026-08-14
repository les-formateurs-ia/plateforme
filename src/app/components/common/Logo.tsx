import logoWhite from "@/imports/Logotype_BLANC.png";
import { useTh } from "@/app/theme/theme";

export function Logo({ h = 28 }: { h?: number }) {
  const th = useTh();
  return th.isDark
    ? <img src={logoWhite} alt="Les Formateurs IA" style={{ height: h, objectFit: "contain", objectPosition: "left" }} />
    : <img src={logoWhite} alt="Les Formateurs IA" style={{ height: h, objectFit: "contain", objectPosition: "left", filter: "invert(1) sepia(1) saturate(3) hue-rotate(240deg) brightness(0.3)" }} />;
}
