import { useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import { Icon } from "../components/ui/Icon";
import { PageHeader } from "../components/ui/PageHeader";
import { RestrictedDemoState } from "../components/ui/RestrictedDemoState";
import { institutionalVehicles, useDemo, type DemoAccessRecord } from "../demo";
import { useAuthenticatedSession } from "../features/authentication";

const operationalProfiles = ["Porteiro", "Vigilante", "Administrador"];

const purposes: Record<DemoAccessRecord["type"], string[]> = {
  Institucional: ["Deslocamento institucional"],
  Serviço: [
    "Entrega rápida",
    "Prestação de serviço autorizada",
    "Manutenção",
    "Outro serviço autorizado",
  ],
  Visitante: [
    "Levar ou buscar estudante",
    "Atendimento agendado",
    "Visita a setor",
    "Participação em evento",
    "Outro acesso autorizado",
  ],
};

const durationOptions = [
  { label: "Sem previsão definida", value: 0 },
  { label: "10 minutos", value: 10 },
  { label: "20 minutos", value: 20 },
  { label: "30 minutos", value: 30 },
  { label: "1 hora", value: 60 },
  { label: "2 horas", value: 120 },
];

export function NewAccessPage() {
  const navigate = useNavigate();
  const { registerAccess } = useDemo();
  const { user } = useAuthenticatedSession();
  const [accessType, setAccessType] =
    useState<DemoAccessRecord["type"]>("Visitante");
  const [purpose, setPurpose] = useState(purposes.Visitante[0]);
  const [duration, setDuration] = useState(10);
  const [vehicleCode, setVehicleCode] = useState(institutionalVehicles[0].code);

  const selectedVehicle = useMemo(
    () =>
      institutionalVehicles.find((vehicle) => vehicle.code === vehicleCode) ??
      institutionalVehicles[0],
    [vehicleCode],
  );

  if (!operationalProfiles.includes(user.profileName)) {
    return (
      <RestrictedDemoState message="Seu perfil não possui permissão para registrar entradas e saídas." />
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const isInstitutional = accessType === "Institucional";
    const requiresDocument = accessType === "Visitante";

    registerAccess({
      destination: String(data.get("destination")),
      documentType: requiresDocument
        ? String(data.get("documentType"))
        : undefined,
      documentVerified: requiresDocument
        ? Boolean(String(data.get("documentNumber")).trim())
        : undefined,
      driver: String(data.get("driver")),
      expectedDurationMinutes: duration || undefined,
      institutionalVehicleCode: isInstitutional
        ? selectedVehicle.code
        : undefined,
      plate: isInstitutional
        ? selectedVehicle.plate
        : String(data.get("plate")),
      purpose,
      type: accessType,
    });
    navigate("/acessos/abertos");
  }

  function changeAccessType(type: DemoAccessRecord["type"]) {
    const nextPurpose = purposes[type][0];
    setAccessType(type);
    setPurpose(nextPurpose);
    setDuration(nextPurpose === "Levar ou buscar estudante" ? 10 : 0);
  }

  function changePurpose(nextPurpose: string) {
    setPurpose(nextPurpose);
    if (nextPurpose === "Levar ou buscar estudante") {
      setDuration(10);
    }
  }

  const fieldClass =
    "mt-2 min-h-12 w-full rounded-xl border border-ink/20 bg-cream/55 px-4 text-ink outline-none transition placeholder:text-ink/40 focus:border-brand-dark focus:bg-white focus:ring-3 focus:ring-brand/20";

  return (
    <div>
      <PageHeader
        description="Registre apenas o necessário para identificar o veículo, o responsável e o motivo da permanência no campus."
        eyebrow="Operação da portaria"
        title="Registrar entrada"
      />

      <form
        className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_21rem]"
        onSubmit={handleSubmit}
      >
        <section className="overflow-hidden rounded-[2rem] border border-ink/10 bg-white shadow-[0_14px_40px_rgba(1,36,40,0.06)]">
          <div className="border-b border-ink/8 bg-[#B8C9A4]/25 px-5 py-5 sm:px-7">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-dark">
              Etapa única
            </p>
            <h2 className="mt-1 font-display text-2xl text-ink">
              Identificação e permanência
            </h2>
          </div>

          <div className="space-y-7 p-5 sm:p-7">
            <fieldset>
              <legend className="text-sm font-bold text-ink">
                Qual é o tipo de acesso?
              </legend>
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                {(["Visitante", "Serviço", "Institucional"] as const).map(
                  (type) => (
                    <label
                      className={`flex min-h-20 cursor-pointer items-center gap-3 rounded-2xl border p-4 transition focus-within:ring-3 focus-within:ring-brand/25 ${
                        accessType === type
                          ? "border-brand-dark bg-[#B8C9A4]/35 shadow-sm"
                          : "border-ink/12 bg-cream/25 hover:bg-cream/55"
                      }`}
                      key={type}
                    >
                      <input
                        checked={accessType === type}
                        className="size-4 accent-[#236d2a]"
                        name="accessType"
                        onChange={() => changeAccessType(type)}
                        type="radio"
                        value={type}
                      />
                      <span>
                        <strong className="block text-sm text-ink">
                          {type}
                        </strong>
                        <span className="mt-1 block text-xs leading-4 text-ink/55">
                          {type === "Visitante"
                            ? "Documento obrigatório"
                            : type === "Institucional"
                              ? "Placa já cadastrada"
                              : "Serviço ou entrega"}
                        </span>
                      </span>
                    </label>
                  ),
                )}
              </div>
            </fieldset>

            <div className="grid gap-5 md:grid-cols-2">
              {accessType === "Institucional" ? (
                <div className="md:col-span-2">
                  <label
                    className="text-sm font-semibold text-ink"
                    htmlFor="institutionalVehicle"
                  >
                    Veículo institucional
                  </label>
                  <select
                    className={fieldClass}
                    id="institutionalVehicle"
                    onChange={(event) => setVehicleCode(event.target.value)}
                    value={vehicleCode}
                  >
                    {institutionalVehicles.map((vehicle) => (
                      <option key={vehicle.code} value={vehicle.code}>
                        {vehicle.code} — {vehicle.label}
                      </option>
                    ))}
                  </select>
                  <div className="mt-3 flex flex-col gap-4 rounded-2xl border border-brand-dark/15 bg-[#B8C9A4]/25 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <span className="grid size-11 place-items-center rounded-xl bg-white text-ink">
                        <Icon name="bus" />
                      </span>
                      <div>
                        <p className="font-bold text-ink">
                          {selectedVehicle.plate}
                        </p>
                        <p className="text-xs text-ink/60">
                          Placa recuperada do cadastro da frota
                        </p>
                      </div>
                    </div>
                    <label className="flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-ink">
                      <input
                        className="size-4 accent-[#236d2a]"
                        required
                        type="checkbox"
                      />
                      Placa conferida
                    </label>
                  </div>
                </div>
              ) : (
                <div>
                  <label
                    className="text-sm font-semibold text-ink"
                    htmlFor="plate"
                  >
                    Placa do veículo{" "}
                    <span aria-hidden="true" className="text-red-700">
                      *
                    </span>
                  </label>
                  <input
                    autoCapitalize="characters"
                    className={fieldClass}
                    id="plate"
                    maxLength={8}
                    name="plate"
                    placeholder="Ex.: DEM-1234"
                    required
                  />
                </div>
              )}

              <div
                className={
                  accessType === "Institucional" ? "md:col-span-2" : ""
                }
              >
                <label
                  className="text-sm font-semibold text-ink"
                  htmlFor="driver"
                >
                  {accessType === "Institucional"
                    ? "Motorista autorizado"
                    : "Nome do condutor"}{" "}
                  <span aria-hidden="true" className="text-red-700">
                    *
                  </span>
                </label>
                {accessType === "Institucional" ? (
                  <select
                    className={fieldClass}
                    id="driver"
                    name="driver"
                    required
                  >
                    <option>Motorista institucional 01</option>
                    <option>Motorista institucional 02</option>
                  </select>
                ) : (
                  <input
                    autoComplete="off"
                    className={fieldClass}
                    id="driver"
                    name="driver"
                    placeholder="Ex.: Pessoa de demonstração"
                    required
                  />
                )}
              </div>

              {accessType === "Visitante" && (
                <>
                  <div>
                    <label
                      className="text-sm font-semibold text-ink"
                      htmlFor="documentType"
                    >
                      Tipo de documento{" "}
                      <span aria-hidden="true" className="text-red-700">
                        *
                      </span>
                    </label>
                    <select
                      className={fieldClass}
                      id="documentType"
                      name="documentType"
                      required
                    >
                      <option>Documento oficial com foto</option>
                      <option>Documento funcional</option>
                      <option>Outro documento autorizado</option>
                    </select>
                  </div>
                  <div>
                    <label
                      className="text-sm font-semibold text-ink"
                      htmlFor="documentNumber"
                    >
                      Número do documento{" "}
                      <span aria-hidden="true" className="text-red-700">
                        *
                      </span>
                    </label>
                    <input
                      autoComplete="off"
                      className={fieldClass}
                      id="documentNumber"
                      maxLength={30}
                      name="documentNumber"
                      placeholder="Use apenas dado fictício"
                      required
                    />
                    <p className="mt-1.5 text-xs text-ink/55">
                      O número não aparece nas listagens deste protótipo.
                    </p>
                  </div>
                </>
              )}

              <div>
                <label
                  className="text-sm font-semibold text-ink"
                  htmlFor="purpose"
                >
                  Motivo da entrada{" "}
                  <span aria-hidden="true" className="text-red-700">
                    *
                  </span>
                </label>
                <select
                  className={fieldClass}
                  id="purpose"
                  name="purpose"
                  onChange={(event) => changePurpose(event.target.value)}
                  value={purpose}
                >
                  {purposes[accessType].map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  className="text-sm font-semibold text-ink"
                  htmlFor="duration"
                >
                  Previsão de permanência
                </label>
                <select
                  className={fieldClass}
                  disabled={purpose === "Levar ou buscar estudante"}
                  id="duration"
                  onChange={(event) => setDuration(Number(event.target.value))}
                  value={duration}
                >
                  {durationOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1.5 text-xs text-ink/55">
                  {purpose === "Levar ou buscar estudante"
                    ? "Este motivo usa a previsão operacional de 10 minutos."
                    : "A previsão gera um alerta, mas não registra saída automaticamente."}
                </p>
              </div>

              <div className="md:col-span-2">
                <label
                  className="text-sm font-semibold text-ink"
                  htmlFor="destination"
                >
                  Destino no campus{" "}
                  <span aria-hidden="true" className="text-red-700">
                    *
                  </span>
                </label>
                <input
                  autoComplete="off"
                  className={fieldClass}
                  id="destination"
                  name="destination"
                  placeholder="Ex.: Bloco acadêmico"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-ink/10 pt-6 sm:flex-row sm:justify-end">
              <button
                className="min-h-12 rounded-xl border border-ink/20 px-5 font-bold text-ink hover:bg-cream focus:outline-none focus-visible:ring-3 focus-visible:ring-brand/25"
                onClick={() => navigate("/visao-geral")}
                type="button"
              >
                Cancelar
              </button>
              <button
                className="min-h-12 rounded-xl bg-brand px-7 font-bold text-white shadow-sm hover:bg-brand-dark focus:outline-none focus-visible:ring-3 focus-visible:ring-ink/30"
                type="submit"
              >
                Registrar entrada
              </button>
            </div>
          </div>
        </section>

        <aside className="h-fit space-y-4 xl:sticky xl:top-8">
          <section className="rounded-[2rem] bg-[#B8C9A4] p-6">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink/55">
              Conferência rápida
            </p>
            <ol className="mt-5 space-y-4 text-sm leading-6 text-ink/75">
              <li className="flex gap-3">
                <strong>1.</strong>
                <span>Confirme a placa com o veículo.</span>
              </li>
              <li className="flex gap-3">
                <strong>2.</strong>
                <span>
                  Confira o documento quando o acesso for de visitante.
                </span>
              </li>
              <li className="flex gap-3">
                <strong>3.</strong>
                <span>Informe motivo, destino e previsão de permanência.</span>
              </li>
            </ol>
          </section>
          <section className="rounded-[2rem] border border-[#EFD780] bg-[#EFD780]/35 p-5">
            <p className="text-sm font-bold text-ink">Sobre o prazo</p>
            <p className="mt-2 text-xs leading-5 text-ink/65">
              Ao ultrapassar a previsão sem saída registrada, o acesso ganha
              destaque para Porteiros e Vigilantes. A saída nunca é encerrada
              automaticamente.
            </p>
          </section>
        </aside>
      </form>
    </div>
  );
}
