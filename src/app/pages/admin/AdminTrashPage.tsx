import { useEffect, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { ChevronLeft, RotateCcw, Trash2 } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { GCard } from "@/app/components/common/GCard";
import { GT } from "@/app/components/common/GT";
import { VBtn } from "@/app/components/common/Buttons";
import { listTrashedFormations, restoreFormation, permanentlyDeleteFormation, type TrashedFormationRow } from "@/app/lib/formations";

// Corbeille des formations — admin uniquement (route + RLS, cf. migration
// 0030). Restaurer remet la formation dans la liste active ; la suppression
// définitive est irréversible, contrairement au retrait vers la corbeille.
export function AdminTrashPage() {
  const th = useTh();
  const [items, setItems] = useState<TrashedFormationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      setItems(await listTrashedFormations());
    } catch (err) {
      console.error(err);
      toast.error("Impossible de charger la corbeille.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const restore = async (id: string) => {
    setBusyId(id);
    try {
      await restoreFormation(id);
      setItems((rows) => rows.filter((r) => r.id !== id));
      toast.success("Formation restaurée.");
    } catch (err) {
      console.error(err);
      toast.error("Impossible de restaurer cette formation.");
    } finally {
      setBusyId(null);
    }
  };

  const destroy = async (id: string) => {
    if (!confirm("Supprimer définitivement cette formation ? Cette action est irréversible : la formation et tout son contenu (modules, leçons, quiz) seront perdus pour toujours.")) return;
    setBusyId(id);
    try {
      await permanentlyDeleteFormation(id);
      setItems((rows) => rows.filter((r) => r.id !== id));
      toast.success("Formation supprimée définitivement.");
    } catch (err) {
      console.error(err);
      toast.error("Impossible de supprimer définitivement cette formation.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-6">
      <Link to="/admin/courses" className="flex items-center gap-1.5 text-sm w-fit transition-colors hover:opacity-70" style={{ color: th.fg3 }}><ChevronLeft className="w-4 h-4" />Formations</Link>

      <div>
        <h2 className="text-2xl font-black" style={{ fontFamily: "'Funnel Display',sans-serif" }}><GT>Corbeille</GT></h2>
        <p className="text-sm mt-0.5" style={{ color: th.fg3 }}>La suppression définitive est irréversible.</p>
      </div>

      {loading && <p className="text-sm" style={{ color: th.fg3 }}>Chargement…</p>}

      {!loading && items.length === 0 && (
        <GCard><div className="p-8 text-center">
          <p className="text-sm" style={{ color: th.fg3 }}>La corbeille est vide.</p>
        </div></GCard>
      )}

      <div className="space-y-2">
        {items.map((item) => (
          <GCard key={item.id}><div className="p-4 flex items-center gap-3 flex-wrap">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black truncate" style={{ color: th.fg }}>{item.name}</p>
              <p className="text-xs truncate" style={{ color: th.fg3 }}>{item.description || "Pas de description."}</p>
            </div>
            <VBtn sm onClick={() => restore(item.id)} disabled={busyId === item.id}>
              <span className="flex items-center gap-1.5"><RotateCcw className="w-3.5 h-3.5" />Restaurer</span>
            </VBtn>
            <button type="button" onClick={() => destroy(item.id)} disabled={busyId === item.id}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl transition-opacity hover:opacity-70 disabled:opacity-40"
              style={{ color: "#ef4444" }} title="Supprimer définitivement">
              <Trash2 className="w-3.5 h-3.5" />Supprimer définitivement
            </button>
          </div></GCard>
        ))}
      </div>
    </div>
  );
}
