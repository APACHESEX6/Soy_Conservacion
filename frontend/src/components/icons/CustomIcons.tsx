//iconos personalizados para fauna y flora

export function SpiderIcon({
  className,
  strokeWidth = 2,
}: {
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M10 5v1" />
      <path d="M14 6V5" />
      <path d="M10 10.4V8a2 2 0 1 1 4 0v2.4" />
      <path d="M7 15H4l-2 2.5" />
      <path d="M7.42 17 5 20l1 2" />
      <path d="m8 12-4-1-2-3" />
      <path d="M9 11 5.5 6 7 2" />
      <path d="M8 18a5 5 0 1 1 8 0s-2 3-4 4c-2-1-4-4-4-4" />
      <path d="m15 11 3.5-5L17 2" />
      <path d="m16 12 4-1 2-3" />
      <path d="M17 15h3l2 2.5" />
      <path d="M16.57 17 19 20l-1 2" />
    </svg>
  );
}

export function ChameleonIcon({
  className,
  strokeWidth = 2,
}: {
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M11 22c-5 0-9-4.5-9-10S6 2 11 2c2.2 0 4.2.9 5.7 2.3L19.3 2c3.1 3.1 3.5 7.9 1.3 11.4-.6.9-1.9.9-2.7.1l-1.2-1.2C15.2 10.9 13.2 10 11 10a6 6 0 0 0 0 12 4 4 0 0 0 0-8 2 2 0 0 0 0 4" />
      <path d="M14 7h.01" />
      <circle cx="14.5" cy="7" r="3.5" />
      <path d="M8 10.8 6 10l1-2" />
      <path d="M22 22a2 2 0 0 1-2-2v-6.1" />
    </svg>
  );
}

export function SnailIcon({
  className,
  strokeWidth = 2,
}: {
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M2 13a6 6 0 1 0 12 0 4 4 0 1 0-8 0 2 2 0 0 0 4 0" />
      <circle cx="10" cy="13" r="8" />
      <path d="M2 21h12c4.4 0 8-3.6 8-8V7a2 2 0 1 0-4 0v6" />
      <path d="M18 3 19.1 5.2" />
      <path d="M22 3 20.9 5.2" />
    </svg>
  );
}

export function FrogIcon({
  className,
  strokeWidth = 2,
}: {
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M6 7h.01" />
      <circle cx="6" cy="7" r="4" />
      <path d="M14.4 5.3a10 10 0 0 0-4.8 0" />
      <circle cx="18" cy="7" r="4" />
      <path d="M18 7h.01" />
      <path d="M22 13.5C22 16 17.5 18 12 18S2 16 2 13.5" />
      <path d="M10 14h.01" />
      <path d="M14 14h.01" />
      <path d="M3.1 9.75A7 7 0 0 0 2 13.5C2 18.2 6.5 22 12 22s10-3.8 10-8.5a7 7 0 0 0-1.1-3.75" />
    </svg>
  );
}

export function MushroomIcon({
  className,
  strokeWidth = 2,
}: {
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M3 12C3 7 7 3 12 3C17 3 21 7 21 12Z" />
      <path d="M3 12C5 13 7 13.5 9 13.5C10 13.5 10 15 10 15" />
      <path d="M21 12C19 13 17 13.5 15 13.5C14 13.5 14 15 14 15" />
      <path d="M10 15C10 15 9.5 20 12 20C14.5 20 14 15 14 15" />
      <path d="M9 20C9 21.1 10.3 22 12 22C13.7 22 15 21.1 15 20" />
      <circle cx="9" cy="8" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="12" cy="6" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="15" cy="8" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="11" cy="10" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="14" cy="10.5" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}
export function MonkeyIcon({
  className,
  strokeWidth = 2,
}: {
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
      <path d="M16 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
      <path d="M7 15c-3 0-5 2-5 5" />
      <path d="M17 15c3 0 5 2 5 5" />
      <path d="M12 12a5 5 0 1 0 0 10 5 5 0 0 0 0-10Z" />
      <path d="M12 15v.01" />
      <path d="M10 18c.5 1 1.5 1.5 2 1.5s1.5-.5 2-1.5" />
      <path d="M9 10c0-4 3-7 3-7s3 3 3 7" />
    </svg>
  );
}
