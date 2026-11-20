// Mode Visiteur côté interface (cf. lib/visitor.ts) : bandeau permanent,
// encart « disponible en formation » à la place des pages fermées, et
// garde de route.
import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Check, Globe, Lock, Mail, Phone, Sparkles } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { useAuth } from "@/app/state/auth-context";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/app/components/ui/dialog";
import {
  VISITOR_CLOSED_FEATURES, VISITOR_FALLBACK_TOOL, VISITOR_TOOLS, VISITOR_TRIAL_EVENT, type VisitorClosedFeature,
} from "@/app/lib/visitor";

// Coordonnées publiées sur https://les-formateurs-ia.fr/ (relevées le 2026-11-20).
const CONTACT_EMAIL = "contact@les-formateurs-ia.fr";
const CONTACT_HREF = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Formation IA : je souhaite en savoir plus")}`;
const CONTACT_PHONE = "09 80 87 40 46";
const CONTACT_PHONE_HREF = "tel:+33980874046";
export const SIGNUP_URL = "https://les-formateurs-ia.fr/contact/";
const WEBSITE_URL = "https://les-formateurs-ia.fr";

// Téléphone, e-mail, site : sous les invitations à s'inscrire.
export function VisitorContacts() {
  const th = useTh();
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-xs" style={{ color: th.fg3 }}>
      <a href={CONTACT_PHONE_HREF} className="flex items-center gap-1.5 hover:opacity-70"><Phone className="w-3.5 h-3.5" />{CONTACT_PHONE}</a>
      <a href={CONTACT_HREF} className="flex items-center gap-1.5 hover:opacity-70"><Mail className="w-3.5 h-3.5" />{CONTACT_EMAIL}</a>
      <a href={WEBSITE_URL} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:opacity-70"><Globe className="w-3.5 h-3.5" />les-formateurs-ia.fr</a>
    </div>
  );
}

export function useIsVisitor(): boolean {
  return useAuth().isVisitor;
}

export function VisitorBanner() {
  const th = useTh();
  if (!useIsVisitor()) return null;
  return (
    <div className="shrink-0 min-h-10 flex items-center justify-between gap-3 px-4 py-1.5" style={{ background: th.ink, color: th.onInk }}>
      <span className="text-[13px] font-semibold flex items-center gap-2 min-w-0">
        <Sparkles className="w-4 h-4 shrink-0" />
        <span className="truncate"><strong>Mode visiteur</strong><span className="hidden sm:inline"> · vous découvrez la plateforme avec un accès limité</span></span>
      </span>
      <a href={SIGNUP_URL} target="_blank" rel="noreferrer" className="shrink-0 rounded-[2px] px-3 py-1 text-xs font-bold transition-opacity hover:opacity-85"
        style={{ border: `1px solid ${th.onInk}`, color: th.onInk }}>
        Accéder à la formation
      </a>
    </div>
  );
}

// Encart affiché à la place d'une page ou d'un contenu réservé à la formation.
export function VisitorClosed({ feature, backTo, backLabel = "Retour" }: { feature: VisitorClosedFeature; backTo?: string; backLabel?: string }) {
  const th = useTh();
  const navigate = useNavigate();
  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8">
      {backTo && (
        <button onClick={() => navigate(backTo)} className="inline-flex items-center gap-1.5 text-sm mb-6 transition-opacity hover:opacity-70" style={{ color: th.fg3 }}>
          <ArrowLeft className="w-4 h-4" />{backLabel}
        </button>
      )}
      <div className="max-w-xl mx-auto text-center py-10 space-y-5">
        <span className="mx-auto w-14 h-14 rounded-full flex items-center justify-center" style={{ background: th.ink, color: th.onInk }}>
          <Lock className="w-6 h-6" />
        </span>
        <p className="eyebrow" style={{ color: th.fg3 }}>Mode visiteur</p>
        <h1 className="text-2xl sm:text-3xl font-black" style={{ color: th.fg }}>{VISITOR_CLOSED_FEATURES[feature]} est disponible en formation</h1>
        <p className="text-sm leading-relaxed" style={{ color: th.fg2 }}>
          Vous découvrez la plateforme en accès limité. Une fois inscrit, vous profitez de l'ensemble du parcours : toutes les leçons,
          tous les exercices, le suivi de votre formateur et un Agent IA qui connaît votre profil et vos résultats.
        </p>
        <a href={SIGNUP_URL} target="_blank" rel="noreferrer" className="sweep inline-flex items-center gap-2 rounded-[2px] px-5 min-h-11 text-sm font-semibold"
          style={{ background: th.ink, color: th.onInk }}>
          <Sparkles className="w-4 h-4" />S'inscrire à la formation
        </a>
        <VisitorContacts />
      </div>
    </div>
  );
}

