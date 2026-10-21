// "Ma certification" (élève CPF) : présente la certification RS6776 passée en
// fin de parcours et rappelle que l'examen n'est ouvert qu'une fois toutes
// les leçons terminées. Contenu repris de la plaquette InKréa Certifications.
import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { Award, CalendarClock, CheckCircle, Clock, FileText, Lock, Mic, Video } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { GCard } from "@/app/components/common/GCard";
import { GT } from "@/app/components/common/GT";
import { ShimBtn } from "@/app/components/common/Buttons";
import { isLessonCompleted } from "@/app/lib/learning";
import { useAllCourseProgress } from "@/app/state/useAllCourseProgress";
import { useCertification } from "@/app/state/certification-context";
import { formatDateFR, formatSlotFR, getSoutenance, type SoutenanceInfo } from "@/app/lib/certification";

const SKILLS = [
  { lead: "Définir la stratégie d'implémentation", rest: " de l'IA générative dans un contexte professionnel" },
  { lead: "Utiliser les outils d'IA générative", rest: " pour créer des contenus rédactionnels et visuels efficaces, inclusifs et garantissant la confidentialité des données" },
  { lead: "Évaluer et solutionner les problématiques éthiques et réglementaires", rest: " liées à l'utilisation d'outils d'IA générative" },
];

const STEPS = [
  {
    Icon: FileText,
    eyebrow: "Étape 1 · Écrit",
    title: "6 mises en situation, 10 jours pour rendre ta copie",
    body: "En fin de formation, tu reçois ton sujet : 6 exercices basés sur des mises en situation. Tu disposes de 10 jours pour rendre tes écrits à ton formateur.",
    rule: "Note minimale de 3,5/5 à chaque compétence.",
  },
  {
    Icon: Mic,
    eyebrow: "Étape 2 · Soutenance orale",
    title: "Environ 20 minutes, ~5 jours après tes écrits",
    body: "L'oral te permet de justifier les choix faits à l'écrit, ou de rattraper un exercice dont la note serait insuffisante.",
    rule: "Note minimale de 10/20.",
  },
];

