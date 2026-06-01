import { apiGet, apiPost, apiPut } from "./api";

export type CompanyProfile = {
  id: string;
  name: string;
  about?: string | null;
  logoUrl?: string | null;
  commercialPhone?: string | null;
  legalName?: string | null;
  tradeName?: string | null;
  cultureDescription?: string | null;
  businessSector?: string | null;
};

export type CreateCompanyProfileInput = {
  name?: string;
  about?: string;
  logoUrl?: string;
  commercialPhone?: string;
  legalName: string;
  tradeName: string;
  cultureDescription?: string;
  businessSector?: string;
};

export function getMyCompanyProfile(token: string) {
  return apiGet<CompanyProfile>("/companies/me", token);
}

export function createCompanyProfile(data: CreateCompanyProfileInput, token: string) {
  return apiPost<CompanyProfile>("/companies", data, token);
}

export function updateCompanyProfile(id: string, data: CreateCompanyProfileInput, token: string) {
  return apiPut<CompanyProfile>(`/companies/${id}`, data, token);
}
