import { beforeEach, describe, expect, it, vi } from "vitest";

import { api } from "../../../services/api";
import {
  authorizeInstitutionalDriver,
  deactivateInstitutionalDriver,
  listInstitutionalDrivers,
} from "./institutionalDriversService";

vi.mock("../../../services/api", () => ({
  api: { delete: vi.fn(), get: vi.fn(), post: vi.fn() },
}));

const driver = {
  authorizedAtUtc: "2026-09-04T12:00:00Z",
  authorizedById: 1,
  id: 4,
  name: "Motorista Fictício",
  personId: 8,
  updatedAtUtc: null,
  updatedById: null,
};

const input = {
  documentNumber: "DOC-FICTICIO",
  documentType: "ID",
  name: driver.name,
};

describe("institutionalDriversService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("uses the documented active driver endpoints", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [driver] });
    vi.mocked(api.post).mockResolvedValue({ data: driver });
    vi.mocked(api.delete).mockResolvedValue({ data: undefined });

    await listInstitutionalDrivers();
    await authorizeInstitutionalDriver(input);
    await deactivateInstitutionalDriver(4);

    expect(api.get).toHaveBeenCalledWith("/institutional-drivers");
    expect(api.post).toHaveBeenCalledWith("/institutional-drivers", input);
    expect(api.delete).toHaveBeenCalledWith("/institutional-drivers/4");
  });

  it("rejects invalid list and mutation responses", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [{ id: "invalid" }] });
    vi.mocked(api.post).mockResolvedValue({ data: { id: 4 } });

    await expect(listInstitutionalDrivers()).rejects.toMatchObject({
      name: "InstitutionalDriversContractError",
    });
    await expect(authorizeInstitutionalDriver(input)).rejects.toMatchObject({
      name: "InstitutionalDriversContractError",
    });
  });
});