export function CertificationPage() {
  const th = useTh();
  const navigate = useNavigate();
  const { loading, courses } = useAllCourseProgress();
  const { exam } = useCertification();
  const [soutenance, setSoutenance] = useState<SoutenanceInfo | null>(null);

  useEffect(() => {
    if (!exam?.rendezVousId) { setSoutenance(null); return; }
    getSoutenance(exam.rendezVousId).then(setSoutenance).catch(console.error);
  }, [exam?.rendezVousId]);

  const states = courses.flatMap((c) => c.lessonStates);
  const total = states.length;
  const done = states.filter(isLessonCompleted).length;
  const remaining = total - done;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const ready = total > 0 && remaining === 0;

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8">
      <div className="mb-8 fade-up">
        <p className="eyebrow" style={{ color: th.fg3 }}>Apprendre</p>
        <h1 className="mt-2 text-[2rem] sm:text-[2.6rem] leading-[1.02] font-black" style={{ color: th.fg }}>Ma <GT>certification</GT></h1>
        <p className="text-[15px] sm:text-base mt-3 max-w-2xl leading-relaxed" style={{ color: th.fg2 }}>
          Ta formation prépare la certification RS6776 « Création de contenus rédactionnels et visuels par l'usage responsable de l'intelligence artificielle générative », enregistrée auprès de France Compétences.
        </p>
      </div>

      <div className="space-y-8">
        {exam?.status === "submitted" ? (
          <GCard accent>
            <div className="p-5 sm:p-6 space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(106,222,177,0.14)", color: th.success }}>
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-base font-bold" style={{ color: th.fg }}>Ton écrit est validé</p>
                  <p className="text-sm mt-1 leading-relaxed" style={{ color: th.fg2 }}>
                    Transmis le {exam.submittedAt ? formatDateFR(exam.submittedAt, true) : "—"}. Prochaine étape : ta soutenance orale.
                  </p>
                </div>
              </div>
              {soutenance && (
                <div className="rounded-[6px] p-4 flex flex-col sm:flex-row sm:items-center gap-3" style={{ background: th.inputBg }}>
                  <CalendarClock className="w-5 h-5 shrink-0" style={{ color: th.fg }} />
                  <p className="text-sm flex-1" style={{ color: th.fg }}>
                    Soutenance le <strong className="first-letter:uppercase">{formatSlotFR(soutenance.slotDate, soutenance.startTime)}</strong>
                    {soutenance.examinerName ? <> avec <strong>{soutenance.examinerName}</strong></> : null}, en visio (environ 20 minutes).
                  </p>
                  {soutenance.meetLink && (
                    <a href={soutenance.meetLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm font-semibold underline" style={{ color: th.fg }}>
                      <Video className="w-4 h-4" />Lien de la visio
                    </a>
                  )}
                </div>
              )}
            </div>
          </GCard>
        ) : exam?.status === "in_progress" ? (
          <GCard accent>
            <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4">
              <p className="text-base font-bold flex-1" style={{ color: th.fg }}>Ton épreuve écrite est ouverte.</p>
              <ShimBtn sm onClick={() => navigate("/certification/ecrit")}>Accéder à mon écrit</ShimBtn>
            </div>
          </GCard>
        ) : (
        /* Rappel : l'examen s'ouvre une fois toutes les leçons terminées. */
        <GCard accent>
          <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0" style={{ background: ready ? "rgba(106,222,177,0.14)" : th.inputBg, color: ready ? th.success : th.fg }}>
              {ready ? <CheckCircle className="w-6 h-6" /> : <Lock className="w-5 h-5" />}
            </div>
            <div className="flex-1 min-w-0">
              {loading ? (
                <p className="text-sm" style={{ color: th.fg3 }}>Chargement de ta progression…</p>
              ) : ready ? (
                <>
                  <p className="text-base font-bold" style={{ color: th.fg }}>Bravo, tu as terminé toutes tes leçons !</p>
                  <p className="text-sm mt-1 leading-relaxed" style={{ color: th.fg2 }}>
                    Tu peux maintenant passer ta certification. Ton épreuve écrite s'ouvrira ici dès son lancement : tu auras alors 10 jours pour la remplir, puis tu réserveras ta soutenance orale.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-base font-bold" style={{ color: th.fg }}>Tu pourras passer ta soutenance une fois toutes tes leçons terminées</p>
                  <p className="text-sm mt-1 leading-relaxed" style={{ color: th.fg2 }}>
                    {total === 0
                      ? "Aucune formation n'est encore attribuée à ton compte. Ton parcours apparaîtra ici dès qu'il sera prêt."
                      : `Encore ${remaining} leçon${remaining > 1 ? "s" : ""} à valider avant de recevoir ton sujet d'examen. Continue comme ça !`}
                  </p>
                </>
              )}
              {!loading && total > 0 && (
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs font-semibold mb-1.5" style={{ color: th.fg3 }}>
                    <span>{done}/{total} leçon{total > 1 ? "s" : ""} terminée{done > 1 ? "s" : ""}</span>
                    <span style={{ color: th.fg }}>{pct}%</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: th.inputBg }}>
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: th.iris }} />
                  </div>
                </div>
              )}
            </div>
            {!loading && !ready && total > 0 && (
              <div className="shrink-0">
                <ShimBtn sm onClick={() => navigate("/lessons")}>Continuer mes leçons</ShimBtn>
              </div>
            )}
          </div>
        </GCard>
        )}

        <section>
          <h2 className="text-xl font-black mb-1" style={{ color: th.fg }}>Ce que la certification atteste</h2>
          <p className="text-sm mb-4" style={{ color: th.fg2 }}>La première certification dédiée à l'usage des outils d'IA valide trois compétences :</p>
          <div className="grid gap-3">
            {SKILLS.map((s, i) => (
              <GCard key={s.lead}>
                <div className="p-4 flex gap-4 items-start">
                  <span className="text-sm font-black w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: th.ink, color: th.onInk }}>{i + 1}</span>
                  <p className="text-sm leading-relaxed" style={{ color: th.fg2 }}><strong style={{ color: th.fg }}>{s.lead}</strong>{s.rest}</p>
                </div>
              </GCard>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-black mb-1" style={{ color: th.fg }}>Comment se passe l'examen ?</h2>
          <p className="text-sm mb-4" style={{ color: th.fg2 }}>L'examen est organisé en deux temps, une fois tes leçons terminées.</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {STEPS.map(({ Icon, eyebrow, title, body, rule }) => (
              <GCard key={eyebrow}>
                <div className="p-5 h-full flex flex-col">
                  <div className="flex items-center gap-2 mb-3" style={{ color: th.fg3 }}>
                    <Icon className="w-4 h-4" />
                    <span className="eyebrow">{eyebrow}</span>
                  </div>
                  <p className="text-base font-bold mb-2" style={{ color: th.fg }}>{title}</p>
                  <p className="text-sm leading-relaxed flex-1" style={{ color: th.fg2 }}>{body}</p>
                  <p className="text-sm font-semibold mt-4 pt-3 flex items-center gap-2" style={{ color: th.fg, borderTop: `1px solid ${th.sep}` }}>
                    <Award className="w-4 h-4 shrink-0" />{rule}
                  </p>
                </div>
              </GCard>
            ))}
          </div>
          <p className="text-xs mt-3 flex items-center gap-1.5" style={{ color: th.fg3 }}>
            <Clock className="w-3.5 h-3.5" />Compte environ 15 jours entre la réception du sujet et la soutenance.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-black mb-1" style={{ color: th.fg }}>Pourquoi la passer ?</h2>
          <p className="text-sm leading-relaxed" style={{ color: th.fg2 }}>
            Obtenir cette certification valorise ton profil professionnel et améliore ton employabilité et ta productivité, dans un monde où la maîtrise des outils d'IA générative est de plus en plus recherchée par les entreprises.
          </p>
        </section>

      </div>
    </div>
  );
}
