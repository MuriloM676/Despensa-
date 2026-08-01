import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("E-mail inválido").max(254),
  password: z.string().min(1, "Informe a senha").max(128),
});

export const registerSchema = z.object({
  name: z.string().trim().min(1, "Informe seu nome").max(100),
  email: z.string().trim().email("E-mail inválido").max(254),
  password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres").max(128),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
