import { spawn } from "node:child_process";
import open from "open";

const PORT = process.env.PORT || "3000";
const HOST = process.env.HOST || "localhost";
const url = `http://${HOST}:${PORT}`;
const PANEL_WIDTH = 78;

const reset = "\x1b[0m";
const violet = "\x1b[38;5;177m";
const pink = "\x1b[38;5;213m";
const cyan = "\x1b[38;5;117m";
const mint = "\x1b[38;5;121m";
const gold = "\x1b[38;5;222m";
const gray = "\x1b[38;5;244m";
const white = "\x1b[38;5;255m";
const red = "\x1b[38;5;203m";
const orange = "\x1b[38;5;215m";
const sky = "\x1b[38;5;153m";
const lime = "\x1b[38;5;119m";
const bold = "\x1b[1m";
const soft = "\x1b[2m";
const ANSI_PATTERN = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, "g");

const stripAnsi = (value) => value.replace(ANSI_PATTERN, "");
const panelLine = (label, value) => {
  const left = `${bold}${label}${reset} ${value}`;
  const printable = stripAnsi(left).length;
  const spaces = Math.max(1, PANEL_WIDTH - printable - 4);
  return `${violet}┃${reset} ${left}${" ".repeat(spaces)}${violet}┃${reset}`;
};
const top = `${violet}┏${"━".repeat(PANEL_WIDTH - 2)}┓${reset}`;
const mid = `${violet}┣${"━".repeat(PANEL_WIDTH - 2)}┫${reset}`;
const bottom = `${violet}┗${"━".repeat(PANEL_WIDTH - 2)}┛${reset}`;
const stamp = new Date().toLocaleTimeString("es-CO", { hour12: false });

const createSection = ({ title, tone = violet }) => {
  const sectionTop = `${tone}┌${"─".repeat(PANEL_WIDTH - 2)}┐${reset}`;
  const sectionBottom = `${tone}└${"─".repeat(PANEL_WIDTH - 2)}┘${reset}`;
  const decorated = `${bold}${title}${reset}`;
  return { sectionTop, sectionBottom, decorated, tone };
};

const wrapText = (text, maxWidth) => {
  if (!text) return [""];

  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxWidth) {
      current = candidate;
      continue;
    }

    if (current) {
      lines.push(current);
    }

    if (word.length <= maxWidth) {
      current = word;
      continue;
    }

    for (let i = 0; i < word.length; i += maxWidth) {
      lines.push(word.slice(i, i + maxWidth));
    }
    current = "";
  }

  if (current) {
    lines.push(current);
  }

  return lines.length ? lines : [""];
};

const printSectionKeyValue = (tone, label, value) => {
  const contentWidth = PANEL_WIDTH - 4;
  const prefixPlain = `${label}: `;
  const continuationPlain = " ".repeat(prefixPlain.length);
  const wrapped = wrapText(value, Math.max(8, contentWidth - prefixPlain.length));

  wrapped.forEach((line, index) => {
    const leftPlain = `${index === 0 ? prefixPlain : continuationPlain}${line}`;
    const leftStyled =
      index === 0
        ? `${bold}${sky}${label}:${reset} ${white}${line}${reset}`
        : `${white}${continuationPlain}${line}${reset}`;

    const spaces = Math.max(1, contentWidth - leftPlain.length);
    console.log(`${tone}│${reset} ${leftStyled}${" ".repeat(spaces)}${tone}│${reset}`);
  });
};

const explainError = (text) => {
  const normalized = text.toLowerCase();
  if (normalized.includes("eaddrinuse") || normalized.includes("address already in use")) {
    return {
      titulo: "Puerto ocupado",
      causa: `Otro proceso ya esta usando ${url}`,
      accion: `Cierra el proceso anterior o cambia PORT antes de correr dev`,
    };
  }
  if (normalized.includes("module not found") || normalized.includes("cannot find module")) {
    return {
      titulo: "Dependencia faltante",
      causa: "Hay imports que no estan instalados o no existen en el proyecto",
      accion: "Ejecuta pnpm install y verifica el path/import que falla",
    };
  }
  if (
    normalized.includes("typescript") ||
    normalized.includes("ts") ||
    normalized.includes("type error")
  ) {
    return {
      titulo: "Error de tipos",
      causa: "TypeScript detecto una incompatibilidad o contrato roto",
      accion: "Lee el primer error del bloque rojo y corrige de arriba hacia abajo",
    };
  }
  if (normalized.includes("env") && normalized.includes("missing")) {
    return {
      titulo: "Variable de entorno faltante",
      causa: "Tu app necesita una variable que no se encontro al iniciar",
      accion: "Revisa .env.local y define las variables requeridas",
    };
  }
  return {
    titulo: "Fallo durante el arranque",
    causa: "El proceso devolvio un error no mapeado automaticamente",
    accion: "Revisa las lineas inmediatamente anteriores para ubicar el origen",
  };
};

const printErrorCard = (rawText) => {
  const { titulo, causa, accion } = explainError(rawText);
  const section = createSection({
    title: `${red}ERROR UX${reset} ${orange}${titulo}${reset}`,
    tone: red,
  });
  console.log("");
  console.log(section.sectionTop);
  printSectionKeyValue(section.tone, "Diagnostico", causa);
  printSectionKeyValue(section.tone, "Que hacer", accion);
  printSectionKeyValue(section.tone, "Tip", "el primer error casi siempre es la causa real");
  console.log(section.sectionBottom);
  console.log("");
};

