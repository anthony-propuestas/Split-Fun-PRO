import { useEffect, useRef } from "react";

/**
 * Attaches an IntersectionObserver to the returned ref's children
 * that have the [data-reveal] attribute. When each child enters the
 * viewport, the "revealed" CSS class is added (triggering the
 * CSS transition defined in index.css).
 *
 * Respects prefers-reduced-motion by skipping animations entirely.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const items = Array.from(
      container.querySelectorAll<HTMLElement>("[data-reveal]")
    );

    if (prefersReduced) {
      items.forEach((el) => el.classList.add("revealed"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -60px 0px" }
    );

    items.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return ref;
}
