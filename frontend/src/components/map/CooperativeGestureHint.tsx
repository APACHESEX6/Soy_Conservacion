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
    // Eliminar inmediatamente y en el próximo frame
    removeMapboxDefaultMessage();
    requestAnimationFrame(removeMapboxDefaultMessage);
    requestAnimationFrame(() => requestAnimationFrame(removeMapboxDefaultMessage));

    // Eliminar cada 100ms por los primeros 3 segundos
    if (!removalIntervalRef.current) {
      let count = 0;
      removalIntervalRef.current = setInterval(() => {
        removeMapboxDefaultMessage();
        count++;
        if (count > 30 && removalIntervalRef.current) {
          clearInterval(removalIntervalRef.current);
          removalIntervalRef.current = null;
        }
      }, 100);
    }
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

      // Si no es touch device y no tiene Ctrl/Cmd presionado
      if (!isTouchDevice && !e.ctrlKey && !e.metaKey) {
        if (Math.abs(e.deltaY) > 8) {
          e.preventDefault();
          e.stopPropagation();
          showHint();
        }
      }
    };

    container.addEventListener("wheel", handleWheelCapture, { passive: false, capture: true });

    return () => {
      container.removeEventListener("wheel", handleWheelCapture, { capture: true });
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
          className="pointer-events-auto absolute inset-0 z-9999 flex items-center justify-center"
          onClick={hideHint}
        >
          {/* Backdrop — pointer-events-none para que el clic pase al mapa */}
          <div className="map-gesture-hint-backdrop pointer-events-none absolute inset-0" />

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
                  <div className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-xs font-black text-white shadow-lg ring-4 ring-white/10">
                    2
                  </div>
                </div>
              ) : (
                <>
                  <motion.div
                    initial={{ x: -10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="premium-kbd flex h-14 min-w-18 items-center justify-center rounded-2xl px-4 text-xs-plus font-black tracking-widest text-white/95"
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
                className="text-2xl font-black tracking-tight text-white/95"
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
