import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { correctionAccess } from "../../test/correctionReviewFixtures";
import { CorrectionReviewScope } from "./CorrectionReviewScope";
import { useCorrectionIntentStore } from "./correctionIntentContext";

describe("correction intent lifetime", () => {
  it("shares one store in nested views, preserves fields/key and guards unload only after an uncertain send", () => {
    const { result, unmount } = renderHook(() => useCorrectionIntentStore(), {
      wrapper: ({ children }) => (
        <CorrectionReviewScope>
          <CorrectionReviewScope>{children}</CorrectionReviewScope>
        </CorrectionReviewScope>
      ),
    });
    let key = "";
    act(() => {
      key = result.current.store.begin(correctionAccess).requestKey;
    });
    const store = result.current.store;
    expect(
      store.begin({ ...correctionAccess, objective: "Outra resposta fictícia" })
        .requestKey,
    ).toBe(key);
    expect(store.getSnapshot().proposals[10].record.objective).toBe(
      correctionAccess.objective,
    );
    const draftUnload = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(draftUnload);
    expect(draftUnload.defaultPrevented).toBe(false);
    act(() =>
      store.setProposal(10, {
        ...store.getSnapshot().proposals[10],
        phase: "uncertain",
      }),
    );
    const uncertainUnload = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(uncertainUnload);
    expect(uncertainUnload.defaultPrevented).toBe(true);
    act(() =>
      store.setProposal(10, {
        ...store.getSnapshot().proposals[10],
        phase: "submitted",
      }),
    );
    act(() =>
      store.setDecision(31, {
        action: "Approve",
        reason: "Razão fictícia",
        phase: "sending",
        reading: false,
        error: null,
      }),
    );
    const decisionUnload = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(decisionUnload);
    expect(decisionUnload.defaultPrevented).toBe(true);
    unmount();
    const removed = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(removed);
    expect(removed.defaultPrevented).toBe(false);
    const nextSession = renderHook(() => useCorrectionIntentStore(), {
      wrapper: CorrectionReviewScope,
    });
    expect(nextSession.result.current.snapshot).toEqual({
      proposals: {},
      decisions: {},
    });
  });
});
