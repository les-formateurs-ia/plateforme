// Onglet "Mon utilisation IA" du tableau de bord élève — cf. migration
// 0071_ai_usage_budget.sql. Pensé autour des trois questions d'un élève :
//   1. Combien il me reste ?   → chiffre héros + jauge, traduit en créations possibles
//   2. À quoi ça a servi ?     → classement par outil (une seule teinte, pas de camembert)
//   3. Est-ce que ça monte ?   → colonnes par jour, info-bulle au survol
// puis les modèles les plus utilisés et l'activité récente. Tout est recalculé
// depuis le même jeu d'événements chargé une fois, selon la période choisie.
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AudioLines, Bot, Clapperboard, Image as ImageIcon, Languages, Music, Speech, Swords, Target, type LucideIcon } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { useAuth } from "@/app/state/auth-context";
import { useProfile } from "@/app/state/profile-context";
import { Segmented } from "@/app/components/common/Buttons";
import { NeuralField } from "@/app/components/particles/NeuralField";
import { SectionHead } from "@/app/components/common/SectionHead";
import { getMyAiUsageEvents, providerLabel, type AiUsageEvent } from "@/app/lib/aiUsage";
import { cx } from "@/app/lib/cx";
import type { AiUsageSource } from "@/app/lib/supabase/database.types";

type Period = "7d" | "30d" | "all";
const PERIODS: { value: Period; label: string }[] = [
  { value: "7d", label: "7 jours" },
  { value: "30d", label: "30 jours" },
  { value: "all", label: "Tout" },
];

// Les outils tels que l'élève les connaît (plutôt que des types de média).
const SOURCES: Record<AiUsageSource, { label: string; Icon: LucideIcon; unit: [string, string] }> = {
  studio_image: { label: "Images", Icon: ImageIcon, unit: ["image", "images"] },
  studio_video: { label: "Vidéos", Icon: Clapperboard, unit: ["vidéo", "vidéos"] },
  studio_music: { label: "Musique", Icon: Music, unit: ["morceau", "morceaux"] },
  studio_talkinghead: { label: "Faire parler une image", Icon: Speech, unit: ["animation", "animations"] },
  studio_tts: { label: "Texte en voix", Icon: AudioLines, unit: ["voix", "voix"] },
  studio_doublage: { label: "Doublage", Icon: Languages, unit: ["doublage", "doublages"] },
  studio_chat: { label: "Chats IA", Icon: Bot, unit: ["message", "messages"] },
  battle_ground: { label: "Battle Ground", Icon: Swords, unit: ["comparaison", "comparaisons"] },
  reverse_prompt: { label: "Rétro-ingénierie", Icon: Target, unit: ["essai", "essais"] },
};

// Coût indicatif d'une création quand l'élève n'en a encore jamais fait
// (ordre de grandeur Runware), pour traduire le budget en créations possibles.
const FALLBACK_COST: Partial<Record<AiUsageSource, number>> = { studio_image: 0.01, studio_video: 0.4, studio_music: 0.06 };

function periodStart(period: Period): Date | null {
  if (period === "all") return null;
  const d = new Date();
  d.setDate(d.getDate() - (period === "7d" ? 7 : 30));
  d.setHours(0, 0, 0, 0);
  return d;
}

