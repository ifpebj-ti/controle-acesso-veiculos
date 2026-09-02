import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";

import { Icon, type IconName } from "../components/ui/Icon";
import { PageHeader } from "../components/ui/PageHeader";
import { RestrictedDemoState } from "../components/ui/RestrictedDemoState";
import { shiftForDate, useDemo, type DemoAuthorizedPerson } from "../demo";

const operationalProfiles = ["porteiro", "vigilante"];
const fieldClass =
  "mt-2 min-h-12 w-full rounded-xl border border-ink/20 bg-cream/55 px-4 text-ink outline-none transition placeholder:text-ink/40 focus:border-brand-dark focus:bg-white focus:ring-3 focus:ring-brand/20";

type AccessTab =
  "Servidor" | "Terceirizado" | "Cadastrado" | "Visitante" | "Moto táxi";

const registeredTabs: DemoAuthorizedPerson["category"][] = [
  "Servidor",
  "Terceirizado",
  "Cadastrado",
];

const tabs: Array<{
  description: string;
  icon: IconName;
  label: AccessTab;
}> = [
  { description: "Vínculo institucional", icon: "user", label: "Servidor" },
  { description: "Empresa prestadora", icon: "users", label: "Terceirizado" },
  { description: "Autorização prévia", icon: "shield", label: "Cadastrado" },
  { description: "Documento e destino", icon: "clipboard", label: "Visitante" },
  { description: "Embarque rápido", icon: "motorcycle", label: "Moto táxi" },
];

const visitorPurposes = [
  "Levar ou buscar estudante",
  "Atendimento agendado",
  "Visita a setor",
  "Participação em evento",
  "Outro acesso autorizado",
];

const durationOptions = [
  [0, "Sem previsão definida"],
  [10, "10 minutos"],
  [20, "20 minutos"],
  [30, "30 minutos"],
  [60, "1 hora"],
  [120, "2 horas"],
] as const;

function FieldLabel({
  children,
  htmlFor,
}: {
  children: ReactNode;
  htmlFor: string;
}) {
  return (
    <label className="text-sm font-semibold text-ink" htmlFor={htmlFor}>
      {children}
    </label>
  );
}

