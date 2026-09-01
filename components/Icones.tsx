type Props = { className?: string };

const base = "h-6 w-6";

export function IconeJardim({ className = base }: Props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className} aria-hidden>
      <path d="M12 21V11" strokeLinecap="round" />
      <path d="M12 13c0-3.3 2.5-6 5.5-6 .3 3.6-2 6.6-5.5 7z" strokeLinejoin="round" />
      <path d="M12 16c0-3-2.2-5.5-5-5.5-.3 3.3 1.9 6 5 6.4z" strokeLinejoin="round" />
      <path d="M7 21h10" strokeLinecap="round" />
    </svg>
  );
}

export function IconeCamera({ className = base }: Props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className} aria-hidden>
      <path d="M3 8.5A2.5 2.5 0 0 1 5.5 6h1.7a1 1 0 0 0 .83-.45l.94-1.4A1 1 0 0 1 9.8 3.7h4.4a1 1 0 0 1 .83.45l.94 1.4a1 1 0 0 0 .83.45h1.7A2.5 2.5 0 0 1 21 8.5v9a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5z" strokeLinejoin="round" />
      <circle cx="12" cy="13" r="3.4" />
    </svg>
  );
}

export function IconeGota({ className = base }: Props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className} aria-hidden>
      <path d="M12 3.5c3.2 3.7 5.5 6.6 5.5 9.4a5.5 5.5 0 0 1-11 0c0-2.8 2.3-5.7 5.5-9.4z" strokeLinejoin="round" />
    </svg>
  );
}

export function IconeAjustes({ className = base }: Props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className} aria-hidden>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M19.4 14.5a1.6 1.6 0 0 0 .32 1.77l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.6 1.6 0 0 0-1.77-.32 1.6 1.6 0 0 0-.97 1.47V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1.05-1.46 1.6 1.6 0 0 0-1.77.32l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.6 1.6 0 0 0 .32-1.77 1.6 1.6 0 0 0-1.47-.97H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.46-1.05 1.6 1.6 0 0 0-.32-1.77l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.6 1.6 0 0 0 1.77.32H9a1.6 1.6 0 0 0 .97-1.47V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 .97 1.47 1.6 1.6 0 0 0 1.77-.32l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.6 1.6 0 0 0-.32 1.77V9a1.6 1.6 0 0 0 1.47.97H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.47.97z" strokeLinejoin="round" />
    </svg>
  );
}

export function IconeSol({ className = base }: Props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className} aria-hidden>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" strokeLinecap="round" />
    </svg>
  );
}

export function IconeFolhaSeca({ className = base }: Props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className} aria-hidden>
      <path d="M5 19c0-8 5-14 14-14 0 8-5.5 13.4-14 14z" strokeLinejoin="round" />
      <path d="M5 19 15 9" strokeLinecap="round" />
    </svg>
  );
}

export function IconeAdubo({ className = base }: Props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className} aria-hidden>
      <path d="M6 9h12l-1.2 9.2a2 2 0 0 1-2 1.8H9.2a2 2 0 0 1-2-1.8z" strokeLinejoin="round" />
      <path d="M9 9V6.5a3 3 0 0 1 6 0V9" strokeLinecap="round" />
      <path d="M10 13.5h4M12 11.5v4" strokeLinecap="round" />
    </svg>
  );
}

export function IconeVoltar({ className = base }: Props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden>
      <path d="M15 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconeFlor({ className = base }: Props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className} aria-hidden>
      <circle cx="12" cy="8.2" r="2.1" />
      <path d="M12 6.1a2.6 2.6 0 1 1 0-1.4M14.1 7.4a2.6 2.6 0 1 1 1.2-.7M14.1 9a2.6 2.6 0 1 1 1.2.7M9.9 7.4a2.6 2.6 0 1 0-1.2-.7M9.9 9a2.6 2.6 0 1 0-1.2.7" strokeLinejoin="round" />
      <path d="M12 10.3V21" strokeLinecap="round" />
      <path d="M12 15.5c0-2 1.6-3.6 3.6-3.6.2 2.2-1.4 3.9-3.6 4.1z" strokeLinejoin="round" />
      <path d="M12 18c0-1.8-1.5-3.2-3.3-3.2-.2 2 1.3 3.5 3.3 3.7z" strokeLinejoin="round" />
    </svg>
  );
}

export function IconeJardins({ className = base }: Props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className} aria-hidden>
      <path d="M12 21s6.5-5.1 6.5-9.6a6.5 6.5 0 0 0-13 0C5.5 15.9 12 21 12 21z" strokeLinejoin="round" />
      <circle cx="12" cy="11" r="2.4" />
    </svg>
  );
}

export function IconeMais({ className = base }: Props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden>
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}
