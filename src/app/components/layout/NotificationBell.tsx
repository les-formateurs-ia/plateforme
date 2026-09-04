import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Bell, Calendar as CalendarIcon, XCircle, RefreshCw, CalendarPlus, ClipboardList } from "lucide-react";
import { useNavigate } from "react-router";
import { useTh } from "@/app/theme/theme";
import { useAuth } from "@/app/state/auth-context";
import { isStaff } from "@/app/lib/permissions";
import { supabase } from "@/app/lib/supabase/client";
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover";
import { listMyNotifications, markNotificationRead, markAllNotificationsRead, type NotificationRow } from "@/app/lib/notifications";
import type { Database } from "@/app/lib/supabase/database.types";

// Filet de sécurité si le WebSocket temps réel se coupe (veille, réseau) —
// la diffusion Realtime (voir handleOpenChange plus bas) reste le canal
// principal pour un affichage instantané, sans recharger la page.
const FALLBACK_POLL_MS = 60000;

const ICONS: Record<NotificationRow["type"], typeof Bell> = {
  rdv_cancelled: XCircle,
  rdv_reschedule_proposed: RefreshCw,
  rdv_reschedule_accepted: CalendarIcon,
  rdv_reschedule_declined: XCircle,
  rdv_booked: CalendarPlus,
  bilan_reminder: ClipboardList,
};

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "à l'instant";
  if (mins < 60) return `il y a ${mins} min`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `il y a ${hours} h`;
  return `il y a ${Math.round(hours / 24)} j`;
}

type NotificationTableRow = Database["public"]["Tables"]["notifications"]["Row"];

function mapRow(row: NotificationTableRow): NotificationRow {
  return { id: row.id, type: row.type, title: row.title, body: row.body, rdvId: row.rdv_id, read: !!row.read_at, createdAt: row.created_at };
}

export function NotificationBell() {
  const th = useTh();
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [open, setOpen] = useState(false);

  const load = async () => {
    if (!user) return;
    try {
      setItems(await listMyNotifications(user.id));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    void load();
    const interval = setInterval(() => void load(), FALLBACK_POLL_MS);
    return () => clearInterval(interval);
  }, [user]);

  // Diffusion en temps réel : une notification créée pendant que la session
  // est ouverte (annulation, proposition, réservation…) apparaît tout de
  // suite, sans attendre un rechargement ni le polling de secours ci-dessus.
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const row = mapRow(payload.new as NotificationTableRow);
          setItems((prev) => (prev.some((n) => n.id === row.id) ? prev : [row, ...prev]));
          toast(row.title, { description: row.body ?? undefined });
        },
      )
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [user]);

  const unread = items.filter((n) => !n.read).length;

  // Ces notifications concernent toutes un rendez-vous (annulation,
  // proposition de nouveau créneau, réservation…) — on ouvre donc l'onglet
  // Rendez-vous de chacun : /planning (disponibilités + RDV à venir) pour le
  // staff, /calendar (réservation) pour l'élève.
  const goToRendezVous = () => {
    setOpen(false);
    navigate(isStaff(role) ? "/planning" : "/calendar");
  };

  const handleOpenChange = async (next: boolean) => {
    setOpen(next);
    if (!next || !user) return;
    if (unread > 0) {
      await markAllNotificationsRead(user.id);
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button className="relative w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: th.inputBg, border: `1px solid ${th.inputB}` }}>
          <Bell className="w-4 h-4" style={{ color: th.fg3 }} />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-black flex items-center justify-center" style={{ background: "#fbc2ad", color: "#3a1f14" }}>
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0" style={{ background: th.card, borderColor: th.sep }}>
        <div className="px-4 py-3" style={{ borderBottom: `1px solid ${th.sep}` }}>
          <span className="text-sm font-black" style={{ color: th.fg }}>Notifications</span>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {items.length === 0 && (
            <p className="text-xs px-4 py-6 text-center" style={{ color: th.fg3 }}>Rien pour l'instant.</p>
          )}
          {items.map((n) => {
            const Icon = ICONS[n.type];
            return (
              <button key={n.id} onClick={() => { void markNotificationRead(n.id); goToRendezVous(); }} className="w-full text-left px-4 py-3 flex items-start gap-2.5 transition-colors hover:opacity-80" style={{ borderBottom: `1px solid ${th.sep}` }}>
                <Icon className="w-4 h-4 mt-0.5 shrink-0" style={{ color: th.navAC }} />
                <div className="min-w-0">
                  <div className="text-xs font-bold" style={{ color: th.fg }}>{n.title}</div>
                  {n.body && <div className="text-xs mt-0.5 leading-snug" style={{ color: th.fg3 }}>{n.body}</div>}
                  <div className="text-[10px] mt-1" style={{ color: th.fg3, opacity: 0.7 }}>{timeAgo(n.createdAt)}</div>
                </div>
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
