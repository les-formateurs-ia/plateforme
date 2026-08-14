export interface Profile {
  name: string;
  age: string;
  profession: string;
  goal: string;
  goalFinal: string;
  style: string;
  tutor: string;
}

export interface ChatMsg {
  role: "user" | "ai";
  text: string;
}

export type NavId = "dashboard" | "lessons" | "practice" | "calendar" | "benefits" | "profile";
