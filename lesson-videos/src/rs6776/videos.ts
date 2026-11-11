// Registre des vidéos RS6776 (une entrée par vidéo). Root.tsx crée une composition
// « RS6776-X-Y-Commune » / « RS6776-X-Y-Nathalie » pour chacune, durée calculée sur la voix off.
import type React from "react";
import type { Manifest } from "./timeline";
import { Lesson11Commune, manifest as m11c } from "../lesson1_1/Commune";
import { Lesson11Nathalie, manifest as m11n } from "../lesson1_1/Nathalie";
import { Lesson12Commune, manifest as m12c } from "../lesson1_2/Commune";
import { Lesson12Nathalie, manifest as m12n } from "../lesson1_2/Nathalie";
import { Lesson13Commune, manifest as m13c } from "../lesson1_3/Commune";
import { Lesson13Nathalie, manifest as m13n } from "../lesson1_3/Nathalie";
import { Lesson14Commune, manifest as m14c } from "../lesson1_4/Commune";
import { Lesson14Nathalie, manifest as m14n } from "../lesson1_4/Nathalie";
import { Lesson15Commune, manifest as m15c } from "../lesson1_5/Commune";
import { Lesson15Nathalie, manifest as m15n } from "../lesson1_5/Nathalie";
import { Lesson16Commune, manifest as m16c } from "../lesson1_6/Commune";
import { Lesson16Nathalie, manifest as m16n } from "../lesson1_6/Nathalie";
import { Lesson21Commune, manifest as m21c } from "../lesson2_1/Commune";
import { Lesson21Nathalie, manifest as m21n } from "../lesson2_1/Nathalie";
import { Lesson22Commune, manifest as m22c } from "../lesson2_2/Commune";
import { Lesson22Nathalie, manifest as m22n } from "../lesson2_2/Nathalie";
import { Lesson23Commune, manifest as m23c } from "../lesson2_3/Commune";
import { Lesson23Nathalie, manifest as m23n } from "../lesson2_3/Nathalie";
import { Lesson24Commune, manifest as m24c } from "../lesson2_4/Commune";
import { Lesson24Nathalie, manifest as m24n } from "../lesson2_4/Nathalie";
import { Lesson25Commune, manifest as m25c } from "../lesson2_5/Commune";
import { Lesson25Nathalie, manifest as m25n } from "../lesson2_5/Nathalie";
import { Lesson31Commune, manifest as m31c } from "../lesson3_1/Commune";
import { Lesson31Nathalie, manifest as m31n } from "../lesson3_1/Nathalie";
import { Lesson32Commune, manifest as m32c } from "../lesson3_2/Commune";
import { Lesson32Nathalie, manifest as m32n } from "../lesson3_2/Nathalie";

export type RsVideo = { id: string; component: React.FC; manifest: Manifest };

export const RS6776_VIDEOS: RsVideo[] = [
  { id: "RS6776-1-1-Commune", component: Lesson11Commune, manifest: m11c },
  { id: "RS6776-1-1-Nathalie", component: Lesson11Nathalie, manifest: m11n },
  { id: "RS6776-1-2-Commune", component: Lesson12Commune, manifest: m12c },
  { id: "RS6776-1-2-Nathalie", component: Lesson12Nathalie, manifest: m12n },
  { id: "RS6776-1-3-Commune", component: Lesson13Commune, manifest: m13c },
  { id: "RS6776-1-3-Nathalie", component: Lesson13Nathalie, manifest: m13n },
  { id: "RS6776-1-4-Commune", component: Lesson14Commune, manifest: m14c },
  { id: "RS6776-1-4-Nathalie", component: Lesson14Nathalie, manifest: m14n },
  { id: "RS6776-1-5-Commune", component: Lesson15Commune, manifest: m15c },
  { id: "RS6776-1-5-Nathalie", component: Lesson15Nathalie, manifest: m15n },
  { id: "RS6776-1-6-Commune", component: Lesson16Commune, manifest: m16c },
  { id: "RS6776-1-6-Nathalie", component: Lesson16Nathalie, manifest: m16n },
  { id: "RS6776-2-1-Commune", component: Lesson21Commune, manifest: m21c },
  { id: "RS6776-2-1-Nathalie", component: Lesson21Nathalie, manifest: m21n },
  { id: "RS6776-2-2-Commune", component: Lesson22Commune, manifest: m22c },
  { id: "RS6776-2-2-Nathalie", component: Lesson22Nathalie, manifest: m22n },
  { id: "RS6776-2-3-Commune", component: Lesson23Commune, manifest: m23c },
  { id: "RS6776-2-3-Nathalie", component: Lesson23Nathalie, manifest: m23n },
  { id: "RS6776-2-4-Commune", component: Lesson24Commune, manifest: m24c },
  { id: "RS6776-2-4-Nathalie", component: Lesson24Nathalie, manifest: m24n },
  { id: "RS6776-2-5-Commune", component: Lesson25Commune, manifest: m25c },
  { id: "RS6776-2-5-Nathalie", component: Lesson25Nathalie, manifest: m25n },
  { id: "RS6776-3-1-Commune", component: Lesson31Commune, manifest: m31c },
  { id: "RS6776-3-1-Nathalie", component: Lesson31Nathalie, manifest: m31n },
  { id: "RS6776-3-2-Commune", component: Lesson32Commune, manifest: m32c },
  { id: "RS6776-3-2-Nathalie", component: Lesson32Nathalie, manifest: m32n },
];
