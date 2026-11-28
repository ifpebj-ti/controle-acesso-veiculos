import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  useAuthenticatedSession,
  type ProfileName,
} from "../features/authentication";
import { searchAuditTrail } from "../features/audit-trail/services/auditTrailService";
import { api } from "../services/api";
import { AuditPage } from "./AuditPage";
vi.mock("../features/authentication", () => ({
  useAuthenticatedSession: vi.fn(),
}));
vi.mock("../features/audit-trail/services/auditTrailService", () => ({
  searchAuditTrail: vi.fn(),
}));
vi.mock("../services/api", () => ({ api: { get: vi.fn() } }));
describe("AuditPage business access", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(searchAuditTrail).mockResolvedValue({
      items: [],
      page: 1,
      pageSize: 25,
      totalCount: 0,
      totalPages: 0,
    });
  });
  it.each<ProfileName>(["Administrador", "SetorTransporte"])(
    "lets %s read audit history without loading account management",
    async (profileName) => {
      vi.mocked(useAuthenticatedSession).mockReturnValue({
        user: { id: 1, profileName },
      } as ReturnType<typeof useAuthenticatedSession>);
      render(
        <MemoryRouter>
          <AuditPage />
        </MemoryRouter>,
      );
      await waitFor(() => expect(searchAuditTrail).toHaveBeenCalledOnce());
      expect(
        screen.getByRole("heading", { name: "Trilha de auditoria", level: 1 }),
      ).toBeInTheDocument();
      expect(api.get).not.toHaveBeenCalled();
    },
  );
  it.each<ProfileName>(["Porteiro", "Vigilante"])(
    "does not start audit queries for %s",
    (profileName) => {
      vi.mocked(useAuthenticatedSession).mockReturnValue({
        user: { id: 1, profileName },
      } as ReturnType<typeof useAuthenticatedSession>);
      render(
        <MemoryRouter>
          <AuditPage />
        </MemoryRouter>,
      );
      expect(
        screen.getByRole("heading", { name: "Acesso negado" }),
      ).toBeInTheDocument();
      expect(searchAuditTrail).not.toHaveBeenCalled();
      expect(api.get).not.toHaveBeenCalled();
    },
  );
});
