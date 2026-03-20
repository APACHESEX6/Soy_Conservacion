import { spawn } from "node:child_process";

const PORT = process.env.PORT || "4000";
const HOST = process.env.HOST || "localhost";
const url = `http://${HOST}:${PORT}`;
const PANEL_WIDTH = 78;

const reset = "\x1b[0m";
const blue = "\x1b[38;5;111m";
const yellow = "\x1b[38;5;223m";
const green = "\x1b[38;5;85m";
const gray = "\x1b[38;5;245m";
const white = "\x1b[38;5;255m";
const red = "\x1b[38;5;203m";
const sky = "\x1b[38;5;153m";
const peach = "\x1b[38;5;216m";
const cyan = "\x1b[38;5;117m";
const mint = "\x1b[38;5;121m";
const lime = "\x1b[38;5;119m";
const bold = "\x1b[1m";
const soft = "\x1b[2m";

const stripAnsi = (value) => value.replace(/\x1B\[[0-9;]*m/g, "");
const panelLine = (label, value) => {
  const left = `${bold}${label}${reset} ${value}`;
  const printable = stripAnsi(left).length;
  const spaces = Math.max(1, PANEL_WIDTH - printable - 4);
  return `${blue}┃${reset} ${left}${" ".repeat(spaces)}${blue}┃${reset}`;
};
const top = `${blue}┏${"━".repeat(PANEL_WIDTH - 2)}┓${reset}`;
const mid = `${blue}┣${"━".repeat(PANEL_WIDTH - 2)}┫${reset}`;
const bottom = `${blue}┗${"━".repeat(PANEL_WIDTH - 2)}┛${reset}`;
const stamp = new Date().toLocaleTimeString("es-CO", { hour12: false });

const createSection = ({ title, tone = blue }) => {
  const sectionTop = `${tone}┌${"─".repeat(PANEL_WIDTH - 2)}┐${reset}`;
  const sectionBottom = `${tone}└${"─".repeat(PANEL_WIDTH - 2)}┘${reset}`;
  const decorated = `${bold}${title}${reset}`;
  return { sectionTop, sectionBottom, decorated, tone };
};

const printSectionRow = (tone, text) => {
  const printable = stripAnsi(text).length;
  const spaces = Math.max(1, PANEL_WIDTH - printable - 4);
  console.log(`${tone}│${reset} ${text}${" ".repeat(spaces)}${tone}│${reset}`);
};

const explainError = (text) => {
  const normalized = text.toLowerCase();
  if (normalized.includes("eaddrinuse") || normalized.includes("address already in use")) {
    return {
      titulo: "Puerto ocupado",
      causa: `Otro proceso ya esta usando ${url}`,
      accion: "Deten el proceso anterior o cambia PORT antes de correr dev",
    };
  }
  if (
    normalized.includes("password authentication failed") ||
    normalized.includes("database") ||
    normalized.includes("econnrefused")
  ) {
    return {
      titulo: "Conexion a base de datos",
      causa: "El backend no pudo conectarse a la base de datos configurada",
      accion: "Valida host, puerto, credenciales y que la DB este en ejecucion",
    };
  }
  if (normalized.includes("jwt") || normalized.includes("secret")) {
    return {
      titulo: "Configuracion de seguridad",
      causa: "Falta una variable sensible o su valor es invalido",
      accion: "Revisa tus variables de entorno para claves y secretos",
    };
  }
  if (
    normalized.includes("typescript") ||
    normalized.includes("ts") ||
    normalized.includes("type error")
  ) {
    return {
      titulo: "Error de compilacion",
      causa: "TypeScript detecto una incompatibilidad de tipos en el backend",
      accion: "Corrige el primer archivo y linea que reporta el stack",
    };
  }
  return {
    titulo: "Fallo en backend",
    causa: "Se produjo un error no categorizado durante el arranque",
    accion: "Revisa las lineas previas y el stack principal para ubicar la causa",
  };
};

const printErrorCard = (rawText) => {
  const { titulo, causa, accion } = explainError(rawText);
  const section = createSection({
    title: `${red}ERROR UX${reset} ${peach}${titulo}${reset}`,
    tone: red,
  });
  console.log("");
  console.log(section.sectionTop);
  printSectionRow(section.tone, `${bold}${sky}Diagnostico:${reset} ${white}${causa}${reset}`);
  printSectionRow(section.tone, `${bold}${sky}Que hacer:${reset} ${white}${accion}${reset}`);
  printSectionRow(
    section.tone,
    `${soft}${gray}Tip:${reset} ${soft}${white}el primer error casi siempre es la causa real${reset}`,
  );
  console.log(section.sectionBottom);
  console.log("");
};

console.log("");
console.log(`${soft}${gray}· ${"─".repeat(PANEL_WIDTH - 6)} ·${reset}`);
console.log(top);
console.log(
  panelLine(
    `${yellow}BACKEND CORE${reset}`,
    `${white}Node + Express API${reset} ${gray}| modern experience${reset}`,
  ),
);
console.log(mid);
console.log(panelLine(`${mint}URL:${reset}`, `${white}${url}${reset}`));
console.log(panelLine(`${mint}PUERTO:${reset}`, `${white}${PORT}${reset}`));
console.log(panelLine(`${green}MODO:${reset}`, `${white}DESARROLLO + HOT RELOAD${reset}`));
console.log(panelLine(`${mint}ESTADO:${reset}`, `${cyan}INICIANDO BACKEND SERVER${reset}`));
console.log(panelLine(`${mint}ARRANQUE:${reset}`, `${soft}${gray}${stamp}${reset}`));
console.log(panelLine(`${mint}HOTKEYS:${reset}`, `${white}rs reinicia | ctrl+c detiene${reset}`));
console.log(bottom);
console.log(`${soft}${gray}· ${"─".repeat(PANEL_WIDTH - 6)} ·${reset}`);
console.log("");

let errorCardShown = false;
const child = spawn("pnpm run dev:server", {
  stdio: ["inherit", "pipe", "pipe"],
  shell: true,
  env: {
    ...process.env,
    FORCE_COLOR: process.env.FORCE_COLOR || "1",
  },
});

let stdoutBuffer = "";
let stderrBuffer = "";
let startupPanelSeen = false;
let suppressRepeatedStartupBlock = false;

const isStartupPanelLine = (plain) =>
  plain.includes("API ONLINE | backend listo") ||
  plain.includes("ENDPOINT: http://localhost:") ||
  plain.includes("DB STATUS:") ||
  plain.includes("Servidor iniciado con estilo profesional") ||
  plain.startsWith("┏") ||
  plain.startsWith("┣") ||
  plain.startsWith("┗") ||
  plain.startsWith("│") ||
  (plain.startsWith("·") && plain.includes("─"));

const shouldSuppressRepeatedStartupLine = (plain) => {
  if (plain.includes("API ONLINE | backend listo")) {
    if (startupPanelSeen) {
      suppressRepeatedStartupBlock = true;
      return true;
    }
    startupPanelSeen = true;
    return false;
  }

  if (!suppressRepeatedStartupBlock) return false;

  if (plain.includes("Servidor iniciado con estilo profesional")) {
    suppressRepeatedStartupBlock = false;
    return true;
  }

  return isStartupPanelLine(plain);
};

const formatDevLine = (line, stream = "stdout") => {
  const plain = stripAnsi(line).trim();
  if (!plain) return "";

  if (shouldSuppressRepeatedStartupLine(plain)) {
    return "";
  }

  const hasAnsi = /\x1B\[[0-9;]*m/.test(line);
  if (hasAnsi) {
    return line.trimEnd();
  }

  if (plain.startsWith("[nodemon]")) {
    return `${bold}${mint}${plain}${reset}`;
  }

  if (plain.includes("listening") || plain.includes("started") || plain.includes("running")) {
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

  if (plain.includes("warn") || plain.includes("deprecated")) {
    return `${yellow}${plain}${reset}`;
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

const maybeShowErrorCard = (chunk) => {
  const text = chunk.toString();
  const normalized = text.toLowerCase();
  const looksLikeError =
    normalized.includes("error") ||
    normalized.includes("failed") ||
    normalized.includes("eaddrinuse") ||
    normalized.includes("exception");

  if (!looksLikeError || errorCardShown) return;
  errorCardShown = true;
  printErrorCard(text);
};

child.stdout.on("data", (chunk) => {
  printStyledOutput(chunk, "stdout");
  maybeShowErrorCard(chunk);
});

child.stderr.on("data", (chunk) => {
  printStyledOutput(chunk, "stderr");
  maybeShowErrorCard(chunk);
});

child.on("exit", (code) => {
  flushStyledRemainder();
  if (code && !errorCardShown) {
    printErrorCard(`process exited with code ${code}`);
  }
  process.exit(code ?? 0);
});
