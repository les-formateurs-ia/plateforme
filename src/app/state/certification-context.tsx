// Épreuve de certification de l'élève connecté. Tant que l'écrit est en cours
// ("mode épreuve"), son espace se réduit à l'épreuve et au Studio texte/image :
// MainLayout filtre la navigation et renvoie vers l'accueil toute autre page
// (cf. isPathAllowedDuringExam), l'accueil devient l'épreuve.
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/app/state/auth-context";
import { getExamForStudent, type CertificationExam } from "@/app/lib/certification";

interface CertificationContextValue {
  exam: CertificationExam | null;
  loading: boolean;
  examMode: boolean;
  refresh: () => Promise<void>;
}

const CertificationContext = createContext<CertificationContextValue>({
  exam: null, loading: false, examMode: false, refresh: async () => {},
});

export const useCertification = () => useContext(CertificationContext);

const EXAM_ALLOWED_PATHS = ["/dashboard", "/certification", "/certification/ecrit", "/studio", "/studio/chatgpt", "/studio/gemini", "/studio/claude", "/studio/images", "/profile"];

export function isPathAllowedDuringExam(pathname: string): boolean {
  return EXAM_ALLOWED_PATHS.includes(pathname.replace(/\/+$/, "") || "/");
}

export function CertificationProvider({ children }: { children: ReactNode }) {
  const { user, role, companyId } = useAuth();
  const [exam, setExam] = useState<CertificationExam | null>(null);
  // Élève pour lequel l'épreuve a été chargée : tant qu'il diffère de l'élève
  // connecté, on reste en chargement (évite d'afficher un instant l'accueil
  // normal avant de basculer en mode épreuve).
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const studentId = role === "student" && !companyId ? user?.id ?? null : null;

  const refresh = useCallback(async () => {
    if (!studentId) { setExam(null); return; }
    try {
      setExam(await getExamForStudent(studentId));
    } catch (err) {
      console.error(err);
    } finally {
      setLoadedFor(studentId);
    }
  }, [studentId]);

  useEffect(() => { void refresh(); }, [refresh]);

  const loading = !!studentId && loadedFor !== studentId;

  return (
    <CertificationContext.Provider value={{ exam: studentId ? exam : null, loading, examMode: !!studentId && exam?.status === "in_progress", refresh }}>
      {children}
    </CertificationContext.Provider>
  );
}
