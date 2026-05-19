import { FastifyRequest, FastifyReply } from "fastify";
import { CompanyService } from "./company.service";
import { CreateCompanyDTO, UpdateCompanyDTO } from "./company.dto";

const companyService = new CompanyService();

export class CompanyController {
  async create(request: FastifyRequest, reply: FastifyReply) {
    const data = request.body as Omit<CreateCompanyDTO, "userId">;
    const userId = request.user.id;

    const company = await companyService.create({ ...data, userId }, userId);

    return reply.status(201).send(company);
  }

  async getMyProfile(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user.id;

    const company = await companyService.findByUserId(userId);

    return reply.send(company);
  }

  async update(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const data = request.body as UpdateCompanyDTO;

    const company = await companyService.update(id, data, request.user.id);

    return reply.send(company);
  }
}
