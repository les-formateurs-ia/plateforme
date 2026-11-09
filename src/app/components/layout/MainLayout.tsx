import { useEffect, useLayoutEffect, useState } from "react";
import { Link, Navigate, NavLink, Outlet, useLocation } from "react-router";
import { Menu, X, Bug, ScanEye, LogOut, LayoutDashboard, CalendarClock, ClipboardList, Users, GraduationCap, Target, FileText, Code2, Sparkles, LayoutGrid, BookOpen, Megaphone, type LucideIcon } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { useAuth } from "@/app/state/auth-context";
import { useProfile } from "@/app/state/profile-context";
import { useImpersonation } from "@/app/state/impersonation-context";
import { AccessGate } from "@/app/components/layout/LearnerAccess";
import { isStaff, isAdmin } from "@/app/lib/permissions";
import { useStaffBasePath } from "@/app/lib/staffBase";
import { Background } from "@/app/components/common/Background";
import { Logo } from "@/app/components/common/Logo";
import { Avatar } from "@/app/components/common/Avatar";
import { AiBudgetBar } from "@/app/components/common/AiBudgetBar";
import { NotificationBell } from "@/app/components/layout/NotificationBell";
import { ImpersonationBanner } from "@/app/components/layout/ImpersonationBanner";
import { useBulkGeneration } from "@/app/state/bulk-generation-context";
import { ReportIncidentDialog } from "@/app/components/layout/ReportIncidentDialog";
import { CommandPalette, CommandTrigger } from "@/app/components/layout/CommandPalette";
import { cx } from "@/app/lib/cx";
import { NAV_ITEMS, NAV_GROUP_LABELS } from "@/app/data/mock";
import { supabase } from "@/app/lib/supabase/client";
import { countUnreadIncidentNotifications } from "@/app/lib/notifications";
import { isPathAllowedDuringExam, useCertification } from "@/app/state/certification-context";

// Navigation de l'équipe (admin et formateur) : un seul espace, groupé par
// usage. Le formateur n'y voit que la partie pédagogique (ses sessions, ses
// clients, ses élèves) ; prospects, modèles de documents, studio de contenu
// et incidents sont réservés à l'admin.
type StaffNavItem = { to: string; label: string; Icon: LucideIcon; end?: boolean };
function staffNav(admin: boolean, base: string): { title: string; items: StaffNavItem[] }[] {
  return [
    { title: "Pilotage", items: [
      { to: "/pilotage", label: "Tableau de bord", Icon: LayoutDashboard },
      { to: "/planning", label: "Disponibilités & RDV", Icon: CalendarClock },
      ...(admin ? [{ to: "/prospects", label: "Prospects", Icon: Target }] : []),
    ] },
    { title: "Formations", items: [
      { to: "/sessions", label: admin ? "Sessions" : "Mes sessions", Icon: ClipboardList },
      { to: "/clients", label: admin ? "Clients" : "Mes clients", Icon: Users },
      { to: `${base}/planning`, label: admin ? "Élèves & formateurs" : "Mes élèves", Icon: GraduationCap },
    ] },
    { title: "Pédagogie", items: [
      { to: `${base}/courses`, label: "Catalogue e-learning", Icon: BookOpen },
      { to: "/admin/ai-detection-gallery", label: "Galerie Détection IA", Icon: ScanEye },
      { to: "/practice", label: "Exercices", Icon: Code2, end: true },
      { to: "/studio", label: "Le Studio", Icon: Sparkles, end: true },
      { to: "/hub", label: "Hub IA", Icon: LayoutGrid, end: true },
    ] },
    ...(admin ? [{ title: "Administration", items: [
      { to: "/sessions/modeles", label: "Modèles de documents", Icon: FileText },
      { to: "/admin/studio-contenu", label: "Studio contenu", Icon: Megaphone },
    ] }] : []),
  ];
}

