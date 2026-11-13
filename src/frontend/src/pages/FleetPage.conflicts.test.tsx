import { AxiosError, AxiosHeaders } from "axios";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ConfirmationProvider } from "../components/ui/ConfirmationProvider";
import { useAuthenticatedSession } from "../features/authentication";
import { api } from "../services/api";
import { FleetPage } from "./FleetPage";

vi.mock("../features/authentication", () => ({
  useAuthenticatedSession: vi.fn(),
}));
vi.mock("../services/api", () => ({
  api: { get: vi.fn(), put: vi.fn(), post: vi.fn(), delete: vi.fn() },
}));

const vehicle = {
  brand: "Marca fictícia",
  color: "Branca",
  createdAtUtc: "2030-06-10T11:00:00Z",
  id: 4,
  identification: "VEICULO 04",
  model: "Modelo fictício",
  plate: "DEM1A23",
  vehicleType: "Automóvel",
  year: 2024,
};
const genericMessage = "Não foi possível atualizar o veículo institucional.";
const guidance =
  "A placa e a identificação não podem ser alteradas porque o veículo possui registros vinculados. Os demais dados podem ser atualizados.";

function responseError(
  status = 409,
  data: unknown = { message: genericMessage, errors: { vehicle: [guidance] } },
) {
  return new AxiosError(
    "Simulated response",
    "ERR_BAD_REQUEST",
    undefined,
    undefined,
    {
      status,
      statusText: "Simulated",
      data,
      headers: {},
      config: { headers: new AxiosHeaders() },
    },
  );
}

function show() {
  return render(
    <ConfirmationProvider>
      <MemoryRouter>
        <FleetPage />
      </MemoryRouter>
    </ConfirmationProvider>,
  );
}

async function edit(field: "plate" | "identification" = "identification") {
  const user = userEvent.setup();
  show();
  await screen.findByText("DEM1A23");
  await user.click(screen.getByRole("button", { name: "Editar" }));
  const target = screen.getByLabelText(
    field === "plate" ? "Placa" : "Identificação institucional",
  );
  const value = field === "plate" ? "ABC1D23" : "VEICULO FICTICIO 99";
  await user.clear(target);
  await user.type(target, value);
  const color = screen.getByLabelText("Cor (opcional)");
  await user.clear(color);
  await user.type(color, "Prata fictícia");
  return {
    user,
    target,
    value,
    color,
    save: screen.getByRole("button", { name: "Salvar alterações" }),
  };
}

