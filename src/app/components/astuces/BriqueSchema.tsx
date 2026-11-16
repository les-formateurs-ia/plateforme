import type { ReactNode } from "react";
import { cx } from "@/app/lib/cx";

// Schémas des briques de la bibliothèque Image : un dessin au trait (couleur
// du texte, donc lisible en clair comme en sombre) avec la teinte de la
// brique en accent. Ils illustrent le CONCEPT de la brique ; les photos
// générées, elles, montrent ses variations.
// Repère : viewBox 160 × 90 (16:9). Le trait garde la même épaisseur à toutes
// les tailles (vector-effect: non-scaling-stroke).

const RED = "#e5484d";
const PALETTE = ["#f4a6c0", "#f6d38e", "#6adeb1", "#78d5e2", "#b58de0"];

// Buste (tête + épaules), dessiné en (0,0) = haut de la tête, ~24 de haut.
function Bust({ x, y, s = 1, fill = "none", glasses }: { x: number; y: number; s?: number; fill?: string; glasses?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-10 24 L-10 19 Q-10 12 0 12 Q10 12 10 19 L10 24" fill={fill} />
      <circle cx={0} cy={5} r={5} />
      {glasses && <path d="M-3.8 5 a1.6 1.6 0 1 0 0.01 0 M2.2 5 a1.6 1.6 0 1 0 0.01 0 M-2.2 5 L-0.6 5 L0.6 5" strokeWidth={1.5} />}
    </g>
  );
}

// Silhouette en pied, (0,0) = haut de la tête, 60 de haut.
function Body({ x, y, s = 1, fill = "none", arms = "M-9 18 L-12 34 M9 18 L12 34", children }: {
  x: number; y: number; s?: number; fill?: string; arms?: string; children?: ReactNode;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <circle cx={0} cy={5.5} r={5.5} />
      <path d="M-8 36 L-9 17 Q-9 13 -5 13 L5 13 Q9 13 9 17 L8 36 Z" fill={fill} />
      <path d={arms} />
      <path d="M-4 36 L-5 60 M4 36 L5 60" />
      {children}
    </g>
  );
}

// Appareil photo orienté vers une cible, avec la ligne de visée.
function Cam({ x, y, tx, ty, fill = "none" }: { x: number; y: number; tx: number; ty: number; fill?: string }) {
  const deg = (Math.atan2(ty - y, tx - x) * 180) / Math.PI;
  return (
    <g>
      <path d={`M${x} ${y} L${tx} ${ty}`} strokeDasharray="3 4" opacity={0.55} />
      <g transform={`translate(${x} ${y}) rotate(${deg})`}>
        <rect x={-9} y={-5.5} width={12} height={11} rx={2} fill={fill} />
        <path d="M3 -3 L9 -6 L9 6 L3 3 Z" fill={fill} />
      </g>
    </g>
  );
}

function Tree({ x, y, s = 1, dashed }: { x: number; y: number; s?: number; dashed?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} strokeDasharray={dashed ? "2 3" : undefined}>
      <path d="M0 0 L0 -14" />
      <circle cx={0} cy={-21} r={8} />
    </g>
  );
}

