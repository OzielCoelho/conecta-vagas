import { AppError } from "../../shared/errors/app.error";
import { Role } from "../../generated/prisma";
import { NotificationService } from "../notifications/notification.service";
import { CreateStudentDTO, UpdateStudentDTO } from "./student.dto";
import { StudentRepository } from "./student.repository";

const studentRepository = new StudentRepository();
const notificationService = new NotificationService();

export class StudentService {
  async create(data: CreateStudentDTO, actorUserId?: string) {
    const studentExists = await studentRepository.findByUserId(data.userId);

    if (studentExists) {
      throw new AppError("Perfil de aluno já cadastrado.", 409);
    }

    const student = await studentRepository.create(data);

    await notificationService.notifyStudentProfileCreated({
      actorUserId,
      studentId: student.id,
      studentUserId: student.userId,
    });

    return student;
  }

  async findByUserId(userId: string) {
    const student = await studentRepository.findByUserId(userId);

    if (!student) {
      throw new AppError("Aluno não encontrado.", 404);
    }

    return student;
  }

  async findAll() {
    return studentRepository.findAll();
  }

  async update(id: string, data: UpdateStudentDTO, actorUserId: string, actorRole: Role) {
    const student = await studentRepository.findById(id);

    if (!student) {
      throw new AppError("Aluno não encontrado.", 404);
    }

    if (student.userId !== actorUserId && actorRole !== Role.COORDINATOR) {
      throw new AppError("Acesso negado.", 403);
    }

    const updatedStudent = await studentRepository.update(id, data);

    await notificationService.notifyStudentProfileUpdated({
      actorUserId,
      studentId: student.id,
      studentUserId: student.userId,
    });

    return updatedStudent;
  }
}
