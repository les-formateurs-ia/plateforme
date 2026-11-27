import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router";
import {
  Activity, Award, BadgeCheck, BookOpen, CalendarCheck, CalendarDays, ClipboardList, LayoutDashboard, Check, CheckCircle2, ChevronDown, ClipboardCheck, Clock, Download, FileSignature, FileText,
  GraduationCap, Lock, Mail, MapPin, PenLine, Phone, Receipt, Scale, Send, ShieldCheck, Users, Video, X, type LucideIcon,
} from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { Logo } from "@/app/components/common/Logo";
import { GCard } from "@/app/components/common/GCard";
import { ShimBtn } from "@/app/components/common/Buttons";
import { NeuralField } from "@/app/components/particles/NeuralField";
import { Background } from "@/app/components/common/Background";
import logoSvg from "@/imports/logo-les-formateurs-ia.svg?raw";
import { openDocument } from "@/app/lib/documents/openDocument";
import { creneauDuree, dateLongueFr, heureFr, heures, MODALITE_LABELS, periodeFr, stampSignature, withSignatureProof } from "@/app/lib/documents/render";
import { DOCUMENT_TEMPLATES, renderTemplate } from "@/app/lib/documents/catalog";
import { ORGANISME } from "@/app/lib/documents/organisme";
import type { DocumentContext, Financement } from "@/app/lib/documents/types";
import {
  clientMeetingFileUrl, getClientDocument, getClientPortal, signClientDocument, signClientDocumentAs, todayIso,
  type ClientDocument, type ClientPortal, type PortalDocument, type PortalMeeting, type PortalPositioning, type PortalTrainee,
} from "@/app/lib/trainingSessions";

// Espace client d'une formation, ouvert par lien personnel et sans compte.
// En haut, l'essentiel (formation, compte à rebours, parcours, documents à
// signer) ; dessous, des onglets : vue d'ensemble, documents (à signer sur
// place), programme, planning et présence, test de positionnement des
// collaborateurs, rendez-vous avec l'organisme. L'onglet ouvert est dans
// l'adresse (?onglet=documents) pour pouvoir y renvoyer directement.

type Tab = "apercu" | "documents" | "programme" | "planning" | "positionnement" | "rendez-vous";

const GREEN = "#1BAF7A";
const AVATAR_COLORS = ["#2A78D6", "#EB6834", "#1BAF7A", "#9b6fd6", "#e0a526", "#d6456b", "#2fb3c4"];

type Phase = "avant" | "pendant" | "apres";
const PHASE_META: Record<Phase, { titre: string; color: string }> = {
  avant: { titre: "Avant", color: "#2A78D6" },
  pendant: { titre: "Pendant", color: "#9b6fd6" },
  apres: { titre: "Après", color: GREEN },
};

// Présentation de chaque document : phase, icône et libellé court.
const DOC_META: Record<string, { phase: Phase; Icon: LucideIcon; label: string }> = {
  devis: { phase: "avant", Icon: Receipt, label: "Devis" },
  convention: { phase: "avant", Icon: FileSignature, label: "Convention" },
  "contrat-particulier": { phase: "avant", Icon: FileSignature, label: "Contrat de formation" },
  convocation: { phase: "avant", Icon: Send, label: "Convocation" },
  programme: { phase: "avant", Icon: BookOpen, label: "Programme" },
  cgv: { phase: "avant", Icon: Scale, label: "Conditions générales" },
  "reglement-interieur": { phase: "avant", Icon: ShieldCheck, label: "Règlement intérieur" },
  emargement: { phase: "pendant", Icon: ClipboardCheck, label: "Feuilles d'émargement" },
  "releve-connexions": { phase: "pendant", Icon: Activity, label: "Relevé de connexions" },
  "certificat-realisation": { phase: "apres", Icon: Award, label: "Certificat de réalisation" },
  "attestation-fin-formation": { phase: "apres", Icon: BadgeCheck, label: "Attestation de fin de formation" },
  "attestation-assiduite": { phase: "apres", Icon: BadgeCheck, label: "Attestation d'assiduité" },
};
const DOC_ORDER = Object.keys(DOC_META);

const dateHeure = (iso: string) => new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeStyle: "short", timeZone: "Europe/Paris" }).format(new Date(iso));

function daysBetween(a: string, b: string): number {
  const [y1, m1, d1] = a.split("-").map(Number);
  const [y2, m2, d2] = b.split("-").map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86_400_000);
}

// Version affichée d'un document : signature du client dans sa case et
// certificat de signature en dernière page une fois signé.
function displayHtml(doc: ClientDocument): string {
  if (!doc.signedAt) return doc.html;
  return withSignatureProof(doc.html, {
    titre: doc.title, sha256: doc.sha256, emisLe: doc.issuedAt, emisPar: "Les Formateurs IA",
    signataire: doc.signerName ?? "", signeLe: doc.signedAt, ip: doc.signedIp, navigateur: doc.signedUserAgent,
  });
}

// Documents d'information remis à tout client, sans signature : toujours
// consultables, même avant d'être émis depuis le dossier (version à jour,
// générée à partir du programme de la formation).
const ALWAYS_AVAILABLE = ["programme", "cgv", "reglement-interieur"];
const LIVE_PREFIX = "live:";

function portalContext(p: ClientPortal): DocumentContext {
  return {
    organisme: ORGANISME,
    formation: p.formation,
    session: {
      reference: p.reference, dateDebut: p.dateDebut, dateFin: p.dateFin, lieu: p.lieu, lienConnexion: p.lienConnexion,
      creneaux: p.seances.map(({ date, debut, fin }) => ({ date, debut, fin })), intervenants: p.intervenants, effectif: Math.max(p.stagiaires.length, 1),
    },
    client: { type: p.financement === "entreprise" || p.financement === "opco" ? "entreprise" : "particulier", nom: p.client, adresse: "", codePostal: "", ville: "", siret: null, representant: null, email: "" },
    stagiaires: [],
    financement: p.financement as Financement,
    financeur: null,
    lignes: [],
    numero: p.reference,
    dateDocument: todayIso(),
    validiteDevisJours: 30,
    conditionsPaiement: "",
  };
}

type Tile = { templateId: string; doc: PortalDocument | null; lockedHint: string };
type DocState = "to-sign" | "signed" | "available" | "upcoming";
const stateOf = (t: Tile): DocState =>
  !t.doc ? "upcoming" : t.doc.requiresSignature && !t.doc.signedAt ? "to-sign" : t.doc.signedAt ? "signed" : "available";
const dateCourte = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

// En-tête d'un bloc de documents : pastille, titre, nombre et explication.
function DocGroupTitle({ Icon, title, count, hint, tone }: { Icon: LucideIcon; title: string; count: number; hint: string; tone: string }) {
  const th = useTh();
  return (
    <div className="flex items-center gap-3">
      <span className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: `${tone}1f`, color: tone }}><Icon className="w-4 h-4" /></span>
      <div className="min-w-0">
        <p className="text-base font-black leading-tight" style={{ color: th.fg }}>
          {title} <span className="ml-1 text-xs font-bold tabular-nums px-2 py-0.5 rounded-full align-middle" style={{ background: th.navA, color: th.fg2 }}>{count}</span>
        </p>
        <p className="text-xs mt-0.5" style={{ color: th.fg3 }}>{hint}</p>
      </div>
    </div>
  );
}

