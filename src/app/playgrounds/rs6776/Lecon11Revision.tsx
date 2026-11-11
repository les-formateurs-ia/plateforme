import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import {
  AlertTriangle, Briefcase, Check, Dices, ExternalLink, FileText, GraduationCap, Image as ImageIcon, Layers, Music, Pause, Play,
  RotateCcw, ScanText, Sparkles, StepForward, Target, Wand2, X,
} from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { Segmented, VBtn, ShimBtn } from "@/app/components/common/Buttons";
import type { PlaygroundProps } from "@/app/playgrounds/registry";
import { Hero, Tile, ProgressRing, IrisNumber, Chip, TOOL_TINT, alpha, celebrate } from "@/app/playgrounds/ui";
import { TOOL_SHEETS, type ToolId } from "./tools";

// Fiche de révision de la leçon 1.1 (RS6776), en tableau de bord : chaque tuile
// ouvre un module interactif, dans l'ordre que l'élève veut. L'anneau suit les
// modules explorés. Rien n'est ajouté au cours : tout en est tiré.
// Variante `profil=sirh` : un module « Votre métier » en plus.

type ModuleId = "definition" | "fonctionnement" | "notions" | "hallucination" | "outils" | "metier" | "ecrit" | "test";
type Mod = { id: ModuleId; title: string; teaser: string; tint: string; Icon: typeof Sparkles; wide?: boolean };

const BASE_MODULES: Mod[] = [
  { id: "definition", title: "L'IA générative", teaser: "Un prompt, un contenu nouveau.", tint: "#b58de0", Icon: Sparkles },
  { id: "fonctionnement", title: "Comment elle répond", teaser: "Mot après mot, la suite probable.", tint: "#78d5e2", Icon: Layers },
  { id: "notions", title: "3 notions clés", teaser: "Tokens, contexte, variabilité.", tint: "#6adeb1", Icon: ScanText },
  { id: "hallucination", title: "L'hallucination", teaser: "Plausible, mais faux.", tint: "#fbc2ad", Icon: AlertTriangle },
  { id: "outils", title: "Les 5 outils", teaser: "Qui fait quoi, et dans quel contexte.", tint: "#dbacf0", Icon: Target, wide: true },
  { id: "ecrit", title: "Pour l'écrit", teaser: "Exercice 1 : outils, justification, budget.", tint: "#b58de0", Icon: GraduationCap },
  { id: "test", title: "Testez-vous", teaser: "5 cartes, révélez et évaluez-vous.", tint: "#78d5e2", Icon: Check },
];
const METIER: Mod = { id: "metier", title: "Votre métier", teaser: "Consultante SIRH : fiable, à vérifier, hors rôle.", tint: "#6adeb1", Icon: Briefcase };

