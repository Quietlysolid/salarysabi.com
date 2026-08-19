export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={`brand-mark ${className}`.trim()}
      focusable="false"
      viewBox="25 15.25 133 112"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        className="brand-mark-upper-curve"
        d="M111 30H61C47 30 40 35 40 43.75S47 57.5 61 57.5h18"
      />
      <path
        className="brand-mark-lower-curve"
        d="M86.5 57.5H115c18 0 28 10 28 27.5s-10 27.5-28 27.5H70"
      />
      <path
        className="brand-mark-middle"
        d="M30 75h85.5a10 10 0 0 1 0 20H30V75Z"
      />
    </svg>
  );
}
