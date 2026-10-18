import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Cursor } from "../../components/Cursor";
import { Eyebrow, GradText, Reveal, RiseLines, baseText } from "../../components/ui";
import { C, EASE, GRAD, clamp } from "../../theme";
import { CONTENT_Y, WIN, Window } from "../Window";

// 43,9 → 71 s. Temps locaux = temps audio − 43,9.
const OUT = 26.55;
const SWAP = 11.0; // page d'accueil → connexion Google
const EMAIL = "prenom.nom@gmail.com";

const Landing: React.FC<{ o: number }> = ({ o }) => (
  <div style={{ position: "absolute", inset: 0, opacity: o }}>
    <div style={{ position: "absolute", left: 26, top: 22, display: "flex", alignItems: "center", gap: 10, fontSize: 22, fontWeight: 600 }}>
      <Img src={staticFile("tools/gemini.png")} style={{ width: 26, height: 26 }} /> Gemini
    </div>
    <div
      style={{
        position: "absolute",
        right: 20,
        top: 22,
        width: 130,
        height: 40,
        borderRadius: 999,
        backgroundImage: GRAD.bleu,
        color: "#0b1a16",
        fontSize: 18,
        fontWeight: 700,
        display: "grid",
        placeItems: "center",
      }}
    >
      Se connecter
    </div>
    <div style={{ position: "absolute", left: 0, right: 0, top: 190, textAlign: "center", fontSize: 40, fontWeight: 600, color: C.fg }}>
      Découvrez Gemini, votre assistant IA personnel
    </div>
    <div
      style={{
        position: "absolute",
        left: 290,
        right: 290,
        top: 270,
        height: 62,
        borderRadius: 999,
        background: "rgba(255,255,255,0.06)",
        border: `1px solid ${C.hairline2}`,
        display: "flex",
        alignItems: "center",
        padding: "0 26px",
        fontSize: 20,
        color: C.fg3,
      }}
    >
      + &nbsp; Demander à Gemini
    </div>
  </div>
);

const SignIn: React.FC<{ o: number }> = ({ o }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const n = Math.floor(interpolate(frame, [12.4 * fps, 14.4 * fps], [0, EMAIL.length], clamp));
  const t = frame / fps;
  const caret = t > 12.0 && t < 15.2 && Math.floor(t * 2) % 2 === 0;
  const link = interpolate(t, [15.6, 16.2], [0, 1], clamp);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: o }}>
      <div
        style={{
          position: "absolute",
          left: 220,
          top: 110,
          width: 760,
          height: 340,
          borderRadius: 28,
          background: "#16151E",
          border: `1px solid ${C.hairline2}`,
        }}
      >
        <div style={{ position: "absolute", left: 40, top: 40 }}>
          <div
            style={{
              fontSize: 44,
              fontWeight: 800,
              backgroundImage: "conic-gradient(from 200deg, #4285F4, #34A853, #FBBC05, #EA4335, #4285F4)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
              lineHeight: 1,
            }}
          >
            G
          </div>
          <div style={{ marginTop: 24, fontSize: 36, fontWeight: 600 }}>Connexion</div>
          <div style={{ marginTop: 10, fontSize: 18, color: C.fg2 }}>Utilisez votre compte Google</div>
        </div>
        <div
          style={{
            position: "absolute",
            left: 400,
            top: 90,
            width: 320,
            height: 52,
            borderRadius: 10,
            border: `1.5px solid ${n > 0 ? C.bleu : C.hairline2}`,
            display: "flex",
            alignItems: "center",
            padding: "0 16px",
            fontSize: 19,
            color: n > 0 ? C.fg : C.fg3,
          }}
        >
          {n > 0 ? EMAIL.slice(0, n) : "Adresse e-mail ou téléphone"}
          <span style={{ opacity: caret ? 1 : 0, color: C.bleu }}>|</span>
        </div>
        <div style={{ position: "absolute", left: 400, top: 156, fontSize: 16, color: C.bleu, fontWeight: 600 }}>Adresse e-mail oubliée ?</div>
        <div
          style={{
            position: "absolute",
            left: 400,
            top: 248,
            padding: "8px 14px",
            borderRadius: 999,
            fontSize: 18,
            fontWeight: 700,
            color: C.bleu,
            background: `rgba(120,213,226,${link * 0.18})`,
            boxShadow: `inset 0 0 0 1px rgba(120,213,226,${link * 0.6})`,
          }}
        >
          Créer un compte
        </div>
        <div
          style={{
            position: "absolute",
            left: 620,
            top: 246,
            width: 110,
            height: 42,
            borderRadius: 999,
            backgroundImage: GRAD.bleu,
            color: "#0b1a16",
            fontSize: 18,
            fontWeight: 700,
            display: "grid",
            placeItems: "center",
          }}
        >
          Suivant
        </div>
      </div>
    </div>
  );
};

