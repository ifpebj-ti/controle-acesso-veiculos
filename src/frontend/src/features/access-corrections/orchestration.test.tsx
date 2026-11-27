import { act, renderHook } from "@testing-library/react";
import { CanceledError } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  correctionAccess,
  correctionKey,
  pendingCorrection,
  terminalCorrection,
} from "../../test/correctionReviewFixtures";
import { CorrectionReviewScope } from "./CorrectionReviewScope";
import { useCorrectionSubmission } from "./useCorrectionSubmission";
import { useCorrectionDecision } from "./useCorrectionDecision";
import {
  decideCorrectionRequest,
  findOwnCorrectionRequest,
  getCorrectionRequest,
  submitCorrectionRequest,
} from "./service";
import type { CorrectionRequest } from "./schemas";

vi.mock("./service", async (original) => ({
  ...(await original<typeof import("./service")>()),
  submitCorrectionRequest: vi.fn(),
  findOwnCorrectionRequest: vi.fn(),
  decideCorrectionRequest: vi.fn(),
  getCorrectionRequest: vi.fn(),
}));
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
function proposal() {
  const hook = renderHook(() => useCorrectionSubmission(), {
    wrapper: CorrectionReviewScope,
  });
  act(() => {
    hook.result.current.store.begin(correctionAccess);
    hook.result.current.updateDraft(10, "categoryName", "Entrega");
    hook.result.current.updateDraft(
      10,
      "objective",
      pendingCorrection.proposed.objective,
    );
    hook.result.current.updateDraft(
      10,
      "observation",
      pendingCorrection.proposed.observation!,
    );
    hook.result.current.updateDraft(
      10,
      "justification",
      pendingCorrection.justification,
    );
  });
  return hook;
}
describe("correction mutation and read-only reconciliation", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(crypto, "randomUUID").mockReturnValue(correctionKey);
  });
  it("freezes original values and one key while preventing simultaneous submissions", async () => {
    const pending = deferred<CorrectionRequest>();
    vi.mocked(submitCorrectionRequest).mockReturnValue(pending.promise);
    const { result } = proposal();
    let first!: Promise<CorrectionRequest | null>;
    act(() => {
      first = result.current.submit(10);
    });
    await act(async () => {
      await result.current.submit(10);
    });
    expect(submitCorrectionRequest).toHaveBeenCalledExactlyOnceWith(10, {
      requestKey: correctionKey,
      original: pendingCorrection.original,
      proposed: pendingCorrection.proposed,
      justification: pendingCorrection.justification,
    });
    await act(async () => {
      pending.resolve(pendingCorrection);
      await first;
    });
    expect(result.current.snapshot.proposals[10].phase).toBe("submitted");
    expect(crypto.randomUUID).toHaveBeenCalledTimes(1);
  });
  it.each([
    new CanceledError("fixture"),
    new DOMException("fixture", "AbortError"),
  ])(
    "preserves fields/key after %s, including a momentarily absent request",
    async (error) => {
      vi.mocked(submitCorrectionRequest).mockRejectedValue(error);
      vi.mocked(findOwnCorrectionRequest)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(pendingCorrection);
      const { result } = proposal();
      await act(async () => {
        await result.current.submit(10);
      });
      const before = result.current.snapshot.proposals[10];
      expect(before.phase).toBe("uncertain");
      await act(async () => {
        await result.current.submit(10);
        await result.current.reconcile(10);
      });
      expect(result.current.snapshot.proposals[10]).toMatchObject({
        requestKey: correctionKey,
        draft: before.draft,
        phase: "uncertain",
      });
      expect(result.current.snapshot.proposals[10].error).toContain(
        "não confirma",
      );
      act(() =>
        result.current.updateDraft(
          10,
          "objective",
          "Must not replace frozen intention",
        ),
      );
      expect(result.current.snapshot.proposals[10].draft).toEqual(before.draft);
      await act(async () => {
        await result.current.reconcile(10);
      });
      expect(result.current.snapshot.proposals[10].phase).toBe("submitted");
      expect(submitCorrectionRequest).toHaveBeenCalledTimes(1);
      expect(findOwnCorrectionRequest).toHaveBeenCalledWith(correctionKey);
      expect(crypto.randomUUID).toHaveBeenCalledTimes(1);
    },
  );
  it("does not interpret absence while POST is still in flight as rollback", async () => {
    const pending = deferred<CorrectionRequest>();
    vi.mocked(submitCorrectionRequest).mockReturnValue(pending.promise);
    vi.mocked(findOwnCorrectionRequest).mockResolvedValue(null);
    const { result } = proposal();
    let first!: Promise<CorrectionRequest | null>;
    act(() => {
      first = result.current.submit(10);
    });
    await act(async () => {
      await result.current.reconcile(10);
      await result.current.submit(10);
    });
    expect(result.current.snapshot.proposals[10].phase).toBe("sending");
    expect(submitCorrectionRequest).toHaveBeenCalledTimes(1);
    await act(async () => {
      pending.resolve(pendingCorrection);
      await first;
    });
  });
  it("does not replace a confirmed request with a late transport failure", async () => {
    const pending = deferred<CorrectionRequest>();
    vi.mocked(submitCorrectionRequest).mockReturnValue(pending.promise);
    vi.mocked(findOwnCorrectionRequest).mockResolvedValue(pendingCorrection);
    const { result } = proposal();
    let first!: Promise<CorrectionRequest | null>;
    act(() => {
      first = result.current.submit(10);
    });
    await act(async () => {
      await result.current.reconcile(10);
    });
    await act(async () => {
      pending.reject(new CanceledError("fixture"));
      await first;
    });
    expect(result.current.snapshot.proposals[10]).toMatchObject({
      phase: "submitted",
      request: pendingCorrection,
      error: null,
    });
  });
  it("requires an explicit new intention after a definitive conflict and read-only absence", async () => {
    vi.mocked(submitCorrectionRequest).mockRejectedValue({
      isAxiosError: true,
      response: { status: 409 },
    });
    vi.mocked(findOwnCorrectionRequest).mockResolvedValue(null);
    const { result } = proposal();
    await act(async () => {
      await result.current.submit(10);
      await result.current.reconcile(10);
    });
    expect(result.current.snapshot.proposals[10]).toMatchObject({
      phase: "conflict",
      rejectedAndAbsent: true,
      requestKey: correctionKey,
    });
    expect(crypto.randomUUID).toHaveBeenCalledTimes(1);
  });
  it.each([
    new CanceledError("fixture"),
    new DOMException("fixture", "AbortError"),
  ])("reconciles a cancelled decision %s only by GET", async (error) => {
    vi.mocked(decideCorrectionRequest).mockRejectedValue(error);
    vi.mocked(getCorrectionRequest)
      .mockResolvedValueOnce(pendingCorrection)
      .mockResolvedValueOnce(terminalCorrection());
    const { result } = renderHook(() => useCorrectionDecision(), {
      wrapper: CorrectionReviewScope,
    });
    act(() => {
      result.current.prepare(31, "Approve");
      result.current.setReason(31, "Conferência fictícia da proposta.");
    });
    await act(async () => {
      await result.current.confirm(31);
    });
    expect(result.current.snapshot.decisions[31].phase).toBe("uncertain");
    const reason = result.current.snapshot.decisions[31].reason;
    await act(async () => {
      await result.current.confirm(31);
      await result.current.reconcile(31);
    });
    expect(result.current.snapshot.decisions[31]).toMatchObject({
      phase: "uncertain",
      reason,
    });
    act(() => result.current.prepare(31, "Reject"));
    expect(result.current.snapshot.decisions[31].action).toBe("Approve");
    await act(async () => {
      await result.current.reconcile(31);
    });
    expect(result.current.snapshot.decisions[31].phase).toBe("complete");
    expect(decideCorrectionRequest).toHaveBeenCalledTimes(1);
    expect(getCorrectionRequest).toHaveBeenCalledTimes(2);
  });
  it("does not reset a confirmed decision when the original POST later fails", async () => {
    const pending = deferred<CorrectionRequest>();
    vi.mocked(decideCorrectionRequest).mockReturnValue(pending.promise);
    vi.mocked(getCorrectionRequest).mockResolvedValue(
      terminalCorrection("Rejeitada"),
    );
    const { result } = renderHook(() => useCorrectionDecision(), {
      wrapper: CorrectionReviewScope,
    });
    act(() => {
      result.current.prepare(31, "Reject");
      result.current.setReason(31, "Conferência fictícia da recusa.");
    });
    let first!: Promise<CorrectionRequest | null>;
    act(() => {
      first = result.current.confirm(31);
    });
    await act(async () => {
      await result.current.reconcile(31);
    });
    await act(async () => {
      pending.reject(new CanceledError("fixture"));
      await first;
    });
    expect(result.current.snapshot.decisions[31]).toMatchObject({
      phase: "complete",
      error: null,
    });
    await act(async () => {
      await result.current.confirm(31);
    });
    expect(decideCorrectionRequest).toHaveBeenCalledTimes(1);
  });
});
