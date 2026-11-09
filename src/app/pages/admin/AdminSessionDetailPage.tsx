import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { openDocument } from "@/app/lib/documents/openDocument";
import { ArrowLeft, ArrowRight, Building2, Calendar, Check, ChevronLeft, Copy, ExternalLink, Eye, Globe, GraduationCap, Lock, Mail, MapPin, PenLine, Plus, Sparkles, Trash2, UserCheck, Users, Video } from "lucide-react";
import logoSvg from "@/imports/logo-les-formateurs-ia.svg?raw";
import { useTh } from "@/app/theme/theme";
import { GCard } from "@/app/components/common/GCard";
import { GT } from "@/app/components/common/GT";
import { ShimBtn, VBtn } from "@/app/components/common/Buttons";
import { Field, ParsedArea, TextArea, TextInput } from "@/app/components/sessions/fields";
import { ProgrammeEditor, contenuToText, textToContenu } from "@/app/components/sessions/ProgrammeEditor";
import { ActionButtons, GREEN, JourneyHero } from "@/app/components/sessions/JourneyView";
import { computeJourney, type JourneyAction, type JourneyStep } from "@/app/lib/documents/journey";
import { countTodos, DOCUMENT_TEMPLATES, renderTemplate } from "@/app/lib/documents/catalog";
import { creneauDuree, dateLongueFr, FINANCEMENT_LABELS, heureFr, heures, MODALITE_LABELS, periodeFr, withSignatureProof } from "@/app/lib/documents/render";
import type { DocumentContext } from "@/app/lib/documents/types";
import {
  addSlot, addTrainee, assignSessionFormateur, buildDocumentContext, clientPortalUrl, deleteDocument, deleteSession, deleteSlot, deleteTrainee, findProfileIdByEmail,
  createCompanyAccess, getDocumentHtml, getSessionActivity, getSessionBundle, importCompanyEmployees, isSlotOpen, issueDocument, listSessionEmails,
  setAutoEmails, signAttendanceAsTrainer, updateSession, updateTraineeResult, STATUT_COMMERCIAL_LABELS,
  type ActivityRow, type EmailKind, type SessionBundle, type SessionDocument, type SessionEmail, type TrainingSession,
} from "@/app/lib/trainingSessions";
import { VSwitch } from "@/app/components/common/VSwitch";
import { EmailComposer } from "@/app/components/sessions/EmailComposer";
import { EmailHistoryList } from "@/app/components/sessions/EmailHistory";
import { VSelect } from "@/app/components/common/Select";
import { useAuth } from "@/app/state/auth-context";
import { isAdmin } from "@/app/lib/permissions";
import { listCoachAssignableCards, type PersonCard } from "@/app/lib/planning";
import { ArchiveCard, CommercialCard } from "@/app/components/sessions/DigiformaCards";

// Dossier d'une formation : un seul tableau de bord. En haut la
// progression et la carte du parcours en trois phases ; au centre l'étape
// choisie, avec tout ce qu'il faut y faire ; à droite la prochaine action,
// la séance du jour, l'espace client et l'archive des documents.
// Un formateur n'ouvre que ses sessions attribuées, dans une vue réduite à
// la partie pédagogique (FormateurSessionView) : ni prix, ni documents.

const dateHeure = (iso: string) => new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Paris" }).format(new Date(iso));

// Le client reçoit un seul lien : son espace formation, où il retrouve et
// signe tous ses documents, pendant et après la formation.
// Sans jeton (migration 20261101120000_client_portal non appliquée), pas de
// lien à envoyer : on le dit plutôt que de produire « …/undefined ».
const PORTAL_MISSING = "L'espace client n'est pas encore activé sur la base (migration 20261101120000_client_portal à appliquer).";

function copyPortalLink(bundle: SessionBundle) {
  if (!bundle.clientToken) { toast.error(PORTAL_MISSING); return; }
  void navigator.clipboard.writeText(clientPortalUrl(bundle.clientToken));
  toast.success("Lien de l'espace client copié.");
}

