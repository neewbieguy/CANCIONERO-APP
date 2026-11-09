import { cn } from "@/lib/utils";

/** Logo de Cancionero (nota musical sobre cuadrado azul). */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 512 512" className={cn("h-9 w-9", className)} aria-hidden>
      <defs>
        <linearGradient id="logo-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3b86ff" />
          <stop offset="1" stopColor="#1257d9" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="120" fill="url(#logo-g)" />
      <g fill="#fff">
        <path d="M214 146 L398 112 L398 170 L214 204 Z" />
        <rect x="214" y="146" width="24" height="210" rx="6" />
        <rect x="374" y="112" width="24" height="210" rx="6" />
        <ellipse cx="184" cy="360" rx="58" ry="44" transform="rotate(-18 184 360)" />
        <ellipse cx="344" cy="326" rx="58" ry="44" transform="rotate(-18 344 326)" />
      </g>
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2 font-semibold tracking-tight", className)}>
      <LogoMark className="h-8 w-8" />
      Cancionero
    </span>
  );
}
