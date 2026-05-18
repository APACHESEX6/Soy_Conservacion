import createMiddleware from "next-intl/middleware";
import { routing } from "./src/i18n/routing";

// Configurar el middleware de next-intl
export default createMiddleware(routing);

// Matcher: Aplica el middleware a todas las rutas excepto:
// - /api/* (API routes)
// - /_next/* (archivos internos Next.js)
// - /favicon.ico
// - /*.svg (archivos SVG)
export const config = {
  matcher: [
    // Match everything except static files and api routes
    "/((?!api|_next|.*\\..*|favicon.ico).*)",
  ],
};
