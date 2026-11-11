"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Desplazamiento automático compartido entre la pantalla de la canción y el Modo Atril.
 * La velocidad es un multiplicador (0,5× a 3×) sobre una base en píxeles por segundo.
 */

export const SPEED_MIN = 0.5;
export const SPEED_MAX = 3;
export const SPEED_STEP = 0.5;
export const SPEED_DEFAULT = 1;

/** Píxeles por segundo a 1,0×: un ritmo de lectura tranquilo. */
const BASE_PX_PER_SEC = 14;
const SPEED_KEY = "cancionero:autoscroll-speed";

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

/** Ej.: 1 -> "1,0×", 2.5 -> "2,5×" */
export function formatSpeed(speed: number) {
  return `${speed.toLocaleString("es-AR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}×`;
}

/**
 * Velocidad base según el BPM de la canción: las canciones rápidas se leen más rápido.
 * Se ajusta poco (entre 0,8 y 1,25 veces) para que 1,0× siempre sea cómodo.
 */
export function basePxPerSec(bpm?: number | null) {
  if (!bpm || bpm <= 0) return BASE_PX_PER_SEC;
  return BASE_PX_PER_SEC * clamp(bpm / 100, 0.8, 1.25);
}

/** Velocidad elegida por el usuario, recordada en este dispositivo. */
export function useScrollSpeed() {
  const [speed, setSpeed] = useState(SPEED_DEFAULT);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = Number(localStorage.getItem(SPEED_KEY));
      if (saved >= SPEED_MIN && saved <= SPEED_MAX) setSpeed(Math.round(saved / SPEED_STEP) * SPEED_STEP);
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(SPEED_KEY, String(speed));
    } catch {}
  }, [speed, loaded]);

  return {
    speed,
    slower: () => setSpeed((s) => clamp(s - SPEED_STEP, SPEED_MIN, SPEED_MAX)),
    faster: () => setSpeed((s) => clamp(s + SPEED_STEP, SPEED_MIN, SPEED_MAX)),
    canSlower: speed > SPEED_MIN,
    canFaster: speed < SPEED_MAX,
  };
}

/**
 * Mueve el scroll suavemente con requestAnimationFrame mientras `playing` sea true.
 * `target` es un contenedor con scroll propio, o "window" para la página entera.
 * Llama a `onStop` al llegar al final o cuando el usuario mueve el scroll con la rueda o el dedo.
 */
export function useAutoScroll({
  target,
  playing,
  pxPerSec,
  onStop,
}: {
  target: React.RefObject<HTMLElement> | "window";
  playing: boolean;
  pxPerSec: number;
  onStop: () => void;
}) {
  // En refs para cambiar la velocidad sin cortar el movimiento
  const speedRef = useRef(pxPerSec);
  const stopRef = useRef(onStop);
  speedRef.current = pxPerSec;
  stopRef.current = onStop;

  useEffect(() => {
    if (!playing) return;
    const el = target === "window" ? null : target.current;
    if (target !== "window" && !el) return;

    const getTop = () => (el ? el.scrollTop : window.scrollY);
    const maxTop = () =>
      el ? el.scrollHeight - el.clientHeight : document.documentElement.scrollHeight - window.innerHeight;
    const setTop = (top: number) =>
      el ? el.scrollTo({ top, behavior: "instant" }) : window.scrollTo({ top, behavior: "instant" });

    // La posición se lleva con decimales: a velocidades bajas se avanza menos de 1 px por cuadro
    let pos = getTop();
    let last = performance.now();
    let frame = 0;

    const step = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      // Si algo movió el scroll (teclado, un salto), seguir desde ahí
      if (Math.abs(getTop() - pos) > 2) pos = getTop();
      pos += speedRef.current * dt;
      const max = maxTop();
      if (pos >= max) {
        setTop(max);
        stopRef.current();
        return;
      }
      setTop(pos);
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);

    // Scroll manual con la rueda o el dedo: pausa
    const source: HTMLElement | Window = el ?? window;
    const pause = () => stopRef.current();
    source.addEventListener("wheel", pause, { passive: true });
    source.addEventListener("touchmove", pause, { passive: true });

    return () => {
      cancelAnimationFrame(frame);
      source.removeEventListener("wheel", pause);
      source.removeEventListener("touchmove", pause);
    };
  }, [playing, target]);
}
