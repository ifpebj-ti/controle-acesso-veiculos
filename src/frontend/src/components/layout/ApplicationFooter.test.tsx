import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ApplicationFooter } from "./ApplicationFooter";

afterEach(() => vi.unstubAllEnvs());

describe("ApplicationFooter", () => {
  it.each(["0.5.1", "v0.5.1", " 0.5.1 ", "0.5.2-rc.1+qa.2"])(
    "displays only the version supplied by the build: %s",
    (version) => {
      vi.stubEnv("VITE_APP_VERSION", version);
      render(<ApplicationFooter />);

      expect(screen.getByRole("contentinfo")).toHaveTextContent(
        `Versão ${version.trim().replace(/^v/, "")}`,
      );
      expect(screen.queryByRole("link")).not.toBeInTheDocument();
    },
  );

  it.each([
    undefined,
    "",
    "0.0.0",
    "latest",
    "<script>",
    "01.2.3",
    "1.2",
    "1.2.3-" + "x".repeat(65),
  ])(
    "does not invent a release when build metadata is missing or invalid: %s",
    (version) => {
      vi.stubEnv("VITE_APP_VERSION", version);
      render(<ApplicationFooter />);

      expect(screen.getByRole("contentinfo")).toHaveTextContent(
        /^Versão não informada$/,
      );
    },
  );
});
