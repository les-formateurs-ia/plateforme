// Mindmaps de leçon (Gemini) : structure fidèle au cours, exemples personnalisés.
import { supabase } from "@/app/lib/supabase/client";

export interface MindmapNode {
  label: string;
  summary?: string;
  examples?: string[];
  children?: MindmapNode[];
}

export interface MindmapTree {
  title: string;
  children: MindmapNode[];
}

export async function getMyMindmap(userId: string, lessonId: string): Promise<MindmapTree | null> {
  const { data, error } = await supabase
    .from("ai_generated_content")
    .select("content")
    .eq("user_id", userId)
    .eq("lesson_id", lessonId)
    .eq("content_type", "mindmap")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  const content = data?.content as { tree?: MindmapTree } | undefined;
  return content?.tree ?? null;
}

async function extractFunctionError(error: { message: string; context?: Response }): Promise<string> {
  let message = error.message;
  if (error.context) {
    try {
      const body = await error.context.clone().json();
      if (body?.error) message = body.error;
    } catch {
      // corps non-JSON, on garde le message par défaut
    }
  }
  return message;
}

export async function requestMindmapGeneration(lessonId: string): Promise<MindmapTree> {
  const { data, error } = await supabase.functions.invoke("generate-mindmap", { body: { lessonId } });
  if (error) throw new Error(await extractFunctionError(error));
  if (data?.error) throw new Error(data.error);
  return data.tree;
}
