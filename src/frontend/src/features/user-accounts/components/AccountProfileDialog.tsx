import { useEffect, useRef, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";

import { ActionFeedback } from "../../../components/ui/ActionFeedback";
import { Button } from "../../../components/ui/Button";
import { SelectField } from "../../../components/ui/SelectField";
import {
  profileLabels,
  profileNames,
  type ProfileName,
} from "../../authentication";
import { changeAccountProfileFormSchema } from "../schemas/userAccountSchemas";
import type { ChangeAccountProfileInput, UserAccount } from "../types";

interface Props {
  account: UserAccount;
  busy: boolean;
  errorMessage: string | null;
  requiresReload: boolean;
  returnFocusTo: HTMLElement | null;
  onCancel: () => void;
  onConfirm: (input: ChangeAccountProfileInput) => void;
}

export function AccountProfileDialog({
  account,
  busy,
  errorMessage,
  requiresReload,
  returnFocusTo,
  onCancel,
  onConfirm,
}: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const feedbackRef = useRef<HTMLDivElement>(null);
  const callbacks = useRef({ busy, onCancel });
  const [profileName, setProfileName] = useState<ProfileName>(
    account.profileName,
  );
  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [validation, setValidation] = useState<string | null>(null);

  useEffect(() => {
    if (validation || errorMessage)
      feedbackRef.current?.scrollIntoView({ block: "nearest" });
  }, [validation, errorMessage]);

  useEffect(() => {
    callbacks.current = { busy, onCancel };
  }, [busy, onCancel]);
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const background = Array.from(document.body.children).filter(
      (element): element is HTMLElement =>
        element instanceof HTMLElement && element !== overlayRef.current,
    );
    const previousInert = background.map((element) => element.inert);
    background.forEach((element) => {
      element.inert = true;
    });
    cancelRef.current?.focus();
    function keydown(event: KeyboardEvent) {
      // A SelectField popup owns its own focus and Escape handling.
      if (!dialogRef.current?.contains(event.target as Node)) return;
      if (event.key === "Escape") {
        event.preventDefault();
        if (!callbacks.current.busy) callbacks.current.onCancel();
      }
      if (event.key !== "Tab") return;
      const controls = dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), textarea:not([disabled]), input:not([disabled]), [tabindex="0"]',
      );
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }
    window.addEventListener("keydown", keydown);
    return () => {
      window.removeEventListener("keydown", keydown);
      background.forEach((element, index) => {
        element.inert = previousInert[index];
      });
      document.body.style.overflow = previousOverflow;
      window.requestAnimationFrame(() => {
        if (!callbacks.current.busy && returnFocusTo?.isConnected)
          returnFocusTo.focus();
      });
    };
  }, [returnFocusTo]);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    const result = changeAccountProfileFormSchema.safeParse({
      profileName,
      reason,
    });
    const message = !result.success
      ? result.error.issues[0].message
      : profileName === account.profileName
        ? "Escolha um perfil diferente do atual."
        : !confirmed
          ? "Confirme que leu as consequências da alteração."
          : null;
    setValidation(message);
    if (result.success && !message) onConfirm(result.data);
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 grid items-center bg-overlay p-3 sm:p-6"
      ref={overlayRef}
    >
      <div
        aria-labelledby="account-profile-title"
        aria-modal="true"
        className="mx-auto max-h-[calc(100dvh-1.5rem)] w-full min-w-0 max-w-xl overflow-y-auto break-words rounded-2xl border border-border bg-surface p-5 text-text shadow-xl sm:p-7"
        ref={dialogRef}
        role="dialog"
      >
        <h2 className="font-display text-2xl" id="account-profile-title">
          Alterar perfil de acesso
        </h2>
        <p className="mt-3 text-sm text-text-muted">
          Conta de <strong>{account.name}</strong>. Perfil atual:{" "}
          {profileLabels[account.profileName]}.
        </p>
        <form className="mt-5 space-y-4" noValidate onSubmit={submit}>
          <div>
            <label
              className="block text-sm font-semibold"
              htmlFor="account-profile"
            >
              Novo perfil
            </label>
            <SelectField
              disabled={busy}
              id="account-profile"
              onValueChange={(value) => {
                setProfileName(value as ProfileName);
                setConfirmed(false);
                setValidation(null);
              }}
              options={profileNames.map((value) => ({
                label: profileLabels[value],
                value,
              }))}
              value={profileName}
            />
          </div>
          <div>
            <label
              className="block text-sm font-semibold"
              htmlFor="account-profile-reason"
            >
              Justificativa
            </label>
            <textarea
              aria-describedby="account-profile-reason-help"
              className="mt-2 min-h-28 w-full rounded-xl border border-border bg-surface px-3 py-2 text-text focus:outline-none focus-visible:ring-3 focus-visible:ring-focus"
              disabled={busy}
              id="account-profile-reason"
              maxLength={500}
              onChange={(event) => {
                setReason(event.target.value);
                setValidation(null);
              }}
              required
              value={reason}
            />
            <p
              className="mt-1 text-sm text-text-muted"
              id="account-profile-reason-help"
            >
              De 10 a 500 caracteres. Não inclua senhas ou dados pessoais
              desnecessários.
            </p>
          </div>
          <div className="rounded-xl border border-warning-border bg-warning-surface p-4 text-sm leading-6">
            <p>
              Ao confirmar, as sessões anteriores desta conta serão encerradas.
            </p>
            <p className="mt-2">
              {profileName === "Administrador"
                ? "O acesso passará a ser local. O servidor emitirá uma credencial temporária, que deverá ser entregue diretamente à pessoa responsável."
                : "O acesso será pelo Google, sem senha local. O vínculo com o Google será validado pelo sistema no login."}
            </p>
          </div>
          <label className="flex min-h-11 items-start gap-3 text-sm">
            <input
              checked={confirmed}
              className="mt-1 size-5 shrink-0 accent-primary focus-visible:ring-3 focus-visible:ring-focus"
              disabled={busy}
              onChange={(event) => setConfirmed(event.target.checked)}
              type="checkbox"
            />
            Confirmo a alteração para {profileLabels[profileName]} e o
            encerramento das sessões desta conta.
          </label>
          <div ref={feedbackRef}>
            {(validation || errorMessage) && (
              <ActionFeedback
                focusOnChange
                message={validation ?? errorMessage!}
                tone="error"
              />
            )}
          </div>
          <div aria-live="polite" className="text-sm">
            {busy ? "Alterando perfil… Aguarde a confirmação." : ""}
          </div>
          <div className="flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:justify-end">
            <Button
              disabled={busy}
              onClick={onCancel}
              ref={cancelRef}
              variant="secondary"
            >
              {requiresReload ? "Fechar e atualizar lista" : "Cancelar"}
            </Button>
            <Button disabled={busy || requiresReload} type="submit">
              {busy ? "Alterando…" : "Confirmar alteração de perfil"}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
