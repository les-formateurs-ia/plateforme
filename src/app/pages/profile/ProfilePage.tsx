import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useSearchParams } from "react-router";
import { toast } from "sonner";
import { CalendarCheck2, CalendarClock, Camera, Check, Lock, LogOut, Monitor, Moon, Sparkles, Sun } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { useAuth } from "@/app/state/auth-context";
import { useProfile } from "@/app/state/profile-context";
import { connectGoogleCalendar, disconnectGoogleCalendar, getGoogleCalendarStatus } from "@/app/lib/availability";
import { Avatar } from "@/app/components/common/Avatar";
import { ShimBtn, VBtn } from "@/app/components/common/Buttons";
import { Stage } from "@/app/components/practice/ExerciseKit";
import { cx } from "@/app/lib/cx";
import { isStaff } from "@/app/lib/permissions";
import { TUTOR_STYLES } from "@/app/data/mock";
import { getAllBadges, getEarnedBadgeIds, getEnrolledSince, type BadgeRow } from "@/app/lib/learning";

// Profil : qui je suis (identité, objectif, tuteur IA), ce que j'ai débloqué
// (badges) et mes réglages (thème, session). Les chiffres de progression
// vivent sur l'accueil — plus de « Vue d'ensemble » en double ici.
//
// Les informations personnelles sont en lecture seule côté élève : elles
// sont saisies à l'inscription et modifiables par le formateur uniquement.

type Tab = "profile" | "badges" | "settings";

const MONTHS_FR = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const formatMonth = (iso: string) => {
  const d = new Date(iso);
  return `${MONTHS_FR[d.getMonth()]} ${d.getFullYear()}`;
};

function GoogleLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z" />
      <path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29A11.96 11.96 0 000 12c0 1.94.46 3.77 1.29 5.38l3.98-3.09z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z" />
    </svg>
  );
}

// Section titrée de la page (filet fin, pas d'ombre — charte du site).
function Section({ title, note, children }: { title: string; note?: ReactNode; children: ReactNode }) {
  const th = useTh();
  return (
    <section className="rounded-[10px]" style={{ background: th.card, border: `1px solid ${th.sep}` }}>
      <div className="px-5 sm:px-6 pt-5 flex items-center justify-between gap-3 flex-wrap">
        <p className="eyebrow" style={{ color: th.fg3 }}>{title}</p>
        {note}
      </div>
      <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-4">{children}</div>
    </section>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null }) {
  const th = useTh();
  return (
    <div className="py-3 grid grid-cols-[120px_minmax(0,1fr)] sm:grid-cols-[160px_minmax(0,1fr)] gap-3 items-baseline" style={{ borderTop: `1px solid ${th.sep}` }}>
      <dt className="text-[13px]" style={{ color: th.fg3 }}>{label}</dt>
      <dd className="text-[15px] break-words" style={{ color: value ? th.fg : th.fg3 }}>{value || "Non renseigné"}</dd>
    </div>
  );
}

// Aperçu miniature d'un thème (fond, barre latérale, carte, bouton).
function ThemePreview({ dark }: { dark: boolean }) {
  const bg = dark ? "#000" : "#fff";
  const line = dark ? "rgba(255,255,255,0.14)" : "#e6e6e6";
  const ink = dark ? "#fff" : "#000";
  return (
    <span className="flex h-full w-full" style={{ background: bg }}>
      <span className="w-1/4 h-full" style={{ borderRight: `1px solid ${line}` }} />
      <span className="flex-1 p-2 flex flex-col gap-1.5">
        <span className="h-1.5 w-2/3 rounded-full" style={{ background: ink, opacity: 0.85 }} />
        <span className="h-1 w-1/2 rounded-full" style={{ background: ink, opacity: 0.3 }} />
        <span className="flex-1 rounded-[3px]" style={{ border: `1px solid ${line}` }} />
        <span className="h-2.5 w-1/3 rounded-[2px]" style={{ background: ink }} />
      </span>
    </span>
  );
}

