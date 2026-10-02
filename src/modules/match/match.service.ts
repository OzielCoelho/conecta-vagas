import { prisma } from "../../shared/prisma/prisma.client";
import { AppError } from "../../shared/errors/app.error";
import { JobRepository } from "../jobs/job.repository";
import { publicStudentProfileSelect, StudentRepository } from "../students/student.repository";

const jobRepository = new JobRepository();
const studentRepository = new StudentRepository();
const normalize = (value: string) => value.trim().toLowerCase();

export class MatchService {
  calculateScore(
    studentSkills: string[],
    studentCourse: string,
    studentAvailability: string[],
    jobSkills: string[],
    jobCourse: string | null,
    jobAvailability: string | null
  ): number {
    let score = 0;

    const normalizedJobSkills = new Set(jobSkills.map(normalize));
    const normalizedStudentSkills = new Set(studentSkills.map(normalize));
    const matchedSkills = [...normalizedStudentSkills].filter((skill) => normalizedJobSkills.has(skill));

    if (normalizedJobSkills.size > 0) {
      score += (matchedSkills.length / normalizedJobSkills.size) * 60;
    }

    if (jobCourse && normalize(studentCourse) === normalize(jobCourse)) {
      score += 25;
    }

    if (
      jobAvailability &&
      studentAvailability.some((availability) => normalize(availability) === normalize(jobAvailability))
    ) {
      score += 15;
    }

    return Math.round(score);
  }

  isCompleteProfile(profile: { course: string; skills: string[]; availability: string[] }) {
    return Boolean(
      profile.course.trim() &&
      profile.skills.some((skill) => skill.trim()) &&
      profile.availability.some((availability) => availability.trim())
    );
  }

  buildJustification(
    studentSkills: string[],
    studentCourse: string,
    studentAvailability: string[],
    jobSkills: string[],
    jobCourse: string | null,
    jobAvailability: string | null
  ): string[] {
    const normalizedJobSkills = new Set(jobSkills.map(normalize));
    const matchedSkills = [...new Set(studentSkills.map(normalize))].filter((skill) => normalizedJobSkills.has(skill));
    const reasons: string[] = [];

    if (matchedSkills.length > 0) reasons.push(`${matchedSkills.length} habilidade(s) em comum`);
    if (jobCourse && normalize(studentCourse) === normalize(jobCourse)) reasons.push("curso alinhado");
    if (jobAvailability && studentAvailability.some((availability) => normalize(availability) === normalize(jobAvailability))) {
      reasons.push("disponibilidade compatível");
    }

    return reasons;
  }

  async getRecommendedJobsForStudent(userId: string) {
    const profile = await studentRepository.findMatchingProfileByUserId(userId);

    if (!profile) throw new AppError("Aluno não encontrado.", 404);
    if (!this.isCompleteProfile(profile)) return [];

    const jobs = await jobRepository.findActiveForMatching();

    return jobs
      .map((job) => ({
        ...job,
        compatibilityScore: this.calculateScore(
          profile.skills,
          profile.course,
          profile.availability,
          job.skills,
          job.course,
          job.availability
        ),
        justifications: this.buildJustification(
          profile.skills,
          profile.course,
          profile.availability,
          job.skills,
          job.course,
          job.availability
        ),
      }))
      .filter((job) => job.isActive && job.compatibilityScore > 0)
      .sort((left, right) =>
        right.compatibilityScore - left.compatibilityScore ||
        right.createdAt.getTime() - left.createdAt.getTime() ||
        left.id.localeCompare(right.id)
      );
  }

  async calculateAndSaveScore(applicationId: string) {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        student: true,
        job: true,
      },
    });

    if (!application) return null;

    const score = this.calculateScore(
      application.student.skills,
      application.student.course,
      application.student.availability,
      application.job.skills,
      application.job.course,
      application.job.availability
    );

    return prisma.application.update({
      where: { id: applicationId },
      data: { score },
      include: { job: true },
    });
  }

  async recalculateScoresForJob(jobId: string) {
    const applications = await prisma.application.findMany({
      where: { jobId },
      include: {
        student: true,
        job: true,
      },
    });

    const updatedApplications = await Promise.all(
      applications.map(async (application) => {
        if (!application) return null;

        const score = this.calculateScore(
          application.student.skills,
          application.student.course,
          application.student.availability,
          application.job.skills,
          application.job.course,
          application.job.availability
        );

        return prisma.application.update({
          where: { id: application.id },
          data: { score },
        });
      })
    );

    return updatedApplications;
  }

  async getRankedApplications(jobId: string) {
    return prisma.application.findMany({
      where: { jobId },
      include: { student: { select: publicStudentProfileSelect } },
      orderBy: { score: "desc" },
    });
  }
}