// Garde de route : le visiteur voit l'encart, les autres la page.
export function NotForVisitor({ feature, backTo, backLabel, children }: { feature: VisitorClosedFeature; backTo?: string; backLabel?: string; children: ReactNode }) {
  if (useIsVisitor()) return <VisitorClosed feature={feature} backTo={backTo} backLabel={backLabel} />;
  return <>{children}</>;
}

// Petite pastille sous une liste tronquée (Hub IA, Guide IA…).
export function VisitorMoreNotice({ children }: { children: ReactNode }) {
  const th = useTh();
  return (
    <div className="flex items-start gap-3 rounded-[10px] px-4 py-3.5" style={{ background: th.navA, border: `1px dashed ${th.sep}` }}>
      <Lock className="w-4 h-4 mt-0.5 shrink-0" style={{ color: th.fg3 }} />
      <p className="text-sm" style={{ color: th.fg2 }}>{children}</p>
    </div>
  );
}

// Essai IA déjà utilisé (cf. lib/visitor.ts, VISITOR_TRIAL_EVENT) : présente
// l'outil, ce que la formation permet d'en faire, et invite à s'inscrire.
// Monté une fois pour toute l'app (App.tsx).
export function VisitorTrialDialog() {
  const th = useTh();
  const [tool, setTool] = useState<string | null>(null);

  useEffect(() => {
    const onTrialUsed = (e: Event) => setTool((e as CustomEvent<{ tool?: string }>).detail?.tool ?? "");
    window.addEventListener(VISITOR_TRIAL_EVENT, onTrialUsed);
    return () => window.removeEventListener(VISITOR_TRIAL_EVENT, onTrialUsed);
  }, []);

  const info = (tool && VISITOR_TOOLS[tool]) || VISITOR_FALLBACK_TOOL;

  return (
    <Dialog open={tool !== null} onOpenChange={(open) => { if (!open) setTool(null); }}>
      <DialogContent className="sm:max-w-lg">
        <div className="space-y-5">
          <div className="space-y-2">
            <p className="eyebrow flex items-center gap-1.5" style={{ color: th.fg3 }}><Sparkles className="w-3.5 h-3.5" />Mode visiteur · essai utilisé</p>
            <DialogTitle className="text-2xl font-black" style={{ color: th.fg }}>{info.name}</DialogTitle>
            <DialogDescription className="text-sm leading-relaxed" style={{ color: th.fg2 }}>{info.what}</DialogDescription>
          </div>

          <div className="rounded-[10px] px-4 py-3.5 space-y-2.5" style={{ background: th.navA, border: `1px solid ${th.sep}` }}>
            <p className="text-sm font-black" style={{ color: th.fg }}>En formation, vous pourrez :</p>
            <ul className="space-y-2">
              {info.inFormation.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm" style={{ color: th.fg2 }}>
                  <Check className="w-4 h-4 mt-0.5 shrink-0" style={{ color: th.fg }} />{item}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-sm leading-relaxed" style={{ color: th.fg2 }}>
            Vous avez testé cet outil gratuitement. Inscrivez-vous à notre formation pour utiliser tous les outils IA de la plateforme, sans limite, avec l'accompagnement de votre formateur.
          </p>

          <div className="space-y-3">
            <a href={SIGNUP_URL} target="_blank" rel="noreferrer" className="sweep flex items-center justify-center gap-2 rounded-[2px] px-5 min-h-11 text-sm font-semibold"
              style={{ background: th.ink, color: th.onInk }}>
              <Sparkles className="w-4 h-4" />Je m'inscris à la formation
            </a>
            <VisitorContacts />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
