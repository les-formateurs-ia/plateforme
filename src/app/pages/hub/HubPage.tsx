import { useNavigate } from "react-router";
import { useTh } from "@/app/theme/theme";
import { GT } from "@/app/components/common/GT";
import { AI_CATEGORIES } from "@/app/data/aiModels";

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
              className="flex items-center gap-2 px-5 py-3 rounded-full text-sm font-semibold transition-all hover:opacity-85 active:scale-[0.98]"
              style={{ background: th.card, border: `1px solid ${th.sep}`, color: th.fg }}
            >
              <Icon className="w-4 h-4 shrink-0" style={{ color: th.navAC }} />
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
