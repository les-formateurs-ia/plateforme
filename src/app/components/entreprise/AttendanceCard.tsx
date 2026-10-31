import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, PenLine } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { GCard } from "@/app/components/common/GCard";
import { ShimBtn } from "@/app/components/common/Buttons";
import { dateLongueFr, heureFr } from "@/app/lib/documents/render";
import { isSlotOpen, isSlotUpcoming, listMyAttendanceSlots, signMyAttendance, type MyAttendanceSlot } from "@/app/lib/trainingSessions";

// Émargement en ligne du collaborateur : la séance en cours (de 15 minutes
// avant le début jusqu'à la fin) se signe d'une case à cocher et d'un clic.
// Rien n'est affiché s'il n'a aucune séance prévue.
export function AttendanceCard() {
  const th = useTh();
  const [slots, setSlots] = useState<MyAttendanceSlot[]>([]);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [signing, setSigning] = useState<string | null>(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    listMyAttendanceSlots().then(setSlots).catch(console.error);
    // Réévalue l'ouverture des séances chaque minute, page laissée ouverte.
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  const open = slots.filter((s) => isSlotOpen(s));
  const next = slots.find((s) => isSlotUpcoming(s));
  if (!open.length && !next) return null;

  const sign = async (slot: MyAttendanceSlot) => {
    setSigning(slot.slotId);
    try {
      const signedAt = await signMyAttendance(slot.slotId);
      setSlots((rows) => rows.map((r) => (r.slotId === slot.slotId ? { ...r, signedAt } : r)));
      toast.success("Présence enregistrée.");
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Impossible d'enregistrer la présence.");
    } finally {
      setSigning(null);
    }
  };

  return (
    <GCard><div className="p-5 sm:p-6 space-y-4">
      <div>
        <p className="eyebrow" style={{ color: th.fg3 }}>Émargement</p>
        <p className="text-lg font-black mt-1" style={{ color: th.fg }}>{open.length ? "Signe ta présence" : "Prochaine séance"}</p>
      </div>
      {open.map((slot) => (
        <div key={slot.slotId} className="space-y-3">
          <p className="text-sm" style={{ color: th.fg2 }}>
            {slot.intitule} · {dateLongueFr(slot.date)}, {heureFr(slot.debut)} à {heureFr(slot.fin)}
          </p>
          {slot.signedAt ? (
            <p className="flex items-center gap-2 text-sm font-semibold" style={{ color: th.fg }}>
              <CheckCircle2 className="w-5 h-5" style={{ color: "#1BAF7A" }} />
              Présence signée à {new Intl.DateTimeFormat("fr-FR", { timeStyle: "short", timeZone: "Europe/Paris" }).format(new Date(slot.signedAt))}
            </p>
          ) : (
            <div className="flex items-center gap-4 flex-wrap">
              <label className="flex items-start gap-2.5 text-sm flex-1 min-w-[240px] cursor-pointer" style={{ color: th.fg }}>
                <input type="checkbox" className="mt-0.5 w-4 h-4 shrink-0" checked={!!checked[slot.slotId]}
                  onChange={(e) => setChecked((c) => ({ ...c, [slot.slotId]: e.target.checked }))} />
                Je certifie être présent(e) à cette séance de formation.
              </label>
              <ShimBtn sm onClick={() => void sign(slot)} disabled={!checked[slot.slotId] || signing === slot.slotId}>
                <PenLine className="w-4 h-4" />{signing === slot.slotId ? "Signature…" : "Signer"}
              </ShimBtn>
            </div>
          )}
        </div>
      ))}
      {!open.length && next && (
        <p className="text-sm" style={{ color: th.fg2 }}>
          {next.intitule} · {dateLongueFr(next.date)}, {heureFr(next.debut)} à {heureFr(next.fin)}. L'émargement ouvre 15 minutes avant le début.
        </p>
      )}
    </div></GCard>
  );
}
