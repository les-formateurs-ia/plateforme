import { useNavigate } from "react-router";
import { useTh } from "@/app/theme/theme";
import { GT } from "@/app/components/common/GT";
import { BarChart3, Brain, Gauge, Swords } from "lucide-react";
import { AI_CATEGORIES } from "@/app/data/aiModels";
import { AA_URL, formatFetchedAt, useAiBenchmarks } from "@/app/lib/aiBenchmarks";

export function HubPage() {
  const th = useTh();
  const navigate = useNavigate();

  return (
    <div className="flex-1 overflow-y-auto flex items-center justify-center px-4 py-10">
      <div className="text-center max-w-2xl">
        <h1 className="text-3xl sm:text-4xl font-black" style={{ fontFamily: "'Funnel Display',sans-serif", color: th.fg }}>
          Hub <GT>IA</GT>
        </h1>
        <p className="text-sm mt-2 mb-8" style={{ color: th.fg3 }}>Que souhaitez-vous faire ?</p>
        <div className="flex flex-wrap justify-center gap-3">
          {AI_CATEGORIES.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => navigate(`/hub/${id}`)}
              className="flex items-center gap-2 px-5 py-3 rounded-[2px] text-sm font-semibold transition-all hover:opacity-85 active:scale-[0.98]"
              style={{ background: th.card, border: `1px solid ${th.sep}`, color: th.fg }}
            >
              <Icon className="w-4 h-4 shrink-0" style={{ color: th.navAC }} />
              {label}
            </button>
          ))}
        </div>

        <MethodologyBlock />
      </div>
    </div>
  );
}

const METHOD_POINTS = [
  {
    Icon: Brain,
    title: "Texte : l'Intelligence Index",
    text: "Une moyenne de 9 tests exigeants, en 4 blocs de même poids : travail de bureau (vrais dossiers d'entreprise), code, sciences et culture générale (où inventer une réponse fait perdre des points). Vitesse et prix sont mesurés en conditions réelles.",
  },
  {
    Icon: Swords,
    title: "Image, vidéo, voix, musique : l'Elo",
    text: "Des milliers de personnes comparent à l'aveugle deux résultats créés à partir de la même consigne et votent pour le meilleur. Comme aux échecs, chaque victoire fait monter le score Elo du modèle.",
  },
  {
    Icon: Gauge,
    title: "Nos notes sur 10",
    text: "Elles situent chaque modèle dans le classement complet : 10 = le premier, 5 = au milieu. Pour le prix, 10 = parmi les moins chers. Sans classement public (outils, assistants…), la note est un avis de notre équipe, signalé « Avis éditorial ».",
  },
];

function MethodologyBlock() {
  const th = useTh();
  const snapshot = useAiBenchmarks();
  const date = formatFetchedAt(snapshot);
  return (
    <section className="mt-12 text-left rounded-2xl p-5 sm:p-6" style={{ background: th.card, border: `1px solid ${th.sep}` }}>
      <h2 className="text-base font-black flex items-center gap-2" style={{ color: th.fg }}>
        <BarChart3 className="w-4 h-4" style={{ color: th.navAC }} />Comment notons-nous les IA ?
      </h2>
      <p className="text-sm mt-1.5" style={{ color: th.fg2 }}>
        Nos notes s'appuient sur{" "}
        <a href={AA_URL} target="_blank" rel="noreferrer" className="font-semibold underline underline-offset-2" style={{ color: th.navAC }}>Artificial Analysis</a>,
        un laboratoire indépendant qui teste les modèles d'IA avec les mêmes épreuves pour tous. Les classements sont mis à jour automatiquement chaque semaine.
      </p>
      <div className="grid gap-4 sm:grid-cols-3 mt-5">
        {METHOD_POINTS.map(({ Icon, title, text }) => (
          <div key={title}>
            <div className="text-sm font-bold flex items-center gap-1.5" style={{ color: th.fg }}>
              <Icon className="w-4 h-4 shrink-0" style={{ color: th.navAC }} />{title}
            </div>
            <p className="text-xs leading-relaxed mt-1.5" style={{ color: th.fg3 }}>{text}</p>
          </div>
        ))}
      </div>
      {date && <p className="text-[11px] mt-5" style={{ color: th.fg3 }}>Dernière mise à jour des données : {date}.</p>}
    </section>
  );
}
