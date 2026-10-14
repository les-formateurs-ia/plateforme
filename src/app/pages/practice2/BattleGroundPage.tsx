import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, AlertTriangle, Check, Copy, Crown, RotateCcw, Shuffle, Swords, Trash2, Zap } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { useAuth } from "@/app/state/auth-context";
import { GCard } from "@/app/components/common/GCard";
import { GT } from "@/app/components/common/GT";
import { VBtn } from "@/app/components/common/Buttons";
import { MarkdownText } from "@/app/components/common/MarkdownText";
import { NeuralField } from "@/app/components/particles/NeuralField";
import { cx } from "@/app/lib/cx";
import {
  BATTLE_PROVIDERS, BATTLE_TIERS, battleModelLabel, battleTierOf, runBattleModel, saveBattleGroundAttempt,
  updateBattleGroundResponses, listMyBattleGroundAttempts, deleteBattleGroundAttempt,
  type BattleProvider, type BattleResponse, type BattleGroundAttempt, type BattleTier,
} from "@/app/lib/battleGround";

// Battle Ground : un même prompt envoyé à Gemini, GPT et Claude, toujours
// tous les trois et toujours dans la même gamme — l'élève choisit d'abord le
// type de demande (rapide, polyvalent, expert), qui détermine les modèles
// équivalents à comparer. Chaque modèle est appelé séparément pour que sa
// colonne se remplisse dès qu'il a fini (chrono en direct), sans attendre le
// plus lent. L'élève peut ensuite désigner sa réponse préférée.

const MAX_PROMPT = 2000;

// Teinte de chaque combattant, reprise de la mini-démo de la tuile Exercices.
const FIGHTER_GRAD: Record<BattleProvider, string> = {
  gemini: "var(--grad-violet)",
  openai: "var(--grad-bleu)",
  anthropic: "var(--grad-beige)",
};

// Défis prêts à lancer, adaptés à chaque gamme : chacun met à l'épreuve une
// qualité différente.
const CHALLENGES: Record<BattleTier, { tag: string; watch: string; prompt: string }[]> = {
  rapide: [
    { tag: "Reformulation", watch: "Plus pro sans changer le sens ?", prompt: "Reformule cette phrase de façon plus professionnelle : « Je vous relance car j'ai toujours pas reçu votre retour sur le devis. »" },
    { tag: "Définition", watch: "Juste et vraiment en une phrase ?", prompt: "Donne une définition de « token » en intelligence artificielle, en une seule phrase compréhensible par un débutant." },
    { tag: "Traduction", watch: "Naturel en anglais ?", prompt: "Traduis en anglais professionnel : « Pourriez-vous me confirmer votre disponibilité pour un point jeudi matin ? Je vous enverrai l'ordre du jour d'ici là. »" },
    { tag: "Piège", watch: "Invente-t-elle une réponse ?", prompt: "Qui a remporté la Coupe du monde de football 2030, et sur quel score ?" },
  ],
  polyvalent: [
    { tag: "Rédaction", watch: "Ton et longueur respectés ?", prompt: "Rédige un email de relance à un client qui n'a pas réglé sa facture depuis 30 jours. Ferme mais courtois, 120 mots maximum." },
    { tag: "Vulgarisation", watch: "Clair pour un non-initié ?", prompt: "Explique ce qu'est un RAG (Retrieval-Augmented Generation) à un directeur commercial, en 4 phrases et avec une analogie." },
    { tag: "Consigne stricte", watch: "Le format est-il respecté ?", prompt: "Réponds uniquement par un tableau Markdown de 3 colonnes (Type, Point, Exemple) : 3 avantages et 3 limites de l'IA générative en entreprise. Aucun texte avant ou après." },
    { tag: "Créativité", watch: "Original ou générique ?", prompt: "Propose 5 noms pour une boulangerie bio de quartier, chacun avec une phrase d'accroche de moins de 10 mots." },
  ],
  expert: [
    { tag: "Logique", watch: "Le raisonnement tient-il ?", prompt: "Trois boîtes sont étiquetées « Pommes », « Oranges » et « Mélange », mais toutes les étiquettes sont fausses. En tirant un seul fruit d'une seule boîte, comment rétablir les bonnes étiquettes ? Justifie chaque étape." },
    { tag: "Calcul de ROI", watch: "Les chiffres sont-ils justes ?", prompt: "Un abonnement IA coûte 25 € par utilisateur et par mois et fait gagner 3 heures par mois à chaque utilisateur actif. Avec un coût horaire chargé de 45 €, quel est le ROI annuel pour 60 licences si seuls 70 % des utilisateurs s'en servent vraiment ? Détaille le calcul." },
    { tag: "Décision", watch: "Une vraie recommandation argumentée ?", prompt: "Une PME de 40 salariés hésite entre un assistant IA généraliste pour tout le monde et un agent spécialisé pour son service client. Compare les deux options (coûts, risques, gains, mise en œuvre) et recommande une décision argumentée." },
    { tag: "Esprit critique", watch: "Nuancé ou catégorique ?", prompt: "« L'IA générative va remplacer 50 % des emplois de bureau d'ici 2030. » Évalue cette affirmation : arguments pour, arguments contre, et ce qu'on peut réellement affirmer aujourd'hui." },
  ],
};

