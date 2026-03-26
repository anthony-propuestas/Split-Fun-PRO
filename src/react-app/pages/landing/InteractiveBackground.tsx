import { useEffect, useRef } from "react";

/**
 * Full-screen animated background with:
 * - Desktop: one blob that smoothly follows the mouse cursor (RAF + lerp)
 * - All screens: three ambient gradient blobs with slow CSS drift animations
 * - prefers-reduced-motion: all animations disabled
 * - Mobile (coarse pointer): mouse tracking skipped; CSS-only ambient animation
 */
export default function InteractiveBackground() {
  const mouseBlobRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const blob = mouseBlobRef.current;
    if (!blob) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReduced) return;

    // Only activate mouse tracking on devices with a precise pointer (desktop)
    const isPointerFine = window.matchMedia("(pointer: fine)").matches;
    if (!isPointerFine) return;

    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const current = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    let raf: number;

    const onMove = (e: MouseEvent) => {
      target.x = e.clientX;
      target.y = e.clientY;
    };

    const tick = () => {
      // Smooth lerp toward the cursor — lower factor = lazier follow
      current.x += (target.x - current.x) * 0.04;
      current.y += (target.y - current.y) * 0.04;
      blob.style.transform = `translate(calc(${current.x}px - 50%), calc(${current.y}px - 50%))`;
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
      aria-hidden="true"
    >
      {/* Mouse-tracking blob — hidden on mobile, only rendered on md+ */}
      <div
        ref={mouseBlobRef}
        className="absolute top-0 left-0 w-[650px] h-[650px] rounded-full hidden md:block"
        style={{
          background:
            "radial-gradient(circle, hsl(200 90% 55% / 0.10) 0%, transparent 65%)",
          filter: "blur(50px)",
          willChange: "transform",
          transform: "translate(-50%, -50%)",
        }}
      />

      {/* Ambient blob 1 — iridescent-green, top-left */}
      <div
        className="absolute -top-1/3 -left-1/4 w-[90vw] h-[90vw] rounded-full"
        style={{
          background:
            "radial-gradient(ellipse at center, hsl(160 80% 55% / 0.13) 0%, transparent 60%)",
          animation: "blob-drift-1 17s ease-in-out infinite",
        }}
      />

      {/* Ambient blob 2 — iridescent-pink, bottom-right */}
      <div
        className="absolute -bottom-1/3 -right-1/4 w-[75vw] h-[75vw] rounded-full"
        style={{
          background:
            "radial-gradient(ellipse at center, hsl(330 85% 65% / 0.10) 0%, transparent 60%)",
          animation: "blob-drift-2 22s ease-in-out infinite",
          animationDelay: "-8s",
        }}
      />

      {/* Ambient blob 3 — neon-purple, center-right, very subtle */}
      <div
        className="absolute top-1/3 right-0 w-[55vw] h-[55vw] rounded-full"
        style={{
          background:
            "radial-gradient(ellipse at center, hsl(280 100% 65% / 0.07) 0%, transparent 65%)",
          animation: "blob-drift-1 26s ease-in-out infinite",
          animationDelay: "-14s",
        }}
      />
    </div>
  );
}
