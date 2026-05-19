import { FastifyRequest, FastifyReply } from "fastify";
import { UserService } from "./user.service";
import { CreateUserDTO, LoginDTO, UpdatePasswordDTO, UpdateUserDTO } from "./user.dto";

const userService = new UserService();

export class UserController {
  async register(request: FastifyRequest, reply: FastifyReply) {
    const { email, password, role } = request.body as CreateUserDTO;

    const user = await userService.create({ email, password, role });

    return reply.status(201).send(user);
  }

  async login(request: FastifyRequest, reply: FastifyReply) {
    const { email, password } = request.body as LoginDTO;

    const user = await userService.login({ email, password });

    const token = await reply.jwtSign({
      id: user.id,
      role: user.role,
    });

    return reply.status(200).send({ token, user });
  }

  async getMe(request: FastifyRequest, reply: FastifyReply) {
    const user = await userService.getMe(request.user.id);

    return reply.send(user);
  }

  async updateMe(request: FastifyRequest, reply: FastifyReply) {
    const data = request.body as UpdateUserDTO;
    const user = await userService.updateMe(request.user.id, data);

    return reply.send(user);
  }

  async updatePassword(request: FastifyRequest, reply: FastifyReply) {
    const data = request.body as UpdatePasswordDTO;

    await userService.updatePassword(request.user.id, data);

    return reply.status(204).send();
  }
}
