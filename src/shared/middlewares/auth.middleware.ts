import { FastifyRequest, FastifyReply } from "fastify";
import { AppError } from "../errors/app.error";
import { Role } from "../../generated/prisma";

export function authenticate(roles?: Role[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
      if (typeof request.user.id !== "string" || !request.user.id || !Object.values(Role).includes(request.user.role)) {
        return reply.status(401).send({ message: "Token inválido ou ausente." });
      }

      if (roles && !roles.includes(request.user.role as Role)) {
        throw new AppError("Acesso negado.", 403);
      }
    } catch (err) {
      if (err instanceof AppError) {
        return reply.status(err.statusCode).send({ message: err.message });
      }
      return reply.status(401).send({ message: "Token inválido ou ausente." });
    }
  };
}