import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router";
import { Search, Plus, CalendarClock, Menu, X, Bug, Building2 } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { useAuth } from "@/app/state/auth-context";
import { useProfile } from "@/app/state/profile-context";
import { isStaff, isAdmin } from "@/app/lib/permissions";
import { useStaffBasePath } from "@/app/lib/staffBase";
import { Background } from "@/app/components/common/Background";
import { Logo } from "@/app/components/common/Logo";
import { Avatar } from "@/app/components/common/Avatar";
import { NotificationBell } from "@/app/components/layout/NotificationBell";
import { useBulkGeneration } from "@/app/state/bulk-generation-context";
import { ReportIncidentDialog } from "@/app/components/layout/ReportIncidentDialog";
import { cx } from "@/app/lib/cx";
import { NAV_ITEMS } from "@/app/data/mock";
import { supabase } from "@/app/lib/supabase/client";
import { countUnreadIncidentNotifications } from "@/app/lib/notifications";

const STAFF_SPACE_KEY = "staffSpace";

function readStoredStaffSpace(): "cpf" | "entreprise" {
  try {
    return localStorage.getItem(STAFF_SPACE_KEY) === "entreprise" ? "entreprise" : "cpf";
  } catch {
    return "cpf";
  }
}

export function MainLayout() {
  const th = useTh();
  const { role, user, companyId } = useAuth();
  const staffBase = useStaffBasePath();
  const { profile } = useProfile();
  const name = profile.name.split(" ")[0] || "Alex";
  const [navOpen, setNavOpen] = useState(false);
  const [unreadIncidents, setUnreadIncidents] = useState(0);
  const location = useLocation();
  const gen = useBulkGeneration();
  const genPct = gen.total > 0 ? Math.round((gen.done / gen.total) * 100) : 0;
  // Le staff bascule entre deux espaces (choisis sur "/", cf. RootGate) : tant
  // qu'il navigue sous /entreprise, la barre latérale ne montre plus que ce
  // qui concerne l'entreprise — le reste (Pratique IA, Élèves, RDV, Modifier
  // les formations) appartient au CPF et redeviendra visible en y retournant
  // (logo cliquable → "/", qui renvoie vers le choix). "/profile" est
  // partagé entre les deux espaces (même page pour tout le monde) : on ne
  // le laisse pas faire basculer l'espace mémorisé, sinon "Mon profil"
  // depuis Entreprise renvoyait visuellement vers la nav CPF complète.
  const [space, setSpace] = useState<"cpf" | "entreprise">(
    () => (location.pathname.startsWith("/entreprise") ? "entreprise" : readStoredStaffSpace()),
  );
  useEffect(() => {
    if (location.pathname === "/profile") return;
    const next = location.pathname.startsWith("/entreprise") ? "entreprise" : "cpf";
    setSpace(next);
    try { localStorage.setItem(STAFF_SPACE_KEY, next); } catch { /* ignore */ }
  }, [location.pathname]);
  const entrepriseMode = isStaff(role) && space === "entreprise";

  useEffect(() => { setNavOpen(false); }, [location.pathname]);

  // Pastille "nouveau signalement" à côté de l'onglet Incidents — se recharge
  // en temps réel (un incident notifie tous les admins, cf. trigger
  // notify_admins_of_incident) et se vide dès qu'on ouvre l'onglet
  // (AdminIncidentsPage marque ces notifications comme lues à son montage).
  useEffect(() => {
    if (!isAdmin(role) || !user) { setUnreadIncidents(0); return; }
    let cancelled = false;
    countUnreadIncidentNotifications(user.id).then((n) => { if (!cancelled) setUnreadIncidents(n); }).catch(console.error);
    const channel = supabase
      .channel(`incident-notifications:${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => { if ((payload.new as { type: string }).type === "incident_reported") setUnreadIncidents((n) => n + 1); },
      )
      .subscribe();
    return () => { cancelled = true; void supabase.removeChannel(channel); };
  }, [role, user]);

  useEffect(() => {
    if (location.pathname === "/admin/incidents") setUnreadIncidents(0);
  }, [location.pathname]);

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
          <Link to="/" onClick={() => setNavOpen(false)} className="transition-opacity hover:opacity-80" title={isStaff(role) ? "Changer d'espace (CPF / Entreprise)" : "Accueil"}>
            <Logo h={26} />
          </Link>
          <button className="lg:hidden w-8 h-8 -mr-1.5 rounded-full flex items-center justify-center shrink-0" onClick={() => setNavOpen(false)} style={{ color: th.fg3 }}>
            <X className="w-4 h-4" />
          </button>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.filter(({ id }) => id !== "profile").map(({ id, Icon, label, path }) => {
            // Espace Entreprise : seuls "Entreprise" et "Mon profil" restent
            // (ajoutés séparément plus bas) — tout le reste de cette liste
            // est un concept CPF (Pratique IA, Élèves, Rendez-vous...).
            if (entrepriseMode) return null;
            // "Tableau de bord", "Mes leçons" et "Mon Agent IA" sont pensés
            // pour un parcours élève (progression, agent personnel, gains)
            // — pas de version admin/formateur pour l'instant, donc masqués
            // pour le staff plutôt que d'afficher une page vide/hors-sujet.
            if ((id === "dashboard" || id === "lessons" || id === "agent") && isStaff(role)) return null;
            // Collaborateur entreprise : parcours CPF (leçons, pratique,
            // agent, RDV) hors-sujet, seul "Tableau de bord" (son espace
            // entreprise) et "Mon profil" restent pertinents.
            if ((id === "lessons" || id === "practice" || id === "practice2" || id === "studio" || id === "agent" || id === "calendar") && companyId) return null;
            // Pour l'admin/formateur, "Élèves (& formateurs)" (gestion, même
            // page pour les deux rôles — le formateur n'y voit que ses
            // propres élèves, pas d'onglet Formateurs) s'ajoute juste avant
            // "Rendez-vous", leur calendrier de RDV perso.
            if (id === "calendar" && isStaff(role)) {
              return [
                <NavLink key="planning" to={`${staffBase}/planning`} onClick={() => setNavOpen(false)} className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-full text-sm font-medium text-left transition-all"
                  style={({ isActive }) => isActive ? { background: `linear-gradient(135deg,${th.grad1},${th.grad2})`, color: "#fff", fontWeight: 700 } : { color: th.fg3, background: "transparent" }}>
                  <CalendarClock className="w-4 h-4 shrink-0" />{role === "admin" ? "Élèves & formateurs" : "Élèves"}
                </NavLink>,
                <NavLink key={id} to="/planning" onClick={() => setNavOpen(false)} className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-full text-sm font-medium text-left transition-all"
                  style={({ isActive }) => isActive ? { background: `linear-gradient(135deg,${th.grad1},${th.grad2})`, color: "#fff", fontWeight: 700 } : { color: th.fg3, background: "transparent" }}>
                  <Icon className="w-4 h-4 shrink-0" />{label}
                </NavLink>,
              ];
            }
            return (
              <NavLink key={id} to={path} end onClick={() => setNavOpen(false)} className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-full text-sm font-medium text-left transition-all"
                style={({ isActive }) => isActive ? { background: `linear-gradient(135deg,${th.grad1},${th.grad2})`, color: "#fff", fontWeight: 700 } : { color: th.fg3, background: "transparent" }}>
                <Icon className="w-4 h-4 shrink-0" />{label}
              </NavLink>
            );
          })}
          {entrepriseMode && (
            <NavLink to="/entreprise" onClick={() => setNavOpen(false)} className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-full text-sm font-medium text-left transition-all"
              style={({ isActive }) => isActive ? { background: `linear-gradient(135deg,${th.grad1},${th.grad2})`, color: "#fff", fontWeight: 700 } : { color: th.fg3, background: "transparent" }}>
              <Building2 className="w-4 h-4 shrink-0" />Entreprise
            </NavLink>
          )}
          {isAdmin(role) && !entrepriseMode && (
            <NavLink to="/admin/incidents" onClick={() => setNavOpen(false)} className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-full text-sm font-medium text-left transition-all"
              style={({ isActive }) => isActive ? { background: `linear-gradient(135deg,${th.grad1},${th.grad2})`, color: "#fff", fontWeight: 700 } : { color: th.fg3, background: "transparent" }}>
              <span className="relative shrink-0">
                <Bug className="w-4 h-4" />
                {unreadIncidents > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full" style={{ background: "#fb7185" }} />
                )}
              </span>
              Incidents
            </NavLink>
          )}
          {(() => {
            const profileItem = NAV_ITEMS.find(({ id }) => id === "profile");
            if (!profileItem) return null;
            const { id, Icon, label, path } = profileItem;
            return (
              <NavLink key={id} to={path} onClick={() => setNavOpen(false)} className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-full text-sm font-medium text-left transition-all"
                style={({ isActive }) => isActive ? { background: `linear-gradient(135deg,${th.grad1},${th.grad2})`, color: "#fff", fontWeight: 700 } : { color: th.fg3, background: "transparent" }}>
                <Icon className="w-4 h-4 shrink-0" />{label}
              </NavLink>
            );
          })()}
        </nav>
        {isStaff(role) && !entrepriseMode && (
          <div className="px-3 pb-3 space-y-1.5">
            {gen.running && (
              <div className="rounded-xl px-3 py-2.5" style={{ background: th.isDark ? "rgba(255,255,255,0.05)" : "rgba(15,14,20,0.03)", border: `1px solid ${th.inputB}` }}>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-[11px] font-semibold truncate" style={{ color: th.fg2 }}>Génération : {gen.courseName}</span>
                  <span className="text-[11px] font-bold shrink-0" style={{ color: th.navAC }}>{genPct}%</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: th.isDark ? "rgba(255,255,255,0.08)" : "rgba(15,14,20,0.06)" }}>
                  <div className="h-full rounded-full transition-all duration-300" style={{ width: `${genPct}%`, background: `linear-gradient(90deg,${th.grad1},${th.grad2})` }} />
                </div>
                <div className="text-[10px] mt-1" style={{ color: th.fg3 }}>{gen.done}/{gen.total} leçon{gen.total > 1 ? "s" : ""}</div>
              </div>
            )}
            <NavLink to={`${staffBase}/courses`} onClick={() => setNavOpen(false)} className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-full text-sm font-semibold transition-all hover:opacity-90"
              style={{ background: `linear-gradient(135deg,${th.grad1},${th.grad2})`, color: "#fff" }}>
              <Plus className="w-4 h-4 shrink-0" />
              Modifier les formations
            </NavLink>
          </div>
        )}
        <div className="p-4" style={{ borderTop: `1px solid ${th.sidebarB}` }}>
          <Link to="/profile" onClick={() => setNavOpen(false)} className="w-full flex items-center gap-3 px-2 py-1 rounded-xl cursor-pointer transition-opacity hover:opacity-80">
            <Avatar url={profile.avatarUrl} size={36} />
            <div className="min-w-0 flex-1 text-left"><div className="text-sm font-semibold truncate" style={{ color: th.fg }}>{name}</div><div className="text-xs truncate" style={{ color: th.fg3 }}>{profile.profession || "Apprenant IA"}</div></div>
          </Link>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col relative z-10 overflow-hidden">
        <div className="shrink-0 flex items-center justify-between gap-3 px-4 sm:px-6 lg:px-8 py-3 sm:py-4" style={{ borderBottom: `1px solid ${th.sep}`, background: th.topbar }}>
          <div className="flex items-center gap-3 min-w-0 lg:hidden">
            <button className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: th.inputBg, border: `1px solid ${th.inputB}` }} onClick={() => setNavOpen(true)}>
              <Menu className="w-4 h-4" style={{ color: th.fg3 }} />
            </button>
            <Link to="/" className="transition-opacity hover:opacity-80"><Logo h={20} /></Link>
          </div>
          <div className="flex items-center gap-2.5 px-4 py-2 rounded-full w-full max-w-[220px] sm:max-w-none sm:w-64 hidden sm:flex" style={{ background: th.inputBg, border: `1px solid ${th.inputB}` }}>
            <Search className="w-3.5 h-3.5 shrink-0" style={{ color: th.fg3 }} />
            <input placeholder="Recherche…" className="flex-1 min-w-0 bg-transparent text-sm outline-none" style={{ color: th.fg2 }} />
          </div>
          <div className="flex items-center gap-3 shrink-0 ml-auto sm:ml-0">
            <button className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 sm:hidden" style={{ background: th.inputBg, border: `1px solid ${th.inputB}` }}>
              <Search className="w-4 h-4" style={{ color: th.fg3 }} />
            </button>
            <ReportIncidentDialog />
            <NotificationBell />
          </div>
        </div>

        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
