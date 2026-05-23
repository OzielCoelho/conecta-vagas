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
