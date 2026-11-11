import { useParams, useSearchParams } from "react-router";
import { useTh } from "@/app/theme/theme";
import { PLAYGROUNDS } from "./registry";
import { NativePlayground } from "./NativePlayground";

// Aperçu local d'un Playground natif, sans leçon ni base de données — monté
// uniquement en développement (voir App.tsx, import.meta.env.DEV).
//   /__playground/rs6776-1-1?profil=sirh
//   /__playground/rs6776-1-1?vue=fiche   (fiche de révision)
export default function PlaygroundDevPreview() {
  const th = useTh();
  const { id } = useParams();
  const [search] = useSearchParams();
  const entry = PLAYGROUNDS.find((p) => p.id === id);
  if (!entry) return <p className="p-8" style={{ color: th.fg }}>Playground inconnu : {id}. Disponibles : {PLAYGROUNDS.map((p) => p.id).join(", ")}</p>;
  const { vue, ...params } = Object.fromEntries(search.entries());
  const component = vue === "fiche" && entry.Revision ? entry.Revision : entry.Component;
  return (
    <div className="min-h-screen p-6 md:p-10" style={{ background: th.bg }}>
      <div className="max-w-5xl mx-auto">
        <NativePlayground component={component} params={params} lessonTitle={entry.label} />
      </div>
    </div>
  );
}
