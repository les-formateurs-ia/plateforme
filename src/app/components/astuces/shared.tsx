import { Fragment, useState } from "react";
import { Link, useNavigate } from "react-router";
import { ChevronRight, Globe, ImageIcon, Video, type LucideIcon } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import type { AstuceDomain, AstuceDomainId, MediaRatio } from "@/app/data/astuces";

export const DOMAIN_ICONS: Record<AstuceDomainId, LucideIcon> = { image: ImageIcon, video: Video, web: Globe };

// Pastels de la charte (rôles + iris) : une teinte par brique dans
// l'anatomie d'un prompt. Sur fond clair comme sombre, le texte reste à
// l'encre et la teinte n'est qu'un surlignage, comme .hl.
const BRIQUE_TINTS = ["#b58de0", "#78d5e2", "#6adeb1", "#fbc2ad", "#f6d38e", "#dbacf0", "#9fc3f5", "#f4a6c0", "#c5e48a", "#f0b27a"];

// Fil d'Ariane vers la bibliothèque des briques (sous les cas pratiques).
export const BRIQUES_CRUMB = { label: "Les briques", to: "/astuces#briques" };

// Grille de variations : deux colonnes dès le mobile pour les formats
// carrés/verticaux (comparaison côte à côte), une seule pour le 16:9.
export const GRID_BY_RATIO: Record<MediaRatio, string> = {
  "16:9": "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3",
  "1:1": "grid-cols-2 lg:grid-cols-3",
  "3:4": "grid-cols-2 lg:grid-cols-3",
  "2:3": "grid-cols-2 lg:grid-cols-3",
  "4:5": "grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5",
  "9:16": "grid-cols-2 sm:grid-cols-3",
  "16:10": "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3",
};

export function briqueTint(domain: AstuceDomain, briqueId: string): string {
  return tintAt(domain.briques.findIndex((b) => b.id === briqueId));
}

export function tintAt(index: number): string {
  return BRIQUE_TINTS[(index < 0 ? 0 : index) % BRIQUE_TINTS.length];
}

export function briqueNumber(domain: AstuceDomain, briqueId: string): string {
  return String(domain.briques.findIndex((b) => b.id === briqueId) + 1).padStart(2, "0");
}

export function AstucesCrumbs({ items }: { items: { label: string; to?: string }[] }) {
  const th = useTh();
  return (
    <nav aria-label="Fil d'Ariane" className="flex flex-wrap items-center gap-1 text-sm">
      {items.map((item, i) => (
        <Fragment key={item.label}>
          {i > 0 && <ChevronRight className="w-3.5 h-3.5 shrink-0" style={{ color: th.fg3 }} />}
          {item.to ? (
            <Link to={item.to} className="ink-link" style={{ color: th.fg3 }}>{item.label}</Link>
          ) : (
            <span className="font-semibold" style={{ color: th.fg }}>{item.label}</span>
          )}
        </Fragment>
      ))}
    </nav>
  );
}

// Un bon prompt découpé en passages : chaque passage est surligné de la
// couleur de sa brique ; survoler un passage ou une étiquette allume la
// paire, cliquer ouvre la brique.
export function PromptAnatomy({ domain }: { domain: AstuceDomain }) {
  const th = useTh();
  const navigate = useNavigate();
  const [active, setActive] = useState<string | null>(null);
  const used = domain.anatomy.segments.map((s) => s.brique).filter((b, i, all): b is string => !!b && all.indexOf(b) === i);
  const open = (id: string) => navigate(`/astuces/${domain.id}/briques/${id}`);

  return (
    <div>
      <p className="text-[15px] sm:text-[17px] leading-[1.9]" style={{ color: th.fg }}>
        {domain.anatomy.segments.map((s, i) => {
          if (!s.brique) return <span key={i} style={{ color: th.fg2 }}>{s.text}</span>;
          const id = s.brique;
          const dim = active !== null && active !== id;
          // <span role="button"> plutôt que <button> : un bouton est
          // inline-block, il ne se coupe pas avec le texte et laisse la
          // ponctuation orpheline sur sa propre ligne en mobile.
          return (
            <span key={i} role="button" tabIndex={0} onClick={() => open(id)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(id); } }}
              onMouseEnter={() => setActive(id)} onMouseLeave={() => setActive(null)} onFocus={() => setActive(id)} onBlur={() => setActive(null)}
              className="cursor-pointer rounded-[3px] px-1 py-0.5 transition-opacity [box-decoration-break:clone] [-webkit-box-decoration-break:clone]"
              style={{ background: `${briqueTint(domain, id)}${th.isDark ? "4d" : "73"}`, color: th.fg, opacity: dim ? 0.35 : 1 }}>
              {s.text}
            </span>
          );
        })}
      </p>
      <div className="flex flex-wrap gap-2 mt-5">
        {used.map((id) => {
          const brique = domain.briques.find((b) => b.id === id);
          if (!brique) return null;
          return (
            <button key={id} type="button" onClick={() => open(id)} onMouseEnter={() => setActive(id)} onMouseLeave={() => setActive(null)}
              className="inline-flex items-center gap-1.5 rounded-[2px] px-2.5 py-1 text-xs font-semibold transition-opacity"
              style={{ border: `1px solid ${th.sep}`, color: th.fg, opacity: active !== null && active !== id ? 0.45 : 1 }}>
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: briqueTint(domain, id) }} />
              {brique.title}
            </button>
          );
        })}
      </div>
    </div>
  );
}