// Sous le centime (une image FLUX coûte ~0,004 $), trois décimales plutôt qu'un « 0,00 $ » trompeur.
const money = (v: number) => `${v.toLocaleString("fr-FR", v > 0 && v < 0.01 ? { minimumFractionDigits: 3, maximumFractionDigits: 3 } : { minimumFractionDigits: 2, maximumFractionDigits: 2 })} $`;
const plural = (n: number, [one, many]: [string, string]) => `${n.toLocaleString("fr-FR")} ${n > 1 ? many : one}`;

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
        if (!cancelled) setEvents(data.map((e) => ({ ...e, costUsd: Number(e.costUsd) || 0 })));
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  const spent = Number(profile.spentUsd) || 0;
  const cap = Number(profile.budgetUsd) || 0;
  const left = Math.max(0, cap - spent);
  const usedPct = cap > 0 ? Math.min(100, (spent / cap) * 100) : 0;

  const filtered = useMemo(() => {
    const since = periodStart(period);
    return since ? events.filter((e) => new Date(e.createdAt) >= since) : events;
  }, [events, period]);

  // Coût moyen par outil, sur tout l'historique (plus stable que la période).
  const avgCost = useMemo(() => {
    const acc = new Map<AiUsageSource, { sum: number; n: number }>();
    for (const e of events) {
      const a = acc.get(e.source) ?? { sum: 0, n: 0 };
      acc.set(e.source, { sum: a.sum + e.costUsd, n: a.n + 1 });
    }
    return (source: AiUsageSource) => {
      const a = acc.get(source);
      return a && a.n && a.sum > 0 ? a.sum / a.n : FALLBACK_COST[source] ?? 0;
    };
  }, [events]);

  const bySource = useMemo(() => {
    const acc = new Map<AiUsageSource, { count: number; cost: number }>();
    for (const e of filtered) {
      const a = acc.get(e.source) ?? { count: 0, cost: 0 };
      acc.set(e.source, { count: a.count + 1, cost: a.cost + e.costUsd });
    }
    return [...acc.entries()].map(([source, v]) => ({ source, ...v })).sort((a, b) => b.cost - a.cost || b.count - a.count);
  }, [filtered]);

  const byModel = useMemo(() => {
    const acc = new Map<string, { count: number; cost: number }>();
    for (const e of filtered) {
      const a = acc.get(e.model) ?? { count: 0, cost: 0 };
      acc.set(e.model, { count: a.count + 1, cost: a.cost + e.costUsd });
    }
    const sorted = [...acc.entries()].map(([model, v]) => ({ model: prettyModel(model), ...v })).sort((a, b) => b.cost - a.cost);
    if (sorted.length <= 6) return sorted;
    const rest = sorted.slice(5).reduce((s, d) => ({ count: s.count + d.count, cost: s.cost + d.cost }), { count: 0, cost: 0 });
    return [...sorted.slice(0, 5), { model: "Autres modèles", ...rest }];
  }, [filtered]);

  // Une colonne par jour de la période (jours sans activité inclus, à zéro).
  const daily = useMemo(() => {
    const totals = new Map<string, number>();
    for (const e of filtered) totals.set(e.createdAt.slice(0, 10), (totals.get(e.createdAt.slice(0, 10)) ?? 0) + e.costUsd);
    const since = periodStart(period) ?? (filtered.length ? new Date(filtered[filtered.length - 1].createdAt) : new Date());
    const days: { day: string; label: string; value: number }[] = [];
    const d = new Date(since); d.setHours(0, 0, 0, 0);
    const end = new Date(); end.setHours(0, 0, 0, 0);
    while (d <= end && days.length < 120) {
      const iso = d.toISOString().slice(0, 10);
      days.push({ day: iso, label: d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" }).replace(".", ""), value: totals.get(iso) ?? 0 });
      d.setDate(d.getDate() + 1);
    }
    return days;
  }, [filtered, period]);

  const periodSpent = filtered.reduce((s, e) => s + e.costUsd, 0);
  const activeDays = new Set(filtered.map((e) => e.createdAt.slice(0, 10))).size;
  const possible = (["studio_image", "studio_video", "studio_music"] as const)
    .map((src) => ({ src, n: avgCost(src) > 0 ? Math.floor(left / avgCost(src)) : 0 }))
    .filter((p) => p.n > 0);

  if (loading) {
    return <div className="h-[280px] rounded-[10px] bg-black/90 animate-pulse" aria-busy="true" aria-label="Chargement" />;
  }

  return (
    <div className="space-y-10">
      {/* 1. Ce qu'il reste — panneau noir au réseau de la marque. */}
      <section aria-labelledby="ai-left" className="relative overflow-hidden rounded-[10px] bg-black text-white fade-up" style={{ border: th.isDark ? `1px solid ${th.sep}` : undefined }}>
        <NeuralField dark density={3} band={0.85} active={false} />
        <div aria-hidden className="absolute inset-0" style={{ background: "linear-gradient(90deg,rgba(0,0,0,0.92) 0%,rgba(0,0,0,0.65) 50%,rgba(0,0,0,0.2) 100%)" }} />
        <div className="relative grid gap-8 p-6 sm:p-9 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-end">
          <div>
            <p className="eyebrow text-white/60">Crédits IA restants</p>
            <p id="ai-left" className="mt-3 text-[3.2rem] sm:text-[4.2rem] leading-none font-extrabold tracking-[-0.045em] tabular-nums">{money(left)}</p>
            <p className="mt-3 text-base text-white/65 tabular-nums">{money(spent)} utilisés sur {money(cap)}</p>
            {/* Jauge : la part utilisée, au dégradé de la charte. */}
            <div className="mt-5 h-2 max-w-md rounded-full overflow-hidden bg-white/15" role="meter" aria-valuemin={0} aria-valuemax={cap} aria-valuenow={spent} aria-label="Crédits utilisés">
              <div className="h-full rounded-full" style={{ width: `${usedPct}%`, background: usedPct > 90 ? "#e5484d" : th.iris }} />
            </div>
            {usedPct > 90 && <p className="mt-3 text-sm text-white/80">Tes crédits sont presque épuisés : demande une recharge à ton formateur.</p>}
          </div>
          {possible.length > 0 && (
            <div className="lg:pl-8 lg:border-l border-white/15">
              <p className="eyebrow text-white/60">De quoi créer encore environ</p>
              <ul className="mt-4 space-y-3">
                {possible.map(({ src, n }) => {
                  const { Icon, unit } = SOURCES[src];
                  return (
                    <li key={src} className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full flex items-center justify-center bg-white/10"><Icon className="w-4 h-4" /></span>
                      <span className="text-xl font-bold tabular-nums">{plural(n, unit)}</span>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-4 text-xs text-white/45">Estimation d'après le coût moyen de tes créations.</p>
            </div>
          )}
        </div>
      </section>

      {/* Filtre de période : une seule ligne, au-dessus de tout ce qu'il filtre. */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="eyebrow" style={{ color: th.fg3 }}>Ton activité</p>
          <h3 className="mt-2 text-[1.35rem] sm:text-[1.6rem] font-black leading-tight" style={{ color: th.fg }}>Ce que tu as fait avec l'IA</h3>
        </div>
        <Segmented value={period} onChange={(v) => setPeriod(v as Period)} options={PERIODS} />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-[10px] p-10 text-center" style={{ border: `1px dashed ${th.inputB}` }}>
          <p className="text-[15px] font-bold" style={{ color: th.fg }}>Rien sur cette période</p>
          <p className="mt-1 text-sm" style={{ color: th.fg2 }}>Génère une image ou une vidéo dans le Studio, ou lance un Battle Ground : tes statistiques apparaîtront ici.</p>
        </div>
      ) : (
        <>
          {/* Chiffres de la période. */}
          <div className="grid grid-cols-2 lg:grid-cols-4" style={{ borderTop: `1px solid ${th.sep}`, borderBottom: `1px solid ${th.sep}` }}>
            {[
              { value: filtered.length.toLocaleString("fr-FR"), label: `création${filtered.length > 1 ? "s" : ""} et requête${filtered.length > 1 ? "s" : ""}` },
              { value: money(periodSpent), label: "de crédits utilisés" },
              { value: money(filtered.length ? periodSpent / filtered.length : 0), label: "en moyenne par création" },
              { value: String(activeDays), label: `jour${activeDays > 1 ? "s" : ""} d'activité` },
            ].map((f, i) => (
              <div key={f.label} className={cx("py-6 px-1 sm:px-6", i > 0 && "lg:border-l", i % 2 === 1 && "border-l", i >= 2 && "border-t lg:border-t-0")} style={{ borderColor: th.sep }}>
                <p className="text-[1.9rem] sm:text-[2.3rem] leading-none font-extrabold tracking-[-0.04em] tabular-nums" style={{ color: th.fg }}>{f.value}</p>
                <p className="mt-2 text-sm" style={{ color: th.fg2 }}>{f.label}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
            {/* 2. À quoi ça a servi — classement, une seule teinte. */}
            <section aria-labelledby="ai-tools">
              <SectionHead id="ai-tools" eyebrow="Par outil" title="Où vont tes crédits" />
              <RankList
                rows={bySource.map((r) => ({ key: r.source, Icon: SOURCES[r.source]?.Icon, label: SOURCES[r.source]?.label ?? r.source, sub: plural(r.count, SOURCES[r.source]?.unit ?? ["utilisation", "utilisations"]), value: r.cost }))}
              />
            </section>

            {/* 3. Est-ce que ça monte — colonnes par jour. */}
            <section aria-labelledby="ai-daily">
              <SectionHead id="ai-daily" eyebrow="Par jour" title="Ta consommation dans le temps" />
              <div className="h-[260px] -ml-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={daily} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barCategoryGap={period === "7d" ? "30%" : "18%"}>
                    <CartesianGrid vertical={false} stroke={th.sep} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: th.fg3 }} axisLine={{ stroke: th.sep }} tickLine={false} interval="preserveStartEnd" minTickGap={18} />
                    <YAxis tick={{ fontSize: 11, fill: th.fg3 }} axisLine={false} tickLine={false} width={54} tickFormatter={(v: number) => `${v.toLocaleString("fr-FR", { maximumFractionDigits: v < 1 ? 2 : 0 })} $`} />
                    <Tooltip cursor={{ fill: th.navA }} content={<DayTooltip />} />
                    <Bar dataKey="value" fill={th.ink} radius={[4, 4, 0, 0]} maxBarSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          </div>

          <div className="grid gap-10 lg:grid-cols-2">
            <section aria-labelledby="ai-models">
              <SectionHead id="ai-models" eyebrow="Par modèle" title="Les modèles que tu utilises" />
              <RankList rows={byModel.map((r) => ({ key: r.model, label: r.model, sub: plural(r.count, ["utilisation", "utilisations"]), value: r.cost }))} />
            </section>
            <section aria-labelledby="ai-recent">
              <SectionHead id="ai-recent" eyebrow="Historique" title="Activité récente" />
              <ul className="rounded-[8px] overflow-hidden" style={{ border: `1px solid ${th.sep}` }}>
                {filtered.slice(0, 8).map((e, i) => {
                  const meta = SOURCES[e.source];
                  const Icon = meta?.Icon ?? Bot;
                  return (
                    <li key={e.id} className="flex items-center gap-3 px-4 py-3" style={i ? { borderTop: `1px solid ${th.sep}` } : undefined}>
                      <Icon className="w-4 h-4 shrink-0" style={{ color: th.fg3 }} />
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-semibold truncate" style={{ color: th.fg }}>{meta?.label ?? e.source} · {prettyModel(e.model)}</span>
                        <span className="block text-xs" style={{ color: th.fg3 }}>{new Date(e.createdAt).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                      </span>
                      <span className="text-sm font-bold tabular-nums" style={{ color: th.fg }}>{money(e.costUsd)}</span>
                    </li>
                  );
                })}
              </ul>
            </section>
          </div>
        </>
      )}
    </div>
  );
}

// Classement horizontal : libellé, détail, barre à l'encre proportionnelle,
// valeur. Une seule teinte : on compare des grandeurs, pas des identités.
function RankList({ rows }: { rows: { key: string; label: string; sub: string; value: number; Icon?: LucideIcon }[] }) {
  const th = useTh();
  const max = Math.max(...rows.map((r) => r.value), 0.0001);
  const total = rows.reduce((s, r) => s + r.value, 0);
  return (
    <ul className="space-y-4">
      {rows.map(({ key, label, sub, value, Icon }) => (
        <li key={key} title={`${label} : ${money(value)} (${total ? Math.round((value / total) * 100) : 0} %)`}>
          <div className="flex items-baseline justify-between gap-3">
            <span className="flex items-center gap-2 min-w-0">
              {Icon && <Icon className="w-4 h-4 shrink-0 self-center" style={{ color: th.fg2 }} />}
              <span className="text-[15px] font-semibold truncate" style={{ color: th.fg }}>{label}</span>
              <span className="text-xs shrink-0" style={{ color: th.fg3 }}>{sub}</span>
            </span>
            <span className="text-sm font-bold tabular-nums shrink-0" style={{ color: th.fg }}>{money(value)}</span>
          </div>
          <div className="mt-2 h-2 rounded-full overflow-hidden" style={{ background: th.navA }}>
            <div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${Math.max(2, (value / max) * 100)}%`, background: th.ink }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function DayTooltip({ active, payload }: { active?: boolean; payload?: { payload: { day: string; value: number } }[] }): ReactNode {
  const th = useTh();
  if (!active || !payload?.length) return null;
  const { day, value } = payload[0].payload;
  return (
    <div className="rounded-[4px] px-3 py-2 text-xs" style={{ background: th.card, border: `1px solid ${th.sep}`, boxShadow: "0 18px 40px -20px rgba(0,0,0,0.25)" }}>
      <p className="font-semibold first-letter:uppercase" style={{ color: th.fg2 }}>{new Date(`${day}T00:00:00`).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}</p>
      <p className="mt-0.5 text-sm font-bold tabular-nums" style={{ color: th.fg }}>{money(value)}</p>
    </div>
  );
}

// Identifiant Runware « fournisseur:modèle@version » → libellé lisible :
// "openai:gpt-image-1@2" → "gpt-image-1" ; "klingai:5@3" (identifiant
// numérique) → "KlingAI · modèle 5".
function prettyModel(model: string) {
  const [provider, rest = ""] = model.includes(":") ? [model.split(":")[0], model.split(":").slice(1).join(":")] : ["", model];
  const name = rest.replace(/@\d+$/, "");
  return /^\d+$/.test(name) || name.length <= 2 ? `${providerLabel(provider)} · modèle ${name}` : name;
}
