import { z } from "zod";

import { profileNames } from "../../authentication/types";

const validInstant = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)));

export const userAccountSchema = z
  .object({
    active: z.boolean(),
    createdAtUtc: validInstant,
    email: z.email().max(254),
    id: z.number().int().positive(),
    lockedUntilUtc: validInstant.nullable(),
    name: z.string().trim().min(1).max(200),
    profileName: z.enum(profileNames),
    requiresPasswordChange: z.boolean(),
    temporaryCredentialExpiresAtUtc: validInstant.nullable(),
    updatedAtUtc: validInstant.nullable(),
  })
  .strict();

export const userAccountPageSchema = z
  .object({
    items: z.array(userAccountSchema),
    page: z.number().int().positive(),
    pageSize: z.number().int().positive().max(100),
    totalCount: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  })
  .strict();

export const createdUserAccountSchema = z
  .object({
    email: z.email().max(254),
    id: z.number().int().positive(),
    profileName: z.enum(profileNames),
    temporaryCredential: z.string().min(1),
    temporaryCredentialExpiresAtUtc: validInstant,
  })
  .strict();

export const temporaryCredentialSchema = z
  .object({
    temporaryCredential: z.string().min(1),
    temporaryCredentialExpiresAtUtc: validInstant,
  })
  .strict();

export const createUserAccountFormSchema = z.object({
  email: z
    .email("Informe um e-mail válido.")
    .max(254, "O e-mail é muito longo."),
  name: z
    .string()
    .trim()
    .min(1, "Informe o nome do funcionário.")
    .max(200, "O nome deve possuir até 200 caracteres."),
  profileName: z.enum(profileNames),
});

export type CreateUserAccountFormValues = z.infer<
  typeof createUserAccountFormSchema
>;
