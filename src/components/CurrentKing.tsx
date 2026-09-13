"use client";

// The marketing asset: the live global King, one line, inside the homepage's
// Coach of the Year card. `CURRENT KING: NIGHTMARES · 7 DEFENSES`.

import { useEffect, useState } from "react";

const SUPABASE_URL = "https://lopawitfeyhtzppfchik.supabase.co";
const SUPABASE_KEY = "sb_publishable_Jy4XRKu11PdztPoCSZfduw_kHed6SyY";

// A throne held by a deleted account carries the placeholder the app's
// `delete_account_tx` writes. The board drops the coach's name there; this
// card never showed one, so it only has to avoid announcing the placeholder
// as though it were a team somebody picked (audit, 2026-09-12).
const RETIRED_TEAM = "RETIRED FIVE";

export default function CurrentKing({ fallback }: { fallback: string }) {
  const [king, setKing] = useState<{ team: string; defenses: number } | null>(null);

  useEffect(() => {
    fetch(`${SUPABASE_URL}/rest/v1/throne?id=eq.1&select=team_name,defenses`, {
      headers: { apikey: SUPABASE_KEY },
    })
      .then((r) => r.json())
      .then((rows) => {
        if (rows?.[0]) setKing({ team: rows[0].team_name, defenses: rows[0].defenses });
      })
      .catch(() => {});
  }, []);

  if (!king) return <span className="text-gray-400">{fallback}</span>;
  const retired = king.team === RETIRED_TEAM;
  return (
    <span className="font-mono text-sm tracking-widest">
      <span className="text-[#FFB020]">CURRENT KING:</span>{" "}
      <span className="text-white font-bold">
        {retired ? "A RETIRED FIVE" : king.team.toUpperCase()}
      </span>
      <span className="text-gray-500">
        {" "}· {king.defenses} {king.defenses === 1 ? "DEFENSE" : "DEFENSES"}
      </span>
    </span>
  );
}
