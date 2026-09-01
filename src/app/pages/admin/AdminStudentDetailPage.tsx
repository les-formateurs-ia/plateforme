import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router";
import { toast } from "sonner";
import { ChevronLeft, Sparkles, X } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { supabase } from "@/app/lib/supabase/client";
import { GCard } from "@/app/components/common/GCard";
import { GT } from "@/app/components/common/GT";
import { Avatar } from "@/app/components/common/Avatar";
import { VBtn, ShimBtn } from "@/app/components/common/Buttons";
import { VSelect } from "@/app/components/common/Select";
import {
  listInstancesForStudent, listPublishedTemplates, assignFormationToStudent,
  updateInstanceStatus, deleteInstance, type FormationInstanceRow, type PublishedTemplate,
} from "@/app/lib/formationInstances";
import { listCoachAssignableCards, assignFormateurToStudent, type PersonCard } from "@/app/lib/planning";
import type { EnrollmentStatus } from "@/app/lib/supabase/database.types";

interface StudentProfile { id: string; first_name: string | null; last_name: string | null; email: string; avatar_url: string | null; formateur_id: string | null; }

const STATUS_LABEL: Record<EnrollmentStatus, { label: string; color: string; bg: string }> = {
  active: { label: "Active", color: "#6adeb1", bg: "rgba(106,222,177,0.1)" },
  paused: { label: "En pause", color: "#fbc2ad", bg: "rgba(251,194,173,0.1)" },
  completed: { label: "Terminée", color: "#94A3B8", bg: "rgba(148,163,184,0.1)" },
};

