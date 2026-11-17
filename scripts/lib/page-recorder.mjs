// Capture et film d'une page HTML avec le navigateur Edge/Chrome déjà installé
// sur la machine, piloté en headless via le protocole DevTools (WebSocket
// natif de Node) : aucune dépendance npm, aucun ffmpeg.
//   - screenshot : JPEG du haut de la page (1440 × 900, après les animations
//     d'entrée) ;
//   - record : MP4 H.264 du chargement puis d'un défilement jusqu'en bas de
//     page. Les images viennent de Page.startScreencast ; elles sont rejouées
//     à leur rythme réel sur un <canvas> enregistré par MediaRecorder dans un
//     second onglet (le navigateur sait encoder en MP4 depuis Chromium 126).
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

const BROWSERS = [
  process.env.ASTUCES_BROWSER,
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
].filter(Boolean);

const SHOT = { width: 1440, height: 900 };
const FILM = { width: 1280, height: 800, bitrate: 1_600_000 };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Une connexion CDP par onglet.
async function connect(wsUrl) {
  const ws = new WebSocket(wsUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve, { once: true });
    ws.addEventListener("error", () => reject(new Error("connexion DevTools impossible")), { once: true });
  });
  let nextId = 0;
  const pending = new Map();
  const listeners = new Map();
  ws.addEventListener("message", (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(`${msg.error.message}`));
      else resolve(msg.result);
    } else if (msg.method) {
      for (const fn of listeners.get(msg.method) ?? []) fn(msg.params);
    }
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++nextId;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
  const on = (method, fn) => {
    if (!listeners.has(method)) listeners.set(method, new Set());
    listeners.get(method).add(fn);
    return () => listeners.get(method).delete(fn);
  };
  const once = (method, timeoutMs = 30000) => new Promise((resolve, reject) => {
    const timer = setTimeout(() => { off(); reject(new Error(`${method} : délai dépassé`)); }, timeoutMs);
    const off = on(method, (params) => { clearTimeout(timer); off(); resolve(params); });
  });
  const evaluate = async (expression) => {
    const res = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
    if (res.exceptionDetails) throw new Error(res.exceptionDetails.exception?.description ?? res.exceptionDetails.text);
    return res.result.value;
  };
  return { send, on, once, evaluate, close: () => ws.close() };
}