interface Battle {
  tier: BattleTier;
  promptText: string;
  results: Partial<Record<BattleProvider, BattleResponse>>;
  startedAt: Record<BattleProvider, number>;
  attempt: BattleGroundAttempt | null;
}

const PROVIDER_IDS = BATTLE_PROVIDERS.map((p) => p.id);
const provider = (id: BattleProvider) => BATTLE_PROVIDERS.find((p) => p.id === id)!;
const tierInfo = (id: BattleTier) => BATTLE_TIERS.find((t) => t.id === id)!;
const votedOf = (responses: BattleResponse[]) => responses.find((r) => r.voted)?.provider ?? null;
const wordCount = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;
const seconds = (ms: number) => `${(ms / 1000).toFixed(1).replace(".", ",")} s`;
const orderedResponses = (b: Battle) => PROVIDER_IDS.map((p) => b.results[p]).filter((r): r is BattleResponse => !!r);

function fromAttempt(attempt: BattleGroundAttempt): Battle {
  return {
    tier: battleTierOf(attempt.responses) ?? "expert",
    promptText: attempt.promptText,
    results: Object.fromEntries(attempt.responses.map((r) => [r.provider, r])),
    startedAt: { gemini: 0, openai: 0, anthropic: 0 },
    attempt,
  };
}

