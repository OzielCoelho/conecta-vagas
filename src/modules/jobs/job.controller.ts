import { FastifyRequest, FastifyReply } from "fastify";
import { JobService } from "./job.service";
import { CreateJobDTO, UpdateJobDTO, updateJobSchema } from "./job.dto";
import { CompanyService } from "../companies/company.service";

const jobService = new JobService();
const companyService = new CompanyService();

export class JobController {
  async create(request: FastifyRequest, reply: FastifyReply) {
    const data = request.body as Omit<CreateJobDTO, "companyId">;
    const userId = request.user.id;

    const company = await companyService.findByUserId(userId);

    const job = await jobService.create({ ...data, companyId: company.id });

    return reply.status(201).send(job);
  }

  async getAll(request: FastifyRequest, reply: FastifyReply) {
    const filters = request.query as { model?: any; course?: string };
    
    const jobs = await jobService.findAll(filters);

    return reply.send(jobs);
  }

  async getById(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };

    const job = await jobService.findById(id);

    return reply.send(job);
  }

  async update(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
   const data = updateJobSchema.parse(request.body);

    const job = await jobService.update(id, data);

    return reply.send(job);
  }
}