import type { ReactElement } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { ThemeProvider, useTh } from "@/app/theme/theme";
import { AuthProvider, useAuth } from "@/app/state/auth-context";
import { ProfileProvider } from "@/app/state/profile-context";
import { Background } from "@/app/components/common/Background";
import { MainLayout } from "@/app/components/layout/MainLayout";
import { LoginPage } from "@/app/pages/auth/LoginPage";
import { SignupPage } from "@/app/pages/auth/SignupPage";
import { LessonPage } from "@/app/pages/LessonPage";
import { DashboardPage } from "@/app/pages/dashboard/DashboardPage";
import { LessonsPage } from "@/app/pages/lessons/LessonsPage";
import { PracticePage } from "@/app/pages/practice/PracticePage";
import { CalendarPage } from "@/app/pages/calendar/CalendarPage";
import { BenefitsPage } from "@/app/pages/benefits/BenefitsPage";
import { ProfilePage } from "@/app/pages/profile/ProfilePage";
import { AdminCoursesPage } from "@/app/pages/admin/AdminCoursesPage";
import { AdminCourseEditorPage } from "@/app/pages/admin/AdminCourseEditorPage";
import { AdminLessonEditorPage } from "@/app/pages/admin/AdminLessonEditorPage";

function LoadingScreen() {
  const th = useTh();
  return (
    <div className="relative min-h-screen flex items-center justify-center" style={{ background: th.bg }}>
      <Background />
      <div className="relative z-10 text-sm" style={{ color: th.fg3 }}>Chargement…</div>
    </div>
  );
}

// Accès à l'app : session valide + onboarding terminé, sinon renvoie vers /login ou /signup.
function RequireAuth({ children }: { children: ReactElement }) {
  const { status, mustOnboard } = useAuth();
  if (status === "loading") return <LoadingScreen />;
  if (status === "unauthenticated") return <Navigate to="/login" replace />;
  if (mustOnboard) return <Navigate to="/signup" replace />;
  return children;
}

// /login : inutile si déjà connecté et onboardé.
function RedirectIfAuthenticated({ children }: { children: ReactElement }) {
  const { status, mustOnboard } = useAuth();
  if (status === "loading") return <LoadingScreen />;
  if (status === "authenticated" && !mustOnboard) return <Navigate to="/" replace />;
  return children;
}

// /signup : reste accessible tant que l'onboarding n'est pas terminé (reprise possible),
// mais inutile si le compte est déjà complet.
function SignupGuard({ children }: { children: ReactElement }) {
  const { status, mustOnboard } = useAuth();
  if (status === "loading") return <LoadingScreen />;
  if (status === "authenticated" && !mustOnboard) return <Navigate to="/" replace />;
  return children;
}

// Zone admin : le rôle n'est connu qu'une fois le profil chargé (juste après
// RequireAuth), donc on affiche un loader tant qu'il vaut encore null plutôt
// que de rediriger un admin par erreur pendant ce court instant.
function RequireAdmin({ children }: { children: ReactElement }) {
  const { role } = useAuth();
  if (role === null) return <LoadingScreen />;
  if (role !== "admin") return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<RedirectIfAuthenticated><LoginPage /></RedirectIfAuthenticated>} />
      <Route path="/signup" element={<SignupGuard><SignupPage /></SignupGuard>} />
      <Route element={<RequireAuth><MainLayout /></RequireAuth>}>
        <Route index element={<DashboardPage />} />
        <Route path="lessons" element={<LessonsPage />} />
        <Route path="practice" element={<PracticePage />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="benefits" element={<BenefitsPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="admin/courses" element={<RequireAdmin><AdminCoursesPage /></RequireAdmin>} />
        <Route path="admin/courses/new" element={<RequireAdmin><AdminCourseEditorPage /></RequireAdmin>} />
        <Route path="admin/courses/:courseId" element={<RequireAdmin><AdminCourseEditorPage /></RequireAdmin>} />
        <Route path="admin/courses/:courseId/lessons/new" element={<RequireAdmin><AdminLessonEditorPage /></RequireAdmin>} />
        <Route path="admin/courses/:courseId/lessons/:lessonId" element={<RequireAdmin><AdminLessonEditorPage /></RequireAdmin>} />
      </Route>
      <Route path="/lesson/:lessonId" element={<RequireAuth><LessonPage /></RequireAuth>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ProfileProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </ProfileProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
