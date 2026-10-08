// Contenu des rubriques de l'espace élève entreprise (CompanyStudentHome) :
// grand encart de quiz, documents présentés comme des feuilles, exercices en
// encarts, et envoi de fichier en deux temps (catégorie obligatoire, puis
// fichier). Même langage visuel que les tuiles (EntrepriseKit / SectionTiles).
import { useState, type ChangeEvent, type CSSProperties } from "react";
import {
  ArrowRight, CheckCircle2, Download, FileArchive, FileAudio, FileImage, FileSpreadsheet, FileText, FileVideo,
  Folder, Heart, Presentation, Timer, Trophy, Upload, type LucideIcon,
} from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { cx } from "@/app/lib/cx";
import { SectionTile, SectionGrid } from "@/app/components/entreprise/SectionTiles";
import {
  BackButton, EmptyState, HueButton, IconBadge, ItemCard, ItemList, KitHeading, Panel, Pill, HUE_ORDER, SUCCESS, useHue, runMorph,
} from "@/app/components/entreprise/EntrepriseKit";
import type { VisiblePositioningTest } from "@/app/lib/entreprise/companyPositioning";
import type { CompanyFileRow } from "@/app/lib/entreprise/companyFiles";
import type { CompanyHtmlExerciseRow } from "@/app/lib/entreprise/companyHtmlExercises";
import type { CompanyFileCategoryRow } from "@/app/lib/entreprise/companyFileCategories";
import type { CompanyStudentUploadRow } from "@/app/lib/entreprise/companyStudentUploads";

const plural = (n: number, word: string, pluralWord = `${word}s`) => `${n} ${n > 1 ? pluralWord : word}`;

// ── Quiz et questionnaires : un grand encart pleine largeur par élément ──

// Quiz (score affiché une fois fait) ou questionnaire (remerciement, pas de score).
type FeaturedItem = Pick<VisiblePositioningTest, "id" | "title" | "questionCount" | "done"> & { score?: number | null };

export function FeaturedQuizzes({ tests, Icon, kindLabel, intro, emptyTitle = "Aucun quiz pour l'instant", emptyHint, variant = "quiz", onStart }: {
  tests: FeaturedItem[]; Icon: LucideIcon; kindLabel: string; intro: string; emptyTitle?: string; emptyHint: string; variant?: "quiz" | "survey"; onStart: (id: string) => void;
}) {
  if (!tests.length) return <EmptyState Icon={Icon} title={emptyTitle} hint={emptyHint} />;
  return <div className="space-y-5">{tests.map((t, i) => <FeaturedQuizTile key={t.id} test={t} Icon={Icon} kindLabel={kindLabel} intro={intro} variant={variant} index={i} onStart={() => onStart(t.id)} />)}</div>;
}

