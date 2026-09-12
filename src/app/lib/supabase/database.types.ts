// Types écrits à la main d'après supabase/migrations/0001_init_schema.sql.
// À remplacer par `supabase gen types typescript` une fois le projet lié en CLI —
// ça restera la source de vérité, ce fichier n'est qu'un point de départ fidèle au schéma.

export type UserRole = "admin" | "formateur" | "student";
export type EnrollmentStatus = "active" | "completed" | "paused";
export type LessonProgressStatus = "locked" | "in_progress" | "completed";
export type RdvStatus = "pending" | "confirmed" | "cancelled";
export type NotificationType = "rdv_cancelled" | "rdv_reschedule_proposed" | "rdv_reschedule_accepted" | "rdv_reschedule_declined" | "rdv_booked" | "bilan_reminder" | "rdv_confirmed" | "incident_reported";
export type AiContentType = "practical_exercise" | "mindmap" | "podcast" | "text_summary" | "remedial_explanation" | "remedial_quiz" | "avatar_video";
export type ChatRole = "user" | "ai";
export type VideoProvider = "cloudflare_stream" | "youtube" | "vimeo" | "external_url";
export type FormationStatus = "draft" | "published" | "archived" | "generating";
export type ThemePreference = "light" | "dark" | "system";
export type ExerciseSessionType = "prompt" | "media" | "html";
export type ExerciseVisibility = "global" | "private";
// "Exercez-vous 2" — duplicat indépendant du module "Pratique IA" ci-dessus
// (voir migration 0065_practice2_module.sql), tables/types propres suffixés _2.
export type ExerciseSessionType2 = "prompt" | "media" | "html";
export type ExerciseVisibility2 = "global" | "private";
export type AgentMessageModality = "text" | "voice";
export type IncidentPage = "lecon" | "tableau_de_bord" | "outil_ia" | "exercice" | "autre";
export type IncidentStatus = "a_traiter" | "corrige";
export type SatisfactionQuestionType = "qcm" | "rating" | "text";
export type StudioImageStatus = "pending" | "ready" | "failed";

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
          phone: string | null;
          must_onboard: boolean;
          theme_preference: ThemePreference;
          avatar_url: string | null;
          formateur_id: string | null;
          google_calendar_email: string | null;
          company_id: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          role?: UserRole;
          first_name?: string | null;
          last_name?: string | null;
          email: string;
          phone?: string | null;
          must_onboard?: boolean;
          theme_preference?: ThemePreference;
          avatar_url?: string | null;
          formateur_id?: string | null;
          google_calendar_email?: string | null;
          company_id?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: never[];
      };
      student_onboarding: {
        Row: {
          user_id: string;
          age: string | null;
          profession: string | null;
          experience: string | null;
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
          experience?: string | null;
          goal?: string | null;
          goal_detail?: string | null;
          learning_style?: string | null;
          ai_tutor_persona?: string | null;
          raw_answers?: Record<string, unknown>;
          completed_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["student_onboarding"]["Insert"]>;
        Relationships: never[];
      };
      studio_image_generations: {
        Row: {
          id: string;
          user_id: string;
          status: StudioImageStatus;
          model: string;
          aspect_ratio: string;
          prompt: string;
          source_image_path: string | null;
          image_path: string | null;
          external_request_id: string | null;
          error_message: string | null;
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          status?: StudioImageStatus;
          model: string;
          aspect_ratio: string;
          prompt: string;
          source_image_path?: string | null;
          image_path?: string | null;
          external_request_id?: string | null;
          error_message?: string | null;
          created_at?: string;
          completed_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["studio_image_generations"]["Insert"]>;
        Relationships: never[];
      };
      studio_video_generations: {
        Row: {
          id: string;
          user_id: string;
          status: StudioImageStatus;
          model: string;
          options: Record<string, unknown>;
          prompt: string;
          source_image_path: string | null;
          video_path: string | null;
          external_request_id: string | null;
          error_message: string | null;
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          status?: StudioImageStatus;
          model: string;
          options?: Record<string, unknown>;
          prompt: string;
          source_image_path?: string | null;
          video_path?: string | null;
          external_request_id?: string | null;
          error_message?: string | null;
          created_at?: string;
          completed_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["studio_video_generations"]["Insert"]>;
        Relationships: never[];
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
        Relationships: never[];
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
        Relationships: never[];
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
        Relationships: never[];
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
        Relationships: never[];
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
        Relationships: never[];
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
        Relationships: never[];
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
        Relationships: never[];
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
        Relationships: never[];
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
        Relationships: never[];
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
        Relationships: never[];
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
        Relationships: never[];
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
        Relationships: never[];
      };
      exercise_tags: {
        Row: {
          id: string;
          name: string;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_by?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["exercise_tags"]["Insert"]>;
        Relationships: never[];
      };
      html_exercise_tag_assignments: {
        Row: {
          id: string;
          exercise_id: string;
          tag_id: string;
          assigned_by: string | null;
          assigned_at: string;
        };
        Insert: {
          id?: string;
          exercise_id: string;
          tag_id: string;
          assigned_by?: string | null;
          assigned_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["html_exercise_tag_assignments"]["Insert"]>;
        Relationships: never[];
      };
      // ── "Exercez-vous 2" — duplicat indépendant, voir migration 0065_practice2_module.sql ──
      prompt_exercise_attempts_2: {
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
        Update: Partial<Database["public"]["Tables"]["prompt_exercise_attempts_2"]["Insert"]>;
        Relationships: never[];
      };
      media_exercise_attempts_2: {
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
        Update: Partial<Database["public"]["Tables"]["media_exercise_attempts_2"]["Insert"]>;
        Relationships: never[];
      };
      html_exercise_attempts_2: {
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
        Update: Partial<Database["public"]["Tables"]["html_exercise_attempts_2"]["Insert"]>;
        Relationships: never[];
      };
      exercise_sessions_2: {
        Row: {
          id: string;
          user_id: string;
          exercise_type: ExerciseSessionType2;
          name: string | null;
          description: string | null;
          exercise_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          exercise_type: ExerciseSessionType2;
          name?: string | null;
          description?: string | null;
          exercise_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["exercise_sessions_2"]["Insert"]>;
        Relationships: never[];
      };
      html_exercises_2: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          html_content: string;
          visibility: ExerciseVisibility2;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          html_content?: string;
          visibility?: ExerciseVisibility2;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["html_exercises_2"]["Insert"]>;
        Relationships: never[];
      };
      html_exercise_assignments_2: {
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
        Update: Partial<Database["public"]["Tables"]["html_exercise_assignments_2"]["Insert"]>;
        Relationships: never[];
      };
      exercise_tags_2: {
        Row: {
          id: string;
          name: string;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_by?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["exercise_tags_2"]["Insert"]>;
        Relationships: never[];
      };
      html_exercise_tag_assignments_2: {
        Row: {
          id: string;
          exercise_id: string;
          tag_id: string;
          assigned_by: string | null;
          assigned_at: string;
        };
        Insert: {
          id?: string;
          exercise_id: string;
          tag_id: string;
          assigned_by?: string | null;
          assigned_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["html_exercise_tag_assignments_2"]["Insert"]>;
        Relationships: never[];
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
        Relationships: never[];
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
        Relationships: never[];
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
        Relationships: never[];
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
        Relationships: never[];
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
        Relationships: never[];
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
        Relationships: never[];
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
        Relationships: never[];
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
        Relationships: never[];
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
        Relationships: never[];
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
        Relationships: never[];
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
        Relationships: never[];
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
        Relationships: never[];
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
        Relationships: never[];
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
          google_event_id: string | null;
          meet_link: string | null;
          bilan_sujet: string | null;
          bilan_next_step: string | null;
          bilan_point_fort: string | null;
          bilan_filled_at: string | null;
          bilan_attachment_path: string | null;
          bilan_attachment_name: string | null;
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
          google_event_id?: string | null;
          meet_link?: string | null;
          bilan_sujet?: string | null;
          bilan_next_step?: string | null;
          bilan_point_fort?: string | null;
          bilan_filled_at?: string | null;
          bilan_attachment_path?: string | null;
          bilan_attachment_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["rendez_vous"]["Insert"]>;
        Relationships: never[];
      };
      google_oauth_tokens: {
        Row: {
          formateur_id: string;
          refresh_token: string;
          access_token: string | null;
          access_token_expires_at: string | null;
          google_email: string | null;
          connected_at: string;
          is_platform_default: boolean;
        };
        Insert: {
          formateur_id: string;
          refresh_token: string;
          access_token?: string | null;
          access_token_expires_at?: string | null;
          google_email?: string | null;
          connected_at?: string;
          is_platform_default?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["google_oauth_tokens"]["Insert"]>;
        Relationships: never[];
      };
      google_oauth_states: {
        Row: {
          state: string;
          formateur_id: string;
          created_at: string;
        };
        Insert: {
          state?: string;
          formateur_id: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["google_oauth_states"]["Insert"]>;
        Relationships: never[];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: NotificationType;
          title: string;
          body: string | null;
          rdv_id: string | null;
          incident_id: string | null;
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
          incident_id?: string | null;
          read_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Insert"]>;
        Relationships: never[];
      };
      student_ai_memory: {
        Row: {
          user_id: string;
          summary: string;
          last_summarized_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          summary?: string;
          last_summarized_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["student_ai_memory"]["Insert"]>;
        Relationships: never[];
      };
      reported_incidents: {
        Row: {
          id: string;
          user_id: string;
          page: IncidentPage;
          description: string;
          status: IncidentStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          page: IncidentPage;
          description: string;
          status?: IncidentStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["reported_incidents"]["Insert"]>;
        Relationships: never[];
      };
      companies: {
        Row: {
          id: string;
          name: string;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["companies"]["Insert"]>;
        Relationships: never[];
      };
      company_employees: {
        Row: {
          id: string;
          company_id: string;
          first_name: string;
          last_name: string;
          email: string;
          profile_id: string | null;
          invite_sent_at: string | null;
          invite_accepted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          first_name: string;
          last_name: string;
          email: string;
          profile_id?: string | null;
          invite_sent_at?: string | null;
          invite_accepted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["company_employees"]["Insert"]>;
        Relationships: never[];
      };
      company_positioning_tests: {
        Row: {
          id: string;
          company_id: string;
          title: string;
          is_visible: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          title: string;
          is_visible?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["company_positioning_tests"]["Insert"]>;
        Relationships: never[];
      };
      company_positioning_questions: {
        Row: {
          id: string;
          test_id: string;
          question: string;
          explanation: string | null;
          order_index: number;
        };
        Insert: {
          id?: string;
          test_id: string;
          question: string;
          explanation?: string | null;
          order_index: number;
        };
        Update: Partial<Database["public"]["Tables"]["company_positioning_questions"]["Insert"]>;
        Relationships: never[];
      };
      company_positioning_options: {
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
        Update: Partial<Database["public"]["Tables"]["company_positioning_options"]["Insert"]>;
        Relationships: never[];
      };
      company_positioning_attempts: {
        Row: {
          id: string;
          test_id: string;
          company_id: string;
          student_id: string;
          score: number;
          answers: unknown[];
          created_at: string;
        };
        Insert: {
          id?: string;
          test_id: string;
          company_id: string;
          student_id: string;
          score: number;
          answers: unknown[];
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["company_positioning_attempts"]["Insert"]>;
        Relationships: never[];
      };
      company_files: {
        Row: {
          id: string;
          company_id: string;
          name: string;
          description: string | null;
          storage_path: string;
          mime_type: string | null;
          file_size: number | null;
          is_visible: boolean;
          uploaded_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          name: string;
          description?: string | null;
          storage_path: string;
          mime_type?: string | null;
          file_size?: number | null;
          is_visible?: boolean;
          uploaded_by?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["company_files"]["Insert"]>;
        Relationships: never[];
      };
      company_html_exercises: {
        Row: {
          id: string;
          company_id: string;
          name: string;
          description: string | null;
          html_content: string;
          is_visible: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          name: string;
          description?: string | null;
          html_content?: string;
          is_visible?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["company_html_exercises"]["Insert"]>;
        Relationships: never[];
      };
      company_satisfaction_tests: {
        Row: {
          id: string;
          company_id: string;
          title: string;
          is_visible: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          title: string;
          is_visible?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["company_satisfaction_tests"]["Insert"]>;
        Relationships: never[];
      };
      company_satisfaction_questions: {
        Row: {
          id: string;
          test_id: string;
          question: string;
          question_type: SatisfactionQuestionType;
          order_index: number;
        };
        Insert: {
          id?: string;
          test_id: string;
          question: string;
          question_type: SatisfactionQuestionType;
          order_index: number;
        };
        Update: Partial<Database["public"]["Tables"]["company_satisfaction_questions"]["Insert"]>;
        Relationships: never[];
      };
      company_satisfaction_options: {
        Row: {
          id: string;
          question_id: string;
          label: string;
          order_index: number;
        };
        Insert: {
          id?: string;
          question_id: string;
          label: string;
          order_index: number;
        };
        Update: Partial<Database["public"]["Tables"]["company_satisfaction_options"]["Insert"]>;
        Relationships: never[];
      };
      company_satisfaction_responses: {
        Row: {
          id: string;
          test_id: string;
          company_id: string;
          student_id: string;
          answers: unknown[];
          created_at: string;
        };
        Insert: {
          id?: string;
          test_id: string;
          company_id: string;
          student_id: string;
          answers: unknown[];
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["company_satisfaction_responses"]["Insert"]>;
        Relationships: never[];
      };
      company_file_categories: {
        Row: {
          id: string;
          company_id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          name: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["company_file_categories"]["Insert"]>;
        Relationships: never[];
      };
      company_student_uploads: {
        Row: {
          id: string;
          company_id: string;
          student_id: string;
          category_id: string | null;
          storage_path: string;
          file_name: string;
          mime_type: string | null;
          file_size: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          student_id: string;
          category_id?: string | null;
          storage_path: string;
          file_name: string;
          mime_type?: string | null;
          file_size?: number | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["company_student_uploads"]["Insert"]>;
        Relationships: never[];
      };
    };
    Views: Record<string, never>;
    Functions: {
      assign_formation_to_student: {
        Args: { p_template_id: string; p_student_id: string };
        Returns: string;
      };
      preview_formation_as_staff: {
        Args: { p_template_id: string };
        Returns: string;
      };
    };
  };
}
