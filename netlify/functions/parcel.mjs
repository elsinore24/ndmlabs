// Netlify Function: /api/parcel
// Looks up Clark County, WA parcels from the county's public ArcGIS layer.
//
//   GET /api/parcel?q=1300 franklin   -> up to 8 address matches (for search/autocomplete)
//   GET /api/parcel?id=55735000        -> full report for one parcel, plus sales history
//
// Owner names are intentionally NOT returned (see RCW 42.56.070(8)).

const PIC = "https://gis.clark.wa.gov/gishome/property/index.cfm?fuseaction=report&account=";

const REST = "https://gis.clark.wa.gov/arcgisfed/rest/services";
const LAYER = `${REST}/ClarkView_Public/TaxlotsPublic/MapServer/0/query`;

// Other county layers used in the report (all public, same server)
const LAYERS = {
  flood:      `${REST}/Flood_Zone_Designation/MapServer/0/query`,
  quake:      `${REST}/ClarkView_Public/EarthquakeHazardNEHRP/MapServer/0/query`,
  landslide:  `${REST}/Steep_Slopes_and_Landslide_Hazard_Areas/MapServer/1/query`,
  easements:  `${REST}/ClarkView_Public/Encumbrances/MapServer/0/query`,
  septic:     `${REST}/ClarkView_Public/SepticSystemStatus/MapServer/0/query`,
};
const UA = { "User-Agent": "ndmlabs-home-history/1.0" };

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

async function queryCounty(params, { withGeometry = false } = {}) {
  const url = `${LAYER}?${new URLSearchParams({ f: "json", returnGeometry: String(withGeometry), ...params })}`;
  const res = await fetch(url, { headers: UA });
  if (!res.ok) throw new Error(`County server responded ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || "County query error");
  const fields = String(params.outFields).split(",");
  return (data.features || []).map((f) => {
    const row = normalize(f.attributes, fields);
    if (withGeometry) Object.defineProperty(row, "_geometry", { value: f.geometry, enumerable: false });
    return row;
  });
}

// ---------- Hazards, septic and easements (other county layers) ----------

// Ask a county layer which of its features touch this lot. The lot outline is
// pulled ~2 ft inward first, so features that only touch a neighbor along the
// shared property line don't count.
export function shrinkRings(geometry, feet = 2) {
  if (!geometry || !geometry.rings) return null;
  const pts = geometry.rings.flat();
  const cx = pts.reduce((a, p) => a + p[0], 0) / pts.length;
  const cy = pts.reduce((a, p) => a + p[1], 0) / pts.length;
  const rings = geometry.rings.map((ring) => ring.map(([x, y]) => {
    const dx = cx - x, dy = cy - y, d = Math.hypot(dx, dy);
    const step = Math.min(feet, d * 0.1);
    return d ? [x + (dx / d) * step, y + (dy / d) * step] : [x, y];
  }));
  return { rings, spatialReference: geometry.spatialReference || { wkid: 2286 } };
}

async function layerQuery(url, params) {
  const res = await fetch(url, {
    method: "POST",
    headers: { ...UA, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ f: "json", returnGeometry: "false", ...params }),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`County server responded ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || "County query error");
  return (data.features || []).map((f) => f.attributes);
}

const touching = (url, geometry, outFields) =>
  layerQuery(url, {
    geometry: JSON.stringify(geometry),
    geometryType: "esriGeometryPolygon",
    spatialRel: "esriSpatialRelIntersects",
    outFields,
  });

// Each lookup returns null if that layer fails, so one slow layer can't sink the report
const safe = (p) => p.catch(() => null);
const uniq = (arr, key) => [...new Map(arr.map((x) => [key(x), x])).values()];

