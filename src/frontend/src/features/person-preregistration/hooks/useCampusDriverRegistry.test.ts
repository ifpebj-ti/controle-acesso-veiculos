import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCampusDriverRegistry } from "./useCampusDriverRegistry";
import {
  addCampusDriverVehicle,
  CampusDriversContractError,
  deactivateCampusDriver,
  registerCampusDriver,
  searchCampusDrivers,
} from "../services/campusDriversService";
vi.mock("../services/campusDriversService", async () => {
  const actual = await vi.importActual<
    typeof import("../services/campusDriversService")
  >("../services/campusDriversService");
  return {
    ...actual,
    addCampusDriverVehicle: vi.fn(),
    deactivateCampusDriver: vi.fn(),
    registerCampusDriver: vi.fn(),
    searchCampusDrivers: vi.fn(),
  };
});
const person = {
  personId: 1,
  vehicleId: 2,
  name: "Pessoa Fictícia",
  affiliation: "Aluno" as const,
  plate: "ABC1D23",
  vehicleType: "Automóvel",
  active: true,
  verifiedAtUtc: "2026-11-12T12:00:00Z",
};
const page = { items: [person], totalCount: 1, page: 1, pageSize: 25 };
const input = {
  name: person.name,
  affiliation: "Aluno" as const,
  birthDate: "2000-01-01",
  birthDateConfirmed: true,
  plate: person.plate,
  vehicleType: person.vehicleType,
  confirmPossibleDuplicate: false,
};
const rejection = (status: number, errors = {}) => ({
  isAxiosError: true,
  response: { status, data: { errors } },
});
describe("useCampusDriverRegistry", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(searchCampusDrivers).mockResolvedValue(page);
    vi.mocked(registerCampusDriver).mockResolvedValue(person);
    vi.mocked(addCampusDriverVehicle).mockResolvedValue(person);
    vi.mocked(deactivateCampusDriver).mockResolvedValue();
  });
  it("offers the duplicate confirmation only after the specific 409 and requires a separate explicit attempt", async () => {
    vi.mocked(registerCampusDriver).mockRejectedValueOnce(
      rejection(409, { possibleDuplicate: ["Possível homônimo fictício."] }),
    );
    const { result } = renderHook(() => useCampusDriverRegistry("actor1"));
    expect(result.current.possibleDuplicate).toBe(false);
    await act(async () => {
      expect(await result.current.register(input)).toBe(false);
    });
    expect(result.current.possibleDuplicate).toBe(true);
    expect(registerCampusDriver).toHaveBeenCalledOnce();
    await act(async () => {
      expect(
        await result.current.register({
          ...input,
          confirmPossibleDuplicate: true,
        }),
      ).toBe(true);
    });
    expect(registerCampusDriver).toHaveBeenLastCalledWith({
      ...input,
      confirmPossibleDuplicate: true,
    });
    expect(registerCampusDriver).toHaveBeenCalledTimes(2);
  });
  it.each(["vehicle", "registration"])(
    "does not present a homonym override for another conflict: %s",
    async (field) => {
      vi.mocked(registerCampusDriver).mockRejectedValueOnce(
        rejection(409, { [field]: ["Conflito controlado"] }),
      );
      const { result } = renderHook(() => useCampusDriverRegistry("actor1"));
      await act(async () => {
        await result.current.register(input);
      });
      expect(result.current.possibleDuplicate).toBe(false);
    },
  );
  it.each(["CanceledError", "AbortError", "network", "contract", "server"])(
    "blocks a second mutation after an uncertain %s and reconciles only by reading",
    async (kind) => {
      const error =
        kind === "contract"
          ? new CampusDriversContractError()
          : kind === "network"
            ? { isAxiosError: true, code: "ERR_NETWORK" }
            : kind === "server"
              ? rejection(503)
              : Object.assign(new Error("controlled cancellation"), {
                  name: kind,
                });
      vi.mocked(registerCampusDriver).mockRejectedValueOnce(error);
      const { result } = renderHook(() => useCampusDriverRegistry("actor1"));
      await act(async () => {
        await result.current.register(input);
      });
      expect(result.current.uncertain).toBe(true);
      await act(async () => {
        await result.current.register(input);
      });
      expect(registerCampusDriver).toHaveBeenCalledOnce();
      vi.mocked(searchCampusDrivers).mockResolvedValue({
        ...page,
        items: [],
        totalCount: 0,
      });
      act(() => result.current.refresh());
      await waitFor(() => expect(result.current.status).toBe("ready"));
      expect(result.current.uncertain).toBe(true);
      await act(async () => {
        await result.current.register(input);
      });
      expect(registerCampusDriver).toHaveBeenCalledOnce();
    },
  );
  it.each([400, 401, 403, 404, 429])(
    "preserves the rejection semantics for HTTP %s without automatic resubmission",
    async (status) => {
      vi.mocked(registerCampusDriver).mockRejectedValueOnce(
        rejection(status, {
          birthDate: ["Idade mínima de 18 anos na data institucional."],
        }),
      );
      const { result } = renderHook(() => useCampusDriverRegistry("actor1"));
      await act(async () => {
        await result.current.register({ ...input, birthDate: "2009-01-01" });
      });
      expect(result.current.uncertain).toBe(false);
      expect(registerCampusDriver).toHaveBeenCalledOnce();
      expect(result.current.mutationError).toBeTruthy();
      if (status === 400)
        expect(result.current.fieldErrors.birthDate).toMatch(/18 anos/);
      if (status === 403) expect(result.current.status).toBe("denied");
    },
  );
  it("associates another vehicle to the existing person and deactivates through their own endpoints", async () => {
    const { result } = renderHook(() => useCampusDriverRegistry("actor1"));
    await act(async () => {
      await result.current.addVehicle(1, {
        plate: "DEF4G56",
        vehicleType: "Motocicleta",
      });
    });
    expect(addCampusDriverVehicle).toHaveBeenCalledWith(1, {
      plate: "DEF4G56",
      vehicleType: "Motocicleta",
    });
    expect(registerCampusDriver).not.toHaveBeenCalled();
    await act(async () => {
      await result.current.deactivate(1);
    });
    expect(deactivateCampusDriver).toHaveBeenCalledWith(1);
  });
  it("ignores stale reads and preserves applied query/page filters", async () => {
    let complete!: (value: typeof page) => void;
    vi.mocked(searchCampusDrivers).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          complete = resolve;
        }),
    );
    const { result } = renderHook(() => useCampusDriverRegistry("actor1"));
    act(() => result.current.search("DEF", true));
    await waitFor(() => expect(result.current.status).toBe("ready"));
    await act(async () => {
      complete({
        ...page,
        items: [{ ...person, name: "Stale fictitious person" }],
      });
    });
    expect(result.current.result?.items[0].name).toBe(person.name);
    expect(result.current.filters).toMatchObject({
      query: "DEF",
      includeInactive: true,
      page: 1,
    });
  });
  it("clamps a page after deactivation while keeping the applied search", async () => {
    vi.mocked(searchCampusDrivers).mockImplementation(async (filters) => ({
      ...page,
      page: filters.page,
      totalCount: filters.page === 1 ? 26 : 1,
    }));
    const { result } = renderHook(() => useCampusDriverRegistry("actor1"));
    act(() => result.current.search("ABC", true));
    await waitFor(() => expect(result.current.status).toBe("ready"));
    act(() => result.current.goToPage(2));
    await waitFor(() => expect(result.current.filters.page).toBe(1));
    expect(result.current.filters).toMatchObject({
      query: "ABC",
      includeInactive: true,
    });
  });
  it("does not apply an old actor's late mutation response to the new actor", async () => {
    let complete!: (value: typeof person) => void;
    vi.mocked(registerCampusDriver).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          complete = resolve;
        }),
    );
    const { result, rerender } = renderHook(
      ({ scope }) => useCampusDriverRegistry(scope),
      { initialProps: { scope: "actor1" } },
    );
    let attempt!: Promise<boolean>;
    act(() => {
      attempt = result.current.register(input);
    });
    rerender({ scope: "actor2" });
    await act(async () => {
      complete(person);
      await attempt;
    });
    expect(result.current.notice).toBeNull();
    expect(result.current.pending).toBe(false);
    expect(registerCampusDriver).toHaveBeenCalledOnce();
  });
});
