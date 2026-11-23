import { useEffect } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router";
import { ArrowLeft, ArrowRight, Clock, ExternalLink, ShieldCheck } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { VBtn } from "@/app/components/common/Buttons";
import { AstucesCrumbs } from "@/app/components/astuces/shared";
import { GuideBlock } from "@/app/components/astuces/GuideBlocks";
import { OutilLogo, outilAccent } from "@/app/components/astuces/OutilLogo";
import { FORMAT_LABELS, findArticle, formatCheckedAt, getOutil } from "@/app/data/guide-outils";

// /astuces/outils/:outilId/:articleId — un article : ses blocs, le
// sommaire du chapitre à droite, les sources officielles en pied.
export function AstucesArticlePage() {
  const th = useTh();
  const navigate = useNavigate();
  const { outilId, articleId } = useParams<{ outilId: string; articleId: string }>();
  const outil = getOutil(outilId);
  const found = outil ? findArticle(outil, articleId) : undefined;

  useEffect(() => {
    document.getElementById("guide-article-top")?.scrollIntoView({ block: "start" });
  }, [articleId]);

  if (!outil) return <Navigate to="/astuces" replace />;
  if (!found) return <Navigate to={`/astuces/outils/${outil.id}`} replace />;

  const { article, chapter, prev, next, index, total } = found;
  const accent = outilAccent(outil.id);
  const go = (id: string) => navigate(`/astuces/outils/${outil.id}/${id}`);

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8">
      <div id="guide-article-top" className="scroll-mt-6 fade-up space-y-5">
        <AstucesCrumbs items={[{ label: "Guide IA", to: "/astuces" }, { label: outil.name, to: `/astuces/outils/${outil.id}` }, { label: chapter.title }]} />
      </div>

      <div className="mt-6 grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_280px] gap-10">
        <article className="min-w-0 space-y-10">
          <header className="fade-up max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-wide px-2 py-1 rounded-full" style={{ background: `${accent}1f`, color: th.fg }}>{FORMAT_LABELS[article.format]}</span>
              <span className="inline-flex items-center gap-1 text-[12px] font-semibold" style={{ color: th.fg3 }}><Clock className="w-3.5 h-3.5" />{article.duration}</span>
              <span className="text-[12px] font-semibold tabular-nums" style={{ color: th.fg3 }}>· Article {index + 1} / {total}</span>
            </div>
            <h1 className="mt-3 text-[1.9rem] sm:text-[2.4rem] leading-[1.05] font-black" style={{ color: th.fg }}>{article.title}</h1>
          </header>

          {article.blocks.map((block, i) => <div key={i} className="fade-up"><GuideBlock block={block} /></div>)}

          <footer className="max-w-3xl rounded-[10px] p-5" style={{ background: th.navA }}>
            <p className="flex items-center gap-2 text-[14px] font-black" style={{ color: th.fg }}><ShieldCheck className="w-4 h-4" style={{ color: th.success }} />Sources officielles · vérifié le {formatCheckedAt(outil.checkedAt)}</p>
            <ul className="mt-2 space-y-1">
              {article.sources.map((s) => (
                <li key={s.url}>
                  <a href={s.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[13px]" style={{ color: th.fg2 }}>
                    <span className="ink-link">{s.label}</span><ExternalLink className="w-3 h-3" />
                  </a>
                </li>
              ))}
            </ul>
          </footer>

          <nav aria-label="Articles voisins" className="flex flex-col sm:flex-row gap-3 sm:justify-between pt-5 pb-4" style={{ borderTop: `1px solid ${th.sep}` }}>
            {prev ? <VBtn sm onClick={() => go(prev.article.id)}><ArrowLeft className="w-4 h-4" />{prev.article.title}</VBtn> : <span />}
            {next && <VBtn sm onClick={() => go(next.article.id)}>{next.article.title}<ArrowRight className="w-4 h-4" /></VBtn>}
          </nav>
        </article>

        <aside className="hidden xl:block">
          <div className="sticky top-4 space-y-4">
            <Link to={`/astuces/outils/${outil.id}`} className="flex items-center gap-3">
              <OutilLogo id={outil.id} className="w-10 h-10" />
              <span>
                <span className="block text-[14px] font-black" style={{ color: th.fg }}>{outil.name}</span>
                <span className="block text-[12px]" style={{ color: th.fg3 }}>Sommaire complet</span>
              </span>
            </Link>
            {outil.chapters.map((c) => (
              <div key={c.id}>
                <p className="eyebrow mb-1.5" style={{ color: th.fg3 }}>{c.title}</p>
                <ul>
                  {c.articles.map((a) => {
                    const on = a.id === article.id;
                    return (
                      <li key={a.id}>
                        <Link to={`/astuces/outils/${outil.id}/${a.id}`} aria-current={on ? "page" : undefined}
                          className="block text-[13px] leading-snug py-1.5 pl-3 transition-opacity hover:opacity-75"
                          style={{ color: on ? th.fg : th.fg2, fontWeight: on ? 800 : 500, borderLeft: `2px solid ${on ? accent : th.sep}` }}>
                          {a.title}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
