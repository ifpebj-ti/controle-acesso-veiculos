import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  useAuthenticatedSession,
  type ProfileName,
} from "../features/authentication";
import { searchCampusDrivers } from "../features/person-preregistration/services/campusDriversService";
import { CampusDriversPage } from "./CampusDriversPage";
import { MemoryRouter } from "react-router-dom";
vi.mock("../features/authentication", () => ({
  useAuthenticatedSession: vi.fn(),
}));
vi.mock("../components/ui/confirmationContext", () => ({
  useConfirmation: () => vi.fn(async () => false),
}));
vi.mock(
  "../features/person-preregistration/services/campusDriversService",
  async () => {
    const actual = await vi.importActual<
      typeof import("../features/person-preregistration/services/campusDriversService")
    >("../features/person-preregistration/services/campusDriversService");
    return { ...actual, searchCampusDrivers: vi.fn() };
  },
);
describe("CampusDriversPage route scope", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(searchCampusDrivers).mockResolvedValue({
      items: [],
      totalCount: 0,
      page: 1,
      pageSize: 25,
    });
  });
  it.each<ProfileName>(["Administrador", "SetorTransporte"])(
    "allows %s to consult the real registry service",
    async (profileName) => {
      vi.mocked(useAuthenticatedSession).mockReturnValue({
        user: { id: 1, profileName },
      } as ReturnType<typeof useAuthenticatedSession>);
      render(
        <MemoryRouter>
          <CampusDriversPage />
        </MemoryRouter>,
      );
      expect(
        await screen.findByText("Nenhuma pessoa encontrada"),
      ).toBeInTheDocument();
      expect(searchCampusDrivers).toHaveBeenCalledOnce();
    },
  );
  it.each<ProfileName>(["Porteiro", "Vigilante"])(
    "does not query the registry for %s",
    (profileName) => {
      vi.mocked(useAuthenticatedSession).mockReturnValue({
        user: { id: 1, profileName },
      } as ReturnType<typeof useAuthenticatedSession>);
      render(
        <MemoryRouter>
          <CampusDriversPage />
        </MemoryRouter>,
      );
      expect(
        screen.getByRole("heading", { name: "Acesso negado" }),
      ).toBeInTheDocument();
      expect(searchCampusDrivers).not.toHaveBeenCalled();
    },
  );
});