function mailPortalLink(bundle: SessionBundle, aSigner?: string) {
  if (!bundle.clientToken) return;
  const c = bundle.session.client;
  const nom = c.representant?.nom || c.nom;
  const body = `Bonjour ${nom},\n\n${aSigner ? `Le document « ${aSigner} » est prêt à être signé. ` : ""}Retrouvez dans votre espace formation les dates, le programme et tous les documents de la formation « ${bundle.session.formation.intitule} »${aSigner ? ", et signez-les en ligne" : ""} :\n${clientPortalUrl(bundle.clientToken)}\n\nCe lien reste valable après la formation : vous y trouverez votre certificat de réalisation et vos attestations.\n\nBien cordialement,\nLes Formateurs IA`;
  const subject = aSigner ? `${aSigner} à signer` : `Votre espace formation · ${bundle.session.formation.intitule}`;
  window.location.href = `mailto:${c.email ?? ""}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

// Document seul dans un onglet, avec « Enregistrer en PDF » (mise en page A4).
function openHtml(html: string | Promise<string>) {
  openDocument(html).catch((err) => {
    console.error(err);
    toast.error(err instanceof Error ? err.message : "Impossible d'ouvrir le document.");
  });
}

type Run = (action: () => Promise<unknown>, success?: string) => Promise<void>;

// Actions sur les documents, partagées par les étapes et l'archive.
type DocKit = {
  ctx: DocumentContext;
  documents: SessionDocument[];
  busy: boolean;
  issue: (templateIds: string[]) => void;
  open: (doc: SessionDocument) => void;
  remove: (doc: SessionDocument) => void;
  share: (doc: SessionDocument) => void;
};

const PHASES: { id: string; titre: string; emoji: string; ids: string[] }[] = [
  { id: "avant", titre: "Avant", emoji: "🧭", ids: ["client", "programme", "devis", "planning", "convention", "contrat-particulier", "accueil"] },
  { id: "pendant", titre: "Pendant", emoji: "🎓", ids: ["realisation", "evaluation"] },
  { id: "apres", titre: "Après", emoji: "🏆", ids: ["cloture"] },
];

export function AdminSessionDetailPage() {
  const th = useTh();
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();
  const { role } = useAuth();
  const admin = isAdmin(role);
  const [bundle, setBundle] = useState<SessionBundle | null>(null);
  const [draft, setDraft] = useState<TrainingSession | null>(null);
  const [contenuText, setContenuText] = useState("");
  const [activity, setActivity] = useState<Record<string, ActivityRow[]>>({});
  const [selected, setSelected] = useState<string | null>(null);
  // Envoi d'e-mail en cours de confirmation (fenêtre d'aperçu).
  const [composer, setComposer] = useState<{ kind: EmailKind; aSigner?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const reload = async () => {
    if (!sessionId) return;
    try {
      const b = await getSessionBundle(sessionId, !admin);
      setBundle(b);
      if (b) setActivity(await getSessionActivity(b));
    } catch (err) {
      console.error(err);
      toast.error("Impossible de charger la formation.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (role) void reload(); }, [sessionId, role]);
  // Le brouillon n'est réinitialisé qu'au chargement de la session, pas à
  // chaque rechargement (émargement, documents) : la saisie en cours reste.
  useEffect(() => {
    if (bundle && draft?.id !== bundle.session.id) {
      setDraft(bundle.session);
      setContenuText(contenuToText(bundle.session.formation.contenu));
    }
  }, [bundle]);

  const run: Run = async (action, success) => {
    setBusy(true);
    try {
      await action();
      if (success) toast.success(success);
      await reload();
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "L'opération a échoué.");
    } finally {
      setBusy(false);
    }
  };

  const journey = bundle ? computeJourney(bundle, bundle.documents.filter((d) => !d.trainee_id), activity) : null;
  // À l'ouverture, l'étape en cours est affichée.
  useEffect(() => {
    if (journey && selected === null) setSelected(journey.next?.id ?? journey.steps[journey.steps.length - 1].id);
  }, [journey, selected]);

  if (loading) return <div className="p-8 text-sm" style={{ color: th.fg3 }}>Chargement…</div>;
  if (!bundle || !draft || !journey) return <div className="p-8 text-sm" style={{ color: th.fg3 }}>{admin ? "Formation introuvable." : "Cette session est introuvable ou ne vous est pas attribuée."}</div>;
  if (!admin) return <FormateurSessionView bundle={bundle} activity={activity} busy={busy} run={run} />;

  const merged: TrainingSession = { ...draft, formation: { ...draft.formation, contenu: textToContenu(contenuText) } };
  const dirty = JSON.stringify(draft) !== JSON.stringify(bundle.session) || contenuText !== contenuToText(bundle.session.formation.contenu);
  const save = () => run(() => updateSession(merged), "Modifications enregistrées.");
  const ctx = buildDocumentContext(bundle, activity);
  const hasSignatures = bundle.signatures.length > 0 || bundle.documents.some((d) => d.signed_at);

  const select = (id: string) => {
    setSelected(id);
    setTimeout(() => document.getElementById("step-focus")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  // Tout envoi passe par la fenêtre de confirmation (aperçu, destinataires).
  const openPortalEmail = (aSigner?: string) => {
    if (!bundle.clientToken) return toast.error(PORTAL_MISSING);
    setComposer({ kind: "espace-client", aSigner });
  };

  // Émet un ou plusieurs documents ; une saisie en cours est enregistrée
  // d'abord pour que le document reprenne les dernières informations.
  const issue = (templateIds: string[]) => void run(async () => {
    let source = bundle;
    if (dirty) {
      await updateSession(merged);
      source = { ...bundle, session: merged };
    }
    const docCtx = buildDocumentContext(source, activity);
    let todos = 0;
    let aSigner: string | null = null;
    for (const id of templateIds) {
      const template = DOCUMENT_TEMPLATES.find((t) => t.id === id);
      if (!template) continue;
      todos += countTodos(renderTemplate(template, docCtx));
      await issueDocument(bundle.session.id, template, docCtx, logoSvg, bundle.trainees.map((t) => t.id));
      if (template.signable) aSigner = template.titre;
    }
    // Document à signer : on propose aussitôt l'envoi du lien de l'espace client.
    if (aSigner) openPortalEmail(aSigner);
    if (todos) toast.warning(`${todos} champ${todos > 1 ? "s restent" : " reste"} à compléter dans les documents émis.`);
  }, templateIds.length > 1 ? `${templateIds.length} documents émis.` : "Document émis.");

  // Les exemplaires individuels (un par stagiaire) restent hors des listes :
  // ils vivent dans l'espace de chaque apprenant.
  const sessionDocs = bundle.documents.filter((d) => !d.trainee_id);
  const kit: DocKit = {
    ctx, documents: sessionDocs, busy, issue,
    // L'onglet s'ouvre dans le geste du clic, puis se remplit.
    open: (doc) => openHtml(getDocumentHtml(doc.id).then((html) => doc.signed_at ? withSignatureProof(html, {
      titre: doc.title, sha256: doc.html_sha256, emisLe: doc.issued_at, emisPar: "Les Formateurs IA",
      signataire: doc.signer_name ?? "", signeLe: doc.signed_at, ip: doc.signed_ip, navigateur: doc.signed_user_agent,
    }) : html)),
    remove: (doc) => { if (confirm(`Supprimer « ${doc.title} » ?`)) void run(() => deleteDocument(doc.id), "Document supprimé."); },
    share: (doc) => openPortalEmail(doc.title.split(" · ")[0]),
  };

  const onAction = (step: JourneyStep) => (a: JourneyAction) => {
    if (a.kind === "open") return select(step.id);
    if (a.kind === "sign-slot") return void run(() => signAttendanceAsTrainer(a.slotId), "Séance signée.");
    if (a.kind === "share") {
      const doc = bundle.documents.find((d) => d.id === a.documentId);
      if (doc) kit.share(doc);
      return;
    }
    issue(a.templateIds);
  };

  const panel = (step: JourneyStep): ReactNode => {
    switch (step.id) {
      case "client": return <ClientPanel draft={draft} setDraft={setDraft} />;
      case "programme": return <ProgrammeEditor value={draft.formation} onChange={(formation) => setDraft({ ...draft, formation })} contenuText={contenuText} onContenuText={setContenuText} />;
      case "devis": return <><PrixPanel draft={draft} setDraft={setDraft} /><DocLines kit={kit} ids={["devis", "programme"]} /></>;
      case "planning": return <PlanningPanel bundle={bundle} busy={busy} run={run} />;
      case "convention": case "contrat-particulier": return <DocLines kit={kit} ids={[step.id]} />;
      case "accueil": return <DocLines kit={kit} ids={["convocation", "programme", "cgv", "reglement-interieur"]} />;
      case "realisation": return <RealisationPanel bundle={bundle} activity={activity} busy={busy} run={run} />;
      case "evaluation": return <EvaluationPanel bundle={bundle} run={run} />;
      case "cloture": return <DocLines kit={kit} ids={["attestation-assiduite", "certificat-realisation", "attestation-fin-formation", "releve-connexions", "emargement"]} />;
      default: return null;
    }
  };

  const next = journey.next;
  const steps = journey.steps;
  const focusIndex = Math.max(steps.findIndex((s) => s.id === selected), 0);
  const focus = steps[focusIndex];
  const todaySlots = bundle.slots.filter((s) => isSlotOpen(s) || s.date === ctx.dateDocument);
  const portalSeen = sessionDocs.filter((d) => d.requires_signature);

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-6 pb-24">
      <div className="flex items-end gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <Link to="/sessions" className="flex items-center gap-1.5 text-sm w-fit hover:opacity-70 mb-3" style={{ color: th.fg3 }}><ChevronLeft className="w-4 h-4" />Sessions</Link>
          <p className="text-xs font-bold" style={{ color: th.fg3 }}>
            {bundle.session.reference} · {FINANCEMENT_LABELS[bundle.session.financement]}
            {bundle.session.source === "digiforma" ? " · Repris de Digiforma" : ""}
            {bundle.session.statutCommercial !== "gagne" ? ` · ${STATUT_COMMERCIAL_LABELS[bundle.session.statutCommercial]}` : ""}
          </p>
          <h1 className="text-[1.7rem] sm:text-[2.1rem] leading-[1.1] font-black mt-1" style={{ color: th.fg }}><GT>{bundle.session.client.nom}</GT></h1>
          <p className="text-sm mt-1" style={{ color: th.fg2 }}>{bundle.session.formation.intitule} · {periodeFr(bundle.session.dateDebut, bundle.session.dateFin)}</p>
        </div>
      </div>

      <JourneyHero journey={journey} dateDebut={bundle.session.dateDebut} dateFin={bundle.session.dateFin} onStep={select} />

      {/* Carte du parcours : trois phases, une tuile par étape. */}
      <div className="grid gap-3 lg:grid-cols-[minmax(0,6fr)_minmax(0,2.6fr)_minmax(0,1.3fr)]">
        {PHASES.map((phase) => {
          const phaseSteps = steps.filter((s) => phase.ids.includes(s.id));
          const done = phaseSteps.filter((s) => s.status === "done").length;
          return (
            <section key={phase.id} className="rounded-[10px] p-3" style={{ background: th.navA }}>
              <div className="flex items-center gap-2 px-1 pb-3">
                <span className="text-base">{phase.emoji}</span>
                <p className="text-sm font-black" style={{ color: th.fg }}>{phase.titre}</p>
                <span className="text-xs ml-auto tabular-nums" style={{ color: done === phaseSteps.length ? GREEN : th.fg3 }}>{done}/{phaseSteps.length}</span>
              </div>
              <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(auto-fill, minmax(118px, 1fr))` }}>
                {phaseSteps.map((step) => {
                  const active = step.id === focus.id;
                  const color = step.status === "done" ? GREEN : step.status === "current" ? th.ink : th.fg3;
                  return (
                    <button key={step.id} type="button" onClick={() => select(step.id)}
                      className="relative text-left rounded-[8px] p-3 transition-all hover:-translate-y-0.5"
                      style={{ background: th.card, border: `2px solid ${active ? th.ink : "transparent"}`, boxShadow: active ? "0 6px 18px rgba(0,0,0,0.12)" : undefined, opacity: step.status === "locked" ? 0.6 : 1 }}>
                      <span className="w-8 h-8 rounded-full flex items-center justify-center mb-2"
                        style={{ background: step.status === "done" ? GREEN : step.status === "current" ? th.ink : th.navA, color: step.status === "locked" || step.status === "todo" ? th.fg3 : th.onInk }}>
                        {step.status === "done" ? <Check className="w-4 h-4 text-white" /> : step.status === "locked" ? <Lock className="w-3.5 h-3.5" /> : <span className="text-xs font-black">{steps.indexOf(step) + 1}</span>}
                      </span>
                      {step.status === "current" && <span className="absolute top-3 right-3 w-2 h-2 rounded-full animate-pulse" style={{ background: th.ink }} />}
                      <p className="text-[13px] font-black leading-tight" style={{ color: th.fg }}>{step.titre}</p>
                      <p className="text-[11px] mt-1 leading-snug line-clamp-2" style={{ color }}>
                        {step.status === "done" ? "Validé" : step.missing.length ? `${step.missing.length} à compléter` : step.status === "locked" ? "Verrouillé" : "À faire"}
                      </p>
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px] items-start">
        {/* L'étape choisie, avec tout ce qu'il faut y faire. */}
        <GCard><div id="step-focus" className="scroll-mt-4" style={{ borderTop: `3px solid ${focus.status === "done" ? GREEN : th.ink}` }}>
          <div className="p-5 sm:p-6 space-y-4">
            <div className="flex items-start gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <p className="eyebrow" style={{ color: th.fg3 }}>Étape {focusIndex + 1} sur {steps.length}</p>
                <p className="text-xl font-black mt-1" style={{ color: th.fg }}>{focus.titre}</p>
                <p className="text-sm mt-1" style={{ color: th.fg2 }}>{focus.description}</p>
                {focus.detail && <p className="text-xs mt-2" style={{ color: focus.status === "done" ? GREEN : th.fg3 }}>{focus.status === "locked" ? "🔒 " : ""}{focus.detail}</p>}
              </div>
              <div className="flex gap-1">
                <button type="button" disabled={focusIndex === 0} onClick={() => select(steps[focusIndex - 1].id)} title="Étape précédente"
                  className="w-9 h-9 rounded-full flex items-center justify-center disabled:opacity-30 hover:opacity-70" style={{ border: `1px solid ${th.sep}`, color: th.fg }}><ArrowLeft className="w-4 h-4" /></button>
                <button type="button" disabled={focusIndex === steps.length - 1} onClick={() => select(steps[focusIndex + 1].id)} title="Étape suivante"
                  className="w-9 h-9 rounded-full flex items-center justify-center disabled:opacity-30 hover:opacity-70" style={{ border: `1px solid ${th.sep}`, color: th.fg }}><ArrowRight className="w-4 h-4" /></button>
              </div>
            </div>
            {focus.status !== "done" && focus.missing.length > 0 && (
              <div className="flex gap-1.5 flex-wrap">
                {focus.missing.map((m) => <span key={m} className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: th.navA, color: th.fg }}>{m}</span>)}
              </div>
            )}
            <ActionButtons actions={focus.actions.filter((a) => a.kind !== "open")} onAction={onAction(focus)} busy={busy} primary />
            <div className="pt-1">{panel(focus)}</div>
          </div>
        </div></GCard>

        <aside className="space-y-4 xl:sticky xl:top-4">
          {journey.progress === 100 ? (
            <GCard><div className="p-5 flex items-start gap-3">
              <Sparkles className="w-6 h-6 shrink-0" style={{ color: GREEN }} />
              <div>
                <p className="font-black" style={{ color: th.fg }}>Dossier complet !</p>
                <p className="text-xs mt-1" style={{ color: th.fg2 }}>Tous les justificatifs Qualiopi sont émis et archivés.</p>
              </div>
            </div></GCard>
          ) : next && next.id !== focus.id && (
            <GCard><div className="p-5 space-y-3" style={{ borderTop: `3px solid ${th.ink}` }}>
              <p className="eyebrow" style={{ color: th.fg3 }}>Prochaine étape</p>
              <p className="text-lg font-black leading-tight" style={{ color: th.fg }}>{next.titre}</p>
              <p className="text-xs" style={{ color: th.fg2 }}>{next.missing.length ? `À compléter : ${next.missing.join(", ")}` : next.description}</p>
              <button type="button" onClick={() => select(next.id)} className="inline-flex items-center gap-1.5 text-xs font-bold" style={{ color: th.fg }}>
                Y aller<ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div></GCard>
          )}

          {todaySlots.length > 0 && (
            <GCard><div className="p-4 space-y-2">
              <p className="text-sm font-black" style={{ color: th.fg }}>Aujourd'hui</p>
              {todaySlots.map((slot) => {
                const trainer = bundle.signatures.find((s) => s.slotId === slot.id && s.role === "intervenant");
                const present = bundle.signatures.filter((s) => s.slotId === slot.id && s.role === "stagiaire").length;
                return (
                  <div key={slot.id} className="py-1.5 space-y-1.5" style={{ borderBottom: `1px solid ${th.sep}` }}>
                    <p className="text-xs font-bold" style={{ color: th.fg }}>{heureFr(slot.debut)} à {heureFr(slot.fin)} · {present}/{bundle.trainees.length} présents</p>
                    {trainer
                      ? <p className="text-xs flex items-center gap-1" style={{ color: GREEN }}><Check className="w-3.5 h-3.5" />Signée par {trainer.signerName}</p>
                      : <VBtn sm disabled={busy || new Date(`${slot.date}T${slot.debut}:00`) > new Date()} onClick={() => run(() => signAttendanceAsTrainer(slot.id), "Séance signée.")}><PenLine className="w-3.5 h-3.5" />Signer la séance</VBtn>}
                  </div>
                );
              })}
            </div></GCard>
          )}

          <CommercialCard draft={draft} setDraft={setDraft} />

          <FormateurCard formateurId={draft.formateurId} busy={busy}
            onAssign={(formateurId) => void run(async () => {
              await assignSessionFormateur(bundle.session.id, formateurId);
              setDraft((d) => (d ? { ...d, formateurId } : d));
            }, formateurId ? "Formateur attribué." : "Attribution retirée.")} />

          <GCard><div className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4" style={{ color: th.fg3 }} />
              <p className="text-sm font-black" style={{ color: th.fg }}>Espace client</p>
            </div>
            <p className="text-xs" style={{ color: th.fg2 }}>
              Un lien unique pour le client : dates, programme, documents à signer, puis certificat de réalisation et attestations après la formation.
              {portalSeen.length ? ` ${portalSeen.filter((d) => d.signed_at).length}/${portalSeen.length} document${portalSeen.length > 1 ? "s" : ""} signé${portalSeen.length > 1 ? "s" : ""}.` : ""}
            </p>
            {bundle.clientToken ? (
              <div className="flex gap-2 flex-wrap">
                <VBtn sm onClick={() => copyPortalLink(bundle)}><Copy className="w-3.5 h-3.5" />Copier</VBtn>
                <VBtn sm disabled={busy} onClick={() => openPortalEmail()}><Mail className="w-3.5 h-3.5" />Envoyer</VBtn>
                <VBtn sm onClick={() => window.open(clientPortalUrl(bundle.clientToken), "_blank", "noopener")}><ExternalLink className="w-3.5 h-3.5" />Voir</VBtn>
              </div>
            ) : (
              <p className="text-xs font-semibold" style={{ color: th.danger }}>{PORTAL_MISSING}</p>
            )}
          </div></GCard>

          <EmailsCard bundle={bundle} busy={busy} onCompose={(kind) => setComposer({ kind })} />

          <DocumentsArchive kit={kit} />

          <ArchiveCard session={bundle.session} />

          <button type="button" disabled={busy}
            onClick={() => {
              // Les signatures sont des justificatifs Qualiopi : leur
              // suppression demande une confirmation explicite.
              if (hasSignatures) {
                const typed = prompt("Cette formation contient des signatures (documents signés ou émargements). Elles seront définitivement perdues, alors qu'elles servent de justificatifs Qualiopi.\n\nTapez SUPPRIMER pour confirmer.");
                if (typed?.trim().toUpperCase() !== "SUPPRIMER") return;
              } else if (!confirm("Supprimer définitivement cette formation, ses séances et ses documents ?")) return;
              setBusy(true);
              deleteSession(bundle.session.id)
                .then(() => { toast.success("Formation supprimée."); navigate("/sessions"); })
                .catch((err) => { console.error(err); toast.error(err instanceof Error ? err.message : "Impossible de supprimer la formation."); setBusy(false); });
            }}
            className="flex items-center gap-1.5 text-xs font-bold disabled:opacity-40 px-1 hover:opacity-70" style={{ color: th.danger }}>
            <Trash2 className="w-3.5 h-3.5" />Supprimer la formation
          </button>
        </aside>
      </div>

      <EmailComposer sessionId={bundle.session.id} kind={composer?.kind ?? null} onClose={() => setComposer(null)}
        onSent={() => void reload()} onFallback={() => { copyPortalLink(bundle); mailPortalLink(bundle, composer?.aSigner); }} />

      {dirty && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-4 rounded-[6px] px-5 py-3 shadow-lg"
          style={{ background: th.card, border: `1px solid ${th.ink}` }}>
          <span className="text-sm font-semibold" style={{ color: th.fg }}>Modifications non enregistrées</span>
          <ShimBtn sm onClick={save} disabled={busy}><Check className="w-4 h-4" />Enregistrer</ShimBtn>
        </div>
      )}
    </div>
  );
}

