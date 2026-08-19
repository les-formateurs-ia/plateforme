import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useLocation, Link } from "react-router";
import { ChevronLeft, Upload, Plus, Trash2, CheckCircle, ExternalLink } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { supabase } from "@/app/lib/supabase/client";
import { GCard } from "@/app/components/common/GCard";
import { GT } from "@/app/components/common/GT";
import { ShimBtn } from "@/app/components/common/Buttons";

interface QuizOptionDraft { id?: string; label: string; is_correct: boolean; }
interface QuizQuestionDraft { id?: string; question: string; explanation: string; options: QuizOptionDraft[]; }

const EMPTY_OPTION = (): QuizOptionDraft => ({ label: "", is_correct: false });
const EMPTY_QUESTION = (): QuizQuestionDraft => ({ question: "", explanation: "", options: [EMPTY_OPTION(), EMPTY_OPTION()] });

const slugify = (s: string) => s.toLowerCase().trim()
  .normalize("NFD").replace(/[̀-ͯ]/g, "")
  .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export function AdminLessonEditorPage() {
  const th = useTh();
  const navigate = useNavigate();
  const location = useLocation();
  const { courseId, lessonId: routeLessonId } = useParams();
  const isNew = !routeLessonId;
  const sectionIdFromState = (location.state as { sectionId?: string } | null)?.sectionId;

  const [sectionId, setSectionId] = useState<string | undefined>(sectionIdFromState);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [slugEditing, setSlugEditing] = useState(false);
  const [durationMinutes, setDurationMinutes] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [referenceContent, setReferenceContent] = useState("");
  const [aiContentPrompt, setAiContentPrompt] = useState("");
  const [practicalExercisePrompt, setPracticalExercisePrompt] = useState("");
  const [questions, setQuestions] = useState<QuizQuestionDraft[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isNew) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data: lesson } = await supabase.from("lessons").select("*").eq("id", routeLessonId).single();
      if (cancelled || !lesson) { setLoading(false); return; }
      setSectionId(lesson.section_id);
      setTitle(lesson.title);
      setSlug(lesson.slug);
      setSlugTouched(true);
      setDurationMinutes(lesson.duration_minutes?.toString() ?? "");
      setVideoUrl(lesson.video_url ?? "");
      setReferenceContent(lesson.reference_content ?? "");
      setAiContentPrompt(lesson.ai_content_prompt ?? "");
      setPracticalExercisePrompt(lesson.practical_exercise_prompt ?? "");

      const { data: questionRows } = await supabase.from("quiz_questions").select("id, question, explanation, order_index").eq("lesson_id", routeLessonId).order("order_index");
      if (questionRows?.length) {
        const { data: optionRows } = await supabase.from("quiz_options").select("id, question_id, label, is_correct, order_index").in("question_id", questionRows.map((q) => q.id)).order("order_index");
        setQuestions(questionRows.map((q) => ({
          id: q.id,
          question: q.question,
          explanation: q.explanation ?? "",
          options: (optionRows ?? []).filter((o) => o.question_id === q.id).map((o) => ({ id: o.id, label: o.label, is_correct: o.is_correct })),
        })));
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeLessonId]);

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!slugTouched) setSlug(slugify(value));
  };

  const handleFileSelect = async (file: File) => {
    if (!courseId || !sectionId) return;
    setUploading(true);
    setError(null);
    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const path = `${courseId}/${sectionId}/${Date.now()}-${safeName}`;
    const { error: uploadError } = await supabase.storage.from("lesson-videos").upload(path, file, { upsert: true });
    if (uploadError) { setError(uploadError.message); setUploading(false); return; }
    const { data } = supabase.storage.from("lesson-videos").getPublicUrl(path);
    setVideoUrl(data.publicUrl);
    setUploading(false);
  };

  const addQuestion = () => setQuestions((qs) => [...qs, EMPTY_QUESTION()]);
  const removeQuestion = (qIndex: number) => setQuestions((qs) => qs.filter((_, i) => i !== qIndex));
  const updateQuestion = (qIndex: number, patch: Partial<QuizQuestionDraft>) =>
    setQuestions((qs) => qs.map((q, i) => (i === qIndex ? { ...q, ...patch } : q)));
  const addOption = (qIndex: number) =>
    setQuestions((qs) => qs.map((q, i) => (i === qIndex ? { ...q, options: [...q.options, EMPTY_OPTION()] } : q)));
  const removeOption = (qIndex: number, oIndex: number) =>
    setQuestions((qs) => qs.map((q, i) => (i === qIndex ? { ...q, options: q.options.filter((_, j) => j !== oIndex) } : q)));
  const updateOptionLabel = (qIndex: number, oIndex: number, label: string) =>
    setQuestions((qs) => qs.map((q, i) => (i === qIndex ? { ...q, options: q.options.map((o, j) => (j === oIndex ? { ...o, label } : o)) } : q)));
  const setCorrectOption = (qIndex: number, oIndex: number) =>
    setQuestions((qs) => qs.map((q, i) => (i === qIndex ? { ...q, options: q.options.map((o, j) => ({ ...o, is_correct: j === oIndex })) } : q)));

  const save = async () => {
    if (!sectionId) { setError("Section inconnue — reviens depuis la fiche du cours."); return; }
    if (!title.trim() || !slug.trim()) { setError("Titre et identifiant sont obligatoires."); return; }
    for (const q of questions) {
      if (!q.question.trim()) { setError("Une question du quiz est vide."); return; }
      if (q.options.filter((o) => o.label.trim()).length < 2) { setError(`La question "${q.question}" doit avoir au moins 2 réponses.`); return; }
      if (!q.options.some((o) => o.is_correct)) { setError(`La question "${q.question}" n'a pas de bonne réponse cochée.`); return; }
    }

    setSaving(true);
    setError(null);

    const payload = {
      section_id: sectionId,
      slug: slug.trim(),
      title: title.trim(),
      duration_minutes: durationMinutes ? parseInt(durationMinutes, 10) : null,
      video_provider: "external_url" as const,
      video_url: videoUrl || null,
      reference_content: referenceContent || null,
      ai_content_prompt: aiContentPrompt || null,
      practical_exercise_prompt: practicalExercisePrompt || null,
    };

    let lessonId = routeLessonId;
    if (lessonId) {
      const { error: updateError } = await supabase.from("lessons").update(payload).eq("id", lessonId);
      if (updateError) { setError(updateError.message); setSaving(false); return; }
    } else {
      const { count } = await supabase.from("lessons").select("id", { count: "exact", head: true }).eq("section_id", sectionId);
      const { data, error: insertError } = await supabase.from("lessons").insert({ ...payload, order_index: count ?? 0 }).select("id").single();
      if (insertError || !data) { setError(insertError?.message ?? "Erreur inconnue"); setSaving(false); return; }
      lessonId = data.id;
    }

    // Quiz : on repart d'une base propre à chaque sauvegarde (supprime puis
    // réinsère) — plus simple et fiable qu'un diff fin vu le faible volume.
    await supabase.from("quiz_questions").delete().eq("lesson_id", lessonId);
    for (let qIndex = 0; qIndex < questions.length; qIndex++) {
      const q = questions[qIndex];
      const { data: questionRow, error: questionError } = await supabase
        .from("quiz_questions").insert({ lesson_id: lessonId, question: q.question.trim(), explanation: q.explanation || null, order_index: qIndex })
        .select("id").single();
      if (questionError || !questionRow) { setError(questionError?.message ?? "Erreur quiz"); setSaving(false); return; }
      const options = q.options.filter((o) => o.label.trim()).map((o, oIndex) => ({
        question_id: questionRow.id, label: o.label.trim(), is_correct: o.is_correct, order_index: oIndex,
      }));
      if (options.length) await supabase.from("quiz_options").insert(options);
    }

    setSaving(false);
    navigate(`/admin/courses/${courseId}`);
  };

  if (loading) return <div className="flex-1 flex items-center justify-center"><p className="text-sm" style={{ color: th.fg3 }}>Chargement…</p></div>;

  if (isNew && !sectionId) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm" style={{ color: th.fg3 }}>Section inconnue. <Link to={`/admin/courses/${courseId}`} style={{ color: th.navAC }}>Retourne à la fiche du cours</Link> et clique "Ajouter une leçon" depuis un module.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <Link to={`/admin/courses/${courseId}`} className="flex items-center gap-1.5 text-sm w-fit transition-colors hover:opacity-70" style={{ color: th.fg3 }}><ChevronLeft className="w-4 h-4" />Cours</Link>
        {!isNew && (
          <a href={`/lesson/${routeLessonId}`} target="_blank" rel="noreferrer" title="Voir la leçon comme un élève"
            className="flex items-center gap-1.5 text-sm font-semibold hover:opacity-70" style={{ color: th.navAC }}>
            <ExternalLink className="w-4 h-4" />Aperçu élève
          </a>
        )}
      </div>

      <GCard glow><div className="p-6 space-y-4">
        <h2 className="text-lg font-black" style={{ color: th.fg }}><GT>{isNew ? "Nouvelle leçon" : "Éditer la leçon"}</GT></h2>

        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: th.fg3 }}>Titre</label>
            <input value={title} onChange={(e) => handleTitleChange(e.target.value)} placeholder="Les bases du prompting" className="w-full rounded-xl px-4 py-3 text-sm g-input" />
            {!slugEditing ? (
              <p className="text-xs mt-1.5" style={{ color: th.fg3 }}>
                Identifiant : <span className="font-mono">{slug || "…"}</span>{" "}
                <button type="button" onClick={() => setSlugEditing(true)} className="underline hover:opacity-70">modifier</button>
              </p>
            ) : (
              <input value={slug} onChange={(e) => { setSlugTouched(true); setSlug(e.target.value); }}
                className="w-full mt-2 rounded-xl px-4 py-2 text-xs g-input font-mono" />
            )}
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: th.fg3 }}>Durée (min)</label>
            <input type="number" value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)} className="w-full rounded-xl px-4 py-3 text-sm g-input" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: th.fg3 }}>Contenu du cours (texte de référence, Markdown)</label>
          <textarea value={referenceContent} onChange={(e) => setReferenceContent(e.target.value)} rows={14}
            className="w-full rounded-xl px-4 py-3 text-sm g-input resize-y font-mono" placeholder="## Objectif&#10;&#10;...&#10;&#10;### Théorie&#10;..." />
          <p className="text-xs mt-1.5" style={{ color: th.fg3 }}>Contenu fixe affiché à tous les élèves — sert de base à la personnalisation IA (Étape 2).</p>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: th.fg3 }}>Vidéo</label>
          {videoUrl && (
            <video src={videoUrl} controls className="w-full max-w-md rounded-xl mb-3 bg-black" style={{ aspectRatio: "16/9" }} />
          )}
          <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])} />
          <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80 disabled:opacity-50"
            style={{ background: th.inputBg, border: `1px solid ${th.inputB}`, color: th.fg }}>
            <Upload className="w-4 h-4" />{uploading ? "Envoi…" : videoUrl ? "Remplacer la vidéo" : "Choisir un fichier vidéo"}
          </button>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: th.fg3 }}>Prompt de référence (contenu IA — texte, podcast, mindmap)</label>
          <textarea value={aiContentPrompt} onChange={(e) => setAiContentPrompt(e.target.value)} rows={3} className="w-full rounded-xl px-4 py-3 text-sm g-input resize-none" />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: th.fg3 }}>Prompt de référence (exercice pratique)</label>
          <textarea value={practicalExercisePrompt} onChange={(e) => setPracticalExercisePrompt(e.target.value)} rows={3} className="w-full rounded-xl px-4 py-3 text-sm g-input resize-none" />
        </div>
      </div></GCard>

      <GCard><div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-black" style={{ color: th.fg }}>Quiz</h3>
          <button onClick={addQuestion} className="flex items-center gap-1.5 text-xs font-semibold hover:opacity-70" style={{ color: th.navAC }}><Plus className="w-3.5 h-3.5" />Ajouter une question</button>
        </div>

        <div className="space-y-4">
          {questions.map((q, qIndex) => (
            <div key={qIndex} className="rounded-xl p-4" style={{ border: `1px solid ${th.sep}` }}>
              <div className="flex items-start gap-2 mb-3">
                <input value={q.question} onChange={(e) => updateQuestion(qIndex, { question: e.target.value })} placeholder="Intitulé de la question"
                  className="flex-1 rounded-xl px-3 py-2 text-sm g-input" />
                <button onClick={() => removeQuestion(qIndex)}><Trash2 className="w-4 h-4" style={{ color: "#F87171" }} /></button>
              </div>
              <div className="space-y-2 mb-3">
                {q.options.map((o, oIndex) => (
                  <div key={oIndex} className="flex items-center gap-2">
                    <button onClick={() => setCorrectOption(qIndex, oIndex)} title="Marquer comme bonne réponse">
                      <CheckCircle className="w-4 h-4 shrink-0" style={{ color: o.is_correct ? "#4ADE80" : th.fg3 }} />
                    </button>
                    <input value={o.label} onChange={(e) => updateOptionLabel(qIndex, oIndex, e.target.value)} placeholder={`Réponse ${oIndex + 1}`}
                      className="flex-1 rounded-lg px-3 py-2 text-xs g-input" />
                    <button onClick={() => removeOption(qIndex, oIndex)}><Trash2 className="w-3.5 h-3.5" style={{ color: th.fg3 }} /></button>
                  </div>
                ))}
                <button onClick={() => addOption(qIndex)} className="text-xs font-semibold hover:opacity-70" style={{ color: th.navAC }}>+ Ajouter une réponse</button>
              </div>
              <textarea value={q.explanation} onChange={(e) => updateQuestion(qIndex, { explanation: e.target.value })} placeholder="Explication IA affichée après réponse (optionnel)"
                rows={2} className="w-full rounded-xl px-3 py-2 text-xs g-input resize-none" />
            </div>
          ))}
          {!questions.length && <p className="text-xs" style={{ color: th.fg3 }}>Aucune question pour l'instant.</p>}
        </div>
      </div></GCard>

      {error && <p className="text-xs" style={{ color: "#F87171" }}>{error}</p>}
      <ShimBtn onClick={save} disabled={saving}>{saving ? "Enregistrement…" : "Enregistrer la leçon"}</ShimBtn>
    </div>
  );
}
