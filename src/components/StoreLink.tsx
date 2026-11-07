"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { inTikTok, itmsUrl } from "./storeLinkRules";

/** An App Store link that copes with other apps' browsers.
 *
 *  Instagram and the like block a plain apps.apple.com link in their in-app
 *  browsers ("Action can't be completed", Dan, 2026-11-06). On an iPhone or
 *  iPad the tap opens the App Store app directly with itms-apps://, then falls
 *  back to the web listing if the page is still showing 1.5s later. The
 *  fallback is cancelled once the App Store takes over, so coming back to the
 *  page doesn't land on the web listing. Elsewhere it is an ordinary link.
 *  (The /links page did this first, in 4045381.)
 *
 *  TikTok's browser blocks every route to the App Store, itms-apps:// included
 *  (Dan's phone, 2026-11-06, from his Linktree), so there the tap explains how
 *  to open the page in Safari instead. */
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
  const [hint, setHint] = useState(false);

  const onClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (typeof navigator !== "undefined" && inTikTok(navigator.userAgent)) {
      e.preventDefault();
      setHint(true);
      return;
    }
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
    <>
      <a
        href={href}
        onClick={onClick}
        className={className}
        {...(newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {children}
      </a>
      {hint ? <OpenInSafari onClose={() => setHint(false)} /> : null}
    </>
  );
}

/** The how-to for TikTok. Portalled to <body>: the cards scale on hover, and
 *  a transformed parent would trap a fixed overlay inside the card. */
function OpenInSafari({ onClose }: { onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="open-in-safari-title"
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/70 backdrop-blur-sm px-4 pt-6"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-gray-900 p-6 text-left shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Points at TikTok's ••• menu, top right of the screen. */}
        <div aria-hidden="true" className="absolute -top-3 right-6 text-2xl text-[#00ff88]">↑</div>
        <h2 id="open-in-safari-title" className="text-xl font-bold text-white">
          Open in Safari to download
        </h2>
        <p className="mt-2 text-gray-400">
          TikTok&apos;s browser can&apos;t open the App Store.
        </p>
        <ol className="mt-4 space-y-3 text-white">
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#00ff88] text-sm font-bold text-black">1</span>
            <span>Tap <b>•••</b> at the top right.</span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#00ff88] text-sm font-bold text-black">2</span>
            <span>Choose <b>Open in browser</b>.</span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#00ff88] text-sm font-bold text-black">3</span>
            <span>Tap <b>Download</b> again.</span>
          </li>
        </ol>
        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={copy}
            className="py-3 rounded-lg border border-[#00ff88]/60 font-semibold text-[#00ff88] hover:bg-[#00ff88]/10 transition-colors"
          >
            {copied ? "Link copied — paste it in Safari" : "Copy link"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="py-3 rounded-lg bg-[#00ff88] font-semibold text-black hover:bg-[#00e67a] transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
