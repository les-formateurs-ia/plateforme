import type { ReactElement } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { ThemeProvider } from "@/app/theme/theme";
import { ProfileProvider, useProfile } from "@/app/state/profile-context";
import { MainLayout } from "@/app/components/layout/MainLayout";
import { OnboardingPage } from "@/app/pages/OnboardingPage";
import { LessonPage } from "@/app/pages/LessonPage";
import { DashboardPage } from "@/app/pages/dashboard/DashboardPage";
import { LessonsPage } from "@/app/pages/lessons/LessonsPage";
import { PracticePage } from "@/app/pages/practice/PracticePage";
import { CalendarPage } from "@/app/pages/calendar/CalendarPage";
import { BenefitsPage } from "@/app/pages/benefits/BenefitsPage";
import { ProfilePage } from "@/app/pages/profile/ProfilePage";

function RequireOnboarding({ children }: { children: ReactElement }) {
  const { isOnboarded } = useProfile();
  return isOnboarded ? children : <Navigate to="/onboarding" replace />;
}

function RedirectIfOnboarded({ children }: { children: ReactElement }) {
  const { isOnboarded } = useProfile();
  return isOnboarded ? <Navigate to="/" replace /> : children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/onboarding" element={<RedirectIfOnboarded><OnboardingPage /></RedirectIfOnboarded>} />
      <Route element={<RequireOnboarding><MainLayout /></RequireOnboarding>}>
        <Route index element={<DashboardPage />} />
        <Route path="lessons" element={<LessonsPage />} />
        <Route path="practice" element={<PracticePage />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="benefits" element={<BenefitsPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>
      <Route path="/lesson/:lessonId" element={<RequireOnboarding><LessonPage /></RequireOnboarding>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ProfileProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </ProfileProvider>
    </ThemeProvider>
  );
}
