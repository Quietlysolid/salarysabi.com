export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={`brand-mark ${className}`.trim()}
      focusable="false"
      viewBox="0 0 96 72"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        className="brand-mark-first"
        d="M72 6H35C20.5 6 12 13.5 12 25s8.5 19 23 19h24V31H35c-5.2 0-8-2.1-8-6s2.8-6 8-6h37V6Z"
      />
      <path
        className="brand-mark-second"
        d="M39 27h22c14.5 0 23 7.5 23 19S75.5 66 61 66H29V53h32c5.2 0 8-2.6 8-7s-2.8-6-8-6H39V27Z"
      />
      <path className="brand-mark-arrow" d="M11 42h48v-3l8 7-8 7v-3H11v-8Z" />
    </svg>
  );
}
