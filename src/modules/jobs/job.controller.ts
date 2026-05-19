import { FastifyRequest, FastifyReply } from "fastify";
import { CompanyService } from "../companies/company.service";
import { CreateJobDTO, UpdateJobDTO } from "./job.dto";
import { JobService } from "./job.service";

const jobService = new JobService();
const companyService = new CompanyService();

export class JobController {
  async create(request: FastifyRequest, reply: FastifyReply) {
    const data = request.body as Omit<CreateJobDTO, "companyId">;
    const userId = request.user.id;

    const company = await companyService.findByUserId(userId);

    const job = await jobService.create({ ...data, companyId: company.id }, userId);

    return reply.status(201).send(job);
  }

  async getAll(request: FastifyRequest, reply: FastifyReply) {
    const jobs = await jobService.findAll();

    return reply.send(jobs);
  }

  async getMine(request: FastifyRequest, reply: FastifyReply) {
    const company = await companyService.findByUserId(request.user.id);
    const jobs = await jobService.findByCompanyId(company.id);

    return reply.send(jobs);
  }

  async getById(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };

    const job = await jobService.findById(id);

    return reply.send(job);
  }

  async update(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const data = request.body as UpdateJobDTO;

    const job = await jobService.update(id, data, request.user.id, request.user.role);

    return reply.send(job);
  }
}
