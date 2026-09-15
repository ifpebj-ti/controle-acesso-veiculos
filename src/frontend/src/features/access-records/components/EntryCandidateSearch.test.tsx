import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { type FormEvent, useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { expectNoSeriousAccessibilityViolations } from "../../../test/accessibility";
import { searchAccessEntryCandidates } from "../services/accessRecordsService";
import type { AccessEntryCandidate } from "../types";
import { EntryCandidateSearch } from "./EntryCandidateSearch";

vi.mock("../services/accessRecordsService", async () => {
  const actual = await vi.importActual<
    typeof import("../services/accessRecordsService")
  >("../services/accessRecordsService");
  return { ...actual, searchAccessEntryCandidates: vi.fn() };
});

const candidate: AccessEntryCandidate = {
  brand: "Marca fictícia",
  color: "Prata",
  driverName: "Condutor recorrente fictício",
  model: "Modelo fictício",
  personId: 2,
  plate: "REC1A23",
  vehicleId: 3,
  vehicleType: "Automóvel",
};

function Harness() {
  const [selected, setSelected] = useState<AccessEntryCandidate | null>(null);
  return (
    <EntryCandidateSearch
      onClear={() => setSelected(null)}
      onSelect={setSelected}
      selectedCandidate={selected}
    />
  );
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, reject, resolve };
}

describe("EntryCandidateSearch", () => {
  beforeEach(() => vi.clearAllMocks());

  it("waits for three characters and announces an empty result", async () => {
    vi.mocked(searchAccessEntryCandidates).mockResolvedValue([]);
    const user = userEvent.setup();
    render(<Harness />);
    const search = screen.getByRole("combobox", {
      name: "Buscar por placa ou nome do condutor",
    });

    await user.type(search, "RE");
    expect(searchAccessEntryCandidates).not.toHaveBeenCalled();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Digite pelo menos 3 caracteres",
    );

    await user.type(search, "C");
    expect(
      (
        await screen.findAllByText(
          "Nenhum resultado encontrado. Continue preenchendo manualmente.",
        )
      ).some((element) => element.className.includes("mt-3")),
    ).toBe(true);
    expect(searchAccessEntryCandidates).toHaveBeenCalledTimes(1);
  });

  it("announces loading while the debounced request is pending", async () => {
    const request = deferred<AccessEntryCandidate[]>();
    vi.mocked(searchAccessEntryCandidates).mockReturnValue(request.promise);
    const user = userEvent.setup();
    render(<Harness />);

    await user.type(screen.getByRole("combobox"), "REC");

    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        "Buscando veículos e condutores",
      ),
    );
    request.resolve([]);
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        "Nenhum resultado encontrado",
      ),
    );
  });

  it("supports arrows, Enter and explicit clearing", async () => {
    vi.mocked(searchAccessEntryCandidates).mockResolvedValue([candidate]);
    const user = userEvent.setup();
    render(<Harness />);
    const search = screen.getByRole("combobox", {
      name: "Buscar por placa ou nome do condutor",
    });

    await user.type(search, "REC");
    await screen.findByRole("option", { name: /REC1A23/ });
    await user.keyboard("{ArrowDown}{Enter}");

    expect(
      screen.getByText(/A seleção não autoriza a entrada automaticamente/),
    ).toBeVisible();
    await user.click(
      screen.getByRole("button", { name: "Usar preenchimento manual" }),
    );
    expect(screen.queryByText(/Dados recuperados/)).not.toBeInTheDocument();
  });

  it("consumes Enter when no result is active", async () => {
    const request = deferred<AccessEntryCandidate[]>();
    vi.mocked(searchAccessEntryCandidates).mockReturnValue(request.promise);
    const onSubmit = vi.fn((event: FormEvent) => event.preventDefault());
    const user = userEvent.setup();
    render(
      <form onSubmit={onSubmit}>
        <Harness />
      </form>,
    );
    const search = screen.getByRole("combobox");

    await user.type(search, "REC");
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        "Buscando veículos e condutores",
      ),
    );
    await user.keyboard("{Enter}");
    expect(onSubmit).not.toHaveBeenCalled();

    request.resolve([candidate]);
    await screen.findByRole("option", { name: /REC1A23/ });
    await user.keyboard("{Enter}");
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.queryByText(/Dados recuperados/)).not.toBeInTheDocument();
  });

  it("closes results with Escape without trapping Tab", async () => {
    vi.mocked(searchAccessEntryCandidates).mockResolvedValue([candidate]);
    const user = userEvent.setup();
    render(<Harness />);
    const search = screen.getByRole("combobox");

    await user.type(search, "REC");
    await screen.findByRole("option", { name: /REC1A23/ });
    await user.keyboard("{Escape}");

    expect(search).toHaveAttribute("aria-expanded", "false");
    await user.tab();
    expect(search).not.toHaveFocus();
  });

  it("keeps manual entry available when the search fails", async () => {
    vi.mocked(searchAccessEntryCandidates).mockRejectedValue(
      new Error("network"),
    );
    const user = userEvent.setup();
    render(<Harness />);

    await user.type(screen.getByRole("combobox"), "REC");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Continue preenchendo manualmente",
    );
  });

  it("aborts an obsolete request and ignores its late response", async () => {
    const first = deferred<AccessEntryCandidate[]>();
    vi.mocked(searchAccessEntryCandidates)
      .mockReturnValueOnce(first.promise)
      .mockResolvedValueOnce([]);
    const user = userEvent.setup();
    render(<Harness />);
    const search = screen.getByRole("combobox");

    await user.type(search, "REC");
    await waitFor(() =>
      expect(searchAccessEntryCandidates).toHaveBeenCalledTimes(1),
    );
    const firstSignal = vi.mocked(searchAccessEntryCandidates).mock.calls[0][1];
    await user.clear(search);
    await user.type(search, "OUT");
    await waitFor(() =>
      expect(searchAccessEntryCandidates).toHaveBeenCalledTimes(2),
    );
    expect(firstSignal?.aborted).toBe(true);

    first.resolve([candidate]);
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        "Nenhum resultado encontrado",
      ),
    );
    expect(screen.queryByText("REC1A23")).not.toBeInTheDocument();
  });

  it("has no serious automated accessibility violations", async () => {
    vi.mocked(searchAccessEntryCandidates).mockResolvedValue([candidate]);
    const user = userEvent.setup();
    const { container } = render(<Harness />);

    await user.type(screen.getByRole("combobox"), "REC");
    await screen.findByRole("option", { name: /REC1A23/ });
    await expectNoSeriousAccessibilityViolations(container);
  });
});
