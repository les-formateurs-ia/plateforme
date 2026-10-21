// Accueil de l'élève pendant l'épreuve écrite (remplace le tableau de bord,
// cf. DashboardRoute) : décompte des 10 jours, avancement et accès à l'écrit.
import { useNavigate } from "react-router";
import { CalendarClock, FileText, Hourglass, Mic, Sparkles } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { useProfile } from "@/app/state/profile-context";
import { useCertification } from "@/app/state/certification-context";
import { GCard } from "@/app/components/common/GCard";
import { GT } from "@/app/components/common/GT";
import { ShimBtn } from "@/app/components/common/Buttons";
import { countAnswered, daysLeft, formatDateFR } from "@/app/lib/certification";

export function CertificationExamHome() {
  const th = useTh();
  const navigate = useNavigate();
  const { profile } = useProfile();
  const { exam } = useCertification();
  if (!exam) return null;

  const firstName = profile.name.split(" ")[0] || "";
  const left = daysLeft(exam.deadlineAt);
  const late = new Date(exam.deadlineAt).getTime() < Date.now();
  const { answered, total } = countAnswered(exam.answers);
  const pct = Math.round((answered / total) * 100);

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8">
      <div className="space-y-8">
        <div className="fade-up">
          <p className="eyebrow" style={{ color: th.fg3 }}>Certification RS6776</p>
          <h1 className="mt-2 text-[2rem] sm:text-[2.6rem] leading-[1.02] font-black" style={{ color: th.fg }}>
            C'est le moment, <GT>{firstName || "à toi"}</GT>
          </h1>
          <p className="text-[15px] sm:text-base mt-3 max-w-2xl leading-relaxed" style={{ color: th.fg2 }}>
            Ton épreuve écrite de certification est ouverte. Pendant cette période, ton espace est réservé à l'épreuve : seul Le Studio (texte et image) reste accessible pour t'aider à répondre.
          </p>
        </div>

        <div className="rounded-[10px] p-6 sm:p-8 fade-up" style={{ background: th.iris, color: "#111" }}>
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            <div className="flex items-center gap-4 shrink-0">
              <Hourglass className="w-8 h-8 shrink-0" />
              <div>
                <div className="text-[3.5rem] leading-none font-black">{left}</div>
                <div className="text-sm font-semibold uppercase tracking-wide opacity-80">jour{left > 1 ? "s" : ""} restant{left > 1 ? "s" : ""}</div>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-lg font-bold">{late ? "Le délai de 10 jours est dépassé" : "pour valider ton dossier écrit"}</p>
              <p className="text-sm mt-1 opacity-80">
                {late ? "Valide ton écrit au plus vite et préviens ton formateur." : `À rendre avant le ${formatDateFR(exam.deadlineAt, true)}.`}
              </p>
              <div className="mt-4">
                <div className="flex justify-between text-xs font-semibold mb-1.5 opacity-80">
                  <span>{answered}/{total} réponses complétées</span><span>{pct}%</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.12)" }}>
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: "#111" }} />
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <button type="button" onClick={() => navigate("/certification/ecrit")}
              className="inline-flex items-center gap-2 px-5 min-h-11 rounded-[2px] text-sm font-bold transition-opacity hover:opacity-80" style={{ background: "#111", color: "#fff" }}>
              <FileText className="w-4 h-4" />{answered > 0 ? "Continuer mon écrit" : "Commencer mon écrit"}
            </button>
            <button type="button" onClick={() => navigate("/studio")}
              className="inline-flex items-center gap-2 px-5 min-h-11 rounded-[2px] text-sm font-bold transition-opacity hover:opacity-80" style={{ border: "1px solid #111", color: "#111" }}>
              <Sparkles className="w-4 h-4" />Ouvrir Le Studio
            </button>
          </div>
        </div>

        <section>
          <h2 className="text-xl font-black mb-4" style={{ color: th.fg }}>Comment ça se passe ?</h2>
          <div className="grid sm:grid-cols-3 gap-3">
            {[
              { Icon: FileText, title: "1. Réponds aux 6 exercices", body: "Des mises en situation à traiter avec les outils d'IA générative. Enregistre tes réponses en brouillon autant que tu veux." },
              { Icon: CalendarClock, title: "2. Valide et réserve ton oral", body: "Au moment de valider ton écrit, tu choisis immédiatement le créneau de ta soutenance. Une fois validé, l'écrit n'est plus modifiable." },
              { Icon: Mic, title: "3. Passe ta soutenance", body: "Environ 20 minutes pour justifier tes choix ou rattraper un exercice. Note minimale : 3,5/5 par compétence à l'écrit, 10/20 à l'oral." },
            ].map(({ Icon, title, body }) => (
              <GCard key={title}>
                <div className="p-5">
                  <Icon className="w-5 h-5 mb-3" style={{ color: th.fg }} />
                  <p className="text-[15px] font-bold mb-1.5" style={{ color: th.fg }}>{title}</p>
                  <p className="text-sm leading-relaxed" style={{ color: th.fg2 }}>{body}</p>
                </div>
              </GCard>
            ))}
          </div>
        </section>

        <div className="pb-4">
          <ShimBtn onClick={() => navigate("/certification/ecrit")}>{answered > 0 ? "Reprendre mon écrit" : "Commencer mon écrit"}</ShimBtn>
        </div>
      </div>
    </div>
  );
}
