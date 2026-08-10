export function BrandWordmark({ className = "" }: { className?: string }) {
  return (
    <span aria-hidden="true" className={`brand-wordmark ${className}`.trim()}>
      Salary<span className="brand-accent">Sab<span className="brand-i">i</span></span>
    </span>
  );
}