export default function Lecon11Revision({ params }: PlaygroundProps) {
  const th = useTh();
  const sirh = params.profil === "sirh";
  const modules = useMemo(() => (sirh ? [...BASE_MODULES.slice(0, 4), METIER, ...BASE_MODULES.slice(4)] : BASE_MODULES), [sirh]);
  const [open, setOpen] = useState<ModuleId | null>(null);
  const [explored, setExplored] = useState<Set<ModuleId>>(new Set());
  const focusRef = useRef<HTMLDivElement>(null);

  const select = (id: ModuleId) => {
    setOpen((cur) => (cur === id ? null : id));
    if (id !== "test") setExplored((s) => new Set(s).add(id));
  };
  useEffect(() => { if (open) focusRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, [open]);

  const progress = explored.size / modules.length;
  const current = modules.find((m) => m.id === open);

  return (
    <div className="flex flex-col gap-5">
      <Hero>
        <div className="flex flex-col lg:flex-row lg:items-center gap-6 pr-0 lg:pr-24">
          <div className="flex-1">
            <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: th.fg3 }}>Fiche de révision · Leçon 1.1</p>
            <h2 className="text-2xl md:text-3xl font-semibold leading-tight mb-5" style={{ color: th.fg }}>
              Comprendre <span className="hl">l'IA générative</span> et ses usages
            </h2>
            <ol className="grid md:grid-cols-3 gap-4">
              {[
                ["Elle prédit, elle ne vérifie pas", "Une réponse fluide n'est pas une preuve d'exactitude."],
                ["Elle transforme mieux qu'elle n'informe", "Fiable sur un texte fourni, à vérifier dès qu'elle avance un fait."],
                ["Le contexte choisit l'outil", "Besoin, environnement en place, ce que l'entreprise autorise."],
              ].map(([t, d], i) => (
                <li key={t} className="flex gap-3">
                  <IrisNumber n={i + 1} />
                  <span><span className="block text-sm font-semibold" style={{ color: th.fg }}>{t}</span><span className="text-xs" style={{ color: th.fg2 }}>{d}</span></span>
                </li>
              ))}
            </ol>
          </div>
          <div className="flex items-center gap-3">
            <ProgressRing value={progress} label="exploré" />
            <p className="text-xs max-w-[16ch]" style={{ color: th.fg2 }}>{explored.size} module{explored.size > 1 ? "s" : ""} sur {modules.length}. Dans l'ordre que vous voulez.</p>
          </div>
        </div>
      </Hero>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3" role="group" aria-label="Modules de la fiche">
        {modules.map((m) => (
          <Tile key={m.id} tint={m.tint} onClick={() => select(m.id)} selected={open === m.id} done={explored.has(m.id)} className={`p-4 min-h-[128px] ${m.wide && modules.length % 4 !== 0 ? "col-span-2" : ""}`} label={m.title}>
            <span className="flex h-full flex-col">
              <span className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: alpha(m.tint, 0.25), border: `1px solid ${alpha(m.tint, 0.6)}` }}>
                <m.Icon className="w-4 h-4" style={{ color: th.fg }} aria-hidden />
              </span>
              <span className="text-sm font-semibold" style={{ color: th.fg }}>{m.title}</span>
              <span className="text-xs mt-0.5" style={{ color: th.fg2 }}>{m.teaser}</span>
              {m.id === "outils" && (
                <span className="flex gap-1.5 mt-auto pt-3">
                  {TOOL_SHEETS.map((t) => <span key={t.id} className="w-2.5 h-2.5 rounded-full" style={{ background: TOOL_TINT[t.id] }} />)}
                </span>
              )}
            </span>
          </Tile>
        ))}
      </div>

      <div ref={focusRef} className="scroll-mt-24">
        {current ? (
          <div key={current.id} className="pg-pop rounded-[14px] p-6 relative overflow-hidden" style={{ background: `linear-gradient(170deg, ${alpha(current.tint, th.isDark ? 0.14 : 0.1)}, ${th.card} 45%)`, border: `1px solid ${alpha(current.tint, 0.6)}` }}>
            <div className="flex items-center justify-between gap-3 mb-5">
              <h3 className="flex items-center gap-2 text-lg font-semibold" style={{ color: th.fg }}>
                <current.Icon className="w-5 h-5" aria-hidden />{current.title}
              </h3>
              <button onClick={() => setOpen(null)} aria-label="Fermer le module" className="w-8 h-8 rounded-full flex items-center justify-center" style={{ border: `1px solid ${th.sep}`, color: th.fg2 }}><X className="w-4 h-4" /></button>
            </div>
            {current.id === "definition" && <ModDefinition />}
            {current.id === "fonctionnement" && <ModTokens />}
            {current.id === "notions" && <ModNotions />}
            {current.id === "hallucination" && <ModHallucination />}
            {current.id === "metier" && <ModMetier />}
            {current.id === "outils" && <ModTools />}
            {current.id === "ecrit" && <ModEcrit />}
            {current.id === "test" && <ModTest onDone={() => setExplored((s) => new Set(s).add("test"))} />}
          </div>
        ) : (
          <p className="text-sm text-center py-4" style={{ color: th.fg3 }}>Choisissez un module pour l'ouvrir.</p>
        )}
      </div>
    </div>
  );
}

/* ================= Modules ================= */

const PROMPTS = [
  { Icon: FileText, label: "Texte", prompt: "Reformule ce mail avec un ton professionnel", outputs: ["Bonjour Madame, je vous confirme la bonne réception de votre dossier.", "Madame, nous accusons bonne réception de votre dossier et revenons vers vous rapidement.", "Bonjour, votre dossier nous est bien parvenu ; nous vous tiendrons informée."] },
  { Icon: ImageIcon, label: "Image", prompt: "Illustration d'une équipe en réunion, style aquarelle", outputs: ["Image : quatre personnes autour d'une table, tons bleus et verts.", "Image : réunion vue de haut, couleurs chaudes, lumière du matin.", "Image : équipe debout devant un tableau, touches de violet."] },
  { Icon: Music, label: "Audio", prompt: "Voix off de 10 secondes pour accueillir les visiteurs", outputs: ["Audio : voix posée, « Bienvenue, nous sommes ravis de vous accueillir ».", "Audio : voix chaleureuse, « Bonjour et bienvenue parmi nous ».", "Audio : voix dynamique, « Bienvenue ! Entrez, on vous attend »."] },
];

