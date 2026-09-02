import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import { Icon } from "../components/ui/Icon";
import { PageHeader } from "../components/ui/PageHeader";
import { RestrictedDemoState } from "../components/ui/RestrictedDemoState";
import { useDemo } from "../demo";
import {
  generalAccessCategories,
  type GeneralAccessCategory,
} from "../features/access-records/model/accessCategories";
import { useAuthenticatedSession } from "../features/authentication";

const operationalProfiles = ["Porteiro", "Vigilante", "Administrador"];

export function NewAccessPage() {
  const navigate = useNavigate();
  const { registerAccess } = useDemo();
  const { user } = useAuthenticatedSession();
  const [category, setCategory] = useState<GeneralAccessCategory>(
    generalAccessCategories[0],
  );

  if (!operationalProfiles.includes(user.profileName)) {
    return (
      <RestrictedDemoState message="Seu perfil não possui permissão para registrar entradas gerais." />
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);

    registerAccess({
      category,
      driver: String(data.get("driver")),
      objective: String(data.get("objective")),
      observation: String(data.get("observation")).trim() || undefined,
      plate: String(data.get("plate")),
      vehicleType: String(data.get("vehicleType")).trim() || undefined,
    });
    navigate("/acessos/abertos");
  }

  const fieldClass =
    "mt-2 min-h-12 w-full rounded-xl border border-ink/20 bg-cream/55 px-4 text-ink outline-none transition placeholder:text-ink/40 focus:border-brand-dark focus:bg-white focus:ring-3 focus:ring-brand/20";

  return (
    <div>
      <PageHeader
        description="Registre o veículo, o condutor e a finalidade do acesso geral. Horário e autorização pertencem ao servidor na integração real."
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
              Fluxo geral de veículos
            </p>
            <h2 className="mt-1 font-display text-2xl text-ink">
              Dados da entrada
            </h2>
          </div>

          <div className="space-y-7 p-5 sm:p-7">
            <div className="grid gap-5 md:grid-cols-2">
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
                  maxLength={10}
                  name="plate"
                  placeholder="Ex.: DEM-1A23"
                  required
                />
              </div>

              <div>
                <label
                  className="text-sm font-semibold text-ink"
                  htmlFor="driver"
                >
                  Nome do condutor{" "}
                  <span aria-hidden="true" className="text-red-700">
                    *
                  </span>
                </label>
                <input
                  autoComplete="off"
                  className={fieldClass}
                  id="driver"
                  maxLength={200}
                  name="driver"
                  placeholder="Ex.: Pessoa de demonstração"
                  required
                />
              </div>

              <div>
                <label
                  className="text-sm font-semibold text-ink"
                  htmlFor="category"
                >
                  Categoria do acesso{" "}
                  <span aria-hidden="true" className="text-red-700">
                    *
                  </span>
                </label>
                <select
                  className={fieldClass}
                  id="category"
                  onChange={(event) =>
                    setCategory(event.target.value as GeneralAccessCategory)
                  }
                  value={category}
                >
                  {generalAccessCategories.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
                <p className="mt-1.5 text-xs text-ink/55">
                  Lista preliminar do MVP, ainda sujeita à validação
                  institucional.
                </p>
              </div>

              <div>
                <label
                  className="text-sm font-semibold text-ink"
                  htmlFor="vehicleType"
                >
                  Tipo do veículo{" "}
                  <span className="font-normal text-ink/50">(opcional)</span>
                </label>
                <input
                  className={fieldClass}
                  id="vehicleType"
                  maxLength={50}
                  name="vehicleType"
                  placeholder="Ex.: Automóvel"
                />
              </div>

              <div className="md:col-span-2">
                <label
                  className="text-sm font-semibold text-ink"
                  htmlFor="objective"
                >
                  Objetivo do acesso{" "}
                  <span aria-hidden="true" className="text-red-700">
                    *
                  </span>
                </label>
                <textarea
                  className={`${fieldClass} min-h-28 py-3`}
                  id="objective"
                  maxLength={500}
                  name="objective"
                  placeholder="Descreva de forma objetiva a finalidade da entrada."
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label
                  className="text-sm font-semibold text-ink"
                  htmlFor="observation"
                >
                  Observação{" "}
                  <span className="font-normal text-ink/50">(opcional)</span>
                </label>
                <textarea
                  className={`${fieldClass} min-h-24 py-3`}
                  id="observation"
                  maxLength={1000}
                  name="observation"
                  placeholder="Inclua somente informação necessária para a operação."
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
                <span>Confirme o nome do condutor.</span>
              </li>
              <li className="flex gap-3">
                <strong>3.</strong>
                <span>
                  Registre categoria e objetivo sem dados desnecessários.
                </span>
              </li>
            </ol>
          </section>

          <section className="rounded-[2rem] border border-[#BDD8F1] bg-[#BDD8F1]/30 p-5">
            <div className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-ink">
                <Icon name="bus" size={20} />
              </span>
              <div>
                <p className="text-sm font-bold text-ink">
                  Veículo institucional
                </p>
                <p className="mt-1 text-xs leading-5 text-ink/65">
                  Saída, quilometragem, motorista e retorno pertencem ao fluxo
                  próprio da frota.
                </p>
              </div>
            </div>
          </section>
        </aside>
      </form>
    </div>
  );
}
