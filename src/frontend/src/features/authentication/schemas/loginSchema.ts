import { z } from "zod";

import { profileNames } from "../types";

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Informe o e-mail institucional.")
    .max(254, "O e-mail deve possuir no máximo 254 caracteres.")
    .email("Informe um e-mail válido."),
  password: z
    .string()
    .min(1, "Informe a senha.")
    .max(1024, "A senha informada é muito longa."),
});

export const loginResponseSchema = z
  .object({
    accessToken: z.string().min(1),
    expiresAtUtc: z.string().datetime({ offset: true }),
    user: z
      .object({
        email: z.string().email(),
        id: z.number().int().positive(),
        profileName: z.enum(profileNames),
      })
      .strict(),
  })
  .strict();

export type LoginFormValues = z.infer<typeof loginSchema>;