function ModDefinition() {
  const th = useTh();
  const [p, setP] = useState(0);
  const [run, setRun] = useState(0);
  const cur = PROMPTS[p];
  const ai = cur.outputs[run % cur.outputs.length];
  return (
    <div className="grid lg:grid-cols-[1fr_1fr] gap-5">
      <div>
        <p className="text-sm mb-4" style={{ color: th.fg2 }}>
          Un modèle entraîné sur d'immenses quantités de textes, d'images ou de sons, qui <strong style={{ color: th.fg }}>produit un contenu nouveau</strong> à partir
          d'une instruction en langage courant : le <strong style={{ color: th.fg }}>prompt</strong>.
        </p>
        <div className="flex gap-2 mb-3">
          {PROMPTS.map((x, i) => (
            <button key={x.label} onClick={() => { setP(i); setRun(0); }} aria-pressed={p === i}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold"
              style={p === i ? { background: "var(--grad-iris)", color: "#111" } : { border: `1px solid ${th.sep}`, color: th.fg2 }}>
              <x.Icon className="w-3.5 h-3.5" />{x.label}
            </button>
          ))}
        </div>
        <div className="rounded-[10px] p-4 font-mono text-sm" style={{ border: `1px dashed ${alpha("#b58de0", 0.7)}`, color: th.fg }}>› {cur.prompt}</div>
        <div className="mt-3"><VBtn sm onClick={() => setRun((r) => r + 1)}><Wand2 className="w-4 h-4" />Relancer la même demande</VBtn></div>
      </div>
      <div className="grid gap-3">
        <div className="rounded-[10px] p-4" style={{ border: `1px solid ${th.sep}` }}>
          <p className="text-[10.5px] font-bold uppercase tracking-widest mb-1.5" style={{ color: th.fg3 }}>Logiciel classique</p>
          <p className="text-sm" style={{ color: th.fg2 }}>Même entrée, même résultat. Toujours la même procédure.</p>
        </div>
        <div className="pg-iris-border">
          <div className="pg-inner p-4" style={{ background: th.card }}>
            <p className="text-[10.5px] font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1.5" style={{ color: th.fg }}><Sparkles className="w-3.5 h-3.5" />IA générative · essai {run + 1}</p>
            <p key={`${p}-${run}`} className="text-sm" style={{ color: th.fg }}>
              {ai.split(" ").map((w, i) => <span key={i} className="pg-token" style={{ animationDelay: `${i * 45}ms` }}>{w}&nbsp;</span>)}
            </p>
          </div>
        </div>
        <p className="text-xs" style={{ color: th.fg3 }}>Illustration : relancez pour voir la réponse changer. Elle construit sa réponse à chaque fois.</p>
      </div>
    </div>
  );
}

const STEPS_TOKENS: { word: string; cands: [string, number][] }[] = [
  { word: "Le", cands: [["Le", 41], ["Votre", 33], ["Ce", 26]] },
  { word: "compte-rendu", cands: [["compte-rendu", 46], ["rapport", 31], ["document", 23]] },
  { word: "vous", cands: [["vous", 52], ["sera", 30], ["est", 18]] },
  { word: "sera", cands: [["sera", 61], ["est", 24], ["a", 15]] },
  { word: "transmis", cands: [["transmis", 55], ["envoyé", 32], ["remis", 13]] },
  { word: "après", cands: [["dans", 36], ["après", 34], ["cette", 30]] },
  { word: "validation.", cands: [["validation.", 58], ["relecture.", 27], ["signature.", 15]] },
];

function ModTokens() {
  const th = useTh();
  const [n, setN] = useState(0);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    if (!playing) return;
    if (n >= STEPS_TOKENS.length) { setPlaying(false); return; }
    const t = setTimeout(() => setN((x) => x + 1), 900);
    return () => clearTimeout(t);
  }, [playing, n]);
  const step = STEPS_TOKENS[Math.min(n, STEPS_TOKENS.length - 1)];
  const stage = n > 0 ? 2 : -1;
  return (
    <div>
      <ol className="grid md:grid-cols-3 gap-3 mb-5">
        {[["Apprentissage", "Des paramètres ajustés sur de grands ensembles de données."], ["Relations", "Des régularités entre fragments de texte et concepts."], ["Génération", "La réponse, morceau par morceau, selon une suite probable."]].map(([t, d], i) => (
          <li key={t} className="flex gap-3 rounded-[10px] p-3" style={{ border: `1px solid ${i === stage ? alpha("#78d5e2", 0.9) : th.sep}`, background: i === stage ? alpha("#78d5e2", 0.1) : "transparent" }}>
            <IrisNumber n={i + 1} />
            <span><span className="block text-sm font-semibold" style={{ color: th.fg }}>{t}</span><span className="text-xs" style={{ color: th.fg2 }}>{d}</span></span>
          </li>
        ))}
      </ol>
      <div className="rounded-[10px] p-5 min-h-[72px] text-lg" style={{ border: `1px solid ${th.sep}`, color: th.fg }} aria-live="polite">
        {STEPS_TOKENS.slice(0, n).map((s, i) => (
          <span key={i} className="pg-token mr-1.5 rounded px-1" style={{ background: alpha(["#b58de0", "#78d5e2", "#6adeb1", "#fbc2ad", "#dbacf0"][i % 5], 0.28) }}>{s.word}</span>
        ))}
        {n < STEPS_TOKENS.length && <span className="inline-block w-2 h-5 align-middle animate-pulse" style={{ background: th.fg }} />}
      </div>
      {n < STEPS_TOKENS.length && n > 0 && (
        <div className="mt-4 grid gap-2 max-w-md">
          <p className="text-[10.5px] font-bold uppercase tracking-widest" style={{ color: th.fg3 }}>Candidats pour le prochain mot (illustration)</p>
          {step.cands.map(([w, p], i) => (
            <div key={w} className="grid grid-cols-[110px_1fr_40px] items-center gap-2 text-sm">
              <span style={{ color: th.fg }}>{w}</span>
              <span className="h-2 rounded-full overflow-hidden" style={{ background: th.sep }}><span className="block h-full rounded-full" style={{ width: `${p}%`, background: i === 0 ? "var(--grad-iris)" : th.fg3, transition: "width .4s" }} /></span>
              <span className="text-xs tabular-nums text-right" style={{ color: th.fg3 }}>{p}%</span>
            </div>
          ))}
          {step.word !== step.cands[0][0] && <p className="text-xs" style={{ color: th.fg2 }}>Ici, ce n'est pas le plus probable qui sort : l'outil tire parmi les suites probables. D'où la variabilité.</p>}
        </div>
      )}
      <div className="flex flex-wrap gap-2 mt-4">
        <ShimBtn sm onClick={() => { if (n >= STEPS_TOKENS.length) setN(0); setPlaying((v) => !v); }}>{playing ? <><Pause className="w-4 h-4" />Pause</> : <><Play className="w-4 h-4" />{n >= STEPS_TOKENS.length ? "Rejouer" : "Lancer la génération"}</>}</ShimBtn>
        <VBtn sm onClick={() => setN((x) => Math.min(STEPS_TOKENS.length, x + 1))} disabled={n >= STEPS_TOKENS.length}><StepForward className="w-4 h-4" />Mot suivant</VBtn>
        <VBtn sm onClick={() => { setN(0); setPlaying(false); }}><RotateCcw className="w-4 h-4" />Recommencer</VBtn>
      </div>
      <Rule tint="#78d5e2">Elle produit la suite la plus probable, pas une vérité vérifiée.</Rule>
    </div>
  );
}

