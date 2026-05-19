import { AppError } from "../../shared/errors/app.error";
import { NotificationService } from "../notifications/notification.service";
import { CompanyRepository } from "./company.repository";
import { CreateCompanyDTO, UpdateCompanyDTO } from "./company.dto";

const companyRepository = new CompanyRepository();
const notificationService = new NotificationService();

export class CompanyService {
  async create(data: CreateCompanyDTO, actorUserId?: string) {
    const companyExists = await companyRepository.findByUserId(data.userId);

    if (companyExists) {
      throw new AppError("Perfil de empresa já cadastrado.", 409);
    }

    const company = await companyRepository.create(data);

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

    const updatedCompany = await companyRepository.update(id, data);

    await notificationService.notifyCompanyProfileUpdated({
      actorUserId,
      companyId: company.id,
      companyName: updatedCompany.name,
      companyUserId: company.userId,
    });

    return updatedCompany;
  }
}
