// Onglet "Mon utilisation IA" du tableau de bord élève — cf. migration
// 0071_ai_usage_budget.sql. 4 graphiques (répartition média/fournisseur/
// modèle + historique temporel) + filtre de période, tous recalculés depuis
// le même jeu d'événements chargé une fois au montage.
import { useEffect, useMemo, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area } from "recharts";
import { useTh } from "@/app/theme/theme";
import { useAuth } from "@/app/state/auth-context";
import { useProfile } from "@/app/state/profile-context";
import { GCard } from "@/app/components/common/GCard";
import { AiBudgetBar } from "@/app/components/common/AiBudgetBar";
import { getMyAiUsageEvents, MEDIA_TYPE_LABELS, providerLabel, type AiUsageEvent } from "@/app/lib/aiUsage";
import type { AiUsageMediaType } from "@/app/lib/supabase/database.types";

type Period = "7d" | "30d" | "all";
const PERIODS: { id: Period; label: string }[] = [
  { id: "7d", label: "7 derniers jours" },
  { id: "30d", label: "30 derniers jours" },
  { id: "all", label: "Tout" },
];

// Palette catégorielle validée (cf. skill dataviz) — 4 slots fixes pour les 4
// types de média connus, stables quel que soit le filtre de période.
const MEDIA_TYPE_ORDER: AiUsageMediaType[] = ["image", "video", "audio", "text"];
const MEDIA_TYPE_COLORS: Record<AiUsageMediaType, { light: string; dark: string }> = {
  image: { light: "#2a78d6", dark: "#3987e5" },
  video: { light: "#eb6834", dark: "#d95926" },
  audio: { light: "#1baf7a", dark: "#199e70" },
  text: { light: "#eda100", dark: "#c98500" },
};

function periodStart(period: Period): Date | null {
  if (period === "all") return null;
  const days = period === "7d" ? 7 : 30;
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d;
}

const money = (v: number) => `${Number(v).toFixed(2)} $`;

