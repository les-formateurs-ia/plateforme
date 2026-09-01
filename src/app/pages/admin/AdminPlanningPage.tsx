import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useTh } from "@/app/theme/theme";
import { GT } from "@/app/components/common/GT";
import { GCard } from "@/app/components/common/GCard";
import { Avatar } from "@/app/components/common/Avatar";
import { listStudentCards, listFormateurCards, type StudentCard, type PersonCard } from "@/app/lib/planning";
import { AdminAvailabilityPage } from "@/app/pages/admin/AdminAvailabilityPage";

type PlanningTab = "etudiants" | "formateurs" | "rendez-vous";
const TABS: { id: PlanningTab; label: string }[] = [
  { id: "etudiants", label: "Étudiants" },
  { id: "formateurs", label: "Formateurs" },
  { id: "rendez-vous", label: "Rendez-vous" },
];

function personName(p: PersonCard): string {
  const full = [p.firstName, p.lastName].filter(Boolean).join(" ").trim();
  return full || p.email;
}

function PersonGrid({ people, loading, onClick, subtitle }: {
  people: PersonCard[];
  loading: boolean;
  onClick?: (id: string) => void;
  subtitle?: (p: PersonCard) => string;
}) {
  const th = useTh();
  if (loading) return <p className="text-sm" style={{ color: th.fg3 }}>Chargement…</p>;
  if (!people.length) return <GCard><div className="p-8 text-center"><p className="text-sm" style={{ color: th.fg3 }}>Personne pour l'instant.</p></div></GCard>;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {people.map((p) => (
        <GCard key={p.id} onClick={onClick ? () => onClick(p.id) : undefined} className={onClick ? "hover:scale-[1.02] transition-transform" : undefined}>
          <div className="p-4 flex flex-col items-center text-center gap-2.5">
            <Avatar url={p.avatarUrl} size={72} square />
            <div className="min-w-0 w-full">
              <div className="text-sm font-bold truncate" style={{ color: th.fg }}>{personName(p)}</div>
              {subtitle && (
                <div className="text-xs truncate mt-0.5" style={{ color: th.fg3, opacity: 0.65 }}>{subtitle(p)}</div>
              )}
            </div>
          </div>
        </GCard>
      ))}
    </div>
  );
}

export function AdminPlanningPage() {
  const th = useTh();
  const navigate = useNavigate();
  const [students, setStudents] = useState<StudentCard[]>([]);
  const [formateurs, setFormateurs] = useState<PersonCard[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [loadingFormateurs, setLoadingFormateurs] = useState(true);
  const [tab, setTab] = useState<PlanningTab>("etudiants");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingStudents(true);
      const rows = await listStudentCards();
      if (!cancelled) { setStudents(rows); setLoadingStudents(false); }
    })();
    (async () => {
      setLoadingFormateurs(true);
      const rows = await listFormateurCards();
      if (!cancelled) { setFormateurs(rows); setLoadingFormateurs(false); }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-6">
      <div>
        <h2 className="text-2xl font-black" style={{ fontFamily: "'Funnel Display',sans-serif" }}><GT>Planning</GT></h2>
        <p className="text-sm mt-0.5" style={{ color: th.fg3 }}>Élèves, formateurs et rendez-vous.</p>
      </div>

      <div className="flex justify-center">
        <div className="inline-flex items-center gap-1.5 p-1.5 rounded-full" style={{ background: th.inputBg, border: `1px solid ${th.inputB}` }}>
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="px-7 py-3 rounded-full text-sm font-bold transition-all"
                style={active
                  ? { background: "linear-gradient(135deg,#b58de0,#dbacf0)", color: "#fff", boxShadow: "0 2px 12px rgba(181,141,224,0.35)" }
                  : { color: th.fg2, background: "transparent" }}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-2">
        {tab === "etudiants" && (
          <PersonGrid
            people={students}
            loading={loadingStudents}
            onClick={(id) => navigate(`/admin/planning/students/${id}`)}
            subtitle={(p) => (p as StudentCard).activeFormationName || "—"}
          />
        )}
        {tab === "formateurs" && <PersonGrid people={formateurs} loading={loadingFormateurs} />}
        {tab === "rendez-vous" && <AdminAvailabilityPage embedded />}
      </div>
    </div>
  );
}
