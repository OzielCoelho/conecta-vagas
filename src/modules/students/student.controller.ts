import { FastifyRequest, FastifyReply } from "fastify";
import { CreateStudentDTO, UpdateStudentDTO } from "./student.dto";
import { StudentService } from "./student.service";
import { extractResumeDraft, RESUME_MAX_FILE_SIZE } from "./resume-import.service";
import { AppError } from "../../shared/errors/app.error";

const studentService = new StudentService();

export class StudentController {
  async create(request: FastifyRequest, reply: FastifyReply) {
    const data = request.body as Omit<CreateStudentDTO, "userId">;
    const userId = request.user.id;

    const student = await studentService.create({ ...data, userId }, userId);

    return reply.status(201).send(student);
  }

  async getMyProfile(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user.id;
    const student = await studentService.findByUserId(userId);
    return reply.send(student);
  }

  async getAll(request: FastifyRequest, reply: FastifyReply) {
    const students = await studentService.findAll();
    return reply.send(students);
  }

  async update(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const data = request.body as UpdateStudentDTO;
    const student = await studentService.update(id, data, request.user.id, request.user.role);
    return reply.send(student);
  }

  async importResume(request: FastifyRequest, reply: FastifyReply) {
    const upload = await request.file();

    if (!upload) {
      throw new AppError("Envie um arquivo PDF de curriculo.", 400);
    }

    if (upload.mimetype !== "application/pdf") {
      throw new AppError("O curriculo deve estar no formato PDF.", 415);
    }

    const buffer = await upload.toBuffer();

    if (buffer.length > RESUME_MAX_FILE_SIZE) {
      throw new AppError("O curriculo deve ter no maximo 5 MB.", 413);
    }

    const draft = await extractResumeDraft(buffer);

    return reply.send({
      filename: upload.filename,
      profileDraft: draft,
      requiresConfirmation: true,
    });
  }
}