function FeaturedQuizTile({ test, Icon, kindLabel, intro, variant, index, onStart }: {
  test: FeaturedItem; Icon: LucideIcon; kindLabel: string; intro: string; variant: "quiz" | "survey"; index: number; onStart: () => void;
}) {
  const survey = variant === "survey";
  const th = useTh();
  const h = useHue();
  const minutes = Math.max(1, Math.round(test.questionCount * 0.75));
  return (
    <Panel index={index} onClick={test.done ? undefined : onStart} halo={false}>

      <div className="relative min-h-[280px] p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center gap-7">
        <div className="flex-1 min-w-0 flex flex-col gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <IconBadge Icon={Icon} size="lg" />
            <Pill tone="solid">{kindLabel}</Pill>
            {test.done && <Pill tone="done" Icon={CheckCircle2}>Terminé</Pill>}
          </div>
          <h3 className="text-2xl sm:text-[2rem] font-black leading-tight" style={{ color: th.fg, fontFamily: "'Funnel Display',sans-serif" }}>{test.title}</h3>
          <p className="text-base max-w-2xl" style={{ color: th.fg2 }}>{intro}</p>
          <div className="flex items-center gap-2 flex-wrap">
            <Pill>{plural(test.questionCount, "question")}</Pill>
            <Pill tone="muted" Icon={Timer}>≈ {minutes} min</Pill>
            <Pill tone="muted">{survey ? "Ton avis compte" : "Une seule tentative"}</Pill>
          </div>
          {!test.done && (
            <div className="pt-2">
              <span className="inline-flex items-center gap-2 rounded-[2px] px-6 py-3 text-base font-bold transition-transform duration-200 group-hover:-translate-y-0.5"
                style={{ background: h.gradient, color: "#fff", boxShadow: `0 10px 26px ${h.alpha(0.4)}`, textShadow: "0 1px 2px rgba(0,0,0,0.15)" }}>
                Commencer<ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
              </span>
            </div>
          )}
        </div>

        {/* Anneau : nombre de questions avant, score après. */}
        <div className="shrink-0 self-center">
          <div className="w-40 h-40 sm:w-44 sm:h-44 rounded-full p-2" style={{ background: test.done ? (survey ? SUCCESS : `conic-gradient(${SUCCESS} ${test.score ?? 0}%, ${th.inputBg} 0)`) : h.gradient, boxShadow: `0 16px 40px ${h.alpha(0.3)}` }}>
            <div className="w-full h-full rounded-full flex flex-col items-center justify-center text-center" style={{ background: th.card }}>
              {test.done && survey ? (
                <>
                  <Heart className="w-10 h-10 mb-1" style={{ color: SUCCESS, fill: SUCCESS }} />
                  <span className="text-2xl font-black" style={{ color: th.fg, fontFamily: "'Funnel Display',sans-serif" }}>Merci !</span>
                  <span className="text-xs font-bold uppercase tracking-widest mt-1" style={{ color: th.fg3 }}>Réponses envoyées</span>
                </>
              ) : test.done ? (
                <>
                  <Trophy className="w-6 h-6 mb-1" style={{ color: SUCCESS }} />
                  <span className="text-4xl font-black tabular-nums" style={{ color: th.fg, fontFamily: "'Funnel Display',sans-serif" }}>{test.score}%</span>
                  <span className="text-xs font-bold uppercase tracking-widest mt-1" style={{ color: th.fg3 }}>Ton score</span>
                </>
              ) : (
                <>
                  <span className="text-5xl font-black tabular-nums" style={{ color: h.text, fontFamily: "'Funnel Display',sans-serif" }}>{test.questionCount}</span>
                  <span className="text-xs font-bold uppercase tracking-widest mt-1" style={{ color: th.fg3 }}>question{test.questionCount > 1 ? "s" : ""}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </Panel>
  );
}

// ── Supports de cours : chaque document présenté comme une feuille ─────────────────

function fileExtension(file: CompanyFileRow): string {
  const source = file.storagePath.split("/").pop() ?? file.name;
  const match = /\.([a-z0-9]{1,5})$/i.exec(source) ?? /\.([a-z0-9]{1,5})$/i.exec(file.name);
  return match ? match[1].toUpperCase() : "DOC";
}

function fileIcon(ext: string, mime: string | null): LucideIcon {
  if (mime?.startsWith("image/") || ["PNG", "JPG", "JPEG", "GIF", "WEBP", "SVG"].includes(ext)) return FileImage;
  if (mime?.startsWith("video/") || ["MP4", "MOV", "WEBM"].includes(ext)) return FileVideo;
  if (mime?.startsWith("audio/") || ["MP3", "WAV", "M4A"].includes(ext)) return FileAudio;
  if (["XLS", "XLSX", "CSV", "ODS"].includes(ext)) return FileSpreadsheet;
  if (["PPT", "PPTX", "KEY", "ODP"].includes(ext)) return Presentation;
  if (["ZIP", "RAR", "7Z"].includes(ext)) return FileArchive;
  return FileText;
}

function formatSize(bytes: number | null): string | null {
  if (!bytes) return null;
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export function DocumentShelf({ files, onOpen }: { files: CompanyFileRow[]; onOpen: (file: CompanyFileRow) => void }) {
  if (!files.length) return <EmptyState Icon={FileText} title="Aucun fichier pour l'instant" hint="Les supports de ta formation apparaîtront ici." />;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-8">
      {files.map((f, i) => <DocumentSheet key={f.id} file={f} index={i} onOpen={() => onOpen(f)} />)}
    </div>
  );
}

const FOLD = 30;

function DocumentSheet({ file, index, onOpen }: { file: CompanyFileRow; index: number; onOpen: () => void }) {
  const th = useTh();
  const h = useHue();
  const ext = fileExtension(file);
  const Icon = fileIcon(ext, file.mimeType);
  const size = formatSize(file.fileSize);
  // La feuille est découpée (coin replié) : l'ombre passe donc par un filtre
  // drop-shadow sur le parent, une box-shadow serait coupée avec elle.
  const shadow = th.isDark ? "drop-shadow(0 10px 22px rgba(0,0,0,0.45))" : "drop-shadow(0 10px 22px rgba(15,14,20,0.12))";
  return (
    <button type="button" onClick={onOpen} title={file.description ? `${file.name}\n\n${file.description}` : `Ouvrir « ${file.name} »`}
      className="fade-up group text-left focus-visible:outline-none" style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}>
      <div className="transition-transform duration-300 group-hover:-translate-y-1.5 group-hover:-rotate-1" style={{ filter: shadow }}>
        <div className="relative aspect-[3/4] overflow-hidden rounded-2xl"
          style={{ background: th.card, clipPath: `polygon(0 0, calc(100% - ${FOLD}px) 0, 100% ${FOLD}px, 100% 100%, 0 100%)` } as CSSProperties}>
          {/* Bandeau de couleur en tête de feuille */}
          <div className="h-2" style={{ background: h.gradient }} />
          <div className="p-4 sm:p-5 flex flex-col h-[calc(100%-0.5rem)]">
            <div className="flex items-center gap-2">
              <span className="rounded-md px-2 py-0.5 text-[10px] font-black tracking-wider" style={{ background: h.gradient, color: "#fff" }}>{ext}</span>
              <Icon className="w-4 h-4" style={{ color: h.text }} />
            </div>
            <div className="mt-3 text-base sm:text-lg font-black leading-snug line-clamp-3 break-words" style={{ color: th.fg, fontFamily: "'Funnel Display',sans-serif" }}>{file.name}</div>
            {/* Corps de la feuille : la description, sinon des lignes factices pour l'aspect "document". */}
            <div className="mt-3 flex-1 min-h-0 overflow-hidden">
              {file.description ? (
                <p className="text-xs sm:text-[13px] leading-relaxed line-clamp-6 whitespace-pre-line" style={{ color: th.fg2 }}>{file.description}</p>
              ) : (
                <div className="space-y-2 pt-1">
                  {[92, 100, 78, 96, 64].map((w, j) => (
                    <div key={j} className="h-1.5 rounded-full" style={{ width: `${w}%`, background: th.isDark ? "rgba(255,255,255,0.07)" : "rgba(15,14,20,0.06)" }} />
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center justify-between gap-2 pt-3" style={{ borderTop: `1px dashed ${th.sep}` }}>
              <span className="text-[11px] font-semibold" style={{ color: th.fg3 }}>{size ?? "Document"}</span>
              <span className="w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                style={{ background: h.gradient, color: "#fff", boxShadow: `0 4px 12px ${h.alpha(0.4)}` }}>
                <Download className="w-4 h-4" />
              </span>
            </div>
          </div>
          {/* Coin replié */}
          <div className="absolute top-0 right-0" style={{ width: FOLD, height: FOLD, background: h.gradient, clipPath: "polygon(0 0, 0 100%, 100% 100%)", opacity: 0.9 }} />
        </div>
      </div>
    </button>
  );
}

// ── Exercices : un encart par exercice ────────────────────────────────────

export function ExerciseTiles({ exercises, Icon, onOpen }: { exercises: CompanyHtmlExerciseRow[]; Icon: LucideIcon; onOpen: (id: string) => void }) {
  const h = useHue();
  if (!exercises.length) return <EmptyState Icon={Icon} title="Aucun exercice pour l'instant" hint="Les exercices pratiques apparaîtront ici." />;
  return (
    <SectionGrid>
      {exercises.map((ex, i) => (
        <SectionTile key={ex.id} index={i} label={ex.name} desc={ex.description || "Exercice interactif à réaliser en ligne."} Icon={Icon} hue={h.hue}
          badge={{ label: `Exercice ${i + 1}` }} cta="Commencer" onClick={() => onOpen(ex.id)} />
      ))}
    </SectionGrid>
  );
}

// ── Espace de dépôt : catégorie obligatoire, puis envoi ──────────────────────

const categoryMorphName = (id: string) => `kit-cat-${id}`;

export function CategoryUploads({ categories, uploads, uploading, onUpload }: {
  categories: CompanyFileCategoryRow[]; uploads: CompanyStudentUploadRow[]; uploading: boolean;
  onUpload: (categoryId: string, file: File) => Promise<boolean>;
}) {
  const th = useTh();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedIndex = categories.findIndex((c) => c.id === selectedId);
  const selected = selectedIndex >= 0 ? categories[selectedIndex] : null;
  // Changement de vue animé : la tuile choisie glisse jusqu'à l'en-tête de la
  // zone d'envoi (même nom de morph), les autres s'effacent — et inversement.
  const select = (id: string | null) => {
    const target = id ?? selectedId;
    if (target) runMorph(categoryMorphName(target), () => setSelectedId(id));
    else setSelectedId(id);
  };

  if (!categories.length) {
    return <EmptyState Icon={Folder} title="Aucune catégorie disponible" hint="Ton formateur doit d'abord créer les catégories de fichiers. Tu pourras ensuite envoyer tes fichiers ici." />;
  }

  if (selected) {
    return (
      <CategoryDropzone category={selected} hue={HUE_ORDER[selectedIndex % HUE_ORDER.length]} uploading={uploading}
        uploads={uploads.filter((u) => u.categoryId === selected.id)}
        onBack={() => select(null)} onUpload={(file) => onUpload(selected.id, file)} />
    );
  }

  return (
    <div data-morph-scope="" className="space-y-8">
      <div>
        <KitHeading>1. Choisis la catégorie de ton fichier</KitHeading>
        <SectionGrid>
          {categories.map((c, i) => {
            const count = uploads.filter((u) => u.categoryId === c.id).length;
            return (
              <SectionTile key={c.id} index={i} label={c.name} desc="Envoie ici les fichiers de cette catégorie." Icon={Folder}
                hue={HUE_ORDER[i % HUE_ORDER.length]} cta="Choisir"
                badge={count ? { label: `${plural(count, "envoyé")}`, tone: "done" } : { label: "Aucun envoi", tone: "muted" }}
                morphName={categoryMorphName(c.id)} onClick={() => select(c.id)} />
            );
          })}
        </SectionGrid>
      </div>

      {!!uploads.length && (
        <div>
          <KitHeading>Mes fichiers envoyés</KitHeading>
          <ItemList>
            {uploads.map((u, i) => (
              <ItemCard key={u.id} index={i} Icon={FileText} title={u.fileName}
                pills={<Pill tone={u.categoryName ? "hue" : "muted"} Icon={Folder}>{u.categoryName ?? "Sans catégorie"}</Pill>} />
            ))}
          </ItemList>
        </div>
      )}
      {!uploads.length && <p className="text-sm" style={{ color: th.fg3 }}>Tu n'as encore envoyé aucun fichier.</p>}
    </div>
  );
}

function CategoryDropzone({ category, hue, uploads, uploading, onBack, onUpload }: {
  category: CompanyFileCategoryRow; hue: (typeof HUE_ORDER)[number]; uploads: CompanyStudentUploadRow[]; uploading: boolean;
  onBack: () => void; onUpload: (file: File) => Promise<boolean>;
}) {
  const th = useTh();
  const h = useHue(hue);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);

  const submit = async () => {
    if (!file) return;
    if (await onUpload(file)) setFile(null);
  };

  return (
    <div data-morph-scope="" className="space-y-6">
      <BackButton label="Changer de catégorie" onClick={onBack} />

      <Panel hue={hue} watermark={Folder} morphName={categoryMorphName(category.id)}>
        <div className="p-6 sm:p-8 space-y-5">
          <div className="flex items-center gap-4">
            <IconBadge Icon={Folder} hue={hue} size="lg" />
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-widest" style={{ color: h.text }}>2. Envoie ton fichier dans</p>
              <h3 className="text-2xl font-black leading-tight truncate" style={{ color: th.fg, fontFamily: "'Funnel Display',sans-serif" }}>{category.name}</h3>
            </div>
          </div>

          <label
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); const dropped = e.dataTransfer.files?.[0]; if (dropped) setFile(dropped); }}
            className={cx("block cursor-pointer rounded-3xl transition-all duration-200", dragging && "scale-[1.01]")}>
            <input type="file" className="hidden" onChange={(e: ChangeEvent<HTMLInputElement>) => setFile(e.target.files?.[0] ?? null)} />
            <span className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center"
              style={{ background: h.alpha(dragging ? 0.14 : 0.06), border: `2px dashed ${h.alpha(dragging ? 0.8 : 0.45)}`, borderRadius: 24, color: th.fg }}>
              <span className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: h.gradient, boxShadow: `0 8px 20px ${h.alpha(0.35)}` }}>
                <Upload className="w-6 h-6" style={{ color: "#fff" }} />
              </span>
              <span className="text-base font-bold truncate max-w-full">{file ? file.name : "Glisse ton fichier ici ou clique pour le choisir"}</span>
              {file && <span className="text-xs" style={{ color: th.fg3 }}>{formatSize(file.size)}</span>}
            </span>
          </label>

          <HueButton hue={hue} Icon={Upload} onClick={() => void submit()} disabled={!file || uploading}>
            {uploading ? "Envoi..." : `Envoyer dans « ${category.name} »`}
          </HueButton>
        </div>
      </Panel>

      <div>
        <KitHeading hue={hue}>Déjà envoyés dans cette catégorie</KitHeading>
        {uploads.length ? (
          <ItemList>
            {uploads.map((u, i) => <ItemCard key={u.id} index={i} hue={hue} Icon={FileText} title={u.fileName} />)}
          </ItemList>
        ) : <p className="text-sm" style={{ color: th.fg3 }}>Aucun fichier envoyé dans cette catégorie pour l'instant.</p>}
      </div>
    </div>
  );
}
