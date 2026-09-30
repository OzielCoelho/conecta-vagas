import { AppError } from "../../shared/errors/app.error";
import { Role } from "../../generated/prisma";
import { NotificationService } from "../notifications/notification.service";
import { CompanyRepository } from "./company.repository";
import { CreateCompanyDTO, UpdateCompanyDTO, CreateCompanyRecord, UpdateCompanyRecord } from "./company.dto";

const companyRepository = new CompanyRepository();
const notificationService = new NotificationService();

function normalizeName(value: string, label: string) {
  if (typeof value !== "string" || value.trim().length < 2 || value.trim().length > 160) {
    throw new AppError(`${label} deve ter entre 2 e 160 caracteres.`, 400);
  }
  return value.trim();
}

function normalizeCompanyFields(data: UpdateCompanyDTO): UpdateCompanyRecord {
  const result: UpdateCompanyRecord = {};
  if (data.name !== undefined) result.name = normalizeName(data.name, "Nome");
  if (data.legalName !== undefined) result.legalName = normalizeName(data.legalName, "Razão social");
  if (data.tradeName !== undefined) result.tradeName = normalizeName(data.tradeName, "Nome fantasia");
  if (data.logoUrl !== undefined) result.logoUrl = data.logoUrl.trim();
  if (data.commercialPhone !== undefined) result.commercialPhone = data.commercialPhone.trim();
  if (data.businessSector !== undefined) result.businessSector = data.businessSector.trim();
  // Both names are supported by the API; cultureDescription takes precedence.
  const description = data.cultureDescription ?? data.about;
  if (description !== undefined) {
    result.cultureDescription = description.trim();
    result.about = description.trim();
  }
  return result;
}

export class CompanyService {
  async create(data: CreateCompanyDTO, actorUserId?: string) {
    const legalName = normalizeName(data.legalName, "Razão social");
    const tradeName = normalizeName(data.tradeName, "Nome fantasia");
    const payload: CreateCompanyRecord = {
      ...normalizeCompanyFields(data),
      userId: data.userId,
      legalName,
      tradeName,
      name: tradeName,
    };
    const companyExists = await companyRepository.findByUserId(data.userId);

    if (companyExists) {
      throw new AppError("Perfil de empresa já cadastrado.", 409);
    }

    const company = await companyRepository.create(payload);

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

  async update(id: string, data: UpdateCompanyDTO, actorUserId: string, actorRole: Role) {
    const company = await companyRepository.findById(id);

    if (!company) {
      throw new AppError("Empresa não encontrada.", 404);
    }

    if (company.userId !== actorUserId && actorRole !== Role.COORDINATOR) {
      throw new AppError("Acesso negado.", 403);
    }

    const payload = normalizeCompanyFields(data);
    if (payload.tradeName !== undefined || payload.legalName !== undefined || payload.name !== undefined) {
      payload.name = payload.tradeName ?? company.tradeName
        ?? payload.legalName ?? company.legalName ?? payload.name ?? company.name;
    }
    const updatedCompany = await companyRepository.update(id, payload);

    await notificationService.notifyCompanyProfileUpdated({
      actorUserId,
      companyId: company.id,
      companyName: updatedCompany.name,
      companyUserId: company.userId,
    });

    return updatedCompany;
  }
}
