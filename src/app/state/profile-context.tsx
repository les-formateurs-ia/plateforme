import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/app/lib/supabase/client";
import { useAuth } from "@/app/state/auth-context";
import type { Profile } from "@/app/types";

const EMPTY_PROFILE: Profile = { name: "", age: "", profession: "", goal: "", goalFinal: "", style: "", tutor: "", avatarUrl: null };

interface ProfileContextValue {
  profile: Profile;
  loading: boolean;
  saveOnboarding: (profile: Profile) => Promise<void>;
  updateProfile: (patch: Partial<Profile>) => Promise<{ error: string | null }>;
  updateAvatar: (file: File) => Promise<{ error: string | null }>;
}

const ProfileContext = createContext<ProfileContextValue>({
  profile: EMPTY_PROFILE,
  loading: true,
  saveOnboarding: async () => {},
  updateProfile: async () => ({ error: "Profil non initialisé" }),
  updateAvatar: async () => ({ error: "Profil non initialisé" }),
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
      try {
        const [{ data: p }, { data: o }] = await Promise.all([
          supabase.from("profiles").select("first_name, avatar_url").eq("id", user.id).maybeSingle(),
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
          avatarUrl: p?.avatar_url ?? null,
        });
      } catch (error) {
        console.warn("Unable to load profile details", error);
        if (!cancelled) setProfile(EMPTY_PROFILE);
      } finally {
        if (!cancelled) setLoading(false);
      }
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

  const updateProfile = async (patch: Partial<Profile>) => {
    if (!user) return { error: "Utilisateur non connecté" };

    const nextProfile = { ...profile, ...patch };

    const profileUpdate =
      patch.name !== undefined
        ? supabase.from("profiles").update({ first_name: patch.name }).eq("id", user.id)
        : Promise.resolve({ error: null });

    const onboardingUpdate =
      patch.age !== undefined ||
      patch.profession !== undefined ||
      patch.goal !== undefined ||
      patch.goalFinal !== undefined ||
      patch.style !== undefined ||
      patch.tutor !== undefined
        ? supabase.from("student_onboarding").upsert({
            user_id: user.id,
            age: nextProfile.age,
            profession: nextProfile.profession,
            goal: nextProfile.goal,
            goal_detail: nextProfile.goalFinal && nextProfile.goalFinal !== nextProfile.goal ? nextProfile.goalFinal : null,
            learning_style: nextProfile.style,
            ai_tutor_persona: nextProfile.tutor,
          })
        : Promise.resolve({ error: null });

    const [{ error: profileError }, { error: onboardingError }] = await Promise.all([profileUpdate, onboardingUpdate]);
    const error = profileError?.message ?? onboardingError?.message ?? null;

    if (!error) setProfile(nextProfile);
    return { error };
  };

  const updateAvatar = async (file: File) => {
    if (!user) return { error: "Utilisateur non connecté" };

    const path = `${user.id}/avatar`;
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (uploadError) return { error: uploadError.message };

    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    const avatarUrl = `${data.publicUrl}?v=${Date.now()}`;

    const { error: updateError } = await supabase.from("profiles").update({ avatar_url: avatarUrl }).eq("id", user.id);
    if (updateError) return { error: updateError.message };

    setProfile((current) => ({ ...current, avatarUrl }));
    return { error: null };
  };

  return (
    <ProfileContext.Provider value={{ profile, loading, saveOnboarding, updateProfile, updateAvatar }}>
      {children}
    </ProfileContext.Provider>
  );
}
