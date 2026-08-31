import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router";
import { Search, Bell, Plus, CalendarClock, ChevronDown, Menu, X } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { useAuth } from "@/app/state/auth-context";
import { useProfile } from "@/app/state/profile-context";
import { isStaff } from "@/app/lib/permissions";
import { Background } from "@/app/components/common/Background";
import { Logo } from "@/app/components/common/Logo";
import { Avatar } from "@/app/components/common/Avatar";
import { cx } from "@/app/lib/cx";
import { NAV_ITEMS } from "@/app/data/mock";

export function MainLayout() {
  const th = useTh();
  const { role } = useAuth();
  const { profile } = useProfile();
  const name = profile.name.split(" ")[0] || "Alex";
  const [navOpen, setNavOpen] = useState(false);
  const location = useLocation();

  useEffect(() => { setNavOpen(false); }, [location.pathname]);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: th.bg, fontFamily: "'Funnel Display',sans-serif" }}>
      <Background />

      {navOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setNavOpen(false)} />
      )}

      <aside className={cx(
        "fixed inset-y-0 left-0 z-40 flex flex-col h-full w-[240px] shrink-0 transition-transform duration-300 ease-out lg:static lg:z-auto lg:w-[232px] lg:translate-x-0",
        navOpen ? "translate-x-0" : "-translate-x-full",
      )} style={{ background: th.sidebar, borderRight: `1px solid ${th.sidebarB}` }}>
        <div className="px-6 py-6 flex items-center justify-between" style={{ borderBottom: `1px solid ${th.sidebarB}` }}>
          <Logo h={26} />
          <button className="lg:hidden w-8 h-8 -mr-1.5 rounded-full flex items-center justify-center shrink-0" onClick={() => setNavOpen(false)} style={{ color: th.fg3 }}>
            <X className="w-4 h-4" />
          </button>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ id, Icon, label, path }) => {
            // Pour l'admin, "Rendez-vous" (calendrier perso élève) cède sa
            // place à "Planning" ici et redescend dans le bloc staff — un
            // admin/formateur n'a pas de formation à soi, donc pas de RDV
            // perso à réserver, alors que Planning est sa vraie fonction.
            if (id === "calendar" && role === "admin") {
              return (
                <NavLink key="planning" to="/admin/planning" onClick={() => setNavOpen(false)} className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-full text-sm font-medium text-left transition-all"
                  style={({ isActive }) => isActive ? { background: "linear-gradient(135deg,#b58de0,#dbacf0)", color: "#fff", fontWeight: 700 } : { color: th.fg3, background: "transparent" }}>
                  <CalendarClock className="w-4 h-4 shrink-0" />Planning
                </NavLink>
              );
            }
            return (
              <NavLink key={id} to={path} end={path === "/"} onClick={() => setNavOpen(false)} className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-full text-sm font-medium text-left transition-all"
                style={({ isActive }) => isActive ? { background: "linear-gradient(135deg,#b58de0,#dbacf0)", color: "#fff", fontWeight: 700 } : { color: th.fg3, background: "transparent" }}>
                <Icon className="w-4 h-4 shrink-0" />{label}
              </NavLink>
            );
          })}
        </nav>
        {isStaff(role) && (
          <div className="px-3 pb-3 space-y-1.5">
            <NavLink to="/admin/courses" onClick={() => setNavOpen(false)} className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-full text-sm font-semibold transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg,#b58de0,#dbacf0)", color: "#fff" }}>
              <Plus className="w-4 h-4 shrink-0" />
              Créer un cours
            </NavLink>
            {role === "admin" && (
              <NavLink to="/calendar" onClick={() => setNavOpen(false)} className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-full text-sm font-medium transition-all"
                style={({ isActive }) => isActive ? { background: "linear-gradient(135deg,#b58de0,#dbacf0)", color: "#fff", fontWeight: 700 } : { color: th.fg3, background: "transparent" }}>
                <CalendarClock className="w-4 h-4 shrink-0" />Rendez-vous
              </NavLink>
            )}
          </div>
        )}
        <div className="p-4" style={{ borderTop: `1px solid ${th.sidebarB}` }}>
          <button className="w-full flex items-center gap-3 px-2 py-1 rounded-xl transition-opacity hover:opacity-80">
            <Avatar url={profile.avatarUrl} size={36} />
            <div className="min-w-0 flex-1 text-left"><div className="text-sm font-semibold truncate" style={{ color: th.fg }}>{name}</div><div className="text-xs truncate" style={{ color: th.fg3 }}>{profile.profession || "Apprenant IA"}</div></div>
            <ChevronDown className="w-4 h-4 shrink-0" style={{ color: th.fg3 }} />
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col relative z-10 overflow-hidden">
        <div className="shrink-0 flex items-center justify-between gap-3 px-4 sm:px-6 lg:px-8 py-3 sm:py-4" style={{ borderBottom: `1px solid ${th.sep}`, background: th.topbar }}>
          <div className="flex items-center gap-3 min-w-0 lg:hidden">
            <button className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: th.inputBg, border: `1px solid ${th.inputB}` }} onClick={() => setNavOpen(true)}>
              <Menu className="w-4 h-4" style={{ color: th.fg3 }} />
            </button>
            <Logo h={20} />
          </div>
          <div className="flex items-center gap-2.5 px-4 py-2 rounded-full w-full max-w-[220px] sm:max-w-none sm:w-64 hidden sm:flex" style={{ background: th.inputBg, border: `1px solid ${th.inputB}` }}>
            <Search className="w-3.5 h-3.5 shrink-0" style={{ color: th.fg3 }} />
            <input placeholder="Recherche…" className="flex-1 min-w-0 bg-transparent text-sm outline-none" style={{ color: th.fg2 }} />
          </div>
          <div className="flex items-center gap-3 shrink-0 ml-auto sm:ml-0">
            <button className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 sm:hidden" style={{ background: th.inputBg, border: `1px solid ${th.inputB}` }}>
              <Search className="w-4 h-4" style={{ color: th.fg3 }} />
            </button>
            <button className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: th.inputBg, border: `1px solid ${th.inputB}` }}>
              <Bell className="w-4 h-4" style={{ color: th.fg3 }} />
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
