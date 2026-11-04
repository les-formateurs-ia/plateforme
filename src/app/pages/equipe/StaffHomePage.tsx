import { Link } from "react-router";
import { ArrowRight, Plus } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { useProfile } from "@/app/state/profile-context";
import { GCard } from "@/app/components/common/GCard";
import { NeuralField } from "@/app/components/particles/NeuralField";
import { MiniRing, UpcomingSlotsCard, daysBetween } from "@/app/components/sessions/hubUi";
import { SessionCard, pedagogyOf, useFormationsHub } from "@/app/components/sessions/SessionCards";
import { eur, totalHt } from "@/app/lib/documents/render";
import { FACTURE_STATUT_LABELS, STATUT_COMMERCIAL_LABELS, todayIso, type TrainingSession } from "@/app/lib/trainingSessions";
import { sessionStatus, type FormationsHub } from "@/app/lib/formationsHub";

// Tableau de bord de l'équipe : ce qu'il y a à faire maintenant. L'admin y
// suit la santé des dossiers (score Qualiopi, signatures, chiffre signé) ;
// le formateur, ses séances à venir et ses émargements.

function Chip({ emoji, value, label }: { emoji: string; value: number; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm bg-white/10">
      <span>{emoji}</span><span className="font-bold tabular-nums">{value}</span><span className="text-white/65">{label}</span>
    </span>
  );
}

function Hero({ ring, ringLabel, eyebrow, title, chips, side }: { ring: number; ringLabel: string; eyebrow: string; title: string; chips: React.ReactNode; side?: React.ReactNode }) {
  return (
    <section className="relative overflow-hidden rounded-[12px] bg-black text-white">
      <NeuralField dark density={3.4} band={0.9} />
      <div aria-hidden className="absolute inset-0" style={{ background: "linear-gradient(90deg,rgba(0,0,0,0.92) 0%,rgba(0,0,0,0.6) 55%,rgba(0,0,0,0.15) 100%)" }} />
      <div className="relative p-6 sm:p-8 grid gap-6 lg:grid-cols-[auto_1fr_auto] lg:items-center">
        <div className="relative w-fit">
          <MiniRing value={ring} size={128} dark />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[2.1rem] font-extrabold leading-none tabular-nums">{ring}<span className="text-sm text-white/60">%</span></span>
            <span className="text-[10px] text-white/60 mt-1">{ringLabel}</span>
          </div>
        </div>
        <div>
          <p className="eyebrow text-white/55">{eyebrow}</p>
          <p className="text-[1.7rem] sm:text-[2.2rem] font-extrabold leading-tight mt-1">{title}</p>
          <div className="flex flex-wrap gap-2 mt-4">{chips}</div>
        </div>
        {side && <div className="lg:text-right space-y-3">{side}</div>}
      </div>
    </section>
  );
}

function SectionTitle({ title, count, to }: { title: string; count?: string; to?: string }) {
  const th = useTh();
  return (
    <div className="flex items-baseline gap-3 mb-3">
      <p className="text-lg font-black" style={{ color: th.fg }}>{title}</p>
      {count && <p className="text-xs" style={{ color: th.fg3 }}>{count}</p>}
      {to && <Link to={to} className="ml-auto inline-flex items-center gap-1 text-xs font-bold hover:opacity-70" style={{ color: th.fg }}>Toutes les sessions<ArrowRight className="w-3.5 h-3.5" /></Link>}
    </div>
  );
}

const plural = (n: number, word: string) => `${n} ${word}${n > 1 ? "s" : ""}`;

export function StaffHomePage() {
  const th = useTh();
  const { hub, admin } = useFormationsHub();
  if (!hub) return <div className="p-8 text-sm" style={{ color: th.fg3 }}>Chargement…</div>;
  return admin ? <AdminHome hub={hub} /> : <FormateurHome hub={hub} />;
}

