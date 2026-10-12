interface InstitutionalAccentProps {
  className?: string;
}

/** Decorative institutional signature inspired by the organic login divider. */
export function InstitutionalAccent({
  className = "",
}: InstitutionalAccentProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      focusable="false"
      preserveAspectRatio="none"
      viewBox="0 0 420 190"
    >
      <path
        className="institutional-accent__soft"
        d="M215 -18C289 20 278 67 335 88C385 107 425 119 448 164L448 210L205 210C246 168 277 136 260 104C244 74 184 43 215 -18Z"
      />
      <path
        className="institutional-accent__middle"
        d="M283 -16C329 22 302 63 357 82C404 99 437 122 451 154L451 210L284 210C315 168 335 139 317 108C298 76 250 34 283 -16Z"
      />
      <path
        className="institutional-accent__deep"
        d="M354 -15C393 34 355 67 398 91C431 110 452 133 458 164L458 210L365 210C388 169 400 141 382 111C363 78 329 32 354 -15Z"
      />
      <path
        className="institutional-accent__route"
        d="M230 -8C274 34 252 69 300 94C342 116 352 145 323 198"
      />
    </svg>
  );
}