function ModNotions() {
  const th = useTh();
  const [text, setText] = useState("Merci de nous transmettre les documents demandés.");
  const tokens = useMemo(() => text.match(/[A-Za-zÀ-ÿ]{1,5}|[^\sA-Za-zÀ-ÿ]|\s+/g)?.filter((t) => t.trim()) ?? [], [text]);
  const [len, setLen] = useState(6);
  const WINDOW = 4;
  const [dice, setDice] = useState(0);
  const variants = ["Merci pour votre retour rapide.", "Merci de votre réponse rapide.", "Je vous remercie pour ce retour."];
  return (
    <div className="grid lg:grid-cols-3 gap-4">
      <Panel tint="#6adeb1" Icon={FileText} title="Tokens">
        <p className="text-xs mb-2" style={{ color: th.fg2 }}>Le texte est découpé en fragments. Ils mesurent la longueur d'un échange et, pour les services facturés à l'usage, son coût.</p>
        <input value={text} onChange={(e) => setText(e.target.value.slice(0, 120))} aria-label="Texte à découper" className="w-full rounded-[6px] px-3 py-2 text-xs g-input mb-2" />
        <div className="flex flex-wrap gap-1">
          {tokens.map((t, i) => <span key={i} className="rounded px-1.5 py-0.5 text-xs font-mono" style={{ background: alpha(["#6adeb1", "#78d5e2", "#b58de0", "#fbc2ad"][i % 4], 0.3), color: th.fg }}>{t}</span>)}
        </div>
        <p className="text-[11px] mt-2" style={{ color: th.fg3 }}>≈ {tokens.length} fragments · découpage illustratif</p>
      </Panel>
      <Panel tint="#78d5e2" Icon={ScanText} title="Fenêtre de contexte">
        <p className="text-xs mb-2" style={{ color: th.fg2 }}>L'outil ne tient compte que d'une quantité limitée de texte à la fois. Allongez l'échange :</p>
        <input type="range" min={1} max={12} value={len} onChange={(e) => setLen(+e.target.value)} aria-label="Longueur de l'échange" className="w-full mb-2" />
        <div className="flex flex-col gap-1">
          {Array.from({ length: len }, (_, i) => {
            const inWin = i >= len - WINDOW;
            return <span key={i} className="h-3 rounded-full transition-all" style={{ width: `${55 + ((i * 37) % 40)}%`, marginLeft: i % 2 ? "auto" : 0, background: inWin ? "var(--grad-iris)" : th.sep, opacity: inWin ? 1 : 0.5 }} />;
          })}
        </div>
        <p className="text-[11px] mt-2" style={{ color: th.fg2 }}>{len > WINDOW ? "Les premiers échanges sortent de la fenêtre : rappelez les consignes essentielles." : "Tout l'échange tient dans la fenêtre."}</p>
      </Panel>
      <Panel tint="#b58de0" Icon={Dices} title="Variabilité">
        <p className="text-xs mb-2" style={{ color: th.fg2 }}>Même prompt, réponse différente. Régénérer donne un nouvel essai, pas une correction.</p>
        <p className="text-xs font-mono mb-2" style={{ color: th.fg3 }}>› Remercie ce client pour son retour</p>
        <p key={dice} className="pg-pop text-sm rounded-[6px] p-2" style={{ border: `1px solid ${alpha("#b58de0", 0.6)}`, color: th.fg }}>{variants[dice % variants.length]}</p>
        <div className="mt-2"><VBtn sm onClick={() => setDice((d) => d + 1)}><Dices className="w-4 h-4" />Régénérer</VBtn></div>
      </Panel>
    </div>
  );
}