export function AdminStudentDetailPage() {
  const th = useTh();
  const navigate = useNavigate();
  const { studentId } = useParams();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [instances, setInstances] = useState<FormationInstanceRow[]>([]);
  const [templates, setTemplates] = useState<PublishedTemplate[]>([]);
  const [formateurs, setFormateurs] = useState<PersonCard[]>([]);
  const [templateToAssign, setTemplateToAssign] = useState("");
  const [formateurToAssign, setFormateurToAssign] = useState("");
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [assigningFormateur, setAssigningFormateur] = useState(false);

  const load = async () => {
    if (!studentId) return;
    setLoading(true);
    const [{ data: p }, instanceRows, templateRows, formateurRows] = await Promise.all([
      supabase.from("profiles").select("id, first_name, last_name, email, avatar_url, formateur_id").eq("id", studentId).single(),
      listInstancesForStudent(studentId),
      listPublishedTemplates(),
      listCoachAssignableCards(),
    ]);
    setProfile(p ?? null);
    setInstances(instanceRows);
    setTemplates(templateRows);
    setFormateurs(formateurRows);
    setFormateurToAssign(p?.formateur_id ?? "");
    setLoading(false);
  };

  useEffect(() => { void load(); }, [studentId]);

  const assign = async () => {
    if (!studentId || !templateToAssign) return;
    setAssigning(true);
    try {
      const instanceId = await assignFormationToStudent(templateToAssign, studentId);
      toast.success("Formation attribuée.");
      setTemplateToAssign("");
      navigate(`/admin/instances/${instanceId}`);
    } catch (err) {
      console.error(err);
      toast.error("Impossible d'attribuer cette formation.");
    } finally {
      setAssigning(false);
    }
  };

  const assignFormateur = async (formateurId: string) => {
    if (!studentId) return;
    setAssigningFormateur(true);
    try {
      await assignFormateurToStudent(studentId, formateurId || null);
      setFormateurToAssign(formateurId);
      toast.success("Formateur attribué.");
    } catch (err) {
      console.error(err);
      toast.error("Impossible d'attribuer ce formateur.");
    } finally {
      setAssigningFormateur(false);
    }
  };

  const changeStatus = async (instanceId: string, status: EnrollmentStatus) => {
    try {
      await updateInstanceStatus(instanceId, status);
      setInstances((rows) => rows.map((r) => (r.id === instanceId ? { ...r, status } : r)));
    } catch (err) {
      console.error(err);
      toast.error("Impossible de mettre à jour le statut.");
    }
  };

  const remove = async (instanceId: string) => {
    if (!confirm("Retirer cette formation à l'élève ? Sa progression sur ce duplicata sera perdue.")) return;
    try {
      await deleteInstance(instanceId);
      setInstances((rows) => rows.filter((r) => r.id !== instanceId));
    } catch (err) {
      console.error(err);
      toast.error("Impossible de retirer cette formation.");
    }
  };

  if (loading) return <div className="flex-1 flex items-center justify-center"><p className="text-sm" style={{ color: th.fg3 }}>Chargement…</p></div>;
  if (!profile) return <div className="flex-1 flex items-center justify-center"><p className="text-sm" style={{ color: th.fg3 }}>Élève introuvable.</p></div>;

  const name = [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim() || profile.email;

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-6">
      <Link to="/admin/planning" className="flex items-center gap-1.5 text-sm w-fit transition-colors hover:opacity-70" style={{ color: th.fg3 }}><ChevronLeft className="w-4 h-4" />Élèves</Link>

      <div className="flex items-center gap-4">
        <Avatar url={profile.avatar_url} size={64} square />
        <div className="min-w-0">
          <h2 className="text-xl font-black truncate" style={{ color: th.fg }}><GT>{name}</GT></h2>
          <p className="text-sm truncate" style={{ color: th.fg3 }}>{profile.email}</p>
        </div>
      </div>

      <GCard><div className="p-6">
        <h3 className="text-sm font-black mb-4" style={{ color: th.fg }}>Formateur</h3>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex-1 min-w-[220px]">
            <VSelect
              value={formateurToAssign}
              onValueChange={assignFormateur}
              placeholder="Choisir un formateur…"
              options={formateurs.map((f) => ({ value: f.id, label: [f.firstName, f.lastName].filter(Boolean).join(" ").trim() || f.email }))}
              disabled={assigningFormateur}
            />
          </div>
        </div>
        {!formateurs.length && <p className="text-xs mt-3" style={{ color: th.fg3 }}>Aucun formateur pour l'instant.</p>}
      </div></GCard>

      <GCard><div className="p-6">
        <h3 className="text-sm font-black mb-4" style={{ color: th.fg }}>Formations attribuées</h3>
        <div className="space-y-2 mb-4">
          {instances.map((inst) => {
            const sc = STATUS_LABEL[inst.status];
            return (
              <div key={inst.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl flex-wrap" style={{ background: th.isDark ? "rgba(255,255,255,0.03)" : "rgba(181,141,224,0.04)", border: `1px solid ${th.sep}` }}>
                <span className="flex-1 min-w-0 text-sm font-semibold truncate" style={{ color: th.fg }}>{inst.name}</span>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0" style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.color}30` }}>{sc.label}</span>
                <div className="w-36 shrink-0">
                  <VSelect
                    sm
                    value={inst.status}
                    onValueChange={(v) => changeStatus(inst.id, v as EnrollmentStatus)}
                    options={[
                      { value: "active", label: "Active" },
                      { value: "paused", label: "En pause" },
                      { value: "completed", label: "Terminée" },
                    ]}
                  />
                </div>
                <VBtn sm onClick={() => navigate(`/admin/instances/${inst.id}`)}>Personnaliser</VBtn>
                <button onClick={() => remove(inst.id)} title="Retirer"><X className="w-4 h-4" style={{ color: th.fg3 }} /></button>
              </div>
            );
          })}
          {!instances.length && <p className="text-xs" style={{ color: th.fg3 }}>Aucune formation attribuée pour l'instant.</p>}
        </div>
      </div></GCard>

      <GCard><div className="p-6">
        <h3 className="text-sm font-black mb-4" style={{ color: th.fg }}>Attribuer une formation</h3>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex-1 min-w-[220px]">
            <VSelect
              value={templateToAssign}
              onValueChange={setTemplateToAssign}
              placeholder="Choisir une formation publiée…"
              options={templates.map((t) => ({ value: t.id, label: t.name }))}
            />
          </div>
          <ShimBtn sm onClick={assign} disabled={assigning || !templateToAssign}>
            <span className="flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" />{assigning ? "Attribution…" : "Attribuer"}</span>
          </ShimBtn>
        </div>
        {!templates.length && <p className="text-xs mt-3" style={{ color: th.fg3 }}>Aucune formation publiée pour l'instant.</p>}
      </div></GCard>
    </div>
  );
}