const SCHEMAS: Record<string, (tint: string) => ReactNode> = {
  // Qui ou quoi, exactement ? — un sujet décrit trait par trait.
  sujet: (tint) => (
    <>
      <path d="M30 22 V14 H38 M82 14 H90 V22 M90 68 V76 H82 M38 76 H30 V68" />
      <Bust x={60} y={22} s={2} fill={tint} glasses />
      <path d="M68 31 L100 24 M80 52 L100 45 M82 66 L100 66" opacity={0.6} />
      <rect x={102} y={19} width={42} height={10} rx={2} fill={tint} />
      <rect x={102} y={40} width={32} height={10} rx={2} fill={tint} />
      <rect x={102} y={61} width={46} height={10} rx={2} fill={tint} />
    </>
  ),
  // Que fait le sujet, que ressent-il ?
  action: (tint) => (
    <>
      <path d="M54 32 q-6 10 0 20 M45 27 q-9 15 0 30 M106 32 q6 10 0 20 M115 27 q9 15 0 30" opacity={0.55} />
      <Body x={80} y={14} s={1.15} fill={tint} arms="M-9 18 L-17 3 M9 18 L17 3">
        <path d="M-2.5 7 q2.5 2.5 5 0" />
      </Body>
      <circle cx={58} cy={14} r={3} fill={tint} />
      <circle cx={102} cy={14} r={3} fill={tint} />
      <path d="M60 85 H100" opacity={0.4} />
    </>
  ),
  // À quelle distance ? — plans emboîtés, du plan large au gros plan.
  cadrage: (tint) => (
    <>
      <rect x={10} y={4} width={140} height={82} rx={2} strokeDasharray="2 4" opacity={0.6} />
      <path d="M14 76 H146" opacity={0.4} />
      <Tree x={130} y={76} />
      <rect x={68} y={10} width={24} height={20} rx={2} fill={tint} opacity={0.85} />
      <Body x={80} y={14} s={1.03} />
      <rect x={58} y={8} width={44} height={46} rx={2} strokeDasharray="6 3" />
      <rect x={50} y={6} width={60} height={74} rx={2} />
    </>
  ),
  // D'où regarde-t-on ? — dessus, plongée, hauteur des yeux, contre-plongée.
  angle: (tint) => (
    <>
      <Bust x={104} y={36} s={1.5} fill={tint} />
      <Cam x={104} y={10} tx={104} ty={34} />
      <Cam x={42} y={14} tx={98} ty={42} />
      <Cam x={28} y={46} tx={94} ty={46} fill={tint} />
      <Cam x={42} y={80} tx={98} ty={52} />
    </>
  ),
  // Qu'est-ce qui est net ? — le plan de netteté, le reste flou.
  objectif: (tint) => (
    <>
      <path d="M28 45 L152 10 M28 45 L152 80" strokeDasharray="3 4" opacity={0.5} />
      <rect x={86} y={20} width={18} height={50} rx={2} fill={tint} opacity={0.55} stroke="none" />
      <g transform="translate(18 45)">
        <rect x={-10} y={-7} width={14} height={14} rx={2} />
        <path d="M4 -4 L10 -6 L10 6 L4 4 Z" />
      </g>
      <circle cx={54} cy={50} r={8} strokeDasharray="2 3" opacity={0.4} />
      <Bust x={95} y={30} s={1.25} fill={tint} />
      <Tree x={134} y={60} s={1.1} dashed />
    </>
  ),
  // D'où vient la lumière, et comment est-elle ?
  lumiere: (tint) => (
    <>
      <path d="M60 68 H152" opacity={0.4} />
      <ellipse cx={122} cy={68} rx={24} ry={4.5} fill="currentColor" opacity={0.18} stroke="none" />
      <circle cx={96} cy={46} r={20} fill={tint} />
      <path d="M96 26 A20 20 0 0 1 96 66 A10 20 0 0 0 96 26 Z" fill="currentColor" opacity={0.2} stroke="none" />
      <circle cx={30} cy={22} r={7} fill={tint} />
      <path d="M30 9 V12 M30 32 V35 M17 22 H20 M40 22 H43 M21 13 L23 15 M37 29 L39 31 M39 13 L37 15 M21 31 L23 29" />
      <path d="M40 27 L74 38 M38 33 L72 50 M42 21 L80 28" strokeDasharray="3 4" opacity={0.6} />
    </>
  ),
  // Quelles couleurs dominent ? — un nuancier en éventail.
  couleurs: () => (
    <>
      {PALETTE.map((color, i) => (
        <g key={color} transform={`translate(80 84) rotate(${(i - 2) * 20})`}>
          <rect x={-11} y={-74} width={22} height={58} rx={3} fill={color} />
          <path d="M-11 -26 H11" opacity={0.5} />
        </g>
      ))}
      <circle cx={80} cy={84} r={3} fill="currentColor" />
    </>
  ),
  // Où se passe la scène, et quand ?
  decor: (tint) => (
    <>
      <path d="M16 72 L50 30 L68 50 L88 22 L124 72 Z" fill={tint} opacity={0.6} />
      <path d="M44 37 L50 30 L56 37 M82 30 L88 22 L94 30" />
      <circle cx={132} cy={20} r={8} />
      <path d="M100 18 q4 -6 10 -3 q4 -3 8 1 q5 0 5 4 H100 Z" opacity={0.6} />
      <path d="M8 72 H152" />
      <Tree x={142} y={72} />
      <Body x={66} y={50} s={0.36} fill={tint} />
    </>
  ),
  // Quelles surfaces, quelles textures ? — bois, marbre, béton, lin.
  matieres: (tint) => (
    <>
      <rect x={8} y={22} width={32} height={46} rx={2} fill={tint} opacity={0.75} />
      <path d="M8 31 q8 -3 16 0 t16 0 M8 41 q8 3 16 0 t16 0 M8 51 q8 -3 16 0 t16 0 M8 61 q8 3 16 0 t16 0" strokeWidth={1.5} />
      <rect x={46} y={22} width={32} height={46} rx={2} />
      <path d="M48 30 q10 6 12 16 t16 18 M60 46 q6 -2 16 -10" strokeWidth={1.5} opacity={0.6} />
      <rect x={84} y={22} width={32} height={46} rx={2} fill="currentColor" fillOpacity={0.12} />
      {[[90, 29], [101, 33], [110, 27], [94, 41], [106, 45], [89, 54], [99, 57], [111, 61], [92, 64], [104, 37], [113, 50]].map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={0.9} fill="currentColor" />
      ))}
      <rect x={122} y={22} width={32} height={46} rx={2} fill={tint} opacity={0.35} />
      <path d="M126 22 V68 M130 22 V68 M134 22 V68 M138 22 V68 M142 22 V68 M146 22 V68 M150 22 V68 M122 27 H154 M122 33 H154 M122 39 H154 M122 45 H154 M122 51 H154 M122 57 H154 M122 63 H154" strokeWidth={1} opacity={0.4} />
    </>
  ),
  // Photo, illustration, 3D… — le même sujet dans trois médiums.
  style: (tint) => (
    <>
      {[14, 60, 106].map((x) => <rect key={x} x={x} y={18} width={40} height={54} rx={2} />)}
      <ellipse cx={34} cy={62} rx={11} ry={2.5} fill="currentColor" opacity={0.18} stroke="none" />
      <circle cx={34} cy={46} r={12} fill={tint} />
      <ellipse cx={30} cy={41} rx={3.5} ry={2.2} fill="#fff" opacity={0.8} stroke="none" />
      <path d="M34 34 q1 -5 4 -6" />
      <circle cx={80} cy={46} r={12} strokeDasharray="5 1.5" />
      <path d="M84 38 L89 43 M82 42 L90 50 M80 46 L88 54 M79 51 L84 56" strokeWidth={1} />
      <path d="M80 34 q1 -5 4 -6" />
      <path d="M126 33 L136 39 L136 52 L126 58 L116 52 L116 39 Z" fill={tint} />
      <path d="M126 33 L131 27 L134 31 Z" fill="currentColor" />
    </>
  ),
  // Que doit ressentir la personne qui regarde ? — chaleur ou mélancolie.
  ambiance: (tint) => (
    <>
      <circle cx={46} cy={40} r={26} fill={tint} opacity={0.22} stroke="none" />
      <circle cx={46} cy={40} r={16} fill={tint} opacity={0.45} stroke="none" />
      <path d="M36 32 L56 32 L51 18 L41 18 Z" fill={tint} />
      <path d="M46 32 V74 M36 74 H56" />
      <circle cx={46} cy={36} r={3} fill="currentColor" />
      <path d="M80 8 V82" strokeDasharray="2 4" opacity={0.4} />
      <path d="M100 38 q-8 0 -8 -7 q0 -7 8 -7 q2 -9 12 -9 q9 0 11 8 q9 0 9 8 q0 7 -8 7 Z" fill="currentColor" fillOpacity={0.12} />
      <path d="M102 46 L98 56 M112 46 L108 56 M122 46 L118 56 M107 60 L103 70 M117 60 L113 70" strokeDasharray="3 3" />
    </>
  ),
  // Quel niveau de détail ? — du flou « IA » au détail net.
  rendu: (tint) => (
    <>
      <circle cx={42} cy={45} r={20} opacity={0.25} />
      <circle cx={45} cy={43} r={20} opacity={0.25} />
      <circle cx={43} cy={46} r={20} fill={tint} fillOpacity={0.3} opacity={0.5} />
      <path d="M72 45 H88 M83 40 L88 45 L83 50" />
      <circle cx={118} cy={45} r={20} fill={tint} />
      <path d="M106 37 l3 3 l3 -3 l3 3 l3 -3 l3 3 l3 -3 l3 3 l3 -3 M103 45 l3 3 l3 -3 l3 3 l3 -3 l3 3 l3 -3 l3 3 l3 -3 l3 3 l3 -3 M106 53 l3 3 l3 -3 l3 3 l3 -3 l3 3 l3 -3 l3 3 l3 -3" strokeWidth={1} />
      <circle cx={140} cy={22} r={7} />
      <path d="M145 27 L151 33" />
    </>
  ),
  // Faut-il écrire dans l'image ? — un titre exact, un sous-titre, une place.
  texte: (tint) => (
    <>
      <text x={30} y={56} textAnchor="middle" fontSize={26} fontWeight={900} fill="currentColor" stroke="none">Aa</text>
      <rect x={56} y={6} width={58} height={78} rx={2} />
      <rect x={62} y={13} width={46} height={14} rx={1} fill={tint} />
      <text x={85} y={24} textAnchor="middle" fontSize={10} fontWeight={900} fill="#111" stroke="none" letterSpacing={0.5}>TITRE</text>
      <rect x={70} y={31} width={30} height={3} rx={1} fill="currentColor" opacity={0.5} stroke="none" />
      <rect x={62} y={40} width={46} height={38} rx={1} strokeDasharray="3 3" opacity={0.6} />
      <path d="M66 74 L78 58 L86 66 L92 60 L104 74" opacity={0.6} />
      <path d="M124 20 H142 M124 32 H136" opacity={0.5} />
    </>
  ),
  // Où placer les éléments ? — règle des tiers et espace pour un titre.
  format: (tint) => (
    <>
      <rect x={24} y={8} width={112} height={74} rx={2} />
      <path d="M61.3 8 V82 M98.7 8 V82 M24 32.7 H136 M24 57.3 H136" strokeDasharray="2 3" opacity={0.45} />
      <Bust x={98.7} y={26} s={1.6} fill={tint} />
      <rect x={32} y={36} width={24} height={5} rx={1} fill="currentColor" opacity={0.7} stroke="none" />
      <rect x={32} y={45} width={16} height={3} rx={1} fill="currentColor" opacity={0.4} stroke="none" />
      {[[61.3, 32.7], [98.7, 32.7], [61.3, 57.3], [98.7, 57.3]].map(([cx, cy]) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={1.8} fill="currentColor" />)}
    </>
  ),
  // Qu'est-ce qui ne doit pas apparaître ? — on le décrit en positif.
  exclusions: (tint) => (
    <>
      <path d="M8 46 H152" opacity={0.5} />
      <path d="M14 54 q5 -3 10 0 t10 0 M44 54 q5 -3 10 0 t10 0" opacity={0.4} />
      <path d="M8 78 H152" />
      <path d="M38 78 Q42 60 38 38" />
      <path d="M38 38 q-12 -4 -18 6 M38 38 q-8 -10 -20 -6 M38 38 q8 -10 20 -6 M38 38 q12 -2 16 8" />
      <path d="M94 56 Q112 38 130 56 Z" fill={tint} />
      <path d="M112 56 V78" />
      <circle cx={112} cy={58} r={22} stroke={RED} strokeWidth={3} />
      <path d="M96.4 73.6 L127.6 42.4" stroke={RED} strokeWidth={3} />
    </>
  ),
  // Comment garder le même personnage d'une image à l'autre ?
  coherence: (tint) => (
    <>
      {[12, 61, 110].map((x) => <rect key={x} x={x} y={14} width={38} height={56} rx={2} />)}
      <Bust x={31} y={30} s={1.3} fill={tint} glasses />
      <Bust x={74} y={40} s={1.0} fill={tint} glasses />
      <path d="M91 70 V60 M91 64 q-4 -1 -5 -6 M91 62 q4 -1 5 -6" opacity={0.6} />
      <Bust x={129} y={22} s={2.0} fill={tint} glasses />
      <path d="M53 40 H58 M53 44 H58 M102 40 H107 M102 44 H107" strokeWidth={2.5} />
    </>
  ),
};

export function hasBriqueSchema(briqueId: string): boolean {
  return briqueId in SCHEMAS;
}

export function BriqueSchema({ briqueId, tint, label, className }: { briqueId: string; tint: string; label?: string; className?: string }) {
  const draw = SCHEMAS[briqueId];
  if (!draw) return null;
  return (
    <svg viewBox="0 0 160 90" role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true}
      className={cx("block w-full h-auto [&_*]:[vector-effect:non-scaling-stroke]", className)}>
      <g fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        {draw(tint)}
      </g>
    </svg>
  );
}
