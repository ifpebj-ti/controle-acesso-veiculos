import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { describeApiError } from "../../../services/api-errors";
import {
  searchInstitutionalFleetReport,
  searchVehicleMovementReport,
} from "../services/administrativeReportsService";
import type {
  AdministrativeReportFilters,
  AdministrativeReportPage,
  VehicleMovementReportItem,
} from "../types";
import { useAdministrativeReport } from "./useAdministrativeReport";

vi.mock("../services/administrativeReportsService", () => ({
  searchInstitutionalFleetReport: vi.fn(),
  searchVehicleMovementReport: vi.fn(),
}));
vi.mock("../../../services/api-errors", () => ({ describeApiError: vi.fn() }));

const emptyPage = {
  items: [],
  from: "2026-10-01",
  to: "2026-10-15",
  page: 1,
  pageSize: 25,
  totalCount: 0,
  totalPages: 0,
  timeZoneId: "America/Recife",
} satisfies AdministrativeReportPage<VehicleMovementReportItem>;
const period = { from: "2026-10-01", to: "2026-10-15" };

describe("useAdministrativeReport filter ownership", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(searchVehicleMovementReport).mockResolvedValue(emptyPage);
    vi.mocked(searchInstitutionalFleetReport).mockResolvedValue(emptyPage);
    vi.mocked(describeApiError).mockReturnValue({
      kind: "network",
      message: "Consulta indisponível.",
    });
  });

  async function setup() {
    const hook = renderHook(() => useAdministrativeReport());
    await waitFor(() => expect(hook.result.current.status).toBe("ready"));
    function edit(fields: Partial<AdministrativeReportFilters>) {
      act(() =>
        hook.result.current.setDraft({
          ...hook.result.current.draft,
          ...fields,
        }),
      );
    }
    async function apply() {
      act(() => {
        expect(hook.result.current.applyFilters()).toBe(true);
      });
      await waitFor(() => expect(hook.result.current.status).toBe("ready"));
    }
    async function change(kind: "movements" | "fleet") {
      act(() => hook.result.current.changeKind(kind));
      await waitFor(() => expect(hook.result.current.status).toBe("ready"));
    }
    return { ...hook, edit, apply, change };
  }

  it("shares only the applied period and restores each report's own filters", async () => {
    const hook = await setup();
    const movements = {
      plate: "ABC",
      driverName: "Pessoa Movimento Fictícia",
      categoryName: "Aluno",
      status: "Aberto",
    };
    const fleet = {
      plate: "XYZ",
      driverName: "Pessoa Frota Fictícia",
      vehicleIdentification: "INTERNO",
      status: "Concluido",
    };
    hook.edit({ ...period, ...movements });
    await hook.apply();
    await hook.change("fleet");
    expect(searchInstitutionalFleetReport).toHaveBeenLastCalledWith(
      expect.objectContaining({
        ...period,
        plate: "",
        driverName: "",
        categoryName: "",
        vehicleIdentification: "",
        status: "",
        page: 1,
      }),
    );
    hook.edit(fleet);
    await hook.apply();
    await hook.change("movements");
    expect(hook.result.current.draft).toMatchObject({
      ...period,
      ...movements,
      vehicleIdentification: "",
    });
    expect(searchVehicleMovementReport).toHaveBeenLastCalledWith(
      expect.objectContaining(movements),
    );
    await hook.change("fleet");
    expect(hook.result.current.draft).toMatchObject({
      ...period,
      ...fleet,
      categoryName: "",
    });
    expect(searchInstitutionalFleetReport).toHaveBeenLastCalledWith(
      expect.objectContaining(fleet),
    );
  });

  it("keeps unapplied text and dates distinct from the query when switching or paging", async () => {
    const hook = await setup();
    hook.edit({ ...period, driverName: "Consulta aplicada" });
    await hook.apply();
    const calls = vi.mocked(searchVehicleMovementReport).mock.calls.length;
    hook.edit({ from: "2026-10-10", driverName: "Rascunho não aplicado" });
    expect(searchVehicleMovementReport).toHaveBeenCalledTimes(calls);
    await hook.change("fleet");
    expect(hook.result.current.draft.from).toBe("2026-10-10");
    expect(hook.result.current.applied.from).toBe(period.from);
    expect(searchInstitutionalFleetReport).toHaveBeenLastCalledWith(
      expect.objectContaining({ ...period, driverName: "" }),
    );
    await hook.change("movements");
    expect(hook.result.current.draft.driverName).toBe("Rascunho não aplicado");
    act(() => hook.result.current.goToPage(2));
    await waitFor(() => expect(hook.result.current.status).toBe("ready"));
    expect(searchVehicleMovementReport).toHaveBeenLastCalledWith(
      expect.objectContaining({
        ...period,
        driverName: "Consulta aplicada",
        page: 2,
      }),
    );
    await hook.apply();
    expect(hook.result.current.applied).toMatchObject({
      from: "2026-10-10",
      driverName: "Rascunho não aplicado",
      page: 1,
    });
    await hook.change("fleet");
    expect(searchInstitutionalFleetReport).toHaveBeenLastCalledWith(
      expect.objectContaining({ from: "2026-10-10", driverName: "", page: 1 }),
    );
  });

  it("clears only the active report's specific filters and restores the shared default period", async () => {
    const hook = await setup();
    const defaultPeriod = {
      from: hook.result.current.draft.from,
      to: hook.result.current.draft.to,
    };
    hook.edit({
      ...period,
      plate: "MOV",
      driverName: "Pessoa Movimento",
      categoryName: "Aluno",
      status: "Pendente",
    });
    await hook.apply();
    await hook.change("fleet");
    hook.edit({
      plate: "FRO",
      driverName: "Pessoa Frota",
      vehicleIdentification: "INTERNO",
      status: "EmUso",
    });
    await hook.apply();
    act(() => hook.result.current.clearFilters());
    await waitFor(() => expect(hook.result.current.status).toBe("ready"));
    expect(hook.result.current.draft).toMatchObject({
      ...defaultPeriod,
      plate: "",
      driverName: "",
      vehicleIdentification: "",
      status: "",
      page: 1,
    });
    await hook.change("movements");
    expect(searchVehicleMovementReport).toHaveBeenLastCalledWith(
      expect.objectContaining({
        ...defaultPeriod,
        plate: "MOV",
        driverName: "Pessoa Movimento",
        categoryName: "Aluno",
        status: "Pendente",
        page: 1,
      }),
    );
  });

  it("does not apply an invalid shared interval or lose it while changing report", async () => {
    const hook = await setup();
    const applied = hook.result.current.applied;
    hook.edit({ from: "2026-01-01", to: "2026-02-01", driverName: "Rascunho" });
    act(() => expect(hook.result.current.applyFilters()).toBe(false));
    expect(hook.result.current.validationMessage).toContain("31 dias");
    expect(searchVehicleMovementReport).toHaveBeenCalledTimes(1);
    await hook.change("fleet");
    expect(hook.result.current.draft).toMatchObject({
      from: "2026-01-01",
      to: "2026-02-01",
      driverName: "",
    });
    expect(hook.result.current.applied).toMatchObject({
      from: applied.from,
      to: applied.to,
    });
    await hook.change("movements");
    expect(hook.result.current.draft.driverName).toBe("Rascunho");
  });

  it("preserves active filters after failure and retries only the applied query", async () => {
    const hook = await setup();
    vi.mocked(searchVehicleMovementReport).mockRejectedValueOnce(
      new Error("controlled read failure"),
    );
    hook.edit({ ...period, plate: "ABC", driverName: "Consulta aplicada" });
    act(() => {
      hook.result.current.applyFilters();
    });
    await waitFor(() => expect(hook.result.current.status).toBe("error"));
    expect(hook.result.current.draft).toMatchObject({
      ...period,
      plate: "ABC",
      driverName: "Consulta aplicada",
    });
    expect(searchVehicleMovementReport).toHaveBeenCalledTimes(2);
    hook.edit({ driverName: "Rascunho posterior" });
    act(() => hook.result.current.retry());
    await waitFor(() => expect(hook.result.current.status).toBe("ready"));
    expect(searchVehicleMovementReport).toHaveBeenLastCalledWith(
      expect.objectContaining({
        ...period,
        plate: "ABC",
        driverName: "Consulta aplicada",
      }),
    );
    expect(hook.result.current.draft.driverName).toBe("Rascunho posterior");
    expect(searchVehicleMovementReport).toHaveBeenCalledTimes(3);
  });

  it.each(["success", "failure"])(
    "ignores a late %s from the previous report",
    async (outcome) => {
      let resolveOld!: (value: typeof emptyPage) => void;
      let rejectOld!: (reason: Error) => void;
      vi.mocked(searchVehicleMovementReport).mockReturnValueOnce(
        new Promise((resolve, reject) => {
          resolveOld = resolve;
          rejectOld = reject;
        }),
      );
      const fleetPage = { ...emptyPage, from: "2026-09-01" };
      vi.mocked(searchInstitutionalFleetReport).mockResolvedValueOnce(
        fleetPage,
      );
      const hook = renderHook(() => useAdministrativeReport());
      act(() => hook.result.current.changeKind("fleet"));
      await waitFor(() => expect(hook.result.current.status).toBe("ready"));
      await act(async () => {
        if (outcome === "success") resolveOld(emptyPage);
        else rejectOld(new Error("obsolete read failure"));
      });
      expect(hook.result.current.kind).toBe("fleet");
      expect(hook.result.current.page).toBe(fleetPage);
      expect(hook.result.current.status).toBe("ready");
      expect(hook.result.current.errorMessage).toBeNull();
    },
  );
});
