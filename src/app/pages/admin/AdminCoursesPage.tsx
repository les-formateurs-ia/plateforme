import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Plus, BookOpen, Users, Eye, Trash2 } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { supabase } from "@/app/lib/supabase/client";
import { GCard } from "@/app/components/common/GCard";
import { GT } from "@/app/components/common/GT";
import { ShimBtn, VBtn } from "@/app/components/common/Buttons";
import { previewFormationAsStaff } from "@/app/lib/learning";
import { softDeleteFormation } from "@/app/lib/formations";
import { useAuth } from "@/app/state/auth-context";
import { isAdmin } from "@/app/lib/permissions";
import { useStaffBasePath } from "@/app/lib/staffBase";

interface FormationRow {
  id: string;
  name: string;
  description: string | null;
  status: string;
  section_count: number;
  instance_count: number;
}

const STATUS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: "Brouillon", color: "#fbc2ad", bg: "rgba(251,194,173,0.1)" },
  published: { label: "Publié", color: "#6adeb1", bg: "rgba(106,222,177,0.1)" },
  archived: { label: "Archivé", color: "#94A3B8", bg: "rgba(148,163,184,0.1)" },
};

export function AdminCoursesPage() {
  const th = useTh();
  const navigate = useNavigate();
  const { role } = useAuth();
  const admin = isAdmin(role);
  const base = useStaffBasePath();
  const [courses, setCourses] = useState<FormationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const removeCourse = async (formationId: string) => {
    if (!confirm("Mettre cette formation à la corbeille ? Elle ne sera plus visible ni attribuable tant qu'elle n'est pas restaurée.")) return;
    setDeletingId(formationId);
    try {
      await softDeleteFormation(formationId);
      setCourses((rows) => rows.filter((r) => r.id !== formationId));
      toast.success("Formation déplacée dans la corbeille.");
    } catch (err) {
      console.error(err);
      toast.error("Impossible de supprimer cette formation.");
    } finally {
      setDeletingId(null);
    }
  };

  // Un template n'a pas d'instance_lessons (mindmap/podcast/vidéo IA/agent/
  // quiz en dépendent) — on génère donc une prévisualisation dédiée côté
  // serveur avant d'ouvrir l'aperçu, pour que tout fonctionne comme pour un
  // élève (cf. migration 0026).
  const openPreview = async (formationId: string) => {
    if (previewingId) return;
    setPreviewingId(formationId);
    try {
      const previewInstanceId = await previewFormationAsStaff(formationId);
      window.open(`${base}/instances/${previewInstanceId}/preview`, "_blank", "noopener");
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Impossible de générer la prévisualisation.");
    } finally {
      setPreviewingId(null);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data: formations } = await supabase
        .from("formations")
        .select("id, name, description, status")
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (!formations) { if (!cancelled) { setCourses([]); setLoading(false); } return; }

      const [{ data: sections }, { data: instances }] = await Promise.all([
        supabase.from("sections").select("id, formation_id"),
        supabase.from("formation_instances").select("id, template_id"),
      ]);

      if (cancelled) return;
      setCourses(formations.map((f) => ({
        ...f,
        section_count: sections?.filter((s) => s.formation_id === f.id).length ?? 0,
        instance_count: instances?.filter((i) => i.template_id === f.id).length ?? 0,
      })));
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-2xl font-black" style={{ fontFamily: "'Funnel Display',sans-serif" }}><GT>Gestion des formations</GT></h2>
          <p className="text-sm mt-0.5" style={{ color: th.fg3 }}>Modèles de formation — à attribuer aux élèves depuis la fiche élève.</p>
        </div>
        <div className="flex items-center gap-2">
          {admin && (
            <VBtn onClick={() => navigate("/admin/courses/trash")}>
              <span className="flex items-center gap-2"><Trash2 className="w-4 h-4" />Corbeille</span>
            </VBtn>
          )}
          <ShimBtn onClick={() => navigate(`${base}/courses/new`)}>
            <span className="flex items-center gap-2"><Plus className="w-4 h-4" />Nouvelle formation</span>
          </ShimBtn>
        </div>
      </div>

      {loading && <p className="text-sm" style={{ color: th.fg3 }}>Chargement…</p>}

      {!loading && courses.length === 0 && (
        <GCard><div className="p-8 text-center">
          <p className="text-sm" style={{ color: th.fg3 }}>Aucun cours pour l'instant.</p>
        </div></GCard>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {courses.map((c) => {
          const sc = STATUS_LABEL[c.status] ?? STATUS_LABEL.draft;
          return (
            <GCard key={c.id} onClick={() => navigate(`${base}/courses/${c.id}`)} className="hover:scale-[1.01] transition-transform">
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-sm font-black" style={{ color: th.fg }}>{c.name}</h3>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0" style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.color}30` }}>{sc.label}</span>
                </div>
                <p className="text-xs leading-relaxed mb-4 line-clamp-2" style={{ color: th.fg3 }}>{c.description || "Pas de description."}</p>
                <div className="flex items-center gap-4 text-xs" style={{ color: th.fg3 }}>
                  <span className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5" />{c.section_count} module{c.section_count > 1 ? "s" : ""}</span>
                  <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />{c.instance_count} attribution{c.instance_count > 1 ? "s" : ""}</span>
                  <button type="button" onClick={(e) => { e.stopPropagation(); void openPreview(c.id); }} disabled={previewingId === c.id}
                    className="ml-auto flex items-center justify-center shrink-0 transition-opacity hover:opacity-70 disabled:opacity-40 disabled:pointer-events-none"
                    style={{ color: th.navAC }} title="Visualiser comme un élève">
                    <Eye className="w-12 h-12" />
                  </button>
                  {admin && (
                    <button type="button" onClick={(e) => { e.stopPropagation(); void removeCourse(c.id); }} disabled={deletingId === c.id}
                      className="flex items-center justify-center shrink-0 transition-opacity hover:opacity-70 disabled:opacity-40 disabled:pointer-events-none"
                      style={{ color: th.fg3 }} title="Supprimer">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </GCard>
          );
        })}
      </div>
    </div>
  );
}
