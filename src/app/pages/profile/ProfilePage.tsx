import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { Trophy, CheckCircle, Lock, Award, Sparkles, Sun, Moon, Monitor, LogOut, Camera, CalendarClock, CalendarCheck2 } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { useAuth } from "@/app/state/auth-context";
import { useProfile } from "@/app/state/profile-context";
import { isStaff } from "@/app/lib/permissions";
import { supabase } from "@/app/lib/supabase/client";
import { connectGoogleCalendar, disconnectGoogleCalendar } from "@/app/lib/availability";
import { GCard } from "@/app/components/common/GCard";
import { Avatar } from "@/app/components/common/Avatar";
import { SparkleGlow } from "@/app/components/common/SparkleGlow";
import { CircleProgress } from "@/app/components/common/CircleProgress";
import { ShimBtn, VBtn } from "@/app/components/common/Buttons";
import { cx } from "@/app/lib/cx";
import { TUTOR_STYLES } from "@/app/data/mock";
import {
  getDashboardStats, getPromptsCount, getRecentActivity, getAllBadges, getEarnedBadgeIds, getEnrolledSince, formatDuration,
  type DashboardStats, type DailyActivity, type BadgeRow,
} from "@/app/lib/learning";

const MONTHS_FR = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const formatEnrolledSince = (iso: string) => {
  const d = new Date(iso);
  return `${MONTHS_FR[d.getMonth()]} ${d.getFullYear()}`;
};

