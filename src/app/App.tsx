import type { ReactElement } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { ThemeProvider, useTh } from "@/app/theme/theme";
import { AuthProvider, useAuth } from "@/app/state/auth-context";
import { isStaff, isAdmin } from "@/app/lib/permissions";
import { ProfileProvider } from "@/app/state/profile-context";
import { BulkGenerationProvider } from "@/app/state/bulk-generation-context";
import { Toaster } from "@/app/components/ui/sonner";
import { Background } from "@/app/components/common/Background";
import { MainLayout } from "@/app/components/layout/MainLayout";
import { LoginPage } from "@/app/pages/auth/LoginPage";
import { SignupPage } from "@/app/pages/auth/SignupPage";
import { LessonPage } from "@/app/pages/LessonPage";
import { DashboardPage } from "@/app/pages/dashboard/DashboardPage";
import { LessonsPage } from "@/app/pages/lessons/LessonsPage";
import { PracticePage } from "@/app/pages/practice/PracticePage";
import { AgentPage } from "@/app/pages/agent/AgentPage";
import { BasicExercisesPage } from "@/app/pages/practice/BasicExercisesPage";
import { PromptSessionsPage } from "@/app/pages/practice/PromptSessionsPage";
import { PromptExercisePage } from "@/app/pages/practice/PromptExercisePage";
import { MediaExerciseSessionsPage } from "@/app/pages/practice/MediaExerciseSessionsPage";
import { MediaExercisePage } from "@/app/pages/practice/MediaExercisePage";
import { HtmlExerciseSessionsPage } from "@/app/pages/practice/HtmlExerciseSessionsPage";
import { HtmlExercisePage } from "@/app/pages/practice/HtmlExercisePage";
import { CalendarPage } from "@/app/pages/calendar/CalendarPage";
import { BenefitsPage } from "@/app/pages/benefits/BenefitsPage";
import { ProfilePage } from "@/app/pages/profile/ProfilePage";
import { AdminCoursesPage } from "@/app/pages/admin/AdminCoursesPage";
import { AdminCourseEditorPage } from "@/app/pages/admin/AdminCourseEditorPage";
import { AdminLessonEditorPage } from "@/app/pages/admin/AdminLessonEditorPage";
import { AdminFormationPreviewPage } from "@/app/pages/admin/AdminFormationPreviewPage";
import { AdminPlanningPage } from "@/app/pages/admin/AdminPlanningPage";
import { AdminStudentDetailPage } from "@/app/pages/admin/AdminStudentDetailPage";
import { AdminAvailabilityPage } from "@/app/pages/admin/AdminAvailabilityPage";
import { AdminTrashPage } from "@/app/pages/admin/AdminTrashPage";
import { AdminIncidentsPage } from "@/app/pages/admin/AdminIncidentsPage";

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
// On attend que le profil soit chargé avant de décider quoi que ce soit sur mustOnboard —
// sinon sa valeur par défaut (true) provoque un aller-retour visible vers /signup au
// rechargement d'une page profonde (ex: /lessons, /lesson/:id).
function RequireAuth({ children }: { children: ReactElement }) {
  const { status, mustOnboard, profileLoading } = useAuth();
  if (status === "loading") return <LoadingScreen />;
  if (status === "unauthenticated") return <Navigate to="/login" replace />;
  if (profileLoading) return <LoadingScreen />;
  if (mustOnboard) return <Navigate to="/signup" replace />;
  return children;
}

// /login : inutile si déjà connecté et onboardé.
function RedirectIfAuthenticated({ children }: { children: ReactElement }) {
  const { status, mustOnboard, profileLoading } = useAuth();
  if (status === "loading") return <LoadingScreen />;
  if (status === "authenticated" && profileLoading) return <LoadingScreen />;
  if (status === "authenticated" && !mustOnboard) return <Navigate to="/" replace />;
  return children;
}

// /signup : reste accessible tant que l'onboarding n'est pas terminé (reprise possible),
// mais inutile si le compte est déjà complet.
function SignupGuard({ children }: { children: ReactElement }) {
  const { status, mustOnboard, profileLoading } = useAuth();
  if (status === "loading") return <LoadingScreen />;
  if (status === "authenticated" && profileLoading) return <LoadingScreen />;
  if (status === "authenticated" && !mustOnboard) return <Navigate to="/" replace />;
  return children;
}

// Zone admin/formateur : le rôle n'est connu qu'une fois le profil chargé
// (juste après RequireAuth), donc on affiche un loader tant qu'il vaut encore
// null plutôt que de rediriger par erreur pendant ce court instant.
function RequireStaff({ children }: { children: ReactElement }) {
  const { role } = useAuth();
  if (role === null) return <LoadingScreen />;
  if (!isStaff(role)) return <Navigate to="/" replace />;
  return children;
}

