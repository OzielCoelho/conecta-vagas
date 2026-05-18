import { z } from "zod";
import { JobModel } from "../../generated/prisma";


export const createJobSchema = z.object({
  title: z.string().min(3, "O título da vaga deve ter pelo menos 3 caracteres"),
  description: z.string().min(10, "A descrição deve ter pelo menos 10 caracteres"),
  skills: z.array(z.string()).min(1, "Insira pelo menos uma habilidade necessária"),
  model: z.nativeEnum(JobModel, { errorMap: () => ({ message: "Modelo de vaga inválido" }) }),
  location: z.string().optional(),
  course: z.string().optional(),
  availability: z.string().optional(),
});


export type CreateJobDTO = z.infer<typeof createJobSchema>;


export const updateJobSchema = createJobSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export type UpdateJobDTO = z.infer<typeof updateJobSchema>;