import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "../../../components/ui/Button";
import { ActionFeedback } from "../../../components/ui/ActionFeedback";
import { CampusVehicleFields } from "./CampusVehicleFields";
import {
  emptyVehicle,
  vehicleErrors,
  vehicleInput,
} from "../model/campusVehicleForm";
import type {
  AddCampusVehicleInput,
  CampusDriver,
} from "../schemas/campusDriverSchemas";
interface Props {
  person: CampusDriver;
  onSubmit: (input: AddCampusVehicleInput) => Promise<boolean>;
  onClose: () => void;
  pending: boolean;
  uncertain: boolean;
  error?: string | null;
  onEdit: () => void;
  returnFocusTo: HTMLElement | null;
}
export function AddCampusVehicleForm({
  person,
  onSubmit,
  onClose,
  pending,
  uncertain,
  error,
  onEdit,
  returnFocusTo,
}: Props) {
  const [vehicle, setVehicle] = useState(emptyVehicle),
    [errors, setErrors] = useState<Record<string, string>>({});
  const panel = useRef<HTMLDivElement>(null),
    sending = useRef(false);
  useEffect(() => {
    panel.current?.querySelector<HTMLInputElement>("input")?.focus();
    return () => {
      if (returnFocusTo?.isConnected) returnFocusTo.focus();
    };
  }, [returnFocusTo]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending.current || pending || uncertain) return;
    const next = vehicleErrors(vehicle);
    setErrors(next);
    if (Object.keys(next).length) return;
    sending.current = true;
    try {
      if (await onSubmit(vehicleInput(vehicle))) onClose();
    } finally {
      sending.current = false;
    }
  }
  return (
    <section
      aria-label="Vincular outro veículo"
      className="mt-6 rounded-2xl border border-border bg-surface p-5 text-text sm:p-6"
      ref={panel}
    >
      <h2 className="text-xl font-semibold">Vincular outro veículo</h2>
      <p className="mt-2 text-sm leading-6">
        Pessoa: <strong>{person.name}</strong>. O veículo será associado ao
        cadastro existente; nenhuma pessoa será criada.
      </p>
      <form
        noValidate
        onSubmit={(event) => {
          void submit(event);
        }}
      >
        <fieldset
          className="mt-5 grid min-w-0 gap-4 md:grid-cols-2"
          disabled={pending || uncertain}
        >
          <legend className="sr-only">Veículo adicional</legend>
          <CampusVehicleFields
            disabled={pending || uncertain}
            errors={errors}
            onChange={(value) => {
              setVehicle(value);
              setErrors({});
              onEdit();
            }}
            value={vehicle}
          />
        </fieldset>
        <ActionFeedback className="mt-4" message={error} tone="error" />
        <div className="mt-5 flex flex-wrap justify-end gap-3">
          <Button disabled={pending} onClick={onClose} variant="secondary">
            Cancelar vínculo
          </Button>
          <Button disabled={pending || uncertain} type="submit">
            {pending ? "Enviando…" : "Vincular veículo"}
          </Button>
        </div>
      </form>
    </section>
  );
}
