import { NavLink, Outlet, useLocation } from "react-router";
import { Flame, Search, Bell } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { useProfile } from "@/app/state/profile-context";
import { Background } from "@/app/components/common/Background";
import { Logo } from "@/app/components/common/Logo";
import { NAV_ITEMS } from "@/app/data/mock";

export function MainLayout() {
  const th = useTh();
  const { profile } = useProfile();
  const location = useLocation();
  const name = profile.name.split(" ")[0] || "Alex";
  const current = NAV_ITEMS.find((n) => n.path === location.pathname) ?? NAV_ITEMS[0];

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: th.bg, fontFamily: "'Inter',sans-serif" }}>
      <Background />
      <aside className="relative z-10 flex flex-col h-full shrink-0" style={{ width: 220, background: th.sidebar, backdropFilter: "blur(24px)", borderRight: `1px solid ${th.sidebarB}`, boxShadow: th.isDark ? "none" : "4px 0 24px rgba(155,93,229,0.06)" }}>
        <div className="px-6 py-6" style={{ borderBottom: `1px solid ${th.sidebarB}` }}><Logo h={26} /></div>
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(({ id, Icon, label, path }) => (
            <NavLink key={id} to={path} end={path === "/"} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-left transition-all"
              style={({ isActive }) => isActive ? { background: th.navA, border: `1px solid ${th.navAB}`, color: th.navAC } : { color: th.fg3, background: "transparent", border: "1px solid transparent" }}>
              <Icon className="w-4 h-4 shrink-0" />{label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4" style={{ borderTop: `1px solid ${th.sidebarB}` }}>
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black shrink-0" style={{ background: "linear-gradient(135deg,#9B5DE5,#DDAEEA)", color: "#08060F" }}>{name[0]}</div>
            <div className="min-w-0"><div className="text-sm font-semibold truncate" style={{ color: th.fg }}>{name}</div><div className="text-xs truncate" style={{ color: th.fg3 }}>{profile.profession || "Apprenant IA"}</div></div>
          </div>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col relative z-10 overflow-hidden">
        <div className="shrink-0 flex items-center gap-4 px-8 py-4" style={{ borderBottom: `1px solid ${th.sep}`, background: th.topbar, backdropFilter: "blur(20px)" }}>
          <div className="flex-1"><div className="text-xs font-bold uppercase tracking-widest" style={{ color: th.fg3 }}>{current.label}</div></div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold" style={{ background: "rgba(251,146,60,0.1)", border: "1px solid rgba(251,146,60,0.25)", color: "#FB923C" }}><Flame className="w-3.5 h-3.5" />7 jours</div>
          <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl w-52" style={{ background: th.inputBg, border: `1px solid ${th.inputB}` }}>
            <Search className="w-3.5 h-3.5 shrink-0" style={{ color: th.fg3 }} />
            <input placeholder="Recherche…" className="flex-1 bg-transparent text-sm outline-none" style={{ color: th.fg2 }} />
          </div>
          <button className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: th.inputBg, border: `1px solid ${th.inputB}` }}>
            <Bell className="w-4 h-4" style={{ color: th.fg3 }} />
          </button>
        </div>

        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