const INVENTED = ["Le 3 avril à 10 h, en visioconférence.", "Le 28 mars, en fin de journée.", "Sans doute jeudi prochain.", "Le 15 avril à 9 h 30."];

function ModHallucination() {
  const th = useTh();
  const [withSource, setWithSource] = useState(false);
  const [k, setK] = useState(0);
  const [checks, setChecks] = useState<boolean[]>([false, false, false, false]);
  const ref = useRef<HTMLDivElement>(null);
  const reflexes = ["Je fournis la source plutôt que de la faire deviner.", "Je vérifie chaque fait que je n'ai pas donné.", "Deux réponses différentes : aucune n'est fiable.", "Je relis avant d'envoyer ou de publier."];
  const toggle = (i: number) => {
    const next = checks.map((v, j) => (j === i ? !v : v));
    if (next.every(Boolean) && !checks.every(Boolean)) celebrate(ref.current, 0.8);
    setChecks(next);
  };
  return (
    <div className="grid lg:grid-cols-[1.2fr_1fr] gap-5">
      <div>
        <p className="text-sm mb-4" style={{ color: th.fg2 }}>Quand une information lui manque, l'outil peut produire une réponse <strong style={{ color: th.fg }}>plausible mais fausse</strong>, avec la même assurance qu'une réponse juste.</p>
        <div className="rounded-[10px] p-4" style={{ border: `1px solid ${th.sep}` }}>
          <div className="flex items-center justify-between gap-3 mb-3">
            <p className="text-sm font-semibold" style={{ color: th.fg }}>Date du prochain comité de pilotage avec Verlane &amp; Associés ?</p>
            <Segmented value={withSource ? "avec" : "sans"} onChange={(v) => setWithSource(v === "avec")} options={[{ value: "sans", label: "Sans source" }, { value: "avec", label: "Mail fourni" }]} />
          </div>
          {withSource && <p className="text-xs rounded-[6px] p-2 mb-3" style={{ background: alpha("#6adeb1", 0.15), color: th.fg2 }}>« Le prochain comité de pilotage aura lieu le mardi 14 octobre à 10 h, en visioconférence. »</p>}
          <div key={`${withSource}-${k}`} className="pg-pop relative rounded-[8px] p-3" style={{ border: `1px solid ${withSource ? th.success : th.danger}` }}>
            <p className="text-sm" style={{ color: th.fg }}>{withSource ? "Le mardi 14 octobre à 10 h, en visioconférence." : INVENTED[k % INVENTED.length]}</p>
            <span className="absolute -top-2.5 right-3 rounded-full px-2 text-[10px] font-bold uppercase tracking-widest" style={{ background: withSource ? th.success : th.danger, color: th.onInk }}>{withSource ? "Tiré du document" : "Inventé"}</span>
          </div>
          <div className="mt-3"><VBtn sm onClick={() => setK((x) => x + 1)}><RotateCcw className="w-4 h-4" />Reposer la question</VBtn></div>
          <p className="text-xs mt-2" style={{ color: th.fg3 }}>{withSource ? "Avec le document, la réponse reste la même : elle transforme une information fournie." : "Sans source, la réponse change à chaque fois : signe qu'aucune n'est fiable."}</p>
        </div>
      </div>
      <div ref={ref}>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="rounded-[10px] p-3" style={{ border: `1px solid ${th.success}` }}><p className="text-xs font-bold mb-1" style={{ color: th.success }}>Fiable</p><p className="text-xs" style={{ color: th.fg2 }}>Transformer un texte fourni : reformuler, structurer, raccourcir.</p></div>
          <div className="rounded-[10px] p-3" style={{ border: `1px solid ${th.danger}` }}><p className="text-xs font-bold mb-1" style={{ color: th.danger }}>À vérifier</p><p className="text-xs" style={{ color: th.fg2 }}>Date, chiffre, nom, référence, loi, événement récent.</p></div>
        </div>
        <p className="text-[10.5px] font-bold uppercase tracking-widest mb-2" style={{ color: th.fg3 }}>Mes 4 réflexes · cochez-les</p>
        <div className="flex flex-col gap-2">
          {reflexes.map((r, i) => (
            <button key={r} onClick={() => toggle(i)} aria-pressed={checks[i]} className="flex items-center gap-2 rounded-[8px] px-3 py-2 text-left text-sm transition-colors"
              style={{ border: `1px solid ${checks[i] ? alpha("#fbc2ad", 0.9) : th.sep}`, background: checks[i] ? alpha("#fbc2ad", 0.15) : "transparent", color: th.fg }}>
              <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: checks[i] ? "var(--grad-iris)" : "transparent", border: checks[i] ? "none" : `1px solid ${th.fg3}` }}>{checks[i] && <Check className="w-3 h-3" color="#111" />}</span>
              {r}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ModMetier() {
  const th = useTh();
  const cols: [string, string, string[]][] = [
    ["Ce qu'il fait bien", "#6adeb1", ["Reformuler un mail client", "Structurer une offre d'emploi à partir de la fiche de poste fournie", "Adapter un support de formation au logiciel"]],
    ["Ce que vous vérifiez", "#fbc2ad", ["Une rémunération ou un avantage non fourni", "Une fonctionnalité attribuée à un logiciel de recrutement", "Chaque critère de sélection d'une offre"]],
    ["Hors de son rôle, pour l'instant", "#b58de0", ["Les données de candidats ou de salariés", "Les informations internes des clients", "Méthodes aux leçons 1.4 et 1.5"]],
  ];
  return (
    <>
      <div className="grid md:grid-cols-3 gap-3">
        {cols.map(([t, c, items]) => (
          <div key={t} className="rounded-[10px] p-4" style={{ background: alpha(c, th.isDark ? 0.12 : 0.15), border: `1px solid ${alpha(c, 0.7)}` }}>
            <p className="text-sm font-semibold mb-2" style={{ color: th.fg }}>{t}</p>
            <ul className="flex flex-col gap-1.5">{items.map((x) => <li key={x} className="text-sm" style={{ color: th.fg2 }}>• {x}</li>)}</ul>
          </div>
        ))}
      </div>
      <Rule tint="#6adeb1">Le bon outil dépend d'abord de l'environnement du client : Google Workspace → Gemini, Microsoft 365 → Copilot.</Rule>
    </>
  );
}

type Facet = "strengths" | "uses" | "integration" | "access";
const FACETS: { value: Facet; label: string }[] = [
  { value: "strengths", label: "Points forts" }, { value: "uses", label: "Usages" }, { value: "integration", label: "Intégration" }, { value: "access", label: "Accès" },
];
const CONTEXTS: { id: string; label: string; tools: ToolId[] }[] = [
  { id: "m365", label: "Entreprise sous Microsoft 365", tools: ["copilot"] },
  { id: "gws", label: "Entreprise sous Google Workspace", tools: ["gemini"] },
  { id: "visuel", label: "Créer un visuel", tools: ["firefly", "chatgpt"] },
  { id: "long", label: "Analyser un long document", tools: ["claude", "gemini"] },
  { id: "libre", label: "Aucun environnement imposé", tools: ["chatgpt", "claude"] },
];

export function ModTools() {
  const th = useTh();
  const navigate = useNavigate();
  const [sel, setSel] = useState<ToolId>("chatgpt");
  const [ctx, setCtx] = useState<string | null>(null);
  const [mode, setMode] = useState<"carte" | "comparer">("carte");
  const [facet, setFacet] = useState<Facet>("strengths");
  const hl = CONTEXTS.find((c) => c.id === ctx)?.tools ?? [];
  const t = TOOL_SHEETS.find((x) => x.id === sel)!;
  const R = 120;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Segmented value={mode} onChange={(v) => setMode(v as "carte" | "comparer")} options={[{ value: "carte", label: "Constellation" }, { value: "comparer", label: "Comparer" }]} />
        {mode === "comparer" && <Segmented value={facet} onChange={(v) => setFacet(v as Facet)} options={FACETS} />}
      </div>

      {mode === "carte" ? (
        <>
          <div className="flex flex-wrap gap-2 mb-4" role="group" aria-label="Votre contexte">
            <span className="text-xs self-center mr-1" style={{ color: th.fg3 }}>Votre contexte :</span>
            {CONTEXTS.map((c) => (
              <button key={c.id} onClick={() => { const on = ctx !== c.id; setCtx(on ? c.id : null); if (on) setSel(c.tools[0]); }} aria-pressed={ctx === c.id}
                className="rounded-full px-3 py-1 text-xs font-semibold" style={ctx === c.id ? { background: "var(--grad-iris)", color: "#111" } : { border: `1px solid ${th.sep}`, color: th.fg2 }}>{c.label}</button>
            ))}
          </div>
          <div className="grid lg:grid-cols-[320px_1fr] gap-5 items-center">
            <div className="relative mx-auto" style={{ width: 2 * R + 80, height: 2 * R + 80 }}>
              <div className="pg-orbit absolute inset-0">
                <svg className="absolute inset-0" width="100%" height="100%" aria-hidden>
                  <circle cx="50%" cy="50%" r={R} fill="none" stroke={th.sep} strokeDasharray="3 6" />
                </svg>
                {TOOL_SHEETS.map((x, i) => {
                  const a = (i / TOOL_SHEETS.length) * 2 * Math.PI - Math.PI / 2;
                  const on = hl.includes(x.id);
                  const dim = hl.length > 0 && !on;
                  return (
                    <div key={x.id} className="absolute" style={{ left: R + 40 + R * Math.cos(a) - 34, top: R + 40 + R * Math.sin(a) - 34 }}>
                      <button onClick={() => setSel(x.id)} aria-pressed={sel === x.id} aria-label={x.name}
                        className="pg-counter w-[68px] h-[68px] rounded-full flex items-center justify-center text-[11px] font-bold transition-all"
                        style={{ background: alpha(TOOL_TINT[x.id], on || sel === x.id ? 0.9 : th.isDark ? 0.25 : 0.35), color: on || sel === x.id ? "#111" : th.fg, border: `2px solid ${TOOL_TINT[x.id]}`, opacity: dim ? 0.35 : 1, boxShadow: on ? `0 0 28px ${alpha(TOOL_TINT[x.id], 0.9)}` : sel === x.id ? `0 0 0 3px ${th.bg}, 0 0 0 5px ${TOOL_TINT[x.id]}` : "none" }}>
                        {x.name}
                      </button>
                    </div>
                  );
                })}
              </div>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="pg-float rounded-full w-24 h-24 flex items-center justify-center text-center text-xs font-semibold" style={{ background: "var(--grad-iris)", color: "#111" }}>Votre<br />besoin</span>
              </div>
            </div>
            <div key={t.id} className="pg-pop rounded-[12px] p-5" style={{ background: alpha(TOOL_TINT[t.id], th.isDark ? 0.12 : 0.14), border: `1px solid ${alpha(TOOL_TINT[t.id], 0.8)}` }}>
              <p className="text-xl font-semibold" style={{ color: th.fg }}>{t.name} <span className="text-sm font-normal" style={{ color: th.fg3 }}>· {t.editor}</span></p>
              {hl.includes(t.id) && <div className="mt-1"><Chip tint={TOOL_TINT[t.id]}>Adapté à ce contexte</Chip></div>}
              <dl className="grid gap-2.5 mt-3">
                {([["Points forts", t.strengths], ["Usages", t.uses], ["Intégration", t.integration], ["Accès", t.access]] as const).map(([l, v]) => (
                  <div key={l} className="grid sm:grid-cols-[110px_1fr] gap-1">
                    <dt className="text-[10.5px] font-bold uppercase tracking-widest pt-0.5" style={{ color: th.fg3 }}>{l}</dt>
                    <dd className="text-sm" style={{ color: th.fg }}>{v}</dd>
                  </div>
                ))}
              </dl>
              <div className="flex flex-wrap items-center gap-2 mt-4">
                <a href={t.pricingUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold underline" style={{ color: th.fg }}>Tarifs officiels <ExternalLink className="w-3 h-3" /></a>
                {t.inPlatform ? <VBtn sm onClick={() => navigate(t.inPlatform!)}>Essayer dans le Studio</VBtn> : <span className="text-xs" style={{ color: th.fg3 }}>Hors plateforme · leçon 1.3</span>}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="grid gap-2">
          {TOOL_SHEETS.map((x) => (
            <div key={x.id} className="grid sm:grid-cols-[120px_1fr] gap-2 items-start rounded-[10px] p-3" style={{ background: alpha(TOOL_TINT[x.id], th.isDark ? 0.1 : 0.12), borderLeft: `3px solid ${TOOL_TINT[x.id]}` }}>
              <span className="text-sm font-semibold" style={{ color: th.fg }}>{x.name}</span>
              <span key={facet} className="pg-pop text-sm" style={{ color: th.fg2 }}>{x[facet]}</span>
            </div>
          ))}
        </div>
      )}
      <Rule tint="#dbacf0">Le bon choix dépend du besoin, de l'environnement en place et de ce que l'entreprise autorise. Les tarifs changent souvent : vérifiez-les sur la page officielle.</Rule>
    </div>
  );
}

function ModEcrit() {
  const th = useTh();
  const steps = ["Lister les tâches du poste qui peuvent être optimisées", "Choisir l'outil adapté à chacune, selon ses fonctionnalités et réglages", "Justifier chaque choix", "Indiquer le budget à prévoir pour chaque outil"];
  return (
    <div>
      <p className="text-sm mb-4" style={{ color: th.fg2 }}>Cette leçon prépare l'<strong style={{ color: th.fg }}>exercice 1</strong> de l'écrit : la stratégie d'implémentation de l'IA générative sur un poste.</p>
      <div className="grid md:grid-cols-4 gap-3 mb-5">
        {steps.map((s, i) => (
          <div key={s} className="rounded-[10px] p-4 relative" style={{ border: `1px solid ${th.sep}` }}>
            <IrisNumber n={i + 1} />
            <p className="text-sm mt-2" style={{ color: th.fg }}>{s}</p>
          </div>
        ))}
      </div>
      <p className="text-[10.5px] font-bold uppercase tracking-widest mb-2" style={{ color: th.fg3 }}>Le tableau attendu · exemple fictif</p>
      <div className="overflow-x-auto rounded-[10px]" style={{ border: `1px solid ${th.sep}` }}>
        <table className="w-full text-sm">
          <thead><tr style={{ background: alpha("#b58de0", 0.15) }}>
            {["Tâche à optimiser", "Fréquence", "Outil d'IA", "Justification", "Budget"].map((h) => <th key={h} scope="col" className="text-left px-3 py-2 text-[11px] uppercase tracking-widest" style={{ color: th.fg }}>{h}</th>)}
          </tr></thead>
          <tbody><tr>
            {["Résumer les échanges de mails clients", "Quotidienne", "Copilot", "L'entreprise est sous Microsoft 365 ; intégré à Outlook", "À vérifier : licence professionnelle"].map((c) => <td key={c} className="px-3 py-2 align-top" style={{ color: th.fg2 }}>{c}</td>)}
          </tr></tbody>
        </table>
      </div>
    </div>
  );
}

const CARDS: [string, string][] = [
  ["Pourquoi une réponse bien écrite peut-elle être fausse ?", "Parce que l'outil produit la suite la plus probable, sans vérifier ce qu'il avance."],
  ["Que fait le bouton « régénérer » ?", "Il donne un nouvel essai. Il ne corrige rien : c'est la consigne qu'il faut améliorer."],
  ["Dans quel cas l'IA générative est-elle la plus fiable ?", "Quand elle transforme un texte que vous lui fournissez."],
  ["Entreprise sous Microsoft 365 : quel outil regarder en premier pour vos mails ?", "Copilot, intégré à Outlook selon la licence, s'il est autorisé."],
  ["Quels outils pouvez-vous pratiquer dans le Studio ?", "ChatGPT, Claude et Gemini. Copilot et Firefly se découvrent sur leur site."],
];

export function ModTest({ onDone, cards = CARDS }: { onDone: () => void; cards?: [string, string][] }) {
  const th = useTh();
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const finished = i >= cards.length;
  const answer = (k: boolean) => {
    if (k) setKnown((x) => x + 1);
    setFlipped(false);
    setI((x) => x + 1);
    if (i + 1 >= cards.length) { onDone(); setTimeout(() => celebrate(ref.current, 1), 50); }
  };
  return (
    <div ref={ref} className="max-w-xl mx-auto">
      <p className="text-sm text-center mb-4" style={{ color: th.fg2 }}>Répondez dans votre tête, retournez la carte, puis soyez honnête. Ce n'est pas noté : le quiz de fin de leçon, lui, l'est.</p>
      {!finished ? (
        <>
          <div className="flex gap-1 mb-3">{cards.map((_, k) => <span key={k} className="h-1.5 flex-1 rounded-full" style={{ background: k < i ? "var(--grad-iris)" : th.sep }} />)}</div>
          <button key={`${i}-${flipped}`} onClick={() => setFlipped((v) => !v)} aria-pressed={flipped}
            className="pg-pop w-full min-h-[170px] rounded-[16px] p-6 flex flex-col items-center justify-center text-center"
            style={flipped ? { background: "var(--grad-iris)", color: "#111" } : { border: `1px solid ${alpha("#78d5e2", 0.8)}`, background: alpha("#78d5e2", th.isDark ? 0.08 : 0.1), color: th.fg }}>
            <span className="text-[10.5px] font-bold uppercase tracking-widest mb-2 opacity-70">{flipped ? "Réponse" : `Carte ${i + 1} sur ${cards.length}`}</span>
            <span className="text-base font-semibold">{flipped ? cards[i][1] : cards[i][0]}</span>
            {!flipped && <span className="text-xs mt-3 opacity-70">Touchez pour retourner</span>}
          </button>
          {flipped && (
            <div className="flex justify-center gap-2 mt-4">
              <VBtn sm onClick={() => answer(false)}>À revoir</VBtn>
              <ShimBtn sm onClick={() => answer(true)}><Check className="w-4 h-4" />Je savais</ShimBtn>
            </div>
          )}
        </>
      ) : (
        <div className="pg-pop text-center rounded-[16px] p-6" style={{ border: `1px solid ${th.sep}` }}>
          <p className="text-3xl font-semibold mb-1" style={{ color: th.fg }}><span className="hl">{known} / {cards.length}</span></p>
          <p className="text-sm mb-4" style={{ color: th.fg2 }}>{known === cards.length ? "Parfait : vous êtes prêt(e) pour le quiz." : "Revoyez les modules concernés, puis lancez le quiz."}</p>
          <VBtn sm onClick={() => { setI(0); setKnown(0); setFlipped(false); }}><RotateCcw className="w-4 h-4" />Recommencer</VBtn>
        </div>
      )}
    </div>
  );
}

/* ================= Briques locales ================= */

function Panel({ tint, Icon, title, children }: { tint: string; Icon: typeof Sparkles; title: string; children: ReactNode }) {
  const th = useTh();
  return (
    <div className="rounded-[12px] p-4" style={{ background: alpha(tint, th.isDark ? 0.1 : 0.12), border: `1px solid ${alpha(tint, 0.7)}` }}>
      <p className="flex items-center gap-2 text-sm font-semibold mb-2" style={{ color: th.fg }}><Icon className="w-4 h-4" aria-hidden />{title}</p>
      {children}
    </div>
  );
}

function Rule({ tint, children }: { tint: string; children: ReactNode }) {
  const th = useTh();
  return (
    <p className="mt-5 rounded-[10px] px-4 py-3 text-sm font-semibold" style={{ background: alpha(tint, th.isDark ? 0.12 : 0.16), borderLeft: `3px solid ${tint}`, color: th.fg }}>{children}</p>
  );
}