export async function openPageRecorder() {
  const browser = BROWSERS.find((p) => existsSync(p));
  if (!browser) throw new Error("Aucun navigateur Edge/Chrome trouvé (variable ASTUCES_BROWSER pour en indiquer un).");
  const workDir = mkdtempSync(path.join(tmpdir(), "astuces-pages-"));
  const port = 9400 + Math.floor(Math.random() * 400);
  const proc = spawn(browser, [
    "--headless=new", `--remote-debugging-port=${port}`, `--user-data-dir=${path.join(workDir, "profile")}`,
    "--hide-scrollbars", "--mute-audio", "--no-first-run", "--no-default-browser-check",
    // Les deux onglets (page filmée + encodeur) doivent tourner à plein régime.
    "--disable-background-timer-throttling", "--disable-renderer-backgrounding", "--disable-backgrounding-occluded-windows",
    "--window-size=1440,900", "about:blank",
  ], { stdio: "ignore" });

  const http = `http://127.0.0.1:${port}`;
  for (let i = 0; ; i++) {
    try { if ((await fetch(`${http}/json/version`)).ok) break; } catch { /* pas encore prêt */ }
    if (i > 75) { proc.kill(); throw new Error("Le navigateur headless ne répond pas."); }
    await sleep(200);
  }

  const newTab = async () => {
    const target = await (await fetch(`${http}/json/new?about:blank`, { method: "PUT" })).json();
    const tab = await connect(target.webSocketDebuggerUrl);
    await tab.send("Page.enable");
    await tab.send("Runtime.enable");
    await tab.send("Emulation.setFocusEmulationEnabled", { enabled: true });
    return { ...tab, close: async () => { tab.close(); await fetch(`${http}/json/close/${target.id}`).catch(() => {}); } };
  };

  let fileIndex = 0;
  const writeHtml = (html) => {
    const file = path.join(workDir, `page-${++fileIndex}.html`);
    writeFileSync(file, html);
    return pathToFileURL(file).href;
  };

  // Les tâches passent une par une : un seul navigateur, des mesures fiables.
  let queue = Promise.resolve();
  const serial = (fn) => {
    const run = queue.then(fn, fn);
    queue = run.catch(() => {});
    return run;
  };

  async function screenshot(html) {
    const tab = await newTab();
    try {
      await tab.send("Emulation.setDeviceMetricsOverride", { ...SHOT, deviceScaleFactor: 1, mobile: false });
      const loaded = tab.once("Page.loadEventFired", 45000);
      await tab.send("Page.navigate", { url: writeHtml(html) });
      await loaded;
      await tab.evaluate("document.fonts.ready.then(() => true)");
      await sleep(3200); // animations d'entrée (fondus, texte qui s'écrit…)
      const { data } = await tab.send("Page.captureScreenshot", { format: "jpeg", quality: 85, captureBeyondViewport: false });
      return Buffer.from(data, "base64");
    } finally {
      await tab.close();
    }
  }

  async function record(html) {
    const tab = await newTab();
    const frames = [];
    try {
      await tab.send("Emulation.setDeviceMetricsOverride", { width: FILM.width, height: FILM.height, deviceScaleFactor: 1, mobile: false });
      tab.on("Page.screencastFrame", (params) => {
        frames.push({ data: params.data, t: params.metadata.timestamp });
        tab.send("Page.screencastFrameAck", { sessionId: params.sessionId }).catch(() => {});
      });
      const loaded = tab.once("Page.loadEventFired", 45000);
      await tab.send("Page.navigate", { url: writeHtml(html) });
      // On filme une fois la page chargée (polices comprises) : la vidéo ne
      // commence pas par un écran blanc, les animations d'entrée restent.
      await loaded;
      await tab.evaluate("document.fonts.ready.then(() => true)");
      await tab.send("Page.startScreencast", { format: "jpeg", quality: 82, maxWidth: FILM.width, maxHeight: FILM.height, everyNthFrame: 1 });
      await sleep(2000);
      // Une souris qui bouge, pour que les effets de survol (boutons,
      // curseur personnalisé, cartes 3D) apparaissent aussi dans la vidéo :
      // elle glisse jusqu'au bouton principal visible, s'y arrête, puis
      // se promène pendant le défilement.
      const move = (x, y) => tab.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: Math.round(x), y: Math.round(y) }).catch(() => {});
      const button = await tab.evaluate(`(() => {
        const visible = [...document.querySelectorAll("a, button")].map((el) => el.getBoundingClientRect())
          .filter((r) => r.width > 60 && r.height > 24 && r.top > 0 && r.bottom < innerHeight && r.left > 0 && r.right < innerWidth);
        const r = visible.sort((a, b) => b.width * b.height - a.width * a.height)[0];
        return r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : null;
      })()`);
      const from = { x: FILM.width * 0.72, y: FILM.height * 0.28 };
      const to = button ?? { x: FILM.width * 0.5, y: FILM.height * 0.6 };
      for (let i = 0; i <= 24; i++) {
        const p = i / 24;
        await move(from.x + (to.x - from.x) * p, from.y + (to.y - from.y) * p);
        await sleep(45);
      }
      await sleep(900);
      let wandering = true;
      const wander = (async () => {
        const start = Date.now();
        while (wandering) {
          const t = (Date.now() - start) / 1000;
          await move(FILM.width * (0.5 + 0.32 * Math.sin(t * 0.9)), FILM.height * (0.5 + 0.22 * Math.sin(t * 1.7)));
          await sleep(70);
        }
      })();
      // Défilement doux jusqu'en bas (≈ 1 écran par seconde, entre 5 et 10 s),
      // puis une pause : la vidéo tourne en boucle.
      await tab.evaluate(`new Promise((resolve) => {
        const root = document.scrollingElement || document.documentElement;
        root.style.scrollBehavior = "auto";
        const max = Math.max(0, root.scrollHeight - innerHeight);
        const duration = Math.min(10000, Math.max(5000, (max / innerHeight) * 1000));
        const ease = (x) => x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
        const start = performance.now();
        const step = (now) => {
          const p = Math.min(1, (now - start) / duration);
          root.scrollTop = max * ease(p);
          if (p < 1) requestAnimationFrame(step); else setTimeout(resolve, 1400);
        };
        requestAnimationFrame(step);
      })`);
      wandering = false;
      await wander;
      await tab.send("Page.stopScreencast");
    } finally {
      await tab.close();
    }
    if (frames.length < 2) throw new Error("aucune image filmée");
    return encodeMp4(frames);
  }

  async function encodeMp4(frames) {
    const tab = await newTab();
    try {
      await tab.send("Emulation.setDeviceMetricsOverride", { width: FILM.width, height: FILM.height, deviceScaleFactor: 1, mobile: false });
      await tab.evaluate("window.__frames = []; true");
      for (let i = 0; i < frames.length; i += 25) {
        await tab.evaluate(`window.__frames.push(...${JSON.stringify(frames.slice(i, i + 25))}); true`);
      }
      const base64 = await tab.evaluate(`(async () => {
        const frames = window.__frames;
        const images = await Promise.all(frames.map(async (f) => createImageBitmap(await (await fetch("data:image/jpeg;base64," + f.data)).blob())));
        const canvas = document.createElement("canvas");
        canvas.width = ${FILM.width}; canvas.height = ${FILM.height};
        document.body.appendChild(canvas);
        const ctx = canvas.getContext("2d");
        ctx.drawImage(images[0], 0, 0, canvas.width, canvas.height);
        const mimeType = MediaRecorder.isTypeSupported("video/mp4;codecs=avc1") ? "video/mp4;codecs=avc1" : "video/mp4";
        const recorder = new MediaRecorder(canvas.captureStream(30), { mimeType, videoBitsPerSecond: ${FILM.bitrate} });
        const chunks = [];
        recorder.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
        const stopped = new Promise((r) => { recorder.onstop = r; });
        recorder.start(500);
        const t0 = frames[0].t;
        const start = performance.now();
        for (let i = 0; i < frames.length; i++) {
          const wait = (frames[i].t - t0) * 1000 - (performance.now() - start);
          if (wait > 0) await new Promise((r) => setTimeout(r, wait));
          ctx.drawImage(images[i], 0, 0, canvas.width, canvas.height);
        }
        await new Promise((r) => setTimeout(r, 400));
        recorder.stop();
        await stopped;
        const blob = new Blob(chunks, { type: "video/mp4" });
        return await new Promise((r) => { const fr = new FileReader(); fr.onload = () => r(String(fr.result).split(",")[1]); fr.readAsDataURL(blob); });
      })()`);
      return Buffer.from(base64, "base64");
    } finally {
      await tab.close();
    }
  }

  return {
    screenshot: (html) => serial(() => screenshot(html)),
    record: (html) => serial(() => record(html)),
    async close() {
      proc.kill();
      await sleep(500);
      try { rmSync(workDir, { recursive: true, force: true }); } catch { /* profil encore verrouillé : tmp */ }
    },
  };
}
