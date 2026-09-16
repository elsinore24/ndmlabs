"use client";

// The marketing asset: the live Kings, one line each, inside the homepage's
// Coach of the Year card. `CURRENT KING: BELIEVE IN MIKE · 2 DEFENSES` over
// `LEGENDS CHAMPION: '07 SPURS · 0 DEFENSES`. Two thrones since 2026-09-16
// (the app's migration 0013): row 1 is the fives coaches build, row 2 the
// real champions, and the champion gets the same billing as the King.

import { useEffect, useState } from "react";

const SUPABASE_URL = "https://lopawitfeyhtzppfchik.supabase.co";
const SUPABASE_KEY = "sb_publishable_Jy4XRKu11PdztPoCSZfduw_kHed6SyY";

// A throne held by a deleted account carries the placeholder the app's
// `delete_account_tx` writes. The board drops the coach's name there; this
// card never showed one, so it only has to avoid announcing the placeholder
// as though it were a team somebody picked (audit, 2026-09-12).
const RETIRED_TEAM = "RETIRED FIVE";

type King = { id: 1 | 2; team: string; defenses: number };

export default function CurrentKing({ fallback }: { fallback: string }) {
  const [kings, setKings] = useState<King[] | null>(null);

  useEffect(() => {
    fetch(`${SUPABASE_URL}/rest/v1/throne?id=in.(1,2)&select=id,team_name,defenses&order=id`, {
      headers: { apikey: SUPABASE_KEY },
    })
      .then((r) => r.json())
      .then((rows: { id: 1 | 2; team_name: string; defenses: number }[]) => {
        if (rows?.length) setKings(rows.map((r) => ({ id: r.id, team: r.team_name, defenses: r.defenses })));
      })
      .catch(() => {});
  }, []);

  if (!kings) return <span className="text-gray-400">{fallback}</span>;
  return (
    <span className="font-mono text-sm tracking-widest inline-flex flex-col gap-1">
      {kings.map((king) => {
        // Only a built five is ever anonymised to RETIRED FIVE; a champion
        // keeps its name when its coach retires (0013 §8), so the check is
        // harmless on row 2 and right on row 1.
        const retired = king.team === RETIRED_TEAM;
        return (
          <span key={king.id}>
            <span className="text-[#FFB020]">{king.id === 2 ? "LEGENDS CHAMPION:" : "CURRENT KING:"}</span>{" "}
            <span className="text-white font-bold">
              {retired ? "A RETIRED FIVE" : king.team.toUpperCase()}
            </span>
            {/* One unbreakable unit: the card is narrow enough that this line
                wraps, and "· 2" on one line with DEFENSES alone on the next
                reads as a count of nothing. */}
            <span className="text-gray-500 whitespace-nowrap">
              {" "}· {king.defenses} {king.defenses === 1 ? "DEFENSE" : "DEFENSES"}
            </span>
          </span>
        );
      })}
    </span>
  );
}
