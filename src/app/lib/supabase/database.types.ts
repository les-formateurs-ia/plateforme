// Types écrits à la main d'après supabase/migrations/0001_init_schema.sql.
// À remplacer par `supabase gen types typescript` une fois le projet lié en CLI —
// ça restera la source de vérité, ce fichier n'est qu'un point de départ fidèle au schéma.

export type UserRole = "admin" | "formateur" | "student";
export type EnrollmentStatus = "active" | "completed" | "paused";
export type LessonProgressStatus = "locked" | "in_progress" | "completed";
export type RdvStatus = "confirmed" | "cancelled";
export type NotificationType = "rdv_cancelled" | "rdv_reschedule_proposed" | "rdv_reschedule_accepted" | "rdv_reschedule_declined" | "rdv_booked";
export type AiContentType = "practical_exercise" | "mindmap" | "podcast" | "text_summary" | "remedial_explanation" | "remedial_quiz";
export type ChatRole = "user" | "ai";
export type VideoProvider = "cloudflare_stream" | "youtube" | "vimeo" | "external_url";
export type FormationStatus = "draft" | "published" | "archived";
export type ThemePreference = "light" | "dark" | "system";
export type ExerciseSessionType = "prompt" | "media" | "html";
export type ExerciseVisibility = "global" | "private";
export type AgentMessageModality = "text" | "voice";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: UserRole;
          first_name: string | null;
          last_name: string | null;
          email: string;
          must_onboard: boolean;
          theme_preference: ThemePreference;
          avatar_url: string | null;
          formateur_id: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          role?: UserRole;
          first_name?: string | null;
          last_name?: string | null;
          email: string;
          must_onboard?: boolean;
          theme_preference?: ThemePreference;
          avatar_url?: string | null;
          formateur_id?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      student_onboarding: {
        Row: {
          user_id: string;
          age: string | null;
          profession: string | null;
          goal: string | null;
          goal_detail: string | null;
          learning_style: string | null;
          ai_tutor_persona: string | null;
          raw_answers: Record<string, unknown>;
          completed_at: string;
        };
        Insert: {
          user_id: string;
          age?: string | null;
          profession?: string | null;
          goal?: string | null;
          goal_detail?: string | null;
          learning_style?: string | null;
          ai_tutor_persona?: string | null;
          raw_answers?: Record<string, unknown>;
          completed_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["student_onboarding"]["Insert"]>;
      };
      formations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          duration_minutes: number | null;
          price_cents: number | null;
          currency: string;
          certification_enabled: boolean;
          certification_prompt: string | null;
          status: FormationStatus;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          duration_minutes?: number | null;
          price_cents?: number | null;
          currency?: string;
          certification_enabled?: boolean;
          certification_prompt?: string | null;
          status?: FormationStatus;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["formations"]["Insert"]>;
      };
      sections: {
        Row: {
          id: string;
          formation_id: string;
          title: string;
          order_index: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          formation_id: string;
          title: string;
          order_index: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["sections"]["Insert"]>;
      };
      lessons: {
        Row: {
          id: string;
          section_id: string;
          slug: string;
          title: string;
          video_provider: VideoProvider;
          video_url: string | null;
          video_asset_id: string | null;
          duration_minutes: number | null;
          ai_content_prompt: string | null;
          practical_exercise_prompt: string | null;
          reference_content: string | null;
          custom_html_content: string | null;
          order_index: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          section_id: string;
          slug: string;
          title: string;
          video_provider?: VideoProvider;
          video_url?: string | null;
          video_asset_id?: string | null;
          duration_minutes?: number | null;
          ai_content_prompt?: string | null;
          practical_exercise_prompt?: string | null;
          reference_content?: string | null;
          custom_html_content?: string | null;
          order_index: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["lessons"]["Insert"]>;
      };
      quiz_questions: {
        Row: {
          id: string;
          lesson_id: string;
          question: string;
          explanation: string | null;
          order_index: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          lesson_id: string;
          question: string;
          explanation?: string | null;
          order_index: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["quiz_questions"]["Insert"]>;
      };
      quiz_options: {
        Row: {
          id: string;
          question_id: string;
          label: string;
          is_correct: boolean;
          order_index: number;
        };
        Insert: {
          id?: string;
          question_id: string;
          label: string;
          is_correct?: boolean;
          order_index: number;
        };
        Update: Partial<Database["public"]["Tables"]["quiz_options"]["Insert"]>;
      };
      ai_generated_content: {
        Row: {
          id: string;
          user_id: string;
          lesson_id: string;
          content_type: AiContentType;
          source_prompt: string;
          content: Record<string, unknown>;
          model: string | null;
          variant: string | null;
          regenerated_from: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          lesson_id: string;
          content_type: AiContentType;
          source_prompt: string;
          content: Record<string, unknown>;
          model?: string | null;
          variant?: string | null;
          regenerated_from?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["ai_generated_content"]["Insert"]>;
      };
      prompt_exercise_attempts: {
        Row: {
          id: string;
          user_id: string;
          session_id: string;
          attempt_number: number;
          prompt_text: string;
          score: number;
          feedback: Record<string, unknown>;
          model: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          session_id: string;
          attempt_number: number;
          prompt_text: string;
          score: number;
          feedback: Record<string, unknown>;
          model?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["prompt_exercise_attempts"]["Insert"]>;
      };
      media_exercise_attempts: {
        Row: {
          id: string;
          user_id: string;
          session_id: string;
          attempt_number: number;
          mode: "image" | "video";
          prompt_text: string;
          corrected_prompt_text: string;
          score: number;
          feedback: Record<string, unknown>;
          status: "generating" | "ready" | "failed";
          error: string | null;
          original_media_path: string | null;
          corrected_media_path: string | null;
          original_operation_name: string | null;
          corrected_operation_name: string | null;
          model: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          session_id: string;
          attempt_number: number;
          mode: "image" | "video";
          prompt_text: string;
          corrected_prompt_text: string;
          score: number;
          feedback: Record<string, unknown>;
          status?: "generating" | "ready" | "failed";
          error?: string | null;
          original_media_path?: string | null;
          corrected_media_path?: string | null;
          original_operation_name?: string | null;
          corrected_operation_name?: string | null;
          model?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["media_exercise_attempts"]["Insert"]>;
      };
      html_exercise_attempts: {
        Row: {
          id: string;
          user_id: string;
          session_id: string;
          attempt_number: number;
          html_content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          session_id: string;
          attempt_number: number;
          html_content: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["html_exercise_attempts"]["Insert"]>;
      };
      exercise_sessions: {
        Row: {
          id: string;
          user_id: string;
          exercise_type: ExerciseSessionType;
          name: string | null;
          description: string | null;
          exercise_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          exercise_type: ExerciseSessionType;
          name?: string | null;
          description?: string | null;
          exercise_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["exercise_sessions"]["Insert"]>;
      };
      html_exercises: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          html_content: string;
          visibility: ExerciseVisibility;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          html_content?: string;
          visibility?: ExerciseVisibility;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["html_exercises"]["Insert"]>;
      };
      html_exercise_assignments: {
        Row: {
          id: string;
          exercise_id: string;
          student_id: string;
          assigned_by: string | null;
          assigned_at: string;
        };
        Insert: {
          id?: string;
          exercise_id: string;
          student_id: string;
          assigned_by?: string | null;
          assigned_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["html_exercise_assignments"]["Insert"]>;
      };
      chat_messages: {
        Row: {
          id: string;
          user_id: string;
          lesson_id: string;
          role: ChatRole;
          content: string;
          is_off_topic: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          lesson_id: string;
          role: ChatRole;
          content: string;
          is_off_topic?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["chat_messages"]["Insert"]>;
      };
      agent_conversations: {
        Row: {
          id: string;
          user_id: string;
          formation_instance_id: string | null;
          title: string | null;
          created_at: string;
          last_message_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          formation_instance_id?: string | null;
          title?: string | null;
          created_at?: string;
          last_message_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["agent_conversations"]["Insert"]>;
      };
      agent_messages: {
        Row: {
          id: string;
          conversation_id: string;
          role: ChatRole;
          content: string;
          modality: AgentMessageModality;
          is_off_topic: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          role: ChatRole;
          content: string;
          modality?: AgentMessageModality;
          is_off_topic?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["agent_messages"]["Insert"]>;
      };
      formation_instances: {
        Row: {
          id: string;
          template_id: string | null;
          user_id: string;
          name: string;
          description: string | null;
          duration_minutes: number | null;
          price_cents: number | null;
          currency: string;
          certification_enabled: boolean;
          certification_prompt: string | null;
          status: EnrollmentStatus;
          assigned_by: string | null;
          assigned_at: string;
          created_at: string;
          updated_at: string;
          is_preview: boolean;
        };
        Insert: {
          id?: string;
          template_id?: string | null;
          user_id: string;
          name: string;
          description?: string | null;
          duration_minutes?: number | null;
          price_cents?: number | null;
          currency?: string;
          certification_enabled?: boolean;
          certification_prompt?: string | null;
          status?: EnrollmentStatus;
          assigned_by?: string | null;
          assigned_at?: string;
          created_at?: string;
          updated_at?: string;
          is_preview?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["formation_instances"]["Insert"]>;
      };
      instance_sections: {
        Row: {
          id: string;
          instance_id: string;
          title: string;
          order_index: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          instance_id: string;
          title: string;
          order_index: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["instance_sections"]["Insert"]>;
      };
      instance_lessons: {
        Row: {
          id: string;
          section_id: string;
          slug: string;
          title: string;
          video_provider: VideoProvider;
          video_url: string | null;
          video_asset_id: string | null;
          duration_minutes: number | null;
          ai_content_prompt: string | null;
          practical_exercise_prompt: string | null;
          reference_content: string | null;
          custom_html_content: string | null;
          order_index: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          section_id: string;
          slug: string;
          title: string;
          video_provider?: VideoProvider;
          video_url?: string | null;
          video_asset_id?: string | null;
          duration_minutes?: number | null;
          ai_content_prompt?: string | null;
          practical_exercise_prompt?: string | null;
          reference_content?: string | null;
          custom_html_content?: string | null;
          order_index: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["instance_lessons"]["Insert"]>;
      };
      instance_quiz_questions: {
        Row: {
          id: string;
          lesson_id: string;
          question: string;
          explanation: string | null;
          order_index: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          lesson_id: string;
          question: string;
          explanation?: string | null;
          order_index: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["instance_quiz_questions"]["Insert"]>;
      };
      instance_quiz_options: {
        Row: {
          id: string;
          question_id: string;
          label: string;
          is_correct: boolean;
          order_index: number;
        };
        Insert: {
          id?: string;
          question_id: string;
          label: string;
          is_correct?: boolean;
          order_index: number;
        };
        Update: Partial<Database["public"]["Tables"]["instance_quiz_options"]["Insert"]>;
      };
      lesson_progress: {
        Row: {
          id: string;
          user_id: string;
          lesson_id: string;
          status: LessonProgressStatus;
          best_quiz_score: number | null;
          time_spent_seconds: number;
          started_at: string | null;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          lesson_id: string;
          status?: LessonProgressStatus;
          best_quiz_score?: number | null;
          time_spent_seconds?: number;
          started_at?: string | null;
          completed_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["lesson_progress"]["Insert"]>;
      };
      quiz_attempts: {
        Row: {
          id: string;
          user_id: string;
          lesson_id: string;
          attempt_number: number;
          score: number;
          passed: boolean;
          answers: unknown[];
          ai_feedback: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          lesson_id: string;
          attempt_number: number;
          score: number;
          passed: boolean;
          answers: unknown[];
          ai_feedback?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["quiz_attempts"]["Insert"]>;
      };
      badges: {
        Row: {
          id: string;
          code: string;
          name: string;
          description: string | null;
          icon: string | null;
          criteria: Record<string, unknown>;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          description?: string | null;
          icon?: string | null;
          criteria?: Record<string, unknown>;
        };
        Update: Partial<Database["public"]["Tables"]["badges"]["Insert"]>;
      };
      user_badges: {
        Row: {
          user_id: string;
          badge_id: string;
          earned_at: string;
        };
        Insert: {
          user_id: string;
          badge_id: string;
          earned_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["user_badges"]["Insert"]>;
      };
      availability_slots: {
        Row: {
          id: string;
          formateur_id: string;
          slot_date: string;
          start_time: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          formateur_id: string;
          slot_date: string;
          start_time: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["availability_slots"]["Insert"]>;
      };
      rendez_vous: {
        Row: {
          id: string;
          student_id: string;
          formateur_id: string;
          slot_date: string;
          start_time: string;
          end_time: string;
          status: RdvStatus;
          message: string | null;
          cancelled_by: string | null;
          proposed_date: string | null;
          proposed_start_time: string | null;
          proposed_end_time: string | null;
          proposed_by: string | null;
          proposed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          formateur_id: string;
          slot_date: string;
          start_time: string;
          end_time: string;
          status?: RdvStatus;
          message?: string | null;
          cancelled_by?: string | null;
          proposed_date?: string | null;
          proposed_start_time?: string | null;
          proposed_end_time?: string | null;
          proposed_by?: string | null;
          proposed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["rendez_vous"]["Insert"]>;
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: NotificationType;
          title: string;
          body: string | null;
          rdv_id: string | null;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: NotificationType;
          title: string;
          body?: string | null;
          rdv_id?: string | null;
          read_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Insert"]>;
      };
    };
  };
}
