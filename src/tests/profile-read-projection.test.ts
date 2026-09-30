import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findStudents: vi.fn(),
  findApplications: vi.fn(),
  findJob: vi.fn(),
  findJobs: vi.fn(),
}));
vi.mock("../shared/prisma/prisma.client", () => ({
  prisma: {
    student: { findMany: mocks.findStudents },
    application: { findMany: mocks.findApplications },
    job: { findUnique: mocks.findJob, findMany: mocks.findJobs },
  },
}));
import { ApplicationRepository } from "../modules/applications/application.repository";
import { JobRepository } from "../modules/jobs/job.repository";
import { StudentRepository } from "../modules/students/student.repository";

const publicFields = {
  id: true,
  name: true,
  course: true,
  skills: true,
  availability: true,
  headline: true,
  summary: true,
  city: true,
  state: true,
  semester: true,
  university: true,
  portfolio: true,
  photoUrl: true,
};
const publicCompanyFields = { id: true, name: true, about: true };

beforeEach(() => {
  vi.resetAllMocks();
});

describe("Public student profile query projection", () => {
  it("returns only visible profiles and fields used by the candidate experience", async () => {
    await new StudentRepository().findAll();
    expect(mocks.findStudents).toHaveBeenCalledWith({
      where: { isVisible: true },
      select: publicFields,
      orderBy: { updatedAt: "desc" },
    });
  });

  it("uses the same safe profile projection for company application details", async () => {
    await new ApplicationRepository().findByJobId("job-1");
    expect(mocks.findApplications).toHaveBeenCalledWith({
      where: { jobId: "job-1" },
      include: { student: { select: publicFields } },
      orderBy: { score: "desc" },
    });
  });

  it("limits company data embedded in every job query", async () => {
    const repository = new JobRepository();
    await repository.findById("job-1");
    await repository.findByIdForNotification("job-2");
    await repository.findAll();
    await repository.findByCompanyId("company-1");

    expect(mocks.findJob).toHaveBeenNthCalledWith(1, {
      where: { id: "job-1" },
      include: { company: { select: publicCompanyFields } },
    });
    expect(mocks.findJob).toHaveBeenNthCalledWith(2, {
      where: { id: "job-2" },
      include: { company: { select: { ...publicCompanyFields, userId: true } } },
    });
    expect(mocks.findJobs).toHaveBeenNthCalledWith(1, {
      where: { isActive: true },
      include: { company: { select: publicCompanyFields } },
    });
    expect(mocks.findJobs).toHaveBeenNthCalledWith(2, {
      where: { companyId: "company-1" },
      include: { company: { select: publicCompanyFields } },
    });
  });
});