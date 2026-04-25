"use client";
import { useEffect } from "react";

export function HideAnnouncer() {
  useEffect(() => {
    const hideAnnouncer = () => {
      const announcer = document.querySelector("next-route-announcer");
      if (!announcer) return;

      const host = announcer as HTMLElement;
      host.style.display = "none";
      host.hidden = true;

      const shadow = host.shadowRoot;
      if (shadow) {
        shadow.innerHTML = "";
      }
    };

    hideAnnouncer();

    const observer = new MutationObserver(() => {
      hideAnnouncer();
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });

    const interval = window.setInterval(hideAnnouncer, 250);

    return () => {
      observer.disconnect();
      window.clearInterval(interval);
    };
  }, []);
  return null;
}
