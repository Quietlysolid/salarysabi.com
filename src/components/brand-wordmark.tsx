import { BrandMark } from "@/components/brand-mark";

export function BrandWordmark({ className = "" }: { className?: string }) {
  return (
    <span aria-hidden="true" className={`brand-wordmark ${className}`.trim()}>
      <BrandMark className="brand-wordmark-mark" />
      <span className="brand-wordmark-text">alary<span className="brand-accent">Sab<span className="brand-i">i</span></span></span>
    </span>
  );
}
