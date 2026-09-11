export function formatElapsedTime(entryAtUtc: string, now: Date) {
  const entryTime = Date.parse(entryAtUtc);
  const elapsedMilliseconds = now.getTime() - entryTime;

  if (!Number.isFinite(entryTime)) return "Não disponível";

  const totalMinutes = Math.max(0, Math.floor(elapsedMilliseconds / 60_000));
  if (totalMinutes < 1) return "menos de 1 min";
  if (totalMinutes < 60) return `${totalMinutes} min`;

  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;
  if (totalHours < 24) {
    return `${totalHours} h ${String(remainingMinutes).padStart(2, "0")} min`;
  }

  const days = Math.floor(totalHours / 24);
  const remainingHours = totalHours % 24;
  return `${days} d ${remainingHours} h`;
}
