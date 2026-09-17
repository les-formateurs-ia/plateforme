import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { useAuth } from "@/app/state/auth-context";
import { useImpersonation } from "@/app/state/impersonation-context";
import { GT } from "@/app/components/common/GT";
import { GCard } from "@/app/components/common/GCard";
import { ShimBtn } from "@/app/components/common/Buttons";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/app/components/ui/dialog";
import { listStudentCards, listFormateurCards, type StudentCard, type PersonCard } from "@/app/lib/planning";
import { createStudent } from "@/app/lib/students";
import { useStaffBasePath } from "@/app/lib/staffBase";

type PlanningTab = "etudiants" | "formateurs";
const TABS: { id: PlanningTab; label: string }[] = [
  { id: "etudiants", label: "Étudiants" },
  { id: "formateurs", label: "Formateurs" },
];

function formatRegistrationDate(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(iso));
}

function PersonTable({ people, loading, onClick, onImpersonate, impersonatingId }: {
  people: PersonCard[];
  loading: boolean;
  onClick?: (id: string) => void;
  onImpersonate: (id: string) => void;
  impersonatingId: string | null;
}) {
  const th = useTh();
  if (loading) return <p className="text-sm" style={{ color: th.fg3 }}>Chargement…</p>;
  if (!people.length) return <GCard><div className="p-8 text-center"><p className="text-sm" style={{ color: th.fg3 }}>Personne pour l'instant.</p></div></GCard>;
  return (
    <div className="rounded-2xl overflow-hidden overflow-x-auto" style={{ background: th.card, border: `1px solid ${th.inputB}` }}>
      <table className="w-full text-sm" style={{ minWidth: 720 }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${th.sep}` }}>
            <th className="text-left font-semibold px-5 py-3 text-xs uppercase tracking-wide" style={{ color: th.fg3 }}>Nom</th>
            <th className="text-left font-semibold px-5 py-3 text-xs uppercase tracking-wide" style={{ color: th.fg3 }}>Prénom</th>
            <th className="text-left font-semibold px-5 py-3 text-xs uppercase tracking-wide" style={{ color: th.fg3 }}>Email</th>
            <th className="text-left font-semibold px-5 py-3 text-xs uppercase tracking-wide" style={{ color: th.fg3 }}>Téléphone</th>
            <th className="text-left font-semibold px-5 py-3 text-xs uppercase tracking-wide" style={{ color: th.fg3 }}>Date d'inscription</th>
            <th className="px-5 py-3" />
          </tr>
        </thead>
        <tbody>
          {people.map((p) => (
            <tr
              key={p.id}
              onClick={onClick ? () => onClick(p.id) : undefined}
              className={onClick ? "cursor-pointer transition-colors" : undefined}
              style={{ borderBottom: `1px solid ${th.sep}` }}
              onMouseEnter={(e) => { if (onClick) e.currentTarget.style.background = th.inputBg; }}
              onMouseLeave={(e) => { if (onClick) e.currentTarget.style.background = "transparent"; }}
            >
              <td className="px-5 py-3.5 font-bold whitespace-nowrap" style={{ color: th.fg }}>{p.lastName || "—"}</td>
              <td className="px-5 py-3.5 whitespace-nowrap" style={{ color: th.fg2 }}>{p.firstName || "—"}</td>
              <td className="px-5 py-3.5 whitespace-nowrap" style={{ color: th.fg2 }}>{p.email}</td>
              <td className="px-5 py-3.5 whitespace-nowrap" style={{ color: th.fg2 }}>{p.phone || "—"}</td>
              <td className="px-5 py-3.5 whitespace-nowrap" style={{ color: th.fg3 }}>{formatRegistrationDate(p.createdAt)}</td>
              <td className="px-5 py-3.5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                <ShimBtn sm onClick={() => onImpersonate(p.id)} disabled={impersonatingId === p.id}>
                  {impersonatingId === p.id ? "Connexion…" : "Se connecter en tant que"}
                </ShimBtn>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AdminPlanningPage() {
  const th = useTh();
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const { startImpersonation } = useImpersonation();
  const base = useStaffBasePath();
  // Un formateur ne voit que SES élèves (coach attitré, profiles.formateur_id)
  // et n'a pas d'onglet Formateurs — la gestion de l'ensemble du staff reste
  // réservée à l'admin.
  const isAdmin = role === "admin";
  const [students, setStudents] = useState<StudentCard[]>([]);
  const [formateurs, setFormateurs] = useState<PersonCard[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [loadingFormateurs, setLoadingFormateurs] = useState(isAdmin);
  const [tab, setTab] = useState<PlanningTab>("etudiants");

  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [experience, setExperience] = useState("");
  const [objective, setObjective] = useState("");
  const [impersonatingId, setImpersonatingId] = useState<string | null>(null);

  const handleImpersonate = async (id: string) => {
    if (impersonatingId) return;
    setImpersonatingId(id);
    try {
      await startImpersonation(id);
      navigate("/", { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Connexion impossible.");
      setImpersonatingId(null);
    }
  };

  const loadStudents = async () => {
    if (!user) return;
    setLoadingStudents(true);
    const rows = await listStudentCards(isAdmin ? undefined : user.id);
    setStudents(rows);
    setLoadingStudents(false);
  };

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoadingStudents(true);
      const rows = await listStudentCards(isAdmin ? undefined : user.id);
      if (!cancelled) { setStudents(rows); setLoadingStudents(false); }
    })();
    if (isAdmin) {
      (async () => {
        setLoadingFormateurs(true);
        const rows = await listFormateurCards();
        if (!cancelled) { setFormateurs(rows); setLoadingFormateurs(false); }
      })();
    }
    return () => { cancelled = true; };
  }, [user, isAdmin]);

  const openCreate = () => {
    setFirstName(""); setLastName(""); setEmail(""); setPhone(""); setExperience(""); setObjective("");
    setCreateError(null);
    setCreateOpen(true);
  };

  const handleCreateStudent = async () => {
    if (!firstName.trim() || !email.trim() || creating) return;
    setCreating(true);
    setCreateError(null);
    try {
      await createStudent({
        firstName: firstName.trim(),
        lastName: lastName.trim() || undefined,
        email: email.trim(),
        phone: phone.trim() || undefined,
        experience: experience.trim() || undefined,
        objective: objective.trim() || undefined,
      });
      setCreateOpen(false);
      toast.success("Élève créé.");
      await loadStudents();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-2xl font-black" style={{ fontFamily: "'Funnel Display',sans-serif" }}><GT>{isAdmin ? "Élèves & formateurs" : "Élèves"}</GT></h2>
          <p className="text-sm mt-0.5" style={{ color: th.fg3 }}>{isAdmin ? "Gère les élèves et les formateurs de la plateforme." : "Tes élèves."}</p>
        </div>
        {(!isAdmin || tab === "etudiants") && (
          <ShimBtn sm onClick={openCreate}>
            <span className="flex items-center gap-2"><Plus className="w-3.5 h-3.5" />Nouvel élève</span>
          </ShimBtn>
        )}
      </div>

      {isAdmin && (
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
                    ? { background: `linear-gradient(135deg,${th.grad1},${th.grad2})`, color: "#fff", boxShadow: `0 2px 12px ${th.gradShadow(0.35)}` }
                    : { color: th.fg2, background: "transparent" }}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-2">
        {(!isAdmin || tab === "etudiants") && (
          <PersonTable
            people={students}
            loading={loadingStudents}
            onClick={(id) => navigate(`${base}/planning/students/${id}`)}
            onImpersonate={handleImpersonate}
            impersonatingId={impersonatingId}
          />
        )}
        {isAdmin && tab === "formateurs" && (
          <PersonTable
            people={formateurs}
            loading={loadingFormateurs}
            onClick={(id) => navigate(`${base}/planning/formateurs/${id}`)}
            onImpersonate={handleImpersonate}
            impersonatingId={impersonatingId}
          />
        )}
      </div>

      <Dialog open={createOpen} onOpenChange={(v) => !creating && setCreateOpen(v)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvel élève</DialogTitle>
            <DialogDescription>Crée le compte pour que le formateur puisse préparer sa formation. Aucun email n'est envoyé à l'élève.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input value={firstName} onChange={(e) => setFirstName(e.target.value)} autoFocus placeholder="Prénom" className="w-full rounded-xl px-4 py-2.5 text-sm g-input" />
              <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Nom" className="w-full rounded-xl px-4 py-2.5 text-sm g-input" />
            </div>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="email@exemple.com" className="w-full rounded-xl px-4 py-2.5 text-sm g-input" />
            <input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" placeholder="Téléphone (optionnel)" className="w-full rounded-xl px-4 py-2.5 text-sm g-input" />
            <textarea value={experience} onChange={(e) => setExperience(e.target.value)} rows={4} placeholder="Expérience professionnelle (optionnel)" className="w-full rounded-xl px-4 py-2.5 text-sm g-input resize-none" />
            <textarea value={objective} onChange={(e) => setObjective(e.target.value)} rows={4} placeholder="Objectif professionnel (optionnel)" className="w-full rounded-xl px-4 py-2.5 text-sm g-input resize-none" />
          </div>
          {createError && <p className="text-xs" style={{ color: "#fbc2ad" }}>{createError}</p>}
          <DialogFooter>
            <ShimBtn onClick={handleCreateStudent} disabled={!firstName.trim() || !email.trim() || creating}>
              {creating ? "Création…" : "Créer l'élève"}
            </ShimBtn>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
