import { useState, useRef, useEffect, createContext, useContext } from "react";
import logoWhite from "@/imports/Logotype_BLANC.png";
import {
  Flame, Search, Clock, Target, Brain, Calendar,
  Play, ChevronRight, ChevronLeft, Mic, Send,
  Zap, BookOpen, Headphones, Code2, FileText,
  Sparkles, MessageSquare, CheckCircle, X,
  ArrowRight, Lightbulb, Pause, Monitor, AlignLeft,
  Network, RotateCcw, BarChart3, Volume2, Maximize2,
  Lock, Star, User, Trophy, Layers, Filter,
  ExternalLink, ChevronDown, Video, Bell,
  TrendingUp, Award, Bookmark, Sun, Moon,
  Image, Wand2, RefreshCw,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";

// ── Theme ─────────────────────────────────────────────────────────────────
function mkTh(isDark: boolean) {
  return {
    bg:      isDark ? "#08060F"                 : "#F8F6FF",
    fg:      isDark ? "rgba(242,235,249,0.9)"   : "rgba(26,13,46,0.9)",
    fg2:     isDark ? "rgba(242,235,249,0.55)"  : "rgba(26,13,46,0.55)",
    fg3:     isDark ? "rgba(242,235,249,0.3)"   : "rgba(26,13,46,0.32)",
    card:    isDark ? "rgba(9,6,17,0.9)"        : "rgba(255,255,255,0.95)",
    cardGrd: isDark
      ? "linear-gradient(135deg,rgba(221,174,234,0.15) 0%,rgba(255,255,255,0.05) 50%,rgba(221,174,234,0.08) 100%)"
      : "linear-gradient(135deg,rgba(155,93,229,0.18) 0%,rgba(255,255,255,0.6) 50%,rgba(155,93,229,0.1) 100%)",
    sidebar:  isDark ? "rgba(10,6,18,0.8)"      : "rgba(255,255,255,0.95)",
    sidebarB: isDark ? "rgba(221,174,234,0.08)" : "rgba(155,93,229,0.1)",
    inputBg:  isDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.85)",
    inputB:   isDark ? "rgba(221,174,234,0.14)" : "rgba(155,93,229,0.22)",
    sep:      isDark ? "rgba(255,255,255,0.05)" : "rgba(26,13,46,0.07)",
    topbar:   isDark ? "rgba(8,6,15,0.65)"      : "rgba(248,246,255,0.9)",
    grid:     isDark ? "rgba(221,174,234,0.025)": "rgba(155,93,229,0.05)",
    navA:     isDark
      ? "linear-gradient(135deg,rgba(221,174,234,0.14),rgba(155,93,229,0.08))"
      : "linear-gradient(135deg,rgba(155,93,229,0.1),rgba(221,174,234,0.06))",
    navAB:   isDark ? "rgba(221,174,234,0.3)"  : "rgba(155,93,229,0.3)",
    navAC:   isDark ? "#DDAEEA"                : "#9B5DE5",
    orbA:    isDark ? "rgba(155,93,229,0.25)"  : "rgba(155,93,229,0.1)",
    orbB:    isDark ? "rgba(221,174,234,0.18)" : "rgba(221,174,234,0.07)",
    isDark,
  };
}
type Th = ReturnType<typeof mkTh>;
const ThemeCtx = createContext<Th>(mkTh(true));
const useTh = () => useContext(ThemeCtx);

// ── Global CSS ─────────────────────────────────────────────────────────────
const mkCSS = (isDark: boolean) => `
  @keyframes shimmer {
    0%   { background-position: 200% center; }
    100% { background-position: -200% center; }
  }
  @keyframes orb-drift {
    0%,100% { transform: translate(0,0) scale(1); }
    33%     { transform: translate(24px,-36px) scale(1.06); }
    66%     { transform: translate(-18px,22px) scale(0.96); }
  }
  @keyframes orb-drift-b {
    0%,100% { transform: translate(0,0) scale(1); }
    40%     { transform: translate(-30px,18px) scale(1.04); }
    75%     { transform: translate(14px,-24px) scale(0.97); }
  }
  @keyframes fade-up {
    from { opacity:0; transform:translateY(14px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes bounce-dot {
    0%,80%,100% { transform:scale(0); }
    40%         { transform:scale(1); }
  }
  @keyframes dot-blink {
    0%,100% { opacity:1; }
    50%     { opacity:0.3; }
  }
  .fade-up { animation: fade-up 0.4s ease both; }
  .g-input {
    background: ${isDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.85)"};
    border: 1px solid ${isDark ? "rgba(221,174,234,0.14)" : "rgba(155,93,229,0.22)"};
    color: ${isDark ? "rgba(242,235,249,0.85)" : "rgba(26,13,46,0.85)"};
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .g-input::placeholder { color: ${isDark ? "rgba(242,235,249,0.22)" : "rgba(26,13,46,0.28)"}; }
  .g-input:focus {
    outline: none;
    border-color: rgba(155,93,229,0.5);
    box-shadow: 0 0 0 3px rgba(155,93,229,0.08), 0 0 20px rgba(155,93,229,0.1);
  }
  ::-webkit-scrollbar { width:4px; height:4px; }
  ::-webkit-scrollbar-track { background:transparent; }
  ::-webkit-scrollbar-thumb { background:rgba(155,93,229,0.2); border-radius:4px; }
`;

// ── Types ──────────────────────────────────────────────────────────────────
type Page = "onboarding" | "main" | "lesson";
type NavId = "dashboard"|"lessons"|"practice"|"calendar"|"benefits"|"profile";
interface Profile {
  name:string; age:string; profession:string;
  goal:string; goalFinal:string; style:string; tutor:string;
}
interface ChatMsg { role:"user"|"ai"; text:string; }

// ── Data ───────────────────────────────────────────────────────────────────
const MEMORY_DATA = [
  {t:"Auj.",decay:100,ai:100},{t:"J+1",decay:62,ai:62},{t:"J+3",decay:42,ai:91},
  {t:"J+7",decay:26,ai:79},{t:"J+14",decay:17,ai:93},{t:"J+21",decay:13,ai:84},{t:"J+30",decay:10,ai:88},
];
const SKILLS = [
  {label:"Logique",pct:87,strong:true},{label:"UX Design",pct:74,strong:true},
  {label:"Prompting IA",pct:71,strong:true},{label:"Analyse données",pct:64,strong:false},
  {label:"Fonctions Async",pct:38,strong:false},{label:"Tests unitaires",pct:27,strong:false},
];
const LEARN_STYLES = [
  {id:"visual", Icon:Monitor,   label:"Visuel & Vidéo",   desc:"Cours vidéo et schémas animés"},
  {id:"audio",  Icon:Headphones,label:"Podcast & Audio",  desc:"Mémorisation par écoute active"},
  {id:"project",Icon:Code2,     label:"Projets pratiques",desc:"Apprendre en construisant"},
  {id:"summary",Icon:FileText,  label:"Résumés express",  desc:"Synthèses denses et mémos rapides"},
];
const TUTOR_STYLES = [
  {id:"soft",  emoji:"🤝",label:"Pédagogue doux",  desc:"Patient, encourageant, beaucoup d'exemples"},
  {id:"strict",emoji:"🎯",label:"Expert strict",   desc:"Exigeant, direct, haute performance"},
  {id:"synth", emoji:"⚡",label:"Mode Synthétique",desc:"Concis, efficace, zéro superflu"},
];
const MODULES = [
  {id:1,icon:"🧠",title:"Introduction à l'IA Générative",total:5,done:5,status:"complete"},
  {id:2,icon:"⚡",title:"Prompt Engineering Pro",        total:8,done:5,status:"active"},
  {id:3,icon:"🔄",title:"IA & Automatisation",          total:6,done:0,status:"locked"},
  {id:4,icon:"🤖",title:"Agents IA & Workflows",        total:7,done:0,status:"locked"},
  {id:5,icon:"🏆",title:"Projet Final & Certification", total:3,done:0,status:"locked"},
];
const M2_LESSONS = [
  {id:1,title:"Les bases du prompting",         dur:"15min",done:true},
  {id:2,title:"La formule RCTF expliquée",      dur:"20min",done:true},
  {id:3,title:"Prompts pour GPT-4o",            dur:"18min",done:true},
  {id:4,title:"Chain of Thought",               dur:"22min",done:true},
  {id:5,title:"Few-shot learning",              dur:"16min",done:true},
  {id:6,title:"Maîtriser le Prompt Engineering",dur:"23min",done:false,current:true},
  {id:7,title:"Prompts avancés & température",  dur:"19min",done:false},
  {id:8,title:"Quiz final du module",           dur:"30min",done:false},
];
const CERT_CHAPTERS = [
  {title:"Introduction à l'IA Générative",pct:100,done:true},
  {title:"Prompt Engineering Pro",        pct:64,done:false,active:true},
  {title:"IA & Automatisation",           pct:0,done:false},
  {title:"Agents IA & Workflows",         pct:0,done:false},
  {title:"Projet Final",                  pct:0,done:false},
];
const PROMPT_CATS = [
  {emoji:"📧",label:"Marketing & Email",  count:42},{emoji:"💻",label:"Dev & Code",      count:38},
  {emoji:"📊",label:"Data & Analyse",    count:29},{emoji:"🎨",label:"Design & Créatif",count:31},
  {emoji:"📝",label:"Rédaction & SEO",   count:44},{emoji:"🤝",label:"Commercial",      count:27},
  {emoji:"⚙️",label:"Automatisation",   count:35},{emoji:"🧠",label:"Stratégie & RH",  count:22},
];
const AI_TOOLS = [
  {name:"ChatGPT",   sub:"GPT-4o",      color:"#10A37F",letter:"G"},
  {name:"Claude",    sub:"Sonnet 4.5",  color:"#DDAEEA",letter:"C"},
  {name:"Gemini",    sub:"Pro 2.0",     color:"#4285F4",letter:"G"},
  {name:"Mistral",   sub:"Large 2",     color:"#FF7000",letter:"M"},
  {name:"Perplexity",sub:"Pro",         color:"#20808D",letter:"P"},
];
const CAL_EVENTS = [
  {col:0,label:"Révision Leçon 1",  type:"review"},
  {col:1,label:"Session Expert IA", type:"expert"},
  {col:3,label:"Quiz Module 2",     type:"quiz"},
  {col:4,label:"Pratique Sandbox",  type:"practice"},
  {col:5,label:"Révision J+14",     type:"review"},
];
const BADGES = [
  {emoji:"⚡",label:"Premier prompt",    done:true},{emoji:"🔥",label:"7 jours consécutifs",done:true},
  {emoji:"🧠",label:"Quiz parfait 100%", done:true},{emoji:"💬",label:"Session expert",     done:false},
  {emoji:"📚",label:"100 prompts écrits",done:false},{emoji:"🏆",label:"Certifié IA Pro",   done:false},
];
const QUIZ_Q = {
  question:"Quelle technique améliore le plus la qualité d'un prompt IA ?",
  options:["Utiliser des mots-clés SEO","Assigner un rôle précis à l'IA avant la tâche","Écrire en majuscules","Poser plusieurs questions simultanées"],
  correct:1,
  explanation:"Assigner un rôle ancre le contexte de l'IA et améliore drastiquement la pertinence — c'est la base du prompt engineering professionnel.",
};
const AI_RESPONSES:{kw:string[];text:string}[] = [
  {kw:["reformule","simple"],text:"En clair : un prompt c'est une commande à l'IA. Rôle + Contexte + Tâche + Format = la formule gagnante."},
  {kw:["exemple","métier","concret"],text:"Pour un marketeur : 'Tu es expert en conversion SaaS B2B. Rédige un email de 120 mots pour relancer un prospect après 14 jours d'essai. Ton : direct, axé ROI.'"},
  {kw:["crash","test"],text:"⏱ Crash test !\n\nCause principale des réponses incohérentes ?\n(A) Modèle buggé\n(B) Prompt sans rôle ni contexte\n(C) Connexion instable\n(D) Mauvais modèle"},
];
const DEFAULT_AI = "Je suis ton Copilote IA. Pose-moi n'importe quelle question ou utilise les actions rapides 👇";

