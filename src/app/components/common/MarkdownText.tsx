import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useTh } from "@/app/theme/theme";

// Rendu Markdown pour du texte généré par IA (réponses LLM brutes) — les
// modèles répondent quasi systématiquement en Markdown (titres, gras,
// tableaux, listes) même sans qu'on le demande ; l'afficher tel quel montre
// les "**"/"##"/"|" littéraux au lieu du formatage voulu.
export function MarkdownText({ children }: { children: string }) {
  const th = useTh();
  return (
    <div className="text-sm leading-relaxed space-y-3" style={{ color: th.fg }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h1 className="text-base font-black mt-4 first:mt-0" style={{ color: th.fg }}>{children}</h1>,
          h2: ({ children }) => <h2 className="text-sm font-black mt-4 first:mt-0" style={{ color: th.fg }}>{children}</h2>,
          h3: ({ children }) => <h3 className="text-sm font-bold mt-3 first:mt-0" style={{ color: th.fg }}>{children}</h3>,
          p: ({ children }) => <p className="leading-relaxed">{children}</p>,
          strong: ({ children }) => <strong className="font-bold" style={{ color: th.fg }}>{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          ul: ({ children }) => <ul className="list-disc pl-5 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-5 space-y-1">{children}</ol>,
          li: ({ children }) => <li>{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="pl-3 italic" style={{ borderLeft: `2px solid ${th.navAC}`, color: th.fg2 }}>{children}</blockquote>
          ),
          hr: () => <hr style={{ borderColor: th.sep }} />,
          a: ({ children, href }) => <a href={href} target="_blank" rel="noreferrer" className="underline" style={{ color: th.navAC }}>{children}</a>,
          code: ({ children }) => (
            <code className="px-1.5 py-0.5 rounded text-xs font-mono" style={{ background: th.inputBg, border: `1px solid ${th.inputB}` }}>{children}</code>
          ),
          pre: ({ children }) => (
            <pre className="p-3 rounded-xl text-xs font-mono overflow-x-auto" style={{ background: th.inputBg, border: `1px solid ${th.inputB}` }}>{children}</pre>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto rounded-xl" style={{ border: `1px solid ${th.sep}` }}>
              <table className="w-full text-xs border-collapse">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead style={{ background: th.inputBg }}>{children}</thead>,
          tr: ({ children }) => <tr style={{ borderBottom: `1px solid ${th.sep}` }}>{children}</tr>,
          th: ({ children }) => <th className="text-left font-bold px-3 py-2" style={{ color: th.fg }}>{children}</th>,
          td: ({ children }) => <td className="px-3 py-2 align-top" style={{ color: th.fg2 }}>{children}</td>,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
