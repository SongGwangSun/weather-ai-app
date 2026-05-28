export type Gender = 'male' | 'female' | 'other';

export interface UserProfile {
  gender: Gender;
  age: number;
  height: number;   // cm
  weight: number;   // kg
}

export function getBMI(height: number, weight: number): number {
  const h = height / 100;
  return weight / (h * h);
}

/** slim / normal / full based on BMI */
export function getBodyType(bmi: number): 'slim' | 'normal' | 'full' {
  if (bmi < 18.5) return 'slim';
  if (bmi < 25)   return 'normal';
  return 'full';
}

const PROFILE_KEY = 'user-profile-v2';

export function loadProfile(): UserProfile | null {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserProfile;
  } catch { return null; }
}

export function saveProfile(p: UserProfile): void {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
}
