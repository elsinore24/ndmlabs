"use client";

import type { ReactNode } from "react";

/** An App Store link that also works inside other apps' browsers.
 *
 *  TikTok, Instagram and the like block a plain apps.apple.com link in their
 *  in-app browsers ("Action can't be completed", Dan, 2026-11-06). On an
 *  iPhone or iPad the tap opens the App Store app directly with itms-apps://,
 *  then falls back to the web listing if the page is still showing 1.5s later.
 *  The fallback is cancelled once the App Store takes over, so coming back to
 *  the page doesn't land on the web listing. Elsewhere it is an ordinary link.
 *  (The /links page did this first, for TikTok, in 4045381.) */
export function itmsUrl(href: string): string {
  return href.replace(/^https:\/\//, "itms-apps://");
}

function onAppleTouchDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

export default function StoreLink({
  href,
  className,
  newTab = false,
  children,
}: {
  href: string;
  className?: string;
  newTab?: boolean;
  children: ReactNode;
}) {
  const onClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!onAppleTouchDevice()) return;
    e.preventDefault();
    let left = false;
    const away = () => { left = true; };
    document.addEventListener("visibilitychange", away, { once: true });
    window.addEventListener("pagehide", away, { once: true });
    window.location.href = itmsUrl(href);
    window.setTimeout(() => {
      if (!left && document.visibilityState === "visible") window.location.href = href;
    }, 1500);
  };

  return (
    <a
      href={href}
      onClick={onClick}
      className={className}
      {...(newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {children}
    </a>
  );
}
