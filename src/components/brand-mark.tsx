export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={`brand-mark ${className}`.trim()}
      focusable="false"
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        className="brand-mark-first"
        d="M48 7H23C11.5 7 5 13.8 5 23.5S11.5 40 23 40h16V28H23c-4.1 0-6-1.6-6-4.5s1.9-4.5 6-4.5h25V7Z"
      />
      <path
        className="brand-mark-second"
        d="M16 24h25c11.5 0 18 6.8 18 16.5S52.5 57 41 57H16V45h25c4.1 0 6-1.6 6-4.5S45.1 36 41 36H16V24Z"
      />
      <path className="brand-mark-equals" d="M25 29h14v3H25zm0 6h14v3H25z" />
    </svg>
  );
}
