import { apiGet, apiPost, apiPut } from "./api";
import { getStoredDemoStudentProfile, isDemoToken, saveDemoStudentProfile } from "../demo/demo-storage";
import { demoStudentProfile } from "../demo/demo-profiles";

export type StudentProfile = {
  id: string;
  name: string;
  course: string;
  skills: string[];
  availability: string;
  portfolio?: string | null;
  isVisible?: boolean;
};

export type CreateStudentProfileInput = {
  name: string;
  course: string;
  skills: string[];
  availability: string;
  portfolio?: string;
};

export function getMyStudentProfile(token: string) {
  if (isDemoToken(token)) {
    return Promise.resolve(getStoredDemoStudentProfile() as StudentProfile);
  }

  return apiGet<StudentProfile>("/students/me", token);
}

export function createStudentProfile(data: CreateStudentProfileInput, token: string) {
  if (isDemoToken(token)) {
    const profile = {
      ...demoStudentProfile,
      ...data,
    } satisfies StudentProfile;

    saveDemoStudentProfile(profile);
    return Promise.resolve(profile);
  }

  return apiPost<StudentProfile>("/students", data, token);
}

export function updateStudentProfile(id: string, data: CreateStudentProfileInput, token: string) {
  if (isDemoToken(token)) {
    const profile = {
      ...(getStoredDemoStudentProfile() as StudentProfile),
      id,
      ...data,
    } satisfies StudentProfile;

    saveDemoStudentProfile(profile);
    return Promise.resolve(profile);
  }

  return apiPut<StudentProfile>(`/students/${id}`, data, token);
}
