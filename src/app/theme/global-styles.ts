import { hexToRgb } from "@/app/theme/theme";

export const mkCSS = (isDark: boolean, accentHex: string) => {
  const accent = hexToRgb(accentHex);
  return `
  @keyframes shimmer {
    0%   { background-position: 200% center; }
    100% { background-position: -200% center; }
  }
  @keyframes orb-drift {
    0%,100% { transform: translate(0,0) scale(1); }
    33%     { transform: translate(24px,-36px) scale(1.06); }
    66%     { transform: translate(-18px,22px) scale(0.96); }
  }
  @keyframes orb-drift-b {
    0%,100% { transform: translate(0,0) scale(1); }
    40%     { transform: translate(-30px,18px) scale(1.04); }
    75%     { transform: translate(14px,-24px) scale(0.97); }
  }
  @keyframes fade-up {
    from { opacity:0; transform:translateY(14px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes bounce-dot {
    0%,80%,100% { transform:scale(0); }
    40%         { transform:scale(1); }
  }
  @keyframes dot-blink {
    0%,100% { opacity:1; }
    50%     { opacity:0.3; }
  }
  .fade-up { animation: fade-up 0.4s ease both; }
  .g-input {
    background: ${isDark ? "rgba(255,255,255,0.04)" : "#fff"};
    border: 1px solid ${isDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.16)"};
    color: ${isDark ? "#fff" : "#000"};
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .g-input::placeholder { color: ${isDark ? "rgba(255,255,255,0.38)" : "rgba(0,0,0,0.38)"}; }
  @media (hover: hover) and (pointer: fine) {
    .g-input:hover:not(:focus):not(:disabled) { border-color: ${isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)"}; }
  }
  /* Focus à l'encre, comme les champs du site public. */
  .g-input:focus {
    outline: none;
    border-color: rgb(${accent});
    box-shadow: 0 0 0 1px rgb(${accent});
  }
  * { scrollbar-width:none; }
  ::-webkit-scrollbar { display:none; width:0; height:0; }
`;
};
