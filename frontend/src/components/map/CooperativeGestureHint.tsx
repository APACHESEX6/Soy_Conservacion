"use client";

import { Hand, Mouse } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

interface CooperativeGestureHintProps {
  mapContainerRef: React.RefObject<HTMLDivElement | null>;
}

// Función para eliminar el mensaje por defecto de Mapbox de forma agresiva
const removeMapboxDefaultMessage = () => {
  if (typeof document === "undefined") return;
  // Buscar y eliminar todos los mensajes por defecto
  const selectors = [
    ".mapboxgl-cooperative-gesture-message",
    ".mapboxgl-cooperative-gesture-message-box",
    ".mapboxgl-cooperative-gesture-message-inner",
    '[class*="cooperative-gesture"]',
    '[class*="mapboxgl-cooperative"]',
  ];

  selectors.forEach((selector) => {
    const elements = document.querySelectorAll(selector);
    elements.forEach((el) => {
      const htmlEl = el as HTMLElement;
      htmlEl.style.cssText =
        "display: none !important; visibility: hidden !important; opacity: 0 !important; pointer-events: none !important; position: absolute !important; z-index: -99999 !important;";
      htmlEl.remove();
    });
  });
};

export function CooperativeGestureHint({ mapContainerRef }: CooperativeGestureHintProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isTouchDevice] = useState(() => {
    if (typeof window === "undefined") return false;
    return "ontouchstart" in window || navigator.maxTouchPoints > 0;
  });
  const observerRef = useRef<MutationObserver | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const removalIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startAggressiveRemoval = useCallback(() => {
    // Eliminar inmediatamente en el frame actual
    removeMapboxDefaultMessage();

    // Un solo RAF para el siguiente frame — suficiente para capturar
    // mensajes que Mapbox inyecta de forma asíncrona al montar.
    requestAnimationFrame(removeMapboxDefaultMessage);

    // Interval de 100ms por los primeros 2 segundos como red de seguridad.
    // Se limpia automáticamente al llegar al límite o en el cleanup del useEffect.
    if (removalIntervalRef.current) return; // evitar duplicados
    let count = 0;
    removalIntervalRef.current = setInterval(() => {
      removeMapboxDefaultMessage();
      count += 1;
      if (count >= 20) {
        // 20 × 100ms = 2 segundos — suficiente para cualquier inicialización de Mapbox
        clearInterval(removalIntervalRef.current ?? undefined);
        removalIntervalRef.current = null;
      }
    }, 100);
  }, []);

  const hideHint = useCallback(() => {
    setIsVisible(false);
  }, []);

  const showHint = useCallback(() => {
    // Si hay un timer activo, limpiarlo
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
    }

    setIsVisible(true);

    // El mensaje se muestra por 2.5 segundos, luego desaparece
    hideTimerRef.current = setTimeout(() => {
      hideHint();
      hideTimerRef.current = null;
    }, 2800);
  }, [hideHint]);

  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    // Iniciar eliminación agresiva inmediatamente (por si acaso)
    startAggressiveRemoval();

    // Configurar MutationObserver para eliminar mensajes que aparezcan dinámicamente
    observerRef.current = new MutationObserver(() => {
      removeMapboxDefaultMessage();
      requestAnimationFrame(removeMapboxDefaultMessage);
    });

    observerRef.current.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class"],
    });

    // Capturar eventos wheel en la fase de captura para interceptar antes de Mapbox
    const handleWheelCapture = (e: WheelEvent) => {
      const target = e.target as HTMLElement | null;

      // Si Ctrl/Cmd está presionado, el usuario quiere hacer zoom — dejar pasar
      // el evento al mapa sin interferencia. Esto también permite que Ctrl+drag
      // funcione correctamente porque no bloqueamos el flujo de input.
      if (e.ctrlKey || e.metaKey) {
        return;
      }

      // Si el cursor está sobre el popup o cualquier UI superpuesta, no mostrar el hint
      if (
        target?.closest(".mapboxgl-popup, .map-popup-root, .custom-mapbox-popup, .mapboxgl-ctrl")
      ) {
        return;
      }

      if (target) {
        let el: HTMLElement | null = target;
        while (el && el !== container) {
          const style = window.getComputedStyle(el);
          const overflowY = style.overflowY;
          const isScrollable = overflowY === "auto" || overflowY === "scroll";
          if (isScrollable) {
            const canScrollDown = e.deltaY > 0 && el.scrollTop < el.scrollHeight - el.clientHeight;
            const canScrollUp = e.deltaY < 0 && el.scrollTop > 0;

            if (canScrollDown || canScrollUp) {
              return;
            } else {
              e.preventDefault();
              e.stopPropagation();
              return;
            }
          }
          el = el.parentElement;
        }
      }

      // Sin Ctrl/Cmd en desktop → bloquear scroll de página y mostrar hint
      if (!isTouchDevice) {
        if (Math.abs(e.deltaY) > 8) {
          e.preventDefault();
          e.stopPropagation();
          showHint();
        }
      }
    };

    container.addEventListener("wheel", handleWheelCapture, { passive: false, capture: true });

    // Cualquier mousedown/pointerdown sobre el contenedor descarta el hint inmediatamente.
    // Esto garantiza que el drag (con o sin Ctrl) funcione sin que el backdrop lo bloquee.
    const handleMouseDown = () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
      setIsVisible(false);
    };

    container.addEventListener("mousedown", handleMouseDown, { capture: true });
    container.addEventListener("pointerdown", handleMouseDown, { capture: true });

    return () => {
      container.removeEventListener("wheel", handleWheelCapture, { capture: true });
      container.removeEventListener("mousedown", handleMouseDown, { capture: true });
      container.removeEventListener("pointerdown", handleMouseDown, { capture: true });
      observerRef.current?.disconnect();
      if (removalIntervalRef.current) {
        clearInterval(removalIntervalRef.current);
        removalIntervalRef.current = null;
      }
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    };
  }, [mapContainerRef, isTouchDevice, showHint, startAggressiveRemoval]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="pointer-events-none absolute inset-0 z-9999 flex items-center justify-center"
        >
          {/* Backdrop — pointer-events-none: el dismiss se maneja por mousedown en el container */}
          <button
            type="button"
            aria-label="Cerrar indicación de gestos"
            className="map-gesture-hint-backdrop pointer-events-none absolute inset-0 cursor-default border-0 bg-transparent p-0"
            onClick={hideHint}
          />

          {/* Content Card */}
          <motion.div
            initial={{ scale: 0.94, y: 12, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, y: 8, opacity: 0 }}
            transition={{
              type: "spring",
              damping: 28,
              stiffness: 350,
              delay: 0.02,
            }}
            className="map-gesture-hint-content relative mx-6 flex w-full max-w-105 flex-col items-center gap-8 overflow-hidden rounded-10-5 px-10 py-12 text-center"
          >
            {/* Visual Guide Group */}
            <div className="relative flex items-center justify-center gap-6">
              {isTouchDevice ? (
                <div className="relative">
                  <motion.div
                    animate={{
                      scale: [1, 1.1, 1],
                      y: [0, -4, 0],
                    }}
                    transition={{
                      duration: 2.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <Hand className="h-14 w-14 text-white/90" strokeWidth={1.2} />
                  </motion.div>
                  <div
                    className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-xs font-black shadow-lg ring-4 ring-white/10"
                    style={{
                      background:
                        "linear-gradient(90deg, #10b981 0%, #34d399 25%, #ffffff 50%, #34d399 75%, #10b981 100%)",
                      backgroundSize: "200% auto",
                      WebkitBackgroundClip: "text",
                      backgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      animation: "popup-shimmer 8s linear infinite",
                    }}
                  >
                    2
                  </div>
                </div>
              ) : (
                <>
                  <motion.div
                    initial={{ x: -10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="premium-kbd flex h-14 min-w-18 items-center justify-center rounded-2xl px-4 text-xs-plus font-black tracking-widest"
                    style={{
                      background:
                        "linear-gradient(90deg, #1e293b 0%, #334155 25%, #ffffff 50%, #334155 75%, #1e293b 100%)",
                      backgroundSize: "200% auto",
                      WebkitBackgroundClip: "text",
                      backgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      animation: "popup-shimmer 8s linear infinite",
                    }}
                  >
                    CTRL
                  </motion.div>

                  <motion.div
                    animate={{ opacity: [0.2, 0.5, 0.2] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-xl font-light text-white/30"
                  >
                    +
                  </motion.div>

                  <motion.div
                    initial={{ x: 10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="relative"
                  >
                    <Mouse className="h-12 w-12 text-white/90" strokeWidth={1.2} />
                    <motion.div
                      animate={{
                        y: [-6, 6, -6],
                        opacity: [0.3, 0.8, 0.3],
                      }}
                      transition={{
                        duration: 1.8,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      className="absolute left-1/2 top-3 h-2 w-1 -translate-x-1/2 rounded-full bg-white/60 shadow-white-glow"
                    />
                  </motion.div>
                </>
              )}
            </div>

            {/* Text Information */}
            <div className="space-y-3">
              <motion.h3
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35, duration: 0.5 }}
                className="text-2xl font-black tracking-tight"
                style={{
                  background:
                    "linear-gradient(90deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.95) 38%, #ffffff 50%, rgba(255,255,255,0.95) 62%, rgba(255,255,255,0.7) 100%)",
                  backgroundSize: "200% auto",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  animation: "popup-shimmer 8s linear infinite",
                }}
              >
                {isTouchDevice ? "Explora con libertad" : "Control de precisión"}
              </motion.h3>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.45, duration: 0.5 }}
                className="max-w-70 text-base-plus font-medium leading-relaxed text-white/60"
              >
                {isTouchDevice
                  ? "Desliza con dos dedos para navegar por el mapa"
                  : "Mantén presionada la tecla Ctrl mientras usas la rueda para hacer zoom"}
              </motion.p>
            </div>

            {/* Subtle bottom indicator */}
            <div className="h-1 w-12 rounded-full bg-white/10" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