// ── Documents ─────────────────────────────────────────────────────────

function DocLines({ kit, ids }: { kit: DocKit; ids: string[] }) {
  const th = useTh();
  const templates = ids.map((id) => DOCUMENT_TEMPLATES.find((t) => t.id === id)!).filter((t) => t.applicable(kit.ctx));
  const missing = templates.filter((t) => !kit.documents.some((d) => d.template_id === t.id));
  return (
    <div className="space-y-2">
      {templates.map((t) => {
        const latest = kit.documents.find((d) => d.template_id === t.id);
        const status = !latest ? "Pas encore émis"
          : latest.signed_at ? `Signé par ${latest.signer_name ?? "le client"} le ${dateHeure(latest.signed_at)}`
            : latest.requires_signature ? `Envoyé le ${dateHeure(latest.issued_at)}, en attente de signature` : `Émis le ${dateHeure(latest.issued_at)}`;
        return (
          <div key={t.id} className="flex items-center gap-3 flex-wrap rounded-[4px] px-3 py-2.5" style={{ background: th.navA }}>
            <span className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
              style={{ background: latest && (!latest.requires_signature || latest.signed_at) ? GREEN : th.card, color: "#fff", border: `1px solid ${th.sep}` }}>
              {latest && (!latest.requires_signature || latest.signed_at) && <Check className="w-3.5 h-3.5" />}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold" style={{ color: th.fg }}>{t.titre}</p>
              <p className="text-xs" style={{ color: latest?.requires_signature && !latest.signed_at ? th.danger : th.fg3 }}>{status}</p>
            </div>
            <DocButtons kit={kit} templateId={t.id} doc={latest} />
          </div>
        );
      })}
      {missing.length > 1 && (
        <ShimBtn sm onClick={() => kit.issue(missing.map((t) => t.id))} disabled={kit.busy}>Émettre les {missing.length} documents</ShimBtn>
      )}
    </div>
  );
}

