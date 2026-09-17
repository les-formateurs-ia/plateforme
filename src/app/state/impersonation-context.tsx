import { createContext, useContext, useState, type ReactNode } from "react";
import { supabase } from "@/app/lib/supabase/client";
import { useAuth } from "@/app/state/auth-context";
import { requestImpersonation } from "@/app/lib/impersonation";

const STORAGE_KEY = "impersonation.v1";

interface StoredImpersonation {
  staffAccessToken: string;
  staffRefreshToken: string;
  staffBasePath: "/admin" | "/formateur";
  targetName: string;
}

function readStored(): StoredImpersonation | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredImpersonation) : null;
  } catch {
    return null;
  }
}

function writeStored(value: StoredImpersonation) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // stockage indisponible (navigation privée…) — l'usurpation reste
    // fonctionnelle pour la session en cours, seul le "survit à un F5" saute.
  }
}

function clearStored() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

interface ImpersonationContextValue {
  isImpersonating: boolean;
  targetName: string | null;
  staffBasePath: "/admin" | "/formateur" | null;
  startImpersonation: (targetUserId: string) => Promise<void>;
  stopImpersonating: () => Promise<void>;
}

const ImpersonationContext = createContext<ImpersonationContextValue>({
  isImpersonating: false,
  targetName: null,
  staffBasePath: null,
  startImpersonation: async () => {},
  stopImpersonating: async () => {},
});

export const useImpersonation = () => useContext(ImpersonationContext);

export function ImpersonationProvider({ children }: { children: ReactNode }) {
  const { role } = useAuth();
  const [state, setState] = useState<StoredImpersonation | null>(readStored);

  const startImpersonation = async (targetUserId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Session invalide.");

    const ticket = await requestImpersonation(targetUserId);

    const staffBasePath: "/admin" | "/formateur" = role === "formateur" ? "/formateur" : "/admin";
    const targetName = ticket.firstName || ticket.lastName || "cet utilisateur";
    const next: StoredImpersonation = {
      staffAccessToken: session.access_token,
      staffRefreshToken: session.refresh_token,
      staffBasePath,
      targetName,
    };

    const { error } = await supabase.auth.verifyOtp({ token_hash: ticket.tokenHash, type: "email" });
    if (error) {
      throw new Error(error.message);
    }

    writeStored(next);
    setState(next);
  };

  const stopImpersonating = async () => {
    const stored = state ?? readStored();
    if (!stored) {
      clearStored();
      setState(null);
      return;
    }
    const { error } = await supabase.auth.setSession({
      access_token: stored.staffAccessToken,
      refresh_token: stored.staffRefreshToken,
    });
    clearStored();
    setState(null);
    if (error) throw new Error("Session expirée, reconnecte-toi.");
  };

  return (
    <ImpersonationContext.Provider
      value={{
        isImpersonating: !!state,
        targetName: state?.targetName ?? null,
        staffBasePath: state?.staffBasePath ?? null,
        startImpersonation,
        stopImpersonating,
      }}
    >
      {children}
    </ImpersonationContext.Provider>
  );
}
