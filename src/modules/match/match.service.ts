import { prisma } from "../../shared/prisma/prisma.client";

export class MatchService {
  calculateScore(
    studentSkills: string[],
    studentCourse: string,
    studentAvailability: string,
    jobSkills: string[],
    jobCourse: string | null,
    jobAvailability: string | null
  ): number {
    let score = 0;

    const matchedSkills = studentSkills.filter((skill) =>
      jobSkills.map((s) => s.toLowerCase()).includes(skill.toLowerCase())
    );
    score += (matchedSkills.length / jobSkills.length) * 60;

    if (jobCourse && studentCourse.toLowerCase() === jobCourse.toLowerCase()) {
      score += 25;
    }

    if (jobAvailability && studentAvailability.toLowerCase() === jobAvailability.toLowerCase()) {
      score += 15;
    }

    return Math.round(score);
  }

  buildJustification(
    studentSkills: string[],
    studentCourse: string,
    studentAvailability: string,
    jobSkills: string[],
    jobCourse: string | null,
    jobAvailability: string | null
  ): string[] {
    const matchedSkills = studentSkills.filter((skill) =>
      jobSkills.map((item) => item.toLowerCase()).includes(skill.toLowerCase())
    );

    const reasons: string[] = [];

    if (matchedSkills.length > 0) {
      reasons.push(`${matchedSkills.length} skill(s) em comum`);
    }

    if (jobCourse && studentCourse.toLowerCase() === jobCourse.toLowerCase()) {
      reasons.push("curso alinhado");
    }

    if (jobAvailability && studentAvailability.toLowerCase() === jobAvailability.toLowerCase()) {
      reasons.push("disponibilidade compatível");
    }

    return reasons;
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
      include: { student: true },
      orderBy: { score: "desc" },
    });
  }
  
}