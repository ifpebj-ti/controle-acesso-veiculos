import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { downloadReport } from "./downloadReport";

describe("downloadReport", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: vi.fn(() => "blob:report"),
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: vi.fn(),
    });
  });

  afterEach(() => {
    document
      .querySelectorAll('a[href="blob:report"]')
      .forEach((link) => link.remove());
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("clicks an attached temporary link, removes it and revokes asynchronously", () => {
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(function (this: HTMLAnchorElement) {
        expect(document.body.contains(this)).toBe(true);
        expect(this.download).toBe("relatorio.pdf");
      });

    downloadReport({
      blob: new Blob(["pdf"], { type: "application/pdf" }),
      fileName: "relatorio.pdf",
    });

    expect(click).toHaveBeenCalledOnce();
    expect(document.querySelector('a[href="blob:report"]')).toBeNull();
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
    vi.runAllTimers();
    expect(URL.revokeObjectURL).toHaveBeenCalledOnce();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:report");
  });

  it("cleans the link and schedules URL revocation when clicking throws", () => {
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {
      throw new Error("click failed");
    });

    expect(() =>
      downloadReport({
        blob: new Blob(["pdf"], { type: "application/pdf" }),
        fileName: "relatorio.pdf",
      }),
    ).toThrow("click failed");
    expect(document.querySelector('a[href="blob:report"]')).toBeNull();
    vi.runAllTimers();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:report");
  });

  it("does not leave resources when Object URL creation fails", () => {
    vi.mocked(URL.createObjectURL).mockImplementation(() => {
      throw new Error("URL unavailable");
    });

    expect(() =>
      downloadReport({
        blob: new Blob(["pdf"], { type: "application/pdf" }),
        fileName: "relatorio.pdf",
      }),
    ).toThrow("URL unavailable");
    expect(document.querySelector('a[href^="blob:"]')).toBeNull();
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
  });
});
