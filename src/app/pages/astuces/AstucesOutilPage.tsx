import { Navigate, useNavigate, useParams } from "react-router";
import { ArrowRight, Clock, ExternalLink, ShieldCheck } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { GCard } from "@/app/components/common/GCard";
import { AstucesCrumbs } from "@/app/components/astuces/shared";
import { OutilLogo, outilAccent } from "@/app/components/astuces/OutilLogo";
import { FORMAT_LABELS, articleCount, formatCheckedAt, getOutil, outilArticles } from "@/app/data/guide-outils";

// /astuces/outils/:outilId — sommaire d'un outil : ses chapitres, chacun
// découpé en petits articles, puis les sources officielles.
export function AstucesOutilPage() {
  const th = useTh();
  const navigate = useNavigate();
  const { outilId } = useParams<{ outilId: string }>();
  const outil = getOutil(outilId);
  if (!outil) return <Navigate to="/astuces" replace />;

  const accent = outilAccent(outil.id);
  const all = outilArticles(outil);

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8 space-y-12">
      <div className="fade-up space-y-6">
        <AstucesCrumbs items={[{ label: "Guide IA", to: "/astuces" }, { label: "Comprendre les outils", to: "/astuces#outils" }, { label: outil.name }]} />
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <OutilLogo id={outil.id} className="w-16 h-16 sm:w-20 sm:h-20" />
          <div className="max-w-3xl">
            <p className="eyebrow" style={{ color: th.fg3 }}>{outil.vendor} · {outil.chapters.length} chapitres · {articleCount(outil)} articles</p>
            <h1 className="mt-1 text-[2rem] sm:text-[2.6rem] leading-[1.02] font-black" style={{ color: th.fg }}>{outil.name}</h1>
            <p className="mt-2 text-lg font-semibold leading-snug" style={{ color: th.fg }}>{outil.tagline}</p>
          </div>
        </div>
        <p className="text-[15px] leading-relaxed max-w-3xl" style={{ color: th.fg2 }}>{outil.intro}</p>
      </div>

      {outil.chapters.map((chapter, ci) => (
        <section key={chapter.id} aria-labelledby={`chap-${chapter.id}`} className="fade-up">
          <div className="flex items-baseline gap-4 mb-2">
            <span className="text-[2.4rem] font-black leading-none tabular-nums" style={{ color: accent }}>{String(ci + 1).padStart(2, "0")}</span>
            <h2 id={`chap-${chapter.id}`} className="text-[1.35rem] sm:text-[1.6rem] font-black leading-tight" style={{ color: th.fg }}>{chapter.title}</h2>
          </div>
          <p className="text-sm max-w-3xl mb-5 leading-relaxed" style={{ color: th.fg2 }}>{chapter.intro}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {chapter.articles.map((article) => {
              const n = all.findIndex((x) => x.article.id === article.id) + 1;
              return (
                <GCard key={article.id} onClick={() => navigate(`/astuces/outils/${outil.id}/${article.id}`)} className="group p-5 flex flex-col">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[11px] font-black uppercase tracking-wide px-2 py-1 rounded-full" style={{ background: `${accent}1f`, color: th.fg }}>{FORMAT_LABELS[article.format]}</span>
                    <span className="text-[12px] font-semibold tabular-nums" style={{ color: th.fg3 }}>{String(n).padStart(2, "0")}</span>
                  </div>
                  <h3 className="mt-3 text-base font-black leading-snug" style={{ color: th.fg }}>{article.title}</h3>
                  <p className="mt-1 text-[13px] leading-relaxed flex-1" style={{ color: th.fg2 }}>{article.summary}</p>
                  <div className="mt-4 flex items-center justify-between text-[12px] font-semibold" style={{ color: th.fg3 }}>
                    <span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{article.duration}</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" style={{ color: th.fg }} />
                  </div>
                </GCard>
              );
            })}
          </div>
        </section>
      ))}

      <section aria-labelledby="outil-sources" className="fade-up max-w-3xl pb-4">
        <h2 id="outil-sources" className="flex items-center gap-2 text-[1.2rem] font-black" style={{ color: th.fg }}><ShieldCheck className="w-5 h-5" style={{ color: th.success }} />Sources officielles</h2>
        <p className="mt-1 text-[13.5px] leading-relaxed" style={{ color: th.fg2 }}>
          Tout ce guide s'appuie uniquement sur la documentation officielle ({outil.vendor}). Les outils évoluent chaque mois : vérifié le {formatCheckedAt(outil.checkedAt)}.
        </p>
        <ul className="mt-4 grid gap-2">
          {outil.sources.map((s) => (
            <li key={s.url}>
              <a href={s.url} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-3 rounded-[8px] px-4 py-3 transition-opacity hover:opacity-75" style={{ border: `1px solid ${th.sep}` }}>
                <span className="text-[14px] font-semibold" style={{ color: th.fg }}>{s.label}</span>
                <span className="flex items-center gap-1.5 text-[12px] truncate" style={{ color: th.fg3 }}>{new URL(s.url).hostname}<ExternalLink className="w-3.5 h-3.5 shrink-0" /></span>
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
