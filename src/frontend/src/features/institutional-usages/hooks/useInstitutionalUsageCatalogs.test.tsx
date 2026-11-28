import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { listInstitutionalDrivers } from "../../institutional-drivers";
import { listInstitutionalVehicles } from "../../institutional-vehicles";
import { describeApiError } from "../../../services/api-errors";
import { useInstitutionalUsageCatalogs } from "./useInstitutionalUsageCatalogs";

vi.mock("../../institutional-drivers", () => ({
  listInstitutionalDrivers: vi.fn(),
}));

vi.mock("../../institutional-vehicles", () => ({
  listInstitutionalVehicles: vi.fn(),
}));

vi.mock("../../../services/api-errors", () => ({
  describeApiError: vi.fn(),
}));

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, reject, resolve };
}

function CatalogHarness() {
  const catalogs = useInstitutionalUsageCatalogs();

  return (
    <div>
      <p data-testid="status">{catalogs.status}</p>
      <p data-testid="vehicles">{catalogs.vehicles.length}</p>
      <p data-testid="drivers">{catalogs.drivers.length}</p>
      {catalogs.errorMessage ? (
        <p role="alert">{catalogs.errorMessage}</p>
      ) : null}
      <button onClick={() => void catalogs.load()} type="button">
        Recarregar
      </button>
    </div>
  );
}

beforeEach(() => {
  vi.mocked(listInstitutionalVehicles).mockReset();
  vi.mocked(listInstitutionalDrivers).mockReset();
  vi.mocked(describeApiError).mockReset();
});

describe("useInstitutionalUsageCatalogs", () => {
  it("loads both catalogs and exposes the ready state", async () => {
    vi.mocked(listInstitutionalVehicles).mockResolvedValue([]);
    vi.mocked(listInstitutionalDrivers).mockResolvedValue([]);

    render(<CatalogHarness />);

    expect(
      await screen.findByText("ready", { selector: "[data-testid=status]" }),
    ).toBeVisible();
    expect(screen.getByTestId("vehicles")).toHaveTextContent("0");
    expect(screen.getByTestId("drivers")).toHaveTextContent("0");
  });

  it.each([
    ["denied", "access-denied"],
    ["error", "unexpected"],
  ] as const)("maps a failed initial load to %s", async (status, kind) => {
    const failure = new Error("catalog failure");
    vi.mocked(listInstitutionalVehicles).mockRejectedValue(failure);
    vi.mocked(listInstitutionalDrivers).mockResolvedValue([]);
    vi.mocked(describeApiError).mockReturnValue({
      kind,
      message: "Não foi possível carregar os catálogos.",
    });

    render(<CatalogHarness />);

    expect(await screen.findByTestId("status")).toHaveTextContent(status);
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Não foi possível carregar os catálogos.",
    );
    expect(describeApiError).toHaveBeenCalledWith(failure);
  });

  it("clears stale data and recovers when the operator retries", async () => {
    vi.mocked(listInstitutionalVehicles).mockResolvedValue([]);
    vi.mocked(listInstitutionalDrivers).mockResolvedValue([]);

    render(<CatalogHarness />);
    await screen.findByText("ready", { selector: "[data-testid=status]" });

    const nextVehicles = deferred<[]>();
    const nextDrivers = deferred<[]>();
    vi.mocked(listInstitutionalVehicles).mockReturnValue(nextVehicles.promise);
    vi.mocked(listInstitutionalDrivers).mockReturnValue(nextDrivers.promise);

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Recarregar" }));

    await waitFor(() =>
      expect(screen.getByTestId("status")).toHaveTextContent("loading"),
    );
    nextVehicles.resolve([]);
    nextDrivers.resolve([]);

    await waitFor(() =>
      expect(screen.getByTestId("status")).toHaveTextContent("ready"),
    );
  });

  it("ignores an obsolete initial response after a manual reload", async () => {
    const initialVehicles = deferred<[]>();
    const initialDrivers = deferred<[]>();
    vi.mocked(listInstitutionalVehicles)
      .mockReturnValueOnce(initialVehicles.promise)
      .mockResolvedValueOnce([]);
    vi.mocked(listInstitutionalDrivers)
      .mockReturnValueOnce(initialDrivers.promise)
      .mockResolvedValueOnce([]);

    render(<CatalogHarness />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Recarregar" }));
    await screen.findByText("ready", { selector: "[data-testid=status]" });

    initialVehicles.resolve([]);
    initialDrivers.resolve([]);

    await waitFor(() =>
      expect(screen.getByTestId("status")).toHaveTextContent("ready"),
    );
    expect(listInstitutionalVehicles).toHaveBeenCalledTimes(2);
    expect(listInstitutionalDrivers).toHaveBeenCalledTimes(2);
  });

  it("ignores a late failure after unmount", async () => {
    const vehicles = deferred<[]>();
    vi.mocked(listInstitutionalVehicles).mockReturnValue(vehicles.promise);
    vi.mocked(listInstitutionalDrivers).mockResolvedValue([]);

    const view = render(<CatalogHarness />);
    view.unmount();
    vehicles.reject(new Error("late failure"));

    await Promise.resolve();
    expect(describeApiError).not.toHaveBeenCalled();
  });
});
