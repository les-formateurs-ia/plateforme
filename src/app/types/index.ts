export interface Profile {
  name: string;
  age: string;
  profession: string;
  phone: string;
  goal: string;
  goalFinal: string;
  style: string;
  tutor: string;
  avatarUrl: string | null;
}

export interface ChatMsg {
  role: "user" | "ai";
  text: string;
}

export type NavId = "dashboard" | "lessons" | "practice" | "studio" | "agent" | "calendar" | "profile";
