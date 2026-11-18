import type { AccessRecord } from "../access-records/types";
import type { AccessCorrectionFormValues } from "../access-records/schemas/accessRecordSchemas";
import type {
  CorrectionAction,
  CorrectionRequest,
  CorrectionSubmission,
} from "./schemas";

export type ProposalPhase =
  "draft" | "sending" | "uncertain" | "conflict" | "blocked" | "submitted";
export interface ProposalIntent {
  record: AccessRecord;
  requestKey: string;
  draft: AccessCorrectionFormValues;
  phase: ProposalPhase;
  payload?: CorrectionSubmission;
  request?: CorrectionRequest;
  error: string | null;
  reading: boolean;
  rejectedAndAbsent?: boolean;
}
export interface DecisionIntent {
  action: CorrectionAction;
  reason: string;
  phase: "draft" | "sending" | "uncertain" | "blocked" | "complete";
  reading: boolean;
  error: string | null;
}
export function createCorrectionIntentStore() {
  let snapshot: {
    proposals: Readonly<Record<number, ProposalIntent>>;
    decisions: Readonly<Record<number, DecisionIntent>>;
  } = { proposals: {}, decisions: {} };
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((listener) => listener());
  return {
    getSnapshot: () => snapshot,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    setProposal: (id: number, value: ProposalIntent) => {
      snapshot = {
        ...snapshot,
        proposals: { ...snapshot.proposals, [id]: value },
      };
      emit();
    },
    removeProposal: (id: number) => {
      const next = { ...snapshot.proposals };
      delete next[id];
      snapshot = { ...snapshot, proposals: next };
      emit();
    },
    setDecision: (id: number, value: DecisionIntent) => {
      snapshot = {
        ...snapshot,
        decisions: { ...snapshot.decisions, [id]: value },
      };
      emit();
    },
    begin: (record: AccessRecord): ProposalIntent => {
      const existing = snapshot.proposals[record.id];
      if (existing) return existing;
      const intent: ProposalIntent = {
        record,
        requestKey: crypto.randomUUID(),
        phase: "draft",
        reading: false,
        error: null,
        draft: {
          categoryName: record.categoryName,
          objective: record.objective,
          observation: record.observation ?? "",
          justification: "",
        },
      };
      snapshot = {
        ...snapshot,
        proposals: { ...snapshot.proposals, [record.id]: intent },
      };
      emit();
      return intent;
    },
  };
}
export type CorrectionIntentStore = ReturnType<
  typeof createCorrectionIntentStore
>;