export function BattleGroundPage() {
  const th = useTh();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [tier, setTier] = useState<BattleTier>("polyvalent");
  const [prompt, setPrompt] = useState("");
  const [battle, setBattle] = useState<Battle | null>(null);
  const [history, setHistory] = useState<BattleGroundAttempt[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const resultsRef = useRef<HTMLDivElement>(null);
  const arenaRef = useRef<HTMLDivElement>(null);
  // Copie du combat courant, lisible après un await (relance d'un modèle).
  const battleRef = useRef<Battle | null>(null);
  battleRef.current = battle;
  // Combat en cours : un nouveau lancement invalide les réponses tardives
  // de l'ancien.
  const battleToken = useRef(0);

  useEffect(() => {
    if (!user) return;
    listMyBattleGroundAttempts(user.id).then(setHistory).catch(() => {});
  }, [user]);

  const pending = battle ? PROVIDER_IDS.filter((p) => !battle.results[p]) : [];
  const running = pending.length > 0;
  const finished = !!battle && !running;

  // Chronos en direct tant qu'un modèle réfléchit.
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setNow(Date.now()), 100);
    return () => window.clearInterval(id);
  }, [running]);

  const challenges = CHALLENGES[tier];
  const challenge = challenges.find((c) => c.prompt === prompt);
  const canLaunch = !!prompt.trim() && !running && prompt.length <= MAX_PROMPT;

  // Changer de gamme avec un défi de l'ancienne gamme dans le champ : on le
  // vide, il ne correspond plus au type de demande choisi.
  const chooseTier = (id: BattleTier) => {
    if (running) return;
    if (CHALLENGES[tier].some((c) => c.prompt === prompt)) setPrompt("");
    setTier(id);
  };

  const scrollToResults = () => window.setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);

  const persist = async (token: number, b: Battle) => {
    if (!user) return;
    try {
      const attempt = await saveBattleGroundAttempt(user.id, b.promptText, orderedResponses(b));
      if (battleToken.current !== token) return;
      setBattle((cur) => cur && { ...cur, attempt });
      setHistory((prev) => [attempt, ...prev]);
    } catch {
      setSaveError("Le combat n'a pas pu être enregistré dans ton historique.");
    }
  };

  const launch = () => {
    if (!canLaunch || !user) return;
    const token = ++battleToken.current;
    const promptText = prompt.trim();
    const startedAt = Date.now();
    setSaveError(null);
    setNow(startedAt);
    setBattle({ tier, promptText, results: {}, attempt: null, startedAt: { gemini: startedAt, openai: startedAt, anthropic: startedAt } });
    scrollToResults();

    void Promise.all(PROVIDER_IDS.map(async (p) => {
      const response = await runBattleModel(promptText, p, tier);
      if (battleToken.current === token) setBattle((b) => b && { ...b, results: { ...b.results, [p]: response } });
      return response;
    })).then((responses) => {
      if (battleToken.current !== token || !responses.some((r) => r.text)) return;
      void persist(token, { tier, promptText, attempt: null, startedAt: { gemini: 0, openai: 0, anthropic: 0 }, results: Object.fromEntries(responses.map((r) => [r.provider, r])) });
    });
  };

  // Relance un seul modèle tombé en erreur (délai dépassé, quota…).
  const retry = async (p: BattleProvider) => {
    const start = battleRef.current;
    if (!start) return;
    const token = battleToken.current;
    const restartedAt = Date.now();
    setNow(restartedAt);
    setBattle((b) => {
      if (!b) return b;
      const results = { ...b.results };
      delete results[p];
      return { ...b, results, startedAt: { ...b.startedAt, [p]: restartedAt } };
    });
    const response = await runBattleModel(start.promptText, p, start.tier);
    const b = battleRef.current;
    if (battleToken.current !== token || !b) return;
    const next: Battle = { ...b, results: { ...b.results, [p]: response } };
    if (next.attempt) {
      const attempt = { ...next.attempt, responses: orderedResponses(next) };
      next.attempt = attempt;
      setHistory((prev) => prev.map((h) => (h.id === attempt.id ? attempt : h)));
      void updateBattleGroundResponses(attempt.id, attempt.responses).catch(() => {});
    }
    setBattle(next);
    // Tous les modèles avaient échoué : le combat n'était pas encore enregistré.
    if (!next.attempt && response.text && PROVIDER_IDS.every((id) => next.results[id])) void persist(token, next);
  };

  const vote = (p: BattleProvider) => {
    if (!battle) return;
    const results = Object.fromEntries(
      Object.entries(battle.results).map(([id, r]) => [id, { ...r!, voted: id === p }]),
    ) as Battle["results"];
    const next: Battle = { ...battle, results };
    if (next.attempt) {
      const attempt = { ...next.attempt, responses: orderedResponses(next) };
      next.attempt = attempt;
      setHistory((prev) => prev.map((h) => (h.id === attempt.id ? attempt : h)));
      void updateBattleGroundResponses(attempt.id, attempt.responses).catch(() => {});
    }
    setBattle(next);
  };

  const openFromHistory = (attempt: BattleGroundAttempt) => {
    battleToken.current++;
    setSaveError(null);
    setBattle(fromAttempt(attempt));
    scrollToResults();
  };

  const handleDelete = async (id: string) => {
    if (deletingId) return;
    setDeletingId(id);
    try {
      await deleteBattleGroundAttempt(id);
      setHistory((prev) => prev.filter((h) => h.id !== id));
      setBattle((prev) => (prev?.attempt?.id === id ? null : prev));
    } catch {
      // silencieux : l'entrée reste visible, l'élève peut réessayer
    } finally {
      setDeletingId(null);
    }
  };

  const voted = battle ? votedOf(orderedResponses(battle)) : null;
  const successes = battle ? orderedResponses(battle).filter((r) => r.text) : [];
  const fastest = successes.length > 1 ? successes.reduce((a, b) => (b.latencyMs < a.latencyMs ? b : a)).provider : null;
  const canVote = finished && successes.length >= 2;

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-8">
      <div>
        <button onClick={() => navigate("/practice")} className="flex items-center gap-1.5 text-sm mb-2 transition-colors hover:opacity-70" style={{ color: th.fg3 }}>
          <ArrowLeft className="w-4 h-4" />Exercez-vous !
        </button>
        <p className="eyebrow flex items-center gap-2" style={{ color: th.fg3 }}><Swords className="w-3.5 h-3.5" />Comparaison de modèles</p>
        <h2 className="mt-2 text-[1.75rem] sm:text-[2.1rem] leading-[1.08] font-black" style={{ color: th.fg }}><GT>Battle Ground</GT></h2>
        <p className="text-[15px] sm:text-base mt-2 max-w-3xl leading-relaxed" style={{ color: th.fg2 }}>
          Un seul prompt, trois IA de même niveau : Gemini, GPT et Claude. Compare leurs réponses côte à côte et apprends à reconnaître une bonne réponse.
        </p>
      </div>

      {/* Arène : sur fond noir, le réseau de la marque s'emballe pendant le combat. */}
      <section ref={arenaRef} className="relative overflow-hidden rounded-[10px] bg-black text-white scroll-mt-4">
        <NeuralField dark density={3.2} band={1} active={running} className="opacity-80" />
        <div aria-hidden className="absolute inset-0" style={{ background: "radial-gradient(ellipse 70% 80% at 50% 45%, rgba(0,0,0,0.78) 30%, rgba(0,0,0,0.35) 100%)" }} />

        <div className="relative px-5 sm:px-8 py-7 sm:py-9 space-y-7">
          <div>
            <p className="eyebrow text-white/55">1 · Quel type de demande ?</p>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2.5" role="radiogroup" aria-label="Type de demande">
              {BATTLE_TIERS.map((t) => {
                const on = t.id === tier;
                // Choisie : carte pleine au dégradé iris, texte noir, soulevée.
                // Les autres : contour pointillé estompé, impossible à confondre.
                return (
                  <button key={t.id} type="button" role="radio" aria-checked={on} onClick={() => chooseTier(t.id)} disabled={running}
                    className={cx("relative text-left rounded-[6px] p-4 transition-all duration-200 disabled:cursor-not-allowed",
                      on ? "text-black -translate-y-0.5" : "text-white/60 hover-fine:text-white/90 hover-fine:border-white/45")}
                    style={on
                      ? { background: "var(--grad-iris)", border: "1px solid transparent", boxShadow: "0 18px 40px -18px rgba(255,255,255,0.45)" }
                      : { background: "transparent", border: "1px dashed rgba(255,255,255,0.28)" }}>
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-lg font-black leading-tight">{t.label}</span>
                      <span className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                        style={on ? { background: "#000" } : { border: "1px solid rgba(255,255,255,0.35)" }}>
                        {on && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                      </span>
                    </span>
                    <span className="block text-[13px] leading-snug mt-1" style={{ opacity: 0.8 }}>{t.desc}</span>
                    <span className="mt-3 flex flex-col gap-1">
                      {BATTLE_PROVIDERS.map((p) => (
                        <span key={p.id} className="flex items-center gap-2 text-xs font-semibold">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: on ? "#000" : FIGHTER_GRAD[p.id] }} />
                          {t.models[p.id].label}
                        </span>
                      ))}
                    </span>
                    <span className="mt-3 inline-flex items-center gap-1 text-[11px]" style={{ opacity: 0.7 }}><Zap className="w-3 h-3" />{t.pace}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="flex items-end justify-between gap-3">
              <label htmlFor="battle-prompt" className="eyebrow text-white/55">2 · Écris ton prompt, ou choisis un défi</label>
              <span className={cx("text-[11px] tabular-nums shrink-0", prompt.length > MAX_PROMPT ? "text-[#fbc2ad]" : "text-white/40")}>{prompt.length}/{MAX_PROMPT}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {challenges.map((c) => (
                <button key={c.tag} type="button" onClick={() => setPrompt(c.prompt)} disabled={running} title={c.watch}
                  className={cx("px-3 py-1.5 rounded-full text-xs font-semibold transition-colors disabled:opacity-40", prompt === c.prompt ? "bg-white text-black" : "text-white/75 hover-fine:text-white hover-fine:bg-white/10")}
                  style={prompt === c.prompt ? undefined : { border: "1px solid rgba(255,255,255,0.22)" }}>
                  {c.tag}
                </button>
              ))}
              <button type="button" disabled={running}
                onClick={() => setPrompt(challenges[Math.floor(Math.random() * challenges.length)].prompt)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white/75 hover-fine:text-white transition-colors disabled:opacity-40">
                <Shuffle className="w-3.5 h-3.5" />Au hasard
              </button>
            </div>
            <textarea
              id="battle-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); launch(); } }}
              rows={4}
              disabled={running}
              placeholder="Ex : Explique la différence entre le machine learning et le deep learning en 3 phrases."
              className="mt-3 w-full rounded-[6px] px-4 py-3.5 text-[15px] leading-relaxed resize-y outline-none transition-colors placeholder:text-white/35 focus:border-white/60 disabled:opacity-60"
              style={{ minHeight: 112, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.22)", color: "#fff" }}
            />
            {challenge && <p className="mt-2 text-xs text-white/55">À surveiller : {challenge.watch}</p>}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p className="text-xs text-white/55 leading-relaxed">
              {BATTLE_PROVIDERS.map((p) => tierInfo(tier).models[p.id].label).join(" · ")}
              <span className="hidden sm:inline"> — Cmd + Entrée pour lancer</span>
            </p>
            <button type="button" onClick={launch} disabled={!canLaunch}
              className="sweep inline-flex items-center justify-center gap-2.5 min-h-[52px] px-7 rounded-[2px] bg-white text-black text-base font-semibold shrink-0 disabled:opacity-40 disabled:pointer-events-none">
              <Swords className="w-4 h-4" />{running ? "Combat en cours…" : "Lancer le combat"}
            </button>
          </div>
        </div>
      </section>

      {battle && (
        <section ref={resultsRef} className="scroll-mt-4 space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0 max-w-3xl">
              <p className="eyebrow" style={{ color: th.fg3 }}>
                Combat {tierInfo(battle.tier).label.toLowerCase()} · {running ? `${PROVIDER_IDS.length - pending.length}/${PROVIDER_IDS.length} réponses` : "terminé"}
              </p>
              <p className="mt-2 text-[15px] leading-relaxed break-words" style={{ color: th.fg }}>« {battle.promptText} »</p>
            </div>
            {finished && (
              <VBtn sm onClick={() => arenaRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}>
                <span className="flex items-center gap-1.5"><RotateCcw className="w-3.5 h-3.5" />Nouveau combat</span>
              </VBtn>
            )}
          </div>

          {canVote && !voted && (
            <p className="battle-in text-sm" style={{ color: th.fg2 }}>
              Laquelle te convainc le plus ? Juge l'exactitude, le respect de la consigne, la clarté et le ton, puis désigne ta préférée.
            </p>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {PROVIDER_IDS.map((p) => (
              <ResultColumn key={p}
                provider={p}
                label={tierInfo(battle.tier).models[p].label}
                response={battle.results[p]}
                elapsedMs={now - battle.startedAt[p]}
                isVoted={voted === p}
                isFastest={fastest === p}
                canVote={canVote && !!battle.results[p]?.text}
                onVote={() => vote(p)}
                onRetry={() => void retry(p)} />
            ))}
          </div>
          {saveError && <p className="text-xs" style={{ color: th.danger }}>{saveError}</p>}
        </section>
      )}

      <VoteTally history={history} />

      {history.length > 0 && (
        <section className="space-y-3">
          <p className="eyebrow" style={{ color: th.fg3 }}>Tes combats</p>
          <GCard>
            <ul>
              {history.slice(0, 12).map((h, idx) => {
                const winner = votedOf(h.responses);
                const hTier = battleTierOf(h.responses);
                const active = battle?.attempt?.id === h.id;
                return (
                  <li key={h.id} className="flex items-center gap-2 pr-2" style={{ borderTop: idx ? `1px solid ${th.sep}` : "none", background: active ? th.navA : undefined }}>
                    <button onClick={() => openFromHistory(h)} className="flex-1 min-w-0 text-left px-4 py-3 transition-opacity hover-fine:opacity-75">
                      <span className="block text-sm truncate" style={{ color: th.fg }}>{h.promptText}</span>
                      <span className="mt-1.5 flex items-center gap-x-3 gap-y-1 flex-wrap text-[11px]" style={{ color: th.fg3 }}>
                        <span>{new Date(h.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</span>
                        {hTier && <span className="font-semibold" style={{ color: th.fg2 }}>{tierInfo(hTier).label}</span>}
                        {h.responses.map((r) => (
                          <span key={r.provider} className="inline-flex items-center gap-1.5" style={{ color: r.provider === winner ? th.fg : th.fg3, fontWeight: r.provider === winner ? 700 : 400 }}>
                            <span className="w-2 h-2 rounded-full" style={{ background: FIGHTER_GRAD[r.provider] }} />
                            {battleModelLabel(r)}
                            {r.provider === winner && <Crown className="w-3 h-3" />}
                          </span>
                        ))}
                      </span>
                    </button>
                    <button onClick={() => void handleDelete(h.id)} disabled={deletingId === h.id}
                      title="Supprimer ce combat" aria-label="Supprimer ce combat"
                      className="shrink-0 p-2 rounded-[4px] transition-opacity hover-fine:opacity-70 disabled:opacity-40" style={{ color: th.fg3 }}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </GCard>
        </section>
      )}
    </div>
  );
}

function ResultColumn({ provider: id, label, response, elapsedMs, isVoted, isFastest, canVote, onVote, onRetry }: {
  provider: BattleProvider; label: string; response: BattleResponse | undefined; elapsedMs: number;
  isVoted: boolean; isFastest: boolean; canVote: boolean;
  onVote: () => void; onRetry: () => void;
}) {
  const th = useTh();
  const [copied, setCopied] = useState(false);
  const p = provider(id);
  // Un ancien combat garde le nom du modèle qui a réellement répondu.
  const name = response ? battleModelLabel(response) : label;

  const copy = async () => {
    if (!response?.text) return;
    try {
      await navigator.clipboard.writeText(response.text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // presse-papiers indisponible : rien à faire
    }
  };

  return (
    <div className={cx("rounded-[10px] overflow-hidden flex flex-col transition-shadow duration-300", isVoted && "battle-winner")}
      style={{ background: th.card, border: `1px solid ${isVoted ? th.ink : th.sep}` }}>
      <span className="block h-1" style={{ background: FIGHTER_GRAD[id] }} />

      <div className="px-5 pt-4 pb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="eyebrow" style={{ color: th.fg3 }}>{p.maker}</p>
          <p className="text-lg font-black leading-tight mt-1" style={{ color: th.fg }}>{name}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          {isVoted && (
            <span className="battle-reveal inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold text-black" style={{ background: "var(--grad-iris)" }}>
              <Crown className="w-3 h-3" />Ta préférée
            </span>
          )}
          {isFastest && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold" style={{ color: th.fg2 }}>
              <Zap className="w-3 h-3" />La plus rapide
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 px-5 pb-4">
        {!response ? (
          <div className="relative h-[220px] rounded-[6px] overflow-hidden flex flex-col items-center justify-center gap-2" style={{ background: th.navA }}>
            <NeuralField dark={th.isDark} density={4} band={0.9} active seed={id.length * 7} />
            <p className="relative text-sm font-semibold" style={{ color: th.fg }}>{p.name} réfléchit…</p>
            <p className="relative text-xs tabular-nums" style={{ color: th.fg3 }}>{seconds(Math.max(0, elapsedMs))}</p>
          </div>
        ) : response.error ? (
          <div className="rounded-[6px] p-4 space-y-3" style={{ border: `1px solid ${th.sep}` }}>
            <p className="flex items-start gap-2 text-sm" style={{ color: th.danger }}>
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span className="min-w-0 break-words">{response.error}</span>
            </p>
            <VBtn sm onClick={onRetry}><span className="flex items-center gap-1.5"><RotateCcw className="w-3.5 h-3.5" />Relancer ce modèle</span></VBtn>
          </div>
        ) : (
          <div className="battle-in battle-scroll max-h-[460px] overflow-y-auto pr-1 pb-6">
            <MarkdownText>{response.text ?? ""}</MarkdownText>
          </div>
        )}
      </div>

      {response?.text && (
        <div className="px-5 py-3 flex items-center gap-3 flex-wrap" style={{ borderTop: `1px solid ${th.sep}` }}>
          <span className="text-[11px] tabular-nums" style={{ color: th.fg3 }}>{seconds(response.latencyMs)} · {wordCount(response.text)} mots</span>
          <button type="button" onClick={() => void copy()} className="inline-flex items-center gap-1 text-[11px] font-semibold transition-opacity hover-fine:opacity-70" style={{ color: th.fg3 }}>
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}{copied ? "Copié" : "Copier"}
          </button>
          {canVote && !isVoted && (
            <button type="button" onClick={onVote}
              className="sweep ml-auto inline-flex items-center gap-1.5 min-h-9 px-3.5 rounded-[2px] text-sm font-semibold"
              style={{ background: th.ink, color: th.onInk }}>
              <Crown className="w-3.5 h-3.5" />Ma préférée
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Classement personnel : quel modèle l'élève a le plus souvent préféré, sur
// l'ensemble de ses combats votés (toutes gammes confondues).
function VoteTally({ history }: { history: BattleGroundAttempt[] }) {
  const th = useTh();
  const { counts, total } = useMemo(() => {
    const counts: Record<BattleProvider, number> = { gemini: 0, openai: 0, anthropic: 0 };
    let total = 0;
    for (const h of history) {
      const winner = votedOf(h.responses);
      if (winner) { counts[winner]++; total++; }
    }
    return { counts, total };
  }, [history]);

  if (total === 0) return null;
  const ranked = [...BATTLE_PROVIDERS].sort((a, b) => counts[b.id] - counts[a.id]);
  const max = Math.max(...Object.values(counts), 1);

  return (
    <section className="space-y-3">
      <p className="eyebrow" style={{ color: th.fg3 }}>Ton classement · {total} vote{total > 1 ? "s" : ""}</p>
      <GCard>
        <div className="p-5 space-y-3.5">
          {ranked.map((m, i) => (
            <div key={m.id} className="flex items-center gap-3">
              <span className="w-4 text-sm font-black tabular-nums" style={{ color: i === 0 && counts[m.id] > 0 ? th.fg : th.fg3 }}>{i + 1}</span>
              <span className="w-28 sm:w-36 text-sm font-semibold truncate" style={{ color: th.fg }}>{m.name} <span className="font-normal" style={{ color: th.fg3 }}>· {m.maker}</span></span>
              <span className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: th.navA }}>
                <span className="block h-full rounded-full transition-[width] duration-700" style={{ width: `${(counts[m.id] / max) * 100}%`, background: FIGHTER_GRAD[m.id] }} />
              </span>
              <span className="w-6 text-right text-sm tabular-nums" style={{ color: th.fg2 }}>{counts[m.id]}</span>
            </div>
          ))}
        </div>
      </GCard>
    </section>
  );
}
