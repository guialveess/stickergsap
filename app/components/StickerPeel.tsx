"use client";

import { useRef, useEffect, useMemo, CSSProperties } from "react";
import { gsap } from "gsap";
import { Draggable } from "gsap/Draggable";

gsap.registerPlugin(Draggable);

interface StickerPeelProps {
  imageSrc: string;
  rotate?: number;
  peelBackHoverPct?: number;
  peelBackActivePct?: number;
  peelEasing?: string;
  peelHoverEasing?: string;
  width?: number;
  shadowIntensity?: number;
  lightingIntensity?: number;
  initialPosition?: "center" | "random" | { x: number; y: number };
  peelDirection?: number;
  className?: string;
  disableEffectsOnMobile?: boolean;
}

interface CSSVars extends CSSProperties {
  "--sticker-rotate"?: string;
  "--sticker-p"?: string;
  "--sticker-peelback-hover"?: string;
  "--sticker-peelback-active"?: string;
  "--sticker-peel-easing"?: string;
  "--sticker-peel-hover-easing"?: string;
  "--sticker-width"?: string;
  "--sticker-shadow-opacity"?: number;
  "--sticker-lighting-constant"?: number;
  "--peel-direction"?: string;
  "--sticker-start"?: string;
  "--sticker-end"?: string;
}

