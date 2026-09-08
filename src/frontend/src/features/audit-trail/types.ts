export const auditActions = [
  "Inclusao",
  "Alteracao",
  "Exclusao",
  "Consulta",
  "Login",
  "Logout",
] as const;

export type AuditAction = (typeof auditActions)[number];

export type JsonValue =
  boolean | number | string | null | JsonValue[] | { [key: string]: JsonValue };

export interface AuditEntry {
  id: number;
  occurredAtUtc: string;
  action: AuditAction;
  entity: string;
  recordId: number;
  actorUserId: number | null;
  actorType: "Human" | "System";
  details: string | null;
  previousState: JsonValue | null;
  newState: JsonValue | null;
}

export interface AuditTrailPage {
  items: AuditEntry[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface AuditTrailFilters {
  fromUtc: string;
  toUtc: string;
  action: "" | AuditAction;
  entity: string;
  recordId?: number;
  actorUserId?: number;
  systemOnly?: boolean;
  page: number;
  pageSize: number;
}

export type AuditTrailFilterErrors = Partial<
  Record<
    | "action"
    | "actor"
    | "actorUserId"
    | "entity"
    | "page"
    | "pageSize"
    | "period"
    | "recordId",
    string
  >
>;
