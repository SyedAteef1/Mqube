import { useState, useEffect } from "react";
import { DockPosition } from "./layout_store.js";

export type DeviceType = "mobile" | "tablet" | "desktop";

export interface ResponsiveProfile {
  device: DeviceType;
  width: number;
  height: number;
  effectivePosition: DockPosition;
}

export const useResponsiveLayout = (userPosition: DockPosition): ResponsiveProfile => {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 1200,
    height: typeof window !== "undefined" ? window.innerHeight : 800,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const width = windowSize.width;
  let device: DeviceType = "desktop";
  let effectivePosition: DockPosition = userPosition;

  if (width < 640) {
    device = "mobile";
    // Mobile always defaults to bottom dock navigation or elegant touch bottom bar
    effectivePosition = "bottom";
  } else if (width >= 640 && width < 1024) {
    device = "tablet";
    // Tablet supports Left, Right or Bottom. If user selected Top, fallback to Bottom for touch-friendliness
    effectivePosition = userPosition === "top" ? "bottom" : userPosition;
  } else {
    device = "desktop";
    effectivePosition = userPosition;
  }

  return {
    device,
    width: windowSize.width,
    height: windowSize.height,
    effectivePosition,
  };
};
