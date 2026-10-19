import type { ExportedReport } from "../types";

export function downloadReport({ blob, fileName }: ExportedReport) {
  let objectUrl: string | null = null;
  let link: HTMLAnchorElement | null = null;

  try {
    objectUrl = URL.createObjectURL(blob);
    link = document.createElement("a");
    link.href = objectUrl;
    link.download = fileName;
    link.hidden = true;
    document.body.append(link);
    link.click();
  } finally {
    link?.remove();
    if (objectUrl) {
      const urlToRevoke = objectUrl;
      try {
        window.setTimeout(() => URL.revokeObjectURL(urlToRevoke), 0);
      } catch {
        URL.revokeObjectURL(urlToRevoke);
      }
    }
  }
}