// ── Helpers ────────────────────────────────────────────────────────────────
function cx(...c:(string|false|undefined)[]) { return c.filter(Boolean).join(" "); }

function GCard({children,className="",glow=false,accent=false,onClick}:{
  children:React.ReactNode;className?:string;glow?:boolean;accent?:boolean;onClick?:()=>void;
}) {
  const th = useTh();
  return (
    <div onClick={onClick} className={cx("rounded-2xl",className,onClick&&"cursor-pointer")}
      style={{background:accent?"linear-gradient(135deg,rgba(221,174,234,0.5) 0%,rgba(155,93,229,0.3) 40%,rgba(221,174,234,0.15) 100%)":th.cardGrd,padding:"1px",boxShadow:glow?"0 0 48px rgba(155,93,229,0.12),0 16px 48px rgba(0,0,0,0.3)":"0 4px 24px rgba(0,0,0,0.15)"}}>
      <div className="rounded-2xl h-full w-full overflow-hidden" style={{background:th.card,backdropFilter:"blur(24px)"}}>
        {children}
      </div>
    </div>
  );
}

function GT({children,from="#FFFFFF",to="#DDAEEA",className=""}:{children:React.ReactNode;from?:string;to?:string;className?:string;}) {
  const th=useTh();
  const f=th.isDark?from:"#2D0F6F", t=th.isDark?to:"#9B5DE5";
  return <span className={className} style={{background:`linear-gradient(135deg,${f} 0%,${t} 100%)`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text"}}>{children}</span>;
}

// Shimmer — only for key CTAs
function ShimBtn({children,onClick,sm,full}:{children:React.ReactNode;onClick?:()=>void;sm?:boolean;full?:boolean;}) {
  return (
    <button onClick={onClick} style={{background:"linear-gradient(135deg,#7C3AED 0%,#DDAEEA 40%,#9B5DE5 60%,#DDAEEA 100%)",backgroundSize:"300% auto",animation:"shimmer 4s linear infinite",boxShadow:"0 0 32px rgba(155,93,229,0.35),0 4px 16px rgba(0,0,0,0.3)",color:"#08060F"}}
      className={cx("rounded-xl font-bold transition-all duration-200 hover:opacity-90 active:scale-[0.98]",full&&"w-full",sm?"px-4 py-2.5 text-sm":"px-7 py-3.5 text-base")}>
      {children}
    </button>
  );
}

// Regular violet button — no animation
function VBtn({children,onClick,sm,full}:{children:React.ReactNode;onClick?:()=>void;sm?:boolean;full?:boolean;}) {
  const th=useTh();
  return (
    <button onClick={onClick}
      style={{background:th.isDark?"rgba(221,174,234,0.1)":"rgba(155,93,229,0.1)",border:`1px solid ${th.navAB}`,color:th.navAC}}
      className={cx("rounded-xl font-semibold transition-all duration-200 hover:opacity-80 active:scale-[0.98]",full&&"w-full",sm?"px-4 py-2 text-sm":"px-5 py-2.5 text-sm")}>
      {children}
    </button>
  );
}

function CircleProgress({pct,size=88,color="#9B5DE5"}:{pct:number;size?:number;color?:string;}) {
  const r=(size-10)/2,c=2*Math.PI*r,dash=(pct/100)*c;
  return (
    <svg width={size} height={size}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(155,93,229,0.1)" strokeWidth={5}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={5}
        strokeDasharray={`${dash} ${c-dash}`} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{filter:`drop-shadow(0 0 6px ${color})`}}/>
    </svg>
  );
}

function Background() {
  const th=useTh();
  return (
    <>
      <style>{mkCSS(th.isDark)}</style>
      <div className="fixed inset-0 pointer-events-none z-0" style={{backgroundImage:`linear-gradient(${th.grid} 1px,transparent 1px),linear-gradient(90deg,${th.grid} 1px,transparent 1px)`,backgroundSize:"52px 52px"}}/>
      <div className="fixed pointer-events-none z-0" style={{top:"-20%",right:"-15%",width:600,height:600,borderRadius:"50%",background:`radial-gradient(circle,${th.orbA} 0%,transparent 65%)`,filter:"blur(80px)",animation:"orb-drift 18s ease-in-out infinite"}}/>
      <div className="fixed pointer-events-none z-0" style={{bottom:"-25%",left:"-15%",width:700,height:700,borderRadius:"50%",background:`radial-gradient(circle,${th.orbB} 0%,transparent 65%)`,filter:"blur(100px)",animation:"orb-drift-b 22s ease-in-out infinite"}}/>
    </>
  );
}

function Logo({h=28}:{h?:number}) {
  const th=useTh();
  return th.isDark
    ? <img src={logoWhite} alt="Les Formateurs IA" style={{height:h,objectFit:"contain",objectPosition:"left"}}/>
    : <img src={logoWhite} alt="Les Formateurs IA" style={{height:h,objectFit:"contain",objectPosition:"left",filter:"invert(1) sepia(1) saturate(3) hue-rotate(240deg) brightness(0.3)"}}/>;
}

function MemTip({active,payload,label}:any) {
  const th=useTh();
  if(!active||!payload?.length) return null;
  return (
    <div className="rounded-xl px-3 py-2.5 text-xs" style={{background:th.card,border:`1px solid rgba(155,93,229,0.2)`,boxShadow:"0 8px 32px rgba(0,0,0,0.2)"}}>
      <div className="mb-1.5 font-medium" style={{color:th.fg3}}>{label}</div>
      {payload.map((p:any)=>(
        <div key={p.name} className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full" style={{background:p.color}}/>
          <span style={{color:p.color}}>{p.name==="ai"?"🧠 Avec IA":"📉 Sans révision"} <strong>{p.value}%</strong></span>
        </div>
      ))}
    </div>
  );
}

const NAV_ITEMS:{id:NavId;Icon:typeof BarChart3;label:string}[] = [
  {id:"dashboard",Icon:BarChart3,label:"Tableau de bord"},
  {id:"lessons",  Icon:BookOpen, label:"Mes leçons"},
  {id:"practice", Icon:Code2,    label:"Pratique IA"},
  {id:"calendar", Icon:Calendar, label:"Planning"},
  {id:"benefits", Icon:Star,     label:"Mes avantages"},
  {id:"profile",  Icon:User,     label:"Mon profil"},
];

// ═══════════════════════════════════════════════════════════════════════════
// ONBOARDING
// ═══════════════════════════════════════════════════════════════════════════
function OnboardingPage({onDone}:{onDone:(p:Profile)=>void}) {
  const th=useTh();
  const [step,setStep]=useState(1);
  const [p,setP]=useState<Profile>({name:"",age:"",profession:"",goal:"",goalFinal:"",style:"",tutor:""});
  const [aiState,setAiState]=useState<"idle"|"loading"|"proposal">("idle");
  const [aiProposal,setAiProposal]=useState("");

  const canNext=()=>{
    if(step===1) return p.name.trim()&&p.age.trim()&&p.profession.trim();
    if(step===2) return !!p.style;
    return !!p.tutor;
  };

  const formulateWithAI=()=>{
    if(!p.goal.trim()) return;
    setAiState("loading");
    setTimeout(()=>{
      const prof=p.profession||"professionnel·le";
      setAiProposal(`En tant que ${prof}, je souhaite maîtriser l'IA générative pour automatiser les tâches à faible valeur ajoutée et améliorer la qualité de mes livrables. J'aimerais notamment utiliser ChatGPT et Claude pour rédiger du contenu professionnel, analyser des données et structurer ma veille sectorielle. Résultat attendu : gagner 2 à 3 heures par jour, me positionner comme référent IA dans mon équipe et proposer des services à plus forte valeur.`);
      setAiState("proposal");
    },1600);
  };

  const acceptProposal=()=>{ setP(x=>({...x,goal:aiProposal,goalFinal:aiProposal})); setAiState("idle"); setAiProposal(""); };
  const discardProposal=()=>{ setAiState("idle"); setAiProposal(""); };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4" style={{background:th.bg,fontFamily:"'Inter',sans-serif"}}>
      <Background/>
      <div className="relative z-10 w-full max-w-[620px] fade-up">
        <div className="flex justify-center mb-10"><Logo h={30}/></div>
        <GCard glow>
          <div className="p-8 sm:p-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                {[1,2,3].map(i=>(
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300"
                      style={{background:i<step?"linear-gradient(135deg,#9B5DE5,#DDAEEA)":i===step?"rgba(155,93,229,0.12)":"transparent",border:i===step?"1px solid rgba(155,93,229,0.4)":"1px solid "+th.sep,color:i<step?"#08060F":i===step?"#9B5DE5":th.fg3,boxShadow:i===step?"0 0 16px rgba(155,93,229,0.25)":"none"}}>
                      {i<step?<CheckCircle className="w-3.5 h-3.5"/>:i}
                    </div>
                    {i<3&&<div className="w-8 h-px" style={{background:i<step?"rgba(155,93,229,0.5)":th.sep}}/>}
                  </div>
                ))}
              </div>
              <span className="text-xs font-semibold tracking-widest uppercase" style={{color:th.fg3}}>Étape {step} / 3</span>
            </div>

            <div className="relative mb-6">
              <div className="absolute -top-2 -left-1 text-7xl font-black leading-none pointer-events-none select-none" style={{color:th.isDark?"rgba(155,93,229,0.04)":"rgba(155,93,229,0.06)",fontFamily:"'Funnel Display',sans-serif"}}>0{step}</div>
              <h1 className="relative text-2xl font-black leading-tight mb-2" style={{fontFamily:"'Funnel Display',sans-serif"}}>
                <GT from={th.isDark?"#FFFFFF":"#2D0F6F"} to={th.isDark?"#DDAEEA":"#9B5DE5"}>
                  {step===1&&"L'IA configure ton académie personnalisée"}{step===2&&"Comment apprends-tu le mieux ?"}{step===3&&"Choisis ton style de Tuteur IA"}
                </GT>
              </h1>
              <p className="text-sm" style={{color:th.fg3}}>
                {step===1&&"Quelques infos pour adapter chaque leçon à ton profil exact."}{step===2&&"L'IA sélectionnera les formats adaptés à ta façon de mémoriser."}{step===3&&"Le ton de ton assistant s'adapte à ta personnalité."}
              </p>
            </div>

            {step===1&&(
              <div className="space-y-4 fade-up">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{color:th.fg3}}>Prénom</label><input value={p.name} onChange={e=>setP(x=>({...x,name:e.target.value}))} placeholder="Alex" className="w-full rounded-xl px-4 py-3 text-sm g-input"/></div>
                  <div><label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{color:th.fg3}}>Âge</label><input value={p.age} type="number" onChange={e=>setP(x=>({...x,age:e.target.value}))} placeholder="28" className="w-full rounded-xl px-4 py-3 text-sm g-input"/></div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{color:th.fg3}}>Profession / Poste</label>
                  <input value={p.profession} onChange={e=>setP(x=>({...x,profession:e.target.value}))} placeholder="Chef de projet digital, Développeur full-stack…" className="w-full rounded-xl px-4 py-3 text-sm g-input"/>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{color:th.fg3}}>Objectif professionnel</label>
                  <textarea
                    value={p.goal}
                    onChange={e=>{ setP(x=>({...x,goal:e.target.value})); setAiState("idle"); setAiProposal(""); }}
                    placeholder="Décrivez votre situation et pourquoi vous souhaitez utiliser l'IA, comment vous voulez l'utiliser, et ce que vous attendez comme résultat concret…"
                    rows={4} className="w-full rounded-xl px-4 py-3 text-sm g-input resize-none"/>
                  <div className="mt-2">
                    <button onClick={formulateWithAI} disabled={!p.goal.trim()||aiState==="loading"}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all hover:opacity-80 disabled:opacity-40"
                      style={{background:"rgba(155,93,229,0.1)",border:"1px solid rgba(155,93,229,0.25)",color:"#9B5DE5"}}>
                      {aiState==="loading"
                        ? <><RefreshCw className="w-3.5 h-3.5 animate-spin"/>L'IA formule…</>
                        : <><Wand2 className="w-3.5 h-3.5"/>Formuler mon objectif avec l'IA</>}
                    </button>
                  </div>
                  {aiState==="proposal"&&(
                    <div className="mt-3 rounded-xl p-4" style={{background:"rgba(155,93,229,0.07)",border:"1px solid rgba(155,93,229,0.2)"}}>
                      <div className="flex items-center gap-2 mb-2 text-xs font-bold" style={{color:"#9B5DE5"}}><Sparkles className="w-3.5 h-3.5"/>Proposition de l'IA — tu peux modifier ci-dessous</div>
                      <textarea value={aiProposal} onChange={e=>setAiProposal(e.target.value)} rows={4} className="w-full rounded-xl px-3 py-2.5 text-sm g-input resize-none mb-3"/>
                      <div className="flex items-center gap-2">
                        <VBtn onClick={acceptProposal} sm><span className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5"/>Valider cet objectif</span></VBtn>
                        <button onClick={discardProposal} className="text-xs px-3 py-2 rounded-lg transition-colors hover:opacity-70" style={{color:th.fg3}}>Annuler</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {step===2&&(
              <div className="grid grid-cols-2 gap-3 fade-up">
                {LEARN_STYLES.map(({id,Icon,label,desc})=>{
                  const sel=p.style===id;
                  return (
                    <button key={id} onClick={()=>setP(x=>({...x,style:id}))} className="rounded-2xl text-left transition-all duration-200 hover:scale-[1.02]"
                      style={{background:sel?"rgba(155,93,229,0.1)":"transparent",border:sel?`1px solid rgba(155,93,229,0.4)`:`1px solid ${th.sep}`,boxShadow:sel?"0 0 24px rgba(155,93,229,0.15)":"none"}}>
                      <div className="p-5 h-full rounded-2xl">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{background:sel?"rgba(155,93,229,0.15)":"rgba(155,93,229,0.05)"}}>
                          <Icon className="w-5 h-5" style={{color:sel?"#9B5DE5":th.fg3}}/>
                        </div>
                        <div className="text-sm font-bold mb-1" style={{color:sel?"#9B5DE5":th.fg}}>{label}</div>
                        <div className="text-xs leading-relaxed" style={{color:th.fg3}}>{desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {step===3&&(
              <div className="space-y-3 fade-up">
                {TUTOR_STYLES.map(({id,emoji,label,desc})=>{
                  const sel=p.tutor===id;
                  return (
                    <button key={id} onClick={()=>setP(x=>({...x,tutor:id}))} className="w-full rounded-2xl text-left transition-all hover:scale-[1.01]"
                      style={{background:sel?"rgba(155,93,229,0.08)":"transparent",border:`1px solid ${sel?"rgba(155,93,229,0.35)":th.sep}`,boxShadow:sel?"0 0 20px rgba(155,93,229,0.12)":"none"}}>
                      <div className="px-5 py-4 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0" style={{background:sel?"rgba(155,93,229,0.1)":"rgba(155,93,229,0.04)"}}>{emoji}</div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold mb-0.5" style={{color:sel?"#9B5DE5":th.fg}}>{label}</div>
                          <div className="text-xs" style={{color:th.fg3}}>{desc}</div>
                        </div>
                        {sel&&<CheckCircle className="w-4 h-4 shrink-0" style={{color:"#9B5DE5"}}/>}
                      </div>
                    </button>
                  );
                })}
                <div className="pt-4">
                  <ShimBtn onClick={()=>onDone(p)} full>
                    <span className="flex items-center justify-center gap-2.5"><Sparkles className="w-5 h-5"/>Générer mon parcours IA<ArrowRight className="w-5 h-5"/></span>
                  </ShimBtn>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mt-8 pt-5" style={{borderTop:`1px solid ${th.sep}`}}>
              <button onClick={()=>setStep(s=>Math.max(1,s-1))} className={cx("flex items-center gap-1.5 text-sm transition-colors",step===1?"invisible":"hover:opacity-70")} style={{color:th.fg3}}><ChevronLeft className="w-4 h-4"/>Retour</button>
              {step<3&&<VBtn onClick={()=>canNext()&&setStep(s=>s+1)} sm>Continuer <ChevronRight className="inline w-4 h-4 ml-1"/></VBtn>}
            </div>
          </div>
        </GCard>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// DASHBOARD TAB — stats & achievements only
// ═══════════════════════════════════════════════════════════════════════════
function DashboardTab({goLesson}:{goLesson:()=>void}) {
  const th=useTh();
  const KPIS=[
    {Icon:Clock,  val:"4h 32",unit:"",  sub:"Apprentissage / sem.",  accent:"#60A5FA",glow:"rgba(96,165,250,0.15)"},
    {Icon:Target, val:"67",   unit:"%", sub:"Complétion parcours",   accent:"#4ADE80",glow:"rgba(74,222,128,0.15)"},
    {Icon:Brain,  val:"82",   unit:"/100",sub:"Indice de maîtrise",  accent:"#9B5DE5",glow:"rgba(155,93,229,0.15)"},
    {Icon:Trophy, val:"67",   unit:"%", sub:"Avancée certification", accent:"#F59E0B",glow:"rgba(245,158,11,0.15)"},
  ];
  return (
    <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
      <div>
        <h2 className="text-2xl font-black mb-0.5" style={{fontFamily:"'Funnel Display',sans-serif"}}><GT>Mon tableau de bord</GT></h2>
        <p className="text-sm" style={{color:th.fg3}}>Tes statistiques et ta progression en temps réel</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {KPIS.map(({Icon,val,unit,sub,accent,glow})=>(
          <GCard key={sub}><div className="p-5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{background:glow,border:`1px solid ${accent}25`}}><Icon className="w-5 h-5" style={{color:accent}}/></div>
            <div className="flex items-baseline gap-1 mb-0.5"><span className="text-2xl font-black" style={{fontFamily:"'Funnel Display',sans-serif",color:th.fg}}>{val}</span><span className="text-sm font-semibold" style={{color:accent}}>{unit}</span></div>
            <div className="text-xs" style={{color:th.fg3}}>{sub}</div>
          </div></GCard>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 space-y-5">
          <GCard glow><div className="p-6">
            <div className="flex items-start gap-6">
              <div className="relative shrink-0">
                <CircleProgress pct={67} size={92}/>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className="text-xl font-black" style={{fontFamily:"'Funnel Display',sans-serif",color:th.fg}}>67%</span>
                  <span className="text-[9px] uppercase tracking-wider" style={{color:th.fg3}}>certif.</span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1"><Trophy className="w-4 h-4 text-amber-400"/><span className="text-sm font-black" style={{color:th.fg}}>Certification IA Pro</span><span className="text-[10px] px-2 py-0.5 rounded-full font-bold ml-auto" style={{background:"rgba(245,158,11,0.12)",color:"#F59E0B",border:"1px solid rgba(245,158,11,0.25)"}}>15 mars 2026</span></div>
                <p className="text-xs mb-4" style={{color:th.fg3}}>Continue à ce rythme — tu seras prêt·e 3 semaines avant la soutenance.</p>
                <div className="space-y-2.5">
                  {CERT_CHAPTERS.map(({title,pct,done,active})=>(
                    <div key={title} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{background:done?"rgba(74,222,128,0.15)":active?"rgba(155,93,229,0.12)":"rgba(155,93,229,0.04)",border:`1px solid ${done?"rgba(74,222,128,0.4)":active?"rgba(155,93,229,0.3)":th.sep}`}}>
                        {done?<CheckCircle className="w-3 h-3 text-green-400"/>:active?<div className="w-1.5 h-1.5 rounded-full bg-violet-400"/>:<Lock className="w-2.5 h-2.5" style={{color:th.fg3}}/>}
                      </div>
                      <span className="text-xs flex-1 truncate" style={{color:done?"rgba(74,222,128,0.8)":active?th.navAC:th.fg3}}>{title}</span>
                      {done&&<span className="text-[10px] font-bold text-green-400 shrink-0">100%</span>}
                      {active&&(
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="w-16 h-1 rounded-full overflow-hidden" style={{background:th.isDark?"rgba(255,255,255,0.06)":"rgba(155,93,229,0.1)"}}>
                            <div className="h-full rounded-full" style={{width:`${pct}%`,background:"linear-gradient(90deg,#9B5DE5,#DDAEEA)"}}/>
                          </div>
                          <span className="text-[10px] font-bold" style={{color:th.navAC}}>{pct}%</span>
                        </div>
                      )}
                      {!done&&!active&&<span className="text-[10px] shrink-0" style={{color:th.fg3}}>Verrouillé</span>}
                    </div>
                  ))}
                </div>
                <div className="mt-5 pt-4" style={{borderTop:`1px solid ${th.sep}`}}>
                  <ShimBtn onClick={goLesson} sm><span className="flex items-center gap-2"><Award className="w-4 h-4"/>S'entraîner pour la soutenance</span></ShimBtn>
                </div>
              </div>
            </div>
          </div></GCard>

          <GCard><div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div><h3 className="text-sm font-black mb-0.5" style={{color:th.fg}}>Courbe de mémoire & révisions IA</h3><p className="text-xs" style={{color:th.fg3}}>L'IA planifie tes répétitions pour ne rien oublier</p></div>
              <div className="flex gap-4 text-xs" style={{color:th.fg3}}>
                <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-0.5 rounded" style={{background:"#9B5DE5"}}/>Avec IA</span>
                <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-0.5 rounded bg-orange-400/60"/>Sans révision</span>
              </div>
            </div>
            <div style={{height:160}}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={MEMORY_DATA} margin={{top:8,right:8,left:-20,bottom:0}}>
                  <CartesianGrid strokeDasharray="3 3" stroke={th.sep} vertical={false}/>
                  <XAxis dataKey="t" tick={{fill:th.fg3,fontSize:10}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fill:th.fg3,fontSize:10}} axisLine={false} tickLine={false} domain={[0,100]} tickFormatter={v=>`${v}%`}/>
                  <Tooltip content={<MemTip/>}/>
                  <Area type="monotone" dataKey="decay" stroke="#FB923C" strokeWidth={1.5} strokeDasharray="4 3" fill="rgba(251,146,60,0.08)" dot={false}/>
                  <Area type="monotone" dataKey="ai" stroke="#9B5DE5" strokeWidth={2.5} fill="rgba(155,93,229,0.12)" dot={{fill:"#9B5DE5",r:3,strokeWidth:0}}/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div></GCard>
        </div>

        <div className="space-y-4">
          <GCard><div className="p-5">
            <div className="flex items-center gap-2 mb-4"><Brain className="w-4 h-4" style={{color:th.navAC}}/><span className="text-sm font-bold" style={{color:th.fg}}>Profil de compétences</span></div>
            <div className="space-y-3">
              {SKILLS.map(({label,pct,strong})=>(
                <div key={label}>
                  <div className="flex justify-between items-center mb-1"><span className="text-xs" style={{color:th.fg2}}>{label}</span><span className="text-xs font-black" style={{color:strong?"#4ADE80":"#F59E0B"}}>{pct}%</span></div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{background:th.isDark?"rgba(255,255,255,0.05)":"rgba(155,93,229,0.08)"}}>
                    <div className="h-full rounded-full" style={{width:`${pct}%`,background:strong?"linear-gradient(90deg,#16A34A,#4ADE80)":"linear-gradient(90deg,#B45309,#F59E0B)"}}/>
                  </div>
                </div>
              ))}
            </div>
          </div></GCard>

          <GCard><div className="p-5">
            <div className="flex items-center gap-2 mb-4"><Award className="w-4 h-4" style={{color:th.navAC}}/><span className="text-sm font-bold" style={{color:th.fg}}>Badges obtenus</span></div>
            <div className="space-y-2">
              {BADGES.filter(b=>b.done).map(({emoji,label})=>(
                <div key={label} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl" style={{background:"rgba(155,93,229,0.06)",border:`1px solid rgba(155,93,229,0.15)`}}>
                  <span className="text-lg">{emoji}</span><span className="text-xs font-medium" style={{color:th.fg2}}>{label}</span>
                </div>
              ))}
              <p className="text-xs mt-2" style={{color:th.fg3}}>3 badges restants à débloquer</p>
            </div>
          </div></GCard>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// LESSONS TAB
// ═══════════════════════════════════════════════════════════════════════════
function LessonsTab({goLesson}:{goLesson:()=>void}) {
  const th=useTh();
  const [openMod,setOpenMod]=useState(2);
  return (
    <div className="flex-1 overflow-y-auto px-8 py-6">
      <div className="mb-6 flex items-start justify-between">
        <div><h2 className="text-2xl font-black" style={{fontFamily:"'Funnel Display',sans-serif"}}><GT>Mes leçons</GT></h2><p className="text-sm mt-0.5" style={{color:th.fg3}}>5 modules · 29 leçons · Certification IA Pro</p></div>
      </div>

      <GCard className="mb-6"><div className="p-5 flex items-center gap-8">
        {[{val:"13",sub:"Leçons terminées"},{val:"87%",sub:"Taux de réussite"},{val:"4h32",sub:"Temps de pratique"}].map(({val,sub})=>(
          <div key={sub} className="text-center">
            <div className="text-xl font-black mb-0.5" style={{fontFamily:"'Funnel Display',sans-serif"}}><GT>{val}</GT></div>
            <div className="text-xs" style={{color:th.fg3}}>{sub}</div>
          </div>
        ))}
        <div className="flex-1 ml-4">
          <div className="flex justify-between text-xs mb-1.5" style={{color:th.fg3}}><span>Progression globale</span><span>67%</span></div>
          <div className="h-2 rounded-full overflow-hidden" style={{background:th.isDark?"rgba(255,255,255,0.06)":"rgba(155,93,229,0.1)"}}>
            <div className="h-full rounded-full" style={{width:"67%",background:"linear-gradient(90deg,#7C3AED,#DDAEEA)"}}/>
          </div>
        </div>
      </div></GCard>

      <div className="space-y-3">
        {MODULES.map(mod=>{
          const open=openMod===mod.id;
          const pct=mod.total>0?Math.round((mod.done/mod.total)*100):0;
          const SC={complete:{bg:"rgba(74,222,128,0.1)",text:"#4ADE80",border:"rgba(74,222,128,0.25)",label:"Validé ✓"},active:{bg:"rgba(155,93,229,0.1)",text:"#9B5DE5",border:"rgba(155,93,229,0.3)",label:"En cours"},locked:{bg:"transparent",text:th.fg3,border:th.sep,label:"Verrouillé"}};
          const sc=SC[mod.status as keyof typeof SC];
          return (
            <GCard key={mod.id}>
              <button className="w-full text-left" onClick={()=>setOpenMod(open?0:mod.id)}>
                <div className="px-5 py-4 flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0" style={{background:sc.bg,border:`1px solid ${sc.border}`}}>
                    {mod.status==="locked"?<Lock className="w-4 h-4" style={{color:th.fg3}}/>:mod.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold" style={{color:mod.status==="locked"?th.fg3:th.fg}}>{mod.title}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0" style={{background:sc.bg,color:sc.text,border:`1px solid ${sc.border}`}}>{sc.label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs" style={{color:th.fg3}}>{mod.done}/{mod.total} leçons</span>
                      {mod.status!=="locked"&&(
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1 rounded-full overflow-hidden" style={{background:th.isDark?"rgba(255,255,255,0.06)":"rgba(155,93,229,0.1)"}}>
                            <div className="h-full rounded-full" style={{width:`${pct}%`,background:mod.status==="complete"?"linear-gradient(90deg,#16A34A,#4ADE80)":"linear-gradient(90deg,#9B5DE5,#DDAEEA)"}}/>
                          </div>
                          <span className="text-[10px] font-bold" style={{color:sc.text}}>{pct}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <ChevronDown className="w-4 h-4 shrink-0 transition-transform" style={{color:th.fg3,transform:open?"rotate(180deg)":"none"}}/>
                </div>
              </button>
              {open&&mod.id===2&&(
                <div style={{borderTop:`1px solid ${th.sep}`}}>
                  {M2_LESSONS.map((lesson,i)=>(
                    <div key={lesson.id} className={cx("flex items-center gap-4 px-5 py-3 transition-colors",lesson.current&&"cursor-pointer hover:opacity-80")}
                      onClick={()=>lesson.current&&goLesson()}
                      style={i<M2_LESSONS.length-1?{borderBottom:`1px solid ${th.sep}`}:{}}>
                      <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{background:lesson.done?"rgba(74,222,128,0.12)":lesson.current?"rgba(155,93,229,0.12)":"transparent",border:`1px solid ${lesson.done?"rgba(74,222,128,0.3)":lesson.current?"rgba(155,93,229,0.35)":th.sep}`}}>
                        {lesson.done?<CheckCircle className="w-3.5 h-3.5 text-green-400"/>:lesson.current?<Play className="w-3 h-3 ml-0.5" style={{color:th.navAC}}/>:<span className="text-[10px] font-mono" style={{color:th.fg3}}>{lesson.id}</span>}
                      </div>
                      <span className="flex-1 text-sm truncate" style={{color:lesson.done?"rgba(74,222,128,0.7)":lesson.current?th.navAC:th.fg3}}>{lesson.title}</span>
                      {lesson.current&&<span className="text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0" style={{background:"rgba(155,93,229,0.1)",color:th.navAC,border:"1px solid rgba(155,93,229,0.25)"}}>En cours</span>}
                      <span className="text-xs font-mono shrink-0" style={{color:th.fg3}}>{lesson.dur}</span>
                    </div>
                  ))}
                  <div className="px-5 py-3" style={{borderTop:`1px solid ${th.sep}`}}>
                    <VBtn onClick={goLesson} sm><span className="flex items-center gap-2"><Play className="w-3.5 h-3.5"/>Reprendre le module</span></VBtn>
                  </div>
                </div>
              )}
              {open&&mod.status==="complete"&&(
                <div className="px-5 py-4 text-sm text-center text-green-400/70" style={{borderTop:`1px solid ${th.sep}`}}><CheckCircle className="w-5 h-5 mx-auto mb-1.5 text-green-400"/>Toutes les leçons validées · Score : 94%</div>
              )}
            </GCard>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PRACTICE TAB — 4 exercise blocks 2×2
// ═══════════════════════════════════════════════════════════════════════════
function PracticeTab({profile}:{profile:Profile}) {
  const th=useTh();
  const BLOCKS=[
    {emoji:"📚",title:"Exercices basiques",desc:"QCM sur les fondamentaux de l'IA générative. 3 niveaux de difficulté disponibles.",tag:"15 exercices",available:true,color:"#60A5FA",glow:"rgba(96,165,250,0.12)"},
    {emoji:"✨",title:"Exercices pour vous",desc:`Exercices personnalisés selon ton profil${profile.profession?" de "+profile.profession:""}. QCM + exercices de prompts adaptés à tes objectifs.`,tag:"IA · Personnalisé",available:false,color:"#9B5DE5",glow:"rgba(155,93,229,0.12)"},
    {emoji:"🎨",title:"Génération images & vidéos",desc:"Maîtrise Midjourney, DALL-E 3, Sora et les outils de création visuelle IA. Prompts images avancés.",tag:"Bientôt disponible",available:false,color:"#F59E0B",glow:"rgba(245,158,11,0.12)"},
    {emoji:"⚡",title:"Exercices prompts",desc:"Entraînement exclusif à la rédaction de prompts professionnels. Aucun QCM — pratique pure.",tag:"20 exercices",available:true,color:"#4ADE80",glow:"rgba(74,222,128,0.12)"},
  ];

  return (
    <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-black" style={{fontFamily:"'Funnel Display',sans-serif"}}><GT>Pratique IA</GT></h2><p className="text-sm mt-0.5" style={{color:th.fg3}}>Entraîne-toi et construis tes compétences en pratiquant</p></div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold" style={{background:"rgba(251,146,60,0.1)",border:"1px solid rgba(251,146,60,0.25)",color:"#FB923C"}}><Flame className="w-3.5 h-3.5"/>7 jours de suite !</div>
      </div>

      {/* Daily challenge */}
      <div className="rounded-2xl p-5 flex items-center gap-5 relative overflow-hidden"
        style={{background:th.isDark?"linear-gradient(135deg,rgba(155,93,229,0.18),rgba(221,174,234,0.08))":"linear-gradient(135deg,rgba(155,93,229,0.1),rgba(221,174,234,0.04))",border:"1px solid rgba(155,93,229,0.25)"}}>
        <div className="text-3xl shrink-0">⚡</div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-black uppercase tracking-widest mb-1" style={{color:th.navAC}}>Défi du jour</div>
          <h3 className="text-sm font-black mb-0.5" style={{color:th.fg}}>Crée un prompt pour rédiger une fiche de poste IA-ready</h3>
          <p className="text-xs" style={{color:th.fg3}}>Objectif : offre complète avec missions, profil et avantages — adaptée à ton secteur</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs flex items-center gap-1" style={{color:th.fg3}}><Clock className="w-3 h-3"/>15 min · 120 XP</span>
          <VBtn sm><span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5"/>Relever le défi</span></VBtn>
        </div>
      </div>

      {/* 2×2 grid */}
      <div>
        <h3 className="text-sm font-bold mb-4" style={{color:th.fg}}>Choisir un type d'exercice</h3>
        <div className="grid grid-cols-2 gap-4">
          {BLOCKS.map(({emoji,title,desc,tag,available,color,glow})=>(
            <GCard key={title} className={available?"hover:scale-[1.01] transition-transform":""} onClick={available?()=>{}:undefined}>
              <div className="p-6 flex flex-col" style={{minHeight:200}}>
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl" style={{background:glow,border:`1px solid ${color}22`}}>{emoji}</div>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{background:`${color}14`,color,border:`1px solid ${color}30`}}>{tag}</span>
                </div>
                <h4 className="text-sm font-black mb-2" style={{color:th.fg}}>{title}</h4>
                <p className="text-xs leading-relaxed flex-1" style={{color:th.fg3}}>{desc}</p>
                <div className="mt-5">
                  {available
                    ? <VBtn sm><span className="flex items-center gap-1.5"><ArrowRight className="w-3.5 h-3.5"/>Commencer</span></VBtn>
                    : <span className="inline-block text-xs px-3 py-1.5 rounded-lg" style={{background:th.isDark?"rgba(255,255,255,0.04)":"rgba(155,93,229,0.05)",color:th.fg3,border:`1px solid ${th.sep}`}}>Bientôt disponible</span>
                  }
                </div>
              </div>
            </GCard>
          ))}
        </div>
      </div>

      {/* Prompt library */}
      <GCard><div className="p-5">
        <div className="flex items-center justify-between mb-4"><span className="text-sm font-black" style={{color:th.fg}}>Bibliothèque de prompts</span><button className="text-xs flex items-center gap-1" style={{color:th.navAC}}>Voir tout <ArrowRight className="w-3 h-3"/></button></div>
        <div className="grid grid-cols-4 gap-2">
          {PROMPT_CATS.map(({emoji,label,count})=>(
            <button key={label} className="flex flex-col items-center gap-1.5 p-3 rounded-xl text-xs text-center transition-colors hover:opacity-80" style={{background:th.isDark?"rgba(255,255,255,0.03)":"rgba(155,93,229,0.04)",border:`1px solid ${th.sep}`}}>
              <span className="text-xl">{emoji}</span><span className="font-medium" style={{color:th.fg2}}>{label}</span><span style={{color:th.fg3}}>{count} prompts</span>
            </button>
          ))}
        </div>
      </div></GCard>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// CALENDAR TAB — days only, no times
// ═══════════════════════════════════════════════════════════════════════════
function CalendarTab() {
  const th=useTh();
  const DAYS=["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"];
  const DATES=[10,11,12,13,14,15,16];
  const TODAY=1;
  const TC:{[k:string]:{bg:string,text:string}}={
    review:  {bg:"rgba(96,165,250,0.12)",  text:"#60A5FA"},
    expert:  {bg:"rgba(155,93,229,0.12)",  text:"#9B5DE5"},
    quiz:    {bg:"rgba(245,158,11,0.12)",  text:"#F59E0B"},
    practice:{bg:"rgba(74,222,128,0.12)",  text:"#4ADE80"},
  };

  return (
    <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-black" style={{fontFamily:"'Funnel Display',sans-serif"}}><GT>Planning</GT></h2><p className="text-sm mt-0.5" style={{color:th.fg3}}>Semaine du 10 — 16 août 2026</p></div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-2 rounded-xl text-sm" style={{background:th.inputBg,border:`1px solid ${th.inputB}`,color:th.fg2}}><ChevronLeft className="w-4 h-4"/></button>
          <button className="px-4 py-2 rounded-xl text-sm" style={{background:th.inputBg,border:`1px solid ${th.inputB}`,color:th.fg2}}>Aujourd'hui</button>
          <button className="px-3 py-2 rounded-xl text-sm" style={{background:th.inputBg,border:`1px solid ${th.inputB}`,color:th.fg2}}><ChevronRight className="w-4 h-4"/></button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 space-y-4">
          <GCard>
            <div className="grid grid-cols-7" style={{borderBottom:`1px solid ${th.sep}`}}>
              {DAYS.map((d,i)=>(
                <div key={d} className="px-2 py-3 text-center">
                  <div className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{color:th.fg3}}>{d}</div>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black mx-auto"
                    style={i===TODAY?{background:"linear-gradient(135deg,#9B5DE5,#DDAEEA)",color:"#08060F",boxShadow:"0 0 20px rgba(155,93,229,0.4)"}:{color:th.fg2}}>{DATES[i]}</div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2 p-3" style={{minHeight:140}}>
              {DAYS.map((_,di)=>(
                <div key={di} className="space-y-1.5">
                  {CAL_EVENTS.filter(e=>e.col===di).map(ev=>{
                    const tc=TC[ev.type];
                    return (
                      <div key={ev.label} className="rounded-lg px-2 py-2 cursor-pointer hover:opacity-80 transition-opacity" style={{background:tc.bg,border:`1px solid ${tc.text}25`}}>
                        <div className="text-[10px] font-bold leading-tight" style={{color:tc.text}}>{ev.label}</div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </GCard>

          <GCard><div className="p-5 flex items-center gap-5">
            <div className="text-center shrink-0">
              <div className="text-4xl font-black" style={{fontFamily:"'Funnel Display',sans-serif",background:"linear-gradient(135deg,#F59E0B,#DDAEEA)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text"}}>33</div>
              <div className="text-xs" style={{color:th.fg3}}>jours restants</div>
            </div>
            <div style={{width:1,height:48,background:th.sep}}/>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1"><Trophy className="w-4 h-4 text-amber-400"/><span className="text-sm font-black" style={{color:th.fg}}>Soutenance de certification</span></div>
              <p className="text-xs mb-3" style={{color:th.fg3}}>15 mars 2026 · En ligne · Jury de 2 experts</p>
              <ShimBtn sm><span className="flex items-center gap-2"><Award className="w-4 h-4"/>S'entraîner pour la soutenance</span></ShimBtn>
            </div>
          </div></GCard>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl p-5" style={{background:th.isDark?"linear-gradient(135deg,rgba(155,93,229,0.18),rgba(221,174,234,0.08))":"linear-gradient(135deg,rgba(155,93,229,0.1),rgba(221,174,234,0.04))",border:"1px solid rgba(155,93,229,0.28)"}}>
            <Video className="w-5 h-5 mb-3" style={{color:th.navAC}}/>
            <div className="text-[10px] font-black uppercase tracking-widest mb-1" style={{color:th.navAC}}>Session Expert IA</div>
            <h4 className="text-sm font-black mb-2" style={{color:th.fg}}>Planifie un échange 1:1 avec un expert certifié</h4>
            <p className="text-xs leading-relaxed mb-3" style={{color:th.fg3}}>Pose tes questions, débloques tes situations et prépare ta certification.</p>
            <div className="flex items-center gap-2 text-xs mb-4" style={{color:th.fg3}}><CheckCircle className="w-3.5 h-3.5 shrink-0" style={{color:th.navAC}}/>1 appel par semaine inclus</div>
            <ShimBtn full sm><span className="flex items-center justify-center gap-2"><Calendar className="w-4 h-4"/>Réserver ma session</span></ShimBtn>
          </div>

          <GCard><div className="p-5">
            <div className="text-[10px] font-black uppercase tracking-widest mb-3" style={{color:th.fg3}}>Cette semaine</div>
            {[
              {emoji:"📋",label:"Révision Leçon 1",    type:"review"},
              {emoji:"🎥",label:"Session Expert IA",    type:"expert"},
              {emoji:"🧠",label:"Quiz Module 2",        type:"quiz"},
              {emoji:"💻",label:"Pratique Sandbox",     type:"practice"},
              {emoji:"🔁",label:"Révision espacée J+14",type:"review"},
            ].map(({emoji,label,type})=>{
              const tc=TC[type];
              return (
                <div key={label} className="flex items-center gap-3 py-2.5" style={{borderBottom:`1px solid ${th.sep}`}}>
                  <span className="text-base shrink-0">{emoji}</span>
                  <div className="text-xs font-medium" style={{color:tc.text}}>{label}</div>
                </div>
              );
            })}
          </div></GCard>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// BENEFITS TAB
// ═══════════════════════════════════════════════════════════════════════════
function BenefitsTab() {
  const th=useTh();
  return (
    <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
      <div><h2 className="text-2xl font-black" style={{fontFamily:"'Funnel Display',sans-serif"}}><GT>Mes avantages</GT></h2><p className="text-sm mt-0.5" style={{color:th.fg3}}>Inclus dans ta formation — ressources exclusives pour aller plus loin</p></div>

      <div className="grid grid-cols-3 gap-5">
        <GCard glow>
          <div className="p-6 flex flex-col">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-5" style={{background:"rgba(155,93,229,0.12)",border:"1px solid rgba(155,93,229,0.25)"}}>🎓</div>
            <h3 className="text-base font-black mb-2" style={{color:th.fg}}>Session Expert IA</h3>
            <p className="text-sm leading-relaxed mb-4" style={{color:th.fg2}}>Échange 1:1 en visio avec un expert IA certifié. Pose tes questions et prépare ta certification.</p>
            <div className="space-y-2 mb-5 flex-1">
              {["1 appel par semaine inclus","Formateur certifié IA","Replay disponible 30 jours","Feedback personnalisé"].map(f=>(
                <div key={f} className="flex items-center gap-2 text-xs" style={{color:th.fg2}}><CheckCircle className="w-3.5 h-3.5 shrink-0" style={{color:th.navAC}}/>{f}</div>
              ))}
            </div>
            <ShimBtn full sm><span className="flex items-center justify-center gap-2"><Calendar className="w-4 h-4"/>Planifier un échange</span></ShimBtn>
            <p className="text-[10px] text-center mt-2" style={{color:th.fg3}}>Prochaine dispo : mer. 14h00</p>
          </div>
        </GCard>

        <GCard>
          <div className="p-6 flex flex-col">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-5" style={{background:"rgba(96,165,250,0.1)",border:"1px solid rgba(96,165,250,0.2)"}}>🤖</div>
            <h3 className="text-base font-black mb-2" style={{color:th.fg}}>Meilleurs IA du marché</h3>
            <p className="text-sm leading-relaxed mb-4" style={{color:th.fg2}}>Accès gratuit aux modèles IA premium les plus puissants — inclus sans frais supplémentaires.</p>
            <div className="space-y-2 mb-5 flex-1">
              {AI_TOOLS.map(({name,sub,color,letter})=>(
                <div key={name} className="flex items-center gap-3 px-3 py-2 rounded-xl" style={{background:th.isDark?"rgba(255,255,255,0.03)":"rgba(155,93,229,0.04)",border:`1px solid ${th.sep}`}}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0" style={{background:`${color}18`,color,border:`1px solid ${color}30`}}>{letter}</div>
                  <div className="flex-1 min-w-0"><div className="text-xs font-bold" style={{color:th.fg}}>{name}</div><div className="text-[10px]" style={{color:th.fg3}}>{sub}</div></div>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{color:"#4ADE80",background:"rgba(74,222,128,0.1)"}}>Gratuit</span>
                </div>
              ))}
            </div>
            <ShimBtn full sm><span className="flex items-center justify-center gap-2"><ExternalLink className="w-4 h-4"/>Accéder aux outils</span></ShimBtn>
          </div>
        </GCard>

        <GCard>
          <div className="p-6 flex flex-col">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-5" style={{background:"rgba(245,158,11,0.1)",border:"1px solid rgba(245,158,11,0.2)"}}>📚</div>
            <h3 className="text-base font-black mb-2" style={{color:th.fg}}>Bibliothèque de Prompts</h3>
            <p className="text-sm leading-relaxed mb-4" style={{color:th.fg2}}>200+ prompts professionnels testés, organisés par métier et par cas d'usage.</p>
            <div className="grid grid-cols-2 gap-1.5 mb-5 flex-1">
              {PROMPT_CATS.map(({emoji,label,count})=>(
                <button key={label} className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-left hover:opacity-80 transition-opacity" style={{background:th.isDark?"rgba(255,255,255,0.03)":"rgba(155,93,229,0.04)",border:`1px solid ${th.sep}`}}>
                  <span className="text-sm">{emoji}</span>
                  <div className="min-w-0"><div className="text-[10px] font-medium truncate" style={{color:th.fg2}}>{label}</div><div className="text-[9px]" style={{color:th.fg3}}>{count}</div></div>
                </button>
              ))}
            </div>
            <ShimBtn full sm><span className="flex items-center justify-center gap-2"><Layers className="w-4 h-4"/>Explorer la bibliothèque</span></ShimBtn>
          </div>
        </GCard>
      </div>

      <div>
        <h3 className="text-xs font-black uppercase tracking-widest mb-4" style={{color:th.fg3}}>Autres avantages inclus</h3>
        <div className="grid grid-cols-4 gap-4">
          {[{emoji:"🏆",title:"Certification reconnue",desc:"Diplôme IA Pro reconnu par 150+ entreprises"},{emoji:"💼",title:"Réseau Alumni",desc:"Communauté privée de 2 400 diplômés"},{emoji:"📈",title:"Mises à jour gratuites",desc:"Nouveaux modules IA intégrés sans surcoût"},{emoji:"🎯",title:"Coaching carrière",desc:"1 session RH pour ton positionnement IA"}].map(({emoji,title,desc})=>(
            <GCard key={title}><div className="p-4"><span className="text-2xl block mb-2">{emoji}</span><div className="text-sm font-bold mb-1" style={{color:th.fg}}>{title}</div><div className="text-xs leading-relaxed" style={{color:th.fg3}}>{desc}</div></div></GCard>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PROFILE TAB
// ═══════════════════════════════════════════════════════════════════════════
function ProfileTab({profile,onToggleTheme}:{profile:Profile;onToggleTheme:()=>void}) {
  const th=useTh();
  const name=profile.name||"Alex Dubois";
  const [tab,setTab]=useState<"overview"|"badges"|"settings">("overview");

  return (
    <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5">
      <GCard glow>
        <div className="p-6 flex items-center gap-6">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-black shrink-0" style={{background:"linear-gradient(135deg,#7C3AED,#DDAEEA)",color:"#08060F"}}>{name[0]}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-xl font-black" style={{fontFamily:"'Funnel Display',sans-serif",color:th.fg}}>{name}</h2>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{background:"rgba(155,93,229,0.1)",color:th.navAC,border:"1px solid rgba(155,93,229,0.25)"}}>Apprenant IA Pro</span>
            </div>
            <p className="text-sm mb-3" style={{color:th.fg3}}>{profile.profession||"Chef de projet digital"} · En formation depuis août 2026</p>
            <div className="flex items-center gap-6">
              {[{val:"13",sub:"Leçons"},{val:"47",sub:"Prompts"},{val:"4h32",sub:"Pratique"},{val:"67%",sub:"Certif."}].map(({val,sub})=>(
                <div key={sub} className="text-center"><div className="text-lg font-black" style={{fontFamily:"'Funnel Display',sans-serif",color:th.navAC}}>{val}</div><div className="text-[10px]" style={{color:th.fg3}}>{sub}</div></div>
              ))}
            </div>
          </div>
          <div className="relative shrink-0">
            <CircleProgress pct={67} size={80}/>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <span className="text-base font-black" style={{color:th.fg}}>67%</span>
              <span className="text-[8px]" style={{color:th.fg3}}>certif.</span>
            </div>
          </div>
        </div>
      </GCard>

      <div className="flex gap-1 p-1 rounded-xl w-fit" style={{background:th.isDark?"rgba(255,255,255,0.04)":"rgba(155,93,229,0.06)",border:`1px solid ${th.sep}`}}>
        {(["overview","badges","settings"] as const).map(t=>(
          <button key={t} onClick={()=>setTab(t)} className="px-5 py-2 rounded-lg text-sm font-semibold transition-all"
            style={tab===t?{background:th.isDark?"rgba(155,93,229,0.14)":"rgba(255,255,255,0.8)",color:th.navAC,border:`1px solid rgba(155,93,229,0.25)`}:{color:th.fg3,background:"transparent",border:"1px solid transparent"}}>
            {t==="overview"?"Vue d'ensemble":t==="badges"?"Badges":"Préférences"}
          </button>
        ))}
      </div>

      {tab==="overview"&&(
        <div className="grid grid-cols-2 gap-5">
          <GCard><div className="p-5">
            <div className="flex items-center gap-2 mb-4"><Trophy className="w-4 h-4 text-amber-400"/><span className="text-sm font-black" style={{color:th.fg}}>Progression certification</span></div>
            <div className="space-y-3">
              {CERT_CHAPTERS.map(({title,pct,done,active})=>(
                <div key={title}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0" style={{background:done?"rgba(74,222,128,0.15)":active?"rgba(155,93,229,0.12)":"transparent",border:`1px solid ${done?"rgba(74,222,128,0.4)":active?"rgba(155,93,229,0.3)":th.sep}`}}>
                        {done?<CheckCircle className="w-2.5 h-2.5 text-green-400"/>:active?<div className="w-1.5 h-1.5 rounded-full" style={{background:th.navAC}}/>:<Lock className="w-2 h-2" style={{color:th.fg3}}/>}
                      </div>
                      <span className="text-xs" style={{color:done?"rgba(74,222,128,0.8)":active?th.navAC:th.fg3}}>{title}</span>
                    </div>
                    <span className="text-xs font-bold" style={{color:done?"#4ADE80":active?th.navAC:th.fg3}}>{pct}%</span>
                  </div>
                  <div className="h-1 rounded-full overflow-hidden" style={{background:th.isDark?"rgba(255,255,255,0.05)":"rgba(155,93,229,0.08)"}}><div className="h-full rounded-full" style={{width:`${pct}%`,background:done?"linear-gradient(90deg,#16A34A,#4ADE80)":active?"linear-gradient(90deg,#9B5DE5,#DDAEEA)":"transparent"}}/></div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4" style={{borderTop:`1px solid ${th.sep}`}}>
              <ShimBtn sm><span className="flex items-center gap-2"><Award className="w-4 h-4"/>S'entraîner pour la soutenance</span></ShimBtn>
            </div>
          </div></GCard>

          <GCard><div className="p-5">
            <div className="text-[10px] font-black uppercase tracking-widest mb-3" style={{color:th.fg3}}>Activité — 4 semaines</div>
            <div className="flex items-end gap-1 h-16">
              {[4,7,3,8,5,6,2,9,6,7,4,5,8,6,3,7,8,5,6,9,7,4,6,8,5,7,9,6].map((h,i)=>(
                <div key={i} className="flex-1 rounded-sm" style={{height:`${h*10}%`,background:i===27?"linear-gradient(to top,#9B5DE5,#DDAEEA)":"rgba(155,93,229,0.25)",opacity:i>24?1:0.5}}/>
              ))}
            </div>
          </div></GCard>
        </div>
      )}

      {tab==="badges"&&(
        <div className="grid grid-cols-3 gap-4">
          {BADGES.map(({emoji,label,done})=>(
            <GCard key={label}><div className={cx("p-5 text-center",!done&&"opacity-40")}>
              <span className={cx("text-4xl block mb-3",!done&&"grayscale")}>{emoji}</span>
              <div className="text-sm font-bold mb-1" style={{color:done?th.fg:th.fg3}}>{label}</div>
              {done?<span className="text-[10px] font-bold text-green-500">Obtenu ✓</span>:<span className="text-[10px] flex items-center justify-center gap-1" style={{color:th.fg3}}><Lock className="w-3 h-3"/>Non débloqué</span>}
            </div></GCard>
          ))}
        </div>
      )}

      {tab==="settings"&&(
        <div className="space-y-5 max-w-xl">
          {/* Theme toggle */}
          <GCard><div className="p-5 flex items-center justify-between">
            <div>
              <div className="text-sm font-bold mb-0.5" style={{color:th.fg}}>Thème de l'interface</div>
              <div className="text-xs" style={{color:th.fg3}}>{th.isDark?"Mode sombre activé — ambiance dark glass":"Mode clair activé — interface lumineuse"}</div>
            </div>
            <button onClick={onToggleTheme} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
              style={{background:th.isDark?"rgba(255,255,255,0.08)":"rgba(155,93,229,0.1)",border:`1px solid ${th.sep}`,color:th.fg}}>
              {th.isDark?<><Sun className="w-4 h-4 text-amber-400"/>Passer en mode clair</>:<><Moon className="w-4 h-4" style={{color:th.navAC}}/>Passer en mode sombre</>}
            </button>
          </div></GCard>

          {/* Info fields */}
          <div className="grid grid-cols-2 gap-4">
            {[["Prénom",profile.name||"Alex"],["Âge","28 ans"],["Profession",profile.profession||"Chef de projet"],["Email","alex@example.com"]].map(([label,val])=>(
              <div key={label}>
                <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{color:th.fg3}}>{label}</label>
                <div className="w-full rounded-xl px-4 py-3 text-sm flex items-center justify-between" style={{background:th.inputBg,border:`1px solid ${th.inputB}`}}>
                  <span style={{color:th.fg2}}>{val}</span>
                  <button className="text-xs transition-colors hover:opacity-70" style={{color:th.navAC}}>Modifier</button>
                </div>
              </div>
            ))}
          </div>

          {/* Objectif professionnel */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{color:th.fg3}}>Objectif professionnel</label>
            <div className="w-full rounded-xl px-4 py-3 text-sm" style={{background:th.inputBg,border:`1px solid ${th.inputB}`,color:th.fg2,lineHeight:1.7,minHeight:80}}>
              {profile.goalFinal||profile.goal||<span style={{color:th.fg3}}>Non renseigné — complète ton profil lors de l'onboarding.</span>}
            </div>
            {profile.goalFinal&&profile.goalFinal!==profile.goal&&(
              <p className="text-[10px] mt-1.5 flex items-center gap-1" style={{color:th.navAC}}><Sparkles className="w-3 h-3"/>Reformulé par l'IA lors de l'inscription</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN LAYOUT
// ═══════════════════════════════════════════════════════════════════════════
function MainLayout({profile,goLesson,onToggleTheme}:{profile:Profile;goLesson:()=>void;onToggleTheme:()=>void}) {
  const th=useTh();
  const [activeNav,setActiveNav]=useState<NavId>("dashboard");
  const name=profile.name.split(" ")[0]||"Alex";

  return (
    <div className="flex h-screen overflow-hidden" style={{background:th.bg,fontFamily:"'Inter',sans-serif"}}>
      <Background/>
      <aside className="relative z-10 flex flex-col h-full shrink-0" style={{width:220,background:th.sidebar,backdropFilter:"blur(24px)",borderRight:`1px solid ${th.sidebarB}`,boxShadow:th.isDark?"none":"4px 0 24px rgba(155,93,229,0.06)"}}>
        <div className="px-6 py-6" style={{borderBottom:`1px solid ${th.sidebarB}`}}><Logo h={26}/></div>
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(({id,Icon,label})=>{
            const active=activeNav===id;
            return (
              <button key={id} onClick={()=>setActiveNav(id)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-left transition-all"
                style={active?{background:th.navA,border:`1px solid ${th.navAB}`,color:th.navAC}:{color:th.fg3,background:"transparent",border:"1px solid transparent"}}>
                <Icon className="w-4 h-4 shrink-0"/>{label}
              </button>
            );
          })}
        </nav>
        <div className="p-4" style={{borderTop:`1px solid ${th.sidebarB}`}}>
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black shrink-0" style={{background:"linear-gradient(135deg,#9B5DE5,#DDAEEA)",color:"#08060F"}}>{name[0]}</div>
            <div className="min-w-0"><div className="text-sm font-semibold truncate" style={{color:th.fg}}>{name}</div><div className="text-xs truncate" style={{color:th.fg3}}>{profile.profession||"Apprenant IA"}</div></div>
          </div>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col relative z-10 overflow-hidden">
        <div className="shrink-0 flex items-center gap-4 px-8 py-4" style={{borderBottom:`1px solid ${th.sep}`,background:th.topbar,backdropFilter:"blur(20px)"}}>
          <div className="flex-1"><div className="text-xs font-bold uppercase tracking-widest" style={{color:th.fg3}}>{NAV_ITEMS.find(n=>n.id===activeNav)?.label}</div></div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold" style={{background:"rgba(251,146,60,0.1)",border:"1px solid rgba(251,146,60,0.25)",color:"#FB923C"}}><Flame className="w-3.5 h-3.5"/>7 jours</div>
          <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl w-52" style={{background:th.inputBg,border:`1px solid ${th.inputB}`}}>
            <Search className="w-3.5 h-3.5 shrink-0" style={{color:th.fg3}}/>
            <input placeholder="Recherche…" className="flex-1 bg-transparent text-sm outline-none" style={{color:th.fg2}}/>
          </div>
          <button className="w-9 h-9 rounded-xl flex items-center justify-center" style={{background:th.inputBg,border:`1px solid ${th.inputB}`}}>
            <Bell className="w-4 h-4" style={{color:th.fg3}}/>
          </button>
        </div>

        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {activeNav==="dashboard"&&<DashboardTab goLesson={goLesson}/>}
          {activeNav==="lessons"&&<LessonsTab goLesson={goLesson}/>}
          {activeNav==="practice"&&<PracticeTab profile={profile}/>}
          {activeNav==="calendar"&&<CalendarTab/>}
          {activeNav==="benefits"&&<BenefitsTab/>}
          {activeNav==="profile"&&<ProfileTab profile={profile} onToggleTheme={onToggleTheme}/>}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// LESSON PAGE
// ═══════════════════════════════════════════════════════════════════════════
function LessonPage({profile,goBack}:{profile:Profile;goBack:()=>void}) {
  const th=useTh();
  type LTab="video"|"transcript"|"mindmap";
  const [tab,setTab]=useState<LTab>("video");
  const [playing,setPlaying]=useState(false);
  const [quizSel,setQuizSel]=useState<number|null>(null);
  const [showExpl,setShowExpl]=useState(false);
  const [msgs,setMsgs]=useState<ChatMsg[]>([{role:"ai",text:DEFAULT_AI}]);
  const [chatIn,setChatIn]=useState("");
  const [typing,setTyping]=useState(false);
  const [voice,setVoice]=useState(false);
  const chatEnd=useRef<HTMLDivElement>(null);
  const firstName=profile.name.split(" ")[0]||"Alex";

  useEffect(()=>{chatEnd.current?.scrollIntoView({behavior:"smooth"});},[msgs,typing]);

  const sendMsg=(text:string)=>{
    if(!text.trim()) return;
    setMsgs(m=>[...m,{role:"user",text:text.trim()}]);
    setChatIn(""); setTyping(true);
    setTimeout(()=>{ const lc=text.toLowerCase(); const hit=AI_RESPONSES.find(r=>r.kw.some(k=>lc.includes(k))); setTyping(false); setMsgs(m=>[...m,{role:"ai",text:hit?.text??DEFAULT_AI}]); },900);
  };

  const TABS:{id:LTab;Icon:typeof Monitor;label:string}[]=[
    {id:"video",Icon:Monitor,label:"Vidéo"},{id:"transcript",Icon:AlignLeft,label:"Transcription"},{id:"mindmap",Icon:Network,label:"Mindmap"},
  ];

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{background:th.bg,fontFamily:"'Inter',sans-serif"}}>
      <Background/>
      <div className="relative z-10 shrink-0 flex items-center justify-between px-6 py-3" style={{borderBottom:`1px solid ${th.sep}`,background:th.topbar,backdropFilter:"blur(24px)"}}>
        <div className="flex items-center gap-4">
          <button onClick={goBack} className="flex items-center gap-1.5 text-sm transition-colors hover:opacity-70" style={{color:th.fg3}}><ChevronLeft className="w-4 h-4"/>Dashboard</button>
          <div className="w-px h-4" style={{background:th.sep}}/>
          <span className="text-xs" style={{color:th.fg3}}>Module 2</span><span className="text-xs mx-1" style={{color:th.fg3}}>›</span><span className="text-xs font-medium" style={{color:th.fg}}>Maîtriser le Prompt Engineering</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 text-xs" style={{color:th.fg3}}>
            Progression
            <div className="w-28 h-1.5 rounded-full overflow-hidden" style={{background:th.isDark?"rgba(255,255,255,0.07)":"rgba(155,93,229,0.1)"}}>
              <div className="h-full rounded-full" style={{width:"64%",background:"linear-gradient(90deg,#7C3AED,#DDAEEA)"}}/>
            </div>
            <span className="font-bold" style={{color:th.navAC}}>64%</span>
          </div>
          <VBtn sm>Leçon suivante <ChevronRight className="inline w-4 h-4"/></VBtn>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative z-10">
        <div className="flex-1 min-w-0 overflow-y-auto">
          <div className="relative" style={{paddingBottom:"40%",background:"#060410"}}>
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute inset-0" style={{background:"linear-gradient(135deg,#0d0522,#1a0b3c 45%,#08060F)"}}/>
              <div className="absolute inset-0" style={{background:"radial-gradient(ellipse at 28% 55%,rgba(155,93,229,0.25),transparent 55%)"}}/>
              {tab==="video"&&<div className="absolute inset-0 flex items-center justify-center"><button onClick={()=>setPlaying(p=>!p)} className="w-16 h-16 rounded-full flex items-center justify-center border border-white/15 hover:scale-110 transition-transform" style={{background:"rgba(255,255,255,0.08)",backdropFilter:"blur(20px)",boxShadow:"0 0 40px rgba(155,93,229,0.3)"}}>{playing?<Pause className="w-6 h-6 text-white"/>:<Play className="w-6 h-6 text-white ml-1"/>}</button></div>}
              {tab==="transcript"&&(
                <div className="absolute inset-0 overflow-y-auto p-6" style={{background:"rgba(8,6,15,0.8)",backdropFilter:"blur(8px)"}}>
                  <div className="max-w-xl mx-auto space-y-3">
                    {[{t:"00:00",txt:"Introduction au prompt engineering et à la formule fondamentale.",hi:false},{t:"01:24",txt:"Rôle + Contexte + Tâche + Format — ce framework peut tripler la qualité de vos résultats.",hi:true},{t:"03:52",txt:"Exemple : 'Tu es expert en vente SaaS. Rédige un email de 120 mots pour relancer un prospect…'",hi:false},{t:"07:10",txt:"La température contrôle la créativité. Basse = précision, haute = créativité.",hi:true}].map(({t,txt,hi})=>(
                      <div key={t} className={cx("flex gap-3 p-3 rounded-xl",hi&&"border")} style={hi?{background:"rgba(155,93,229,0.07)",borderColor:"rgba(155,93,229,0.2)"}:{}}>
                        <span className="text-[10px] text-white/30 font-mono shrink-0 pt-0.5">{t}</span>
                        <p className={cx("text-sm leading-relaxed",hi?"text-white/80":"text-white/40")}>{txt}</p>
                        {hi&&<Lightbulb className="w-3.5 h-3.5 text-violet-400/50 shrink-0 mt-0.5"/>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {tab==="mindmap"&&(
                <div className="absolute inset-0 flex items-center justify-center p-6" style={{background:"rgba(8,6,15,0.8)",backdropFilter:"blur(8px)"}}>
                  <svg viewBox="0 0 520 300" className="w-full max-w-xl">
                    <ellipse cx="260" cy="150" rx="78" ry="34" fill="rgba(155,93,229,0.15)" stroke="rgba(221,174,234,0.6)" strokeWidth="1.5"/>
                    <text x="260" y="155" textAnchor="middle" fill="#DDAEEA" fontSize="11" fontWeight="800">Prompt Engineering</text>
                    {[{cx:80,cy:75,label:"Rôle",color:"#60A5FA",lx:185,ly:127},{cx:80,cy:225,label:"Contexte",color:"#4ADE80",lx:187,ly:170},{cx:440,cy:75,label:"Tâche",color:"#F59E0B",lx:333,ly:127},{cx:440,cy:225,label:"Format",color:"#F472B6",lx:335,ly:170}].map(({cx,cy,label,color,lx,ly})=>(
                      <g key={label}><line x1={lx} y1={ly} x2={cx} y2={cy} stroke={color} strokeWidth="1" strokeOpacity="0.35" strokeDasharray="4 3"/><ellipse cx={cx} cy={cy} rx="48" ry="24" fill={`${color}15`} stroke={color} strokeWidth="1" strokeOpacity="0.55"/><text x={cx} y={cy+4} textAnchor="middle" fill={color} fontSize="10" fontWeight="700">{label}</text></g>
                    ))}
                  </svg>
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 px-5 pb-4" style={{background:"linear-gradient(to top,rgba(8,6,15,0.9),transparent)"}}>
                <div className="flex items-center justify-between mb-2"><span className="text-xs text-white/40">Maîtriser le Prompt Engineering</span><div className="flex items-center gap-3 text-white/40">{[Volume2,Maximize2].map((Icon,i)=><button key={i}><Icon className="w-4 h-4"/></button>)}</div></div>
                <div className="h-1 rounded-full cursor-pointer overflow-hidden mb-1" style={{background:"rgba(255,255,255,0.1)"}}><div className="h-full rounded-full" style={{width:"38%",background:"linear-gradient(90deg,#7C3AED,#DDAEEA)"}}/></div>
                <div className="flex justify-between text-[10px] text-white/25 font-mono"><span>8:47</span><span>23:00</span></div>
              </div>
            </div>
          </div>

          <div className="flex shrink-0" style={{background:th.topbar,backdropFilter:"blur(20px)",borderBottom:`1px solid ${th.sep}`}}>
            {TABS.map(({id,Icon,label})=>(
              <button key={id} onClick={()=>setTab(id)} className="flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-all border-b-2 -mb-px"
                style={{borderColor:tab===id?th.navAC:"transparent",color:tab===id?th.navAC:th.fg3}}>
                <Icon className="w-3.5 h-3.5"/>{label}
              </button>
            ))}
          </div>

          <div className="p-6 space-y-5">
            <GCard><div className="p-5">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{background:"rgba(155,93,229,0.1)",border:"1px solid rgba(155,93,229,0.2)"}}><Brain className="w-4 h-4" style={{color:th.navAC}}/></div>
                <span className="text-sm font-black" style={{color:th.fg}}>Quiz Adaptatif IA</span>
                <span className="ml-auto text-[10px] font-bold px-2.5 py-1 rounded-full" style={{background:"rgba(155,93,229,0.06)",color:th.navAC,border:"1px solid rgba(155,93,229,0.15)"}}>Généré en direct</span>
              </div>
              <p className="text-sm font-semibold mb-4" style={{color:th.fg}}>{QUIZ_Q.question}</p>
              <div className="space-y-2 mb-4">
                {QUIZ_Q.options.map((opt,i)=>{
                  let bg=th.isDark?"rgba(255,255,255,0.03)":th.inputBg, border=th.inputB, color=th.fg2;
                  if(quizSel!==null){ if(i===QUIZ_Q.correct){bg="rgba(74,222,128,0.1)";border="rgba(74,222,128,0.35)";color="#4ADE80";} else if(i===quizSel){bg="rgba(248,113,113,0.1)";border="rgba(248,113,113,0.35)";color="#F87171";} else{bg="transparent";border=th.sep;color=th.fg3;} }
                  return (
                    <button key={i} onClick={()=>{ if(quizSel===null){ setQuizSel(i); setShowExpl(true); } }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-left transition-all"
                      style={{background:bg,border:`1px solid ${border}`,color}}>
                      <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{background:th.isDark?"rgba(255,255,255,0.06)":"rgba(155,93,229,0.06)"}}>
                        {quizSel!==null&&i===QUIZ_Q.correct?<CheckCircle className="w-4 h-4 text-green-400"/>:quizSel!==null&&i===quizSel?<X className="w-4 h-4 text-red-400"/>:String.fromCharCode(65+i)}
                      </span>{opt}
                    </button>
                  );
                })}
              </div>
              {showExpl&&<div className="rounded-xl p-4" style={{background:"rgba(96,165,250,0.07)",border:"1px solid rgba(96,165,250,0.2)"}}>
                <div className="flex items-center gap-1.5 mb-2 text-xs font-bold text-blue-400"><Lightbulb className="w-3.5 h-3.5"/>Explication IA</div>
                <p className="text-xs leading-relaxed" style={{color:th.fg2}}>{QUIZ_Q.explanation}</p>
                <button onClick={()=>{setQuizSel(null);setShowExpl(false);}} className="mt-3 flex items-center gap-1.5 text-xs font-semibold transition-opacity hover:opacity-70" style={{color:th.navAC}}><RotateCcw className="w-3 h-3"/>Nouvelle question</button>
              </div>}
            </div></GCard>
          </div>
        </div>

        {/* Copilot */}
        <div className="w-80 shrink-0 flex flex-col" style={{borderLeft:`1px solid ${th.sep}`,background:th.sidebar,backdropFilter:"blur(24px)"}}>
          <div className="shrink-0 px-4 py-4" style={{borderBottom:`1px solid ${th.sep}`}}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{background:"linear-gradient(135deg,#9B5DE5,#DDAEEA)"}}><Sparkles className="w-4 h-4" style={{color:"#08060F"}}/></div>
              <div><div className="text-sm font-black" style={{color:th.fg}}>Copilote IA</div><div className="text-[10px]" style={{color:th.fg3}}>Tuteur activé</div></div>
              <div className="ml-auto flex items-center gap-1.5 text-[10px] text-green-500 font-bold"><div className="w-1.5 h-1.5 rounded-full bg-green-500" style={{animation:"dot-blink 2s ease-in-out infinite"}}/>En ligne</div>
            </div>
            <div className="rounded-xl px-3 py-2.5" style={{background:"rgba(155,93,229,0.07)",border:"1px solid rgba(155,93,229,0.15)"}}>
              <p className="text-[11px] leading-relaxed" style={{color:th.navAC}}>💡 <strong>Pour {firstName} :</strong> Chaque concept → applique-le immédiatement en pratique.</p>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {msgs.map((m,i)=>(
              <div key={i} className={cx("flex",m.role==="user"?"justify-end":"justify-start")}>
                {m.role==="ai"&&<div className="w-6 h-6 rounded-full flex items-center justify-center mr-2 mt-0.5 shrink-0" style={{background:"linear-gradient(135deg,#9B5DE5,#DDAEEA)"}}><Sparkles className="w-3 h-3" style={{color:"#08060F"}}/></div>}
                <div className="max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-line"
                  style={m.role==="user"?{background:"linear-gradient(135deg,#7C3AED,#DDAEEA)",color:"#08060F",fontWeight:600,borderRadius:"16px 16px 4px 16px"}:{background:th.isDark?"rgba(255,255,255,0.05)":"rgba(155,93,229,0.06)",border:`1px solid ${th.sep}`,color:th.fg2,borderRadius:"16px 16px 16px 4px"}}>
                  {m.text}
                </div>
              </div>
            ))}
            {typing&&<div className="flex"><div className="w-6 h-6 rounded-full flex items-center justify-center mr-2 shrink-0" style={{background:"linear-gradient(135deg,#9B5DE5,#DDAEEA)"}}><Sparkles className="w-3 h-3" style={{color:"#08060F"}}/></div><div className="px-4 py-3 rounded-2xl flex gap-1 items-center" style={{background:th.isDark?"rgba(255,255,255,0.05)":"rgba(155,93,229,0.06)",border:`1px solid ${th.sep}`}}>{[0,1,2].map(i=><div key={i} className="w-1.5 h-1.5 rounded-full" style={{background:"rgba(155,93,229,0.6)",animation:`bounce-dot 1.2s ease-in-out ${i*0.15}s infinite`}}/>)}</div></div>}
            <div ref={chatEnd}/>
          </div>
          <div className="px-4 py-3 shrink-0" style={{borderTop:`1px solid ${th.sep}`}}>
            <div className="text-[10px] font-black uppercase tracking-widest mb-2" style={{color:th.fg3}}>Actions rapides</div>
            {[{Icon:MessageSquare,label:"Reformule simplement",cmd:"reformule simplement"},{Icon:Lightbulb,label:"Exemple pour mon métier",cmd:"exemple concret métier"},{Icon:Zap,label:"Crash test 2 min",cmd:"crash test"}].map(({Icon,label,cmd})=>(
              <button key={label} onClick={()=>sendMsg(cmd)} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs text-left mb-1.5 transition-opacity hover:opacity-70" style={{background:th.isDark?"rgba(255,255,255,0.025)":"rgba(155,93,229,0.05)",border:`1px solid ${th.sep}`,color:th.fg2}}>
                <Icon className="w-3.5 h-3.5 shrink-0" style={{color:th.navAC}}/>{label}
              </button>
            ))}
          </div>
          <div className="px-4 pb-4 pt-1 shrink-0">
            <div className="flex gap-2">
              <input value={chatIn} onChange={e=>setChatIn(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!typing&&sendMsg(chatIn)} placeholder="Pose ta question…" className="flex-1 rounded-xl px-3 py-2.5 text-sm g-input"/>
              <button onClick={()=>setVoice(v=>!v)} className="w-10 h-10 rounded-xl flex items-center justify-center transition-all shrink-0" style={voice?{background:"linear-gradient(135deg,#9B5DE5,#DDAEEA)"}:{background:th.inputBg,border:`1px solid ${th.inputB}`}}>
                <Mic className="w-4 h-4" style={{color:voice?"#08060F":th.fg3}}/>
              </button>
              <button onClick={()=>sendMsg(chatIn)} disabled={!chatIn.trim()||typing} className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 disabled:opacity-30" style={{background:"linear-gradient(135deg,#9B5DE5,#DDAEEA)"}}>
                <Send className="w-4 h-4" style={{color:"#08060F"}}/>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// APP
// ═══════════════════════════════════════════════════════════════════════════
export default function App() {
  const [page,setPage]=useState<Page>("onboarding");
  const [profile,setProfile]=useState<Profile>({name:"",age:"",profession:"",goal:"",goalFinal:"",style:"",tutor:""});
  const [isDark,setIsDark]=useState(true);
  const th=mkTh(isDark);

  return (
    <ThemeCtx.Provider value={th}>
      {page==="onboarding"&&<OnboardingPage onDone={p=>{setProfile(p);setPage("main");}}/>}
      {page==="main"&&<MainLayout profile={profile} goLesson={()=>setPage("lesson")} onToggleTheme={()=>setIsDark(d=>!d)}/>}
      {page==="lesson"&&<LessonPage profile={profile} goBack={()=>setPage("main")}/>}
    </ThemeCtx.Provider>
  );
}
