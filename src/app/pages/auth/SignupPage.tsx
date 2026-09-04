import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router";
import {
  ChevronRight, ChevronLeft, Sparkles, CheckCircle,
  ArrowRight, Wand2, RefreshCw,
} from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { useAuth } from "@/app/state/auth-context";
import { useProfile } from "@/app/state/profile-context";
import { Background } from "@/app/components/common/Background";
import { Logo } from "@/app/components/common/Logo";
import { GCard } from "@/app/components/common/GCard";
import { GT } from "@/app/components/common/GT";
import { VBtn, ShimBtn } from "@/app/components/common/Buttons";
import { cx } from "@/app/lib/cx";
import { LEARN_STYLES, TUTOR_STYLES } from "@/app/data/mock";
import type { Profile } from "@/app/types";

const TOTAL_STEPS = 4;

export function SignupPage() {
  const th = useTh();
  const navigate = useNavigate();
  const { user, signUp } = useAuth();
  const { saveOnboarding } = useProfile();

  const firstStep = user ? 2 : 1;
  const [step, setStep] = useState(firstStep);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [accountError, setAccountError] = useState<string | null>(null);
  const [accountLoading, setAccountLoading] = useState(false);

  const [p, setP] = useState<Profile>({ name: "", age: "", profession: "", goal: "", goalFinal: "", style: "", tutor: "", avatarUrl: null });
  const [aiState, setAiState] = useState<"idle" | "loading" | "proposal">("idle");
  const [aiProposal, setAiProposal] = useState("");
  const [finishing, setFinishing] = useState(false);

  const canNext = () => {
    if (step === 2) return p.name.trim() && p.age.trim() && p.profession.trim();
    if (step === 3) return !!p.style;
    return !!p.tutor;
  };

  const handleCreateAccount = async (e: FormEvent) => {
    e.preventDefault();
    if (password !== passwordConfirm) { setAccountError("Les mots de passe ne correspondent pas."); return; }
    setAccountError(null);
    setAccountLoading(true);
    const { error } = await signUp(email, password);
    setAccountLoading(false);
    if (error) { setAccountError(error); return; }
    setStep(2);
  };

  const formulateWithAI = () => {
    if (!p.goal.trim()) return;
    setAiState("loading");
    setTimeout(() => {
      const prof = p.profession || "professionnel·le";
      setAiProposal(`En tant que ${prof}, je souhaite maîtriser l'IA générative pour automatiser les tâches à faible valeur ajoutée et améliorer la qualité de mes livrables. J'aimerais notamment utiliser ChatGPT et Claude pour rédiger du contenu professionnel, analyser des données et structurer ma veille sectorielle. Résultat attendu : gagner 2 à 3 heures par jour, me positionner comme référent IA dans mon équipe et proposer des services à plus forte valeur.`);
      setAiState("proposal");
    }, 1600);
  };

  const acceptProposal = () => { setP(x => ({ ...x, goal: aiProposal, goalFinal: aiProposal })); setAiState("idle"); setAiProposal(""); };
  const discardProposal = () => { setAiState("idle"); setAiProposal(""); };

  const finishOnboarding = async () => {
    setFinishing(true);
    await saveOnboarding(p);
    navigate("/");
  };


  return (
    <div className="relative min-h-screen flex items-center justify-center p-4" style={{ background: th.bg, fontFamily: "'Funnel Display',sans-serif" }}>
      <Background />
      <div className="relative z-10 w-full max-w-[620px] fade-up">
        <div className="flex justify-center mb-10"><Logo h={30} /></div>
        <GCard glow>
          <div className="p-6 sm:p-8 lg:p-10">
            <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300"
                      style={{ background: i < step ? `linear-gradient(135deg,${th.grad1},${th.grad2})` : i === step ? `${th.gradShadow(0.12)}` : "transparent", border: i === step ? `1px solid ${th.gradShadow(0.4)}` : "1px solid " + th.sep, color: i < step ? "#08060F" : i === step ? th.navAC : th.fg3, boxShadow: i === step ? `0 0 16px ${th.gradShadow(0.25)}` : "none" }}>
                      {i < step ? <CheckCircle className="w-3.5 h-3.5" /> : i}
                    </div>
                    {i < 4 && <div className="w-8 h-px" style={{ background: i < step ? `${th.gradShadow(0.5)}` : th.sep }} />}
                  </div>
                ))}
              </div>
              <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: th.fg3 }}>Étape {step} / {TOTAL_STEPS}</span>
            </div>

            <div className="relative mb-6">
              <div className="absolute -top-2 -left-1 text-7xl font-black leading-none pointer-events-none select-none" style={{ color: th.isDark ? `${th.gradShadow(0.04)}` : `${th.gradShadow(0.06)}`, fontFamily: "'Funnel Display',sans-serif" }}>0{step}</div>
              <h1 className="relative text-2xl font-black leading-tight mb-2" style={{ fontFamily: "'Funnel Display',sans-serif" }}>
                <GT>
                  {step === 1 && "Crée ton compte"}{step === 2 && "L'IA configure ton académie personnalisée"}{step === 3 && "Comment apprends-tu le mieux ?"}{step === 4 && "Choisis ton style de Tuteur IA"}
                </GT>
              </h1>
              <p className="text-sm" style={{ color: th.fg3 }}>
                {step === 1 && "Une adresse email et un mot de passe pour retrouver ton parcours."}
                {step === 2 && "Quelques infos pour adapter chaque leçon à ton profil exact."}
                {step === 3 && "L'IA sélectionnera les formats adaptés à ta façon de mémoriser."}
                {step === 4 && "Le ton de ton assistant s'adapte à ta personnalité."}
              </p>
            </div>

            {step === 1 && (
              <form onSubmit={handleCreateAccount} className="space-y-4 fade-up">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: th.fg3 }}>Email</label>
                  <input type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="toi@exemple.com" className="w-full rounded-xl px-4 py-3 text-sm g-input" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: th.fg3 }}>Mot de passe</label>
                    <input type="password" required minLength={6} autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full rounded-xl px-4 py-3 text-sm g-input" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: th.fg3 }}>Confirmer</label>
                    <input type="password" required minLength={6} autoComplete="new-password" value={passwordConfirm} onChange={e => setPasswordConfirm(e.target.value)} placeholder="••••••••" className="w-full rounded-xl px-4 py-3 text-sm g-input" />
                  </div>
                </div>
                {accountError && <p className="text-xs" style={{ color: "#fbc2ad" }}>{accountError}</p>}
                <div className="pt-2">
                  <ShimBtn full disabled={accountLoading}>
                    <span className="flex items-center justify-center gap-2.5">{accountLoading ? "Création…" : <>Continuer<ArrowRight className="w-5 h-5" /></>}</span>
                  </ShimBtn>
                </div>
                <p className="text-xs text-center" style={{ color: th.fg3 }}>
                  Déjà un compte ? <Link to="/login" style={{ color: th.navAC }} className="font-semibold hover:opacity-80">Se connecter</Link>
                </p>
              </form>
            )}

            {step === 2 && (
              <div className="space-y-4 fade-up">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: th.fg3 }}>Prénom</label><input value={p.name} onChange={e => setP(x => ({ ...x, name: e.target.value }))} placeholder="Alex" className="w-full rounded-xl px-4 py-3 text-sm g-input" /></div>
                  <div><label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: th.fg3 }}>Âge</label><input value={p.age} type="number" onChange={e => setP(x => ({ ...x, age: e.target.value }))} placeholder="28" className="w-full rounded-xl px-4 py-3 text-sm g-input" /></div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: th.fg3 }}>Profession / Poste</label>
                  <input value={p.profession} onChange={e => setP(x => ({ ...x, profession: e.target.value }))} placeholder="Chef de projet digital, Développeur full-stack…" className="w-full rounded-xl px-4 py-3 text-sm g-input" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: th.fg3 }}>Objectif professionnel</label>
                  <textarea
                    value={p.goal}
                    onChange={e => { setP(x => ({ ...x, goal: e.target.value })); setAiState("idle"); setAiProposal(""); }}
                    placeholder="Décrivez votre situation et pourquoi vous souhaitez utiliser l'IA, comment vous voulez l'utiliser, et ce que vous attendez comme résultat concret…"
                    rows={4} className="w-full rounded-xl px-4 py-3 text-sm g-input resize-none" />
                  <div className="mt-2">
                    <button onClick={formulateWithAI} disabled={!p.goal.trim() || aiState === "loading"}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all hover:opacity-80 disabled:opacity-40"
                      style={{ background: `${th.gradShadow(0.1)}`, border: `1px solid ${th.gradShadow(0.25)}`, color: th.navAC }}>
                      {aiState === "loading"
                        ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" />L'IA formule…</>
                        : <><Wand2 className="w-3.5 h-3.5" />Formuler mon objectif avec l'IA</>}
                    </button>
                  </div>
                  {aiState === "proposal" && (
                    <div className="mt-3 rounded-xl p-4" style={{ background: `${th.gradShadow(0.07)}`, border: `1px solid ${th.gradShadow(0.2)}` }}>
                      <div className="flex items-center gap-2 mb-2 text-xs font-bold" style={{ color: th.navAC }}><Sparkles className="w-3.5 h-3.5" />Proposition de l'IA — tu peux modifier ci-dessous</div>
                      <textarea value={aiProposal} onChange={e => setAiProposal(e.target.value)} rows={4} className="w-full rounded-xl px-3 py-2.5 text-sm g-input resize-none mb-3" />
                      <div className="flex items-center gap-2">
                        <VBtn onClick={acceptProposal} sm><span className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5" />Valider cet objectif</span></VBtn>
                        <button onClick={discardProposal} className="text-xs px-3 py-2 rounded-lg transition-colors hover:opacity-70" style={{ color: th.fg3 }}>Annuler</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 fade-up">
                {LEARN_STYLES.map(({ id, Icon, label, desc }) => {
                  const sel = p.style === id;
                  return (
                    <button key={id} onClick={() => setP(x => ({ ...x, style: id }))} className="rounded-2xl text-left transition-all duration-200 hover:scale-[1.02]"
                      style={{ background: sel ? `${th.gradShadow(0.1)}` : "transparent", border: sel ? `1px solid ${th.gradShadow(0.4)}` : `1px solid ${th.sep}`, boxShadow: sel ? `0 0 24px ${th.gradShadow(0.15)}` : "none" }}>
                      <div className="p-5 h-full rounded-2xl">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: sel ? `${th.gradShadow(0.15)}` : `${th.gradShadow(0.05)}` }}>
                          <Icon className="w-5 h-5" style={{ color: sel ? th.navAC : th.fg3 }} />
                        </div>
                        <div className="text-sm font-bold mb-1" style={{ color: sel ? th.navAC : th.fg }}>{label}</div>
                        <div className="text-xs leading-relaxed" style={{ color: th.fg3 }}>{desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {step === 4 && (
              <div className="space-y-3 fade-up">
                {TUTOR_STYLES.map(({ id, emoji, label, desc }) => {
                  const sel = p.tutor === id;
                  return (
                    <button key={id} onClick={() => setP(x => ({ ...x, tutor: id }))} className="w-full rounded-2xl text-left transition-all hover:scale-[1.01]"
                      style={{ background: sel ? `${th.gradShadow(0.08)}` : "transparent", border: `1px solid ${sel ? `${th.gradShadow(0.35)}` : th.sep}`, boxShadow: sel ? `0 0 20px ${th.gradShadow(0.12)}` : "none" }}>
                      <div className="px-5 py-4 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0" style={{ background: sel ? `${th.gradShadow(0.1)}` : `${th.gradShadow(0.04)}` }}>{emoji}</div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold mb-0.5" style={{ color: sel ? th.navAC : th.fg }}>{label}</div>
                          <div className="text-xs" style={{ color: th.fg3 }}>{desc}</div>
                        </div>
                        {sel && <CheckCircle className="w-4 h-4 shrink-0" style={{ color: th.navAC }} />}
                      </div>
                    </button>
                  );
                })}
                <div className="pt-4">
                  <ShimBtn onClick={finishOnboarding} disabled={finishing} full>
                    <span className="flex items-center justify-center gap-2.5"><Sparkles className="w-5 h-5" />{finishing ? "Finalisation…" : "Générer mon parcours IA"}{!finishing && <ArrowRight className="w-5 h-5" />}</span>
                  </ShimBtn>
                </div>
              </div>
            )}

            {step !== 1 && (
              <div className="flex items-center justify-between mt-8 pt-5" style={{ borderTop: `1px solid ${th.sep}` }}>
                <button onClick={() => setStep(s => Math.max(firstStep, s - 1))} className={cx("flex items-center gap-1.5 text-sm transition-colors", step === firstStep ? "invisible" : "hover:opacity-70")} style={{ color: th.fg3 }}><ChevronLeft className="w-4 h-4" />Retour</button>
                {step < 4 && <VBtn onClick={() => canNext() && setStep(s => s + 1)} sm>Continuer <ChevronRight className="inline w-4 h-4 ml-1" /></VBtn>}
              </div>
            )}
          </div>
        </GCard>
      </div>
    </div>
  );
}