// /admin/* : réservé à l'admin. Le formateur, bien que "staff", est
// désormais redirigé vers son équivalent sous /formateur/*.
function RequireAdmin({ children }: { children: ReactElement }) {
  const { role } = useAuth();
  if (role === null) return <LoadingScreen />;
  if (role === "formateur") return <Navigate to="/formateur/courses" replace />;
  if (!isAdmin(role)) return <Navigate to="/" replace />;
  return children;
}

// /formateur/* : réservé au formateur (même pages qu'/admin/*, sauf la
// corbeille et les actions déjà limitées à l'admin dans ces pages).
function RequireFormateur({ children }: { children: ReactElement }) {
  const { role } = useAuth();
  if (role === null) return <LoadingScreen />;
  if (role === "admin") return <Navigate to="/admin/courses" replace />;
  if (role !== "formateur") return <Navigate to="/" replace />;
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
        <Route path="practice/basics" element={<BasicExercisesPage />} />
        <Route path="practice/prompts" element={<PromptSessionsPage />} />
        <Route path="practice/prompts/:sessionId" element={<PromptExercisePage />} />
        <Route path="practice/media" element={<MediaExerciseSessionsPage />} />
        <Route path="practice/media/:sessionId" element={<MediaExercisePage />} />
        <Route path="practice/html" element={<HtmlExerciseSessionsPage />} />
        <Route path="practice/html/:sessionId" element={<HtmlExercisePage />} />
        <Route path="agent" element={<AgentPage />} />
        <Route path="agent/:conversationId" element={<AgentPage />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="benefits" element={<BenefitsPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="admin/courses" element={<RequireAdmin><AdminCoursesPage /></RequireAdmin>} />
        <Route path="admin/courses/trash" element={<RequireAdmin><AdminTrashPage /></RequireAdmin>} />
        <Route path="admin/courses/new" element={<RequireAdmin><AdminCourseEditorPage /></RequireAdmin>} />
        <Route path="admin/courses/:courseId" element={<RequireAdmin><AdminCourseEditorPage /></RequireAdmin>} />
        <Route path="admin/courses/:courseId/lessons/new" element={<RequireAdmin><AdminLessonEditorPage /></RequireAdmin>} />
        <Route path="admin/courses/:courseId/lessons/:lessonId" element={<RequireAdmin><AdminLessonEditorPage /></RequireAdmin>} />
        <Route path="admin/instances/:instanceId" element={<RequireAdmin><AdminCourseEditorPage /></RequireAdmin>} />
        <Route path="admin/instances/:instanceId/preview" element={<RequireAdmin><AdminFormationPreviewPage /></RequireAdmin>} />
        <Route path="admin/instances/:instanceId/lessons/new" element={<RequireAdmin><AdminLessonEditorPage /></RequireAdmin>} />
        <Route path="admin/instances/:instanceId/lessons/:lessonId" element={<RequireAdmin><AdminLessonEditorPage /></RequireAdmin>} />
        <Route path="admin/planning" element={<RequireAdmin><AdminPlanningPage /></RequireAdmin>} />
        <Route path="admin/planning/students/:studentId" element={<RequireAdmin><AdminStudentDetailPage /></RequireAdmin>} />
        <Route path="admin/incidents" element={<RequireAdmin><AdminIncidentsPage /></RequireAdmin>} />

        <Route path="formateur/courses" element={<RequireFormateur><AdminCoursesPage /></RequireFormateur>} />
        <Route path="formateur/courses/new" element={<RequireFormateur><AdminCourseEditorPage /></RequireFormateur>} />
        <Route path="formateur/courses/:courseId" element={<RequireFormateur><AdminCourseEditorPage /></RequireFormateur>} />
        <Route path="formateur/courses/:courseId/lessons/new" element={<RequireFormateur><AdminLessonEditorPage /></RequireFormateur>} />
        <Route path="formateur/courses/:courseId/lessons/:lessonId" element={<RequireFormateur><AdminLessonEditorPage /></RequireFormateur>} />
        <Route path="formateur/instances/:instanceId" element={<RequireFormateur><AdminCourseEditorPage /></RequireFormateur>} />
        <Route path="formateur/instances/:instanceId/preview" element={<RequireFormateur><AdminFormationPreviewPage /></RequireFormateur>} />
        <Route path="formateur/instances/:instanceId/lessons/new" element={<RequireFormateur><AdminLessonEditorPage /></RequireFormateur>} />
        <Route path="formateur/instances/:instanceId/lessons/:lessonId" element={<RequireFormateur><AdminLessonEditorPage /></RequireFormateur>} />
        <Route path="formateur/planning" element={<RequireFormateur><AdminPlanningPage /></RequireFormateur>} />
        <Route path="formateur/planning/students/:studentId" element={<RequireFormateur><AdminStudentDetailPage /></RequireFormateur>} />

        <Route path="planning" element={<RequireStaff><AdminAvailabilityPage /></RequireStaff>} />
      </Route>
      <Route path="/lesson/:lessonId" element={<RequireAuth><LessonPage /></RequireAuth>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <ProfileProvider>
          <BulkGenerationProvider>
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
            <Toaster />
          </BulkGenerationProvider>
        </ProfileProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
