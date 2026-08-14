import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/app/lib/supabase/client";

type Role = "admin" | "student";
type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
  status: AuthStatus;
  user: User | null;
  role: Role | null;
  mustOnboard: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null; needsEmailConfirmation: boolean }>;
  signOut: () => Promise<void>;
  markOnboarded: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  status: "loading",
  user: null,
  role: null,
  mustOnboard: true,
  signIn: async () => ({ error: "Auth non initialisée" }),
  signUp: async () => ({ error: "Auth non initialisée", needsEmailConfirmation: false }),
  signOut: async () => {},
  markOnboarded: () => {},
});

export const useAuth = () => useContext(AuthContext);

function translateAuthError(message: string) {
  if (message.includes("Invalid login credentials")) return "Email ou mot de passe incorrect.";
  if (message.includes("User already registered")) return "Un compte existe déjà avec cet email.";
  if (message.toLowerCase().includes("password should be at least")) return "Mot de passe trop court (6 caractères minimum).";
  if (message.toLowerCase().includes("unable to validate email")) return "Adresse email invalide.";
  return message;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [mustOnboard, setMustOnboard] = useState(true);
  const [status, setStatus] = useState<AuthStatus>("loading");

  const loadProfile = async (userId: string) => {
    const { data } = await supabase.from("profiles").select("role, must_onboard").eq("id", userId).single();
    setRole((data?.role as Role) ?? "student");
    setMustOnboard(data?.must_onboard ?? true);
  };

  useEffect(() => {
    let cancelled = false;

    supabase.auth.getSession().then(async ({ data }) => {
      if (cancelled) return;
      setSession(data.session);
      if (data.session) await loadProfile(data.session.user.id);
      if (!cancelled) setStatus(data.session ? "authenticated" : "unauthenticated");
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      if (newSession) {
        await loadProfile(newSession.user.id);
        setStatus("authenticated");
      } else {
        setRole(null);
        setMustOnboard(true);
        setStatus("unauthenticated");
      }
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signIn: AuthContextValue["signIn"] = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ? translateAuthError(error.message) : null };
  };

  const signUp: AuthContextValue["signUp"] = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: translateAuthError(error.message), needsEmailConfirmation: false };
    return { error: null, needsEmailConfirmation: !data.session };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const markOnboarded = () => setMustOnboard(false);

  return (
    <AuthContext.Provider value={{ status, user: session?.user ?? null, role, mustOnboard, signIn, signUp, signOut, markOnboarded }}>
      {children}
    </AuthContext.Provider>
  );
}
