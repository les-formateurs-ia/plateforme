import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/app/lib/supabase/client";
import { useAuth } from "@/app/state/auth-context";
import type { Profile } from "@/app/types";

const EMPTY_PROFILE: Profile = { name: "", age: "", profession: "", goal: "", goalFinal: "", style: "", tutor: "" };

interface ProfileContextValue {
  profile: Profile;
  loading: boolean;
  saveOnboarding: (profile: Profile) => Promise<void>;
}

const ProfileContext = createContext<ProfileContextValue>({
  profile: EMPTY_PROFILE,
  loading: true,
  saveOnboarding: async () => {},
});

export const useProfile = () => useContext(ProfileContext);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user, markOnboarded } = useAuth();
  const [profile, setProfile] = useState<Profile>(EMPTY_PROFILE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setProfile(EMPTY_PROFILE);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      const [{ data: p }, { data: o }] = await Promise.all([
        supabase.from("profiles").select("first_name").eq("id", user.id).single(),
        supabase.from("student_onboarding").select("*").eq("user_id", user.id).maybeSingle(),
      ]);
      if (cancelled) return;
      setProfile({
        name: p?.first_name ?? "",
        age: o?.age ?? "",
        profession: o?.profession ?? "",
        goal: o?.goal ?? "",
        goalFinal: o?.goal_detail ?? o?.goal ?? "",
        style: o?.learning_style ?? "",
        tutor: o?.ai_tutor_persona ?? "",
      });
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user]);

  const saveOnboarding = async (p: Profile) => {
    if (!user) return;
    await supabase.from("profiles").update({ first_name: p.name, must_onboard: false }).eq("id", user.id);
    await supabase.from("student_onboarding").upsert({
      user_id: user.id,
      age: p.age,
      profession: p.profession,
      goal: p.goal,
      goal_detail: p.goalFinal && p.goalFinal !== p.goal ? p.goalFinal : null,
      learning_style: p.style,
      ai_tutor_persona: p.tutor,
    });
    setProfile(p);
    markOnboarded();
  };

  return (
    <ProfileContext.Provider value={{ profile, loading, saveOnboarding }}>
      {children}
    </ProfileContext.Provider>
  );
}
