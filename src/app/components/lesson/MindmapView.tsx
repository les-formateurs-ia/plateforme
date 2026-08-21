import { useState } from "react";
import { ChevronRight, Lightbulb } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import type { MindmapNode, MindmapTree } from "@/app/lib/mindmaps";

function Node({ node, depth }: { node: MindmapNode; depth: number }) {
  const th = useTh();
  const [open, setOpen] = useState(depth < 1);
  const hasChildren = !!node.children?.length;
  const hasExamples = !!node.examples?.length;
  const expandable = hasChildren || hasExamples || !!node.summary;

  return (
    <div style={{ marginLeft: depth > 0 ? 18 : 0 }}>
      <button
        onClick={() => expandable && setOpen((o) => !o)}
        className="w-full flex items-start gap-2 py-2.5 text-left transition-opacity hover:opacity-80"
        style={{ cursor: expandable ? "pointer" : "default" }}
      >
        {expandable ? (
          <ChevronRight className="w-3.5 h-3.5 mt-1 shrink-0 transition-transform" style={{ color: th.navAC, transform: open ? "rotate(90deg)" : "none" }} />
        ) : (
          <span className="w-3.5 shrink-0" />
        )}
        <span className="text-sm font-bold" style={{ color: depth === 0 ? th.fg : th.fg2 }}>{node.label}</span>
      </button>

      {open && (
        <div className="pl-5 pb-2 space-y-2" style={{ borderLeft: depth < 2 ? `1px solid ${th.sep}` : "none", marginLeft: 6 }}>
          {node.summary && <p className="text-xs leading-relaxed" style={{ color: th.fg3 }}>{node.summary}</p>}
          {hasExamples && (
            <div className="space-y-1">
              {node.examples!.map((ex, i) => (
                <div key={i} className="flex items-start gap-1.5 text-xs rounded-lg px-2.5 py-1.5" style={{ background: "rgba(155,93,229,0.06)", border: "1px solid rgba(155,93,229,0.15)", color: th.navAC }}>
                  <Lightbulb className="w-3 h-3 mt-0.5 shrink-0" />
                  <span>{ex}</span>
                </div>
              ))}
            </div>
          )}
          {hasChildren && (
            <div>
              {node.children!.map((child, i) => <Node key={i} node={child} depth={depth + 1} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function MindmapView({ tree }: { tree: MindmapTree }) {
  const th = useTh();
  return (
    <div className="text-left">
      <h3 className="text-base font-black mb-2" style={{ color: th.fg }}>{tree.title}</h3>
      <div>{tree.children.map((child, i) => <Node key={i} node={child} depth={0} />)}</div>
    </div>
  );
}
