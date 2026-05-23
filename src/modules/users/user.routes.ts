import { FastifyInstance } from "fastify";
import { authenticate } from "../../shared/middlewares/auth.middleware";
import { UserController } from "./user.controller";

const userController = new UserController();

const registerSchema = {
  body: {
    type: "object",
    required: ["email", "password", "role"],
    additionalProperties: false,
    properties: {
      email: { type: "string", format: "email", minLength: 3, maxLength: 255 },
      password: { type: "string", minLength: 6, maxLength: 72 },
      role: { type: "string", enum: ["STUDENT", "COMPANY"] },
      firstName: { type: "string", minLength: 1, maxLength: 80 },
      lastName: { type: "string", minLength: 1, maxLength: 80 },
    },
    allOf: [
      {
        if: {
          properties: {
            role: { const: "STUDENT" },
          },
        },
        then: {
          required: ["firstName", "lastName"],
        },
      },
    ],
  },
} as const;

const loginSchema = {
  body: {
    type: "object",
    required: ["email", "password"],
    additionalProperties: false,
    properties: {
      email: { type: "string", format: "email", minLength: 3, maxLength: 255 },
      password: { type: "string", minLength: 1, maxLength: 72 },
    },
  },
} as const;

const updateMeSchema = {
  body: {
    type: "object",
    required: ["email"],
    additionalProperties: false,
    properties: {
      email: { type: "string", format: "email", minLength: 3, maxLength: 255 },
    },
  },
} as const;

const updatePasswordSchema = {
  body: {
    type: "object",
    required: ["currentPassword", "newPassword"],
    additionalProperties: false,
    properties: {
      currentPassword: { type: "string", minLength: 1, maxLength: 72 },
      newPassword: { type: "string", minLength: 6, maxLength: 72 },
    },
  },
} as const;

export async function userRoutes(app: FastifyInstance) {
  app.post("/register", { schema: registerSchema }, userController.register.bind(userController));
  app.post("/login", { schema: loginSchema }, userController.login.bind(userController));
  app.get("/me", { preHandler: authenticate() }, userController.getMe.bind(userController));
  app.patch("/me", { preHandler: authenticate(), schema: updateMeSchema }, userController.updateMe.bind(userController));
  app.patch("/password", { preHandler: authenticate(), schema: updatePasswordSchema }, userController.updatePassword.bind(userController));
}