function AdminHome({ hub }: { hub: FormationsHub }) {
  const th = useTh();
  const today = todayIso();
  const journeyOf = (s: TrainingSession) => hub.journeys[s.id];
  // Les prospects et devis en attente ne sont pas encore des dossiers de formation.
  const won = hub.sessions.filter((s) => s.statutCommercial === "gagne");
  const pipeline = hub.sessions.filter((s) => s.statutCommercial === "prospect" || s.statutCommercial === "devis")
    .sort((a, b) => totalHt(b.lignes) - totalHt(a.lignes));
  const aEncaisser = hub.sessions.flatMap((s) => s.factures.filter((f) => f.statut !== "payee").map((f) => ({ ...f, session: s })))
    .sort((a, b) => a.date.localeCompare(b.date));
  const actives = won.filter((s) => sessionStatus(s) !== "terminee" || (journeyOf(s)?.progress ?? 0) < 100);
  const score = actives.length ? Math.round(actives.reduce((sum, s) => sum + (journeyOf(s)?.progress ?? 0), 0) / actives.length) : 100;
  const signe = (s: TrainingSession) => journeyOf(s)?.steps.some((st) => ["devis", "convention", "contrat-particulier"].includes(st.id) && st.status === "done") ?? false;
  const caSigne = hub.sessions.filter((s) => new Date(s.dateDebut).getFullYear() === new Date().getFullYear() && signe(s))
    .reduce((sum, s) => sum + totalHt(s.lignes), 0);
  const level = score >= 90 ? "🏆 Organisme exemplaire" : score >= 70 ? "🏁 Dossiers bien tenus" : score >= 40 ? "🎓 En bonne voie" : "🚀 Au démarrage";
  const byId = new Map(hub.sessions.map((s) => [s.id, s]));
  const dossiers = [...actives].sort((a, b) => a.dateDebut.localeCompare(b.dateDebut));

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-6">
      <Hero ring={score} ringLabel="score Qualiopi" eyebrow="Tableau de bord" title={level}
        chips={<>
          <Chip emoji="🔥" value={won.filter((s) => sessionStatus(s) === "en_cours").length} label="en cours" />
          <Chip emoji="📅" value={won.filter((s) => sessionStatus(s) === "a_venir").length} label="à venir" />
          <Chip emoji="🏆" value={won.filter((s) => journeyOf(s)?.progress === 100).length} label="dossiers complets" />
          {pipeline.length > 0 && <Chip emoji="💼" value={pipeline.length} label="prospects" />}
          <Chip emoji="✍️" value={hub.pendingSignatures.length} label="à signer" />
        </>}
        side={<>
          <div>
            <p className="text-xs text-white/55">Signé en {new Date().getFullYear()}</p>
            <p className="text-[1.8rem] font-extrabold leading-none tabular-nums mt-1">{eur(caSigne)}</p>
          </div>
          <Link to="/sessions?nouvelle=1" className="sweep inline-flex items-center gap-1.5 text-sm font-semibold px-4 min-h-9 rounded-[2px] bg-white text-black">
            <Plus className="w-4 h-4" />Nouvelle session
          </Link>
        </>} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px] items-start">
        <section>
          <SectionTitle title="Dossiers à faire avancer" count={plural(dossiers.length, "session")} to="/sessions" />
          {!dossiers.length && <GCard><div className="p-8 text-center text-sm" style={{ color: th.fg3 }}>Aucune session en cours. Créez-en une pour commencer.</div></GCard>}
          <div className="grid gap-3 sm:grid-cols-2">
            {dossiers.map((s) => <SessionCard key={s.id} hub={hub} session={s} admin />)}
          </div>
        </section>
        <aside className="space-y-4">
          <UpcomingSlotsCard slots={hub.slots} sessions={hub.sessions} />
          {aEncaisser.length > 0 && (
            <GCard><div className="p-4 space-y-2">
              <div className="flex items-baseline gap-2">
                <p className="text-sm font-black flex-1" style={{ color: th.fg }}>💶 À encaisser</p>
                <p className="text-xs font-bold tabular-nums" style={{ color: th.fg }}>{eur(aEncaisser.reduce((t, f) => t + f.montantHt - f.payeHt, 0))} HT</p>
              </div>
              {aEncaisser.map((f) => (
                <Link key={`${f.session.id}-${f.numero}`} to={`/sessions/${f.session.id}`} className="flex items-center gap-2 py-1.5 hover:opacity-80" style={{ borderBottom: `1px solid ${th.sep}` }}>
                  <span className="flex-1 min-w-0">
                    <span className="block text-xs font-bold truncate" style={{ color: th.fg }}>{f.session.client.nom}</span>
                    <span className="block text-[11px]" style={{ color: f.statut === "en_retard" ? th.danger : th.fg3 }}>Facture {f.numero} · {FACTURE_STATUT_LABELS[f.statut]}</span>
                  </span>
                  <span className="text-xs tabular-nums" style={{ color: th.fg }}>{eur(f.montantHt - f.payeHt)}</span>
                </Link>
              ))}
            </div></GCard>
          )}
          {pipeline.length > 0 && (
            <GCard><div className="p-4 space-y-2">
              <div className="flex items-baseline gap-2">
                <p className="text-sm font-black flex-1" style={{ color: th.fg }}>💼 Pipeline commercial</p>
                <p className="text-xs font-bold tabular-nums" style={{ color: th.fg }}>{eur(pipeline.reduce((t, s) => t + totalHt(s.lignes), 0))} HT</p>
              </div>
              {pipeline.slice(0, 8).map((s) => (
                <Link key={s.id} to={`/sessions/${s.id}`} className="flex items-center gap-2 py-1.5 hover:opacity-80" style={{ borderBottom: `1px solid ${th.sep}` }}>
                  <span className="flex-1 min-w-0">
                    <span className="block text-xs font-bold truncate" style={{ color: th.fg }}>{s.client.nom}</span>
                    <span className="block text-[11px]" style={{ color: th.fg3 }}>{STATUT_COMMERCIAL_LABELS[s.statutCommercial]}</span>
                  </span>
                  <span className="text-xs tabular-nums" style={{ color: th.fg }}>{eur(totalHt(s.lignes))}</span>
                </Link>
              ))}
              <Link to="/sessions?vue=prospects" className="inline-flex items-center gap-1 text-xs font-bold hover:opacity-70" style={{ color: th.fg }}>Tous les prospects<ArrowRight className="w-3.5 h-3.5" /></Link>
            </div></GCard>
          )}
          <GCard><div className="p-4 space-y-2">
            <p className="text-sm font-black" style={{ color: th.fg }}>✍️ En attente de signature</p>
            {!hub.pendingSignatures.length && <p className="text-xs" style={{ color: th.fg3 }}>Tout est signé.</p>}
            {hub.pendingSignatures.slice(0, 6).map((d) => (
              <Link key={d.documentId} to={`/sessions/${d.sessionId}`} className="block py-1.5 hover:opacity-80" style={{ borderBottom: `1px solid ${th.sep}` }}>
                <p className="text-xs font-bold truncate" style={{ color: th.fg }}>{d.title.split(" · ")[0]} · {byId.get(d.sessionId)?.client.nom}</p>
                <p className="text-[11px]" style={{ color: th.fg3 }}>Envoyé il y a {Math.max(daysBetween(d.issuedAt.slice(0, 10), today), 0)} j</p>
              </Link>
            ))}
          </div></GCard>
        </aside>
      </div>
    </div>
  );
}

