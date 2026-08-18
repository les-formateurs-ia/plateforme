import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/app/lib/supabase/client";

type Role = "admin" | "student";
type AuthStatus = "loading" | "authenticated" | "unauthenticated";
const AUTH_INIT_TIMEOUT_MS = 8000;

interface AuthContextValue {
  status: AuthStatus;
  user: User | null;
  role: Role | null;
  mustOnboard: boolean;
  // true tant que le profil (role/must_onboard) n'a pas encore été chargé pour la
  // session courante — tant que c'est vrai, `mustOnboard` peut encore valoir sa
  // valeur par défaut et ne doit pas servir à décider d'une redirection.
  profileLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  markOnboarded: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  status: "loading",
  user: null,
  role: null,
  mustOnboard: true,
  profileLoading: true,
  signIn: async () => ({ error: "Auth non initialisée" }),
  signUp: async () => ({ error: "Auth non initialisée" }),
  signOut: async () => {},
  markOnboarded: () => {},
});

export const useAuth = () => useContext(AuthContext);

function translateAuthError(message: string) {
  if (message.includes("Invalid login credentials")) return "Email ou mot de passe incorrect.";
  if (message.toLowerCase().includes("email not confirmed")) return "La confirmation email est encore activée dans Supabase.";
  if (message.includes("User already registered")) return "Un compte existe déjà avec cet email.";
  if (message.toLowerCase().includes("password should be at least")) return "Mot de passe trop court (6 caractères minimum).";
  if (message.toLowerCase().includes("unable to validate email")) return "Adresse email invalide.";
  return message;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [mustOnboard, setMustOnboard] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);
  const [status, setStatus] = useState<AuthStatus>("loading");

  const resetAuthState = () => {
    setSession(null);
    setRole(null);
    setMustOnboard(true);
    setProfileLoading(true);
    setStatus("unauthenticated");
  };

  const loadProfile = async (userId: string) => {
    const { data, error } = await supabase.from("profiles").select("role, must_onboard").eq("id", userId).maybeSingle();
    if (error) {
      console.warn("Unable to load profile", error);
    }
    setRole((data?.role as Role) ?? "student");
    setMustOnboard(data?.must_onboard ?? true);
    setProfileLoading(false);
  };

  useEffect(() => {
    // Fail-safe only: onAuthStateChange (below) fires an INITIAL_SESSION event
    // synchronously on subscribe, so this should never actually be needed —
    // it just prevents a permanent loading screen if that ever doesn't happen
    // (e.g. Supabase unreachable).
    const failSafe = setTimeout(() => {
      setStatus((current) => (current === "loading" ? "unauthenticated" : current));
    }, AUTH_INIT_TIMEOUT_MS);

    // Single source of truth for auth state. We deliberately don't also call
    // getSession() here — running it alongside this listener was racing two
    // lock acquisitions on the same auth client and could leave the browser
    // profile's auth lock stuck (see client.ts for the matching fix).
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      clearTimeout(failSafe);
      setSession(newSession);
      if (newSession) {
        setStatus("authenticated");
        setProfileLoading(true);
        // Deferred: Supabase warns against awaiting inside this callback directly.
        setTimeout(() => {
          void loadProfile(newSession.user.id);
        }, 0);
      } else {
        resetAuthState();
      }
    });

    return () => {
      clearTimeout(failSafe);
      sub.subscription.unsubscribe();
    };
  }, []);

  const signIn: AuthContextValue["signIn"] = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ? translateAuthError(error.message) : null };
  };

  const signUp: AuthContextValue["signUp"] = async (email, password) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: translateAuthError(error.message) };
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) return { error: translateAuthError(signInError.message) };
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const markOnboarded = () => setMustOnboard(false);

  return (
    <AuthContext.Provider value={{ status, user: session?.user ?? null, role, mustOnboard, profileLoading, signIn, signUp, signOut, markOnboarded }}>
      {children}
    </AuthContext.Provider>
  );
}
