import type { RouteObject } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { router } from "./index";

function flattenRoutes(routes: readonly RouteObject[]): RouteObject[] {
  return routes.flatMap((route) => [
    route,
    ...flattenRoutes(route.children ?? []),
  ]);
}

describe("application route registry", () => {
  it("keeps every public and protected destination registered once", () => {
    const paths = flattenRoutes(router.routes)
      .map((route) => route.path)
      .filter((path): path is string => Boolean(path));

    expect(paths).toEqual([
      "/",
      "/login",
      "/visao-geral",
      "/conta/senha",
      "/acessos/novo",
      "/acessos/abertos",
      "/acessos/historico",
      "/utilizacoes-institucionais",
      "/frota",
      "/motoristas-institucionais",
      "/eventos",
      "/administracao",
      "/relatorios",
      "*",
    ]);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it("resolves every lazy page to a React component", async () => {
    const lazyRoutes = flattenRoutes(router.routes).filter(
      (route) => route.lazy,
    );

    const loadedPages = await Promise.all(
      lazyRoutes.map(async (route) => {
        const load = route.lazy;
        if (typeof load !== "function") {
          throw new TypeError(
            `Route ${route.path ?? "without path"} is not lazy.`,
          );
        }
        return { path: route.path, result: await load() };
      }),
    );

    expect(loadedPages).toHaveLength(11);
    for (const page of loadedPages) {
      expect(page.path).toMatch(/^\//);
      expect(page.result.Component).toEqual(expect.any(Function));
    }
  });
});