export function ProfilePage() {
  const th = useTh();
  const { user, role, signOut } = useAuth();
  const staff = isStaff(role);
  const { profile, updateAvatar } = useProfile();
  const [searchParams, setSearchParams] = useSearchParams();
  // Retour de la connexion Google (?google=…) : on rouvre les préférences.
  const [tab, setTab] = useState<Tab>(() => (searchParams.get("google") ? "settings" : "profile"));

  const name = profile.name || user?.email?.split("@")[0] || "Mon profil";
  const roleLabel = role === "admin" ? "Administrateur" : role === "formateur" ? "Formateur" : "Apprenant";
  const objective = profile.goalFinal || profile.goal || "";
  const tutorStyle = TUTOR_STYLES.find((t) => t.id === profile.tutor);

  // Photo de profil
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const handleAvatarSelect = async (file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("Le fichier doit être une image."); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("L'image ne doit pas dépasser 5 Mo."); return; }
    setAvatarUploading(true);
    const { error } = await updateAvatar(file);
    setAvatarUploading(false);
    if (error) toast.error(error);
    else toast.success("Photo de profil mise à jour.");
  };

  // Badges et ancienneté (élèves uniquement)
  const [allBadges, setAllBadges] = useState<BadgeRow[]>([]);
  const [earnedBadgeIds, setEarnedBadgeIds] = useState<Set<string>>(new Set());
  const [enrolledSince, setEnrolledSince] = useState<string | null>(null);
  const [badgesLoading, setBadgesLoading] = useState(true);

  useEffect(() => {
    if (!user || !role || staff) return;
    let cancelled = false;
    Promise.all([getAllBadges(), getEarnedBadgeIds(user.id), getEnrolledSince(user.id)])
      .then(([badges, earned, since]) => {
        if (cancelled) return;
        setAllBadges(badges);
        setEarnedBadgeIds(earned);
        setEnrolledSince(since);
      })
      .catch(console.error)
      .finally(() => { if (!cancelled) setBadgesLoading(false); });
    return () => { cancelled = true; };
  }, [user, role, staff]);

  const earnedCount = allBadges.filter((b) => earnedBadgeIds.has(b.id)).length;
  const sortedBadges = [...allBadges].sort((a, b) => Number(earnedBadgeIds.has(b.id)) - Number(earnedBadgeIds.has(a.id)));

  // Google Calendar de la plateforme (admin)
  const [googleConnected, setGoogleConnected] = useState(false);
  const [googleCalendarEmail, setGoogleCalendarEmail] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  const loadGoogleCalendarStatus = async () => {
    if (!user || role !== "admin") return;
    try {
      const status = await getGoogleCalendarStatus();
      setGoogleConnected(status.connected);
      setGoogleCalendarEmail(status.email);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { void loadGoogleCalendarStatus(); }, [user, role]);

  useEffect(() => {
    const googleStatus = searchParams.get("google");
    if (!googleStatus) return;
    if (googleStatus === "connected") { toast.success("Google Calendar connecté."); void loadGoogleCalendarStatus(); }
    else if (googleStatus === "error") toast.error("Impossible de connecter Google Calendar — réessayez.");
    searchParams.delete("google");
    setSearchParams(searchParams, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleConnectGoogle = async () => {
    setGoogleLoading(true);
    try {
      window.location.href = await connectGoogleCalendar();
    } catch (err) {
      console.error(err);
      toast.error("Impossible de démarrer la connexion Google.");
      setGoogleLoading(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    setGoogleLoading(true);
    try {
      await disconnectGoogleCalendar();
      setGoogleConnected(false);
      setGoogleCalendarEmail(null);
      toast.success("Google Calendar déconnecté.");
    } catch (err) {
      console.error(err);
      toast.error("Impossible de déconnecter Google Calendar.");
    } finally {
      setGoogleLoading(false);
    }
  };

  // Pas de navigate("/login") ici : RequireAuth redirige tout seul dès que le
  // statut passe à "unauthenticated" — le court-circuiter faisait rebondir
  // sur "/" pendant que onAuthStateChange était encore en vol.
  const handleSignOut = async () => {
    await signOut();
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "profile", label: "Profil" },
    ...(!staff ? [{ id: "badges" as const, label: `Badges${allBadges.length ? ` · ${earnedCount}/${allBadges.length}` : ""}` }] : []),
    { id: "settings", label: "Préférences" },
  ];

  return (
    <div className="relative flex-1 min-w-0 overflow-x-hidden overflow-y-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-6">
      {/* Identité : la photo se change d'un clic dessus. */}
      <Stage>
        <div className="px-5 sm:px-8 py-7 sm:py-8 flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-7">
          <button type="button" onClick={() => avatarInputRef.current?.click()} disabled={avatarUploading}
            aria-label="Changer la photo de profil" title="Changer la photo de profil"
            className="group relative self-start sm:self-auto shrink-0 rounded-2xl">
            <span className="block rounded-2xl p-[3px]" style={{ background: "var(--grad-iris)" }}>
              <Avatar url={profile.avatarUrl} size={96} square />
            </span>
            <span className={cx("absolute inset-[3px] rounded-2xl flex flex-col items-center justify-center gap-1 bg-black/55 text-white text-[11px] font-semibold transition-opacity",
              avatarUploading ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100")}>
              <Camera className="w-5 h-5" />{avatarUploading ? "Envoi…" : "Changer"}
            </span>
            <span className="sm:hidden absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white text-black flex items-center justify-center shadow">
              <Camera className="w-4 h-4" />
            </span>
          </button>
          <input ref={avatarInputRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => { const file = e.target.files?.[0]; if (file) void handleAvatarSelect(file); e.target.value = ""; }} />

          <div className="min-w-0 flex-1">
            <p className="eyebrow text-white/55">{roleLabel}</p>
            <h1 className="mt-1.5 text-[1.9rem] sm:text-[2.4rem] leading-[1.05] font-black break-words">{name}</h1>
            <p className="mt-2 text-[15px] text-white/70">
              {[profile.profession, enrolledSince && `en formation depuis ${formatMonth(enrolledSince)}`].filter(Boolean).join(" · ") || user?.email}
            </p>
          </div>

          {!staff && allBadges.length > 0 && (
            <button type="button" onClick={() => setTab("badges")}
              className="self-start sm:self-auto rounded-[6px] px-4 py-3 text-left transition-colors hover-fine:bg-white/10" style={{ border: "1px solid rgba(255,255,255,0.22)" }}>
              <span className="block text-2xl font-black tabular-nums">{earnedCount}<span className="text-white/45 text-base">/{allBadges.length}</span></span>
              <span className="block text-xs text-white/60 mt-0.5">badges débloqués</span>
            </button>
          )}
        </div>
      </Stage>

      <div role="tablist" className="flex flex-wrap gap-x-7" style={{ borderBottom: `1px solid ${th.sep}` }}>
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} role="tab" aria-selected={tab === t.id}
            className="tab-link shrink-0 pt-1 pb-3 text-[15px] transition-colors" style={{ color: tab === t.id ? th.fg : th.fg3 }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "profile" && (
        <div key="profile" className="battle-in grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-5 items-start">
          <Section title="Mes informations"
            note={<span className="inline-flex items-center gap-1.5 text-xs" style={{ color: th.fg3 }}><Lock className="w-3 h-3" />Modifiables par {staff ? "un administrateur" : "ton formateur"}</span>}>
            <dl className="-mt-3">
              <InfoRow label="Prénom" value={profile.name || null} />
              <InfoRow label="Email" value={user?.email ?? null} />
              <InfoRow label="Téléphone" value={profile.phone || null} />
              {!staff && <InfoRow label="Âge" value={profile.age ? `${profile.age} ans` : null} />}
              <InfoRow label="Profession" value={profile.profession || null} />
            </dl>
          </Section>

          {!staff && (
            <div className="space-y-5">
              <Section title="Mon objectif professionnel">
                {objective ? (
                  <>
                    <p className="text-[15px] leading-relaxed" style={{ color: th.fg }}>{objective}</p>
                    {profile.goalFinal && profile.goalFinal !== profile.goal && (
                      <p className="text-xs mt-3 flex items-center gap-1.5" style={{ color: th.fg3 }}><Sparkles className="w-3.5 h-3.5" />Reformulé par l'IA à ton inscription</p>
                    )}
                  </>
                ) : (
                  <p className="text-sm" style={{ color: th.fg3 }}>Pas encore renseigné : parles-en à ton formateur.</p>
                )}
              </Section>

              <Section title="Mon tuteur IA" note={<Lock className="w-3.5 h-3.5" style={{ color: th.fg3 }} aria-label="Verrouillé" />}>
                <div className="flex items-start gap-3">
                  {tutorStyle && <span className="text-2xl leading-none shrink-0" aria-hidden>{tutorStyle.emoji}</span>}
                  <div className="min-w-0">
                    <p className="text-[15px] font-bold" style={{ color: th.fg }}>{tutorStyle?.label ?? "Non renseigné"}</p>
                    {tutorStyle && <p className="text-sm mt-0.5" style={{ color: th.fg2 }}>{tutorStyle.desc}</p>}
                  </div>
                </div>
                <p className="text-xs leading-relaxed mt-4" style={{ color: th.fg3 }}>
                  C'est la façon dont l'IA t'explique les choses : leçons, agent, quiz. Pour en changer, demande à ton formateur.
                </p>
              </Section>
            </div>
          )}
        </div>
      )}

      {tab === "badges" && !staff && (
        <div key="badges" className="battle-in space-y-5">
          {badgesLoading ? (
            <div className="h-40 rounded-[10px] animate-pulse" style={{ background: th.navA }} aria-busy="true" aria-label="Chargement des badges" />
          ) : allBadges.length === 0 ? (
            <p className="text-sm" style={{ color: th.fg3 }}>Aucun badge configuré pour l'instant.</p>
          ) : (
            <>
              <div className="flex items-center gap-4">
                <span className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: th.navA }}>
                  <span className="block h-full rounded-full transition-[width] duration-700" style={{ width: `${(earnedCount / allBadges.length) * 100}%`, background: "var(--grad-iris)" }} />
                </span>
                <span className="text-sm font-semibold tabular-nums shrink-0" style={{ color: th.fg2 }}>{earnedCount} sur {allBadges.length}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {sortedBadges.map(({ id, icon, name: label, description }) => {
                  const done = earnedBadgeIds.has(id);
                  return (
                    <div key={id} className="rounded-[10px] p-4 flex items-start gap-4"
                      style={{ background: th.card, border: `1px solid ${done ? th.ink : th.sep}` }}>
                      <span className={cx("w-14 h-14 rounded-[8px] flex items-center justify-center text-3xl shrink-0", !done && "grayscale opacity-40")}
                        style={{ background: done ? "var(--grad-iris)" : th.navA }} aria-hidden>
                        {icon ?? "🏅"}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-bold" style={{ color: done ? th.fg : th.fg2 }}>{label}</p>
                        {description && <p className="text-xs leading-relaxed mt-1" style={{ color: th.fg3 }}>{description}</p>}
                        <p className="text-[11px] font-semibold mt-2 inline-flex items-center gap-1" style={{ color: done ? th.success : th.fg3 }}>
                          {done ? <><Check className="w-3 h-3" strokeWidth={3} />Débloqué</> : <><Lock className="w-3 h-3" />À débloquer</>}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {tab === "settings" && (
        <div key="settings" className="battle-in space-y-5 max-w-3xl">
          <Section title="Apparence">
            <div className="grid grid-cols-3 gap-3" role="radiogroup" aria-label="Thème de l'interface">
              {([
                { mode: "light" as const, label: "Clair", Icon: Sun },
                { mode: "dark" as const, label: "Sombre", Icon: Moon },
                { mode: "system" as const, label: "Système", Icon: Monitor },
              ]).map(({ mode, label, Icon }) => {
                const on = th.mode === mode;
                return (
                  <button key={mode} type="button" role="radio" aria-checked={on} onClick={() => th.setThemeMode(mode)} className="text-left">
                    <span className="block h-20 sm:h-24 rounded-[6px] overflow-hidden transition-shadow"
                      style={{ border: `1px solid ${th.sep}`, boxShadow: on ? `0 0 0 2px ${th.ink}` : "none" }}>
                      {mode === "system"
                        ? <span className="flex h-full"><span className="w-1/2 overflow-hidden"><ThemePreview dark={false} /></span><span className="w-1/2 overflow-hidden"><ThemePreview dark /></span></span>
                        : <ThemePreview dark={mode === "dark"} />}
                    </span>
                    <span className="mt-2 flex items-center gap-1.5 text-sm font-semibold" style={{ color: on ? th.fg : th.fg3 }}>
                      <Icon className="w-3.5 h-3.5" />{label}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-xs mt-4" style={{ color: th.fg3 }}>
              {th.mode === "system" ? "Suit automatiquement le réglage de ton appareil." : th.isDark ? "Interface sombre, plus reposante le soir." : "Interface claire, noir sur blanc."}
            </p>
          </Section>

          {/* Google Calendar — compte UNIQUE de la plateforme (pas un compte
              par formateur), sert à créer les évènements Meet de tous les
              rendez-vous (voir availability.ts, sync-meet-event). */}
          {role === "admin" && (
            <Section title="Google Calendar de la plateforme">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-start gap-3 min-w-0">
                  {googleConnected
                    ? <CalendarCheck2 className="w-5 h-5 shrink-0 mt-0.5" style={{ color: th.success }} />
                    : <CalendarClock className="w-5 h-5 shrink-0 mt-0.5" style={{ color: th.fg3 }} />}
                  <p className="text-sm leading-relaxed min-w-0 break-words" style={{ color: th.fg2 }}>
                    {googleConnected
                      ? <>Connecté{googleCalendarEmail ? <> avec <b style={{ color: th.fg }}>{googleCalendarEmail}</b></> : ""}. Un lien Meet est créé à chaque rendez-vous, tous formateurs confondus.</>
                      : "Connecte le compte Google de la plateforme pour créer automatiquement un lien Meet à chaque rendez-vous."}
                  </p>
                </div>
                {googleConnected ? (
                  <VBtn sm onClick={handleDisconnectGoogle} disabled={googleLoading}>{googleLoading ? "…" : "Déconnecter"}</VBtn>
                ) : (
                  <ShimBtn sm onClick={handleConnectGoogle} disabled={googleLoading}>
                    <GoogleLogo className="w-4 h-4 shrink-0" />{googleLoading ? "Redirection…" : "Connecter Google Calendar"}
                  </ShimBtn>
                )}
              </div>
            </Section>
          )}

          <Section title="Session">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <p className="text-sm min-w-0 break-words" style={{ color: th.fg2 }}>Connecté·e avec <b style={{ color: th.fg }}>{user?.email}</b></p>
              <button onClick={() => void handleSignOut()}
                className="inline-flex items-center gap-2 min-h-9 px-4 rounded-[2px] text-sm font-semibold border transition-colors border-[var(--danger-c)] text-[var(--danger-c)] hover-fine:bg-[#e5484d] hover-fine:text-white hover-fine:border-[#e5484d]"
                style={{ "--danger-c": th.danger } as CSSProperties}>
                <LogOut className="w-4 h-4" />Se déconnecter
              </button>
            </div>
          </Section>
        </div>
      )}
    </div>
  );
}
