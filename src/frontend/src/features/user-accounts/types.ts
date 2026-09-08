import type { ProfileName } from "../authentication";

export interface UserAccount {
  id: number;
  name: string;
  email: string;
  profileName: ProfileName;
  active: boolean;
  createdAtUtc: string;
  updatedAtUtc: string | null;
  lockedUntilUtc: string | null;
}

export interface UserAccountPage {
  items: UserAccount[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface UserAccountFilters {
  search: string;
  active?: boolean;
  page: number;
  pageSize: number;
}

export interface CreateUserAccountInput {
  name: string;
  email: string;
  password: string;
  profileName: ProfileName;
}

export interface CreatedUserAccount {
  id: number;
  email: string;
  profileName: ProfileName;
}

export type UserAccountServerErrors = Partial<
  Record<"email" | "name" | "password" | "profileName", string>
>;
