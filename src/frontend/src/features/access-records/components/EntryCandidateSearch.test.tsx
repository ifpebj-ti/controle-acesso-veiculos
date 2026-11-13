import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CanceledError } from "axios";
import { type FormEvent, useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { expectNoSeriousAccessibilityViolations } from "../../../test/accessibility";
import { searchEntrySuggestions } from "../../person-preregistration/services/campusDriversService";
import type { EntrySuggestion as AccessEntryCandidate } from "../../person-preregistration/schemas/campusDriverSchemas";
import { EntryCandidateSearch } from "./EntryCandidateSearch";

vi.mock(
  "../../person-preregistration/services/campusDriversService",
  async () => {
    const actual = await vi.importActual<
      typeof import("../../person-preregistration/services/campusDriversService")
    >("../../person-preregistration/services/campusDriversService");
    return { ...actual, searchEntrySuggestions: vi.fn() };
  },
);

const candidate: AccessEntryCandidate = {
  source: "CampusRegistration",
  affiliation: "Aluno",
  previousObjective: null,
  hasOpenAccess: false,
  expiresAtUtc: null,
  driverName: "Condutor recorrente fictício",
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
  afterEach(() => vi.useRealTimers());

  it("keeps different drivers for the same plate and displays the suggestion source", async () => {
    const other = {
      ...candidate,
      personId: 4,
      driverName: "Outro condutor fictício",
      affiliation: "Federal" as const,
    };
    vi.mocked(searchEntrySuggestions).mockResolvedValue([candidate, other]);
    const user = userEvent.setup();
    render(<Harness />);
    await user.type(screen.getByRole("combobox"), "REC");
    const options = await screen.findAllByRole("option");
    expect(options).toHaveLength(2);
    expect(options[1]).toHaveTextContent(
      "Pré-cadastro conferido · Servidor federal",
    );
    await user.click(options[1]);
    expect(
      screen.getByText(`${other.plate} · ${other.driverName}`),
    ).toBeInTheDocument();
  });

  it("expires a daily result and selection at its API deadline without making another request", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date"] });
    vi.setSystemTime(new Date("2030-06-10T20:00:00Z"));
    const daily = {
      ...candidate,
      source: "SameDayVisit" as const,
      affiliation: null,
      expiresAtUtc: new Date(Date.now() + 1000).toISOString(),
    };
    vi.mocked(searchEntrySuggestions).mockResolvedValue([daily]);
    render(<Harness />);
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "REC" },
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(350);
    });
    const option = screen.getByRole("option");
    expect(option).toHaveTextContent("Retorno registrado por você hoje");
    fireEvent.click(option);
    expect(
      screen.getByText(`${daily.plate} · ${daily.driverName}`),
    ).toBeInTheDocument();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(700);
    });
    expect(
      screen.queryByText(`${daily.plate} · ${daily.driverName}`),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/As sugestões diárias expiraram/),
    ).toBeInTheDocument();
    expect(searchEntrySuggestions).toHaveBeenCalledOnce();
  });
  it("discards already expired daily results without treating their array index as a clock", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date"] });
    vi.setSystemTime(new Date("2030-06-10T20:00:00Z"));
    vi.mocked(searchEntrySuggestions).mockResolvedValue([
      {
        ...candidate,
        source: "SameDayVisit",
        affiliation: null,
        expiresAtUtc: "2030-06-10T19:59:59Z",
      },
      candidate,
    ]);
    render(<Harness />);
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "REC" },
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(350);
    });
    expect(screen.getAllByRole("option")).toHaveLength(1);
    expect(screen.getByRole("option")).toHaveTextContent(
      "Pré-cadastro conferido",
    );
    expect(
      screen.queryByText(/Retorno registrado por você hoje/),
    ).not.toBeInTheDocument();
    expect(searchEntrySuggestions).toHaveBeenCalledOnce();
  });
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
    vi.mocked(searchEntrySuggestions).mockResolvedValue([candidate]);
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
    vi.mocked(searchEntrySuggestions).mockResolvedValue([alternate]);
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
    expect(searchEntrySuggestions).toHaveBeenCalledTimes(2);
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
    vi.mocked(searchEntrySuggestions).mockResolvedValue([]);
    const user = userEvent.setup();
    render(<Harness />);
    const search = screen.getByRole("combobox", {
      name: "Buscar por placa ou nome do condutor",
    });

    await user.type(search, "RE");
    expect(searchEntrySuggestions).not.toHaveBeenCalled();
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
    expect(searchEntrySuggestions).toHaveBeenCalledTimes(1);
  });

  it("announces loading while the debounced request is pending", async () => {
    const request = deferred<AccessEntryCandidate[]>();
    vi.mocked(searchEntrySuggestions).mockReturnValue(request.promise);
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
    vi.mocked(searchEntrySuggestions).mockResolvedValue([candidate]);
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
    vi.mocked(searchEntrySuggestions).mockReturnValue(request.promise);
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
    vi.mocked(searchEntrySuggestions).mockResolvedValue([candidate]);
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
    vi.mocked(searchEntrySuggestions).mockRejectedValue(new Error("network"));
    const user = userEvent.setup();
    render(<Harness />);

    await user.type(screen.getByRole("combobox"), "REC");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Continue preenchendo manualmente",
    );
  });

  it("aborts an obsolete request and ignores its late response", async () => {
    const first = deferred<AccessEntryCandidate[]>();
    vi.mocked(searchEntrySuggestions)
      .mockReturnValueOnce(first.promise)
      .mockResolvedValueOnce([]);
    const user = userEvent.setup();
    render(<Harness />);
    const search = screen.getByRole("combobox");

    await user.type(search, "REC");
    await waitFor(() =>
      expect(searchEntrySuggestions).toHaveBeenCalledTimes(1),
    );
    const firstSignal = vi.mocked(searchEntrySuggestions).mock.calls[0][1];
    await user.clear(search);
    await user.type(search, "OUT");
    await waitFor(() =>
      expect(searchEntrySuggestions).toHaveBeenCalledTimes(2),
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
    vi.mocked(searchEntrySuggestions)
      .mockReturnValueOnce(first.promise)
      .mockResolvedValueOnce([candidate]);
    const user = userEvent.setup();
    render(<Harness />);
    const search = screen.getByRole("combobox");
    await user.type(search, "ANT");
    await waitFor(() =>
      expect(searchEntrySuggestions).toHaveBeenCalledTimes(1),
    );
    const signal = vi.mocked(searchEntrySuggestions).mock.calls[0][1];
    await user.clear(search);
    await user.type(search, "REC");
    await screen.findByRole("option", { name: /REC1A23/ });
    expect(signal?.aborted).toBe(true);
    await act(async () =>
      first.reject(new CanceledError("obsolete fixture request")),
    );
    expect(screen.getByRole("option", { name: /REC1A23/ })).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(searchEntrySuggestions).toHaveBeenCalledTimes(2);
  });

  it("has no serious automated accessibility violations", async () => {
    vi.mocked(searchEntrySuggestions).mockResolvedValue([candidate]);
    const user = userEvent.setup();
    const { container } = render(<Harness />);

    await user.type(screen.getByRole("combobox"), "REC");
    await screen.findByRole("option", { name: /REC1A23/ });
    await expectNoSeriousAccessibilityViolations(container);
  });
});
