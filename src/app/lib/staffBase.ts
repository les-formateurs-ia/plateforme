// Les pages de gestion (cours, planning, fiche élève…) sont montées deux
// fois dans App.tsx : sous /admin (admin uniquement) et sous /formateur
// (formateur uniquement) — même composants, même comportement, seule
// l'URL diffère. Ce hook laisse chaque page construire ses liens internes
// sans savoir sous quel préfixe elle est montée.
import { useAuth } from "@/app/state/auth-context";

export function useStaffBasePath(): "/admin" | "/formateur" {
  const { role } = useAuth();
  return role === "formateur" ? "/formateur" : "/admin";
}
