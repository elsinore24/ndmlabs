// Burner Phone: the game. It is the I Found Your Phone engine with five different apps.
// The phones themselves, and the rules for writing one, are in phones.js.
(function () {
  "use strict";
  const { CASES, SUSPECTS } = window.BURNER;

  const APP_LABEL = { drafts: "Drafts", pay: "Payments", voicemail: "Voicemail", places: "Timeline", photo: "Photo" };
  const MAX = 5;
  const PREFIX = "burnerphone:v1:";
  // Shown under a copied result. Change it when the game moves to its own domain.
  const SITE = "ndmlabs.net/burnerphone";
  const byId = (id) => CASES.find((c) => c.id === +id) || null;
  const no = (id) => "No. " + String(id).padStart(3, "0");
  const fromHash = () => { const m = /^#phone-(\d+)$/.exec(location.hash); return m ? byId(m[1]) : null; };
  // Which phone opens: the one in the link, else the one last played, else the newest.
  function firstCase() {
    let last = null;
    try { last = byId(localStorage.getItem(PREFIX + "last")); } catch (_) {}
    return fromHash() || last || CASES[CASES.length - 1];
  }
  let CASE = firstCase();
  const key = () => PREFIX + "phone-" + CASE.id;

  // Which body and system look to draw. A phone can name its own model in phones.js;
  // adding ?model=punch (or pill, button) to the address previews another.
  const MODELS = ["pill", "punch", "button"];
  const askedModel = new URLSearchParams(location.search).get("model");
  const model = () => (MODELS.includes(askedModel) ? askedModel : MODELS.includes(CASE.model) ? CASE.model : "pill");

  // On a phone, the found phone first lies on the floor where it was lost, and the player
  // picks it up. ?ground=0 in the address turns this off, to compare with the old start.
  const GROUND = new URLSearchParams(location.search).get("ground") !== "0";
  let held = false;
  const grounded = () => GROUND && narrow() && !held && !(state.revealed && state.reading);

  /* ---------- State ---------- */
  // log: what each 1% went on, in order ({k:"app",id} or {k:"miss"}).
  const fresh = () => ({ v: 1, view: "lock", sub: null, battery: MAX, opened: [], names: [], log: [], status: "playing", revived: false, revealed: false, reading: false, fired: [], photoAt: 0 });
  let state = load();
  let flags = { enter: false, banner: false, died: false, wake: true, fresh: false };
  let lastKey = "";
  let chosen = null;
    let revealTimer = 0, alertTimer = 0, toastTimer = 0, liveTimer = 0, buzzTimer = 0, callTimer = 0;
  let sheetReturn = null, alertReturn = null, callReturn = null;

  function load() {
    let s = null;
    try { const j = JSON.parse(localStorage.getItem(key())); if (j && j.v === 1) s = j; } catch (_) {}
    if (!s || typeof s !== "object") return fresh();
    s.battery = Math.max(0, Math.min(MAX, Number.isFinite(+s.battery) ? Math.round(+s.battery) : MAX));
    for (const k of ["opened", "names", "log", "fired"]) if (!Array.isArray(s[k])) s[k] = [];
    if (typeof s.view !== "string") s.view = "lock";
    if (s.sub != null && typeof s.sub !== "string") s.sub = null;
    if (s.status !== "playing" && !s.revealed) { s.revealed = true; s.reading = true; }
    return s;
  }
  function save() { try { localStorage.setItem(key(), JSON.stringify(state)); localStorage.setItem(PREFIX + "last", String(CASE.id)); } catch (_) {} }
  // Counts for the Umami dashboard. Does nothing if the tracker is blocked or missing.
  const track = (name, data) => { try { if (window.umami) window.umami.track(name, data); } catch (_) {} };

  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
  const playing = () => state.status === "playing";
  const over = () => state.status !== "playing";
  const narrow = () => window.matchMedia("(max-width: 640px)").matches;

  /* ---------- Icons ---------- */
  const svg = (inner, size) => `<svg viewBox="0 0 24 24" ${size ? `width="${size}" height="${size}"` : ""} aria-hidden="true">${inner}</svg>`;
  const line = (d) => `<g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</g>`;
  const G = {
    phone: '<path fill="currentColor" d="M7.6 4.5h2.1l1.2 3.5-1.7 1.4a10 10 0 0 0 5.4 5.4l1.4-1.7 3.5 1.2v2.1a1.8 1.8 0 0 1-1.9 1.8A13.6 13.6 0 0 1 5.8 6.4a1.8 1.8 0 0 1 1.8-1.9z"/>',
    bubble: '<path fill="currentColor" d="M5 5.5h14A2.5 2.5 0 0 1 21.5 8v6.5A2.5 2.5 0 0 1 19 17h-6.2L8 20.5V17H5a2.5 2.5 0 0 1-2.5-2.5V8A2.5 2.5 0 0 1 5 5.500z"/>',
    search: line('<circle cx="11" cy="11" r="6"/><path d="M15.6 15.6l4.4 4.4"/>'),
    photo: '<circle cx="8.3" cy="8.8" r="2.3" fill="#f0b23e"/><path d="M2.5 19l6-6.5 3.6 3.6 3.6-4.6L21.5 19z" fill="#5d9bd6"/>',
    found: '<g fill="none" stroke-width="1.7" stroke-linecap="round"><rect x="7.5" y="3.500" width="9" height="17" rx="2.300" stroke="#fff"/><path d="M10.800 17.200h2.400" stroke="#ff453a"/></g>',
    cup: '<path fill="currentColor" d="M6.500 5h11v1.800h-11z"/><path fill="currentColor" d="M7.300 8.300h9.400l-.900 10.500a1.700 1.700 0 0 1-1.700 1.600h-4.200a1.700 1.700 0 0 1-1.700-1.600z"/>',
    in: line('<path d="M17 7L8 16M8 9.500V16h6.500"/>'),
    back: '<g fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 5.500L8 12l6.500 6.500"/></g>',
    up: line('<path d="M6 14.500l6-6 6 6"/>'),
    person: line('<circle cx="12" cy="8.800" r="3.300"/><path d="M5.500 19c.900-3.300 3.400-5 6.500-5s5.600 1.700 6.500 5"/>'),
    clock: line('<circle cx="12" cy="12" r="7.500"/><path d="M12 8v4.300l2.700 1.700"/>'),
    missed: line('<path d="M17 7L8 16M8 9.500V16h6.500"/>'),
    out: line('<path d="M7 17l9-9M16 14.500V8H9.500"/>'),
    declined: line('<circle cx="12" cy="12" r="7"/><path d="M7.200 7.200l9.600 9.600"/>'),
    arrow: line('<path d="M19 12H5.500M11 6l-6 6 6 6"/>'),
    fwd: line('<path d="M9.500 5.500L16 12l-6.500 6.500"/>'),
    note: line('<path d="M7 3.500h7.500L18 7v13.500H7z"/><path d="M10 11.500h5M10 15h5"/>'),
    image: line('<rect x="3.500" y="5" width="17" height="14" rx="2.500"/><circle cx="9" cy="10" r="1.600"/><path d="M4.500 17.500l5-4.500 3.500 3 2.500-2 4 3.500"/>'),
    down: line('<path d="M12 4v10.500M7.500 10l4.500 4.500 4.500-4.500M5 19.500h14"/>'),
    lift: line('<path d="M12 19.500V9M7.500 13.500 12 9l4.500 4.500M5 4.500h14"/>'),
    pencil: line('<path d="M4.500 19.500l1-4 9.500-9.500 3 3-9.500 9.500z"/><path d="M13.500 7.500l3 3"/>'),
    cash: line('<circle cx="12" cy="12" r="7.500"/><path d="M14.500 9.600c-.500-.900-1.400-1.400-2.500-1.400-1.400 0-2.500.700-2.500 1.900 0 2.700 5 1.300 5 3.900 0 1.200-1.100 1.900-2.500 1.900-1.200 0-2.100-.500-2.600-1.400M12 6.700v1.500M12 15.900v1.500"/>'),
    tape: line('<circle cx="7.500" cy="12" r="3.500"/><circle cx="16.500" cy="12" r="3.500"/><path d="M7.500 15.500h9"/>'),
    pin: line('<path d="M12 20.500s6-5.400 6-10a6 6 0 0 0-12 0c0 4.600 6 10 6 10z"/><circle cx="12" cy="10.500" r="2.200"/>'),
    timer: line('<circle cx="12" cy="13.500" r="6.500"/><path d="M12 10.200v3.300l2.200 1.500M9.800 4h4.400"/>'),
    trash: line('<path d="M5.500 7.500h13M9.500 7.500v-2h5v2M7.500 7.500l.800 11.500h7.400l.800-11.500"/>'),
    bolt: '<path fill="currentColor" d="M13 3L6 13.500h5L10 21l8-11h-5.500z"/>',
  };
  const TILE = {
    drafts: `<span class="tile t-drafts">${svg(G.pencil)}</span>`,
    pay: `<span class="tile t-pay">${svg(G.cash)}</span>`,
    voicemail: `<span class="tile t-voicemail">${svg(G.tape)}</span>`,
    places: `<span class="tile t-places">${svg(G.pin)}</span>`,
    photo: `<span class="tile t-photo">${svg(G.timer)}</span>`,
    messages: `<span class="tile t-messages">${svg(G.bubble)}</span>`,
    phone: `<span class="tile t-phone">${svg(G.phone)}</span>`,
    get calendar() { return `<span class="tile t-cal"><b>${CASE.cal.dow}</b><em>${CASE.cal.day}</em></span>`; },
    game: `<span class="tile t-game">${svg(G.found)}</span>`,
    clock: `<span class="tile t-clock">${svg(G.clock)}</span>`,
  };
  const SIGNAL = '<svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor" aria-hidden="true"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5.500" width="3" height="6.500" rx="1"/><rect x="10" y="3" width="3" height="9" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1" opacity="0.35"/></svg>';
  function battery(charged) {
    const w = charged ? 7 : Math.max(1.6, 1.4 + state.battery * 0.9);
    const col = charged ? "var(--ok)" : "var(--accent)";
    return `<svg width="27" height="13" viewBox="0 0 27 13" aria-hidden="true"><rect x="0.500" y="0.500" width="23" height="12" rx="3.600" fill="none" stroke="currentColor" opacity="0.45"/><rect x="25" y="4" width="1.600" height="5" rx="0.800" fill="currentColor" opacity="0.5"/><rect x="2" y="2" width="${w}" height="9" rx="2.200" fill="${col}"/></svg>`;
  }

  // Status bar parts the other two models use.
  const WEDGE = '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M13 1v12H1z" fill="currentColor" opacity="0.3"/><path d="M9.500 4.500V13H1z" fill="currentColor"/></svg>';
  const DOTS = '<svg width="34" height="6" viewBox="0 0 34 6" aria-hidden="true"><g fill="currentColor"><circle cx="3" cy="3" r="2.600"/><circle cx="10" cy="3" r="2.600"/><circle cx="17" cy="3" r="2.600"/><circle cx="24" cy="3" r="2.600"/></g><circle cx="31" cy="3" r="2.100" fill="none" stroke="currentColor" stroke-width="1"/></svg>';
  const WIFI = '<svg width="15" height="11" viewBox="0 0 15 11" fill="none" stroke="currentColor" stroke-width="1.600" stroke-linecap="round" aria-hidden="true"><path d="M1.200 3.800a9 9 0 0 1 12.600 0M3.500 6.200a5.700 5.700 0 0 1 8 0"/><circle cx="7.500" cy="9" r="1" fill="currentColor" stroke="none"/></svg>';
  function cell(charged) {
    const h = charged ? 3.6 : Math.max(1.2, 1 + state.battery * 0.5);
    const col = charged ? "var(--ok)" : "var(--accent)";
    return `<svg width="9" height="15" viewBox="0 0 9 15" aria-hidden="true"><rect x="3" y="0" width="3" height="1.600" rx="0.600" fill="currentColor" opacity="0.5"/><rect x="0.600" y="1.800" width="7.800" height="12.600" rx="1.800" fill="none" stroke="currentColor" stroke-width="1.200" opacity="0.5"/><rect x="2" y="${(13 - h).toFixed(1)}" width="5" height="${h.toFixed(1)}" rx="0.800" fill="${col}"/></svg>`;
  }

  /* ---------- Screens ---------- */
  function statusBar() {
    const charged = over() && state.revived, m = model();
    const pct = `<span class="sb-pct${charged ? " ok" : ""}">${charged ? "6%" : state.battery + "%"}</span>`;
    if (m === "punch") return `<div class="sb"><span class="sb-time">${CASE.time}</span><span class="sb-right">${WEDGE}${pct}${cell(charged)}</span></div>`;
    if (m === "button") return `<div class="sb"><span class="sb-left">${DOTS}${WIFI}</span><span class="sb-time">${CASE.time}</span><span class="sb-right">${pct}${battery(charged)}</span></div>`;
    return `<div class="sb"><span class="sb-time">${CASE.time}</span><span class="sb-right">${SIGNAL}${pct}${battery(charged)}</span></div>`;
  }

  // The one game control. Each model puts it where its own system would.
  // The way back to the floor. Only on a phone.
  const putDownBtn = () => (GROUND ? `<button type="button" class="putdown" data-act="putdown">${svg(G.down, 17)}Put it down</button>` : "");
  function actionBtn() {
    if (playing()) {
      const locked = state.opened.length === 0;
      return `<button type="button" class="pill${locked ? " is-locked" : ""}" data-act="name"${locked ? ' aria-label="Name the owner. Open at least one app first." title="Open at least one app first"' : ""}>${svg(G.person, 18)}Name the owner</button>`;
    }
    if (state.revealed) return `<button type="button" class="pill" data-act="story">Read the story</button>`;
    return "";
  }
  function bottomBar() {
    if (playing() && state.view === "lock") return "";
    if (model() === "punch" && state.view === "home") return "";
    return `<div class="bb">${putDownBtn()}${actionBtn()}</div>`;
  }

  const issuesHTML = () => CASES.map((c) => `<button type="button" class="issue" data-case="${c.id}"${c === CASE ? ' aria-current="true"' : ""}>${no(c.id)}</button>`).join("");

  function lockTime() {
    if (model() !== "punch") return `<p class="lock-time">${CASE.time}</p>`;
    const [h, m] = CASE.time.split(":");
    return `<p class="lock-time"><span class="sr-only">${CASE.time}</span><span aria-hidden="true">${h.padStart(2, "0")}</span><span aria-hidden="true">${m}</span></p>`;
  }
  function lockHint() {
    if (model() === "button") return `<button type="button" class="swipe" data-act="unlock"><span class="slide">${svg(G.fwd, 20)}slide to open</span></button>`;
    return `<button type="button" class="swipe" data-act="unlock">${svg(G.up, 22)}Swipe up to open</button>`;
  }

  function lockHTML() {
    const items = CASE.lock.map((n) => `<li class="notif">${TILE[n.tile]}<span class="n-main"><b>${esc(n.title)}</b><span>${esc(n.text)}</span></span><span class="n-when">${n.when}</span></li>`).join("");
    return `<div class="lock" id="lock">
      ${GROUND ? `<div class="lock-top">${putDownBtn()}</div>` : `<div class="issues lock-issues" role="navigation" aria-label="Phones">${issuesHTML()}</div>`}
      <p class="lock-date">${CASE.dateLine}</p>
      ${lockTime()}
      <ul class="notifs">${items}</ul>
      ${lockHint()}
    </div>`;
  }

  function appButton(id, labelled) {
    const seen = state.opened.includes(id);
    const count = CASE.badge[id];
    const badge = count && !seen ? `<span class="badge">${count}</span>` : "";
    const cost = seen || over() ? "free to open" : "costs 1 percent to open";
    return `<button type="button" class="app" data-app="${id}" aria-label="${APP_LABEL[id]}${badge ? ", " + count + " new" : ""}, ${cost}">
      <span class="ico">${TILE[id]}${badge}</span>${labelled ? `<span class="app-name">${APP_LABEL[id]}</span>` : ""}</button>`;
  }

  // The fifth app sits apart: a photo that can be looked at once.
  function photoBar() {
    const seen = state.opened.includes("photo");
    const cost = seen || over() ? "free to open" : "costs 1 percent to open";
    const label = seen && !over() && photoLeft() <= 0 ? "1 photo. It has disappeared." : "1 photo. Opens once.";
    return `<button type="button" class="gsearch" data-app="photo" aria-label="Photo, ${cost}">${svg(G.timer, 20)}<span>${label}</span></button>`;
  }
  function homeHTML() {
    const w = CASE.widget;
    return `<div class="home"><div class="widget"><div class="w-date"><span>${w.dow}</span><b>${w.day}</b></div>
        <div class="w-ev"><b>${w.title}</b><span>${w.time}</span><span>${w.where}</span><span>${w.note}</span></div></div>
      <div class="grid">${appButton("drafts", true)}${appButton("pay", true)}${appButton("voicemail", true)}${appButton("places", true)}</div>
      <div class="home-row">${photoBar()}${putDownBtn()}${actionBtn()}</div>
    </div>`;
  }

  const nav = (title, back, act) => `<div class="nav"><button type="button" class="nav-back" data-act="${act}">${svg(model() === "punch" ? G.arrow : G.back, 22)}<span>${back}</span></button><h2 id="app-title" tabindex="-1">${title}</h2></div>`;
  const bodyWrap = (inner) => `<div class="body" id="app-body">${inner}</div>`;

  // Every app screen says what this is, so a screenshot of one still carries it.
  const fine = () => `<p class="fine">Parody. Nothing on this phone is real.</p>`;
  const appbar = (key) => {
    const note = CASE.appNotes && CASE.appNotes[key];
    if (!note) return "";
    const carrier = CASE.meta && CASE.meta.carrier ? CASE.meta.carrier : "";
    return `<div class="appbar"><span>${esc(note)}</span><span>${esc(carrier)}</span></div>`;
  };

  function draftsHTML() {
    const cards = CASE.drafts.map((d, i) => {
      const when = [d.date, d.when].filter(Boolean).join(", ");
      return `<li class="draft-card">
        <div class="dc-head"><span class="avatar dc-avatar" aria-hidden="true">${esc((d.to || "?").replace(/[^A-Za-z]/g, "").slice(0, 1) || "?")}</span>
          <span class="dc-to"><b>${esc(d.to)}</b><small>${esc(d.handle || "Burner contact")}</small></span>
          <span class="dc-when">${esc(when)}</span></div>
        ${d.subject ? `<p class="dc-subject">${esc(d.subject)}</p>` : ""}
        <p class="dc-text">${esc(d.text)}${i === 0 ? '<i class="caret" aria-hidden="true"></i>' : ""}</p>
        ${d.sugg ? `<p class="kb-sugg"><span class="sr-only">The keyboard suggests: </span>${d.sugg.map((w) => `<span>${esc(w)}</span>`).join("")}</p>` : ""}
        <div class="dc-meta"><span>${svg(G.pencil, 14)}${esc(d.status || "Not sent")}</span><span>${esc(d.ref || "")}</span></div>
      </li>`;
    }).join("");
    return nav("Drafts", "Home", "home") + appbar("drafts") + bodyWrap(`<p class="label">${CASE.drafts.length} unsent</p><ul class="cards">${cards}</ul>${fine()}`);
  }

  function payHTML() {
    const rows = CASE.pay.map((x) => {
      const when = [x.method, x.date, x.time].filter(Boolean).join(" · ") || [x.kind, x.when].filter(Boolean).join(", ");
      const ref = [x.status, x.reference].filter(Boolean).join(" · ");
      return `<li class="row pay ${x.dir}"><span class="avatar" aria-hidden="true">${esc(x.initial)}</span>
        <span class="row-main"><span class="row-top"><b>${esc(x.who)}</b><span class="amt">${esc(x.amt)}</span></span>
        <span class="row-sub">${esc(x.memo)}</span><span class="pay-when">${esc(when)}</span>
        ${ref ? `<span class="pay-ref">${esc(ref)}</span>` : ""}</span></li>`;
    }).join("");
    const t = CASE.payTop;
    const acct = CASE.meta && CASE.meta.account ? `<span class="acct">${esc(CASE.meta.account)} · ${esc(CASE.meta.synced || "")}</span>` : "";
    return nav("Payments", "Home", "home") + appbar("pay") + bodyWrap(`<div class="balance"><span>${esc(t.label)}</span><b>${esc(t.amt)}</b><span>${esc(t.note)}</span>${acct}</div>
      <p class="label">Activity</p><ul class="rows">${rows}</ul>${fine()}`);
  }

  function voicemailHTML() {
    const cards = CASE.voicemails.map((v) => {
      const when = v.date ? `${v.date}, ${v.time}` : v.meta;
      const sub = [v.number, v.duration].filter(Boolean).join(" · ");
      return `<li class="vm">
        <div class="vm-head"><span class="avatar" aria-hidden="true">${esc((v.from || "?").slice(0, 1))}</span><span class="vm-who"><b>${esc(v.from)}</b><small>${esc(sub)}</small></span><span class="vm-when">${esc(when)}</span></div>
        <p>${esc(v.text)}</p>
        ${v.deleted === true ? '<span class="vm-tag">Deleted</span>' : v.deleted === false ? '<span class="vm-tag saved">Saved</span>' : ""}
      </li>`;
    }).join("");
    return nav("Voicemail", "Home", "home") + appbar("voicemail") + bodyWrap(`<p class="label trash">${svg(G.trash, 15)}<span>${esc(CASE.vmNote)}</span></p><ul class="cards vms">${cards}</ul>${fine()}`);
  }

  function placesHTML() {
    const rows = CASE.places.map((x) => {
      const when = x.date ? `${x.date} · ${x.time}` : x.when;
      const source = [x.source, x.ref].filter(Boolean).join(" · ");
      return `<li class="place"><span class="pl-dot" aria-hidden="true"></span>
        <div class="pl-main"><p class="pl-when">${esc(when)}</p><b>${esc(x.where)}</b>
        ${x.address ? `<p class="pl-addr">${esc(x.address)}</p>` : ""}
        <p class="pl-len">${esc(x.len)}</p>
        ${source ? `<p class="pl-source">${esc(source)}</p>` : ""}
        ${x.said ? `<p class="pl-said"><span>${esc(x.saidLabel || "Reason given")}:</span> ${esc(x.said)}</p>` : ""}</div></li>`;
    }).join("");
    return nav("Timeline", "Home", "home") + appbar("places") + bodyWrap(`<div class="map" aria-hidden="true"><i></i><i></i><i></i><i></i><span class="map-pin">${svg(G.pin, 28)}</span></div>
      <p class="label">${esc(CASE.placesNote)}</p><ol class="places">${rows}</ol>${fine()}`);
  }

  // A photo that can be looked at once. It shows for PHOTO_SECS from the first time it is
  // opened, then only a blur of squares is left. Once the game is over it can be seen freely.
  const PHOTO_SECS = 8;
  let photoTimer = 0, photoTick = 0;
  const photoLeft = () => (state.photoAt ? Math.max(0, PHOTO_SECS - (Date.now() - state.photoAt) / 1000) : PHOTO_SECS);
  function photoHTML() {
    const x = CASE.photo, left = photoLeft();
    const meta = [x.received ? `received ${x.received}` : "", x.expires ? `expires ${x.expires}` : "", x.bytes || ""].filter(Boolean).join(" · ");
    const head = `<div class="ph-from"><span class="avatar" aria-hidden="true">${esc((x.from || "?").slice(0, 1))}</span><span class="row-main"><b>${esc(x.from)}</b><span class="row-sub one">${esc(x.handle || x.sub)}</span></span><span class="ph-ref">${esc(x.ref || "")}</span></div>${meta ? `<p class="ph-meta">${esc(meta)}</p>` : ""}`;
    if (!over() && left <= 0) return nav("Photo", "Home", "home") + bodyWrap(`${head}
      <div class="ph-frame gone"><img src="${x.px}" width="${x.w}" height="${x.h}" alt="${esc(x.goneAlt)}"></div>
      <p class="ph-note">This photo has disappeared.</p>${fine()}`);
    const frame = `<div class="ph-frame"><img src="${x.src}" width="${x.w}" height="${x.h}" alt="${esc(x.alt)}"></div>`;
    if (over()) return nav("Photo", "Home", "home") + bodyWrap(`${head}${frame}<p class="ph-note">${esc(x.caption)}</p>${fine()}`);
    return nav("Photo", "Home", "home") + bodyWrap(`${head}
      <p class="ph-note count" id="ph-left" role="timer">Disappears in ${Math.ceil(left)} seconds</p>
      <div class="ph-bar" aria-hidden="true"><i style="animation-duration:${PHOTO_SECS}s;animation-delay:-${(PHOTO_SECS - left).toFixed(2)}s"></i></div>
      ${frame}${fine()}`);
  }
  // Counts the photo down while it is on screen, and swaps it for the blur when time is up.
  function watchPhoto() {
    clearTimeout(photoTimer); clearInterval(photoTick);
    if (state.view !== "photo" || over() || !state.photoAt) return;
    const left = photoLeft();
    if (left <= 0) return;
    photoTick = setInterval(() => { const el = $("#ph-left"); if (el) el.textContent = `Disappears in ${Math.ceil(photoLeft())} seconds`; }, 250);
    photoTimer = setTimeout(() => {
      clearInterval(photoTick);
      if (state.view !== "photo") return;
      render();
      announce("The photo has disappeared.");
    }, left * 1000 + 40);
  }

  const VIEWS = { lock: lockHTML, home: homeHTML, drafts: draftsHTML, pay: payHTML, voicemail: voicemailHTML, places: placesHTML, photo: photoHTML };

  function renderOS() {
    const os = $("#os");
    if (state.status === "dead" && !state.revived) {
      os.className = "os dead";
      os.dataset.view = "dead";
      os.innerHTML = `<div class="shut${flags.died ? " just" : ""}"><span class="spinner" aria-hidden="true"></span>
        <div class="shut-after"><svg width="58" height="30" viewBox="0 0 58 30" fill="none" aria-hidden="true"><rect x="1.500" y="1.500" width="49" height="27" rx="7" stroke="currentColor" stroke-width="2.500"/><rect x="53.500" y="10" width="3.500" height="10" rx="1.750" fill="currentColor"/><rect x="6" y="6" width="4" height="18" rx="2" fill="#ff453a"/></svg>
        <p>No battery</p><button type="button" class="charge" data-act="charge">Charge it</button>${putDownBtn()}</div></div>`;
      lastKey = "dead";
      return;
    }
    const key = state.view + ":" + state.sub;
    const keep = key === lastKey && $("#app-body") ? $("#app-body").scrollTop : 0;
    const light = state.view !== "lock" && state.view !== "home";
    const dim = playing() && state.battery === 0;
    const banner = flags.banner ? `<div class="banner" role="status">${TILE.game}<span class="n-main"><b>That’s right.</b><span>This is ${esc(CASE.owner)}’s burner.</span></span></div>` : "";
    os.dataset.view = state.view;
    os.className = "os" + (light ? " light" : "") + (dim ? " dim" : "") + (flags.wake ? " wake" : "");
    os.innerHTML = statusBar() + `<div class="view${flags.enter ? " enter" : ""}">${VIEWS[state.view]()}</div>` + bottomBar() + banner;
    if (keep && $("#app-body")) $("#app-body").scrollTop = keep;
    lastKey = key;
    if (flags.banner) setTimeout(() => { const b = document.querySelector(".banner"); if (b) b.remove(); }, 3500);
  }

  /* ---------- The reveal ---------- */
  // What the owner texts back when you return the phone. It depends on how the game went:
  // battery left, any wrong names, and which apps were opened.
  function ownerReply() {
    const r = CASE.reply, b = state.battery;
    if (!r) return null;
    if (state.status !== "won") return { dead: true, lines: [], quote: "Not delivered." };
    const lines = [r.open[b] || r.open[3]];
    const wrong = state.names.find((n) => r.guessed && r.guessed[n]);
    const special = wrong ? r.guessed[wrong] : state.names.length ? r.misses[Math.min(state.names.length, 3)] : null;
    if (special) lines.push(special);
    const apps = state.opened;
    const saw = apps.length ? r.saw[apps[apps.length - 1]] : null;
    if (saw) lines.push(saw);
    if (apps.length >= 3 && lines.length < 3) lines.push(r.saw[apps[0]]);
    lines.push(r.close[(b + state.names.length * 2 + apps.length) % r.close.length]);
    return { dead: false, lines, quote: special || saw || lines[0] };
  }

  function replyHTML() {
    const rep = ownerReply();
    if (!rep) return "";
    const who = (CASE.reply && CASE.reply.name) || CASE.owner;
    const first = who.split(" ")[0];
    const head = `<div class="reply-head"><span class="avatar" aria-hidden="true">${esc(who[0])}</span><b>${esc(who)}</b></div>`;
    const you = `<p class="bub you"><span class="sr-only">You: </span>${esc(CASE.reply.you)}</p>`;
    const cls = "reply" + (flags.fresh ? " fresh" : "");
    if (rep.dead) return `<div class="${cls}">${head}${you}<p class="undelivered">Not Delivered</p><p class="reply-note">The phone died before it could ring.</p></div>`;
    return `<div class="${cls}">${head}${you}<p class="receipt">Delivered</p>${rep.lines.map((t) => `<p class="bub them"><span class="sr-only">${esc(first)}: </span>${esc(t)}</p>`).join("")}</div>`;
  }

  function shareText() {
    const b = state.battery;
    const bar = "■".repeat(b) + "□".repeat(MAX - b);
    const apps = state.log.filter((e) => e.k === "app").length;
    const miss = state.log.filter((e) => e.k === "miss").length;
    const spent = `${apps} app${apps === 1 ? "" : "s"} opened, ${miss} wrong name${miss === 1 ? "" : "s"}`;
    const head = `Burner Phone ${no(CASE.id)}`;
    const rep = ownerReply();
    const quote = rep ? (rep.dead ? "Not delivered." : `${(CASE.reply && CASE.reply.name) || "They"}: “${rep.quote}”`) : null;
    const score = state.status === "won" ? `${bar} ${b}% left` : `${bar} the phone died`;
    return [head, score, spent, quote, SITE].filter(Boolean).join("\n");
  }

  function renderStory() {
    const el = $("#story");
    el.hidden = !state.revealed;
    if (!state.revealed) { el.innerHTML = ""; el.dataset.k = ""; return; }
    // Leave the page alone unless the result changed, so the reply does not replay.
    const k = [CASE.id, state.status, state.battery, state.names.length, state.opened.length].join(":");
    if (el.dataset.k === k) return;
    el.dataset.k = k;
    const s = CASE.story, b = state.battery;
    const result = state.status === "won" ? (b > 0 ? `You named the owner with ${b}% battery left.` : "You named the owner at 0%, just before it died.") : "The phone died before you named the owner.";
    const others = CASES.filter((c) => c !== CASE).map((c) => `<button type="button" class="sbtn ghost" data-case="${c.id}">Play ${no(c.id)}</button>`).join("");
    const fig = (f, cls) => `<figure${cls ? ` class="${cls}"` : ""}><img src="${f.src}" width="${f.w}" height="${f.h}" alt="${esc(f.alt)}"><figcaption>${esc(f.cap)}</figcaption></figure>`;
    const credits = s.credits ? `<p class="credits">Photographs: ${s.credits.map((c) => `<a href="${esc(c.url)}" rel="noopener">${esc(c.what)}</a> by ${esc(c.by)} (${esc(c.lic)})`).join("; ")}. ${esc(s.creditNote || "")}</p>` : "";
    const receipts = s.sources ? `<div class="receipts"><h2>What is real</h2><ul>${s.sources.map((x) => `<li>${esc(x.what)} <a href="${esc(x.url)}" rel="noopener">${esc(x.where)}</a></li>`).join("")}</ul></div>` : "";
    el.innerHTML = `<p class="kicker">Burner Phone ${no(CASE.id)}</p>
      <p class="result">${result}</p>
      ${replyHTML()}
      ${s.parody ? `<p class="parody">${esc(s.parody)}</p>` : ""}
      <h1>${esc(s.headline)}</h1>
      <p class="dateline">${esc(s.dateline)}</p>
      ${fig(s.lead)}
      <div class="prose"><p>${esc(s.paras[0])}</p><p>${esc(s.paras[1])}</p>${fig(s.side, s.side.wide ? "" : "fig-side")}${s.paras.slice(2).map((p) => `<p>${esc(p)}</p>`).join("")}</div>
      <p class="invented">${esc(s.invented)}</p>
      ${receipts}
      ${credits}
      <pre class="share" id="share-text">${esc(shareText())}</pre>
      <div class="story-btns"><button type="button" class="sbtn" id="copy">Copy result</button><button type="button" class="sbtn ghost to-phone" id="to-phone">Back to the phone</button><button type="button" class="sbtn ghost" id="again">Start over</button>${others}<span class="copied" id="copied" aria-live="polite"></span></div>
      <p class="story-credit">A game from <a href="https://ndmlabs.net/">NDMLABS</a>. The first one: <a href="../ifoundyourphone/">I Found Your Phone</a></p>`;
  }

  function render() {
    $("#device").dataset.model = model();
    renderOS();
    renderStory();
    $("#issues").innerHTML = issuesHTML();
    const st = $("#stage");
    st.classList.toggle("revealed", state.revealed);
    st.classList.toggle("reading", state.revealed && state.reading);
    const down = grounded();
    st.classList.toggle("grounded", down);
    $("#device").inert = down;
    $("#ground").inert = !down;
    if (GROUND) { renderGround(); placeOnFloor(); }
    flags = { enter: false, banner: false, died: false, wake: false, fresh: false };
    watchPhoto();
    save();
  }

  /* ---------- Playing ---------- */
  function announce(text) { $("#announce").textContent = text; }
  function focusTitle() { const t = $("#app-title"); if (t) t.focus({ preventScroll: true }); }
  function toast(text) {
    const t = $("#toast");
    t.textContent = text;
    t.classList.remove("show");
    void t.offsetWidth;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 1900);
  }
  function showAlert(title, text) {
    if (!playing() || !$("#sheet").hidden || !$("#call").hidden) return;
    alertReturn = document.activeElement;
    $("#alert-t").textContent = title;
    $("#alert-d").textContent = text;
    $("#alert").hidden = false;
    $("#os").inert = true;
    syncChrome();
    $("#alert-name").focus({ preventScroll: true });
  }
  function hideAlert() {
    if ($("#alert").hidden) return;
    const back = alertReturn;
    $("#alert").hidden = true;
    $("#os").inert = !$("#sheet").hidden;
    syncChrome();
    const target = back && back.isConnected && back !== document.body && back.offsetParent !== null
      ? back
      : (document.querySelector("#app-title") || document.querySelector('[data-act="name"]'));
    if (target) target.focus({ preventScroll: true });
    alertReturn = null;
  }

  function go(view, sub) {
    state.view = view;
    state.sub = sub == null ? null : sub;
    flags.enter = true;
    render();
    focusTitle();
  }

  function openApp(id) {
    const free = over() || state.opened.includes(id);
    if (!free) {
      if (state.battery <= 0) { showAlert("No battery left", "There isn’t enough charge to open another app. You have one guess."); return; }
      state.battery--;
      state.opened.push(id);
      state.log.push({ k: "app", id });
      if (state.opened.length === 1) track("burner-started", { phone: CASE.id });
      toast(`Battery ${state.battery}%`);
      announce(`Opened ${APP_LABEL[id]}. Battery ${state.battery} percent.`);
      if (state.battery === 0) {
        clearTimeout(alertTimer);
        alertTimer = setTimeout(() => showAlert("Battery at 0%", "This phone is about to shut down. You have one guess."), id === "photo" ? PHOTO_SECS * 1000 + 900 : 1100);
      }
    }
    if (id === "photo" && !state.photoAt && !over()) state.photoAt = Date.now();
    go(id);
    if (!free) queueLive();
  }

  /* ---------- The phone keeps getting messages ---------- */
  // A phone may list `live` events: { at: apps opened so far, kind: "text" | "call", from, text }.
  // Each fires once, a few seconds after that many apps have been opened.
  const busy = () => !$("#sheet").hidden || !$("#alert").hidden || !$("#call").hidden || state.view === "lock" || grounded();
  function hideLive() {
    clearTimeout(liveTimer); clearTimeout(buzzTimer); clearTimeout(callTimer);
    $("#buzz").hidden = true;
    if (!$("#call").hidden) { $("#call").hidden = true; $("#os").inert = !$("#sheet").hidden || !$("#alert").hidden; syncChrome(); callReturn = null; }
  }
  function queueLive() {
    clearTimeout(liveTimer);
    if (!playing() || !CASE.live) return;
    const i = CASE.live.findIndex((e, k) => e.at <= state.opened.length && !state.fired.includes(k));
    if (i < 0) return;
    liveTimer = setTimeout(() => {
      if (!playing()) return;
      if (busy()) { queueLive(); return; }
      const e = CASE.live[i];
      state.fired.push(i);
      save();
      if (e.kind === "call") showCall(e); else showBuzz(e);
    }, 2600);
  }
  function showBuzz(e) {
    const el = $("#buzz");
    el.innerHTML = `${TILE.messages}<span class="n-main"><b>${esc(e.from)}</b><span>${esc(e.text)}</span></span><span class="n-when">now</span>`;
    el.hidden = false;
    announce(`New message from ${e.from}: ${e.text}`);
    clearTimeout(buzzTimer);
    buzzTimer = setTimeout(() => { el.hidden = true; queueLive(); }, 5200);
  }
  function showCall(e) {
    if (!$("#sheet").hidden || !$("#alert").hidden) return;
    callReturn = document.activeElement;
    $("#call-name").textContent = e.from;
    $("#call-sub").textContent = e.sub || "mobile";
    $("#call").hidden = false;
    $("#os").inert = true;
    syncChrome();
    $("#call").querySelector("button").focus({ preventScroll: true });
    clearTimeout(callTimer);
    callTimer = setTimeout(endCall, 14000);
  }
  function endCall() {
    clearTimeout(callTimer);
    if ($("#call").hidden) return;
    const back = callReturn;
    $("#call").hidden = true;
    $("#os").inert = !$("#sheet").hidden || !$("#alert").hidden;
    syncChrome();
    toast("Call declined");
    const target = back && back.isConnected && back !== document.body && back.offsetParent !== null
      ? back
      : (document.querySelector("#app-title") || document.querySelector('[data-act="name"]'));
    if (target) target.focus({ preventScroll: true });
    callReturn = null;
    queueLive();
  }

  function reveal(ms) {
    hideLive();
    clearTimeout(revealTimer);
    revealTimer = setTimeout(() => {
      state.revealed = true;
      state.reading = true;
      flags.fresh = true;
      render();
      const story = $("#story");
      if (narrow()) window.scrollTo(0, 0);
      story.focus({ preventScroll: true });
    }, ms);
  }

  function accuse(name) {
    if (!playing()) return;
    if (state.names.includes(name)) { $("#sheet-fb").textContent = `You already ruled out ${name}.`; return; }
    if (name === CASE.owner) {
      closeSheet();
      state.status = "won";
      track("burner-solved", { phone: CASE.id, battery: state.battery });
      flags.banner = true;
      render();
      announce(`Correct. This is ${CASE.owner}'s phone.`);
      reveal(2000);
      return;
    }
    state.names.push(name);
    state.log.push({ k: "miss" });
    const why = CASE.rebut[name] || "Nothing on this phone points to them.";
    if (state.battery <= 0) {
      closeSheet();
      state.status = "dead";
      track("burner-died", { phone: CASE.id });
      flags.died = true;
      render();
      announce(`Not ${name}. The phone has died. It was ${CASE.owner}'s.`);
      reveal(2400);
      return;
    }
    state.battery--;
    chosen = null;
    $("#guess").value = "";
    $("#sheet-fb").textContent = `Not ${name}. ${why}`;
    renderSheet();
    render();
    $("#guess").focus({ preventScroll: true });
  }

  /* ---------- The name sheet ---------- */
  let active = -1, shown = [];
  function matches(q) {
    const hit = SUSPECTS.filter((s) => {
      const hay = norm(s[0] + " " + (s[2] || []).join(" "));
      return hay.startsWith(q) || hay.split(" ").some((w) => w.startsWith(q));
    });
    hit.sort((a, b) => (norm(a[0]).startsWith(q) ? 0 : 1) - (norm(b[0]).startsWith(q) ? 0 : 1));
    return hit.slice(0, 6);
  }
  function exact(text) {
    const n = norm(text);
    return n ? SUSPECTS.find((s) => norm(s[0]) === n || (s[2] || []).some((a) => norm(a) === n)) || null : null;
  }
  function renderSheet() {
    const q = norm($("#guess").value);
    const box = $("#sugg"), btn = $("#commit");
    shown = chosen || !q ? [] : matches(q);
    if (active >= shown.length) active = -1;
    if (chosen) box.innerHTML = "";
    else if (!q) box.innerHTML = "<p>Start typing. It could be anyone, living or dead.</p>";
    else if (!shown.length) box.innerHTML = "<p>No one by that name on the list.</p>";
    else box.innerHTML = shown.map(([n, what], k) => `<button type="button" role="option" id="opt-${k}" aria-selected="${k === active}" data-pick="${esc(n)}">${esc(n)}<span>${esc(what)}</span></button>`).join("");
    $("#guess").setAttribute("aria-expanded", String(shown.length > 0));
    btn.disabled = !chosen;
    btn.textContent = chosen ? `Name ${chosen[0]}` : "Choose a name";
    $("#sheet-note").textContent = state.battery > 0 ? `A wrong name costs 1%. Battery ${state.battery}%.` : "No battery left. This is your last guess.";
  }
  function openSheet() {
    if (!playing()) return;
    if (!state.opened.length) {
      toast("Open at least one app first.");
      announce("Open at least one app first.");
      return;
    }
    clearTimeout(alertTimer);
    hideAlert();
    sheetReturn = document.activeElement;
    chosen = null; active = -1;
    $("#guess").value = "";
    $("#sheet-fb").textContent = "";
    renderSheet();
    $("#sheet").hidden = false;
    $("#os").inert = true;
    syncChrome();
    setTimeout(() => $("#guess").focus({ preventScroll: true }), 60);
  }
  function closeSheet() {
    const back = sheetReturn;
    $("#sheet").hidden = true;
    $("#os").inert = !$("#alert").hidden;
    syncChrome();
    const pill = document.querySelector('[data-act="name"]');
    const target = back && back.isConnected && back.offsetParent !== null ? back : pill;
    if (target) target.focus({ preventScroll: true });
    sheetReturn = null;
  }

  /* ---------- Events ---------- */
  const screen = $("#screen");

  function anyDialogOpen() {
    return !$("#sheet").hidden || !$("#alert").hidden || !$("#call").hidden;
  }
  function syncChrome() {
    const inert = anyDialogOpen();
    for (const sel of [".mast", ".caption", ".chin"]) {
      const el = document.querySelector(sel);
      if (el) el.inert = inert;
    }
  }
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Tab") return;
    const dialog = !$("#call").hidden ? $("#call") : !$("#alert").hidden ? $("#alert") : !$("#sheet").hidden ? $("#sheet") : null;
    if (!dialog) return;
    const items = [...dialog.querySelectorAll('button, input, a[href], [tabindex]:not([tabindex="-1"])')]
      .filter((el) => !el.disabled && el.offsetParent !== null);
    if (!items.length) return;
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) {
      e.preventDefault();
      first.focus();
    }
  });

  screen.addEventListener("click", (e) => {
    const other = e.target.closest("[data-case]");
    if (other) { switchCase(+other.dataset.case); return; }
    const app = e.target.closest("[data-app]");
    if (app) { openApp(app.dataset.app); return; }
    const sub = e.target.closest("[data-sub]");
    if (sub) { go(state.view, +sub.dataset.sub); return; }
    const act = e.target.closest("[data-act]");
    if (!act) return;
    const a = act.dataset.act;
    if (a === "putdown") { putDown(); return; }
    if (a === "unlock" || a === "home") go("home");
    else if (a === "up") go(state.view);
    else if (a === "name") openSheet();
    else if (a === "story") {
      state.reading = true; render();
      if (narrow()) window.scrollTo(0, 0);
      $("#story").focus({ preventScroll: narrow() });
    }
    else if (a === "charge") { state.revived = true; state.view = "home"; state.sub = null; flags.wake = true; render(); }
  });

  // A real swipe up on the lock screen opens it too.
  let swipeY = null, swipeX = 0;
  screen.addEventListener("pointerdown", (e) => { swipeY = e.target.closest("#lock") ? e.clientY : null; swipeX = e.clientX; });
  screen.addEventListener("pointerup", (e) => {
    const up = swipeY != null && swipeY - e.clientY > 40;
    const across = swipeY != null && model() === "button" && e.clientX - swipeX > 40;
    if ((up || across) && state.view === "lock") go("home");
    swipeY = null;
  });

  // The old model has a real home button under the screen.
  $("#home-btn").addEventListener("click", () => {
    if (!$("#call").hidden) { endCall(); return; }
    if (!$("#alert").hidden) { hideAlert(); return; }
    if (!$("#sheet").hidden) { closeSheet(); return; }
    if (state.status === "dead" && !state.revived) return;
    if (state.view !== "home") go("home");
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (!$("#call").hidden) { endCall(); return; }
    if (!$("#alert").hidden) { hideAlert(); return; }
    if (!$("#sheet").hidden) { closeSheet(); return; }
    if (state.sub != null) go(state.view);
    else if (state.view !== "lock" && state.view !== "home") go("home");
  });

  $("#sheet-x").addEventListener("click", closeSheet);
  $("#call").addEventListener("click", (e) => { if (e.target.closest("[data-act=decline]")) endCall(); });
  $("#buzz").addEventListener("click", () => { $("#buzz").hidden = true; });
  $("#alert-keep").addEventListener("click", hideAlert);
  $("#alert-name").addEventListener("click", openSheet);

  const form = $("#guess-form");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!chosen) {
      const only = exact($("#guess").value) || (shown.length === 1 ? shown[0] : null) || (active >= 0 ? shown[active] : null);
      if (!only) { $("#sheet-fb").textContent = "Pick a name from the list."; return; }
      chosen = only; $("#guess").value = only[0]; $("#sheet-fb").textContent = ""; renderSheet();
      return;
    }
    accuse(chosen[0]);
  });
  form.addEventListener("input", () => {
    active = -1;
    chosen = exact($("#guess").value);
    $("#sheet-fb").textContent = "";
    renderSheet();
  });
  form.addEventListener("click", (e) => {
    const s = e.target.closest("[data-pick]");
    if (!s) return;
    chosen = SUSPECTS.find((x) => x[0] === s.dataset.pick);
    $("#guess").value = chosen[0];
    $("#sheet-fb").textContent = "";
    renderSheet();
    $("#commit").focus({ preventScroll: true });
  });
  form.addEventListener("keydown", (e) => {
    if (e.target.id !== "guess" || !shown.length) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      active = e.key === "ArrowDown" ? Math.min(shown.length - 1, active + 1) : Math.max(0, active - 1);
      [...$("#sugg").querySelectorAll("[role=option]")].forEach((b, i) => b.setAttribute("aria-selected", String(i === active)));
      $("#guess").setAttribute("aria-activedescendant", "opt-" + active);
    }
  });

  /* ---------- On the floor ---------- */
  // Lying on the floor the phone has a real phone's proportions, not the shape of the
  // browser's page area. This works out its height, size and position from the room
  // between the top row and the panel; its bottom corner just tucks under the panel.
  function placeOnFloor() {
    if (!GROUND || !narrow()) return;
    const dev = $("#device"), W = document.body.clientWidth, H = document.body.clientHeight;
    const tall = W * (model() === "button" ? 2.02 : 2.164);
    const card = $(".ground-card").offsetHeight || 250;
    const top = 58, room = Math.max(160, H - card - 14 - top);
    const s = Math.min(0.6, (room * 0.965) / tall);
    dev.style.setProperty("--g-h", tall.toFixed(1) + "px");
    dev.style.setProperty("--g-s", s.toFixed(4));
    dev.style.setProperty("--g-ty", (top + room * 0.52 - tall / 2).toFixed(1) + "px");
  }
  function renderGround() {
    $("#floor").dataset.floor = CASE.ground || "boards";
    $("#ground-issues").innerHTML = issuesHTML();
    const where = (CASE.lock.find((n) => n.tile === "game") || {}).title || "";
    let title = "Whose burner is this?", sub = where;
    if (state.status === "won") { title = `${CASE.owner}’s burner.`; sub = "You named the owner. It’s back where you found it."; }
    else if (state.status === "dead") sub = "The battery died before you named the owner.";
    $("#ground-title").textContent = title;
    $("#ground-sub").textContent = sub;
  }
  // Plays the lift or the drop once. The stage keeps the class until the phone lands.
  function animateStage(cls) {
    const st = $("#stage"), dev = $("#device");
    st.classList.remove("lifting", "dropping");
    void dev.offsetWidth;
    st.classList.add(cls);
    const done = (e) => {
      if (e.target !== dev) return;
      st.classList.remove(cls);
      dev.removeEventListener("animationend", done);
    };
    dev.addEventListener("animationend", done);
  }
  // Lifting and setting down. Where the browser can, the move is a view transition: it takes
  // a picture of the phone before and after and glides one into the other, so the phone's own
  // page does no work while it moves. Elsewhere the phone itself is animated (animateStage).
  // ?glide=0 in the address forces that older move, to compare the two on one phone.
  let moving = false;
  const noGlide = new URLSearchParams(location.search).get("glide") === "0";
  const glides = () => !noGlide && typeof document.startViewTransition === "function" && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function move(dir, change) {
    if (!glides()) { animateStage(dir === "up" ? "lifting" : "dropping"); change(); return; }
    const page = document.documentElement;
    const end = () => { moving = false; delete page.dataset.vt; };
    moving = true;
    page.dataset.vt = dir;
    try { document.startViewTransition(change).finished.then(end, end); }
    catch (_) { end(); change(); }
  }
  function pickUp() {
    if (held || moving || !grounded()) return;
    move("up", () => { held = true; render(); });
    announce("You picked up the phone.");
    queueLive();
    setTimeout(() => { const t = $("#os [data-act=unlock]") || $("#app-title") || $("#os button"); if (t) t.focus({ preventScroll: true }); }, 850);
  }
  function putDown() {
    if (!held || moving) return;
    move("down", () => { held = false; render(); });
    announce("You put the phone down.");
    setTimeout(() => $("#pickup").focus({ preventScroll: true }), 750);
  }

  function reset() {
    clearTimeout(revealTimer); clearTimeout(alertTimer);
    hideLive();
    state = fresh();
    held = false;
    flags.wake = true;
    lastKey = "";
    $("#sheet").hidden = true; $("#alert").hidden = true; $("#os").inert = false;
    sheetReturn = alertReturn = callReturn = null;
    syncChrome();
    render();
    window.scrollTo(0, 0);
  }
  // Each phone keeps its own saved game, so switching never loses progress on the other.
  function switchCase(id) {
    const next = byId(id);
    if (!next || next === CASE) return;
    clearTimeout(revealTimer); clearTimeout(alertTimer); clearTimeout(toastTimer);
    hideLive();
    CASE = next;
    state = load();
    held = false;
    flags.wake = true;
    lastKey = "";
    chosen = null;
    $("#toast").classList.remove("show");
    $("#sheet").hidden = true; $("#alert").hidden = true; $("#os").inert = false;
    sheetReturn = alertReturn = callReturn = null;
    syncChrome();
    render();
    window.scrollTo(0, 0);
    try { if (location.hash !== "#phone-" + CASE.id) location.hash = "phone-" + CASE.id; } catch (_) {}
  }
  window.addEventListener("hashchange", () => { const c = fromHash(); if (c) switchCase(c.id); });
  $("#issues").addEventListener("click", (e) => { const b = e.target.closest("[data-case]"); if (b) switchCase(+b.dataset.case); });

  $("#reset").addEventListener("click", reset);
  $("#story").addEventListener("click", async (e) => {
    if (e.target.closest("#again")) { reset(); return; }
    const other = e.target.closest("[data-case]");
    if (other) { switchCase(+other.dataset.case); return; }
    if (e.target.closest("#to-phone")) { state.reading = false; held = true; render(); window.scrollTo(0, 0); return; }
    if (!e.target.closest("#copy")) return;
    const text = shareText();
    track("burner-share", { phone: CASE.id });
    try { await navigator.clipboard.writeText(text); $("#copied").textContent = "Copied."; }
    catch (_) {
      const r = document.createRange(); r.selectNodeContents($("#share-text"));
      const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r);
      $("#copied").textContent = "Selected. Copy it with your device’s copy command.";
    }
  });

  document.documentElement.classList.toggle("ground-on", GROUND);
  $("#floor").hidden = !GROUND;
  $("#ground").hidden = !GROUND;
  $("#pickup").addEventListener("click", pickUp);
  $("#ground-reset").addEventListener("click", reset);
  $("#floor").addEventListener("click", pickUp);
  $("#ground-issues").addEventListener("click", (e) => { const b = e.target.closest("[data-case]"); if (b) switchCase(+b.dataset.case); });
  window.matchMedia("(max-width: 640px)").addEventListener("change", () => render());
  window.addEventListener("resize", placeOnFloor);

  const rotateMQ = window.matchMedia("(orientation: landscape) and (max-height: 620px) and (max-width: 1024px)");
  function syncRotate() {
    const r = $("#rotate");
    if (!r) return;
    r.hidden = !rotateMQ.matches;
    if (rotateMQ.matches) {
      const t = $("#rotate-title");
      if (t) t.focus({ preventScroll: true });
    }
  }
  if (rotateMQ.addEventListener) rotateMQ.addEventListener("change", syncRotate);
  else if (rotateMQ.addListener) rotateMQ.addListener(syncRotate);
  syncRotate();

  render();
  queueLive();
})();