// Labels below come from the county's own map legends and field definitions
const FLOOD_RANK = { "5": 5, "2": 4, "8": 2, "7": 1, "0": 0 }; // floodway, 100-yr, 500-yr, not studied, outside
const QUAKE_ORDER = ["E", "PEAT", "D-E", "D", "C-D", "C", "B-C", "B"];
const SLIDE_LABELS = {
  "3": "Area of historic or active landslides",
  "4": "Area of older landslide debris",
  "2": "Area of potential instability",
  "1": "Slopes over 25%",
  "5": "Slopes over 15%",
};
const ENCUMBRANCE = { AGR: "Agreement", COV: "Covenant", LIC: "License", MOU: "Memorandum of understanding", REL: "Release", DT: "Deed of trust", EAS: "Easement", TCE: "Temporary construction easement" };
const RIGHT_OF_USE = { CONS: "Conservation", DRN: "Drainage", GR: "Guardrail", IE: "Ingress and egress (access)", OTHER: "Other", RD: "Roadway", RR: "Railroad", SD: "Sight distance", TS: "Traffic signal", UNK: "Unknown", UTIL: "Utility", WALK: "Walkway", WALL: "Wall", DIKE: "Dike", SLOPE: "Slope", PA: "Public access" };
const SEPTIC_STATUS = { "0": "Operational", A: "Approved, reports to state", B: "Approved, Yacolt inspection program" };

export async function fetchSpatial(geometry) {
  const g = shrinkRings(geometry);
  if (!g) return { flood: null, quake: null, landslide: null, easements: null };
  const [flood, quake, landslide, easements] = await Promise.all([
    safe(touching(LAYERS.flood, g, "FLOOD,FLDZONE,DESC_")),
    safe(touching(LAYERS.quake, g, "NEHRP")),
    safe(touching(LAYERS.landslide, g, "LndSlp")),
    // Grantor and grantee are deliberately NOT requested (often private people)
    safe(touching(LAYERS.easements, g, "Encumbrance,RightOfUse,RecNumber,RecDate")),
  ]);
  return {
    flood: flood && uniq(flood, (f) => `${f.FLOOD}|${f.FLDZONE}`)
      .map((f) => ({ code: String(f.FLOOD), zone: (f.FLDZONE || "").trim(), label: (f.DESC_ || "").trim() }))
      .sort((a, b) => (FLOOD_RANK[b.code] ?? 0) - (FLOOD_RANK[a.code] ?? 0)),
    quake: quake && uniq(quake.map((q) => String(q.NEHRP || "").trim()).filter(Boolean), (x) => x)
      .sort((a, b) => QUAKE_ORDER.indexOf(a) - QUAKE_ORDER.indexOf(b)),
    landslide: landslide && uniq(landslide.map((l) => String(l.LndSlp)), (x) => x)
      .map((c) => ({ code: c, label: SLIDE_LABELS[c] || `Category ${c}` })),
    easements: easements && uniq(easements, (e) => `${e.Encumbrance}|${e.RightOfUse}|${e.RecNumber}`)
      .map((e) => ({
        type: ENCUMBRANCE[(e.Encumbrance || "").trim()] || (e.Encumbrance || "").trim() || "Recorded encumbrance",
        use: RIGHT_OF_USE[(e.RightOfUse || "").trim()] || null,
        recNumber: e.RecNumber ? String(e.RecNumber).trim() : null,
        recDate: e.RecDate ?? null,
      }))
      .sort((a, b) => (b.recDate || 0) - (a.recDate || 0)),
  };
}

export async function fetchSeptic(id) {
  const rows = await layerQuery(LAYERS.septic, {
    where: `GisPropId = ${Number(id)}`,
    outFields: "RecordID,Status,InstallDt,ApprovDt,ApplicDt,UdfLastIns,ReinspDt,BEDROOMS",
  });
  return rows.map((r) => ({
    record: r.RecordID || null,
    status: SEPTIC_STATUS[String(r.Status)] || (r.Status != null ? String(r.Status) : null),
    installed: r.InstallDt ?? null,
    approved: r.ApprovDt ?? null,
    applied: r.ApplicDt ?? null,
    lastInspection: r.UdfLastIns ?? null,
    nextInspection: r.ReinspDt ?? null,
    bedrooms: r.BEDROOMS || null,
  }));
}

// ---------- Sales history + past values (from the county's property page) ----------
// The county builds this page as HTML (no JSON), so we read just two sections:
// Sales History and Assessment Data. The owner name and mailing address on the
// same page are never extracted. If the county redesigns the page, these
// parsers return empty lists and the rest of the report still works.

const decode = (s) =>
  s.replace(/<[^>]*>/g, " ")
   .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"')
   .replace(/\s+/g, " ").trim();

