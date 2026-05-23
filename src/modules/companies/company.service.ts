import { AppError } from "../../shared/errors/app.error";
import { NotificationService } from "../notifications/notification.service";
import { CompanyRepository } from "./company.repository";
import { CreateCompanyDTO, UpdateCompanyDTO } from "./company.dto";

const companyRepository = new CompanyRepository();
const notificationService = new NotificationService();

function normalizeOptionalText(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function resolveDisplayName(data: {
  tradeName?: string;
  legalName?: string;
  name?: string;
}, fallbackName?: string) {
  return normalizeOptionalText(data.tradeName)
    ?? normalizeOptionalText(data.legalName)
    ?? normalizeOptionalText(data.name)
    ?? fallbackName
    ?? "Empresa";
}

function buildCompanyPayload(
  data: Partial<CreateCompanyDTO & UpdateCompanyDTO>,
  fallbackName?: string
) {
  const tradeName = normalizeOptionalText(data.tradeName);
  const legalName = normalizeOptionalText(data.legalName);
  const cultureDescription = normalizeOptionalText(data.cultureDescription);

  return {
    name: resolveDisplayName({ tradeName, legalName, name: data.name }, fallbackName),
    about: cultureDescription,
    logoUrl: normalizeOptionalText(data.logoUrl),
    commercialPhone: normalizeOptionalText(data.commercialPhone),
    legalName,
    tradeName,
    cultureDescription,
    businessSector: normalizeOptionalText(data.businessSector),
  };
}

export class CompanyService {
  async create(data: CreateCompanyDTO, actorUserId?: string) {
    const companyExists = await companyRepository.findByUserId(data.userId);

    if (companyExists) {
      throw new AppError("Perfil de empresa já cadastrado.", 409);
    }

    const company = await companyRepository.create({
      ...buildCompanyPayload(data),
      userId: data.userId,
    });

    await notificationService.notifyCompanyProfileCreated({
      actorUserId,
      companyId: company.id,
      companyName: company.name,
      companyUserId: company.userId,
    });

    return company;
  }

  async findByUserId(userId: string) {
    const company = await companyRepository.findByUserId(userId);

    if (!company) {
      throw new AppError("Empresa não encontrada.", 404);
    }

    return company;
  }

  async update(id: string, data: UpdateCompanyDTO, actorUserId?: string) {
    const company = await companyRepository.findById(id);

    if (!company) {
      throw new AppError("Empresa não encontrada.", 404);
    }

    const updatedCompany = await companyRepository.update(id, buildCompanyPayload(data, company.name));

    await notificationService.notifyCompanyProfileUpdated({
      actorUserId,
      companyId: company.id,
      companyName: updatedCompany.name,
      companyUserId: company.userId,
    });

    return updatedCompany;
  }
}
