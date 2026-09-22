import { z } from "zod";

export const passwordChangeFormSchema = z
  .object({
    confirmNewPassword: z
      .string()
      .min(1, "Confirme a nova senha.")
      .max(128, "A confirmação deve possuir até 128 caracteres."),
    currentPassword: z.string().min(1, "Informe a senha atual."),
    newPassword: z
      .string()
      .min(12, "A nova senha deve possuir pelo menos 12 caracteres.")
      .max(128, "A nova senha deve possuir até 128 caracteres."),
  })
  .superRefine((values, context) => {
    if (values.newPassword === values.currentPassword) {
      context.addIssue({
        code: "custom",
        message: "A nova senha deve ser diferente da senha atual.",
        path: ["newPassword"],
      });
    }

    if (values.confirmNewPassword !== values.newPassword) {
      context.addIssue({
        code: "custom",
        message: "A confirmação deve ser igual à nova senha.",
        path: ["confirmNewPassword"],
      });
    }
  });

export type PasswordChangeFormValues = z.infer<typeof passwordChangeFormSchema>;
