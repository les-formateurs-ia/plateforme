import React from "react";

// Pictos au trait (style Lucide, comme la plateforme).
const S: React.FC<{ size?: number; color?: string; children: React.ReactNode }> = ({
  size = 36,
  color = "currentColor",
  children,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {children}
  </svg>
);

type P = { size?: number; color?: string };

export const IconMail: React.FC<P> = (p) => (
  <S {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3 7 9 6 9-6" />
  </S>
);
export const IconFilm: React.FC<P> = (p) => (
  <S {...p}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M7 3v18M17 3v18M3 8h4M17 8h4M3 16h4M17 16h4" />
  </S>
);
export const IconImage: React.FC<P> = (p) => (
  <S {...p}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="9" cy="9" r="2" />
    <path d="m21 15-4-4L5 21" />
  </S>
);
export const IconCheck: React.FC<P> = (p) => (
  <S {...p}>
    <path d="M20 6 9 17l-5-5" />
  </S>
);
export const IconX: React.FC<P> = (p) => (
  <S {...p}>
    <path d="M18 6 6 18M6 6l12 12" />
  </S>
);
export const IconSparkle: React.FC<P> = (p) => (
  <S {...p}>
    <path d="M12 3c.6 4.2 2.8 6.4 7 7-4.2.6-6.4 2.8-7 7-.6-4.2-2.8-6.4-7-7 4.2-.6 6.4-2.8 7-7Z" />
  </S>
);
export const IconEye: React.FC<P> = (p) => (
  <S {...p}>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
    <circle cx="12" cy="12" r="3" />
  </S>
);
export const IconRepeat: React.FC<P> = (p) => (
  <S {...p}>
    <path d="m17 2 4 4-4 4" />
    <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
    <path d="m7 22-4-4 4-4" />
    <path d="M21 13v1a4 4 0 0 1-4 4H3" />
  </S>
);
export const IconAlert: React.FC<P> = (p) => (
  <S {...p}>
    <path d="m21.7 18-8-14a2 2 0 0 0-3.4 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3Z" />
    <path d="M12 9v4M12 17h.01" />
  </S>
);
export const IconShield: React.FC<P> = (p) => (
  <S {...p}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
    <path d="m9 12 2 2 4-4" />
  </S>
);
export const IconHeadphones: React.FC<P> = (p) => (
  <S {...p}>
    <path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3" />
  </S>
);
export const IconCode: React.FC<P> = (p) => (
  <S {...p}>
    <path d="m16 18 6-6-6-6M8 6l-6 6 6 6" />
  </S>
);
export const IconWave: React.FC<P> = (p) => (
  <S {...p}>
    <path d="M2 10v3M6 6v11M10 3v18M14 8v7M18 5v13M22 10v3" />
  </S>
);
export const IconText: React.FC<P> = (p) => (
  <S {...p}>
    <path d="M4 7V4h16v3M9 20h6M12 4v16" />
  </S>
);
export const IconBrain: React.FC<P> = (p) => (
  <S {...p}>
    <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
    <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
    <path d="M12 5v13" />
  </S>
);