function IconBtn({ title, onClick, children, danger, disabled }: { title: string; onClick: () => void; children: ReactNode; danger?: boolean; disabled?: boolean }) {
  const th = useTh();
  return (
    <button type="button" title={title} aria-label={title} onClick={onClick} disabled={disabled}
      className="w-8 h-8 rounded-[4px] flex items-center justify-center hover:opacity-70 disabled:opacity-30" style={{ color: danger ? th.danger : th.fg2 }}>
      {children}
    </button>
  );
}

function DocButtons({ kit, templateId, doc }: { kit: DocKit; templateId: string; doc?: SessionDocument }) {
  const th = useTh();
  const template = DOCUMENT_TEMPLATES.find((t) => t.id === templateId)!;
  return (
    <div className="flex items-center gap-0.5">
      <IconBtn title="Aperçu" onClick={() => openHtml(renderTemplate(template, kit.ctx, logoSvg))}><Eye className="w-4 h-4" /></IconBtn>
      {doc && <IconBtn title="Ouvrir le document émis (PDF)" onClick={() => kit.open(doc)}><ExternalLink className="w-4 h-4" /></IconBtn>}
      {doc?.requires_signature && !doc.signed_at && <IconBtn title="Envoyer au client pour signature (espace client)" onClick={() => kit.share(doc)}><Mail className="w-4 h-4" /></IconBtn>}
      {!doc?.signed_at && (
        <button type="button" disabled={kit.busy} onClick={() => kit.issue([templateId])}
          className="ml-1 text-xs font-bold px-3 py-1.5 rounded-[2px] hover:opacity-70 disabled:opacity-40" style={{ border: `1px solid ${th.ink}`, color: th.fg }}>
          {doc ? "Réémettre" : "Émettre"}
        </button>
      )}
    </div>
  );
}

