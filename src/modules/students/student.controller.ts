import { FastifyRequest, FastifyReply } from "fastify";
import { ConfirmResumeDTO, CreateStudentDTO, UpdateStudentDTO } from "./student.dto";
import { StudentService } from "./student.service";
import { extractResumeDraftFromText, extractResumeText, RESUME_MAX_FILE_SIZE } from "./resume-import.service";
import { enrichResumeDraftWithLlm } from "./resume-llm.service";
import { generateResumePdf } from "./resume-pdf.service";
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

    const text = await extractResumeText(buffer);
    const localDraft = extractResumeDraftFromText(text);
    const { draft, source } = await enrichResumeDraftWithLlm(text, localDraft);

    return reply.send({
      filename: upload.filename,
      profileDraft: draft,
      requiresConfirmation: true,
      extractionSource: source,
    });
  }

  async confirmResume(request: FastifyRequest, reply: FastifyReply) {
    const {
      name,
      course,
      skills,
      availability,
      headline,
      summary,
      city,
      state,
      semester,
      university,
      cr,
      portfolio,
    } = request.body as ConfirmResumeDTO;
    const data: ConfirmResumeDTO = {
      name,
      course,
      skills,
      availability,
      headline,
      summary,
      city,
      state,
      semester,
      university,
      cr,
      portfolio,
    };
    const student = await studentService.confirmResume(request.user.id, data);
    return reply.send(student);
  }

  async downloadResume(request: FastifyRequest, reply: FastifyReply) {
    const student = await studentService.findByUserId(request.user.id);
    const pdf = await generateResumePdf(student);
    const filename = `curriculo-${student.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "aluno"}.pdf`;

    return reply
      .type("application/pdf")
      .header("Content-Disposition", `attachment; filename="${filename}"`)
      .send(pdf);
  }
}
