import type { ReactNode, SVGProps } from "react";

export type IconName =
  | "arrow-right"
  | "bus"
  | "calendar"
  | "car"
  | "chevron-down"
  | "clipboard"
  | "clock"
  | "dashboard"
  | "history"
  | "log-out"
  | "menu"
  | "motorcycle"
  | "plus"
  | "search"
  | "shield"
  | "user"
  | "users"
  | "x";

interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName;
  size?: number;
}

const paths: Record<IconName, ReactNode> = {
  "arrow-right": <path d="m9 18 6-6-6-6M3 12h12" />,
  bus: (
    <>
      <path d="M6 17h12M6 8h12M7 21a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM17 21a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
      <path d="M5 17V6a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v11M5 12h14" />
    </>
  ),
  calendar: (
    <>
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </>
  ),
  car: (
    <>
      <path d="m5 11 1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11" />
      <path d="M3 13a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5H3v-5ZM5 18v2M19 18v2M7 14h.01M17 14h.01" />
    </>
  ),
  "chevron-down": <path d="m6 9 6 6 6-6" />,
  clipboard: (
    <>
      <rect width="16" height="18" x="4" y="4" rx="2" />
      <path d="M9 4V2h6v2M8 10h8M8 14h5" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  dashboard: (
    <>
      <rect width="7" height="7" x="3" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="3" rx="1" />
      <rect width="7" height="7" x="3" y="14" rx="1" />
      <rect width="7" height="7" x="14" y="14" rx="1" />
    </>
  ),
  history: (
    <>
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <path d="M3 3v5h5M12 7v5l3 2" />
    </>
  ),
  "log-out": (
    <>
      <path d="M10 17l5-5-5-5M15 12H3" />
      <path d="M14 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5" />
    </>
  ),
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  motorcycle: (
    <>
      <circle cx="6" cy="17" r="3" />
      <circle cx="18" cy="17" r="3" />
      <path d="m9 17 3-7h3l3 7M8 10h4l3 7H9M15 7h3M6 17l3-5" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </>
  ),
  shield: (
    <>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
    </>
  ),
  users: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  x: <path d="M18 6 6 18M6 6l12 12" />,
};

export function Icon({ name, size = 20, ...props }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      {...props}
    >
      {paths[name]}
    </svg>
  );
}
