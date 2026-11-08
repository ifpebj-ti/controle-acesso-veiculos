import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CanceledError } from "axios";
import { type FormEvent, useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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

function Harness({ withPlate = false }: { withPlate?: boolean }) {
  const [selected, setSelected] = useState<AccessEntryCandidate | null>(null);
  return (
    <>
      <EntryCandidateSearch
        onClear={() => setSelected(null)}
        onSelect={setSelected}
        selectedCandidate={selected}
      />
      {withPlate && <input aria-label="Placa para conferência" id="plate" />}
    </>
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
  afterEach(() => vi.restoreAllMocks());

  async function selectWithDeferredFocus() {
    const frames: FrameRequestCallback[] = [];
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      frames.push(callback);
      return frames.length;
    });
    const nextFrame = () =>
      act(() => frames.splice(0).forEach((callback) => callback(0)));
    vi.mocked(searchAccessEntryCandidates).mockResolvedValue([candidate]);
    const user = userEvent.setup();
    render(<Harness withPlate />);
    const search = screen.getByRole("combobox");
    await user.type(search, "REC");
    await user.click(await screen.findByRole("option", { name: /REC1A23/ }));
    return { nextFrame, search, user };
  }

  it("moves focus to the plate after selection when interaction has not changed", async () => {
    const { nextFrame } = await selectWithDeferredFocus();
    nextFrame();
    nextFrame();
    expect(screen.getByLabelText("Placa para conferência")).toHaveFocus();
  });

  it("does not close a new search with the previous selection's deferred focus", async () => {
    const { nextFrame, search, user } = await selectWithDeferredFocus();
    const alternate = {
      ...candidate,
      plate: "ALT4B56",
      personId: 4,
      vehicleId: 5,
    };
    vi.mocked(searchAccessEntryCandidates).mockResolvedValue([alternate]);
    await user.type(search, "ALT");
    const option = await screen.findByRole("option", { name: /ALT4B56/ });
    nextFrame();
    nextFrame();
    expect(search).toHaveFocus();
    expect(option).toBeVisible();
    expect(search).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByText(`${candidate.plate} · ${candidate.driverName}`),
    ).toBeVisible();
    await user.click(option);
    expect(
      screen.getByText(`${alternate.plate} · ${alternate.driverName}`),
    ).toBeVisible();
    expect(searchAccessEntryCandidates).toHaveBeenCalledTimes(2);
  });

  it("does not steal focus from another control after selection", async () => {
    const { nextFrame } = await selectWithDeferredFocus();
    const manual = screen.getByRole("button", {
      name: "Usar preenchimento manual",
    });
    act(() => manual.focus());
    nextFrame();
    nextFrame();
    expect(manual).toHaveFocus();
  });

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

    const selectionAnnouncement = screen.getByText(
      /Atenção: os dados recuperados não autorizam automaticamente a entrada/,
    );
    expect(selectionAnnouncement).toHaveAttribute("aria-live", "assertive");
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

  it("ignores a late cancellation without replacing newer populated results", async () => {
    const first = deferred<AccessEntryCandidate[]>();
    vi.mocked(searchAccessEntryCandidates)
      .mockReturnValueOnce(first.promise)
      .mockResolvedValueOnce([candidate]);
    const user = userEvent.setup();
    render(<Harness />);
    const search = screen.getByRole("combobox");
    await user.type(search, "ANT");
    await waitFor(() =>
      expect(searchAccessEntryCandidates).toHaveBeenCalledTimes(1),
    );
    const signal = vi.mocked(searchAccessEntryCandidates).mock.calls[0][1];
    await user.clear(search);
    await user.type(search, "REC");
    await screen.findByRole("option", { name: /REC1A23/ });
    expect(signal?.aborted).toBe(true);
    await act(async () =>
      first.reject(new CanceledError("obsolete fixture request")),
    );
    expect(screen.getByRole("option", { name: /REC1A23/ })).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(searchAccessEntryCandidates).toHaveBeenCalledTimes(2);
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