export function NewAccessPage() {
  const navigate = useNavigate();
  const { authorizedPeople, profile, records, registerAccess } = useDemo();
  const firstServer =
    authorizedPeople.find(
      (person) =>
        person.category === "Servidor" &&
        !records.some(
          (record) => record.authorizedPersonId === person.id && !record.exitAt,
        ),
    ) ?? authorizedPeople.find((person) => person.category === "Servidor");
  const [activeTab, setActiveTab] = useState<AccessTab>("Servidor");
  const [personId, setPersonId] = useState(firstServer?.id ?? "");
  const [personVehiclePlate, setPersonVehiclePlate] = useState(
    firstServer?.vehicles[0]?.plate ?? "",
  );
  const [visitorPurpose, setVisitorPurpose] = useState(visitorPurposes[0]);
  const [visitorDuration, setVisitorDuration] = useState(10);

  const isRegisteredTab = registeredTabs.includes(
    activeTab as DemoAuthorizedPerson["category"],
  );
  const eligiblePeople = useMemo(
    () =>
      authorizedPeople.filter(
        (person) => person.active && person.category === activeTab,
      ),
    [activeTab, authorizedPeople],
  );
  const selectedPerson =
    eligiblePeople.find((person) => person.id === personId) ??
    eligiblePeople[0];
  const selectedPersonVehicle =
    selectedPerson?.vehicles.find(
      (vehicle) => vehicle.plate === personVehiclePlate,
    ) ?? selectedPerson?.vehicles[0];
  const selectedPersonOpenRecord = isRegisteredTab
    ? records.find(
        (record) =>
          record.authorizedPersonId === selectedPerson?.id && !record.exitAt,
      )
    : undefined;

  if (!operationalProfiles.includes(profile)) {
    return (
      <RestrictedDemoState message="Entradas e saídas são registradas somente por Porteiros e Vigilantes. Administração e Transporte acompanham os dados pelas consultas permitidas." />
    );
  }

  function changeTab(nextTab: AccessTab) {
    setActiveTab(nextTab);
    if (registeredTabs.includes(nextTab as DemoAuthorizedPerson["category"])) {
      const nextPerson = authorizedPeople.find(
        (person) => person.active && person.category === nextTab,
      );
      setPersonId(nextPerson?.id ?? "");
      setPersonVehiclePlate(nextPerson?.vehicles[0]?.plate ?? "");
    }
  }

  function changePerson(nextPersonId: string) {
    const nextPerson = authorizedPeople.find(
      (person) => person.id === nextPersonId,
    );
    setPersonId(nextPersonId);
    setPersonVehiclePlate(nextPerson?.vehicles[0]?.plate ?? "");
  }

  function changeVisitorPurpose(nextPurpose: string) {
    setVisitorPurpose(nextPurpose);
    if (nextPurpose === "Levar ou buscar estudante") setVisitorDuration(10);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);

    if (isRegisteredTab) {
      if (!selectedPerson || !selectedPersonVehicle || selectedPersonOpenRecord)
        return;
      registerAccess({
        authorizedPersonId: selectedPerson.id,
        destination: selectedPerson.sector,
        driver: selectedPerson.name,
        plate: selectedPersonVehicle.plate,
        purpose:
          activeTab === "Servidor"
            ? "Expediente no campus"
            : activeTab === "Terceirizado"
              ? "Atividade terceirizada"
              : "Acesso previamente autorizado",
        type: activeTab as DemoAuthorizedPerson["category"],
        vehicleVerified: true,
      });
    } else if (activeTab === "Visitante") {
      registerAccess({
        destination: String(data.get("visitorDestination")),
        documentType: String(data.get("documentType")),
        documentVerified: Boolean(String(data.get("documentNumber")).trim()),
        driver: String(data.get("visitorName")),
        expectedDurationMinutes: visitorDuration || undefined,
        plate: String(data.get("visitorPlate")),
        purpose: visitorPurpose,
        type: "Visitante",
        vehicleVerified: true,
      });
    } else {
      registerAccess({
        destination: "Área de embarque e desembarque",
        driver: String(data.get("motoTaxiName")),
        expectedDurationMinutes: 10,
        plate: String(data.get("motoTaxiPlate")),
        purpose: String(data.get("motoTaxiPurpose")),
        type: "Moto táxi",
        vehicleVerified: true,
      });
    }
    navigate("/acessos/abertos");
  }

  const submitDisabled =
    isRegisteredTab &&
    (!selectedPerson ||
      !selectedPersonVehicle ||
      Boolean(selectedPersonOpenRecord));

  return (
    <div>
      <PageHeader
        description="Escolha a categoria antes de registrar. Servidores, terceirizados e cadastrados usam dados existentes; visitantes e moto táxis possuem fluxos próprios."
        eyebrow="Operação da portaria"
        title="Registrar entrada"
      />

      <form
        className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_21rem]"
        onSubmit={handleSubmit}
      >
        <section className="overflow-hidden rounded-[2rem] border border-ink/10 bg-white shadow-[0_14px_40px_rgba(1,36,40,0.06)]">
          <div className="border-b border-ink/8 bg-[#B8C9A4]/20 px-4 pt-5 sm:px-7">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-dark">
              Categoria da entrada
            </p>
            <div
              aria-label="Tipos de entrada"
              className="mt-4 flex gap-1 overflow-x-auto lg:grid lg:grid-cols-5 lg:overflow-visible"
              role="tablist"
            >
              {tabs.map((tab) => {
                const selected = activeTab === tab.label;
                return (
                  <button
                    aria-controls="access-tab-panel"
                    aria-selected={selected}
                    className={`min-w-36 shrink-0 rounded-t-2xl border-b-4 px-4 py-3 text-left transition focus:outline-none focus-visible:ring-3 focus-visible:ring-brand/25 lg:min-w-0 ${
                      selected
                        ? tab.label === "Moto táxi"
                          ? "border-[#EFD780] bg-white text-ink"
                          : "border-brand bg-white text-ink"
                        : "border-transparent text-ink/60 hover:bg-white/55 hover:text-ink"
                    }`}
                    id={`access-tab-${tab.label}`}
                    key={tab.label}
                    onClick={() => changeTab(tab.label)}
                    role="tab"
                    type="button"
                  >
                    <span className="flex items-center gap-2 text-sm font-bold">
                      <Icon name={tab.icon} size={18} /> {tab.label}
                    </span>
                    <span className="mt-1 block text-[0.68rem] font-medium text-ink/50">
                      {tab.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div
            aria-labelledby={`access-tab-${activeTab}`}
            className="space-y-7 p-5 sm:p-7"
            id="access-tab-panel"
            role="tabpanel"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-dark">
                  {activeTab}
                </p>
                <h2 className="mt-1 font-display text-2xl text-ink">
                  {isRegisteredTab
                    ? "Localizar e conferir cadastro"
                    : activeTab === "Moto táxi"
                      ? "Registro rápido de moto táxi"
                      : "Identificação do visitante"}
                </h2>
              </div>
              <span className="rounded-full bg-[#B8C9A4]/35 px-3 py-1.5 text-xs font-bold text-brand-dark">
                Turno: {shiftForDate()}
              </span>
            </div>

            {isRegisteredTab && (
              <div>
                <FieldLabel htmlFor="authorizedPerson">
                  Buscar por nome
                </FieldLabel>
                <select
                  className={fieldClass}
                  id="authorizedPerson"
                  onChange={(event) => changePerson(event.target.value)}
                  required
                  value={selectedPerson?.id ?? ""}
                >
                  {eligiblePeople.length === 0 && (
                    <option value="">Nenhum cadastro ativo</option>
                  )}
                  {eligiblePeople.map((person) => {
                    const isInside = records.some(
                      (record) =>
                        record.authorizedPersonId === person.id &&
                        !record.exitAt,
                    );
                    return (
                      <option key={person.id} value={person.id}>
                        {person.name}
                        {isInside ? " — no campus" : ""}
                      </option>
                    );
                  })}
                </select>

                {selectedPerson && selectedPersonVehicle ? (
                  <div className="mt-4 rounded-2xl border border-brand-dark/15 bg-[#B8C9A4]/25 p-4 sm:p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex items-start gap-3">
                        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white text-ink">
                          <Icon name="user" />
                        </span>
                        <div>
                          <p className="font-bold text-ink">
                            {selectedPerson.name}
                          </p>
                          <p className="mt-1 text-sm text-ink/65">
                            {selectedPerson.category} • {selectedPerson.sector}
                          </p>
                          <p className="mt-1 text-xs text-ink/50">
                            Identificação: {selectedPerson.registration}
                          </p>
                        </div>
                      </div>
                      <span className="w-fit rounded-full bg-white px-3 py-1.5 text-xs font-bold text-brand-dark">
                        Cadastro ativo
                      </span>
                    </div>
                    <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
                      <div>
                        <FieldLabel htmlFor="registeredVehicle">
                          Veículo previamente cadastrado
                        </FieldLabel>
                        <select
                          className={fieldClass}
                          id="registeredVehicle"
                          onChange={(event) =>
                            setPersonVehiclePlate(event.target.value)
                          }
                          value={selectedPersonVehicle.plate}
                        >
                          {selectedPerson.vehicles.map((vehicle) => (
                            <option key={vehicle.plate} value={vehicle.plate}>
                              {vehicle.plate} — {vehicle.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <label className="flex min-h-12 items-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-ink">
                        <input
                          className="size-4 accent-[#236d2a]"
                          disabled={Boolean(selectedPersonOpenRecord)}
                          required
                          type="checkbox"
                        />
                        Nome e placa conferidos
                      </label>
                    </div>
                    {selectedPersonOpenRecord && (
                      <div
                        className="mt-4 flex flex-col gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 sm:flex-row sm:items-center sm:justify-between"
                        role="status"
                      >
                        <p>
                          Esta pessoa já possui entrada em aberto. Registre a
                          saída antes de uma nova entrada.
                        </p>
                        <button
                          className="min-h-10 shrink-0 rounded-xl bg-ink px-4 font-bold text-white"
                          onClick={() => navigate("/acessos/abertos")}
                          type="button"
                        >
                          Ir para saída
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
                    O Administrador precisa cadastrar uma pessoa e seu veículo
                    nesta categoria antes da operação.
                  </p>
                )}
              </div>
            )}

            {activeTab === "Visitante" && (
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <FieldLabel htmlFor="visitorName">
                    Nome do visitante
                  </FieldLabel>
                  <input
                    className={fieldClass}
                    id="visitorName"
                    name="visitorName"
                    placeholder="Pessoa demonstrativa"
                    required
                  />
                </div>
                <div>
                  <FieldLabel htmlFor="visitorPlate">
                    Placa do veículo
                  </FieldLabel>
                  <input
                    autoCapitalize="characters"
                    className={fieldClass}
                    id="visitorPlate"
                    maxLength={8}
                    name="visitorPlate"
                    placeholder="DEM-0000"
                    required
                  />
                </div>
                <div>
                  <FieldLabel htmlFor="documentType">
                    Tipo de documento
                  </FieldLabel>
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
                  <FieldLabel htmlFor="documentNumber">
                    Número do documento
                  </FieldLabel>
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
                <div>
                  <FieldLabel htmlFor="visitorPurpose">
                    Motivo da entrada
                  </FieldLabel>
                  <select
                    className={fieldClass}
                    id="visitorPurpose"
                    onChange={(event) =>
                      changeVisitorPurpose(event.target.value)
                    }
                    value={visitorPurpose}
                  >
                    {visitorPurposes.map((purpose) => (
                      <option key={purpose}>{purpose}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <FieldLabel htmlFor="visitorDuration">
                    Previsão de permanência
                  </FieldLabel>
                  <select
                    className={fieldClass}
                    disabled={visitorPurpose === "Levar ou buscar estudante"}
                    id="visitorDuration"
                    onChange={(event) =>
                      setVisitorDuration(Number(event.target.value))
                    }
                    value={visitorDuration}
                  >
                    {durationOptions.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1.5 text-xs text-ink/55">
                    A previsão gera alerta, mas nunca registra saída
                    automaticamente.
                  </p>
                </div>
                <div className="md:col-span-2">
                  <FieldLabel htmlFor="visitorDestination">
                    Destino no campus
                  </FieldLabel>
                  <input
                    className={fieldClass}
                    id="visitorDestination"
                    name="visitorDestination"
                    placeholder="Ex.: Bloco acadêmico"
                    required
                  />
                </div>
                <label className="md:col-span-2 flex min-h-12 items-center gap-2 rounded-xl border border-ink/10 bg-[#B8C9A4]/20 px-4 text-sm font-semibold text-ink">
                  <input
                    className="size-4 accent-[#236d2a]"
                    required
                    type="checkbox"
                  />{" "}
                  Documento e placa conferidos
                </label>
              </div>
            )}

            {activeTab === "Moto táxi" && (
              <div className="rounded-2xl border border-[#EFD780] bg-[#EFD780]/20 p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#FFE67C] text-ink">
                    <Icon name="motorcycle" />
                  </span>
                  <div>
                    <h3 className="font-bold text-ink">Permanência rápida</h3>
                    <p className="mt-1 text-sm leading-5 text-ink/65">
                      O prazo sugerido é de 10 minutos para embarque ou
                      desembarque. Sem saída registrada, a portaria recebe um
                      alerta.
                    </p>
                  </div>
                </div>
                <div className="mt-5 grid gap-5 md:grid-cols-2">
                  <div>
                    <FieldLabel htmlFor="motoTaxiName">
                      Nome ou identificação do mototaxista
                    </FieldLabel>
                    <input
                      className={fieldClass}
                      id="motoTaxiName"
                      name="motoTaxiName"
                      placeholder="Mototaxista demonstrativo"
                      required
                    />
                  </div>
                  <div>
                    <FieldLabel htmlFor="motoTaxiPlate">
                      Placa da motocicleta
                    </FieldLabel>
                    <input
                      autoCapitalize="characters"
                      className={fieldClass}
                      id="motoTaxiPlate"
                      maxLength={8}
                      name="motoTaxiPlate"
                      placeholder="DEM-0000"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <FieldLabel htmlFor="motoTaxiPurpose">Operação</FieldLabel>
                    <select
                      className={fieldClass}
                      id="motoTaxiPurpose"
                      name="motoTaxiPurpose"
                      required
                    >
                      <option>Buscar passageiro</option>
                      <option>Deixar passageiro</option>
                    </select>
                  </div>
                  <label className="md:col-span-2 flex min-h-12 items-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-ink">
                    <input
                      className="size-4 accent-[#236d2a]"
                      required
                      type="checkbox"
                    />{" "}
                    Placa conferida
                  </label>
                </div>
              </div>
            )}

            <div className="flex flex-col-reverse gap-3 border-t border-ink/10 pt-6 sm:flex-row sm:justify-end">
              <button
                className="min-h-12 rounded-xl border border-ink/20 px-5 font-bold text-ink hover:bg-cream"
                onClick={() => navigate("/visao-geral")}
                type="button"
              >
                Cancelar
              </button>
              <button
                className="min-h-12 rounded-xl bg-brand px-7 font-bold text-white shadow-sm hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-45"
                disabled={submitDisabled}
                type="submit"
              >
                Marcar entrada de {activeTab.toLocaleLowerCase("pt-BR")}
              </button>
            </div>
          </div>
        </section>

        <aside className="h-fit space-y-4 xl:sticky xl:top-8">
          <section className="rounded-[2rem] bg-[#B8C9A4] p-6">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink/55">
              Fluxo do turno
            </p>
            <h2 className="mt-1 font-display text-2xl text-ink">
              Entrada e saída
            </h2>
            <ol className="mt-5 space-y-4 text-sm leading-6 text-ink/75">
              <li className="flex gap-3">
                <strong>1.</strong>
                <span>Escolha a categoria correta.</span>
              </li>
              <li className="flex gap-3">
                <strong>2.</strong>
                <span>Confira a pessoa, a placa e os dados solicitados.</span>
              </li>
              <li className="flex gap-3">
                <strong>3.</strong>
                <span>
                  Na saída, localize o registro em “Acessos em aberto”.
                </span>
              </li>
            </ol>
          </section>
          <section className="rounded-[2rem] border border-[#EFD780] bg-[#EFD780]/35 p-5">
            <p className="text-sm font-bold text-ink">Atenção ao moto táxi</p>
            <p className="mt-2 text-xs leading-5 text-ink/65">
              O protótipo usa 10 minutos como hipótese operacional. Confirme com
              o cliente se o prazo e os dados exigidos serão os mesmos para
              todos os mototaxistas.
            </p>
          </section>
        </aside>
      </form>
    </div>
  );
}
