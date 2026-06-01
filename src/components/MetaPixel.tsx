"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function trackPixelEvent(eventName: string, data?: Record<string, any>) {
  if (typeof window !== "undefined" && (window as any).fbq) {
    (window as any).fbq("track", eventName, data);
    console.log(`[Meta Pixel Event Tracked]: ${eventName}`, data);
  } else {
    console.log(`[Meta Pixel Event Logged (Mocked)]: ${eventName}`, data);
  }
}

export default function MetaPixel() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
    if (!pixelId) {
      console.log("[Meta Pixel Client]: Pixel ID is missing in environment variables.");
      return;
    }

    // Initialize Meta Pixel
    /* eslint-disable */
    const w = window as any;
    if (!w.fbq) {
      w.fbq = function() {
        w.fbq.callMethod ? w.fbq.callMethod.apply(w.fbq, arguments) : w.fbq.queue.push(arguments);
      };
      if (!w._fbq) w._fbq = w.fbq;
      w.fbq.push = w.fbq;
      w.fbq.loaded = true;
      w.fbq.version = '2.0';
      w.fbq.queue = [];
      
      const script = document.createElement("script");
      script.async = true;
      script.src = "https://connect.facebook.net/en_US/fbevents.js";
      document.head.appendChild(script);

      w.fbq('init', pixelId);
    }
    /* eslint-enable */
  }, []);

  useEffect(() => {
    const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
    if (pixelId && typeof window !== "undefined" && (window as any).fbq) {
      (window as any).fbq("track", "PageView");
    }
  }, [pathname, searchParams]);

  return null;
}