export function AiUsagePanel() {
  const th = useTh();
  const { user } = useAuth();
  const { profile } = useProfile();
  const [events, setEvents] = useState<AiUsageEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("30d");

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await getMyAiUsageEvents(user.id);
        if (!cancelled) setEvents(data);
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  const filtered = useMemo(() => {
    const since = periodStart(period);
    return since ? events.filter((e) => new Date(e.createdAt) >= since) : events;
  }, [events, period]);

  const mediaData = useMemo(() => {
    const totals = new Map<AiUsageMediaType, number>();
    for (const e of filtered) totals.set(e.mediaType, (totals.get(e.mediaType) ?? 0) + e.costUsd);
    return MEDIA_TYPE_ORDER
      .map((mt) => ({ key: mt, name: MEDIA_TYPE_LABELS[mt], value: totals.get(mt) ?? 0, color: th.isDark ? MEDIA_TYPE_COLORS[mt].dark : MEDIA_TYPE_COLORS[mt].light }))
      .filter((d) => d.value > 0);
  }, [filtered, th.isDark]);

  const providerData = useMemo(() => {
    const totals = new Map<string, number>();
    for (const e of filtered) totals.set(e.provider, (totals.get(e.provider) ?? 0) + e.costUsd);
    return [...totals.entries()].map(([provider, value]) => ({ name: providerLabel(provider), value })).sort((a, b) => b.value - a.value);
  }, [filtered]);

  const modelData = useMemo(() => {
    const totals = new Map<string, number>();
    for (const e of filtered) totals.set(e.model, (totals.get(e.model) ?? 0) + e.costUsd);
    const sorted = [...totals.entries()].map(([model, value]) => ({ name: model, value })).sort((a, b) => b.value - a.value);
    if (sorted.length <= 8) return sorted;
    const rest = sorted.slice(7).reduce((sum, d) => sum + d.value, 0);
    return [...sorted.slice(0, 7), { name: "Autres", value: rest }];
  }, [filtered]);

  const dailyData = useMemo(() => {
    const totals = new Map<string, number>();
    for (const e of filtered) {
      const day = e.createdAt.slice(0, 10);
      totals.set(day, (totals.get(day) ?? 0) + e.costUsd);
    }
    return [...totals.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([day, value]) => ({ day: new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit" }).format(new Date(day)), value }));
  }, [filtered]);

  if (loading) {
    return <div className="p-8 text-center"><span className="text-sm" style={{ color: th.fg3 }}>Chargement…</span></div>;
  }

  const tooltipStyle = { background: th.card, border: `1px solid ${th.sep}`, borderRadius: 8, fontSize: 12 };
  const axisTick = { fontSize: 11, fill: th.fg3 };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="max-w-sm w-full">
          <AiBudgetBar spentUsd={profile.spentUsd} capUsd={profile.budgetUsd} size="lg" />
        </div>
        <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: th.isDark ? "rgba(255,255,255,0.04)" : `${th.gradShadow(0.06)}`, border: `1px solid ${th.sep}` }}>
          {PERIODS.map(({ id, label }) => (
            <button key={id} onClick={() => setPeriod(id)} className="px-4 py-2 rounded-lg text-xs font-semibold transition-all"
              style={period === id ? { background: th.isDark ? `${th.gradShadow(0.14)}` : "rgba(255,255,255,0.8)", color: th.navAC, border: `1px solid ${th.gradShadow(0.25)}` } : { color: th.fg3, background: "transparent", border: "1px solid transparent" }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <GCard><div className="p-8 text-center">
          <p className="text-sm font-semibold mb-1" style={{ color: th.fg }}>Aucune consommation IA enregistrée</p>
          <p className="text-xs" style={{ color: th.fg3 }}>Génère une image ou une vidéo dans Le Studio, ou lance Battle Ground, pour voir tes statistiques apparaître ici.</p>
        </div></GCard>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <GCard><div className="p-5">
            <div className="text-sm font-bold mb-4" style={{ color: th.fg }}>Répartition par type de média</div>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={mediaData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2} strokeWidth={0}>
                  {mediaData.map((d) => <Cell key={d.key} fill={d.color} />)}
                </Pie>
                <Tooltip formatter={money} contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12, color: th.fg2 }} />
              </PieChart>
            </ResponsiveContainer>
          </div></GCard>

          <GCard><div className="p-5">
            <div className="text-sm font-bold mb-4" style={{ color: th.fg }}>Répartition par fournisseur</div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={providerData} layout="vertical" margin={{ left: 8, right: 24 }}>
                <CartesianGrid horizontal={false} stroke={th.sep} />
                <XAxis type="number" tick={axisTick} axisLine={{ stroke: th.sep }} tickLine={false} />
                <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11, fill: th.fg2 }} axisLine={false} tickLine={false} />
                <Tooltip formatter={money} contentStyle={tooltipStyle} />
                <Bar dataKey="value" fill={th.grad1} radius={[0, 4, 4, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div></GCard>

          <GCard><div className="p-5">
            <div className="text-sm font-bold mb-4" style={{ color: th.fg }}>Répartition par modèle</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={modelData} layout="vertical" margin={{ left: 8, right: 24 }}>
                <CartesianGrid horizontal={false} stroke={th.sep} />
                <XAxis type="number" tick={axisTick} axisLine={{ stroke: th.sep }} tickLine={false} />
                <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11, fill: th.fg2 }} axisLine={false} tickLine={false} />
                <Tooltip formatter={money} contentStyle={tooltipStyle} />
                <Bar dataKey="value" fill={th.grad2} radius={[0, 4, 4, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div></GCard>

          <GCard><div className="p-5">
            <div className="text-sm font-bold mb-4" style={{ color: th.fg }}>Historique des dépenses</div>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={dailyData}>
                <defs>
                  <linearGradient id="aiUsageAreaFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={th.grad1} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={th.grad1} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke={th.sep} />
                <XAxis dataKey="day" tick={axisTick} axisLine={{ stroke: th.sep }} tickLine={false} />
                <YAxis tick={axisTick} axisLine={false} tickLine={false} width={40} />
                <Tooltip formatter={money} contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="value" stroke={th.grad1} strokeWidth={2} fill="url(#aiUsageAreaFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div></GCard>
        </div>
      )}
    </div>
  );
}
