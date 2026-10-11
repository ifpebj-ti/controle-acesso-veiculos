import type { ReactNode, SVGProps } from "react";

export type IconName =
  | "ambulance"
  | "arrow-right"
  | "bus"
  | "calendar"
  | "car"
  | "chevron-down"
  | "clipboard"
  | "clock"
  | "dashboard"
  | "ellipsis"
  | "history"
  | "lock"
  | "log-out"
  | "mail"
  | "menu"
  | "motorcycle"
  | "package"
  | "pickup"
  | "plus"
  | "refresh"
  | "search"
  | "shield"
  | "truck"
  | "trophy"
  | "user"
  | "users"
  | "van"
  | "vehicle"
  | "wrench"
  | "x";

interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName;
  size?: number;
}

const paths: Record<IconName, ReactNode> = {
  ambulance: (
    <>
      <path d="M3 7h11v10H3zM14 10h4l3 4v3h-7z" />
      <path d="M7 9v6M4 12h6" />
      <circle cx="7" cy="19" r="2" />
      <circle cx="18" cy="19" r="2" />
    </>
  ),
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
  ellipsis: (
    <>
      <circle cx="5" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="19" cy="12" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  history: (
    <>
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <path d="M3 3v5h5M12 7v5l3 2" />
    </>
  ),
  lock: (
    <>
      <rect width="16" height="12" x="4" y="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3M12 15v3" />
    </>
  ),
  "log-out": (
    <>
      <path d="M10 17l5-5-5-5M15 12H3" />
      <path d="M14 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5" />
    </>
  ),
  mail: (
    <>
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m3 6 9 7 9-7" />
    </>
  ),
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  motorcycle: (
    <>
      <circle cx="6" cy="17" r="3" />
      <circle cx="18" cy="17" r="3" />
      <path d="M6 17h5l2-5h3l2 5M9 8h4l3 4M7 12h4" />
    </>
  ),
  package: (
    <>
      <path d="m12 2 8 4.5v11L12 22l-8-4.5v-11L12 2Z" />
      <path d="m4.5 6.7 7.5 4.2 7.5-4.2M12 11v11" />
    </>
  ),
  pickup: (
    <>
      <path d="M3 7h8v8H3zM11 10h5l3 3v2h-8zM3 15h18v3H3z" />
      <circle cx="7" cy="19" r="2" />
      <circle cx="17" cy="19" r="2" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  refresh: (
    <>
      <path d="M20 7v5h-5" />
      <path d="M19 12a7 7 0 1 0 1 5" />
    </>
  ),
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
  truck: (
    <>
      <path d="M3 6h11v11H3zM14 10h4l3 4v3h-7z" />
      <circle cx="7" cy="19" r="2" />
      <circle cx="18" cy="19" r="2" />
    </>
  ),
  trophy: (
    <>
      <path d="M8 4h8v4a4 4 0 0 1-8 0V4ZM12 12v5M8 21h8M9 17h6" />
      <path d="M8 6H4v1a4 4 0 0 0 4 4M16 6h4v1a4 4 0 0 1-4 4" />
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
  van: (
    <>
      <path d="M4 5h12a3 3 0 0 1 3 3v9H4V5Z" />
      <path d="M13 8h6M7 9h3M4 14h15" />
      <circle cx="8" cy="19" r="2" />
      <circle cx="17" cy="19" r="2" />
    </>
  ),
  vehicle: (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="2" />
      <path d="M12 4v6M5 14l5-1M19 14l-5-1" />
    </>
  ),
  wrench: (
    <path d="M14.7 6.3a4 4 0 0 0-5-5L12 3.6 9.6 6 7.3 3.7a4 4 0 0 0 5 5L4 17a2.1 2.1 0 0 0 3 3l8.3-8.3a4 4 0 0 0 5-5L18 9l-2.4-2.4L18 4.3a4 4 0 0 0-3.3 2Z" />
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
