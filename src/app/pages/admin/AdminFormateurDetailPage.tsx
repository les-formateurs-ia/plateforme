import { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import { toast } from "sonner";
import { ChevronLeft, ClipboardList, Paperclip, User } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { supabase } from "@/app/lib/supabase/client";
import { GCard } from "@/app/components/common/GCard";
import { GT } from "@/app/components/common/GT";
import { Avatar } from "@/app/components/common/Avatar";
import { listFormateurBilans, getBilanAttachmentUrl, type FormateurBooking } from "@/app/lib/availability";
import { useStaffBasePath } from "@/app/lib/staffBase";

interface FormateurProfile { id: string; first_name: string | null; last_name: string | null; email: string; avatar_url: string | null; }

function formatDay(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
}

// Fiche formateur côté admin : lecture seule des bilans qu'il a rédigés,
// aucune action de modification/suppression (réservée au formateur lui-même
// dans AdminAvailabilityPage) — cf. demande explicite de séparation des droits.
export function AdminFormateurDetailPage() {
  const th = useTh();
  const base = useStaffBasePath();
  const { formateurId } = useParams();
  const [profile, setProfile] = useState<FormateurProfile | null>(null);
  const [bilans, setBilans] = useState<FormateurBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!formateurId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [{ data: p, error: profileError }, bilanRows] = await Promise.all([
          supabase.from("profiles").select("id, first_name, last_name, email, avatar_url").eq("id", formateurId).single(),
          listFormateurBilans(formateurId),
        ]);
        if (profileError) throw profileError;
        if (cancelled) return;
        setProfile(p ?? null);
        setBilans(bilanRows);
      } catch (err) {
        console.error(err);
        toast.error("Impossible de charger la fiche de ce formateur.");
        if (!cancelled) setProfile(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [formateurId]);

  if (loading) return <div className="flex-1 flex items-center justify-center"><p className="text-sm" style={{ color: th.fg3 }}>Chargement…</p></div>;
  if (!profile) return <div className="flex-1 flex items-center justify-center"><p className="text-sm" style={{ color: th.fg3 }}>Formateur introuvable.</p></div>;

  const name = [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim() || profile.email;

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-6">
      <Link to={`${base}/planning`} className="flex items-center gap-1.5 text-sm w-fit transition-colors hover:opacity-70" style={{ color: th.fg3 }}><ChevronLeft className="w-4 h-4" />Formateurs</Link>

      <div className="flex items-center gap-4">
        <Avatar url={profile.avatar_url} size={64} square />
        <div className="min-w-0">
          <h2 className="text-xl font-black truncate" style={{ color: th.fg }}><GT>{name}</GT></h2>
          <p className="text-sm truncate" style={{ color: th.fg3 }}>{profile.email}</p>
        </div>
      </div>

      <GCard><div className="p-6">
        <h3 className="text-sm font-black mb-4 flex items-center gap-2" style={{ color: th.fg }}>
          <ClipboardList className="w-4 h-4" style={{ color: th.navAC }} />Bilans rédigés
        </h3>
        {!bilans.length && <p className="text-xs" style={{ color: th.fg3 }}>Aucun bilan rédigé pour l'instant.</p>}
        <div className="space-y-3">
          {bilans.map((b) => (
            <div key={b.id} className="rounded-xl p-4" style={{ border: `1px solid ${th.sep}` }}>
              <div className="flex items-center gap-2 min-w-0">
                <User className="w-3.5 h-3.5 shrink-0" style={{ color: th.navAC }} />
                <span className="text-sm font-semibold truncate" style={{ color: th.fg }}>{b.studentName}</span>
              </div>
              <div className="text-xs mt-0.5" style={{ color: th.fg3 }}>{formatDay(b.slotDate)} · {b.startTime}–{b.endTime}</div>
              <div className="mt-3 space-y-2">
                <div><span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: th.fg3 }}>Sujet</span><p className="text-xs mt-0.5" style={{ color: th.fg2 }}>{b.bilanSujet}</p></div>
                <div><span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: th.fg3 }}>Point fort</span><p className="text-xs mt-0.5" style={{ color: th.fg2 }}>{b.bilanPointFort}</p></div>
                <div><span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: th.fg3 }}>Next step</span><p className="text-xs mt-0.5" style={{ color: th.fg2 }}>{b.bilanNextStep}</p></div>
                {b.bilanAttachmentPath && (
                  <button
                    onClick={async () => {
                      try {
                        const url = await getBilanAttachmentUrl(b.bilanAttachmentPath!);
                        window.open(url, "_blank", "noreferrer");
                      } catch {
                        toast.error("Impossible d'ouvrir la pièce jointe.");
                      }
                    }}
                    className="text-xs font-semibold flex items-center gap-1.5 hover:opacity-80"
                    style={{ color: th.navAC }}
                  >
                    <Paperclip className="w-3.5 h-3.5" />{b.bilanAttachmentName ?? "Télécharger le PDF"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div></GCard>
    </div>
  );
}