function DocumentsArchive({ kit }: { kit: DocKit }) {
  const th = useTh();
  return (
    <GCard><div className="p-4 space-y-2">
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-black" style={{ color: th.fg }}>Documents</p>
        <p className="text-xs" style={{ color: th.fg3 }}>{kit.documents.length} émis</p>
      </div>
      {!kit.documents.length && <p className="text-xs" style={{ color: th.fg3 }}>Les documents émis depuis les étapes s'archivent ici.</p>}
      {kit.documents.map((d) => (
        <div key={d.id} className="flex items-center gap-2 py-1" style={{ borderBottom: `1px solid ${th.sep}` }}>
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: d.requires_signature && !d.signed_at ? th.danger : GREEN }} />
          <button type="button" onClick={() => kit.open(d)} className="flex-1 min-w-0 text-left hover:opacity-70">
            <p className="text-xs font-semibold truncate" style={{ color: th.fg }}>{d.title.split(" · ")[0]}</p>
            <p className="text-[11px]" style={{ color: th.fg3 }}>{d.signed_at ? `Signé le ${dateHeure(d.signed_at)}` : d.requires_signature ? "À signer" : dateHeure(d.issued_at)}</p>
          </button>
          {!d.signed_at && <IconBtn title="Supprimer" danger onClick={() => kit.remove(d)} disabled={kit.busy}><Trash2 className="w-3.5 h-3.5" /></IconBtn>}
        </div>
      ))}
    </div></GCard>
  );
}

// ── Panneaux d'étape ──────────────────────────────────────────────────

function ClientPanel({ draft, setDraft }: { draft: TrainingSession; setDraft: (s: TrainingSession) => void }) {
  const set = <K extends keyof TrainingSession>(k: K) => (v: TrainingSession[K]) => setDraft({ ...draft, [k]: v });
  const client = draft.client;
  const setClient = <K extends keyof typeof client>(k: K) => (v: (typeof client)[K]) => setDraft({ ...draft, client: { ...client, [k]: v } });
  const b2b = client.type === "entreprise";
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label={b2b ? "Raison sociale" : "Prénom et nom"}><TextInput value={client.nom} onChange={setClient("nom")} /></Field>
      <Field label={b2b ? "E-mail du signataire" : "E-mail"}><TextInput type="email" value={client.email} onChange={setClient("email")} /></Field>
      <Field label="Adresse"><TextInput value={client.adresse} onChange={setClient("adresse")} /></Field>
      <div className="grid grid-cols-[110px_1fr] gap-3">
        <Field label="Code postal"><TextInput value={client.codePostal} onChange={setClient("codePostal")} /></Field>
        <Field label="Ville"><TextInput value={client.ville} onChange={setClient("ville")} /></Field>
      </div>
      {b2b && <Field label="SIRET"><TextInput value={client.siret ?? ""} onChange={(v) => setClient("siret")(v || null)} /></Field>}
      {b2b && (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Signataire"><TextInput value={client.representant?.nom ?? ""} onChange={(v) => setClient("representant")({ nom: v, qualite: client.representant?.qualite ?? "" })} /></Field>
          <Field label="Fonction"><TextInput value={client.representant?.qualite ?? ""} onChange={(v) => setClient("representant")({ nom: client.representant?.nom ?? "", qualite: v })} /></Field>
        </div>
      )}
      <Field label="Lieu de la formation"><TextInput value={draft.lieu} onChange={set("lieu")} placeholder="Adresse, ou « Plateforme e-learning et visioconférence »" /></Field>
      <Field label="Lien de classe virtuelle"><TextInput value={draft.lienConnexion ?? ""} onChange={(v) => set("lienConnexion")(v || null)} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Début"><TextInput type="date" value={draft.dateDebut} onChange={set("dateDebut")} /></Field>
        <Field label="Fin"><TextInput type="date" value={draft.dateFin} onChange={set("dateFin")} /></Field>
      </div>
      <Field label="Financeur" hint="OPCO, Caisse des dépôts…"><TextInput value={draft.financeur ?? ""} onChange={(v) => set("financeur")(v || null)} /></Field>
      <div className="sm:col-span-2">
        <Field label="Intervenants" hint="« Nom, qualité », un par ligne.">
          <ParsedArea rows={2} initial={draft.intervenants.map((i) => `${i.nom}, ${i.qualite}`).join("\n")}
            onText={(v) => set("intervenants")(v.split("\n").filter((l) => l.trim()).map((l) => {
              const [nom, ...q] = l.split(",");
              return { nom: nom.trim(), qualite: q.join(",").trim() };
            }))} />
        </Field>
      </div>
    </div>
  );
}

function PrixPanel({ draft, setDraft }: { draft: TrainingSession; setDraft: (s: TrainingSession) => void }) {
  const ligne = draft.lignes[0] ?? { designation: draft.formation.intitule, quantite: 1, prixUnitaireHt: 0 };
  const setLigne = (patch: Partial<typeof ligne>) => setDraft({ ...draft, lignes: [{ ...ligne, ...patch }, ...draft.lignes.slice(1)] });
  return (
    <div className="space-y-3">
      <div className="grid sm:grid-cols-[1fr_90px_150px] gap-3">
        <Field label="Désignation"><TextInput value={ligne.designation} onChange={(v) => setLigne({ designation: v })} /></Field>
        <Field label="Quantité"><TextInput type="number" value={String(ligne.quantite)} onChange={(v) => setLigne({ quantite: Number(v) || 0 })} /></Field>
        <Field label="Prix unitaire HT (€)"><TextInput type="number" value={String(ligne.prixUnitaireHt)} onChange={(v) => setLigne({ prixUnitaireHt: Number(v) || 0 })} /></Field>
      </div>
      <Field label="Conditions de paiement"><TextArea rows={2} value={draft.conditionsPaiement} onChange={(v) => setDraft({ ...draft, conditionsPaiement: v })} /></Field>
    </div>
  );
}