// All <td> texts inside html[start .. end)
function cells(html, start, end) {
  const part = html.slice(start, end);
  return [...part.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map((m) => decode(m[1]));
}

const money = (s) => {
  const n = Number(String(s || "").replace(/[$,\s]/g, ""));
  return Number.isFinite(n) ? n : null;
};

// MM/DD/YYYY -> YYYY-MM-DD ; the county uses 01/01/1900 as "unknown"
const isoDate = (s) => {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(s || "").trim());
  if (!m || m[3] === "1900") return null;
  return `${m[3]}-${m[1]}-${m[2]}`;
};

export function parseSales(html) {
  const i = html.indexOf(">Sales History<");
  if (i < 0) return [];
  const end = html.indexOf("</table>", i);
  const c = cells(html, i, end < 0 ? html.length : end);
  const sales = [];
  let cur = null;
  for (let k = 0; k < c.length - 1; k++) {
    const label = c[k], value = c[k + 1];
    if (label === "Date of Sale") { cur = { date: isoDate(value), docType: null, docNumber: null, excise: null, amount: null }; sales.push(cur); k++; }
    else if (!cur) continue;
    else if (label === "Document Type") { cur.docType = value || null; k++; }
    else if (label === "Document Number") { cur.docNumber = value || null; k++; }
    else if (label === "Excise Number") { cur.excise = value || null; k++; }
    else if (label === "Sale Amount") { cur.amount = money(value); k++; }
  }
  // Newest first; unknown dates last
  return sales.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
}

export function parseValues(html) {
  const i = html.indexOf("Assessment Data");
  if (i < 0) return [];
  let end = html.indexOf("<b>General</b>", i);
  if (end < 0) end = html.indexOf("</table>", i);
  const c = cells(html, i, end);
  const years = [];
  let cur = null;
  for (let k = 0; k < c.length; k++) {
    const yr = /^(\d{4}) Values for (\d{4}) Taxes$/.exec(c[k]);
    if (yr) { cur = { valueYear: +yr[1], taxYear: +yr[2], land: null, building: null, total: null, taxable: null }; years.push(cur); continue; }
    if (!cur) continue;
    const v = c[k + 1];
    if (c[k] === "Land Value") cur.land = money(v);
    else if (c[k] === "Building Value") cur.building = money(v);
    else if (c[k] === "Total Property") cur.total = money(v);
    else if (c[k] === "Total") cur.taxable = money(v);
  }
  return years;
}

// A single "Label | Value" row from the PIC page, e.g. "Increased Wildfire Danger Area"
export function picField(html, label) {
  const i = html.indexOf(label);
  if (i < 0) return null;
  const c = cells(html, i - 200, i + 600);
  const k = c.findIndex((t) => t === label);
  return k >= 0 && c[k + 1] != null ? c[k + 1] : null;
}

function parsePic(html) {
  return {
    sales: parseSales(html),
    values: parseValues(html),
    wildfireArea: picField(html, "Increased Wildfire Danger Area"),
  };
}

async function fetchHistory(id) {
  try {
    const res = await fetch(PIC + id, {
      headers: UA,
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    return parsePic(await res.text());
  } catch {
    return null; // report still works without history
  }
}

export default async (req) => {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  const q = cleanQuery(url.searchParams.get("q"));

  try {
    if (id) {
      if (!/^\d{1,12}$/.test(id)) return json({ error: "Bad parcel id" }, 400);
      const parcelP = queryCounty(
        { where: `Prop_id = ${Number(id)}`, outFields: REPORT_FIELDS.join(",") },
        { withGeometry: true },
      );
      // Everything runs at the same time; map-shape lookups start as soon as the lot outline arrives
      const [rows, history, septic, spatial] = await Promise.all([
        parcelP,
        fetchHistory(Number(id)),
        safe(fetchSeptic(Number(id))),
        parcelP.then((r) => (r.length ? fetchSpatial(r[0]._geometry) : null)).catch(() => null),
      ]);
      if (!rows.length) return json({ error: "Parcel not found" }, 404);
      const hazards = spatial && {
        flood: spatial.flood,
        quake: spatial.quake,
        landslide: spatial.landslide,
        wildfireArea: history ? history.wildfireArea : null,
      };
      return json({
        parcel: rows[0],
        history,
        hazards,
        septic,
        easements: spatial ? spatial.easements : null,
        source: "Clark County GIS / Assessor",
      }, 200, 86400);
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
