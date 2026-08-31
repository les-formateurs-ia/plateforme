// ═══════════════════════════════════════════════════════════════════════════
// Données de démonstration — à remplacer par des requêtes Supabase.
// Chaque export ici correspond à une table du schéma (voir supabase/migrations).
// ═══════════════════════════════════════════════════════════════════════════
import {
  BarChart3, BookOpen, Code2, Calendar, Star, User,
  Monitor, Headphones, FileText,
  type LucideIcon,
} from "lucide-react";
import type { NavId } from "@/app/types";

export const NAV_ITEMS: { id: NavId; Icon: LucideIcon; label: string; path: string }[] = [
  { id: "dashboard", Icon: BarChart3, label: "Tableau de bord", path: "/" },
  { id: "lessons",   Icon: BookOpen,  label: "Mes leçons",      path: "/lessons" },
  { id: "practice",  Icon: Code2,     label: "Pratique IA",     path: "/practice" },
  { id: "calendar",  Icon: Calendar,  label: "Rendez-vous",     path: "/calendar" },
  { id: "benefits",  Icon: Star,      label: "Mes avantages",   path: "/benefits" },
  { id: "profile",   Icon: User,      label: "Mon profil",      path: "/profile" },
];

export const MEMORY_DATA = [
  { t: "Auj.", decay: 100, ai: 100 }, { t: "J+1", decay: 62, ai: 62 }, { t: "J+3", decay: 42, ai: 91 },
  { t: "J+7", decay: 26, ai: 79 }, { t: "J+14", decay: 17, ai: 93 }, { t: "J+21", decay: 13, ai: 84 }, { t: "J+30", decay: 10, ai: 88 },
];

export const SKILLS = [
  { label: "Logique", pct: 87, strong: true }, { label: "UX Design", pct: 74, strong: true },
  { label: "Prompting IA", pct: 71, strong: true }, { label: "Analyse données", pct: 64, strong: false },
  { label: "Fonctions Async", pct: 38, strong: false }, { label: "Tests unitaires", pct: 27, strong: false },
];

export const LEARN_STYLES = [
  { id: "visual", Icon: Monitor, label: "Visuel & Vidéo", desc: "Cours vidéo et schémas animés" },
  { id: "audio", Icon: Headphones, label: "Podcast & Audio", desc: "Mémorisation par écoute active" },
  { id: "project", Icon: Code2, label: "Projets pratiques", desc: "Apprendre en construisant" },
  { id: "summary", Icon: FileText, label: "Résumés express", desc: "Synthèses denses et mémos rapides" },
];

export const TUTOR_STYLES = [
  { id: "soft", emoji: "🤝", label: "Pédagogue doux", desc: "Patient, encourageant, beaucoup d'exemples" },
  { id: "strict", emoji: "🎯", label: "Expert strict", desc: "Exigeant, direct, haute performance" },
  { id: "synth", emoji: "⚡", label: "Mode Synthétique", desc: "Concis, efficace, zéro superflu" },
];

export const MODULES = [
  { id: 1, icon: "🧠", title: "Introduction à l'IA Générative", total: 5, done: 5, status: "complete" },
  { id: 2, icon: "⚡", title: "Prompt Engineering Pro", total: 8, done: 5, status: "active" },
  { id: 3, icon: "🔄", title: "IA & Automatisation", total: 6, done: 0, status: "locked" },
  { id: 4, icon: "🤖", title: "Agents IA & Workflows", total: 7, done: 0, status: "locked" },
  { id: 5, icon: "🏆", title: "Projet Final & Certification", total: 3, done: 0, status: "locked" },
];

export const M2_LESSONS = [
  { id: 1, title: "Les bases du prompting", dur: "15min", done: true },
  { id: 2, title: "La formule RCTF expliquée", dur: "20min", done: true },
  { id: 3, title: "Prompts pour GPT-4o", dur: "18min", done: true },
  { id: 4, title: "Chain of Thought", dur: "22min", done: true },
  { id: 5, title: "Few-shot learning", dur: "16min", done: true },
  { id: 6, title: "Maîtriser le Prompt Engineering", dur: "23min", done: false, current: true },
  { id: 7, title: "Prompts avancés & température", dur: "19min", done: false },
  { id: 8, title: "Quiz final du module", dur: "30min", done: false },
];

