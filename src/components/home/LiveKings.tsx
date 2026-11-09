"use client";

// Who holds All-Time 5's two thrones right now, read live from the app's
// database (the same public query as CurrentKing). Row 1 is the King, the five
// a coach built; row 2 is the Legends champion, a real champion team.

import { useEffect, useState } from "react";
import { SUPABASE_KEY, SUPABASE_URL } from "@/app/koth/lib";

// A throne held by a deleted account shows the app's placeholder name.
const RETIRED_TEAM = "RETIRED FIVE";

type Throne = { id: 1 | 2; team: string; defenses: number };

export default function LiveKings() {
  const [thrones, setThrones] = useState<Throne[] | null>(null);

  useEffect(() => {
    let live = true;
    fetch(`${SUPABASE_URL}/rest/v1/throne?id=in.(1,2)&select=id,team_name,defenses&order=id`, {
      headers: { apikey: SUPABASE_KEY },
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((rows: { id: 1 | 2; team_name: string; defenses: number }[]) => {
        if (live && Array.isArray(rows) && rows.length) {
          setThrones(rows.map((r) => ({ id: r.id, team: r.team_name, defenses: r.defenses })));
        }
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);

  return (
    <div className="flex items-start gap-4 rounded-2xl border border-[#f2c14e]/35 bg-[#0e0a02]/80 px-5 py-[18px] backdrop-blur-sm">
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#f2c14e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="mt-0.5 flex-none">
        <path d="M3 18h18M5 18l-1-9 5 4 3-7 3 7 5-4-1 9" />
      </svg>
      {thrones ? (
        <dl className="m-0 flex min-w-0 flex-col gap-3">
          {thrones.map((t) => (
            <div key={t.id} className="flex min-w-0 flex-col gap-0.5">
              <dt className="text-[13px] font-bold text-[#f2c14e]">{t.id === 1 ? "King of the Hill" : "Legends champion"}</dt>
              <dd className="m-0 flex flex-col">
                <span className="text-[17px] font-bold leading-snug text-white">
                  {t.team === RETIRED_TEAM ? "A retired five" : t.team}
                </span>
                <span className="text-[14px] text-[#d8cdb2]">
                  {t.defenses} {t.defenses === 1 ? "title defense" : "title defenses"}
                </span>
              </dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="m-0 text-[16px] leading-snug text-[#e6ddc8]">
          Who holds the throne today? <a href="/koth" className="font-bold text-[#f2c14e] hover:text-[#ffd666]">See the Board</a>.
        </p>
      )}
    </div>
  );
}
