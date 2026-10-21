import { FastifyInstance } from "fastify";
import { StudentController } from "./student.controller";
import { authenticate } from "../../shared/middlewares/auth.middleware";

const studentController = new StudentController();

const studentBodyProperties = {
  name: { type: "string", minLength: 3, maxLength: 160 },
  course: { type: "string", minLength: 2, maxLength: 160 },
  skills: {
    type: "array",
    minItems: 1,
    items: { type: "string", minLength: 1, maxLength: 80 },
  },
  availability: {
    type: "array",
    minItems: 1,
    items: { type: "string", enum: ["MANHA", "TARDE", "NOITE"] },
  },
  headline: { type: "string", maxLength: 160 },
  summary: { type: "string", maxLength: 1200 },
  city: { type: "string", maxLength: 120 },
  state: { type: "string", maxLength: 120 },
  semester: { type: "string", maxLength: 80 },
  university: { type: "string", maxLength: 160 },
  cr: { type: "string", maxLength: 20 },
  portfolio: { type: "string", maxLength: 500 },
  photoUrl: { type: "string", maxLength: 3000000 },
  isVisible: { type: "boolean" },
} as const;

const createStudentSchema = {
  body: {
    type: "object",
    required: ["name", "course", "skills", "availability"],
    additionalProperties: false,
    properties: studentBodyProperties,
  },
} as const;

const updateStudentSchema = {
  body: {
    type: "object",
    additionalProperties: false,
    properties: studentBodyProperties,
  },
} as const;

const confirmResumeSchema = {
  body: {
    type: "object",
    required: ["name", "course", "skills", "availability"],
    additionalProperties: false,
    properties: {
      name: studentBodyProperties.name,
      course: studentBodyProperties.course,
      skills: studentBodyProperties.skills,
      availability: studentBodyProperties.availability,
      headline: studentBodyProperties.headline,
      summary: studentBodyProperties.summary,
      city: studentBodyProperties.city,
      state: studentBodyProperties.state,
      semester: studentBodyProperties.semester,
      university: studentBodyProperties.university,
      cr: studentBodyProperties.cr,
      portfolio: studentBodyProperties.portfolio,
    },
  },
} as const;

export async function studentRoutes(app: FastifyInstance) {
  app.post("/", { preHandler: authenticate(["STUDENT"]), schema: createStudentSchema }, studentController.create.bind(studentController));
  app.get("/me", { preHandler: authenticate(["STUDENT"]) }, studentController.getMyProfile.bind(studentController));
  app.post("/resume/import", { preHandler: authenticate(["STUDENT"]) }, studentController.importResume.bind(studentController));
  app.put("/resume/confirm", { preHandler: authenticate(["STUDENT"]), schema: confirmResumeSchema }, studentController.confirmResume.bind(studentController));
  app.get("/resume.pdf", { preHandler: authenticate(["STUDENT"]) }, studentController.downloadResume.bind(studentController));
  app.get("/", { preHandler: authenticate(["COORDINATOR", "COMPANY"]) }, studentController.getAll.bind(studentController));
  app.put("/:id", { preHandler: authenticate(["STUDENT", "COORDINATOR"]), schema: updateStudentSchema }, studentController.update.bind(studentController));
}