export const CERT_CHAPTERS = [
  { title: "Introduction à l'IA Générative", pct: 100, done: true },
  { title: "Prompt Engineering Pro", pct: 64, done: false, active: true },
  { title: "IA & Automatisation", pct: 0, done: false },
  { title: "Agents IA & Workflows", pct: 0, done: false },
  { title: "Projet Final", pct: 0, done: false },
];

export const PROMPT_CATS = [
  { emoji: "📧", label: "Marketing & Email", count: 42 }, { emoji: "💻", label: "Dev & Code", count: 38 },
  { emoji: "📊", label: "Data & Analyse", count: 29 }, { emoji: "🎨", label: "Design & Créatif", count: 31 },
  { emoji: "📝", label: "Rédaction & SEO", count: 44 }, { emoji: "🤝", label: "Commercial", count: 27 },
  { emoji: "⚙️", label: "Automatisation", count: 35 }, { emoji: "🧠", label: "Stratégie & RH", count: 22 },
];

export const AI_TOOLS = [
  { name: "ChatGPT", sub: "GPT-4o", color: "#10A37F", letter: "G" },
  { name: "Claude", sub: "Sonnet 4.5", color: "#dbacf0", letter: "C" },
  { name: "Gemini", sub: "Pro 2.0", color: "#4285F4", letter: "G" },
  { name: "Mistral", sub: "Large 2", color: "#FF7000", letter: "M" },
  { name: "Perplexity", sub: "Pro", color: "#20808D", letter: "P" },
];

export const CAL_EVENTS = [
  { col: 0, label: "Révision Leçon 1", type: "review" },
  { col: 1, label: "Session Expert IA", type: "expert" },
  { col: 3, label: "Quiz Module 2", type: "quiz" },
  { col: 4, label: "Pratique Sandbox", type: "practice" },
  { col: 5, label: "Révision J+14", type: "review" },
];

export const BADGES = [
  { emoji: "⚡", label: "Premier prompt", done: true }, { emoji: "🔥", label: "7 jours consécutifs", done: true },
  { emoji: "🧠", label: "Quiz parfait 100%", done: true }, { emoji: "💬", label: "Session expert", done: false },
  { emoji: "📚", label: "100 prompts écrits", done: false }, { emoji: "🏆", label: "Certifié IA Pro", done: false },
];

export const QUIZ_Q = {
  question: "Quelle technique améliore le plus la qualité d'un prompt IA ?",
  options: ["Utiliser des mots-clés SEO", "Assigner un rôle précis à l'IA avant la tâche", "Écrire en majuscules", "Poser plusieurs questions simultanées"],
  correct: 1,
  explanation: "Assigner un rôle ancre le contexte de l'IA et améliore drastiquement la pertinence — c'est la base du prompt engineering professionnel.",
};

export const AI_RESPONSES: { kw: string[]; text: string }[] = [
  { kw: ["reformule", "simple"], text: "En clair : un prompt c'est une commande à l'IA. Rôle + Contexte + Tâche + Format = la formule gagnante." },
  { kw: ["exemple", "métier", "concret"], text: "Pour un marketeur : 'Tu es expert en conversion SaaS B2B. Rédige un email de 120 mots pour relancer un prospect après 14 jours d'essai. Ton : direct, axé ROI.'" },
  { kw: ["crash", "test"], text: "⏱ Crash test !\n\nCause principale des réponses incohérentes ?\n(A) Modèle buggé\n(B) Prompt sans rôle ni contexte\n(C) Connexion instable\n(D) Mauvais modèle" },
];

export const DEFAULT_AI = "Je suis ton Copilote IA. Pose-moi n'importe quelle question ou utilise les actions rapides 👇";