// Document qui attend la signature du client : mis en avant, action explicite.
function SignCard({ tile, index, onOpen }: { tile: Tile; index: number; onOpen: (d: PortalDocument) => void }) {
  const th = useTh();
  const meta = DOC_META[tile.templateId];
  const d = tile.doc!;
  return (
    <div className="fade-up flex items-center gap-4 flex-wrap rounded-[12px] p-4 sm:p-5"
      style={{ animationDelay: `${60 + index * 60}ms`, background: th.card, border: `2px solid ${th.ink}`, boxShadow: "0 10px 30px -18px rgba(0,0,0,0.45)" }}>
      <span className="w-12 h-12 rounded-[12px] flex items-center justify-center shrink-0" style={{ background: th.ink, color: th.onInk }}><meta.Icon className="w-5 h-5" /></span>
      <div className="flex-1 min-w-[180px]">
        <p className="text-[11px] font-black uppercase tracking-widest" style={{ color: th.danger }}>Signature attendue</p>
        <p className="text-lg font-black leading-tight mt-0.5" style={{ color: th.fg }}>{meta.label}</p>
        <p className="text-xs mt-1" style={{ color: th.fg3 }}>Reçu le {dateCourte(d.issuedAt)} · une case à cocher et « Signer », la signature est horodatée.</p>
      </div>
      <ShimBtn sm onClick={() => onOpen(d)}><PenLine className="w-4 h-4 inline -mt-0.5 mr-1.5" />Lire et signer</ShimBtn>
    </div>
  );
}

// Document disponible (signé ou simplement remis) : ouvrable et téléchargeable.
function AvailableCard({ tile, index, onOpen }: { tile: Tile; index: number; onOpen: (d: PortalDocument) => void }) {
  const th = useTh();
  const meta = DOC_META[tile.templateId];
  const color = PHASE_META[meta.phase].color;
  const d = tile.doc!;
  const signedDoc = !!d.signedAt;
  return (
    <button type="button" onClick={() => onOpen(d)}
      className="fade-up group text-left rounded-[10px] p-4 flex items-start gap-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
      style={{ animationDelay: `${60 + index * 40}ms`, background: th.card, border: `1px solid ${th.sep}` }}>
      <span className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0" style={{ background: `${color}1f`, color }}><meta.Icon className="w-5 h-5" /></span>
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-black leading-tight" style={{ color: th.fg }}>{meta.label}</span>
        <span className="mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold"
          style={signedDoc ? { background: `${GREEN}1f`, color: GREEN } : { background: th.navA, color: th.fg2 }}>
          {signedDoc ? <><CheckCircle2 className="w-3 h-3" />Signé le {new Date(d.signedAt!).toLocaleDateString("fr-FR")}</>
            : d.id.startsWith(LIVE_PREFIX) ? <><FileText className="w-3 h-3" />Disponible</>
              : <><FileText className="w-3 h-3" />Reçu le {new Date(d.issuedAt).toLocaleDateString("fr-FR")}</>}
        </span>
      </span>
      <span className="self-center inline-flex items-center gap-1 text-xs font-semibold shrink-0" style={{ color: th.fg2 }}>
        <span className="hidden sm:inline group-hover:underline">Consulter</span><Download className="w-4 h-4" />
      </span>
    </button>
  );
}

// Document prévu mais pas encore émis : en pointillés, avec le moment où il arrivera.
function UpcomingRow({ tile }: { tile: Tile }) {
  const th = useTh();
  const meta = DOC_META[tile.templateId];
  return (
    <li className="flex items-center gap-3 rounded-[10px] px-4 py-3" style={{ border: `1.5px dashed ${th.inputB}`, background: "transparent" }}>
      <span className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0" style={{ background: th.navA, color: th.fg3 }}><Lock className="w-4 h-4" /></span>
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-bold leading-tight" style={{ color: th.fg2 }}>{meta.label}</span>
        <span className="flex items-center gap-1 text-[11px] mt-0.5" style={{ color: th.fg3 }}><Clock className="w-3 h-3" />{tile.lockedHint}</span>
      </span>
    </li>
  );
}