const StickerPeel: React.FC<StickerPeelProps> = ({
  imageSrc,
  rotate = 30,
  peelBackHoverPct = 30,
  peelBackActivePct = 40,
  peelEasing = "power3.out",
  peelHoverEasing = "power2.out",
  width = 200,
  shadowIntensity = 0.6,
  lightingIntensity = 0.1,
  initialPosition = "center",
  peelDirection = 0,
  className = "",
  disableEffectsOnMobile = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragTargetRef = useRef<HTMLDivElement>(null);
  const pointLightRef = useRef<SVGFEPointLightElement>(null);
  const pointLightFlippedRef = useRef<SVGFEPointLightElement>(null);
  const draggableInstanceRef = useRef<Draggable | null>(null);

  const defaultPadding = 12;

  const isMobile = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(pointer: coarse)").matches;
  }, []);

  useEffect(() => {
    const target = dragTargetRef.current;
    if (!target) return;

    let startX = 0, startY = 0;

    if (
      typeof initialPosition === "object" &&
      initialPosition.x !== undefined &&
      initialPosition.y !== undefined
    ) {
      const clampedX = Math.max(0, Math.min(initialPosition.x, window.innerWidth - width));
      const clampedY = Math.max(0, Math.min(initialPosition.y, window.innerHeight - width));
      gsap.set(target, { x: clampedX, y: clampedY });
    }

    gsap.set(target, { x: startX, y: startY });
  }, [initialPosition]);

  useEffect(() => {
    const target = dragTargetRef.current;
    if (!target) return;

    const boundsEl = target.parentNode as HTMLElement;

    const draggable = Draggable.create(target, {
      type: "x,y",
      bounds: boundsEl,
      inertia: true,
      onDrag(this: Draggable) {
        const rot = this.deltaX * 0.4;
        if (isMobile) {
          gsap.set(target, { rotation: rot });
        } else {
          gsap.to(target, {
            rotation: gsap.utils.clamp(-24, 24, rot),
            duration: 0.15,
            ease: "power1.out",
          });
        }
      },
      onDragEnd() {
        gsap.to(target, {
          rotation: 0,
          duration: 0.8,
          ease: "power2.out",
        });
      },
    });

    draggableInstanceRef.current = draggable[0];

    const handleResize = () => {
      if (!draggableInstanceRef.current) return;

      draggableInstanceRef.current.update();

      const currentX = gsap.getProperty(target, "x") as number;
      const currentY = gsap.getProperty(target, "y") as number;

      const boundsRect = boundsEl.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();

      const maxX = boundsRect.width - targetRect.width;
      const maxY = boundsRect.height - targetRect.height;

      const newX = Math.max(0, Math.min(currentX, maxX));
      const newY = Math.max(0, Math.min(currentY, maxY));

      if (newX !== currentX || newY !== currentY) {
        gsap.to(target, {
          x: newX,
          y: newY,
          duration: 0.3,
          ease: "power2.out",
        });
      }
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
      if (draggableInstanceRef.current) {
        draggableInstanceRef.current.kill();
      }
    };
  }, [isMobile]);

  useEffect(() => {
    if (disableEffectsOnMobile && isMobile) return;

    const updateLight = (e: Event) => {
      const mouseEvent = e as MouseEvent;
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = mouseEvent.clientX - rect.left;
      const y = mouseEvent.clientY - rect.top;

      if (pointLightRef.current) {
        gsap.set(pointLightRef.current, { attr: { x, y } });
      }

      const normalizedAngle = Math.abs(peelDirection % 360);
      if (pointLightFlippedRef.current) {
        if (normalizedAngle !== 180) {
          gsap.set(pointLightFlippedRef.current, {
            attr: { x, y: rect.height - y },
          });
        } else {
          gsap.set(pointLightFlippedRef.current, {
            attr: { x: -1000, y: -1000 },
          });
        }
      }
    };

    let rafId: number | null = null;
    const throttled = (e: MouseEvent) => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        updateLight(e);
        rafId = null;
      });
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("mousemove", throttled);
      return () => container.removeEventListener("mousemove", throttled);
    }
  }, [peelDirection, isMobile, disableEffectsOnMobile]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = () => container.classList.add("touch-active");
    const handleTouchEnd = () => container.classList.remove("touch-active");

    container.addEventListener("touchstart", handleTouchStart);
    container.addEventListener("touchend", handleTouchEnd);
    container.addEventListener("touchcancel", handleTouchEnd);

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchend", handleTouchEnd);
      container.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, []);

  const cssVars: CSSVars = useMemo(() => ({
    "--sticker-rotate": `${rotate}deg`,
    "--sticker-p": `${defaultPadding}px`,
    "--sticker-peelback-hover": `${peelBackHoverPct}%`,
    "--sticker-peelback-active": `${peelBackActivePct}%`,
    "--sticker-peel-easing": peelEasing,
    "--sticker-peel-hover-easing": peelHoverEasing,
    "--sticker-width": `${width}px`,
    "--sticker-shadow-opacity": shadowIntensity,
    "--sticker-lighting-constant": lightingIntensity,
    "--peel-direction": `${peelDirection}deg`,
    "--sticker-start": `calc(-1 * ${defaultPadding}px)`,
    "--sticker-end": `calc(100% + ${defaultPadding}px)`,
  }), [
    rotate, peelBackHoverPct, peelBackActivePct,
    peelEasing, peelHoverEasing, width,
    shadowIntensity, lightingIntensity, peelDirection
  ]);

  const imageStyle: CSSProperties = {
    transform: `rotate(calc(${rotate}deg - ${peelDirection}deg))`,
    width: `${width}px`,
  };

  const flapStyle: CSSProperties = {
    clipPath: `polygon(var(--sticker-start) var(--sticker-start), var(--sticker-end) var(--sticker-start), var(--sticker-end) var(--sticker-start), var(--sticker-start) var(--sticker-start))`,
    top: `calc(-100% - var(--sticker-p) - var(--sticker-p))`,
    transform: "scaleY(-1)",
    transition: isMobile ? undefined : "all 0.6s ease-out",
    willChange: isMobile ? undefined : "clip-path, transform",
  };

  const shadowImageStyle: CSSProperties = {
    ...imageStyle,
    filter: disableEffectsOnMobile && isMobile ? "none" : "url(#expandAndFill)",
  };

  return (
    <div
      className={`absolute cursor-grab active:cursor-grabbing transform-gpu ${className}`}
      ref={dragTargetRef}
      style={cssVars}
    >
      <style dangerouslySetInnerHTML={{ __html: `
        .sticker-container:hover .sticker-main,
        .sticker-container.touch-active .sticker-main {
          clip-path: polygon(var(--sticker-start) var(--sticker-peelback-hover), var(--sticker-end) var(--sticker-peelback-hover), var(--sticker-end) var(--sticker-end), var(--sticker-start) var(--sticker-end)) !important;
        }
        .sticker-container:hover .sticker-flap,
        .sticker-container.touch-active .sticker-flap {
          clip-path: polygon(var(--sticker-start) var(--sticker-start), var(--sticker-end) var(--sticker-start), var(--sticker-end) var(--sticker-peelback-hover), var(--sticker-start) var(--sticker-peelback-hover)) !important;
          top: calc(-100% + 2 * var(--sticker-peelback-hover) - 1px) !important;
        }
        .sticker-container:active .sticker-main {
          clip-path: polygon(var(--sticker-start) var(--sticker-peelback-active), var(--sticker-end) var(--sticker-peelback-active), var(--sticker-end) var(--sticker-end), var(--sticker-start) var(--sticker-end)) !important;
        }
        .sticker-container:active .sticker-flap {
          clip-path: polygon(var(--sticker-start) var(--sticker-start), var(--sticker-end) var(--sticker-start), var(--sticker-end) var(--sticker-peelback-active), var(--sticker-start) var(--sticker-peelback-active)) !important;
          top: calc(-100% + 2 * var(--sticker-peelback-active) - 1px) !important;
        }
      `}} />

      {!(disableEffectsOnMobile && isMobile) && (
        <svg width="0" height="0">
          <defs>
            <filter id="pointLight">
              <feGaussianBlur stdDeviation="1" result="blur" />
              <feSpecularLighting result="spec" in="blur" specularExponent="100" specularConstant={lightingIntensity} lightingColor="white">
                <fePointLight ref={pointLightRef} x="100" y="100" z="300" />
              </feSpecularLighting>
              <feComposite in="spec" in2="SourceGraphic" result="lit" />
              <feComposite in="lit" in2="SourceAlpha" operator="in" />
            </filter>

            <filter id="pointLightFlipped">
              <feGaussianBlur stdDeviation="10" result="blur" />
              <feSpecularLighting result="spec" in="blur" specularExponent="100" specularConstant={lightingIntensity * 7} lightingColor="white">
                <fePointLight ref={pointLightFlippedRef} x="100" y="100" z="300" />
              </feSpecularLighting>
              <feComposite in="spec" in2="SourceGraphic" result="lit" />
              <feComposite in="lit" in2="SourceAlpha" operator="in" />
            </filter>

            <filter id="dropShadow">
              <feDropShadow dx="2" dy="4" stdDeviation={3 * shadowIntensity} floodColor="black" floodOpacity={shadowIntensity} />
            </filter>

            <filter id="expandAndFill">
              <feOffset dx="0" dy="0" in="SourceAlpha" result="shape" />
              <feFlood floodColor="rgb(179,179,179)" result="flood" />
              <feComposite operator="in" in="flood" in2="shape" />
            </filter>
          </defs>
        </svg>
      )}

      <div
        className="sticker-container relative select-none touch-none sm:touch-auto"
        ref={containerRef}
        style={{
          WebkitUserSelect: "none",
          userSelect: "none",
          WebkitTouchCallout: "none",
          WebkitTapHighlightColor: "transparent",
          transform: `rotate(${peelDirection}deg)`,
          transformOrigin: "center",
        }}
      >
        <div className="sticker-main" style={{ ...imageStyle, clipPath: `polygon(var(--sticker-start) var(--sticker-start), var(--sticker-end) var(--sticker-start), var(--sticker-end) var(--sticker-end), var(--sticker-start) var(--sticker-end))`, filter: disableEffectsOnMobile && isMobile ? "none" : "url(#dropShadow)" }}>
          <div style={{ filter: disableEffectsOnMobile && isMobile ? "none" : "url(#pointLight)" }}>
            <img src={imageSrc} alt="" className="block" style={imageStyle} draggable="false" onContextMenu={(e) => e.preventDefault()} />
          </div>
        </div>

        <div className="absolute top-4 left-2 w-full h-full opacity-40" style={{ filter: "brightness(0) blur(8px)" }}>
          <div className="sticker-flap" style={flapStyle}>
            <img src={imageSrc} alt="" className="block" style={shadowImageStyle} draggable="false" onContextMenu={(e) => e.preventDefault()} />
          </div>
        </div>

        <div className="sticker-flap absolute w-full h-full left-0" style={flapStyle}>
          <div style={{ filter: disableEffectsOnMobile && isMobile ? "none" : "url(#pointLightFlipped)" }}>
            <img src={imageSrc} alt="" className="block" style={shadowImageStyle} draggable="false" onContextMenu={(e) => e.preventDefault()} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StickerPeel;
