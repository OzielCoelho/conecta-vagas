import type { Prisma } from "../../generated/prisma";

export interface CreateCompanyDTO {
  name?: string;
  about?: string;
  logoUrl?: string;
  commercialPhone?: string;
  legalName: string;
  tradeName: string;
  cultureDescription?: string;
  businessSector?: string;
  userId: string;
}

export interface UpdateCompanyDTO {
  name?: string;
  about?: string;
  logoUrl?: string;
  commercialPhone?: string;
  legalName?: string;
  tradeName?: string;
  cultureDescription?: string;
  businessSector?: string;
}

// Input accepted by the API differs from the normalized persistence payload.
export type CreateCompanyRecord = Pick<Prisma.CompanyUncheckedCreateInput,
  "name" | "about" | "logoUrl" | "commercialPhone" | "legalName" |
  "tradeName" | "cultureDescription" | "businessSector" | "userId"
> & { legalName: string; tradeName: string };

export type UpdateCompanyRecord = Partial<Omit<CreateCompanyRecord, "userId">>;