function PlanningPanel({ bundle, busy, run }: { bundle: SessionBundle; busy: boolean; run: Run }) {
  const th = useTh();
  const [slot, setSlot] = useState({ date: bundle.session.dateDebut, debut: "09:00", fin: "12:30" });
  const [t, setT] = useState({ civilite: "", prenom: "", nom: "", email: "", fonction: "" });
  const signedSlots = new Set(bundle.signatures.map((s) => s.slotId));
  const signedTrainees = new Set(bundle.signatures.map((s) => s.traineeId));
  const sansAcces = bundle.trainees.filter((t) => !t.profileId).length;
  const add = () => run(async () => {
    if (!t.prenom.trim() || !t.nom.trim() || !t.email.trim()) throw new Error("Prénom, nom et e-mail sont requis.");
    const profileId = await findProfileIdByEmail(t.email);
    await addTrainee(bundle.session.id, { ...t, nom: t.nom.trim().toUpperCase(), fonction: t.fonction || null, profileId });
    setT({ civilite: "", prenom: "", nom: "", email: "", fonction: "" });
  }, "Stagiaire ajouté.");

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <p className="flex-1 text-xs font-bold" style={{ color: th.fg2 }}>Stagiaires ({bundle.trainees.length})</p>
          {bundle.session.companyId && (
            <VBtn sm disabled={busy} onClick={() => run(async () => {
              const n = await importCompanyEmployees(bundle.session.id, bundle.session.companyId!);
              toast.success(n ? `${n} collaborateur${n > 1 ? "s" : ""} ajouté${n > 1 ? "s" : ""}.` : "Tous les collaborateurs sont déjà inscrits.");
            })}><Users className="w-3.5 h-3.5" />Importer les collaborateurs</VBtn>
          )}
        </div>
        {bundle.session.companyId && sansAcces > 0 && (
          <div className="flex items-center gap-3 flex-wrap rounded-[6px] p-3" style={{ background: th.navA }}>
            <p className="text-xs flex-1 min-w-[180px]" style={{ color: th.fg2 }}>
              <strong style={{ color: th.fg }}>{sansAcces} stagiaire{sansAcces > 1 ? "s" : ""} sans accès.</strong> Sans compte, pas d'émargement en ligne ni de certificat dans leur espace.
            </p>
            <ShimBtn sm disabled={busy} onClick={() => run(async () => {
              const r = await createCompanyAccess(bundle);
              if (r.errors.length) toast.error(r.errors[0]);
              if (r.invited) toast.success(`${r.invited} invitation${r.invited > 1 ? "s" : ""} envoyée${r.invited > 1 ? "s" : ""} : chaque stagiaire crée son mot de passe depuis l'e-mail reçu.`);
            })}>Créer les accès Entreprise</ShimBtn>
          </div>
        )}
        {bundle.trainees.map((tr) => (
          <div key={tr.id} className="flex items-center gap-2 text-sm py-1.5" style={{ borderBottom: `1px solid ${th.sep}` }}>
            <span className="flex-1 font-semibold" style={{ color: th.fg }}>{tr.civilite} {tr.prenom} {tr.nom}</span>
            {tr.heuresPrevues != null && (
              <span className="text-[11px] tabular-nums shrink-0" style={{ color: th.fg2 }} title="Heures réalisées / prévues">
                {tr.heuresRealisees != null ? `${heures(tr.heuresRealisees)} / ` : ""}{heures(tr.heuresPrevues)}
              </span>
            )}
            <span className="text-xs truncate" style={{ color: th.fg3 }}>{tr.email || "Pas d'e-mail"}</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0" style={{ background: tr.profileId ? `${GREEN}22` : th.navA, color: tr.profileId ? GREEN : th.danger }}>
              {tr.profileId ? "Accès créé" : "Sans accès"}
            </span>
            <IconBtn title={signedTrainees.has(tr.id) ? "A émargé : conservé comme justificatif" : "Retirer"} danger disabled={busy || signedTrainees.has(tr.id)}
              onClick={() => void run(() => deleteTrainee(tr.id))}><Trash2 className="w-3.5 h-3.5" /></IconBtn>
          </div>
        ))}
        <div className="grid grid-cols-[64px_1fr_1fr] gap-2 pt-1">
          <TextInput value={t.civilite} onChange={(civilite) => setT({ ...t, civilite })} placeholder="Mme" />
          <TextInput value={t.prenom} onChange={(prenom) => setT({ ...t, prenom })} placeholder="Prénom" />
          <TextInput value={t.nom} onChange={(nom) => setT({ ...t, nom })} placeholder="Nom" />
        </div>
        <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
          <TextInput type="email" value={t.email} onChange={(email) => setT({ ...t, email })} placeholder="E-mail" />
          <TextInput value={t.fonction} onChange={(fonction) => setT({ ...t, fonction })} placeholder="Fonction" />
          <VBtn sm disabled={busy} onClick={add}><Plus className="w-3.5 h-3.5" /></VBtn>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-bold" style={{ color: th.fg2 }}>Séances ({bundle.slots.length})</p>
        {bundle.slots.map((s) => (
          <div key={s.id} className="flex items-center gap-2 text-sm py-1.5" style={{ borderBottom: `1px solid ${th.sep}` }}>
            <span className="flex-1" style={{ color: th.fg }}>{dateLongueFr(s.date)}</span>
            <span className="text-xs" style={{ color: th.fg2 }}>{heureFr(s.debut)} à {heureFr(s.fin)} · {heures(creneauDuree(s))}</span>
            <IconBtn title={signedSlots.has(s.id) ? "Émargée : conservée comme justificatif" : "Supprimer"} danger disabled={busy || signedSlots.has(s.id)}
              onClick={() => void run(() => deleteSlot(s.id))}><Trash2 className="w-3.5 h-3.5" /></IconBtn>
          </div>
        ))}
        <div className="grid grid-cols-[1fr_88px_88px_auto] gap-2 items-end pt-1">
          <TextInput type="date" value={slot.date} onChange={(date) => setSlot({ ...slot, date })} />
          <TextInput type="time" value={slot.debut} onChange={(debut) => setSlot({ ...slot, debut })} />
          <TextInput type="time" value={slot.fin} onChange={(fin) => setSlot({ ...slot, fin })} />
          <VBtn sm disabled={busy} onClick={() => run(() => addSlot(bundle.session.id, slot.date, slot.debut, slot.fin))}><Plus className="w-3.5 h-3.5" /></VBtn>
        </div>
        <p className="text-[11px]" style={{ color: th.fg3 }}>Une séance par demi-journée ; pour le CPF, les séances individuelles avec le formateur.</p>
      </div>
    </div>
  );
}