const Chip: React.FC<{ at: number; children: React.ReactNode }> = ({ at, children }) => (
  <Reveal at={at} out={OUT} y={10}>
    <div
      style={{
        padding: "8px 18px",
        borderRadius: 999,
        border: "1px solid rgba(219,172,240,0.45)",
        background: "rgba(181,141,224,0.14)",
        fontSize: 21,
        fontWeight: 700,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </div>
  </Reveal>
);

export const Account: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const swap = interpolate(frame, [SWAP * fps, (SWAP + 0.6) * fps], [0, 1], { ...clamp, easing: EASE });
  const btn = { x: WIN.x + WIN.w - 85, y: CONTENT_Y + 42 };
  const field = { x: WIN.x + 220 + 520, y: CONTENT_Y + 110 + 116 };
  const create = { x: WIN.x + 220 + 470, y: CONTENT_Y + 110 + 268 };

  return (
    <AbsoluteFill style={{ ...baseText }}>
      <div style={{ position: "absolute", left: 160, top: 100 }}>
        <Reveal at={0.2} out={OUT}>
          <Eyebrow color={C.bleu}>Étape 1</Eyebrow>
        </Reveal>
        <RiseLines
          at={0.4}
          out={OUT}
          style={{ marginTop: 14, fontSize: 56, fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.04 }}
          lines={[
            <span key="t">
              Créer <GradText grad={GRAD.bleu}>votre compte</GradText>
            </span>,
          ]}
        />
      </div>

      <Window url={swap < 0.5 ? "gemini.google.com" : "accounts.google.com"} out={OUT} enterAt={0.3}>
        <Landing o={1 - swap} />
        <SignIn o={swap} />
        <div style={{ position: "absolute", left: 220, top: 480, display: "flex", alignItems: "center", gap: 12 }}>
          <Reveal at={20.1} out={OUT}>
            <div style={{ fontSize: 21, fontWeight: 600, color: C.fg2, whiteSpace: "nowrap" }}>Pour les autres IA, même principe :</div>
          </Reveal>
          <Chip at={24.6}>Une adresse e-mail</Chip>
          <Chip at={25.6}>ou un compte tiers</Chip>
        </div>
      </Window>

      <Cursor
        from={4.4}
        to={OUT}
        keys={[
          { t: 4.4, x: WIN.x + 600, y: CONTENT_Y + 400 },
          { t: 8.6, x: btn.x, y: btn.y },
          { t: 9.1, x: btn.x, y: btn.y, click: true },
          { t: 11.4, x: btn.x, y: btn.y },
          { t: 12.2, x: field.x, y: field.y },
          { t: 15.4, x: field.x, y: field.y },
          { t: 16.2, x: create.x, y: create.y },
          { t: 16.4, x: create.x, y: create.y, click: true },
          { t: 26.0, x: create.x, y: create.y },
        ]}
      />
    </AbsoluteFill>
  );
};