describe("FleetPage real conflict contract", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(api.get).mockResolvedValue({ data: [vehicle] });
    vi.mocked(useAuthenticatedSession).mockReturnValue({
      completePasswordChange: vi.fn(),
      expiresAtUtc: "2030-06-10T22:00:00Z",
      login: vi.fn(),
      logout: vi.fn(),
      restoreExternalSession: vi.fn(),
      sessionEndReason: null,
      status: "authenticated",
      user: {
        email: "admin.ficticio@example.test",
        id: 1,
        profileName: "Administrador",
        requiresPasswordChange: false,
      },
    });
  });

  it.each(["plate", "identification"] as const)(
    "presents errors.vehicle and preserves %s without resubmitting",
    async (field) => {
      vi.mocked(api.put).mockRejectedValueOnce(responseError());
      const { user, target, value, color, save } = await edit(field);
      await user.click(save);
      expect(await screen.findByText(guidance)).toBeVisible();
      const alert = screen.getByRole("alert");
      expect(alert).toHaveAttribute("aria-live", "assertive");
      expect(alert).toHaveAttribute("aria-atomic", "true");
      expect(target).toHaveValue(value);
      expect(color).toHaveValue("Prata fictícia");
      expect(screen.getByLabelText("Marca (opcional)")).toHaveValue(
        vehicle.brand,
      );
      expect(
        screen.getByRole("heading", { name: "Editar veículo" }),
      ).toBeVisible();
      expect(
        screen.queryByText("Dados do veículo atualizados com sucesso."),
      ).not.toBeInTheDocument();
      await user.click(color);
      await user.tab();
      expect(api.put).toHaveBeenCalledExactlyOnceWith(
        "/institutional-vehicles/4",
        expect.objectContaining({ [field]: value, color: "Prata fictícia" }),
      );
      expect(save).toBeEnabled();
    },
  );

  it("blocks double submission while the update is pending", async () => {
    let reject!: (reason: unknown) => void;
    vi.mocked(api.put).mockReturnValueOnce(
      new Promise((_, rejectPromise) => {
        reject = rejectPromise;
      }),
    );
    const { user, target, value, save } = await edit();
    await user.dblClick(save);
    expect(api.put).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Salvando…" })).toBeDisabled();
    reject(responseError());
    expect(await screen.findByText(guidance)).toBeVisible();
    expect(target).toHaveValue(value);
    expect(api.put).toHaveBeenCalledTimes(1);
  });

  it("permits a later explicit descriptive update without locally locking the vehicle", async () => {
    vi.mocked(api.put)
      .mockRejectedValueOnce(responseError())
      .mockResolvedValueOnce({ data: { ...vehicle, color: "Prata fictícia" } });
    const { user, target, save } = await edit();
    await user.click(save);
    await screen.findByText(guidance);
    expect(api.put).toHaveBeenCalledTimes(1);
    await user.clear(target);
    await user.type(target, vehicle.identification);
    await user.click(save);
    expect(
      await screen.findByText("Dados do veículo atualizados com sucesso."),
    ).toBeVisible();
    expect(api.put).toHaveBeenCalledTimes(2);
    expect(api.put).toHaveBeenLastCalledWith(
      "/institutional-vehicles/4",
      expect.objectContaining({
        identification: vehicle.identification,
        plate: vehicle.plate,
        color: "Prata fictícia",
      }),
    );
    expect(
      screen.queryByRole("heading", { name: "Editar veículo" }),
    ).not.toBeInTheDocument();
  });

  it.each([
    undefined,
    {},
    { vehicle: "invalid shape" },
    { vehicle: [false, 9] },
    { vehicle: ["  "] },
  ])(
    "uses the generic 409 fallback for invalid guidance %j",
    async (errors) => {
      vi.mocked(api.put).mockRejectedValueOnce(
        responseError(409, { message: genericMessage, errors }),
      );
      const { user, target, value, save } = await edit();
      await user.click(save);
      expect(await screen.findByText(genericMessage)).toBeVisible();
      expect(target).toHaveValue(value);
      expect(screen.queryByText(guidance)).not.toBeInTheDocument();
      expect(api.put).toHaveBeenCalledTimes(1);
    },
  );

  it("renders server guidance as text without interpreting HTML", async () => {
    const text = '<img src=x onerror="alert(1)"> orientação fictícia';
    vi.mocked(api.put).mockRejectedValueOnce(
      responseError(409, {
        message: genericMessage,
        errors: { vehicle: [text] },
      }),
    );
    const { user, save } = await edit();
    await user.click(save);
    expect(await screen.findByText(text)).toBeVisible();
    expect(document.querySelector("img[src='x']")).toBeNull();
  });

  it.each([
    [401, "Sua sessão não é mais válida. Entre novamente."],
    [403, "Seu perfil não possui permissão para realizar esta ação."],
    [429, "Muitas tentativas em pouco tempo. Aguarde e tente novamente."],
    [
      500,
      "O sistema encontrou um erro inesperado. Tente novamente mais tarde.",
    ],
  ])(
    "preserves status %s instead of applying conflict guidance",
    async (status, message) => {
      vi.mocked(api.put).mockRejectedValueOnce(responseError(status));
      const { user, save } = await edit();
      await user.click(save);
      expect(await screen.findByText(message)).toBeVisible();
      expect(screen.queryByText(guidance)).not.toBeInTheDocument();
      expect(api.put).toHaveBeenCalledTimes(1);
    },
  );

  it("preserves field validation and network classification", async () => {
    const validation = "Identificação fictícia já utilizada.";
    vi.mocked(api.put)
      .mockRejectedValueOnce(
        responseError(400, { errors: { identification: [validation] } }),
      )
      .mockRejectedValueOnce(
        new AxiosError("Simulated network failure", "ERR_NETWORK"),
      );
    const { user, target, value, save } = await edit();
    await user.click(save);
    expect(await screen.findByText(validation)).toBeVisible();
    expect(target).toHaveAttribute("aria-invalid", "true");
    await user.type(target, "A");
    await user.click(save);
    expect(
      await screen.findByText(
        "Não foi possível conectar ao sistema. Verifique a rede e tente novamente.",
      ),
    ).toBeVisible();
    expect(target).toHaveValue(value + "A");
    expect(api.put).toHaveBeenCalledTimes(2);
  });

  it("does not apply edit-specific guidance to vehicle creation", async () => {
    vi.mocked(api.post).mockRejectedValueOnce(responseError());
    const user = userEvent.setup();
    show();
    await screen.findByText("DEM1A23");
    await user.click(screen.getByRole("button", { name: "Novo veículo" }));
    await user.type(
      screen.getByLabelText("Identificação institucional"),
      "VEICULO FICTICIO NOVO",
    );
    await user.click(screen.getByRole("button", { name: "Cadastrar veículo" }));
    expect(await screen.findByText(genericMessage)).toBeVisible();
    expect(screen.queryByText(guidance)).not.toBeInTheDocument();
    await waitFor(() => expect(api.post).toHaveBeenCalledTimes(1));
  });
});
