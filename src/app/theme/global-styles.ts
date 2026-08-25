export const mkCSS = (isDark: boolean) => `
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
    background: ${isDark ? "rgba(255,255,255,0.05)" : "rgba(15,14,20,0.03)"};
    border: 1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(15,14,20,0.1)"};
    color: ${isDark ? "rgba(255,255,255,0.9)" : "rgba(15,14,20,0.9)"};
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .g-input::placeholder { color: ${isDark ? "rgba(255,255,255,0.3)" : "rgba(15,14,20,0.3)"}; }
  .g-input:focus {
    outline: none;
    border-color: rgba(181,141,224,0.5);
    box-shadow: 0 0 0 3px rgba(181,141,224,0.12);
  }
  ::-webkit-scrollbar { width:4px; height:4px; }
  ::-webkit-scrollbar-track { background:transparent; }
  ::-webkit-scrollbar-thumb { background:rgba(181,141,224,0.2); border-radius:4px; }
`;
