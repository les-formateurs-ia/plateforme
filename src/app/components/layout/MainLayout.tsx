import { NavLink, Outlet } from "react-router";
import { Search, Bell, Plus, CalendarClock, ChevronDown } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { useAuth } from "@/app/state/auth-context";
import { useProfile } from "@/app/state/profile-context";
import { isStaff } from "@/app/lib/permissions";
import { Background } from "@/app/components/common/Background";
import { Logo } from "@/app/components/common/Logo";
import { NAV_ITEMS } from "@/app/data/mock";

export function MainLayout() {
  const th = useTh();
  const { role } = useAuth();
  const { profile } = useProfile();
  const name = profile.name.split(" ")[0] || "Alex";

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: th.bg, fontFamily: "'Funnel Display',sans-serif" }}>
      <Background />
      <aside className="relative z-10 flex flex-col h-full shrink-0" style={{ width: 232, background: th.sidebar, borderRight: `1px solid ${th.sidebarB}` }}>
        <div className="px-6 py-6" style={{ borderBottom: `1px solid ${th.sidebarB}` }}><Logo h={26} /></div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ id, Icon, label, path }) => (
            <NavLink key={id} to={path} end={path === "/"} className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-full text-sm font-medium text-left transition-all"
              style={({ isActive }) => isActive ? { background: "linear-gradient(135deg,#b58de0,#dbacf0)", color: "#fff", fontWeight: 700 } : { color: th.fg3, background: "transparent" }}>
              <Icon className="w-4 h-4 shrink-0" />{label}
            </NavLink>
          ))}
        </nav>
        {isStaff(role) && (
          <div className="px-3 pb-3 space-y-1.5">
            <NavLink to="/admin/courses" className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-full text-sm font-semibold transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg,#b58de0,#dbacf0)", color: "#fff" }}>
              <Plus className="w-4 h-4 shrink-0" />
              Créer un cours
            </NavLink>
            <NavLink to="/admin/appointments" className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-full text-sm font-medium transition-all"
              style={({ isActive }) => isActive ? { background: "linear-gradient(135deg,#b58de0,#dbacf0)", color: "#fff", fontWeight: 700 } : { color: th.fg3, background: "transparent" }}>
              <CalendarClock className="w-4 h-4 shrink-0" />Rendez-vous élèves
            </NavLink>
          </div>
        )}
        <div className="p-4" style={{ borderTop: `1px solid ${th.sidebarB}` }}>
          <button className="w-full flex items-center gap-3 px-2 py-1 rounded-xl transition-opacity hover:opacity-80">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black shrink-0" style={{ background: "linear-gradient(135deg,#b58de0,#dbacf0)", color: "#fff" }}>{name[0]}</div>
            <div className="min-w-0 flex-1 text-left"><div className="text-sm font-semibold truncate" style={{ color: th.fg }}>{name}</div><div className="text-xs truncate" style={{ color: th.fg3 }}>{profile.profession || "Apprenant IA"}</div></div>
            <ChevronDown className="w-4 h-4 shrink-0" style={{ color: th.fg3 }} />
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col relative z-10 overflow-hidden">
        <div className="shrink-0 flex items-center justify-end gap-3 px-8 py-4" style={{ borderBottom: `1px solid ${th.sep}`, background: th.topbar }}>
          <div className="flex items-center gap-2.5 px-4 py-2 rounded-full w-64" style={{ background: th.inputBg, border: `1px solid ${th.inputB}` }}>
            <Search className="w-3.5 h-3.5 shrink-0" style={{ color: th.fg3 }} />
            <input placeholder="Recherche…" className="flex-1 bg-transparent text-sm outline-none" style={{ color: th.fg2 }} />
          </div>
          <button className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: th.inputBg, border: `1px solid ${th.inputB}` }}>
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
