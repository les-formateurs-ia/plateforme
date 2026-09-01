// Confirmation animée (cercle + coche fins qui se "dessinent") affichée après
// une action de planning réussie (réservation, changement, acceptation…).
export function SuccessCheck({ size = 72 }: { size?: number }) {
  return (
    <div className="flex items-center justify-center" style={{ width: size, height: size }}>
      <style>{`
        @keyframes successCheckCircle { to { stroke-dashoffset: 0; } }
        @keyframes successCheckMark { to { stroke-dashoffset: 0; } }
        @keyframes successCheckPop { 0% { transform: scale(0.85); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
      `}</style>
      <svg width={size} height={size} viewBox="0 0 72 72" fill="none" style={{ animation: "successCheckPop 0.3s ease-out" }}>
        <circle
          cx="36" cy="36" r="32"
          stroke="#6adeb1" strokeWidth="2.5"
          strokeDasharray="201"
          strokeDashoffset="201"
          style={{ animation: "successCheckCircle 0.6s ease-out forwards" }}
        />
        <path
          d="M22 37 L31 46 L50 26"
          stroke="#6adeb1" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
          strokeDasharray="40"
          strokeDashoffset="40"
          style={{ animation: "successCheckMark 0.35s ease-out 0.5s forwards" }}
        />
      </svg>
    </div>
  );
}
