import type { UserAccount } from "../types";

// Supplied by the validated canonical account DTO incorporated through #530.
// This projection does not replace or relax that DTO's schema.
export type ReactivationAccount = Pick<
  UserAccount,
  "id" | "name" | "active"
> & {
  authenticationMethod: "Local" | "Google";
};

// The administrative adapter must read the existing account catalog. There is
// no assumed GET /users/{id}; absence is not proof that a mutation rolled back.
export type ReadReactivationAccount = (
  account: ReactivationAccount,
) => Promise<ReactivationAccount | null>;

export type ReactivationCloseOutcome =
  "cancelled" | "confirmed" | "uncertain" | "refresh-required";