export function MainLayout() {
  const th = useTh();
  const { role, user, companyId, signOut } = useAuth();
  // Onglet actif : fond gris léger, texte à l'encre et filet vertical à la
  // couleur du rôle (le seul endroit où elle apparaît dans la navigation).
  const navItemClass = ({ isActive }: { isActive: boolean }) => cx(
    "nav-item relative w-full flex items-center gap-3 px-3.5 py-2.5 rounded-[4px] text-[14px] text-left transition-colors",
    isActive ? "font-bold" : "font-medium hover-fine:text-[var(--ink)]",
  );
  const navItemStyle = ({ isActive }: { isActive: boolean }) => isActive
    ? { background: th.navA, color: th.fg, ["--nav-mark" as string]: th.roleGrad }
    : { color: th.fg2, background: "transparent" };
  const { isImpersonating } = useImpersonation();
  const staffBase = useStaffBasePath();
  const { profile } = useProfile();
  const name = profile.name.split(" ")[0] || "Alex";
  const [navOpen, setNavOpen] = useState(false);
  const [unreadIncidents, setUnreadIncidents] = useState(0);
  const location = useLocation();
  // Épreuve de certification en cours : accueil (= l'épreuve), Studio et profil uniquement.
  const { examMode } = useCertification();
  const gen = useBulkGeneration();
  const genPct = gen.total > 0 ? Math.round((gen.done / gen.total) * 100) : 0;
  // Collaborateur entreprise : pas de barre latérale, seulement un bandeau
  // logo + Déconnexion. L'équipe garde la même barre latérale partout.
  const sidebarHidden = !!companyId;
  const staff = isStaff(role);
  const studentNav = !staff && !companyId;

  useEffect(() => { setNavOpen(false); }, [location.pathname]);

  // Les pages mobiles défilent avec le document : une nouvelle route repart
  // en haut, comme lors du montage de l'ancien conteneur défilant.
  useLayoutEffect(() => {
    if (window.matchMedia("(max-width: 1023px)").matches) {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
  }, [location.pathname]);

  useEffect(() => {
    if (!navOpen) return;
    const mobile = window.matchMedia("(max-width: 1023px)");
    const previousOverflow = document.body.style.overflow;
    const syncScrollLock = () => {
      document.body.style.overflow = mobile.matches ? "hidden" : previousOverflow;
    };
    syncScrollLock();
    mobile.addEventListener("change", syncScrollLock);
    return () => {
      mobile.removeEventListener("change", syncScrollLock);
      document.body.style.overflow = previousOverflow;
    };
  }, [navOpen]);

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
    <div
      className="main-layout flex flex-col h-dvh overflow-x-hidden overflow-y-hidden"
      style={{
        background: th.bg,
        fontFamily: "'Funnel Display',sans-serif",
        // Le bureau et les outils à panneaux gardent une hauteur bornée.
        // mobile-layout.css laisse les pages ordinaires défiler avec le
        // document pour que Safari puisse rétracter ses barres d'outils.
      }}
    >
      <ImpersonationBanner />
      {!examMode && <CommandPalette />}
      <div className="main-layout-body flex flex-1 min-h-0 overflow-hidden">
      <Background />

      {navOpen && !sidebarHidden && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setNavOpen(false)} />
      )}

      {/* Mobile (< lg) : "îlot" flottant — collé au bord gauche (coins gauches
          carrés, invisibles car hors-écran/à fleur de bord) mais détaché du
          haut et du bas (marge + safe-area) avec coins arrondis à droite
          uniquement, comme un panneau qui flotte plutôt qu'un tiroir plein
          écran. Desktop (lg:) inchangé : colonne statique pleine hauteur,
          coins carrés, bord droit simple. */}
      {!sidebarHidden && (
      <aside className={cx(
        // border côté classes (pas inline) : lg: doit pouvoir retirer le
        // haut/bas sans que le style inline (non responsive) ne les réimpose.
        "fixed left-0 z-40 flex flex-col w-[240px] shrink-0 overflow-hidden transition-[transform,visibility] duration-300 ease-out border border-l-0 rounded-tr-[10px] rounded-br-[10px] shadow-[0_30px_60px_-30px_rgba(0,0,0,0.45)] lg:static lg:visible lg:z-auto lg:inset-y-0 lg:h-full lg:w-[232px] lg:border-t-0 lg:border-b-0 lg:rounded-none lg:shadow-none lg:translate-x-0",
        navOpen ? "visible translate-x-0" : "invisible -translate-x-full",
      )} style={{
        background: th.sidebar,
        borderColor: th.sidebarB,
        top: "max(0.75rem, env(safe-area-inset-top))",
        bottom: "max(0.75rem, env(safe-area-inset-bottom))",
      }}>
        <div className="px-6 py-6 flex items-center justify-between" style={{ borderBottom: `1px solid ${th.sidebarB}` }}>
          <Link to="/" onClick={() => setNavOpen(false)} className="grid gap-2.5 transition-opacity hover-fine:opacity-80" title="Accueil">
            <Logo h={26} />
            {/* Repère de l'espace courant : pastille à la couleur du rôle. */}
            <span className="eyebrow flex items-center gap-2" style={{ color: th.fg3 }}>
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: th.roleGrad }} />
              {role === "admin" ? "Administration" : role === "formateur" ? "Espace formateur" : "Espace apprenant"}
            </span>
          </Link>
          <button aria-label="Fermer le menu" className="lg:hidden w-8 h-8 -mr-1.5 rounded-[2px] flex items-center justify-center shrink-0" onClick={() => setNavOpen(false)} style={{ color: th.fg }}>
            <X className="w-4 h-4" />
          </button>
        </div>
        {studentNav && !examMode && <div className="px-3 pt-4"><CommandTrigger /></div>}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {staff && staffNav(isAdmin(role), staffBase).map((group, gi) => (
            <div key={group.title} className="space-y-1">
              <p className={cx("eyebrow px-3.5 pb-1", gi === 0 ? "pt-1" : "pt-4")} style={{ color: th.fg3 }}>{group.title}</p>
              {group.items.map(({ to, label, Icon, end }) => (
                <NavLink key={to} to={to} end={end} onClick={() => setNavOpen(false)} className={navItemClass} style={navItemStyle}>
                  <Icon className="w-4 h-4 shrink-0" />{label}
                </NavLink>
              ))}
            </div>
          ))}
          {!staff && NAV_ITEMS.filter(({ id }) => id !== "profile").map(({ id, Icon, label, path, group }, index, items) => {
            if (examMode && id !== "dashboard" && id !== "studio") return null;
            // Collaborateur entreprise : parcours CPF (leçons, pratique,
            // agent, RDV) hors-sujet, seul "Tableau de bord" (son espace
            // entreprise) et "Mon profil" restent pertinents.
            if ((id === "lessons" || id === "certification" || id === "practice" || id === "studio" || id === "hub" || id === "agent" || id === "calendar") && companyId) return null;
            // Élève CPF : la navigation est groupée par intention (apprendre,
            // pratiquer, être accompagné), un sur-titre ouvre chaque groupe.
            const groupStart = studentNav && group && items[index - 1]?.group !== group;
            return (
              <div key={id}>
                {groupStart && (
                  <p className={cx("eyebrow px-3.5 pb-2", index === 0 ? "pt-1" : "pt-5")} style={{ color: th.fg3 }}>{NAV_GROUP_LABELS[group]}</p>
                )}
                <NavLink to={path} end onClick={() => setNavOpen(false)} className={navItemClass}
                  style={navItemStyle}>
                  <Icon className="w-4 h-4 shrink-0" />{label}
                </NavLink>
              </div>
            );
          })}
          {isAdmin(role) && (
            <NavLink key="incidents" to="/admin/incidents" onClick={() => setNavOpen(false)} className={navItemClass}
              style={navItemStyle}>
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
              <NavLink key={id} to={path} onClick={() => setNavOpen(false)} className={navItemClass}
                style={navItemStyle}>
                <Icon className="w-4 h-4 shrink-0" />{label}
              </NavLink>
            );
          })()}
        </nav>
        {staff && gen.running && (
          <div className="px-3 pb-3">
            <div className="rounded-[4px] px-3 py-2.5" style={{ border: `1px solid ${th.sep}` }}>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-[11px] font-semibold truncate" style={{ color: th.fg2 }}>Génération : {gen.courseName}</span>
                <span className="text-[11px] font-bold shrink-0" style={{ color: th.navAC }}>{genPct}%</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: th.navA }}>
                <div className="h-full rounded-full transition-all duration-300" style={{ width: `${genPct}%`, background: th.iris }} />
              </div>
              <div className="text-[10px] mt-1" style={{ color: th.fg3 }}>{gen.done}/{gen.total} leçon{gen.total > 1 ? "s" : ""}</div>
            </div>
          </div>
        )}
        <div className="px-4 pt-3 pb-2 flex items-center gap-2" style={{ borderTop: `1px solid ${th.sidebarB}` }}>
          <ReportIncidentDialog />
          <NotificationBell />
        </div>
        {role === "student" && (
          <div className="px-4 pt-1">
            <AiBudgetBar spentUsd={profile.spentUsd} capUsd={profile.budgetUsd} size="sm" />
          </div>
        )}
        <div className="px-4 pb-4 pt-2">
          <Link to="/profile" onClick={() => setNavOpen(false)} className="w-full flex items-center gap-3 px-2 py-1 rounded-[4px] cursor-pointer transition-opacity hover-fine:opacity-80">
            <Avatar url={profile.avatarUrl} size={36} />
            <div className="min-w-0 flex-1 text-left"><div className="text-sm font-semibold truncate" style={{ color: th.fg }}>{name}</div><div className="text-xs truncate" style={{ color: th.fg3 }}>{profile.profession || "Apprenant IA"}</div></div>
          </Link>
        </div>
      </aside>
      )}

      <div className="main-layout-main flex-1 min-w-0 flex flex-col relative z-10 overflow-hidden">
        {/* Seul le bouton flotte au-dessus de la page, sans bandeau opaque. */}
        {sidebarHidden ? (
          <header className="shrink-0 flex items-center justify-between gap-3 px-4 sm:px-6 lg:px-8 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-1">
            <Link to="/" className="transition-opacity hover:opacity-80" title="Accueil">
              <Logo h={22} />
            </Link>
            <button type="button" onClick={() => void signOut()} className="sweep inline-flex items-center gap-1.5 rounded-[2px] px-3 min-h-9 text-xs font-semibold"
              style={{ color: th.fg, border: `1px solid ${th.ink}` }}>
              <LogOut className="w-3.5 h-3.5" />Déconnexion
            </button>
          </header>
        ) : (
        <button aria-label="Ouvrir le menu" aria-expanded={navOpen} className={cx("fixed left-3 z-30 h-10 px-3 gap-2 rounded-[2px] flex items-center justify-center shrink-0 text-[13px] font-semibold lg:hidden", isImpersonating ? "top-[calc(env(safe-area-inset-top)+52px)]" : "top-[calc(env(safe-area-inset-top)+0.75rem)]")} style={{ background: th.card, border: `1px solid ${th.ink}`, color: th.fg }} onClick={() => setNavOpen(true)}>
          <Menu className="w-4 h-4" />Menu
        </button>
        )}

        {/* En défilement document, cet espace initial part avec le contenu. */}
        <div className={cx("main-layout-content flex-1 min-h-0 flex flex-col overflow-hidden lg:pt-0", !sidebarHidden && "pt-[calc(env(safe-area-inset-top)+2.5rem)]")}>
          {examMode && !isPathAllowedDuringExam(location.pathname) ? <Navigate to="/dashboard" replace /> : (
            <AccessGate allow={location.pathname.startsWith("/profile")}><Outlet /></AccessGate>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