export function ProfilePage() {
  const th = useTh();
  const navigate = useNavigate();
  const { user, role, signOut } = useAuth();
  const { profile, updateProfile, updateAvatar } = useProfile();
  const name = profile.name || "Alex Dubois";
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState<"overview" | "badges" | "settings">("overview");
  const [googleCalendarEmail, setGoogleCalendarEmail] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [objectiveDraft, setObjectiveDraft] = useState(profile.goalFinal || profile.goal || "");
  const [objectiveEditing, setObjectiveEditing] = useState(false);
  const [objectiveSaving, setObjectiveSaving] = useState(false);
  const [objectiveError, setObjectiveError] = useState<string | null>(null);
  const currentObjective = profile.goalFinal || profile.goal || "";
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  const handleAvatarSelect = async (file: File) => {
    if (!file.type.startsWith("image/")) { setAvatarError("Le fichier doit être une image."); return; }
    if (file.size > 5 * 1024 * 1024) { setAvatarError("L'image ne doit pas dépasser 5 Mo."); return; }
    setAvatarError(null);
    setAvatarUploading(true);
    const { error } = await updateAvatar(file);
    setAvatarUploading(false);
    if (error) setAvatarError(error);
  };

  const loadGoogleCalendarStatus = async () => {
    if (!user || !isStaff(role)) return;
    const { data } = await supabase.from("profiles").select("google_calendar_email").eq("id", user.id).maybeSingle();
    setGoogleCalendarEmail(data?.google_calendar_email ?? null);
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
      setGoogleCalendarEmail(null);
      toast.success("Google Calendar déconnecté.");
    } catch (err) {
      console.error(err);
      toast.error("Impossible de déconnecter Google Calendar.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [promptsCount, setPromptsCount] = useState(0);
  const [activity, setActivity] = useState<DailyActivity[]>([]);
  const [allBadges, setAllBadges] = useState<BadgeRow[]>([]);
  const [earnedBadgeIds, setEarnedBadgeIds] = useState<Set<string>>(new Set());
  const [enrolledSince, setEnrolledSince] = useState<string | null>(null);

  useEffect(() => {
    if (!objectiveEditing) setObjectiveDraft(currentObjective);
  }, [currentObjective, objectiveEditing]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const [dashStats, prompts, recentActivity, badges, earned, since] = await Promise.all([
          getDashboardStats(user.id),
          getPromptsCount(user.id),
          getRecentActivity(user.id),
          getAllBadges(),
          getEarnedBadgeIds(user.id),
          getEnrolledSince(user.id),
        ]);
        if (cancelled) return;
        setStats(dashStats);
        setPromptsCount(prompts);
        setActivity(recentActivity);
        setAllBadges(badges);
        setEarnedBadgeIds(earned);
        setEnrolledSince(since);
      } catch (err) {
        console.error(err);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  const certChapters = (stats?.sections ?? []).map((s) => {
    const pct = s.total > 0 ? Math.round((s.done / s.total) * 100) : 0;
    return { title: s.title, pct, done: pct === 100 };
  });
  const firstActiveIndex = certChapters.findIndex((c) => !c.done);
  const maxActivity = Math.max(1, ...activity.map((a) => a.count));

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const saveObjective = async () => {
    setObjectiveSaving(true);
    setObjectiveError(null);
    const cleanedObjective = objectiveDraft.trim();
    const { error } = await updateProfile({ goal: cleanedObjective, goalFinal: cleanedObjective });
    setObjectiveSaving(false);
    if (error) {
      setObjectiveError(error);
      return;
    }
    setObjectiveEditing(false);
  };

  return (
    <div className="relative flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-5">
      <SparkleGlow />
      <GCard glow>
        <div className="p-6 flex flex-col sm:flex-row items-center sm:items-center gap-6 text-center sm:text-left">
          <Avatar url={profile.avatarUrl} size={80} square />
          <div className="flex-1 min-w-0 w-full">
            <div className="flex items-center justify-center sm:justify-start gap-3 mb-1 flex-wrap">
              <h2 className="text-xl font-black" style={{ fontFamily: "'Funnel Display',sans-serif", color: th.fg }}>{name}</h2>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: "rgba(181,141,224,0.1)", color: th.navAC, border: "1px solid rgba(181,141,224,0.25)" }}>Apprenant IA Pro</span>
            </div>
            <p className="text-sm mb-3" style={{ color: th.fg3 }}>{profile.profession || "Chef de projet digital"}{enrolledSince && ` · En formation depuis ${formatEnrolledSince(enrolledSince)}`}</p>
            <div className="flex items-center justify-center sm:justify-start gap-6 flex-wrap">
              {[
                { val: stats ? `${stats.completedLessons}/${stats.totalLessons}` : "—", sub: "Leçons" },
                { val: String(promptsCount), sub: "Prompts" },
                { val: stats ? formatDuration(stats.totalTimeSeconds) : "—", sub: "Pratique" },
                { val: stats ? `${stats.completionPct}%` : "—", sub: "Certif." },
              ].map(({ val, sub }) => (
                <div key={sub} className="text-center"><div className="text-lg font-black" style={{ fontFamily: "'Funnel Display',sans-serif", color: th.navAC }}>{val}</div><div className="text-[10px]" style={{ color: th.fg3 }}>{sub}</div></div>
              ))}
            </div>
          </div>
          <div className="relative shrink-0">
            <CircleProgress pct={stats?.completionPct ?? 0} size={80} />
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <span className="text-base font-black" style={{ color: th.fg }}>{stats?.completionPct ?? 0}%</span>
              <span className="text-[8px]" style={{ color: th.fg3 }}>certif.</span>
            </div>
          </div>
        </div>
      </GCard>

      <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: th.isDark ? "rgba(255,255,255,0.04)" : "rgba(181,141,224,0.06)", border: `1px solid ${th.sep}` }}>
        {(["overview", "badges", "settings"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className="px-5 py-2 rounded-lg text-sm font-semibold transition-all"
            style={tab === t ? { background: th.isDark ? "rgba(181,141,224,0.14)" : "rgba(255,255,255,0.8)", color: th.navAC, border: `1px solid rgba(181,141,224,0.25)` } : { color: th.fg3, background: "transparent", border: "1px solid transparent" }}>
            {t === "overview" ? "Vue d'ensemble" : t === "badges" ? "Badges" : "Préférences"}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <GCard><div className="p-5">
            <div className="flex items-center gap-2 mb-4"><Trophy className="w-4 h-4 text-[#fbc2ad]" /><span className="text-sm font-black" style={{ color: th.fg }}>Progression certification</span></div>
            <div className="space-y-3">
              {certChapters.length === 0 && <p className="text-xs" style={{ color: th.fg3 }}>Aucun module pour l'instant.</p>}
              {certChapters.map(({ title, pct, done }, i) => {
                const active = i === firstActiveIndex;
                return (
                <div key={title}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0" style={{ background: done ? "rgba(106,222,177,0.15)" : active ? "rgba(181,141,224,0.12)" : "transparent", border: `1px solid ${done ? "rgba(106,222,177,0.4)" : active ? "rgba(181,141,224,0.3)" : th.sep}` }}>
                        {done ? <CheckCircle className="w-2.5 h-2.5 text-[#6adeb1]" /> : active ? <div className="w-1.5 h-1.5 rounded-full" style={{ background: th.navAC }} /> : <Lock className="w-2 h-2" style={{ color: th.fg3 }} />}
                      </div>
                      <span className="text-xs" style={{ color: done ? "rgba(106,222,177,0.8)" : active ? th.navAC : th.fg3 }}>{title}</span>
                    </div>
                    <span className="text-xs font-bold" style={{ color: done ? "#6adeb1" : active ? th.navAC : th.fg3 }}>{pct}%</span>
                  </div>
                  <div className="h-1 rounded-full overflow-hidden" style={{ background: th.isDark ? "rgba(255,255,255,0.05)" : "rgba(181,141,224,0.08)" }}><div className="h-full rounded-full" style={{ width: `${pct}%`, background: done ? "linear-gradient(90deg,#78d5e2,#6adeb1)" : active ? "linear-gradient(90deg,#b58de0,#dbacf0)" : "transparent" }} /></div>
                </div>
                );
              })}
            </div>
            <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${th.sep}` }}>
              <ShimBtn sm><span className="flex items-center gap-2"><Award className="w-4 h-4" />S'entraîner pour la soutenance</span></ShimBtn>
            </div>
          </div></GCard>

          <GCard><div className="p-5">
            <div className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: th.fg3 }}>Activité — 4 semaines</div>
            <div className="flex items-end gap-1 h-16">
              {activity.map(({ date, count }, i) => (
                <div key={date} title={`${date} : ${count}`} className="flex-1 rounded-sm" style={{ height: `${Math.max(4, (count / maxActivity) * 100)}%`, background: i === activity.length - 1 ? "linear-gradient(to top,#b58de0,#dbacf0)" : "rgba(181,141,224,0.25)", opacity: count > 0 ? 1 : 0.25 }} />
              ))}
            </div>
          </div></GCard>
        </div>
      )}

      {tab === "badges" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {allBadges.map(({ id, icon, name: label, description }) => {
            const done = earnedBadgeIds.has(id);
            return (
              <GCard key={id}><div className={cx("p-5 text-center", !done && "opacity-40")} title={description ?? undefined}>
                <span className={cx("text-4xl block mb-3", !done && "grayscale")}>{icon ?? "🏅"}</span>
                <div className="text-sm font-bold mb-1" style={{ color: done ? th.fg : th.fg3 }}>{label}</div>
                {done ? <span className="text-[10px] font-bold text-[#6adeb1]">Obtenu ✓</span> : <span className="text-[10px] flex items-center justify-center gap-1" style={{ color: th.fg3 }}><Lock className="w-3 h-3" />Non débloqué</span>}
              </div></GCard>
            );
          })}
          {allBadges.length === 0 && <p className="text-xs" style={{ color: th.fg3 }}>Aucun badge configuré pour l'instant.</p>}
        </div>
      )}

      {tab === "settings" && (
        <div className="space-y-5 max-w-xl">
          {/* Photo de profil */}
          <GCard><div className="p-5 flex items-center gap-5">
            <div className="relative shrink-0">
              <Avatar url={profile.avatarUrl} size={72} square />
              <button
                onClick={() => avatarInputRef.current?.click()}
                disabled={avatarUploading}
                className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full flex items-center justify-center transition-opacity hover:opacity-80 disabled:opacity-50"
                style={{ background: "linear-gradient(135deg,#fbc2ad,#fceccd)", border: `2px solid ${th.card}` }}
              >
                <Camera className="w-3.5 h-3.5 text-white" />
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => { const file = e.target.files?.[0]; if (file) handleAvatarSelect(file); e.target.value = ""; }}
              />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold mb-0.5" style={{ color: th.fg }}>Photo de profil</div>
              <div className="text-xs" style={{ color: th.fg3 }}>
                {avatarUploading ? "Envoi en cours…" : "JPG, PNG ou GIF — 5 Mo maximum."}
              </div>
              {avatarError && <p className="text-xs mt-1" style={{ color: "#fbc2ad" }}>{avatarError}</p>}
            </div>
          </div></GCard>

          {/* Theme toggle */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold uppercase tracking-widest" style={{ color: th.fg3 }}>Objectif professionnel</label>
              {!objectiveEditing && (
                <button onClick={() => setObjectiveEditing(true)} className="text-xs font-semibold transition-colors hover:opacity-70" style={{ color: th.navAC }}>
                  Modifier
                </button>
              )}
            </div>
            {objectiveEditing ? (
              <div className="space-y-2">
                <textarea
                  value={objectiveDraft}
                  onChange={e => setObjectiveDraft(e.target.value)}
                  rows={5}
                  placeholder="Decris ton objectif professionnel..."
                  className="w-full rounded-xl px-4 py-3 text-sm g-input resize-none"
                />
                {objectiveError && <p className="text-xs" style={{ color: "#fbc2ad" }}>{objectiveError}</p>}
                <div className="flex items-center gap-2">
                  <button onClick={saveObjective} disabled={objectiveSaving} className="px-4 py-2 rounded-lg text-xs font-bold transition-all hover:opacity-80 disabled:opacity-50"
                    style={{ background: "rgba(181,141,224,0.12)", border: "1px solid rgba(181,141,224,0.25)", color: th.navAC }}>
                    {objectiveSaving ? "Enregistrement..." : "Enregistrer"}
                  </button>
                  <button onClick={() => { setObjectiveDraft(currentObjective); setObjectiveEditing(false); setObjectiveError(null); }} disabled={objectiveSaving}
                    className="px-4 py-2 rounded-lg text-xs font-semibold transition-all hover:opacity-70 disabled:opacity-50" style={{ color: th.fg3 }}>
                    Annuler
                  </button>
                </div>
              </div>
            ) : (
              <div className="w-full rounded-xl px-4 py-3 text-sm flex items-center justify-between" style={{ background: th.inputBg, border: `1px solid ${th.inputB}` }}>
                <span style={{ color: currentObjective ? th.fg2 : th.fg3 }}>{currentObjective || "Non renseigne - complete ton objectif ici."}</span>
              </div>
            )}
          </div>

          <GCard><div className="p-5 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <div className="text-sm font-bold mb-0.5" style={{ color: th.fg }}>Thème de l'interface</div>
              <div className="text-xs" style={{ color: th.fg3 }}>
                {th.mode === "system" ? "Suit automatiquement le thème de ton appareil" : th.isDark ? "Mode sombre activé — ambiance dark glass" : "Mode clair activé — interface lumineuse"}
              </div>
            </div>
            <div className="flex gap-1 p-1 rounded-xl shrink-0" style={{ background: th.isDark ? "rgba(255,255,255,0.04)" : "rgba(181,141,224,0.06)", border: `1px solid ${th.sep}` }}>
              {([
                { mode: "light" as const, label: "Clair", Icon: Sun },
                { mode: "dark" as const, label: "Sombre", Icon: Moon },
                { mode: "system" as const, label: "Système", Icon: Monitor },
              ]).map(({ mode, label, Icon }) => (
                <button key={mode} onClick={() => th.setThemeMode(mode)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all hover:opacity-90"
                  style={th.mode === mode
                    ? { background: th.isDark ? "rgba(181,141,224,0.14)" : "rgba(255,255,255,0.8)", color: th.navAC, border: "1px solid rgba(181,141,224,0.25)" }
                    : { color: th.fg3, background: "transparent", border: "1px solid transparent" }}>
                  <Icon className="w-3.5 h-3.5" />{label}
                </button>
              ))}
            </div>
          </div></GCard>

          {/* Google Calendar — connexion par formateur, sert à créer les
              évènements Meet des rendez-vous (voir availability.ts). */}
          {isStaff(role) && (
            <GCard><div className="p-5 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3 min-w-0">
                {googleCalendarEmail ? <CalendarCheck2 className="w-5 h-5 shrink-0" style={{ color: "#6adeb1" }} /> : <CalendarClock className="w-5 h-5 shrink-0" style={{ color: th.fg3 }} />}
                <div className="min-w-0">
                  <div className="text-sm font-bold mb-0.5" style={{ color: th.fg }}>Google Calendar</div>
                  <div className="text-xs truncate" style={{ color: th.fg3 }}>
                    {googleCalendarEmail ? `Connecté en tant que ${googleCalendarEmail}` : "Connectez votre compte pour créer automatiquement un lien Google Meet à chaque rendez-vous."}
                  </div>
                </div>
              </div>
              {googleCalendarEmail ? (
                <VBtn sm onClick={handleDisconnectGoogle} disabled={googleLoading}>{googleLoading ? "…" : "Déconnecter"}</VBtn>
              ) : (
                <ShimBtn sm onClick={handleConnectGoogle} disabled={googleLoading}>{googleLoading ? "Redirection…" : "Connecter Google Calendar"}</ShimBtn>
              )}
            </div></GCard>
          )}

          {/* Info fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[["Prénom", profile.name || "Alex"], ["Âge", profile.age ? `${profile.age} ans` : "Non renseigné"], ["Profession", profile.profession || "Chef de projet"], ["Email", user?.email || "—"]].map(([label, val]) => (
              <div key={label}>
                <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: th.fg3 }}>{label}</label>
                <div className="w-full rounded-xl px-4 py-3 text-sm flex items-center justify-between" style={{ background: th.inputBg, border: `1px solid ${th.inputB}` }}>
                  <span style={{ color: th.fg2 }}>{val}</span>
                  <button className="text-xs transition-colors hover:opacity-70" style={{ color: th.navAC }}>Modifier</button>
                </div>
              </div>
            ))}
          </div>

          {/* Style de tuteur IA — verrouillé après l'onboarding, modifiable uniquement par un formateur */}
          {role === "student" && (
            <GCard><div className="p-5">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold uppercase tracking-widest" style={{ color: th.fg3 }}>Style de tuteur IA</label>
                <Lock className="w-3.5 h-3.5" style={{ color: th.fg3 }} />
              </div>
              {(() => {
                const tutorStyle = TUTOR_STYLES.find((t) => t.id === profile.tutor);
                return (
                  <div className="flex items-center gap-3 mb-2">
                    {tutorStyle && <span className="text-xl shrink-0">{tutorStyle.emoji}</span>}
                    <div className="min-w-0">
                      <div className="text-sm font-bold" style={{ color: th.fg }}>{tutorStyle?.label ?? "Non renseigné"}</div>
                      {tutorStyle && <div className="text-xs" style={{ color: th.fg3 }}>{tutorStyle.desc}</div>}
                    </div>
                  </div>
                );
              })()}
              <p className="text-xs leading-relaxed" style={{ color: th.fg3 }}>
                Ce réglage détermine la manière dont l'IA t'explique les choses (leçons, copilote, quiz…). Il ne peut être modifié que par ton formateur — contacte-le si tu souhaites en changer.
              </p>
            </div></GCard>
          )}

          {/* Objectif professionnel */}
          <div className="hidden">
            <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: th.fg3 }}>Objectif professionnel</label>
            <div className="w-full rounded-xl px-4 py-3 text-sm" style={{ background: th.inputBg, border: `1px solid ${th.inputB}`, color: th.fg2, lineHeight: 1.7, minHeight: 80 }}>
              {profile.goalFinal || profile.goal || <span style={{ color: th.fg3 }}>Non renseigné — complète ton profil lors de l'onboarding.</span>}
            </div>
            {profile.goalFinal && profile.goalFinal !== profile.goal && (
              <p className="text-[10px] mt-1.5 flex items-center gap-1" style={{ color: th.navAC }}><Sparkles className="w-3 h-3" />Reformulé par l'IA lors de l'inscription</p>
            )}
          </div>

          <GCard><div className="p-5 flex items-center justify-between">
            <div>
              <div className="text-sm font-bold mb-0.5" style={{ color: th.fg }}>Session</div>
              <div className="text-xs" style={{ color: th.fg3 }}>Connecté·e en tant que {user?.email}</div>
            </div>
            <button onClick={handleSignOut} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
              style={{ background: "rgba(251,194,173,0.1)", border: "1px solid rgba(251,194,173,0.25)", color: "#fbc2ad" }}>
              <LogOut className="w-4 h-4" />Se déconnecter
            </button>
          </div></GCard>
        </div>
      )}
    </div>
  );
}
