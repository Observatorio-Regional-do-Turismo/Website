"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Barra de progresso global no topo da tela que reage instantaneamente a cliques
 * em links internos do App Router, eliminando a sensação de atraso na troca de página.
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const visibleRef = useRef(false);
  const timerRef = useRef<number | null>(null);
  const hideRef = useRef<number | null>(null);

  const clearTimers = () => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (hideRef.current !== null) {
      window.clearTimeout(hideRef.current);
      hideRef.current = null;
    }
  };

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target as HTMLElement | null;
      const anchor = target?.closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
        return;
      }

      let dest: URL;
      try {
        dest = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }

      if (dest.origin !== window.location.origin) return;
      if (dest.pathname === window.location.pathname && dest.search === window.location.search) {
        return;
      }

      clearTimers();
      visibleRef.current = true;
      setVisible(true);
      setProgress(22);
      timerRef.current = window.setInterval(() => {
        setProgress((prev) => {
          if (prev >= 88) return prev;
          return prev + Math.max(2, (90 - prev) * 0.14);
        });
      }, 140);
    };

    document.addEventListener("click", handleClick, true);
    return () => {
      document.removeEventListener("click", handleClick, true);
      clearTimers();
    };
  }, []);

  useEffect(() => {
    if (!visibleRef.current) return;
    clearTimers();
    setProgress(100);
    hideRef.current = window.setTimeout(() => {
      visibleRef.current = false;
      setVisible(false);
      setProgress(0);
    }, 240);
    return clearTimers;
  }, [pathname, searchParams]);

  if (!visible) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed inset-x-0 top-0 z-[100] h-1 bg-transparent pointer-events-none"
    >
      <div
        className="h-full bg-gradient-to-r from-[#5BAF56] via-[#359830] to-[#C90C0F] shadow-[0_0_10px_rgba(53,152,48,0.65)] transition-[width,opacity] duration-200 ease-out motion-reduce:transition-none"
        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
      />
    </div>
  );
}