function Avatar({ t, index, size = 34, state }: { t: PortalTrainee; index: number; size?: number; state?: "present" | "absent" | "a-venir" }) {
  const initials = `${t.prenom[0] ?? ""}${t.nom[0] ?? ""}`.toUpperCase();
  return (
    <span title={`${t.prenom} ${t.nom}${state === "present" ? " · présent(e)" : state === "absent" ? " · absent(e)" : ""}`}
      className="relative inline-flex items-center justify-center rounded-full font-black text-white shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.36, background: AVATAR_COLORS[index % AVATAR_COLORS.length], opacity: state === "absent" ? 0.35 : 1, boxShadow: "0 0 0 2px var(--avatar-ring, #fff)" }}>
      {initials}
      {state === "present" && (
        <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center" style={{ background: GREEN }}>
          <Check className="w-2.5 h-2.5" />
        </span>
      )}
    </span>
  );
}

export function ClientPortalPage() {
  const th = useTh();
  const { token } = useParams<{ token: string }>();
  const [portal, setPortal] = useState<ClientPortal | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "missing">("loading");
  const [viewing, setViewing] = useState<{ meta: PortalDocument; doc: ClientDocument } | null>(null);
  const [openModule, setOpenModule] = useState<number | null>(0);
  const [params, setParams] = useSearchParams();

  const load = async () => {
    if (!token) return;
    try {
      const p = await getClientPortal(token);
      setPortal(p);
      setState(p ? "ready" : "missing");
    } catch (err) {
      console.error(err);
      setState("missing");
    }
  };
  useEffect(() => { void load(); }, [token]);

  const open = async (meta: PortalDocument) => {
    if (!token || !portal) return;
    if (meta.id.startsWith(LIVE_PREFIX)) {
      const template = DOCUMENT_TEMPLATES.find((t) => t.id === meta.templateId)!;
      // Les repères « À compléter » du backoffice ne sont pas montrés au client.
      const html = renderTemplate(template, portalContext(portal), logoSvg).replace(/<mark class="todo">[^<]*<\/mark>/g, "—");
      setViewing({ meta, doc: { title: meta.title, html, sha256: "", issuedAt: meta.issuedAt, requiresSignature: false, signerName: null, signedAt: null, signedIp: null, signedUserAgent: null } });
      return;
    }
    const doc = await getClientDocument(token, meta.id);
    if (doc) setViewing({ meta, doc });
  };

  if (state === "loading") return <div className="min-h-dvh p-8 text-sm" style={{ background: th.bg, color: th.fg3 }}>Chargement de votre espace…</div>;
  if (state === "missing" || !portal) {
    return (
      <div className="min-h-dvh p-8" style={{ background: th.bg }}>
        <Logo h={26} />
        <p className="text-lg font-black mt-8" style={{ color: th.fg }}>Lien invalide</p>
        <p className="text-sm mt-2" style={{ color: th.fg2 }}>Ce lien n'existe pas ou n'est plus valable. Contactez Les Formateurs IA à contact@les-formateurs-ia.fr.</p>
      </div>
    );
  }

  const f = portal.formation;
  const today = todayIso();
  const started = today >= portal.dateDebut;
  const ended = today > portal.dateFin;
  const total = daysBetween(portal.dateDebut, portal.dateFin) + 1;
  const status = !started
    ? { big: `J-${daysBetween(today, portal.dateDebut)}`, label: "avant le début de votre formation" }
    : ended ? { big: "Terminée", label: "Merci pour votre confiance !" }
      : { big: `Jour ${daysBetween(portal.dateDebut, today) + 1}/${total}`, label: "Formation en cours" };

  // Dernière version émise de chaque document.
  const latest = new Map<string, PortalDocument>();
  for (const d of portal.documents) if (!latest.has(d.templateId)) latest.set(d.templateId, d);
  // Documents d'information : toujours la version à jour, générée depuis la
  // fiche de la formation, même si une version a été émise plus tôt (un
  // programme modifié ou importé ensuite doit apparaître tel quel au client).
  // Les versions émises restent dans l'archive du dossier côté backoffice.
  for (const id of ALWAYS_AVAILABLE) {
    if (latest.get(id)?.signedAt) continue;
    const template = DOCUMENT_TEMPLATES.find((t) => t.id === id)!;
    latest.set(id, { id: `${LIVE_PREFIX}${id}`, templateId: id, title: template.titre, issuedAt: new Date().toISOString(), requiresSignature: false, signedAt: null, signerName: null });
  }
  const signed = (id: string) => !!latest.get(id)?.signedAt;

  const seances = portal.seances;
  const pastSeances = seances.filter((s) => s.date < today || (s.date === today && s.fin <= new Date().toTimeString().slice(0, 5)));
  const nextSeance = seances.find((s) => !pastSeances.includes(s));
  const b2b = portal.financement === "entreprise" || portal.financement === "opco";
  const particulier = portal.financement === "particulier";

  // Les grandes étapes de la formation, vues du client.
  const milestones = [
    ...(b2b || particulier ? [{ label: "Devis accepté", done: signed("devis") }] : []),
    ...(b2b ? [{ label: "Convention signée", done: signed("convention") }] : []),
    ...(particulier ? [{ label: "Contrat signé", done: signed("contrat-particulier") }] : []),
    { label: "Convocations reçues", done: latest.has("convocation") },
    { label: seances.length ? `Formation réalisée · ${pastSeances.length}/${seances.length}` : "Formation réalisée", done: ended || (seances.length > 0 && pastSeances.length === seances.length) },
    { label: "Certificat disponible", done: latest.has("certificat-realisation") },
  ];
  const progress = Math.round((milestones.filter((m) => m.done).length / milestones.length) * 100);

  const presence = (t: PortalTrainee) => (pastSeances.length ? pastSeances.filter((s) => s.presents.includes(t.id)).length / pastSeances.length : null);
  const seanceDuree = (s: { date: string; debut: string; fin: string }) => heures(creneauDuree(s));
  const programmeDoc = latest.get("programme");

  // Les documents, rangés par état : à signer, disponibles, à venir. Ce qui
  // arrivera plus tard (contrat, convocation, certificats) dit quand il arrive.
  const expected = [
    ...(b2b ? ["devis", "convention"] : particulier ? ["devis", "contrat-particulier"] : []),
    "convocation", "certificat-realisation", "attestation-fin-formation",
  ];
  const UPCOMING_HINTS: Record<string, string> = {
    devis: "Envoyé dès que votre proposition est prête",
    convention: "Après acceptation du devis",
    "contrat-particulier": "Après acceptation du devis",
    convocation: "Quelques jours avant le début de la formation",
  };
  const tiles: Tile[] = DOC_ORDER
    .filter((id) => latest.has(id) || expected.includes(id))
    .map((id) => ({
      templateId: id, doc: latest.get(id) ?? null,
      lockedHint: UPCOMING_HINTS[id] ?? (DOC_META[id].phase === "apres" ? "À la fin de la formation" : "En préparation"),
    }));
  const toSignTiles = tiles.filter((t) => stateOf(t) === "to-sign");
  // Disponibles : les documents signés d'abord, puis l'ordre du parcours.
  const availableTiles = tiles.filter((t) => stateOf(t) === "signed" || stateOf(t) === "available")
    .sort((a, b) => Number(stateOf(b) === "signed") - Number(stateOf(a) === "signed"));
  const upcomingTiles = tiles.filter((t) => stateOf(t) === "upcoming");

  const docsSection = (
        <section className="space-y-6">
          <div className="flex items-end gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <p className="eyebrow" style={{ color: th.fg3 }}>Documents</p>
              <h2 className="text-[1.5rem] sm:text-[1.8rem] font-black leading-tight mt-1" style={{ color: th.fg }}>Vos documents de formation</h2>
            </div>
            {/* Résumé : une barre en trois couleurs, comme les trois blocs. */}
            <div className="w-full sm:w-72">
              <div className="flex h-2 rounded-full overflow-hidden" style={{ background: th.navA }}>
                <span style={{ width: `${(availableTiles.length / tiles.length) * 100}%`, background: GREEN }} />
                <span style={{ width: `${(toSignTiles.length / tiles.length) * 100}%`, background: th.ink }} />
              </div>
              <div className="flex justify-between gap-2 mt-1.5 text-[11px] font-semibold" style={{ color: th.fg3 }}>
                <span><span style={{ color: GREEN }}>●</span> {availableTiles.length} disponible{availableTiles.length > 1 ? "s" : ""}</span>
                {toSignTiles.length > 0 && <span><span style={{ color: th.fg }}>●</span> {toSignTiles.length} à signer</span>}
                <span>○ {upcomingTiles.length} à venir</span>
              </div>
            </div>
          </div>

          {toSignTiles.length > 0 && (
            <div className="space-y-3">
              <DocGroupTitle Icon={PenLine} tone={th.danger} title="À signer" count={toSignTiles.length} hint="Ces documents attendent votre accord pour que la formation avance." />
              <div className="grid gap-3 lg:grid-cols-2">
                {toSignTiles.map((t, i) => <SignCard key={t.templateId} tile={t} index={i} onOpen={(d) => void open(d)} />)}
              </div>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] items-start">
            <div className="space-y-3 min-w-0">
              <DocGroupTitle Icon={FileText} tone={GREEN} title="Disponibles" count={availableTiles.length} hint="À consulter ou télécharger à tout moment." />
              {availableTiles.length ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {availableTiles.map((t, i) => <AvailableCard key={t.templateId} tile={t} index={i} onOpen={(d) => void open(d)} />)}
                </div>
              ) : <p className="text-sm" style={{ color: th.fg3 }}>Aucun document pour le moment.</p>}
            </div>
            {upcomingTiles.length > 0 && (
              <div className="space-y-3">
                <DocGroupTitle Icon={Clock} tone={th.fg3} title="À venir" count={upcomingTiles.length} hint="Ils apparaîtront ici au fil de la formation." />
                <ul className="space-y-2">{upcomingTiles.map((t) => <UpcomingRow key={t.templateId} tile={t} />)}</ul>
              </div>
            )}
          </div>
        </section>
  );
  const seanceCard = (<>
            {nextSeance ? (
              <GCard><div className="fade-up p-5 sm:p-6 flex gap-5 items-center flex-wrap">
                <div className="w-[84px] shrink-0 text-center rounded-[10px] py-3" style={{ background: th.ink, color: th.onInk }}>
                  <p className="text-xs font-bold uppercase">{new Date(`${nextSeance.date}T12:00:00`).toLocaleDateString("fr-FR", { month: "short" })}</p>
                  <p className="text-[2.2rem] font-black leading-none">{Number(nextSeance.date.slice(8))}</p>
                  <p className="text-[11px] mt-0.5 opacity-70">{new Date(`${nextSeance.date}T12:00:00`).toLocaleDateString("fr-FR", { weekday: "short" })}</p>
                </div>
                <div className="flex-1 min-w-[220px] space-y-2">
                  <p className="eyebrow" style={{ color: th.fg3 }}>
                    Prochaine séance · {nextSeance.date === today ? "aujourd'hui" : daysBetween(today, nextSeance.date) === 1 ? "demain" : `dans ${daysBetween(today, nextSeance.date)} jours`}
                  </p>
                  <p className="text-xl font-black" style={{ color: th.fg }}>{heureFr(nextSeance.debut)} – {heureFr(nextSeance.fin)} <span className="text-sm font-semibold" style={{ color: th.fg3 }}>({seanceDuree(nextSeance)})</span></p>
                  <p className="text-sm flex items-center gap-1.5" style={{ color: th.fg2 }}>
                    {portal.lienConnexion ? <><Video className="w-4 h-4" />Classe virtuelle</> : <><MapPin className="w-4 h-4" />{portal.lieu || "Lieu communiqué prochainement"}</>}
                  </p>
                  {portal.stagiaires.length > 0 && (
                    <div className="flex items-center gap-3 pt-1">
                      <div className="flex -space-x-2">{portal.stagiaires.slice(0, 8).map((t, i) => <Avatar key={t.id} t={t} index={i} size={30} />)}</div>
                      <span className="text-xs" style={{ color: th.fg3 }}>{portal.stagiaires.length} inscrit{portal.stagiaires.length > 1 ? "s" : ""}</span>
                    </div>
                  )}
                </div>
                {portal.lienConnexion && /^https?:/.test(portal.lienConnexion) && (
                  <a href={portal.lienConnexion} target="_blank" rel="noreferrer" className="sweep inline-flex items-center gap-2 min-h-10 px-4 rounded-[2px] text-sm font-semibold" style={{ background: th.ink, color: th.onInk }}>
                    <Video className="w-4 h-4" />Rejoindre
                  </a>
                )}
              </div></GCard>
            ) : ended && (
              <GCard><div className="fade-up p-6 flex items-center gap-4">
                <GraduationCap className="w-9 h-9 shrink-0" style={{ color: GREEN }} />
                <div>
                  <p className="text-lg font-black" style={{ color: th.fg }}>Formation terminée 🎉</p>
                  <p className="text-sm" style={{ color: th.fg2 }}>{latest.has("certificat-realisation") ? "Le certificat de réalisation et les attestations sont disponibles dans vos documents." : "Le certificat de réalisation et les attestations seront bientôt disponibles dans vos documents."}</p>
                </div>
              </div></GCard>
            )}
  </>);
  const planningCard = (<>
            {seances.length > 0 && (
              <GCard><div className="fade-up p-5 sm:p-6">
                <div className="flex items-baseline justify-between mb-4">
                  <p className="text-base font-black" style={{ color: th.fg }}>Planning des séances</p>
                  <p className="text-xs" style={{ color: th.fg3 }}>{pastSeances.length}/{seances.length} réalisées</p>
                </div>
                <ol className="relative">
                  {seances.map((s, i) => {
                    const past = pastSeances.includes(s);
                    const isNext = s === nextSeance;
                    return (
                      <li key={s.id} className="relative flex gap-4 pb-4 last:pb-0">
                        {i < seances.length - 1 && <span aria-hidden className="absolute left-[11px] top-7 bottom-0 w-0.5" style={{ background: past ? GREEN : th.sep }} />}
                        <span className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                          style={{ background: past ? GREEN : isNext ? th.ink : th.navA, color: "#fff" }}>
                          {past ? <Check className="w-3.5 h-3.5" /> : isNext ? <span className="w-2 h-2 rounded-full bg-white animate-pulse" /> : null}
                        </span>
                        <div className="flex-1 min-w-0 flex items-center gap-3 flex-wrap">
                          <div className="min-w-[180px] flex-1">
                            <p className="text-sm font-bold capitalize" style={{ color: th.fg }}>{dateLongueFr(s.date)}</p>
                            <p className="text-xs" style={{ color: th.fg3 }}>{heureFr(s.debut)} – {heureFr(s.fin)} · {seanceDuree(s)}</p>
                          </div>
                          {portal.stagiaires.length > 0 && (
                            <div className="flex items-center gap-2">
                              <div className="flex -space-x-1.5">
                                {portal.stagiaires.map((t, ti) => <Avatar key={t.id} t={t} index={ti} size={26} state={past ? (s.presents.includes(t.id) ? "present" : "absent") : "a-venir"} />)}
                              </div>
                              {past && <span className="text-xs tabular-nums" style={{ color: th.fg3 }}>{s.presents.length}/{portal.stagiaires.length}</span>}
                            </div>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div></GCard>
            )}
  </>);
  const collabCard = (<>
            {portal.stagiaires.length > 0 && (
              <GCard><div className="fade-up p-4 space-y-3">
                <div className="flex items-baseline justify-between">
                  <p className="text-sm font-black" style={{ color: th.fg }}>Vos collaborateurs</p>
                  <p className="text-xs" style={{ color: th.fg3 }}>{portal.stagiaires.length} inscrit{portal.stagiaires.length > 1 ? "s" : ""}</p>
                </div>
                {portal.stagiaires.map((t, i) => {
                  const p = presence(t);
                  return (
                    <div key={t.id} className="flex items-center gap-3">
                      <Avatar t={t} index={i} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: th.fg }}>{t.prenom} {t.nom}</p>
                        {p === null ? (
                          <p className="text-[11px] truncate" style={{ color: th.fg3 }}>{t.fonction ?? "Inscrit(e)"}</p>
                        ) : (
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: th.navA }}>
                              <div className="h-full rounded-full" style={{ width: `${p * 100}%`, background: GREEN }} />
                            </div>
                            <span className="text-[11px] tabular-nums" style={{ color: th.fg3 }}>{Math.round(p * 100)} %</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                {pastSeances.length > 0 && <p className="text-[11px]" style={{ color: th.fg3 }}>Taux de présence aux séances passées, d'après l'émargement en ligne.</p>}
              </div></GCard>
            )}
  </>);
  const formateurCard = (
            <GCard><div className="fade-up p-4 space-y-3">
              <p className="text-sm font-black" style={{ color: th.fg }}>Votre formateur</p>
              {portal.intervenants.map((it) => (
                <div key={it.nom} className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: th.ink, color: th.onInk }}><GraduationCap className="w-5 h-5" /></span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold" style={{ color: th.fg }}>{it.nom}</p>
                    <p className="text-[11px] leading-snug" style={{ color: th.fg3 }}>{it.qualite}</p>
                  </div>
                </div>
              ))}
              <div className="pt-2 space-y-1.5" style={{ borderTop: `1px solid ${th.sep}` }}>
                <a href="mailto:contact@les-formateurs-ia.fr" className="flex items-center gap-2 text-xs hover:opacity-70" style={{ color: th.fg2 }}><Mail className="w-3.5 h-3.5" />contact@les-formateurs-ia.fr</a>
                <a href="tel:+33980874046" className="flex items-center gap-2 text-xs hover:opacity-70" style={{ color: th.fg2 }}><Phone className="w-3.5 h-3.5" />09 80 87 40 46</a>
              </div>
            </div></GCard>
  );
  const programmeCard = (
        <GCard><div className="p-5 sm:p-7 space-y-5">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="w-10 h-10 rounded-[10px] flex items-center justify-center" style={{ background: "#2A78D61f", color: "#2A78D6" }}><BookOpen className="w-5 h-5" /></span>
            <p className="text-lg font-black flex-1" style={{ color: th.fg }}>Programme de la formation</p>
            {programmeDoc && (
              <button type="button" onClick={() => void open(programmeDoc)} className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-[2px] hover:opacity-70" style={{ border: `1px solid ${th.sep}`, color: th.fg }}>
                <Download className="w-3.5 h-3.5" />Programme complet
              </button>
            )}
          </div>
          {f.accroche && <p className="text-sm leading-relaxed max-w-3xl" style={{ color: th.fg2 }}>{f.accroche}</p>}
          {f.objectifs.length > 0 && (
            <div>
              <p className="text-xs font-bold mb-2" style={{ color: th.fg3 }}>À l'issue de la formation, vos collaborateurs sauront :</p>
              <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {f.objectifs.map((o, i) => (
                  <li key={o} className="fade-up flex gap-2 text-sm rounded-[8px] p-3" style={{ animationDelay: `${i * 50}ms`, background: th.navA, color: th.fg }}>
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" style={{ color: GREEN }} />{o}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {f.contenu.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold" style={{ color: th.fg3 }}>Contenu</p>
              {f.contenu.map((m, i) => {
                const isOpen = openModule === i;
                return (
                  <div key={m.titre} className="rounded-[8px] overflow-hidden" style={{ border: `1px solid ${th.sep}` }}>
                    <button type="button" onClick={() => setOpenModule(isOpen ? null : i)} className="w-full flex items-center gap-3 px-4 py-3 text-left">
                      <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0" style={{ background: th.ink, color: th.onInk }}>{i + 1}</span>
                      <span className="flex-1 text-sm font-bold" style={{ color: th.fg }}>{m.titre}</span>
                      {m.duree && <span className="text-xs" style={{ color: th.fg3 }}>{m.duree}</span>}
                      <ChevronDown className="w-4 h-4 transition-transform" style={{ color: th.fg3, transform: isOpen ? "rotate(180deg)" : undefined }} />
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 pl-14 space-y-2">
                        {m.objectif && <p className="text-xs" style={{ color: th.fg2 }}>{m.objectif}</p>}
                        <ul className="space-y-1">{m.points.map((pt) => <li key={pt} className="text-sm" style={{ color: th.fg }}>• {pt}</li>)}</ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { titre: "Méthodes", items: f.methodes },
              { titre: "Évaluation", items: f.modalitesEvaluation },
              { titre: "Prérequis", items: f.prerequis },
              { titre: "Public visé", items: f.publicVise },
            ].filter((b) => b.items.length).map((b) => (
              <div key={b.titre}>
                <p className="text-xs font-bold mb-1.5" style={{ color: th.fg3 }}>{b.titre}</p>
                <ul className="space-y-1">{b.items.map((it) => <li key={it} className="text-xs leading-relaxed" style={{ color: th.fg2 }}>• {it}</li>)}</ul>
              </div>
            ))}
          </div>
        </div></GCard>
  );

  const tabs: { id: Tab; label: string; Icon: LucideIcon; badge?: number; urgent?: boolean }[] = [
    { id: "apercu", label: "Vue d'ensemble", Icon: LayoutDashboard },
    { id: "documents", label: "Documents", Icon: FileText, badge: toSignTiles.length || undefined, urgent: toSignTiles.length > 0 },
    { id: "programme", label: "Programme", Icon: BookOpen },
    { id: "planning", label: "Planning et présence", Icon: CalendarDays },
    ...(b2b ? [{ id: "positionnement" as Tab, label: "Test de positionnement", Icon: ClipboardList }] : []),
    { id: "rendez-vous", label: "Vos rendez-vous", Icon: CalendarCheck, badge: portal.rendezVous.length || undefined },
  ];
  const tab: Tab = tabs.some((t) => t.id === params.get("onglet")) ? params.get("onglet") as Tab : "apercu";
  const goTo = (id: Tab) => {
    setParams(id === "apercu" ? {} : { onglet: id }, { replace: true });
    document.getElementById("onglets")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const positioningDone = portal.positionnement ? new Set(portal.positionnement.resultats.map((r) => r.traineeId)).size : 0;

  return (
    <div className="min-h-dvh relative" style={{ background: th.bg, ["--avatar-ring" as string]: th.card }}>
      <Background />
      <header className="relative z-10 px-5 sm:px-8 py-4 flex items-center gap-4" style={{ borderBottom: `1px solid ${th.sep}` }}>
        <Logo h={24} />
        <span className="text-xs font-semibold ml-auto" style={{ color: th.fg3 }}>Espace formation · {portal.client}</span>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-6">
        {/* Où en est la formation. */}
        <section className="fade-up relative overflow-hidden rounded-[14px] bg-black text-white">
          <NeuralField dark density={3.2} band={0.9} />
          <div aria-hidden className="absolute inset-0" style={{ background: "linear-gradient(90deg,rgba(0,0,0,0.93) 0%,rgba(0,0,0,0.62) 60%,rgba(0,0,0,0.2) 100%)" }} />
          <div className="relative p-6 sm:p-8 space-y-6">
            <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <p className="eyebrow text-white/55">Votre formation · {portal.client}</p>
                <h1 className="text-[1.7rem] sm:text-[2.3rem] font-extrabold leading-[1.05] mt-2.5 tracking-[-0.03em]">{f.intitule}</h1>
                <div className="flex flex-wrap gap-2 mt-4">
                  {[
                    { Icon: CalendarDays, text: periodeFr(portal.dateDebut, portal.dateFin) },
                    { Icon: Clock, text: `${f.dureeHeures} h · ${MODALITE_LABELS[f.modalite]?.split(" (")[0] ?? f.modalite}` },
                    ...(portal.lieu ? [{ Icon: MapPin, text: portal.lieu }] : []),
                    ...(portal.stagiaires.length ? [{ Icon: Users, text: `${portal.stagiaires.length} collaborateur${portal.stagiaires.length > 1 ? "s" : ""}` }] : []),
                  ].map(({ Icon, text }) => (
                    <span key={text} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm bg-white/10 text-white/85"><Icon className="w-4 h-4" />{text}</span>
                  ))}
                </div>
              </div>
              <div className="lg:text-right">
                <p className="text-[2.6rem] sm:text-[3.2rem] font-extrabold leading-none tracking-[-0.04em]">{status.big}</p>
                <p className="text-sm text-white/60 mt-2">{status.label}</p>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-xs text-white/60 mb-3">
                <span className="font-semibold text-white/80">Votre parcours</span><span className="tabular-nums">{progress} %</span>
              </div>
              <ol className="grid gap-2" style={{ gridTemplateColumns: `repeat(${milestones.length}, minmax(0, 1fr))` }}>
                {milestones.map((m, i) => (
                  <li key={m.label} className="space-y-2">
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.15)" }}>
                      <div className="h-full rounded-full" style={{ width: m.done ? "100%" : "0%", background: GREEN, transition: `width 700ms ease ${200 + i * 120}ms` }} />
                    </div>
                    <p className="flex items-start gap-1.5 text-[11px] sm:text-xs leading-tight" style={{ color: m.done ? "#fff" : "rgba(255,255,255,0.5)" }}>
                      {m.done ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: GREEN }} /> : <span className="w-3.5 text-center shrink-0 font-bold">{i + 1}</span>}
                      {m.label}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
            {toSignTiles.length > 0 && (
              <div className="rounded-[10px] p-3 sm:p-4 flex items-center gap-3 flex-wrap" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.18)" }}>
                <PenLine className="w-5 h-5 shrink-0" />
                <p className="text-sm font-semibold flex-1 min-w-[200px]">
                  {toSignTiles.length === 1 ? "1 document attend votre signature" : `${toSignTiles.length} documents attendent votre signature`}
                </p>
                <div className="flex gap-2 flex-wrap">
                  {toSignTiles.map((t) => (
                    <button key={t.templateId} type="button" onClick={() => void open(t.doc!)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-[2px] bg-white text-black hover:opacity-80">
                      Signer : {DOC_META[t.templateId].label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Tout le reste, par onglet. */}
        <nav id="onglets" className="sticky top-0 z-20 -mx-4 sm:mx-0 px-4 sm:px-0 py-2 overflow-x-auto" style={{ background: th.bg }}>
          <div className="flex gap-1.5 w-max sm:w-auto sm:flex-wrap" role="tablist">
            {tabs.map((t) => {
              const active = t.id === tab;
              return (
                <button key={t.id} type="button" role="tab" aria-selected={active} onClick={() => goTo(t.id)}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors"
                  style={active ? { background: th.ink, color: th.onInk } : { background: th.navA, color: th.fg2 }}>
                  <t.Icon className="w-4 h-4" />{t.label}
                  {t.badge ? (
                    <span className="text-[11px] tabular-nums px-1.5 rounded-full" style={t.urgent ? { background: th.danger, color: "#fff" } : { background: active ? "rgba(255,255,255,0.2)" : th.card, color: active ? th.onInk : th.fg2 }}>{t.badge}</span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </nav>

        {tab === "apercu" && (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_330px] items-start">
            <div className="space-y-6 min-w-0">
              {nextSeance || ended ? seanceCard : (
                <GCard><div className="fade-up p-6 flex items-center gap-4">
                  <CalendarDays className="w-8 h-8 shrink-0" style={{ color: th.fg3 }} />
                  <div>
                    <p className="text-base font-black" style={{ color: th.fg }}>Formation du {periodeFr(portal.dateDebut, portal.dateFin)}</p>
                    <p className="text-sm" style={{ color: th.fg2 }}>Les horaires des séances apparaîtront ici dès qu'ils seront planifiés.</p>
                  </div>
                </div></GCard>
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                <OverviewTile Icon={FileText} title="Documents" onClick={() => goTo("documents")}
                  value={toSignTiles.length ? `${toSignTiles.length} à signer` : `${availableTiles.length} disponible${availableTiles.length > 1 ? "s" : ""}`}
                  hint={upcomingTiles.length ? `${upcomingTiles.length} à venir au fil de la formation` : "Tous vos documents sont disponibles"} urgent={toSignTiles.length > 0} />
                <OverviewTile Icon={CalendarDays} title="Planning et présence" onClick={() => goTo("planning")}
                  value={seances.length ? `${pastSeances.length}/${seances.length} séance${seances.length > 1 ? "s" : ""}` : "À planifier"}
                  hint={portal.stagiaires.length ? `${portal.stagiaires.length} collaborateur${portal.stagiaires.length > 1 ? "s" : ""} inscrit${portal.stagiaires.length > 1 ? "s" : ""}` : "Inscriptions en cours"} />
                {b2b && (
                  <OverviewTile Icon={ClipboardList} title="Test de positionnement" onClick={() => goTo("positionnement")}
                    value={positioningDone ? `${positioningDone}/${portal.stagiaires.length} réalisé${positioningDone > 1 ? "s" : ""}` : "Pas encore démarré"}
                    hint="Le niveau de vos collaborateurs avant la formation" />
                )}
                <OverviewTile Icon={CalendarCheck} title="Vos rendez-vous" onClick={() => goTo("rendez-vous")}
                  value={portal.rendezVous.length ? `${portal.rendezVous.length} rendez-vous` : "Aucun pour l'instant"}
                  hint={portal.rendezVous[0] ? `Dernier : ${dateCourte(portal.rendezVous[0].date)}` : "Comptes rendus de nos échanges"} />
              </div>
            </div>
            <aside className="space-y-4">{formateurCard}</aside>
          </div>
        )}

        {tab === "documents" && docsSection}

        {tab === "programme" && programmeCard}

        {tab === "planning" && (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_330px] items-start">
            <div className="space-y-6 min-w-0">
              {seanceCard}
              {seances.length > 0 ? planningCard : (
                <p className="text-sm" style={{ color: th.fg3 }}>Le planning des séances n'est pas encore établi.</p>
              )}
            </div>
            <aside className="space-y-4">{collabCard}</aside>
          </div>
        )}

        {tab === "positionnement" && <PositioningPanel data={portal.positionnement} stagiaires={portal.stagiaires} />}

        {tab === "rendez-vous" && <MeetingsPanel token={token!} meetings={portal.rendezVous} />}
      </main>

      {viewing && token && (
        <DocumentViewer token={token} meta={viewing.meta} doc={viewing.doc} signataire={portal.signataire} onClose={() => setViewing(null)}
          onSigned={(signedAt, signerName) => { setViewing({ ...viewing, doc: { ...viewing.doc, signedAt, signerName } }); void load(); }} />
      )}
    </div>
  );
}

// Signataire proposé : le nom prévu à l'émission du document (représentant
// du client), découpé en prénom et nom, et sa fonction.
function proposedSigner(signerName: string | null, signataire: ClientPortal["signataire"]) {
  const full = (signerName || signataire?.nom || "").trim();
  const [prenom = "", ...reste] = full.split(/\s+/);
  return { prenom, nom: reste.join(" "), fonction: signataire?.qualite ?? "" };
}

function DocumentViewer({ token, meta, doc, signataire, onClose, onSigned }: {
  token: string; meta: PortalDocument; doc: ClientDocument; signataire: ClientPortal["signataire"];
  onClose: () => void; onSigned: (signedAt: string, signerName: string) => void;
}) {
  const th = useTh();
  const [dialog, setDialog] = useState(false);
  const [signer, setSigner] = useState(() => proposedSigner(doc.signerName, signataire));
  const [accepted, setAccepted] = useState(false);
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const html = doc.signedAt ? stampSignature(doc.html, "client", doc.signerName ?? "", doc.signedAt) : doc.html;
  const signerLabel = `${signer.prenom.trim()} ${signer.nom.trim().toUpperCase()}${signer.fonction.trim() ? `, ${signer.fonction.trim()}` : ""}`;
  const complete = !!signer.prenom.trim() && !!signer.nom.trim();

  const sign = async () => {
    setSigning(true);
    setError(null);
    try {
      let signedAt: string;
      let signedAs = signerLabel;
      try {
        signedAt = await signClientDocumentAs(token, meta.id, { prenom: signer.prenom.trim(), nom: signer.nom.trim(), fonction: signer.fonction.trim() });
      } catch (err) {
        // Base pas encore migrée (20261128120000) : signature au nom prévu.
        if ((err as { code?: string })?.code !== "PGRST202") throw err;
        signedAt = await signClientDocument(token, meta.id);
        signedAs = doc.signerName ?? "";
      }
      setDialog(false);
      onSigned(signedAt, signedAs);
    } catch (err) {
      console.error(err);
      setError("La signature n'a pas pu être enregistrée. Réessayez dans un instant.");
    } finally {
      setSigning(false);
    }
  };
  const field = (key: keyof typeof signer, label: string, placeholder?: string) => (
    <label className="block">
      <span className="block text-xs font-bold mb-1.5" style={{ color: th.fg2 }}>{label}</span>
      <input value={signer[key]} placeholder={placeholder} onChange={(e) => setSigner((x) => ({ ...x, [key]: e.target.value }))}
        className="w-full rounded-[4px] px-3 py-2 text-sm g-input" />
    </label>
  );

  // Le document seul, puis la boîte d'impression : « Enregistrer au format PDF ».
  const download = () => {
    openDocument(displayHtml(doc), { print: true }).catch((err) => setError(err instanceof Error ? err.message : String(err)));
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "rgba(0,0,0,0.6)" }}>
      <div className="m-0 sm:m-6 flex-1 flex flex-col rounded-none sm:rounded-[10px] overflow-hidden" style={{ background: th.card }}>
        <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: `1px solid ${th.sep}` }}>
          <p className="flex-1 text-sm font-bold truncate" style={{ color: th.fg }}>{doc.title}</p>
          <button type="button" onClick={download} className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-[2px] hover:opacity-70" style={{ border: `1px solid ${th.sep}`, color: th.fg }}>
            <Download className="w-3.5 h-3.5" />Enregistrer en PDF
          </button>
          <button type="button" onClick={onClose} aria-label="Fermer" className="w-9 h-9 flex items-center justify-center hover:opacity-70" style={{ color: th.fg }}><X className="w-5 h-5" /></button>
        </div>
        <iframe title={doc.title} srcDoc={html} sandbox="allow-same-origin allow-modals" className="flex-1 w-full" style={{ border: 0, background: "#eef0f4" }} />
        {dialog && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.55)" }} role="dialog" aria-modal="true" aria-labelledby="sign-title">
            <div className="w-full max-w-md rounded-[12px] p-5 sm:p-6 space-y-4" style={{ background: th.card }}>
              <div className="flex items-start gap-3">
                <span className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0" style={{ background: th.navA, color: th.fg }}><PenLine className="w-5 h-5" /></span>
                <div className="flex-1 min-w-0">
                  <p id="sign-title" className="text-base font-black" style={{ color: th.fg }}>Qui signe ce document ?</p>
                  <p className="text-xs mt-0.5" style={{ color: th.fg3 }}>{doc.title}. Corrigez les champs si ce n'est pas vous qui étiez prévu(e).</p>
                </div>
                <button type="button" onClick={() => setDialog(false)} aria-label="Fermer" className="p-1 hover:opacity-70" style={{ color: th.fg }}><X className="w-5 h-5" /></button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {field("prenom", "Prénom")}
                {field("nom", "Nom")}
              </div>
              {field("fonction", "Fonction", "Directrice des ressources humaines")}
              <label className="flex items-start gap-2.5 text-sm cursor-pointer" style={{ color: th.fg }}>
                <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} className="mt-0.5 w-4 h-4 shrink-0" />
                <span>Je soussigné(e) <strong>{complete ? signerLabel : "…"}</strong>, j'ai lu le document et j'en accepte les termes. Je reconnais que cette validation vaut signature.</span>
              </label>
              {error && <p className="text-sm" style={{ color: th.danger }}>{error}</p>}
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setDialog(false)} className="text-sm font-semibold px-4 py-2 hover:opacity-70" style={{ color: th.fg2 }}>Annuler</button>
                <ShimBtn sm onClick={() => void sign()} disabled={!complete || !accepted || signing}><PenLine className="w-4 h-4" />{signing ? "Signature…" : "Signer"}</ShimBtn>
              </div>
            </div>
          </div>
        )}
        {doc.requiresSignature && (
          <div className="px-4 py-4" style={{ borderTop: `1px solid ${th.sep}` }}>
            {doc.signedAt ? (
              <p className="flex items-center gap-2 text-sm font-semibold" style={{ color: th.fg }}>
                <CheckCircle2 className="w-5 h-5" style={{ color: GREEN }} />Signé{doc.signerName ? ` par ${doc.signerName}` : ""} le {dateHeure(doc.signedAt)}.
              </p>
            ) : (
              <div className="flex items-center gap-4 flex-wrap">
                <p className="text-sm flex-1 min-w-[240px]" style={{ color: th.fg2 }}>Lisez le document, puis signez-le en ligne.</p>
                <ShimBtn sm onClick={() => { setAccepted(false); setError(null); setDialog(true); }}><PenLine className="w-4 h-4" />Signer le document</ShimBtn>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Raccourci de la vue d'ensemble vers un onglet.
function OverviewTile({ Icon, title, value, hint, urgent, onClick }: {
  Icon: LucideIcon; title: string; value: string; hint: string; urgent?: boolean; onClick: () => void;
}) {
  const th = useTh();
  return (
    <button type="button" onClick={onClick} className="fade-up text-left rounded-[10px] p-4 flex items-start gap-3 transition-all hover:-translate-y-0.5 hover:shadow-lg"
      style={{ background: th.card, border: `1px solid ${urgent ? th.danger : th.sep}` }}>
      <span className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0" style={{ background: urgent ? `${th.danger}1f` : th.navA, color: urgent ? th.danger : th.fg2 }}><Icon className="w-5 h-5" /></span>
      <span className="min-w-0">
        <span className="block text-xs font-bold" style={{ color: th.fg3 }}>{title}</span>
        <span className="block text-lg font-black leading-tight mt-0.5" style={{ color: urgent ? th.danger : th.fg }}>{value}</span>
        <span className="block text-[11px] mt-1" style={{ color: th.fg3 }}>{hint}</span>
      </span>
    </button>
  );
}

// Niveau indicatif d'après le score du test de positionnement.
const niveau = (score: number) => score >= 70
  ? { label: "Avancé", color: GREEN }
  : score >= 40 ? { label: "Intermédiaire", color: "#e0a526" } : { label: "Débutant", color: "#2A78D6" };

function EmptyPanel({ Icon, title, text }: { Icon: LucideIcon; title: string; text: string }) {
  const th = useTh();
  return (
    <GCard><div className="fade-up p-8 sm:p-10 flex flex-col items-center text-center gap-3">
      <span className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: th.navA, color: th.fg3 }}><Icon className="w-7 h-7" /></span>
      <p className="text-lg font-black" style={{ color: th.fg }}>{title}</p>
      <p className="text-sm max-w-md" style={{ color: th.fg2 }}>{text}</p>
    </div></GCard>
  );
}

// Résultats du test de positionnement des collaborateurs inscrits.
function PositioningPanel({ data, stagiaires }: { data: PortalPositioning | null; stagiaires: PortalTrainee[] }) {
  const th = useTh();
  const tests = (data?.tests ?? []).filter((t) => t.ouvert || data!.resultats.some((r) => r.testId === t.id));
  if (!data || !tests.length || !data.resultats.length) {
    return (
      <EmptyPanel Icon={ClipboardList} title="Le test de positionnement n'a pas encore démarré"
        text={tests.length
          ? "Vos collaborateurs peuvent le passer depuis leur espace de formation. Leurs résultats s'afficheront ici au fur et à mesure."
          : "Avant la formation, vos collaborateurs passeront un court test pour situer leur niveau. Leurs résultats s'afficheront ici dès qu'ils l'auront réalisé."} />
    );
  }
  return (
    <div className="space-y-5">
      {tests.map((test) => {
        const results = new Map(data.resultats.filter((r) => r.testId === test.id).map((r) => [r.traineeId, r]));
        const scores = [...results.values()].map((r) => r.score);
        const moyenne = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
        const total = Math.max(stagiaires.length, results.size);
        return (
          <GCard key={test.id}><div className="fade-up p-5 sm:p-6 space-y-5">
            <div className="flex items-start gap-4 flex-wrap">
              <div className="flex-1 min-w-[220px]">
                <p className="eyebrow" style={{ color: th.fg3 }}>Test de positionnement · {test.questions} question{test.questions > 1 ? "s" : ""}</p>
                <p className="text-lg font-black mt-1" style={{ color: th.fg }}>{test.titre}</p>
              </div>
              <div className="flex gap-6">
                <div><p className="text-2xl font-black tabular-nums" style={{ color: th.fg }}>{results.size}/{total}</p><p className="text-[11px]" style={{ color: th.fg3 }}>réalisés</p></div>
                {moyenne !== null && <div><p className="text-2xl font-black tabular-nums" style={{ color: niveau(moyenne).color }}>{moyenne} %</p><p className="text-[11px]" style={{ color: th.fg3 }}>score moyen</p></div>}
              </div>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: th.navA }}>
              <div className="h-full rounded-full" style={{ width: `${total ? (results.size / total) * 100 : 0}%`, background: GREEN }} />
            </div>
            {stagiaires.length === 0 ? (
              <p className="text-sm" style={{ color: th.fg3 }}>Aucun collaborateur inscrit pour le moment.</p>
            ) : (
              <ul className="space-y-2.5">
                {stagiaires.map((t, i) => {
                  const r = results.get(t.id);
                  const n = r ? niveau(r.score) : null;
                  return (
                    <li key={t.id} className="flex items-center gap-3 flex-wrap">
                      <Avatar t={t} index={i} />
                      <div className="w-44 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: th.fg }}>{t.prenom} {t.nom}</p>
                        <p className="text-[11px] truncate" style={{ color: th.fg3 }}>{r ? `Réalisé le ${dateCourte(r.date)}` : t.fonction ?? "Inscrit(e)"}</p>
                      </div>
                      {r && n ? (
                        <div className="flex-1 min-w-[160px] flex items-center gap-3">
                          <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: th.navA }}>
                            <div className="h-full rounded-full" style={{ width: `${r.score}%`, background: n.color }} />
                          </div>
                          <span className="text-sm font-black tabular-nums w-12 text-right" style={{ color: th.fg }}>{Math.round(r.score)} %</span>
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full w-24 text-center" style={{ background: `${n.color}1f`, color: n.color }}>{n.label}</span>
                        </div>
                      ) : (
                        <span className="flex-1 text-xs italic" style={{ color: th.fg3 }}>Pas encore réalisé</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
            <p className="text-[11px]" style={{ color: th.fg3 }}>Le test situe le niveau de départ : il sert à adapter la formation, pas à noter vos collaborateurs.</p>
          </div></GCard>
        );
      })}
    </div>
  );
}

// Rendez-vous tenus avec l'organisme, avec leur compte rendu et document.
function MeetingsPanel({ token, meetings }: { token: string; meetings: PortalMeeting[] }) {
  const th = useTh();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  if (!meetings.length) {
    return <EmptyPanel Icon={CalendarCheck} title="Aucun rendez-vous pour le moment"
      text="Les rendez-vous tenus avec Les Formateurs IA (cadrage, point d'étape, bilan) apparaîtront ici, avec leur compte rendu." />;
  }
  const download = async (m: PortalMeeting) => {
    // L'onglet s'ouvre dans le geste de l'utilisateur, puis reçoit le lien signé.
    const w = window.open("", "_blank");
    setBusy(m.id);
    setError(null);
    try {
      const url = await clientMeetingFileUrl(token, m.id);
      if (w) w.location.href = url; else window.location.href = url;
    } catch (err) {
      w?.close();
      setError(err instanceof Error ? err.message : "Téléchargement impossible.");
    } finally {
      setBusy(null);
    }
  };
  return (
    <div className="space-y-3">
      {error && <p className="text-sm" style={{ color: th.danger }}>{error}</p>}
      {meetings.map((m, i) => (
        <GCard key={m.id}><div className="fade-up p-5 flex gap-5 items-start flex-wrap" style={{ animationDelay: `${i * 40}ms` }}>
          <div className="w-[72px] shrink-0 text-center rounded-[10px] py-2.5" style={{ background: th.navA }}>
            <p className="text-[11px] font-bold uppercase" style={{ color: th.fg3 }}>{new Date(`${m.date}T12:00:00`).toLocaleDateString("fr-FR", { month: "short" })}</p>
            <p className="text-[1.8rem] font-black leading-none" style={{ color: th.fg }}>{Number(m.date.slice(8))}</p>
            <p className="text-[11px]" style={{ color: th.fg3 }}>{m.date.slice(0, 4)}</p>
          </div>
          <div className="flex-1 min-w-[220px] space-y-2">
            <p className="text-base font-black" style={{ color: th.fg }}>{m.titre}</p>
            {m.notes && <p className="text-sm whitespace-pre-line leading-relaxed" style={{ color: th.fg2 }}>{m.notes}</p>}
            {m.fichier && (
              <button type="button" onClick={() => void download(m)} disabled={busy === m.id}
                className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-[2px] hover:opacity-70 disabled:opacity-50 max-w-full" style={{ border: `1px solid ${th.sep}`, color: th.fg }}>
                <FileText className="w-3.5 h-3.5 shrink-0" /><span className="truncate">{busy === m.id ? "Préparation…" : m.fichier}</span><Download className="w-3.5 h-3.5 shrink-0" />
              </button>
            )}
          </div>
        </div></GCard>
      ))}
    </div>
  );
}
