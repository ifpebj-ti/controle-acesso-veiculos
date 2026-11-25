import "./ApplicationFooter.css";

function getVersionLabel(value: unknown): string {
  if (typeof value !== "string") return "Versão não informada";

  const version = value.trim().replace(/^v/, "");
  const versionPattern =
    /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z]+(?:[.-][0-9A-Za-z]+)*)?(?:\+[0-9A-Za-z]+(?:[.-][0-9A-Za-z]+)*)?$/;

  if (
    version.length > 64 ||
    version === "0.0.0" ||
    !versionPattern.test(version)
  ) {
    return "Versão não informada";
  }

  return `Versão ${version}`;
}

export function ApplicationFooter() {
  return (
    <footer className="application-footer border-t border-border bg-background text-center text-sm text-text-muted">
      <p>{getVersionLabel(import.meta.env.VITE_APP_VERSION)}</p>
    </footer>
  );
}
