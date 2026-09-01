import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';

import { Brand } from '../components/ui/Brand';
import { useDemo, type DemoProfile } from '../demo';

interface DemoAccount {
  name: string;
  profile: DemoProfile;
}

function accountFromUsername(username: string): DemoAccount {
  const normalizedUsername = username.trim().toLocaleLowerCase('pt-BR');

  if (normalizedUsername.includes('porteiro')) {
    return { name: 'Porteiro demonstrativo', profile: 'porteiro' };
  }
  if (normalizedUsername.includes('vigilante')) {
    return { name: 'Vigilante demonstrativo', profile: 'vigilante' };
  }
  if (normalizedUsername.includes('transporte')) {
    return { name: 'Transporte demonstrativo', profile: 'transporte' };
  }
  if (
    normalizedUsername.includes('admin') ||
    normalizedUsername.includes('eurico')
  ) {
    return { name: 'Administrador demonstrativo', profile: 'administrador' };
  }

  return { name: 'Usuário de demonstração', profile: 'transporte' };
}

export function LoginPage() {
  const navigate = useNavigate();
  const { setDemoAccount } = useDemo();
  const [username, setUsername] = useState('admin.demo');

  function enterDemo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const account = accountFromUsername(username);
    setDemoAccount(account.profile, account.name);
    navigate('/visao-geral');
  }

  return (
    <main className="relative min-h-svh overflow-hidden bg-cream px-4 py-6 text-ink sm:px-8 sm:py-8">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-ink" />

      <div className="relative z-10 mx-auto flex min-h-[calc(100svh-3rem)] w-full max-w-6xl flex-col items-center justify-center">
        <Brand className="mx-auto mb-7 w-fit max-w-[17rem] sm:mb-10 sm:max-w-sm" />

        <div className="login-scene relative mx-auto w-full max-w-[54rem] pb-20 sm:pb-28">
          <div aria-hidden="true" className="login-route-marks">
            <svg
              className="login-route-loop"
              preserveAspectRatio="none"
              viewBox="0 0 100 100"
            >
              <rect
                className="login-route-loop__stroke"
                fill="none"
                height="98"
                pathLength="100"
                rx="7"
                ry="8"
                vectorEffect="non-scaling-stroke"
                width="98"
                x="1"
                y="1"
              />
            </svg>
          </div>

          <section className="relative z-10 mx-auto flex min-h-[34rem] flex-col rounded-[2rem] border border-ink/75 bg-brand-soft px-6 py-10 shadow-[0_22px_65px_rgba(1,36,40,0.11)] sm:min-h-[40rem] sm:rounded-[2.5rem] sm:px-14 sm:py-14 lg:min-h-[42rem] lg:px-20 lg:pb-16 lg:pt-24">
            <header className="text-center">
              <h1 className="font-display text-4xl font-bold uppercase leading-none text-brand sm:text-6xl lg:text-[4.4rem]">
                Bem-vindo,
              </h1>
              <p className="mx-auto mt-5 max-w-2xl text-xs font-medium uppercase leading-5 tracking-[0.08em] text-ink/80 sm:text-sm">
                Ao sistema de acesso e cadastro de veículos no campus!
              </p>
            </header>

            <form className="mx-auto mt-10 w-full max-w-2xl space-y-7 sm:mt-14 sm:space-y-10" onSubmit={enterDemo}>
              <div>
                <label className="ml-2 text-sm font-semibold uppercase text-ink" htmlFor="demo-username">
                  Usuário:
                </label>
                <input
                  autoCapitalize="none"
                  autoComplete="username"
                  className="mt-2 min-h-13 w-full rounded-full border border-transparent bg-[#d8e6c6] px-6 text-ink outline-none transition placeholder:text-ink/40 focus:border-brand-dark focus:bg-cream focus:ring-3 focus:ring-brand/25 sm:min-h-14"
                  id="demo-username"
                  name="username"
                  onChange={(event) => setUsername(event.target.value)}
                  required
                  type="text"
                  value={username}
                />
              </div>

              <div>
                <label className="ml-2 text-sm font-semibold uppercase text-ink" htmlFor="demo-password">
                  Senha:
                </label>
                <input
                  autoComplete="current-password"
                  className="mt-2 min-h-13 w-full rounded-full border border-transparent bg-[#d8e6c6] px-6 text-ink outline-none transition focus:border-brand-dark focus:bg-cream focus:ring-3 focus:ring-brand/25 sm:min-h-14"
                  defaultValue="demonstracao"
                  id="demo-password"
                  name="password"
                  required
                  type="password"
                />
              </div>

              <div className="pt-2 text-center sm:pt-4">
                <button
                  className="min-h-13 w-full rounded-2xl bg-brand px-8 font-display text-xl font-bold uppercase text-white shadow-sm transition hover:bg-brand-dark focus:outline-none focus-visible:ring-3 focus-visible:ring-ink/35 sm:min-h-16 sm:w-auto sm:min-w-[17rem] sm:text-[1.75rem]"
                  type="submit"
                >
                  Entrar
                </button>
              </div>
            </form>
          </section>

          <div aria-hidden="true" className="login-bus-static">
            <img
              alt=""
              className="block h-auto w-full drop-shadow-[0_12px_10px_rgba(1,36,40,0.16)]"
              src="/brand/bus-illustration.png"
            />
          </div>
        </div>

        <div className="mx-auto mt-3 max-w-3xl text-center text-xs leading-5 text-ink/65">
          <p>
            Modo demonstração: os dados não são enviados e não representam autenticação real.
          </p>
          <p className="mt-1">
            Usuários de exemplo: <strong>admin.demo</strong>, <strong>porteiro.demo</strong>, <strong>vigilante.demo</strong> ou <strong>transporte.demo</strong>.
          </p>
        </div>
      </div>
    </main>
  );
}
