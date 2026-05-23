import { FastifyInstance } from "fastify";
import { CompanyController } from "./company.controller";
import { authenticate } from "../../shared/middlewares/auth.middleware";

const companyController = new CompanyController();

const companyBodyProperties = {
  name: { type: "string", minLength: 2, maxLength: 160 },
  about: { type: "string", maxLength: 1200 },
  logoUrl: { type: "string", maxLength: 3000000 },
  commercialPhone: { type: "string", maxLength: 40 },
  legalName: { type: "string", minLength: 2, maxLength: 160 },
  tradeName: { type: "string", minLength: 2, maxLength: 160 },
  cultureDescription: { type: "string", maxLength: 1200 },
  businessSector: { type: "string", maxLength: 120 },
} as const;

const createCompanySchema = {
  body: {
    type: "object",
    required: ["legalName", "tradeName"],
    additionalProperties: false,
    properties: companyBodyProperties,
  },
} as const;

const updateCompanySchema = {
  body: {
    type: "object",
    additionalProperties: false,
    properties: companyBodyProperties,
  },
} as const;

export async function companyRoutes(app: FastifyInstance) {
  app.post("/", { preHandler: authenticate(["COMPANY"]), schema: createCompanySchema }, companyController.create.bind(companyController));
  app.get("/me", { preHandler: authenticate(["COMPANY"]) }, companyController.getMyProfile.bind(companyController));
  app.put("/:id", { preHandler: authenticate(["COMPANY", "COORDINATOR"]), schema: updateCompanySchema }, companyController.update.bind(companyController));
}
