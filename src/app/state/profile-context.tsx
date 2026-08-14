import { createContext, useContext, useState, type ReactNode } from "react";
import type { Profile } from "@/app/types";

const EMPTY_PROFILE: Profile = { name: "", age: "", profession: "", goal: "", goalFinal: "", style: "", tutor: "" };

interface ProfileContextValue {
  profile: Profile;
  isOnboarded: boolean;
  completeOnboarding: (profile: Profile) => void;
}

const ProfileContext = createContext<ProfileContextValue>({
  profile: EMPTY_PROFILE,
  isOnboarded: false,
  completeOnboarding: () => {},
});

export const useProfile = () => useContext(ProfileContext);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile>(EMPTY_PROFILE);
  const [isOnboarded, setIsOnboarded] = useState(false);

  const completeOnboarding = (p: Profile) => {
    setProfile(p);
    setIsOnboarded(true);
  };

  return (
    <ProfileContext.Provider value={{ profile, isOnboarded, completeOnboarding }}>
      {children}
    </ProfileContext.Provider>
  );
}
