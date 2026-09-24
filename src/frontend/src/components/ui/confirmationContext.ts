import { createContext, useContext } from "react";

export type ConfirmationTone = "danger" | "positive";

export interface ConfirmationOptions {
  confirmLabel: string;
  description: string;
  eyebrow?: string;
  title: string;
  tone?: ConfirmationTone;
}

export type RequestConfirmation = (
  options: ConfirmationOptions,
) => Promise<boolean>;

export const ConfirmationContext = createContext<RequestConfirmation | null>(
  null,
);

export function useConfirmation() {
  const context = useContext(ConfirmationContext);
  if (!context) {
    throw new Error(
      "useConfirmation must be used within ConfirmationProvider.",
    );
  }
  return context;
}
