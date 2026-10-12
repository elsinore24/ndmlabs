// Netlify Function: /api/parcel
// Looks up Clark County, WA parcels from the county's public ArcGIS layer.
//
//   GET /api/parcel?q=1300 franklin   -> up to 8 address matches (for search/autocomplete)
//   GET /api/parcel?id=55735000        -> full report for one parcel
//
// Owner names are intentionally NOT returned (see RCW 42.56.070(8)).

const LAYER =
  "https://gis.clark.wa.gov/arcgisfed/rest/services/ClarkView_Public/TaxlotsPublic/MapServer/0/query";

// Fields used for the search list
const LIST_FIELDS = ["Prop_id", "SitusAddrsFull", "SitusAddrs", "SitusCity", "BldgYrBlt"];

// Fields used for the full report (no owner fields)
const REPORT_FIELDS = [
  "Prop_id", "SitusAddrsFull", "SitusCity", "SitusZip1",
  "PropertyUseClass", "PT1DESC", "BLDGTYPE", "BldgStyle", "BldgClass", "BldgCond",
  "BldgYrBlt", "BldgEffYrBlt", "BLDGSQFT", "BldgCount", "UNITS",
  "AssrAc", "AssrSqFt",
  "MktLandVal", "MktBldgVal", "MktTotVal", "TAXTOTVAL", "NewCon", "AvYear",
  "TaxAmount", "TaxYear", "TaxStat",
  "SaleDate", "SaleAmount", "SaleExcise",
  "ZoneDesc", "ComplanDesc", "JurisDesc", "CityUGA",
  "PlatName", "PlatType", "PlatDate",
  "SchoolDistrict", "ElementarySchool", "JuniorSchool", "SeniorSchool",
  "CensusTract", "LegalShort", "PublishDt",
];

const json = (body, status = 200, cacheSeconds = 0) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      // Cache good answers at Netlify's edge so repeat lookups don't hit the county
      ...(cacheSeconds
        ? {
            "Cache-Control": "public, max-age=300",
            "Netlify-CDN-Cache-Control": `public, s-maxage=${cacheSeconds}, stale-while-revalidate=86400`,
          }
        : { "Cache-Control": "no-store" }),
    },
  });

// Keep only characters that belong in an address (quotes are escaped in buildWhere)
export function cleanQuery(raw) {
  return String(raw || "")
    .toUpperCase()
    .replace(/[^A-Z0-9 #.'\-\/]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

export function buildWhere(q) {
  if (/^\d{5,12}$/.test(q)) {
    // Looks like a parcel / tax account number
    return `Prop_id = ${Number(q)}`;
  }
  const safe = q.replace(/'/g, "''");
  return `SitusAddrs LIKE '${safe}%'`;
}

// The county returns some fields with different capitalization than its schema
// lists (e.g. BLDGSQFT comes back as BldgSqft). Re-key each record to the exact
// names we asked for, matching case-insensitively.
export function normalize(attrs, fields) {
  const byLower = {};
  for (const [k, v] of Object.entries(attrs || {})) byLower[k.toLowerCase()] = v;
  const out = {};
  for (const f of fields) out[f] = byLower[f.toLowerCase()] ?? null;
  return out;
}

async function queryCounty(params) {
  const url = `${LAYER}?${new URLSearchParams({ f: "json", returnGeometry: "false", ...params })}`;
  const res = await fetch(url, { headers: { "User-Agent": "ndmlabs-home-history/1.0" } });
  if (!res.ok) throw new Error(`County server responded ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || "County query error");
  const fields = String(params.outFields).split(",");
  return (data.features || []).map((f) => normalize(f.attributes, fields));
}

export default async (req) => {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  const q = cleanQuery(url.searchParams.get("q"));

  try {
    if (id) {
      if (!/^\d{1,12}$/.test(id)) return json({ error: "Bad parcel id" }, 400);
      const rows = await queryCounty({
        where: `Prop_id = ${Number(id)}`,
        outFields: REPORT_FIELDS.join(","),
      });
      if (!rows.length) return json({ error: "Parcel not found" }, 404);
      return json({ parcel: rows[0], source: "Clark County GIS / Assessor" }, 200, 86400);
    }

    if (q.length < 3) return json({ results: [] });

    const rows = await queryCounty({
      where: buildWhere(q),
      outFields: LIST_FIELDS.join(","),
      orderByFields: "SitusAddrs",
      resultRecordCount: "8",
    });

    // De-duplicate (condos can stack several records on one address)
    const seen = new Set();
    const results = rows
      .filter((r) => r.Prop_id && !seen.has(r.Prop_id) && seen.add(r.Prop_id))
      .map((r) => ({
        id: r.Prop_id,
        address: r.SitusAddrsFull || [r.SitusAddrs, r.SitusCity].filter(Boolean).join(", "),
        yearBuilt: r.BldgYrBlt || null,
      }));

    return json({ results }, 200, 3600);
  } catch (err) {
    return json({ error: "Could not reach the county records right now. Try again shortly." }, 502);
  }
};

export const config = { path: "/api/parcel" };
