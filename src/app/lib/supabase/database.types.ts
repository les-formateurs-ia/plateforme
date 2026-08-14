// Types écrits à la main d'après supabase/migrations/0001_init_schema.sql.
// À remplacer par `supabase gen types typescript` une fois le projet lié en CLI —
// ça restera la source de vérité, ce fichier n'est qu'un point de départ fidèle au schéma.

export type UserRole = "admin" | "student";
export type EnrollmentStatus = "active" | "completed" | "paused";
export type LessonProgressStatus = "locked" | "in_progress" | "completed";
export type AppointmentStatus = "requested" | "preparing" | "confirmed" | "completed" | "cancelled";
export type AiContentType = "practical_exercise" | "mindmap" | "podcast" | "text_summary" | "remedial_explanation" | "remedial_quiz";
export type ChatRole = "user" | "ai";
export type VideoProvider = "cloudflare_stream" | "youtube" | "vimeo" | "external_url";
export type FormationStatus = "draft" | "published" | "archived";

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
          created_at: string;
        };
        Insert: {
          id: string;
          role?: UserRole;
          first_name?: string | null;
          last_name?: string | null;
          email: string;
          must_onboard?: boolean;
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
          regenerated_from?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["ai_generated_content"]["Insert"]>;
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
      enrollments: {
        Row: {
          id: string;
          user_id: string;
          formation_id: string;
          status: EnrollmentStatus;
          enrolled_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          formation_id: string;
          status?: EnrollmentStatus;
          enrolled_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["enrollments"]["Insert"]>;
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
      appointments: {
        Row: {
          id: string;
          user_id: string;
          formation_id: string;
          section_id: string | null;
          status: AppointmentStatus;
          requested_at: string;
          scheduled_at: string | null;
          google_meet_link: string | null;
          admin_message: string | null;
          handled_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          formation_id: string;
          section_id?: string | null;
          status?: AppointmentStatus;
          requested_at?: string;
          scheduled_at?: string | null;
          google_meet_link?: string | null;
          admin_message?: string | null;
          handled_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["appointments"]["Insert"]>;
      };
    };
  };
}
