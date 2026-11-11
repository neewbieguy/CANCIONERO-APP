"use client";

import { useEffect, useState } from "react";

/** true cuando la pantalla cumple la media query (siempre false en el servidor). */
export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setMatches(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}

/** Pantallas de celular: los paneles se abren desde abajo. */
export function useIsMobile() {
  return useMediaQuery("(max-width: 767px)");
}
