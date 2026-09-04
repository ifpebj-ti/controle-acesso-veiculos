import { beforeEach, describe, expect, it, vi } from "vitest";

import { api } from "../../../services/api";
import {
  createInstitutionalVehicle,
  deactivateInstitutionalVehicle,
  listInstitutionalVehicles,
  updateInstitutionalVehicle,
} from "./institutionalVehiclesService";

vi.mock("../../../services/api", () => ({
  api: { delete: vi.fn(), get: vi.fn(), post: vi.fn(), put: vi.fn() },
}));

const vehicle = {
  brand: "Marca fictícia",
  color: "Branca",
  createdAtUtc: "2026-09-03T12:00:00Z",
  id: 4,
  identification: "VEICULO 04",
  model: "Modelo fictício",
  plate: "DEM1A23",
  vehicleType: "Automóvel",
  year: 2024,
};

const input = {
  brand: vehicle.brand,
  color: vehicle.color,
  identification: vehicle.identification,
  model: vehicle.model,
  plate: vehicle.plate,
  vehicleType: vehicle.vehicleType,
  year: vehicle.year,
};

describe("institutionalVehiclesService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("uses the documented catalog endpoints", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [vehicle] });
    vi.mocked(api.post).mockResolvedValue({ data: vehicle });
    vi.mocked(api.put).mockResolvedValue({ data: vehicle });
    vi.mocked(api.delete).mockResolvedValue({ data: undefined });

    await listInstitutionalVehicles();
    await createInstitutionalVehicle(input);
    await updateInstitutionalVehicle(4, input);
    await deactivateInstitutionalVehicle(4);

    expect(api.get).toHaveBeenCalledWith("/institutional-vehicles");
    expect(api.post).toHaveBeenCalledWith("/institutional-vehicles", input);
    expect(api.put).toHaveBeenCalledWith("/institutional-vehicles/4", input);
    expect(api.delete).toHaveBeenCalledWith("/institutional-vehicles/4");
  });

  it("rejects invalid list and mutation responses", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [{ id: "invalid" }] });
    vi.mocked(api.post).mockResolvedValue({ data: { id: 4 } });

    await expect(listInstitutionalVehicles()).rejects.toMatchObject({
      name: "InstitutionalVehiclesContractError",
    });
    await expect(createInstitutionalVehicle(input)).rejects.toMatchObject({
      name: "InstitutionalVehiclesContractError",
    });
  });
});
