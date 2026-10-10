import { useEffect, useRef } from "react";
import type { KeyboardEvent } from "react";
import type {
  FieldErrors,
  UseFormClearErrors,
  UseFormRegister,
} from "react-hook-form";

import { TextField } from "../../../components/ui/TextField";
import type { AccessEntryFormValues } from "../schemas/accessRecordSchemas";
import {
  customEntryOption,
  quickAccessObjectives,
} from "../model/entryOptions";

interface EntryObjectiveFieldsetProps {
  clearErrors: UseFormClearErrors<AccessEntryFormValues>;
  errors: FieldErrors<AccessEntryFormValues>;
  fieldRef: (element: HTMLButtonElement | null) => void;
  onBlur: () => void;
  onSelect: (objective: AccessEntryFormValues["objective"]) => void;
  register: UseFormRegister<AccessEntryFormValues>;
  selectedObjective: AccessEntryFormValues["objective"];
}

export function EntryObjectiveFieldset({
  clearErrors,
  errors,
  fieldRef,
  onBlur,
  onSelect,
  register,
  selectedObjective,
}: EntryObjectiveFieldsetProps) {
  const previousObjective = useRef(selectedObjective);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    if (selectedObjective !== previousObjective.current) {
      clearErrors(["objective", "objectiveOther"]);
    }
    if (
      selectedObjective === customEntryOption &&
      previousObjective.current !== customEntryOption
    ) {
      window.requestAnimationFrame(() =>
        document.getElementById("objectiveOther")?.focus(),
      );
    }
    previousObjective.current = selectedObjective;
  }, [clearErrors, selectedObjective]);

  const objectiveError = errors.objective?.message;

  function selectByKeyboard(index: number) {
    const option = quickAccessObjectives[index];
    if (!option) return;
    clearErrors(["objective", "objectiveOther"]);
    onSelect(option);
    optionRefs.current[index]?.focus();
  }

  function handleOptionKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    let nextIndex: number | null = null;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = (index + 1) % quickAccessObjectives.length;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex =
        (index - 1 + quickAccessObjectives.length) %
        quickAccessObjectives.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = quickAccessObjectives.length - 1;
    }

    if (nextIndex === null) return;
    event.preventDefault();
    selectByKeyboard(nextIndex);
  }

  return (
    <fieldset
      aria-describedby={objectiveError ? "objective-error" : undefined}
      className="md:col-span-2"
    >
      <legend className="text-sm font-semibold text-ink" id="objective-label">
        Objetivo do acesso <span className="text-danger-text">*</span>
      </legend>
      <p className="mt-1 text-sm text-ink-soft" id="objective-help">
        Escolha a opção que melhor resume a finalidade da entrada.
      </p>

      <div
        aria-labelledby="objective-label"
        className="mt-3 flex flex-wrap gap-2"
        role="radiogroup"
      >
        {quickAccessObjectives.map((option, index) => {
          const selected = selectedObjective === option;
          return (
            <button
              aria-checked={selected}
              aria-describedby={
                objectiveError
                  ? "objective-help objective-error"
                  : "objective-help"
              }
              aria-invalid={Boolean(objectiveError)}
              className={`flex min-h-11 items-center rounded-xl border px-4 text-sm font-semibold transition focus:outline-3 focus:outline-offset-2 focus:outline-focus ${
                selected
                  ? "border-primary bg-primary text-primary-text"
                  : "border-border bg-surface text-text hover:border-border-strong hover:bg-surface-subtle"
              }`}
              key={option}
              onBlur={onBlur}
              onClick={() => {
                clearErrors(["objective", "objectiveOther"]);
                onSelect(option);
              }}
              onKeyDown={(event) => handleOptionKeyDown(event, index)}
              ref={(element) => {
                optionRefs.current[index] = element;
                if (index === 0) fieldRef(element);
              }}
              role="radio"
              tabIndex={
                selected || (!selectedObjective && index === 0) ? 0 : -1
              }
              type="button"
            >
              {option}
            </button>
          );
        })}
      </div>

      {objectiveError && (
        <p className="mt-2 text-sm text-danger-text" id="objective-error">
          {objectiveError}
        </p>
      )}

      {selectedObjective === customEntryOption && (
        <div className="mt-4 max-w-2xl">
          <label
            className="text-sm font-semibold text-ink"
            htmlFor="objectiveOther"
          >
            Outro objetivo <span className="text-danger-text">*</span>
          </label>
          <TextField
            aria-describedby={
              errors.objectiveOther ? "objectiveOther-error" : undefined
            }
            aria-invalid={Boolean(errors.objectiveOther)}
            className="mt-2"
            id="objectiveOther"
            maxLength={500}
            placeholder="Informe a finalidade da entrada"
            {...register("objectiveOther")}
          />
          {errors.objectiveOther?.message && (
            <p
              className="mt-1.5 text-sm text-danger-text"
              id="objectiveOther-error"
            >
              {errors.objectiveOther.message}
            </p>
          )}
        </div>
      )}
    </fieldset>
  );
}
