export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={`brand-mark ${className}`.trim()}
      focusable="false"
      viewBox="0 0 64 54"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        className="brand-mark-first"
        d="M54 4H25C12 4 5 11 5 21s7 17 20 17h18V26H25c-5 0-7-2-7-5s2-5 7-5h29V4Z"
      />
      <path
        className="brand-mark-second"
        d="M22 19h20c12 0 18 7 18 16s-6 15-18 15H22V38h20c4 0 6-1.5 6-4s-2-4-6-4H22V19Z"
      />
      <path className="brand-mark-arrow" d="M31 25h7v-2l4 4-4 4v-2h-7v-4Z" />
    </svg>
  );
}