function FormateurHome({ hub }: { hub: FormationsHub }) {
  const th = useTh();
  const { profile } = useProfile();
  const firstName = profile.name.split(" ")[0];
  const actives = hub.sessions.filter((s) => sessionStatus(s) !== "terminee" || pedagogyOf(hub, s).toSign > 0)
    .sort((a, b) => a.dateDebut.localeCompare(b.dateDebut));
  const stats = hub.sessions.map((s) => pedagogyOf(hub, s));
  const total = stats.reduce((n, p) => n + p.total, 0);
  const past = stats.reduce((n, p) => n + p.past, 0);
  const toSign = stats.reduce((n, p) => n + p.toSign, 0);
  const today = todayIso();
  const upcoming = hub.slots.filter((s) => s.date >= today).length;

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-6">
      <Hero ring={total ? Math.round((past / total) * 100) : 0} ringLabel="séances réalisées" eyebrow="Tableau de bord"
        title={firstName ? `Bonjour ${firstName} 👋` : "Bonjour 👋"}
        chips={<>
          <Chip emoji="🔥" value={hub.sessions.filter((s) => sessionStatus(s) === "en_cours").length} label="en cours" />
          <Chip emoji="📅" value={upcoming} label="séances à venir" />
          <Chip emoji="✍️" value={toSign} label="à émarger" />
        </>} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px] items-start">
        <section>
          <SectionTitle title="Mes sessions" count={plural(actives.length, "session")} to="/sessions" />
          {!actives.length && (
            <GCard><div className="p-8 text-center text-sm" style={{ color: th.fg3 }}>
              Aucune session ne vous est attribuée pour le moment. L'administrateur vous en attribue depuis la fiche de la session.
            </div></GCard>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            {actives.map((s) => <SessionCard key={s.id} hub={hub} session={s} admin={false} />)}
          </div>
        </section>
        <aside className="space-y-4">
          <UpcomingSlotsCard slots={hub.slots} sessions={hub.sessions} />
        </aside>
      </div>
    </div>
  );
}
