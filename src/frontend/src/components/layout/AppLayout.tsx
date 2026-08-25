import { Outlet } from 'react-router-dom';

export function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-100 text-slate-900">
      <header className="bg-cyan-800 px-4 py-6 text-white sm:px-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-cyan-100">
            IFPE – Campus Belo Jardim
          </p>

          <h1 className="mt-1 text-xl font-bold sm:text-2xl">
            Controle de Acesso de Veículos
          </h1>
        </div>
      </header>

      <main className="w-full flex-1 px-4 py-8 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <Outlet />
        </div>
      </main>

      <footer className="bg-slate-200 px-4 py-4 text-center text-sm text-slate-600">
        Ambiente inicial do sistema
      </footer>
    </div>
  );
}