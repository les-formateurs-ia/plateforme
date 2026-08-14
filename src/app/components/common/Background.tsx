import { useTh } from "@/app/theme/theme";
import { mkCSS } from "@/app/theme/global-styles";

export function Background() {
  const th = useTh();
  return (
    <>
      <style>{mkCSS(th.isDark)}</style>
      <div className="fixed inset-0 pointer-events-none z-0" style={{ backgroundImage: `linear-gradient(${th.grid} 1px,transparent 1px),linear-gradient(90deg,${th.grid} 1px,transparent 1px)`, backgroundSize: "52px 52px" }} />
      <div className="fixed pointer-events-none z-0" style={{ top: "-20%", right: "-15%", width: 600, height: 600, borderRadius: "50%", background: `radial-gradient(circle,${th.orbA} 0%,transparent 65%)`, filter: "blur(80px)", animation: "orb-drift 18s ease-in-out infinite" }} />
      <div className="fixed pointer-events-none z-0" style={{ bottom: "-25%", left: "-15%", width: 700, height: 700, borderRadius: "50%", background: `radial-gradient(circle,${th.orbB} 0%,transparent 65%)`, filter: "blur(100px)", animation: "orb-drift-b 22s ease-in-out infinite" }} />
    </>
  );
}
