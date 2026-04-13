import { useId } from "react";

export function DentalLogo({ className = "w-10 h-10" }: { className?: string }) {
  const id = useId();
  const goldId = `${id}-gold`;
  const toothId = `${id}-tooth`;
  const glowId = `${id}-glow`;

  return (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={goldId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFD700" />
          <stop offset="50%" stopColor="#DAA520" />
          <stop offset="100%" stopColor="#B8860B" />
        </linearGradient>
        <linearGradient id={toothId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#e8e8e8" />
        </linearGradient>
        <filter id={glowId}>
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <circle cx="50" cy="50" r="46" stroke={`url(#${goldId})`} strokeWidth="2.5" fill="none" opacity="0.8" />
      <circle cx="50" cy="50" r="42" stroke={`url(#${goldId})`} strokeWidth="0.5" fill="none" opacity="0.3" />
      <path
        d="M38 35 C38 22, 44 16, 50 14 C56 16, 62 22, 62 35 L64 58 C64 65, 60 72, 57 78 C55 82, 53 85, 52 86 C51 87, 49 87, 48 86 C47 85, 45 82, 43 78 C40 72, 36 65, 36 58 Z"
        fill={`url(#${toothId})`}
        filter={`url(#${glowId})`}
      />
      <path
        d="M42 34 C42 28, 46 22, 50 20 C50 20, 44 26, 44 34 C44 40, 42 45, 40 50 Z"
        fill="white"
        opacity="0.6"
      />
      <path d="M32 28 C32 22, 38 18, 42 20" stroke={`url(#${goldId})`} strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M68 28 C68 22, 62 18, 58 20" stroke={`url(#${goldId})`} strokeWidth="2" strokeLinecap="round" fill="none" />
      <circle cx="50" cy="10" r="3" fill={`url(#${goldId})`} opacity="0.8" />
      <circle cx="35" cy="15" r="2" fill={`url(#${goldId})`} opacity="0.6" />
      <circle cx="65" cy="15" r="2" fill={`url(#${goldId})`} opacity="0.6" />
    </svg>
  );
}
