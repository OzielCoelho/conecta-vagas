import { apiGet, apiPost, apiPut } from "./api";
import { getStoredDemoCompanyProfile, isDemoToken, saveDemoCompanyProfile } from "../demo/demo-storage";
import { demoCompanyProfile } from "../demo/demo-profiles";

export type CompanyProfile = {
  id: string;
  name: string;
  about?: string | null;
};

export type CreateCompanyProfileInput = {
  name: string;
  about?: string;
};

export function getMyCompanyProfile(token: string) {
  if (isDemoToken(token)) {
    return Promise.resolve(getStoredDemoCompanyProfile() as CompanyProfile);
  }

  return apiGet<CompanyProfile>("/companies/me", token);
}

export function createCompanyProfile(data: CreateCompanyProfileInput, token: string) {
  if (isDemoToken(token)) {
    const profile = {
      ...demoCompanyProfile,
      ...data,
    } satisfies CompanyProfile;

    saveDemoCompanyProfile(profile);
    return Promise.resolve(profile);
  }

  return apiPost<CompanyProfile>("/companies", data, token);
}

export function updateCompanyProfile(id: string, data: CreateCompanyProfileInput, token: string) {
  if (isDemoToken(token)) {
    const profile = {
      ...(getStoredDemoCompanyProfile() as CompanyProfile),
      id,
      ...data,
    } satisfies CompanyProfile;

    saveDemoCompanyProfile(profile);
    return Promise.resolve(profile);
  }

  return apiPut<CompanyProfile>(`/companies/${id}`, data, token);
}
