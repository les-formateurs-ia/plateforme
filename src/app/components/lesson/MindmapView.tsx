import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Minus, Maximize2 } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import type { MindmapNode, MindmapTree } from "@/app/lib/mindmaps";

// Palette de branches (chaque nœud du mindmap a sa propre teinte, pour les
// distinguer visuellement) — décorative et fixe, pas l'accent principal de
// l'interface, ne suit donc pas la couleur de rôle.
const PALETTE = ["#b58de0", "#78d5e2", "#73d8d2", "#fbc2ad", "#fcd7bd", "#fceccd", "#6fdbc2", "#6adeb1"];
const RADIUS_STEP = 165;

interface Positioned {
  key: string;
  node: MindmapNode;
  x: number;
  y: number;
  depth: number;
  color: string;
  parent?: { x: number; y: number };
}

function layout(
  node: MindmapNode,
  key: string,
  depth: number,
  angleStart: number,
  angleEnd: number,
  color: string,
  parent: { x: number; y: number } | undefined,
  expanded: Set<string>,
  out: Positioned[],
) {
  const angle = (angleStart + angleEnd) / 2;
  const radius = depth * RADIUS_STEP;
  const x = depth === 0 ? 0 : radius * Math.cos(angle);
  const y = depth === 0 ? 0 : radius * Math.sin(angle);
  out.push({ key, node, x, y, depth, color, parent });

  const children = node.children ?? [];
  if (!children.length || (depth > 0 && !expanded.has(key))) return;
  const span = angleEnd - angleStart;
  const step = span / children.length;
  children.forEach((child, i) => {
    const childColor = depth === 0 ? PALETTE[i % PALETTE.length] : color;
    layout(child, `${key}.${i}`, depth + 1, angleStart + i * step, angleStart + (i + 1) * step, childColor, { x, y }, expanded, out);
  });
}

function NodeButton({ pos, selected, onSelect, th }: { pos: Positioned; selected: boolean; onSelect: () => void; th: ReturnType<typeof useTh> }) {
  const isRoot = pos.depth === 0;
  const hasChildren = !!pos.node.children?.length;
  return (
    <button
      onMouseDown={(e) => e.stopPropagation()}
      onClick={onSelect}
      className="absolute rounded-xl font-bold text-left transition-all"
      style={{
        left: pos.x, top: pos.y, transform: "translate(-50%,-50%)",
        maxWidth: isRoot ? 220 : 170,
        padding: isRoot ? "12px 18px" : "8px 12px",
        fontSize: isRoot ? 14 : 12,
        background: isRoot ? `linear-gradient(135deg,${th.grad1},${th.grad2})` : selected ? pos.color : th.isDark ? "rgba(255,255,255,0.06)" : "#fff",
        color: isRoot ? "#08060F" : selected ? "#08060F" : th.fg2,
        border: `1.5px solid ${isRoot ? "transparent" : pos.color}`,
        boxShadow: selected ? `0 0 0 3px ${pos.color}33` : isRoot ? `0 4px 20px ${th.gradShadow(0.4)}` : "none",
        cursor: hasChildren || pos.node.summary || pos.node.examples?.length ? "pointer" : "default",
        zIndex: selected ? 5 : isRoot ? 4 : 3,
        whiteSpace: "normal",
        lineHeight: 1.3,
      }}
    >
      {pos.node.label}
      {!isRoot && hasChildren && <span className="ml-1 opacity-60">{pos.node.children!.length}</span>}
    </button>
  );
}

