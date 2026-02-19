"use client";

import { useEffect } from "react";
import { useStore } from "@/lib/store";

export function UIPreferenceApplier() {
  const fontSize = useStore((state) => state.fontSize);
  const animations = useStore((state) => state.animations);

  useEffect(() => {
    const root = document.documentElement;

    // Remove previous font size classes
    root.classList.remove('text-default', 'text-large', 'text-larger');
    root.classList.add(`text-${fontSize}`);

    // Animation class
    if (!animations) {
      root.classList.add('reduce-animations');
    } else {
      root.classList.remove('reduce-animations');
    }
  }, [fontSize, animations]);

  return null;
}
