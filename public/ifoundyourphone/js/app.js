// I Found Your Phone: the game. The phones themselves are in phones.js.
(function () {
  "use strict";
  const { CASES, SUSPECTS } = window.IFYP;

  const APP_LABEL = { messages: "Messages", notes: "Notes", phone: "Phone", search: "Search", photos: "Photos" };
  const MAX = 5;
  const PREFIX = "ifoundyourphone:v1:";
  // Shown under a copied result. Change it when the game moves to its own domain.
  const SITE = "ndmlabs.net/ifoundyourphone";
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

  /* ---------- State ---------- */
  // log: what each 1% went on, in order ({k:"app",id} or {k:"miss"}).
  const fresh = () => ({ v: 1, view: "lock", sub: null, battery: MAX, opened: [], names: [], log: [], status: "playing", revived: false, revealed: false, reading: false });
  let state = load();
  let flags = { enter: false, banner: false, died: false, wake: true };
  let lastKey = "";
  let chosen = null;
  let revealTimer = 0, alertTimer = 0, toastTimer = 0;

  function load() {
    let s = null;
    try { const j = JSON.parse(localStorage.getItem(key())); if (j && j.v === 1) s = j; } catch (_) {}
    if (!s) return fresh();
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
    back: '<g fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 5.500L8 12l6.500 6.500"/></g>',
    up: line('<path d="M6 14.500l6-6 6 6"/>'),
    person: line('<circle cx="12" cy="8.800" r="3.300"/><path d="M5.500 19c.900-3.300 3.400-5 6.500-5s5.600 1.700 6.500 5"/>'),
    clock: line('<circle cx="12" cy="12" r="7.500"/><path d="M12 8v4.300l2.700 1.700"/>'),
    missed: line('<path d="M17 7L8 16M8 9.500V16h6.500"/>'),
    out: line('<path d="M7 17l9-9M16 14.500V8H9.500"/>'),
    declined: line('<circle cx="12" cy="12" r="7"/><path d="M7.200 7.200l9.600 9.600"/>'),
    bolt: '<path fill="currentColor" d="M13 3L6 13.500h5L10 21l8-11h-5.500z"/>',
  };
  const TILE = {
    phone: `<span class="tile t-phone">${svg(G.phone)}</span>`,
    messages: `<span class="tile t-messages">${svg(G.bubble)}</span>`,
    search: `<span class="tile t-search">${svg(G.search)}</span>`,
    notes: `<span class="tile t-notes"></span>`,
    photos: `<span class="tile t-photos">${svg(G.photo)}</span>`,
    get calendar() { return `<span class="tile t-cal"><b>${CASE.cal.dow}</b><em>${CASE.cal.day}</em></span>`; },
    game: `<span class="tile t-game">${svg(G.found)}</span>`,
  };
  const SIGNAL = '<svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor" aria-hidden="true"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5.500" width="3" height="6.500" rx="1"/><rect x="10" y="3" width="3" height="9" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1" opacity="0.35"/></svg>';
  function battery(done) {
    const w = done ? 7 : Math.max(1.6, 1.4 + state.battery * 0.9);
    const col = done ? "var(--ok)" : "var(--accent)";
    return `<svg width="27" height="13" viewBox="0 0 27 13" aria-hidden="true"><rect x="0.500" y="0.500" width="23" height="12" rx="3.600" fill="none" stroke="currentColor" opacity="0.45"/><rect x="25" y="4" width="1.600" height="5" rx="0.800" fill="currentColor" opacity="0.5"/><rect x="2" y="2" width="${w}" height="9" rx="2.200" fill="${col}"/></svg>`;
  }

  /* ---------- Screens ---------- */
  function statusBar() {
    const done = over();
    return `<div class="sb"><span>${CASE.time}</span><span class="sb-right">${SIGNAL}
      <span class="sb-pct${done ? " ok" : ""}">${done ? "6%" : state.battery + "%"}</span>${battery(done)}</span></div>`;
  }

  function bottomBar() {
    if (playing() && state.view === "lock") return "";
    if (playing()) return `<div class="bb"><button type="button" class="pill" data-act="name">${svg(G.person, 18)}Name the owner</button></div>`;
    if (state.revealed) return `<div class="bb"><button type="button" class="pill" data-act="story">Read the story</button></div>`;
    return `<div class="bb"></div>`;
  }

  const issuesHTML = () => CASES.map((c) => `<button type="button" class="issue" data-case="${c.id}"${c === CASE ? ' aria-current="true"' : ""}>${no(c.id)}</button>`).join("");

  function lockHTML() {
    const items = CASE.lock.map((n) => `<li class="notif">${TILE[n.tile]}<span class="n-main"><b>${esc(n.title)}</b><span>${esc(n.text)}</span></span><span class="n-when">${n.when}</span></li>`).join("");
    return `<div class="lock" id="lock">
      <div class="issues lock-issues" role="navigation" aria-label="Phones">${issuesHTML()}</div>
      <p class="lock-date">${CASE.dateLine}</p>
      <p class="lock-time">${CASE.time}</p>
      <ul class="notifs">${items}</ul>
      <button type="button" class="swipe" data-act="unlock">${svg(G.up, 22)}Swipe up to open</button>
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

  function homeHTML() {
    const w = CASE.widget;
    return `<div class="home">
      <div class="widget"><div class="w-date"><span>${w.dow}</span><b>${w.day}</b></div>
        <div class="w-ev"><b>${w.title}</b><span>${w.time}</span><span>${w.where}</span><span>${w.note}</span></div></div>
      <div class="grid">${appButton("notes", true)}${appButton("photos", true)}</div>
      <div class="dock">${appButton("phone")}${appButton("messages")}${appButton("search")}</div>
    </div>`;
  }

  const nav = (title, back, act) => `<div class="nav"><button type="button" class="nav-back" data-act="${act}">${svg(G.back, 22)}<span>${back}</span></button><h2 id="app-title" tabindex="-1">${title}</h2></div>`;
  const bodyWrap = (inner) => `<div class="body" id="app-body">${inner}</div>`;

  function messagesHTML() {
    if (state.sub != null) {
      const t = CASE.threads[state.sub];
      const body = (t.sysnote ? `<p class="sysnote">${esc(t.sysnote)}</p>` : "") +
        t.msgs.map((m) => m.stamp ? `<p class="stamp">${esc(m.stamp)}</p>` : `<p class="bub ${m.me ? "me" : "them"}"><span class="sr-only">${m.me ? "Owner: " : esc(t.name) + ": "}</span>${esc(m.t)}</p>`).join("") +
        (t.receipt ? `<p class="receipt">${esc(t.receipt)}</p>` : "");
      return nav(esc(t.name), "Back", "up") + bodyWrap(`<div class="thread">${body}</div>`);
    }
    const rows = CASE.threads.map((t, i) => {
      const last = t.msgs[t.msgs.length - 1];
      return `<li><button type="button" class="row" data-sub="${i}">
        <span class="unread${t.unread ? "" : " none"}"${t.unread ? ' aria-label="Unread"' : ' aria-hidden="true"'}></span>
        <span class="avatar" aria-hidden="true">${t.initial}</span>
        <span class="row-main"><span class="row-top"><b>${esc(t.name)}</b><span class="row-when">${t.when}</span></span><span class="row-sub">${esc(last.t)}</span></span></button></li>`;
    }).join("");
    return nav("Messages", "Home", "home") + bodyWrap(`<ul class="rows">${rows}</ul>`);
  }

  function notesHTML() {
    if (state.sub != null) {
      const n = CASE.notes[state.sub];
      return nav("", "Notes", "up") + bodyWrap(`<p class="note-date">${esc(n.date)}</p><article class="note"><h3>${esc(n.title)}</h3>${n.body.map((p) => `<p>${esc(p)}</p>`).join("")}</article>`);
    }
    const rows = CASE.notes.map((n, i) => `<li><button type="button" class="row" data-sub="${i}">
      <span class="row-main"><span class="row-top"><b>${esc(n.title)}</b></span><span class="row-sub one">${esc(n.when)}  ${esc(n.body[0])}</span></span></button></li>`).join("");
    return nav("Notes", "Home", "home") + bodyWrap(`<ul class="rows">${rows}</ul>`);
  }

  function phoneHTML() {
    const rows = CASE.calls.map((c) => `<li class="row${c.kind === "missed" ? " missed" : ""}">
      <span class="call-ico">${svg(G[c.kind], 18)}</span>
      <span class="row-main"><span class="row-top"><b>${esc(c.name)}</b><span class="row-when">${c.when}</span></span><span class="row-sub one">${esc(c.sub)}</span></span></li>`).join("");
    const v = CASE.voicemail;
    return nav("Recents", "Home", "home") + bodyWrap(`<ul class="rows">${rows}</ul>
      <p class="label">Voicemail</p><div class="vm"><b>${esc(v.from)}</b><span>${esc(v.meta)}</span><p>${esc(v.text)}</p></div>`);
  }

  function searchHTML() {
    const rows = CASE.searches.map((s) => `<li class="row"><span class="call-ico">${svg(G.clock, 18)}</span><span class="query">${esc(s.q)}</span><span class="row-when">${s.when}</span></li>`).join("");
    return nav("Search", "Home", "home") + bodyWrap(`<div class="urlbar">${svg(G.search, 18)}<span>Search or enter address</span></div>
      <p class="label">Recently searched</p><ul class="rows">${rows}</ul>`);
  }

  function photosHTML() {
    if (state.sub != null) {
      const p = CASE.photos[state.sub];
      return nav("", "Recents", "up") + bodyWrap(`<div class="photo"><img src="${p.src}" width="${p.w}" height="${p.h}" alt="${esc(p.alt)}"></div>
        <div class="photo-meta"><b>${esc(p.title)}</b><span>${esc(p.sub)}</span></div>`);
    }
    const thumbs = CASE.photos.map((p, i) => `<button type="button" class="thumb" data-sub="${i}" aria-label="Photo ${i + 1}: ${esc(p.alt)}"><img src="${p.src}" alt=""${p.pos ? ` style="object-position:${p.pos}"` : ""}></button>`).join("");
    return nav("Photos", "Home", "home") + bodyWrap(`<h3 class="big">Recents</h3><div class="thumbs">${thumbs}</div>`);
  }

  const VIEWS = { lock: lockHTML, home: homeHTML, messages: messagesHTML, notes: notesHTML, phone: phoneHTML, search: searchHTML, photos: photosHTML };

  function renderOS() {
    const os = $("#os");
    if (state.status === "dead" && !state.revived) {
      os.className = "os dead";
      os.innerHTML = `<div class="shut${flags.died ? " just" : ""}"><span class="spinner" aria-hidden="true"></span>
        <div class="shut-after"><svg width="58" height="30" viewBox="0 0 58 30" fill="none" aria-hidden="true"><rect x="1.500" y="1.500" width="49" height="27" rx="7" stroke="currentColor" stroke-width="2.500"/><rect x="53.500" y="10" width="3.500" height="10" rx="1.750" fill="currentColor"/><rect x="6" y="6" width="4" height="18" rx="2" fill="#ff453a"/></svg>
        <p>No battery</p><button type="button" class="charge" data-act="charge">Charge it</button></div></div>`;
      lastKey = "dead";
      return;
    }
    const key = state.view + ":" + state.sub;
    const keep = key === lastKey && $("#app-body") ? $("#app-body").scrollTop : 0;
    const light = state.view !== "lock" && state.view !== "home";
    const dim = playing() && state.battery === 0;
    const banner = flags.banner ? `<div class="banner" role="status">${TILE.game}<span class="n-main"><b>That’s right.</b><span>This is ${esc(CASE.owner)}’s phone.</span></span></div>` : "";
    os.className = "os" + (light ? " light" : "") + (dim ? " dim" : "") + (flags.wake ? " wake" : "");
    os.innerHTML = statusBar() + `<div class="view${flags.enter ? " enter" : ""}">${VIEWS[state.view]()}</div>` + bottomBar() + banner;
    if (keep && $("#app-body")) $("#app-body").scrollTop = keep;
    lastKey = key;
    if (flags.banner) setTimeout(() => { const b = document.querySelector(".banner"); if (b) b.remove(); }, 3500);
  }

  /* ---------- The reveal ---------- */
  function shareText() {
    const b = state.battery;
    const bar = "■".repeat(b) + "□".repeat(MAX - b);
    const apps = state.log.filter((e) => e.k === "app").length;
    const miss = state.log.filter((e) => e.k === "miss").length;
    const spent = `${apps} app${apps === 1 ? "" : "s"} opened, ${miss} wrong name${miss === 1 ? "" : "s"}`;
    const head = `I Found Your Phone ${no(CASE.id)}`;
    if (state.status === "won") return [head, `${bar} ${b}% left`, spent, SITE].join("\n");
    return [head, `${bar} the phone died`, spent, SITE].join("\n");
  }

  function renderStory() {
    const el = $("#story");
    el.hidden = !state.revealed;
    if (!state.revealed) { el.innerHTML = ""; return; }
    const s = CASE.story, b = state.battery;
    const result = state.status === "won" ? (b > 0 ? `You named the owner with ${b}% battery left.` : "You named the owner at 0%, just before it died.") : "The phone died before you named the owner.";
    const others = CASES.filter((c) => c !== CASE).map((c) => `<button type="button" class="sbtn ghost" data-case="${c.id}">Play ${no(c.id)}</button>`).join("");
    const fig = (f, cls) => `<figure${cls ? ` class="${cls}"` : ""}><img src="${f.src}" width="${f.w}" height="${f.h}" alt="${esc(f.alt)}"><figcaption>${esc(f.cap)}</figcaption></figure>`;
    el.innerHTML = `<p class="kicker">I Found Your Phone ${no(CASE.id)}</p>
      <p class="result">${result}</p>
      <h1>${esc(s.headline)}</h1>
      <p class="dateline">${esc(s.dateline)}</p>
      ${fig(s.lead)}
      <div class="prose"><p>${esc(s.paras[0])}</p><p>${esc(s.paras[1])}</p>${fig(s.side, s.side.wide ? "" : "fig-side")}${s.paras.slice(2).map((p) => `<p>${esc(p)}</p>`).join("")}</div>
      <p class="invented">${esc(s.invented)}</p>
      <pre class="share" id="share-text">${esc(shareText())}</pre>
      <div class="story-btns"><button type="button" class="sbtn" id="copy">Copy result</button><button type="button" class="sbtn ghost to-phone" id="to-phone">Back to the phone</button><button type="button" class="sbtn ghost" id="again">Start over</button>${others}<span class="copied" id="copied" aria-live="polite"></span></div>
      <p class="story-credit">A game from <a href="https://ndmlabs.net/">NDMLABS</a></p>`;
  }

  function render() {
    renderOS();
    renderStory();
    $("#issues").innerHTML = issuesHTML();
    const st = $("#stage");
    st.classList.toggle("revealed", state.revealed);
    st.classList.toggle("reading", state.revealed && state.reading);
    flags = { enter: false, banner: false, died: false, wake: false };
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
    if (!playing()) return;
    $("#alert-t").textContent = title;
    $("#alert-d").textContent = text;
    $("#alert").hidden = false;
    $("#os").inert = true;
    $("#alert-name").focus({ preventScroll: true });
  }
  function hideAlert() { $("#alert").hidden = true; $("#os").inert = !$("#sheet").hidden; }

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
      if (state.opened.length === 1) track("phone-started", { phone: CASE.id });
      toast(`Battery ${state.battery}%`);
      announce(`Opened ${APP_LABEL[id]}. Battery ${state.battery} percent.`);
      if (state.battery === 0) {
        clearTimeout(alertTimer);
        alertTimer = setTimeout(() => showAlert("Battery at 0%", "This phone is about to shut down. You have one guess."), 1100);
      }
    }
    go(id);
  }

  function reveal(ms) {
    clearTimeout(revealTimer);
    revealTimer = setTimeout(() => {
      state.revealed = true;
      state.reading = true;
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
      track("phone-solved", { phone: CASE.id, battery: state.battery });
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
      track("phone-died", { phone: CASE.id });
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
      return hay.includes(q) || hay.split(" ").some((w) => w.startsWith(q));
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
    else if (!q) box.innerHTML = "<p>Start typing. It could be anyone from history.</p>";
    else if (!shown.length) box.innerHTML = "<p>No one by that name on the list.</p>";
    else box.innerHTML = shown.map(([n, what], k) => `<button type="button" role="option" id="opt-${k}" aria-selected="${k === active}" data-pick="${esc(n)}">${esc(n)}<span>${esc(what)}</span></button>`).join("");
    $("#guess").setAttribute("aria-expanded", String(shown.length > 0));
    btn.disabled = !chosen;
    btn.textContent = chosen ? `Name ${chosen[0]}` : "Choose a name";
    $("#sheet-note").textContent = state.battery > 0 ? `A wrong name costs 1%. Battery ${state.battery}%.` : "No battery left. This is your last guess.";
  }
  function openSheet() {
    if (!playing()) return;
    hideAlert();
    chosen = null; active = -1;
    $("#guess").value = "";
    $("#sheet-fb").textContent = "";
    renderSheet();
    $("#sheet").hidden = false;
    $("#os").inert = true;
    setTimeout(() => $("#guess").focus({ preventScroll: true }), 60);
  }
  function closeSheet() {
    $("#sheet").hidden = true;
    $("#os").inert = !$("#alert").hidden;
    const pill = document.querySelector('[data-act="name"]');
    if (pill) pill.focus({ preventScroll: true });
  }

  /* ---------- Events ---------- */
  const screen = $("#screen");
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
  let swipeY = null;
  screen.addEventListener("pointerdown", (e) => { swipeY = e.target.closest("#lock") ? e.clientY : null; });
  screen.addEventListener("pointerup", (e) => {
    if (swipeY != null && swipeY - e.clientY > 40 && state.view === "lock") go("home");
    swipeY = null;
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (!$("#alert").hidden) { hideAlert(); return; }
    if (!$("#sheet").hidden) { closeSheet(); return; }
    if (state.sub != null) go(state.view);
    else if (state.view !== "lock" && state.view !== "home") go("home");
  });

  $("#sheet-x").addEventListener("click", closeSheet);
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

  function reset() {
    clearTimeout(revealTimer); clearTimeout(alertTimer);
    state = fresh();
    flags.wake = true;
    lastKey = "";
    $("#sheet").hidden = true; $("#alert").hidden = true; $("#os").inert = false;
    render();
    window.scrollTo(0, 0);
  }
  // Each phone keeps its own saved game, so switching never loses progress on the other.
  function switchCase(id) {
    const next = byId(id);
    if (!next || next === CASE) return;
    clearTimeout(revealTimer); clearTimeout(alertTimer); clearTimeout(toastTimer);
    CASE = next;
    state = load();
    flags.wake = true;
    lastKey = "";
    chosen = null;
    $("#toast").classList.remove("show");
    $("#sheet").hidden = true; $("#alert").hidden = true; $("#os").inert = false;
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
    if (e.target.closest("#to-phone")) { state.reading = false; render(); window.scrollTo(0, 0); return; }
    if (!e.target.closest("#copy")) return;
    const text = shareText();
    track("share", { phone: CASE.id });
    try { await navigator.clipboard.writeText(text); $("#copied").textContent = "Copied."; }
    catch (_) {
      const r = document.createRange(); r.selectNodeContents($("#share-text"));
      const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r);
      $("#copied").textContent = "Selected. Copy it with your device’s copy command.";
    }
  });

  render();
})();