console.log("");
console.log(`${soft}${gray}· ${"─".repeat(PANEL_WIDTH - 6)} ·${reset}`);
console.log(top);
console.log(
  panelLine(
    `${pink}FRONTEND UI${reset}`,
    `${white}Next.js Dev Server${reset} ${gray}| modern experience${reset}`,
  ),
);
console.log(mid);
console.log(panelLine(`${mint}URL:${reset}`, `${white}${url}${reset}`));
console.log(panelLine(`${mint}AUTO-OPEN:${reset}`, `${gold}ACTIVO (1 pestana)${reset}`));
console.log(panelLine(`${mint}ESTADO:${reset}`, `${cyan}INICIANDO DEV SERVER${reset}`));
console.log(panelLine(`${mint}ARRANQUE:${reset}`, `${soft}${gray}${stamp}${reset}`));
console.log(panelLine(`${mint}HOTKEYS:${reset}`, `${white}r reinicia | ctrl+c detiene${reset}`));
console.log(bottom);
console.log(`${soft}${gray}· ${"─".repeat(PANEL_WIDTH - 6)} ·${reset}`);
console.log("");

let opened = false;
let errorCardShown = false;
// Guard adicional: solo abrimos si el proceso lleva menos de 30s corriendo.
// Evita re-abrir si Next.js imprime la URL de nuevo tras un HMR reload.
const startTime = Date.now();
const OPEN_WINDOW_MS = 30_000;
const child = spawn("pnpm run dev:next", {
  stdio: ["inherit", "pipe", "pipe"],
  shell: true,
  env: {
    ...process.env,
    FORCE_COLOR: process.env.FORCE_COLOR || "1",
  },
});

let stdoutBuffer = "";
let stderrBuffer = "";

const formatDevLine = (line, stream = "stdout") => {
  const plain = stripAnsi(line).trim();
  if (!plain) return "";

  if (plain.startsWith("▲ Next.js")) {
    return `${bold}${pink}▲${reset} ${bold}${white}${plain.replace(/^▲\s*/, "")}${reset}`;
  }

  if (plain.startsWith("- Local:")) {
    const urlText = plain.replace("- Local:", "").trim();
    return `${bold}${mint}● Local${reset} ${white}${urlText}${reset}`;
  }

  if (plain.startsWith("- Network:")) {
    const urlText = plain.replace("- Network:", "").trim();
    return `${bold}${cyan}● Network${reset} ${white}${urlText}${reset}`;
  }

  if (plain.includes("Starting...")) {
    return `${gold}◔${reset} ${white}${plain}${reset}`;
  }

  if (plain.includes("Ready in")) {
    return `${lime}●${reset} ${bold}${white}${plain}${reset}`;
  }

  if (
    plain.startsWith("GET ") ||
    plain.startsWith("POST ") ||
    plain.startsWith("PUT ") ||
    plain.startsWith("DELETE ")
  ) {
    return `${soft}${sky}HTTP${reset} ${white}${plain}${reset}`;
  }

  if (plain.includes("error") || plain.includes("Error") || stream === "stderr") {
    return `${red}${plain}${reset}`;
  }

  return `${soft}${gray}${plain}${reset}`;
};

const printStyledOutput = (chunk, stream = "stdout") => {
  const text = chunk.toString();
  const buffer = stream === "stderr" ? stderrBuffer + text : stdoutBuffer + text;
  const lines = buffer.split(/\r?\n/);
  const tail = lines.pop() ?? "";

  for (const line of lines) {
    const styled = formatDevLine(line, stream);
    if (styled) {
      console.log(`  ${styled}`);
    } else {
      console.log("");
    }
  }

  if (stream === "stderr") {
    stderrBuffer = tail;
  } else {
    stdoutBuffer = tail;
  }
};

const flushStyledRemainder = () => {
  if (stdoutBuffer.trim()) {
    const styled = formatDevLine(stdoutBuffer, "stdout");
    if (styled) console.log(`  ${styled}`);
  }
  if (stderrBuffer.trim()) {
    const styled = formatDevLine(stderrBuffer, "stderr");
    if (styled) console.log(`  ${styled}`);
  }
  stdoutBuffer = "";
  stderrBuffer = "";
};

const tryOpenFromOutput = async (chunk) => {
  const text = chunk.toString();
  const localMatch = text.match(/- Local:\s+(https?:\/\/[^\s]+)/);
  // Solo abrimos una vez y dentro de la ventana de arranque inicial (30s).
  if (!localMatch || opened || Date.now() - startTime > OPEN_WINDOW_MS) return;
  opened = true;
  try {
    await open(localMatch[1]);
  } catch {
    // No detenemos el servidor si el navegador no abre.
  }
};

const maybeShowErrorCard = (chunk) => {
  const text = chunk.toString();
  const normalized = text.toLowerCase();
  const looksLikeError =
    normalized.includes("error") ||
    normalized.includes("failed") ||
    normalized.includes("eaddrinuse") ||
    normalized.includes("module not found");

  if (!looksLikeError || errorCardShown) return;
  errorCardShown = true;
  printErrorCard(text);
};

child.stdout.on("data", async (chunk) => {
  printStyledOutput(chunk, "stdout");
  await tryOpenFromOutput(chunk);
  maybeShowErrorCard(chunk);
});

child.stderr.on("data", async (chunk) => {
  printStyledOutput(chunk, "stderr");
  await tryOpenFromOutput(chunk);
  maybeShowErrorCard(chunk);
});

child.on("exit", (code) => {
  flushStyledRemainder();
  if (code && !errorCardShown) {
    printErrorCard(`process exited with code ${code}`);
  }
  process.exit(code ?? 0);
});
