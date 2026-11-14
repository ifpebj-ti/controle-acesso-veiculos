import { useEffect, useState } from "react";
// Current published institutional configuration; the API rechecks the day on submit.
const formatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Recife",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});
function parts(date: Date) {
  return Object.fromEntries(
    formatter.formatToParts(date).map((part) => [part.type, part.value]),
  );
}
export function institutionalDayKey(date = new Date()) {
  const p = parts(date);
  return `${p.year}-${p.month}-${p.day}`;
}
export function nextInstitutionalMidnight(now = new Date()) {
  const p = parts(now),
    target = Date.UTC(+p.year, +p.month - 1, +p.day + 1);
  let guess = target;
  for (let i = 0; i < 2; i++) {
    const actual = parts(new Date(guess)),
      wall = Date.UTC(
        +actual.year,
        +actual.month - 1,
        +actual.day,
        +actual.hour,
        +actual.minute,
        +actual.second,
      );
    guess = target - (wall - guess);
  }
  return guess;
}
export function useInstitutionalDay() {
  const [day, setDay] = useState(() => institutionalDayKey());
  useEffect(() => {
    const refresh = () => setDay(institutionalDayKey());
    const timer = window.setTimeout(
      refresh,
      Math.max(1, nextInstitutionalMidnight() - Date.now() + 1),
    );
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [day]);
  return day;
}
