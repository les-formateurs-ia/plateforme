import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Plus, BookOpen, Users, ChevronRight } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { supabase } from "@/app/lib/supabase/client";
import { GCard } from "@/app/components/common/GCard";
import { GT } from "@/app/components/common/GT";
import { ShimBtn } from "@/app/components/common/Buttons";

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
  const [courses, setCourses] = useState<FormationRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data: formations } = await supabase
        .from("formations")
        .select("id, name, description, status")
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
          <h2 className="text-2xl font-black" style={{ fontFamily: "'Funnel Display',sans-serif" }}><GT>Gestion des cours</GT></h2>
          <p className="text-sm mt-0.5" style={{ color: th.fg3 }}>Modèles de formation — à attribuer aux élèves depuis Planning.</p>
        </div>
        <ShimBtn onClick={() => navigate("/admin/courses/new")}>
          <span className="flex items-center gap-2"><Plus className="w-4 h-4" />Nouveau cours</span>
        </ShimBtn>
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
            <GCard key={c.id} onClick={() => navigate(`/admin/courses/${c.id}`)} className="hover:scale-[1.01] transition-transform">
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-sm font-black" style={{ color: th.fg }}>{c.name}</h3>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0" style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.color}30` }}>{sc.label}</span>
                </div>
                <p className="text-xs leading-relaxed mb-4 line-clamp-2" style={{ color: th.fg3 }}>{c.description || "Pas de description."}</p>
                <div className="flex items-center gap-4 text-xs" style={{ color: th.fg3 }}>
                  <span className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5" />{c.section_count} module{c.section_count > 1 ? "s" : ""}</span>
                  <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />{c.instance_count} attribution{c.instance_count > 1 ? "s" : ""}</span>
                  <ChevronRight className="w-4 h-4 ml-auto" style={{ color: th.navAC }} />
                </div>
              </div>
            </GCard>
          );
        })}
      </div>
    </div>
  );
}
