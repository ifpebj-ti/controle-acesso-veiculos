import { ContentState } from "./ContentState";

/** Presentation only: session decisions remain in the authentication feature. */
export function SessionLoadingState({ title }: { title: string }) {
  return (
    <main
      aria-busy="true"
      className="grid min-h-svh place-items-center bg-background px-4 py-8 text-text"
    >
      <div className="w-full min-w-0 max-w-lg text-center">
        <h1 className="mb-5 text-2xl font-bold">{title}</h1>
        <ContentState
          description="Aguarde enquanto confirmamos seu acesso com segurança."
          title="Aguarde…"
          variant="loading"
        />
      </div>
    </main>
  );
}
