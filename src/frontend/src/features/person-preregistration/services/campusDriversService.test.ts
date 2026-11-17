import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../../../services/api";
import {
  addCampusDriverVehicle,
  deactivateCampusDriver,
  registerCampusDriver,
  searchCampusDrivers,
  searchEntrySuggestions,
  CampusDriversContractError,
} from "./campusDriversService";
vi.mock("../../../services/api", () => ({
  api: { get: vi.fn(), post: vi.fn() },
}));
const person = {
  personId: 1,
  vehicleId: 2,
  name: "Pessoa Fictícia",
  affiliation: "Federal",
  plate: "ABC1D23",
  vehicleType: "Automóvel",
  active: true,
  verifiedAtUtc: "2026-11-12T12:00:00Z",
};
const input = {
  name: person.name,
  affiliation: "Federal" as const,
  birthDate: "1990-01-01",
  birthDateConfirmed: true,
  plate: person.plate,
  vehicleType: person.vehicleType,
  confirmPossibleDuplicate: false,
};
describe("campusDriversService real contract", () => {
  beforeEach(() => vi.resetAllMocks());
  it("uses only the published register/association/deactivation routes and disables mutation replay", async () => {
    vi.mocked(api.post)
      .mockResolvedValueOnce({ status: 201, data: person })
      .mockResolvedValueOnce({ status: 201, data: person })
      .mockResolvedValueOnce({ status: 204 });
    await expect(registerCampusDriver(input)).resolves.toEqual(person);
    await addCampusDriverVehicle(1, {
      plate: person.plate,
      vehicleType: person.vehicleType,
    });
    await deactivateCampusDriver(1);
    expect(api.post).toHaveBeenNthCalledWith(1, "/campus-drivers", input, {
      skipSessionRetry: true,
    });
    expect(api.post).toHaveBeenNthCalledWith(
      2,
      "/campus-drivers/1/vehicles",
      { plate: person.plate, vehicleType: person.vehicleType },
      { skipSessionRetry: true },
    );
    expect(api.post).toHaveBeenNthCalledWith(
      3,
      "/campus-drivers/1/deactivate",
      undefined,
      { skipSessionRetry: true },
    );
  });
  it("validates a paginated list without exposing birth dates or accepting undocumented fields", async () => {
    const page = { items: [person], totalCount: 1, page: 1, pageSize: 25 };
    vi.mocked(api.get).mockResolvedValue({ data: page });
    await expect(
      searchCampusDrivers({
        query: " ABC ",
        page: 1,
        pageSize: 25,
        includeInactive: false,
      }),
    ).resolves.toEqual(page);
    expect(api.get).toHaveBeenCalledWith("/campus-drivers", {
      params: { query: "ABC", page: 1, pageSize: 25, includeInactive: false },
      signal: undefined,
    });
    vi.mocked(api.get).mockResolvedValue({
      data: { ...page, items: [{ ...person, birthDate: "1990-01-01" }] },
    });
    await expect(
      searchCampusDrivers({
        query: "",
        page: 1,
        pageSize: 25,
        includeInactive: false,
      }),
    ).rejects.toBeInstanceOf(CampusDriversContractError);
  });
  it.each([200, 204])(
    "rejects a registration status outside the contract: %s",
    async (status) => {
      vi.mocked(api.post).mockResolvedValue({ status, data: person });
      await expect(registerCampusDriver(input)).rejects.toBeInstanceOf(
        CampusDriversContractError,
      );
      expect(api.post).toHaveBeenCalledOnce();
    },
  );
  it("propagates a lost/cancelled response once without retrying the mutation", async () => {
    for (const name of ["CanceledError", "AbortError"]) {
      const error = new Error("controlled transport");
      error.name = name;
      vi.mocked(api.post).mockRejectedValueOnce(error);
      await expect(registerCampusDriver(input)).rejects.toBe(error);
    }
    expect(api.post).toHaveBeenCalledTimes(2);
  });
  it("requests the new bounded suggestion contract and rejects missing daily expiry", async () => {
    const item = {
      personId: 1,
      vehicleId: 2,
      driverName: person.name,
      plate: person.plate,
      vehicleType: person.vehicleType,
      source: "SameDayVisit",
      affiliation: null,
      previousObjective: "Reunião",
      hasOpenAccess: false,
      expiresAtUtc: "2026-11-13T03:00:00Z",
    };
    vi.mocked(api.get).mockResolvedValue({ data: [item] });
    await expect(searchEntrySuggestions("ABC")).resolves.toEqual([item]);
    expect(api.get).toHaveBeenCalledWith("/access-records/entry-suggestions", {
      params: { query: "ABC" },
      signal: undefined,
    });
    vi.mocked(api.get).mockResolvedValue({
      data: [{ ...item, affiliation: "Aluno" }],
    });
    await expect(searchEntrySuggestions("ABC")).rejects.toBeInstanceOf(
      CampusDriversContractError,
    );
    vi.mocked(api.get).mockResolvedValue({
      data: [{ ...item, expiresAtUtc: null }],
    });
    await expect(searchEntrySuggestions("ABC")).rejects.toBeInstanceOf(
      CampusDriversContractError,
    );
  });
});