function RealisationPanel({ bundle, activity, busy, run }: { bundle: SessionBundle; activity: Record<string, ActivityRow[]>; busy: boolean; run: Run }) {
  const th = useTh();
  const distance = bundle.session.formation.modalite === "foad" || bundle.session.formation.modalite === "hybride";
  const started = (s: { date: string; debut: string }) => new Date(`${s.date}T${s.debut}:00`) <= new Date();
  return (
    <div className="space-y-4">
      {bundle.slots.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="text-left font-bold py-1.5 pr-3" style={{ color: th.fg2 }}>Séance</th>
                {bundle.trainees.map((tr) => <th key={tr.id} className="font-bold py-1.5 px-2 whitespace-nowrap" style={{ color: th.fg2 }}>{tr.prenom}</th>)}
                <th className="font-bold py-1.5 px-2" style={{ color: th.fg2 }}>Intervenant</th>
              </tr>
            </thead>
            <tbody>
              {bundle.slots.map((slot) => {
                const trainer = bundle.signatures.find((s) => s.slotId === slot.id && s.role === "intervenant");
                return (
                  <tr key={slot.id} style={{ borderTop: `1px solid ${th.sep}` }}>
                    <td className="py-2 pr-3 whitespace-nowrap" style={{ color: th.fg }}>{dateLongueFr(slot.date)} · {heureFr(slot.debut)}</td>
                    {bundle.trainees.map((tr) => {
                      const sig = bundle.signatures.find((s) => s.slotId === slot.id && s.traineeId === tr.id);
                      return (
                        <td key={tr.id} className="text-center py-2 px-2" title={sig ? `${dateHeure(sig.signedAt)}${sig.ip ? ` · ${sig.ip}` : ""}` : undefined}>
                          {sig ? <Check className="w-4 h-4 inline" style={{ color: GREEN }} /> : <span style={{ color: started(slot) ? th.danger : th.fg3 }}>{started(slot) ? "absent" : "·"}</span>}
                        </td>
                      );
                    })}
                    <td className="text-center py-2 px-2">
                      {trainer ? <Check className="w-4 h-4 inline" style={{ color: GREEN }} /> : started(slot) ? (
                        <button type="button" disabled={busy} onClick={() => run(() => signAttendanceAsTrainer(slot.id), "Séance signée.")}
                          className="text-xs font-bold underline disabled:opacity-40" style={{ color: th.fg }}>Signer</button>
                      ) : <span style={{ color: th.fg3 }}>·</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="text-[11px] mt-2" style={{ color: th.fg3 }}>Les collaborateurs émargent depuis leur espace pendant la séance. Survolez une coche pour voir l'heure et l'adresse IP.</p>
        </div>
      )}
      {distance && (
        <div className="space-y-1.5">
          <p className="text-xs font-bold" style={{ color: th.fg2 }}>Temps passé sur la plateforme</p>
          {bundle.trainees.map((tr) => {
            const rows = activity[tr.id] ?? [];
            const total = rows.reduce((s, r) => s + r.seconds, 0) / 3600;
            const ratio = Math.min(total / Math.max(bundle.session.formation.dureeHeures, 1), 1);
            return (
              <div key={tr.id} className="flex items-center gap-3 text-xs">
                <span className="w-36 truncate font-semibold" style={{ color: th.fg }}>{tr.prenom} {tr.nom}</span>
                {tr.profileId ? (
                  <>
                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: th.navA }}>
                      <div className="h-full rounded-full" style={{ width: `${ratio * 100}%`, background: GREEN }} />
                    </div>
                    <span className="w-28 text-right tabular-nums" style={{ color: th.fg2 }}>{heures(Math.round(total * 10) / 10)} / {heures(bundle.session.formation.dureeHeures)}</span>
                  </>
                ) : <span style={{ color: th.danger }}>Aucun compte plateforme associé</span>}
              </div>
            );
          })}
        </div>
      )}
      {!bundle.slots.length && !distance && <p className="text-xs" style={{ color: th.fg3 }}>Ajoutez des séances à l'étape Planning.</p>}
    </div>
  );
}

function EvaluationPanel({ bundle, run }: { bundle: SessionBundle; run: Run }) {
  const th = useTh();
  // Saisie enregistrée en quittant le champ.
  const saved = useRef(new Map(bundle.trainees.map((t) => [t.id, t.resultatEvaluation])));
  if (!bundle.trainees.length) return <p className="text-xs" style={{ color: th.fg3 }}>Ajoutez des stagiaires à l'étape Planning.</p>;
  return (
    <div className="space-y-2">
      {bundle.trainees.map((tr) => (
        <div key={tr.id} className="grid sm:grid-cols-[160px_1fr] gap-2 items-center">
          <span className="text-sm font-semibold flex items-center gap-1.5" style={{ color: th.fg }}>
            {tr.resultatEvaluation && <Check className="w-3.5 h-3.5" style={{ color: GREEN }} />}{tr.prenom} {tr.nom}
          </span>
          <input defaultValue={tr.resultatEvaluation ?? ""} placeholder="Ex. Objectifs atteints : 16/20 au quiz final"
            onBlur={(e) => {
              const v = e.target.value.trim() || null;
              if (v === saved.current.get(tr.id)) return;
              saved.current.set(tr.id, v);
              void run(() => updateTraineeResult(tr.id, v));
            }}
            className="w-full rounded-[4px] px-3 py-2 text-sm g-input" />
        </div>
      ))}
      <p className="text-[11px]" style={{ color: th.fg3 }}>Repris sur l'attestation de fin de formation (art. L6353-1).</p>
    </div>
  );
}

// ── E-mails ───────────────────────────────────────────────────────────

function EmailsCard({ bundle, busy, onCompose }: { bundle: SessionBundle; busy: boolean; onCompose: (kind: EmailKind) => void }) {
  const th = useTh();
  const [emails, setEmails] = useState<SessionEmail[]>([]);
  const [auto, setAuto] = useState(bundle.autoEmails);
  // L'historique se recharge avec la formation (après chaque envoi).
  useEffect(() => { listSessionEmails(bundle.session.id).then(setEmails).catch(console.error); }, [bundle]);

  const toggleAuto = (v: boolean) => {
    setAuto(v);
    void setAutoEmails(bundle.session.id, v).catch((err) => { console.error(err); setAuto(!v); toast.error("Impossible de modifier les envois automatiques."); });
  };

  const elearning = bundle.session.financement === "cpf" || bundle.session.financement === "particulier";
  const actions: { kind: EmailKind; label: string; hint: string }[] = [
    ...(elearning ? [{ kind: "acces-elearning" as const, label: "Accès e-learning", hint: "Création de compte" }] : []),
    { kind: "convocation", label: "Convocations", hint: "Aux stagiaires" },
    { kind: "rappel", label: "Rappel", hint: "Aux stagiaires" },
    { kind: "certificat", label: "Certificats", hint: "Aux stagiaires" },
    { kind: "espace-client", label: "Espace client", hint: "Au client" },
  ];

  return (
    <GCard><div className="p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Mail className="w-4 h-4" style={{ color: th.fg3 }} />
        <p className="text-sm font-black flex-1" style={{ color: th.fg }}>E-mails</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {actions.map((a) => (
          <button key={a.kind} type="button" disabled={busy} onClick={() => onCompose(a.kind)}
            className="text-left rounded-[6px] px-3 py-2 hover:opacity-80 disabled:opacity-40" style={{ background: th.navA }}>
            <span className="block text-xs font-bold" style={{ color: th.fg }}>{a.label}</span>
            <span className="block text-[10.5px]" style={{ color: th.fg3 }}>{a.hint}</span>
          </button>
        ))}
      </div>
      <label className="flex items-start gap-3 cursor-pointer">
        <VSwitch checked={auto} onCheckedChange={toggleAuto} />
        <span className="text-xs leading-snug" style={{ color: th.fg2 }}>
          <strong style={{ color: th.fg }}>Envois automatiques</strong><br />Convocation à J-7, rappel la veille de chaque séance, certificat dès qu'il est émis.
        </span>
      </label>
      <div className="pt-2" style={{ borderTop: `1px solid ${th.sep}` }}>
        <p className="text-[10px] font-black uppercase tracking-widest mb-1.5" style={{ color: th.fg3 }}>Historique des e-mails</p>
        <EmailHistoryList emails={emails} compact />
      </div>
    </div></GCard>
  );
}

// ── Formateur attribué (admin) ────────────────────────────────────────

const NO_FORMATEUR = "none";

function FormateurCard({ formateurId, busy, onAssign }: { formateurId: string | null; busy: boolean; onAssign: (id: string | null) => void }) {
  const th = useTh();
  const [people, setPeople] = useState<PersonCard[]>([]);
  useEffect(() => { listCoachAssignableCards().then(setPeople).catch(console.error); }, []);
  const label = (p: PersonCard) => [p.firstName, p.lastName].filter(Boolean).join(" ") || p.email;
  return (
    <GCard><div className="p-4 space-y-3">
      <div className="flex items-center gap-2">
        <UserCheck className="w-4 h-4" style={{ color: th.fg3 }} />
        <p className="text-sm font-black" style={{ color: th.fg }}>Formateur attribué</p>
      </div>
      <VSelect value={formateurId ?? NO_FORMATEUR} disabled={busy} onValueChange={(v) => onAssign(v === NO_FORMATEUR ? null : v)}
        options={[{ value: NO_FORMATEUR, label: "Aucun formateur" }, ...people.map((p) => ({ value: p.id, label: label(p) }))]} />
      <p className="text-[11px]" style={{ color: th.fg3 }}>Il voit cette session dans son espace, sans les prix ni les documents administratifs, et en assure l'émargement.</p>
    </div></GCard>
  );
}

// ── Vue formateur : la partie pédagogique seule ───────────────────────

function InfoLine({ Icon, children }: { Icon: typeof Calendar; children: ReactNode }) {
  const th = useTh();
  return (
    <div className="flex items-start gap-2.5 text-sm" style={{ color: th.fg }}>
      <Icon className="w-4 h-4 mt-0.5 shrink-0" style={{ color: th.fg3 }} />
      <div className="min-w-0 break-words">{children}</div>
    </div>
  );
}

function FormateurSessionView({ bundle, activity, busy, run }: { bundle: SessionBundle; activity: Record<string, ActivityRow[]>; busy: boolean; run: Run }) {
  const th = useTh();
  const { session, slots, trainees, signatures } = bundle;
  const f = session.formation;
  const now = new Date();
  const past = slots.filter((s) => new Date(`${s.date}T${s.debut}:00`) <= now);
  const toSign = past.filter((s) => !signatures.some((g) => g.slotId === s.id && g.role === "intervenant"));
  const next = slots.find((s) => new Date(`${s.date}T${s.fin}:00`) >= now);
  const card = (title: string, children: ReactNode, right?: ReactNode) => (
    <GCard><div className="p-4 sm:p-5 space-y-3">
      <div className="flex items-center gap-2"><p className="text-sm font-black flex-1" style={{ color: th.fg }}>{title}</p>{right}</div>
      {children}
    </div></GCard>
  );

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-6 pb-24">
      <div>
        <Link to="/sessions" className="flex items-center gap-1.5 text-sm w-fit hover:opacity-70 mb-3" style={{ color: th.fg3 }}><ChevronLeft className="w-4 h-4" />Mes sessions</Link>
        <p className="text-xs font-bold" style={{ color: th.fg3 }}>{session.reference} · {FINANCEMENT_LABELS[session.financement]}</p>
        <h1 className="text-[1.7rem] sm:text-[2.1rem] leading-[1.1] font-black mt-1" style={{ color: th.fg }}><GT>{session.client.nom}</GT></h1>
        <p className="text-sm mt-1" style={{ color: th.fg2 }}>{f.intitule} · {periodeFr(session.dateDebut, session.dateFin)}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Séances réalisées", value: `${past.length}/${slots.length}` },
          { label: "À émarger", value: String(toSign.length), alert: toSign.length > 0 },
          { label: "Stagiaires", value: String(trainees.length) },
        ].map((k) => (
          <GCard key={k.label}><div className="p-4">
            <p className="text-[11px] font-bold" style={{ color: th.fg3 }}>{k.label}</p>
            <p className="text-[1.8rem] font-black tabular-nums leading-tight" style={{ color: k.alert ? th.danger : th.fg }}>{k.value}</p>
          </div></GCard>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px] items-start">
        <div className="space-y-6">
          {card("Émargement", <RealisationPanel bundle={bundle} activity={activity} busy={busy} run={run} />,
            toSign.length ? <span className="text-xs font-bold" style={{ color: th.danger }}>{toSign.length} séance{toSign.length > 1 ? "s" : ""} à signer</span> : undefined)}
          {card("Évaluation des acquis", <EvaluationPanel bundle={bundle} run={run} />)}
          {card("Programme", (
            <div className="space-y-3">
              {f.objectifs.length > 0 && (
                <div>
                  <p className="text-xs font-bold mb-1" style={{ color: th.fg2 }}>Objectifs</p>
                  <ul className="list-disc pl-5 text-sm space-y-0.5" style={{ color: th.fg }}>{f.objectifs.map((o) => <li key={o}>{o}</li>)}</ul>
                </div>
              )}
              {f.contenu.map((m, i) => (
                <div key={i} className="rounded-[6px] px-3 py-2.5" style={{ background: th.navA }}>
                  <p className="text-sm font-bold" style={{ color: th.fg }}>{m.titre}{m.duree ? <span className="font-normal" style={{ color: th.fg3 }}> · {m.duree}</span> : null}</p>
                  {m.points.length > 0 && <ul className="list-disc pl-5 text-xs mt-1 space-y-0.5" style={{ color: th.fg2 }}>{m.points.map((pt) => <li key={pt}>{pt}</li>)}</ul>}
                </div>
              ))}
              {!f.objectifs.length && !f.contenu.length && <p className="text-xs" style={{ color: th.fg3 }}>Programme non renseigné.</p>}
            </div>
          ))}
        </div>

        <aside className="space-y-4 xl:sticky xl:top-4">
          {card("Infos pratiques", (
            <div className="space-y-2.5">
              <InfoLine Icon={Calendar}>{periodeFr(session.dateDebut, session.dateFin)} · {heures(f.dureeHeures)}</InfoLine>
              {next && <InfoLine Icon={PenLine}>Prochaine séance : {dateLongueFr(next.date)}, {heureFr(next.debut)} à {heureFr(next.fin)}</InfoLine>}
              <InfoLine Icon={GraduationCap}>{MODALITE_LABELS[f.modalite]}</InfoLine>
              {session.lieu && <InfoLine Icon={MapPin}>{session.lieu}</InfoLine>}
              {session.lienConnexion && (
                <InfoLine Icon={Video}><a href={session.lienConnexion} target="_blank" rel="noopener noreferrer" className="underline">Rejoindre la classe virtuelle</a></InfoLine>
              )}
              {session.companyId && (
                <InfoLine Icon={Building2}><Link to={`/clients/entreprises/${session.companyId}`} className="underline">Espace de formation de l'entreprise</Link></InfoLine>
              )}
            </div>
          ))}
          {card(`Stagiaires (${trainees.length})`, (
            <div className="space-y-1">
              {!trainees.length && <p className="text-xs" style={{ color: th.fg3 }}>Aucun stagiaire inscrit pour l'instant.</p>}
              {trainees.map((tr) => (
                <div key={tr.id} className="py-1.5" style={{ borderBottom: `1px solid ${th.sep}` }}>
                  <p className="text-sm font-semibold" style={{ color: th.fg }}>{tr.civilite} {tr.prenom} {tr.nom}</p>
                  <p className="text-[11px] truncate" style={{ color: th.fg3 }}>{tr.fonction ? `${tr.fonction} · ` : ""}{tr.email}</p>
                </div>
              ))}
            </div>
          ), <Users className="w-4 h-4" style={{ color: th.fg3 }} />)}
          <p className="text-[11px] px-1" style={{ color: th.fg3 }}>Le planning, les inscriptions et les documents administratifs sont gérés par l'administrateur.</p>
        </aside>
      </div>
    </div>
  );
}
