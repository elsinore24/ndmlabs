"use client";

// The marketing asset: the live global King, one line, on the homepage.

import { useEffect, useState } from "react";

const SUPABASE_URL = "https://lopawitfeyhtzppfchik.supabase.co";
const SUPABASE_KEY = "sb_publishable_Jy4XRKu11PdztPoCSZfduw_kHed6SyY";

export default function CurrentKing() {
  const [king, setKing] = useState<{ team: string; handle: string; defenses: number } | null>(null);

  useEffect(() => {
    fetch(`${SUPABASE_URL}/rest/v1/throne?id=eq.1&select=team_name,holder_handle,defenses`, {
      headers: { apikey: SUPABASE_KEY },
    })
      .then((r) => r.json())
      .then((rows) => {
        if (rows?.[0]) {
          setKing({
            team: rows[0].team_name,
            handle: rows[0].holder_handle,
            defenses: rows[0].defenses,
          });
        }
      })
      .catch(() => {});
  }, []);

  if (!king) return null;
  return (
    <a
      href="/koth"
      className="mt-10 mx-auto flex max-w-xl items-baseline justify-center gap-3 rounded-xl border border-[#FFB020]/40 px-6 py-3 font-mono text-sm hover:border-[#FFB020] transition-colors"
    >
      <span className="text-[#FFB020]">👑 CURRENT KING</span>
      <span className="font-bold text-white">{king.team}</span>
      <span className="text-gray-500">
        {king.defenses} {king.defenses === 1 ? "defense" : "defenses"}
      </span>
    </a>
  );
}
