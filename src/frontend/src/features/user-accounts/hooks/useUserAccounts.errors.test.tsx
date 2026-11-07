import { act, renderHook, waitFor } from "@testing-library/react";
import { AxiosError, CanceledError } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { api } from "../../../services/api";
import { useUserAccounts } from "./useUserAccounts";

vi.mock("../../../services/api", () => ({
  api: { get: vi.fn(), post: vi.fn() },
}));
vi.mock("../../../components/ui/confirmationContext", () => ({
  useConfirmation: () => vi.fn(),
}));

const emptyPage = {
  items: [],
  page: 1,
  pageSize: 25,
  totalCount: 0,
  totalPages: 0,
};

describe("account query error feedback", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects an invalid HTTP response without blaming the network or accepting invalid items", async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: { ...emptyPage, items: [{ id: "invalid-fixture" }] },
    });
    const { result } = renderHook(() => useUserAccounts());
    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.page).toBeNull();
    expect(result.current.errorMessage).not.toMatch(
      /Verifique a rede|invalid-fixture/,
    );
    expect(result.current.errorMessage).toBeTruthy();
    expect(api.get).toHaveBeenCalledTimes(1);
  });

  it("keeps genuine transport feedback distinct", async () => {
    vi.mocked(api.get).mockRejectedValue(
      new AxiosError("fixture", "ERR_NETWORK"),
    );
    const { result } = renderHook(() => useUserAccounts());
    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.errorMessage).toContain("Verifique a rede");
    expect(api.get).toHaveBeenCalledTimes(1);
  });

  it("does not turn a deliberate cancellation into a connection error", async () => {
    vi.mocked(api.get).mockRejectedValue(
      new CanceledError("private-fixture-reason"),
    );
    const { result } = renderHook(() => useUserAccounts());
    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.errorMessage).toBe("A solicitação foi cancelada.");
    expect(api.get).toHaveBeenCalledTimes(1);
  });

  it("ignores an obsolete cancellation after a newer filter result without repeating queries", async () => {
    let cancelFirst!: (reason: unknown) => void;
    vi.mocked(api.get)
      .mockReturnValueOnce(
        new Promise((_resolve, reject) => {
          cancelFirst = reject;
        }),
      )
      .mockResolvedValueOnce({ data: emptyPage });
    const { result } = renderHook(() => useUserAccounts());
    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(1));
    act(() =>
      result.current.setDraft({
        ...result.current.draft,
        search: "filtro fictício",
      }),
    );
    act(() => result.current.applyFilters());
    await waitFor(() => expect(result.current.status).toBe("ready"));
    await act(async () => cancelFirst(new CanceledError("obsolete-fixture")));
    expect(result.current.status).toBe("ready");
    expect(result.current.page).toEqual(emptyPage);
    expect(result.current.errorMessage).toBeNull();
    expect(result.current.draft.search).toBe("filtro fictício");
    expect(api.get).toHaveBeenCalledTimes(2);
    expect(api.post).not.toHaveBeenCalled();
  });
});