export function MindmapView({ tree }: { tree: MindmapTree }) {
  const th = useTh();
  const containerRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [view, setView] = useState({ x: 0, y: 0, scale: 0.85 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ dragging: boolean; startX: number; startY: number; ox: number; oy: number }>({ dragging: false, startX: 0, startY: 0, ox: 0, oy: 0 });

  const rootNode: MindmapNode = { label: tree.title, children: tree.children };
  const positions = useMemo(() => {
    const out: Positioned[] = [];
    layout(rootNode, "root", 0, 0, Math.PI * 2, `${th.grad1}`, undefined, expanded, out);
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tree, expanded]);

  const selected = positions.find((p) => p.key === selectedKey) ?? null;

  const toggle = (pos: Positioned) => {
    setSelectedKey((k) => (k === pos.key ? null : pos.key));
    if (pos.node.children?.length) {
      setExpanded((prev) => {
        const next = new Set(prev);
        if (next.has(pos.key)) next.delete(pos.key); else next.add(pos.key);
        return next;
      });
    }
    setView((v) => ({ ...v, x: -pos.x * v.scale - 90, y: -pos.y * v.scale }));
  };

  const onMouseDown = (e: React.MouseEvent) => {
    dragRef.current = { dragging: true, startX: e.clientX, startY: e.clientY, ox: view.x, oy: view.y };
    setIsDragging(true);
  };
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragRef.current.dragging) return;
      setView((v) => ({ ...v, x: dragRef.current.ox + (e.clientX - dragRef.current.startX), y: dragRef.current.oy + (e.clientY - dragRef.current.startY) }));
    };
    const onUp = () => { dragRef.current.dragging = false; setIsDragging(false); };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setView((v) => ({ ...v, scale: Math.min(2.2, Math.max(0.35, v.scale - e.deltaY * 0.001)) }));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const resetView = () => setView({ x: 0, y: 0, scale: 0.85 });
  const zoom = (delta: number) => setView((v) => ({ ...v, scale: Math.min(2.2, Math.max(0.35, v.scale + delta)) }));

  return (
    <div className="relative w-full h-full overflow-hidden select-none" style={{ cursor: "grab" }}
      ref={containerRef} onMouseDown={onMouseDown}>
      <div className="absolute inset-0" style={{ transformOrigin: "center", transform: `translate(${view.x}px,${view.y}px) scale(${view.scale})`, transition: isDragging ? "none" : "transform 0.35s cubic-bezier(0.16,1,0.3,1)" }}>
        <div className="absolute" style={{ left: "50%", top: "50%" }}>
          <svg className="absolute pointer-events-none" style={{ left: -4000, top: -4000, width: 8000, height: 8000, overflow: "visible" }} viewBox="-4000 -4000 8000 8000">
            {positions.filter((p) => p.parent).map((p) => (
              <path key={`edge-${p.key}`}
                d={`M ${p.parent!.x} ${p.parent!.y} Q ${(p.parent!.x + p.x) / 2 + (p.y - p.parent!.y) * 0.15} ${(p.parent!.y + p.y) / 2 - (p.x - p.parent!.x) * 0.15} ${p.x} ${p.y}`}
                fill="none" stroke={p.color} strokeWidth={p.depth === 1 ? 2.5 : 1.5} opacity={p.depth === 1 ? 0.55 : 0.35} />
            ))}
          </svg>
          {positions.map((p) => (
            <NodeButton key={p.key} pos={p} selected={p.key === selectedKey} onSelect={() => toggle(p)} th={th} />
          ))}
        </div>
      </div>

      <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
        <button onMouseDown={(e) => e.stopPropagation()} onClick={() => zoom(0.2)} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.15)" }}><Plus className="w-4 h-4 text-white/70" /></button>
        <button onMouseDown={(e) => e.stopPropagation()} onClick={() => zoom(-0.2)} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.15)" }}><Minus className="w-4 h-4 text-white/70" /></button>
        <button onMouseDown={(e) => e.stopPropagation()} onClick={resetView} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.15)" }}><Maximize2 className="w-3.5 h-3.5 text-white/70" /></button>
      </div>

      {selected && (selected.node.summary || selected.node.examples?.length) && (
        <div onMouseDown={(e) => e.stopPropagation()} className="absolute top-3 right-3 w-72 rounded-2xl p-4 max-h-[85%] overflow-y-auto"
          style={{ background: "rgba(10,6,20,0.92)", backdropFilter: "blur(16px)", border: `1px solid ${selected.color}55`, boxShadow: "0 8px 30px rgba(0,0,0,0.4)" }}>
          <div className="text-xs font-black mb-2" style={{ color: selected.color }}>{selected.node.label}</div>
          {selected.node.summary && <p className="text-xs leading-relaxed mb-3 text-white/70">{selected.node.summary}</p>}
          {!!selected.node.examples?.length && (
            <div className="space-y-1.5">
              {selected.node.examples.map((ex, i) => (
                <div key={i} className="text-[11px] leading-snug rounded-lg px-2.5 py-2" style={{ background: `${selected.color}18`, border: `1px solid ${selected.color}40`, color: "#fff" }}>{ex}</div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
