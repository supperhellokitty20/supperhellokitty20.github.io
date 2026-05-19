// fin.blog — vanilla static client. Loads posts/index.json on boot,
// renders sidebar / list / reader. Markdown bodies fetched on demand and
// parsed by `marked` (loaded from CDN in index.html).

(() => {
  "use strict";

  const NAV = [
    { key: "all",     label: "ALL_POSTS",  id: "001" },
    { key: "writeup", label: "WRITEUPS",   id: "002" },
    { key: "journal", label: "JOURNAL",    id: "003" },
    { key: "archive", label: "ARCHIVE",    id: "004", disabled: true },
    { key: "contact", label: "CONTACT",    id: "005", disabled: true },
  ];

  const LIST_MIN = 280;
  const LIST_MAX = 560;
  const LIST_DEFAULT = 360;

  const readListWidth = () => {
    const saved = parseInt(localStorage.getItem("fin.listWidth") || "", 10);
    return Number.isFinite(saved) && saved >= LIST_MIN && saved <= LIST_MAX ? saved : LIST_DEFAULT;
  };

  const state = {
    filter: "all",
    query: "",
    active: null,
    menuOpen: false,
    sidebarCollapsed: localStorage.getItem("fin.sidebarCollapsed") === "1",
    listHidden: false,
    listWidth: readListWidth(),
    dragging: false,
    posts: [],
    bodyCache: Object.create(null),
  };

  const $ = (sel) => document.querySelector(sel);
  const el = (tag, props = {}, children = []) => {
    const node = document.createElement(tag);
    for (const k in props) {
      if (k === "class") node.className = props[k];
      else if (k === "html") node.innerHTML = props[k];
      else if (k === "text") node.textContent = props[k];
      else if (k === "style") node.style.cssText = props[k];
      else if (k.startsWith("on")) node.addEventListener(k.slice(2).toLowerCase(), props[k]);
      else if (props[k] === true) node.setAttribute(k, "");
      else if (props[k] != null) node.setAttribute(k, props[k]);
    }
    for (const c of [].concat(children)) {
      if (c == null || c === false) continue;
      node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    }
    return node;
  };

  // ============ Boot ============

  async function init() {
    try {
      const res = await fetch("posts/index.json", { cache: "no-store" });
      const data = await res.json();
      state.posts = [...data].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
    } catch (e) {
      state.posts = [];
      console.error("Failed to load posts/index.json", e);
    }

    configureMarkdown();
    configureMermaid();

    applyShellClasses();
    applyListWidth();
    bindEvents();
    renderNav();
    renderList();
    renderTopbar();
    renderReader();

    tickClock();
    setInterval(tickClock, 1000);

    applyHash();
    window.addEventListener("hashchange", applyHash);
  }

  function bindEvents() {
    $("#query").addEventListener("input", (e) => {
      state.query = e.target.value;
      renderList();
      renderTopbar();
    });
    $("#menu-btn").addEventListener("click", () => setMenu(true));
    $("#sidebar-close").addEventListener("click", () => setMenu(false));
    $("#scrim").addEventListener("click", () => setMenu(false));
    $("#sidebar-collapse").addEventListener("click", () => setSidebarCollapsed(!state.sidebarCollapsed));
    $("#focus-toggle").addEventListener("click", () => setListHidden(!state.listHidden));

    const splitter = $("#splitter");
    splitter.addEventListener("mousedown", onSplitDown);
    splitter.addEventListener("touchstart", onSplitDown, { passive: false });
    splitter.addEventListener("dblclick", () => setListWidth(LIST_DEFAULT));

    window.addEventListener("keydown", (e) => {
      const t = e.target;
      const inField = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA");
      if (e.key === "Escape") {
        if (state.menuOpen) setMenu(false);
        else if (state.active) setActive(null);
        return;
      }
      if (inField) return;
      if (e.key === "[") { e.preventDefault(); setSidebarCollapsed(!state.sidebarCollapsed); }
      else if (e.key === "]") { e.preventDefault(); setListHidden(!state.listHidden); }
    });
  }

  function tickClock() {
    const t = new Date().toLocaleTimeString("en-GB", { hour12: false });
    const node = $("#clock");
    if (node) node.textContent = t;
  }

  // ============ Hash routing ============

  function applyHash() {
    const m = location.hash.match(/^#\/(.+)$/);
    if (!m) {
      if (state.active) setActive(null, { skipHash: true });
      return;
    }
    const slug = decodeURIComponent(m[1]);
    if (state.active && state.active.slug === slug) return;
    const post = state.posts.find((p) => p.slug === slug);
    if (post) setActive(post, { skipHash: true });
  }

  // ============ Shell classes / persistence ============

  function applyShellClasses() {
    const app = document.getElementById("app");
    app.classList.toggle("has-active", !!state.active);
    app.classList.toggle("menu-open", state.menuOpen);
    app.classList.toggle("sidebar-collapsed", state.sidebarCollapsed);
    app.classList.toggle("list-hidden", state.listHidden);
    document.getElementById("sidebar").classList.toggle("is-open", state.menuOpen);
    document.getElementById("sidebar").classList.toggle("is-collapsed", state.sidebarCollapsed);

    const chip = document.getElementById("sidebar-collapse");
    chip.textContent = state.sidebarCollapsed ? "»" : "«";
    chip.setAttribute("aria-label", state.sidebarCollapsed ? "expand sidebar" : "collapse sidebar");
    chip.setAttribute("title", state.sidebarCollapsed ? "Expand  [" : "Collapse  [");

    const ft = document.getElementById("focus-toggle");
    const fti = document.getElementById("focus-toggle-icon");
    const ftl = document.getElementById("focus-toggle-label");
    ft.classList.toggle("is-active", state.listHidden);
    fti.textContent = state.listHidden ? "☰" : "✕";
    ftl.textContent = state.listHidden ? "LIST" : "FOCUS";
    ft.setAttribute("title", state.listHidden ? "Show post list  ]" : "Hide post list  ]");
  }

  function applyListWidth() {
    document.getElementById("workspace").style.setProperty("--list-w", state.listWidth + "px");
  }

  function setSidebarCollapsed(v) {
    state.sidebarCollapsed = !!v;
    localStorage.setItem("fin.sidebarCollapsed", v ? "1" : "0");
    applyShellClasses();
  }

  function setListHidden(v) {
    state.listHidden = !!v;
    applyShellClasses();
  }

  function setListWidth(px) {
    const clamped = Math.max(LIST_MIN, Math.min(LIST_MAX, Math.round(px)));
    state.listWidth = clamped;
    localStorage.setItem("fin.listWidth", String(clamped));
    applyListWidth();
  }

  function setMenu(open) {
    state.menuOpen = !!open;
    applyShellClasses();
  }

  // ============ Splitter drag ============

  function onSplitDown(e) {
    e.preventDefault();
    state.dragging = true;
    const splitter = $("#splitter");
    splitter.classList.add("is-dragging");
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", onSplitMove);
    window.addEventListener("touchmove", onSplitMove, { passive: false });
    window.addEventListener("mouseup", onSplitUp);
    window.addEventListener("touchend", onSplitUp);
  }
  function onSplitMove(e) {
    if (!state.dragging) return;
    if (e.cancelable) e.preventDefault();
    const ws = $("#workspace");
    const rect = ws.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    setListWidth(clientX - rect.left);
  }
  function onSplitUp() {
    state.dragging = false;
    $("#splitter").classList.remove("is-dragging");
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
    window.removeEventListener("mousemove", onSplitMove);
    window.removeEventListener("touchmove", onSplitMove);
    window.removeEventListener("mouseup", onSplitUp);
    window.removeEventListener("touchend", onSplitUp);
  }

  // ============ Filter / state ============

  function getFiltered() {
    let posts = state.posts;
    if (state.filter === "writeup") posts = posts.filter((p) => p.kind === "WRITEUP");
    if (state.filter === "journal") posts = posts.filter((p) => p.kind === "JOURNAL");
    const q = state.query.trim().toLowerCase();
    if (q) {
      posts = posts.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          (p.excerpt || "").toLowerCase().includes(q) ||
          (p.tags || []).some((t) => t.toLowerCase().includes(q))
      );
    }
    return posts;
  }

  function counts() {
    return {
      all: state.posts.length,
      writeup: state.posts.filter((p) => p.kind === "WRITEUP").length,
      journal: state.posts.filter((p) => p.kind === "JOURNAL").length,
    };
  }

  function setFilter(key) {
    state.filter = key;
    // Nav-filter click exits focus mode and closes any open post so the
    // freshly filtered list is visible (on mobile the reader otherwise
    // stays on top of the list).
    state.listHidden = false;
    state.active = null;
    if (state.menuOpen) state.menuOpen = false;
    applyShellClasses();
    renderNav();
    renderList();
    renderReader();
    renderTopbar();
    if (location.hash) {
      history.replaceState(null, "", location.pathname + location.search);
    }
  }

  async function setActive(post, opts = {}) {
    state.active = post;
    // Card click → enter focus mode. Close → exit focus mode.
    state.listHidden = !!post;
    applyShellClasses();
    renderList();
    await renderReader();
    if (!opts.skipHash) {
      if (post) {
        const next = "#/" + encodeURIComponent(post.slug);
        if (location.hash !== next) history.replaceState(null, "", next);
      } else if (location.hash) {
        history.replaceState(null, "", location.pathname + location.search);
      }
    }
  }

  // ============ Render: nav ============

  function renderNav() {
    const list = $("#nav-list");
    const c = counts();
    list.innerHTML = "";
    for (const n of NAV) {
      const active = state.filter === n.key;
      const btn = el(
        "button",
        {
          class: "nav__item" + (active ? " is-active" : "") + (n.disabled ? " is-disabled" : ""),
          disabled: n.disabled || null,
          onClick: () => { if (!n.disabled) setFilter(n.key); },
        },
        [
          el("span", { class: "nav__id", text: n.id }),
          el("span", { class: "nav__label", text: n.label }),
          c[n.key] != null ? el("span", { class: "nav__count", text: String(c[n.key]) }) : null,
          n.disabled ? el("span", { class: "nav__lock", text: "LOCKED" }) : null,
          active ? el("span", { class: "nav__bar" }) : null,
        ]
      );
      list.appendChild(el("li", {}, btn));
    }
  }

  // ============ Render: topbar / list label ============

  function renderTopbar() {
    const posts = getFiltered();
    const crumb = state.filter === "all" ? "all_posts"
                : state.filter === "writeup" ? "writeups"
                : state.filter === "journal" ? "journal"
                : state.filter;
    $("#crumb").textContent = crumb;
    $("#result-count").textContent = String(posts.length).padStart(2, "0");
    $("#list-count").textContent = "[" + posts.length + "]";
    const accent = $("#list-accent");
    if (state.filter === "all") accent.removeAttribute("hidden");
    else accent.setAttribute("hidden", "");
  }

  // ============ Render: list ============

  function renderList() {
    const posts = getFiltered();
    const scroll = $("#list-scroll");
    const empty = $("#list-empty");
    scroll.innerHTML = "";
    if (posts.length === 0) {
      scroll.hidden = true;
      empty.hidden = false;
      renderTopbar();
      return;
    }
    scroll.hidden = false;
    empty.hidden = true;
    for (const p of posts) {
      scroll.appendChild(card(p, state.active && state.active.id === p.id));
    }
    renderTopbar();
  }

  function brackets(activeColor) {
    const c = activeColor || "var(--line)";
    return [
      el("span", { class: "bracket bracket--tl", style: "border-color:" + c }),
      el("span", { class: "bracket bracket--tr", style: "border-color:" + c }),
      el("span", { class: "bracket bracket--bl", style: "border-color:" + c }),
      el("span", { class: "bracket bracket--br", style: "border-color:" + c }),
    ];
  }

  function card(post, active) {
    const row1 = el("div", { class: "card__row1" }, [
      el("span", { class: "card__id mono", text: "#" + post.id }),
      el("span", { class: "card__kind card__kind--" + post.kind.toLowerCase(), text: post.kind }),
      post.severity
        ? el("span", { class: "sev sev--" + post.severity.toLowerCase(), text: "SEV: " + post.severity })
        : null,
      el("span", { class: "card__date mono", text: post.date }),
    ]);
    const tags = el(
      "div",
      { class: "card__tags" },
      (post.tags || []).map((t) => el("span", { class: "tag", text: "#" + t }))
    );
    const row3 = el("div", { class: "card__row3" }, [
      tags,
      el("span", { class: "card__read mono dim", text: post.read || "" }),
    ]);

    const children = [
      ...brackets(active ? "var(--yellow)" : null),
      row1,
      el("div", { class: "card__title", text: post.title }),
      el("div", { class: "card__excerpt", text: post.excerpt || "" }),
      row3,
    ];
    if (active) children.push(el("span", { class: "card__active-rail" }));

    return el(
      "button",
      {
        class: "card" + (active ? " is-active" : ""),
        onClick: () => setActive(post),
      },
      children
    );
  }

  // ============ Render: reader ============

  async function renderReader() {
    const mount = $("#reader-mount");
    mount.innerHTML = "";
    if (!state.active) {
      mount.appendChild(emptyReader());
      return;
    }
    const post = state.active;
    const bodyHtml = await loadBody(post);
    const art = readerArticle(post, bodyHtml);
    mount.appendChild(art);
    renderMermaidIn(art);
  }

  function emptyReader() {
    const inner = el("div", { class: "reader__empty-inner" }, [
      el("div", { class: "reader__empty-glyph mono", text: "{ }" }),
      el("div", { class: "reader__empty-h", text: "NO TRANSMISSION SELECTED" }),
      el("div", { class: "reader__empty-p dim", text: "Pick a file from the list. Decryption is automatic." }),
      el("div", { class: "reader__empty-foot mono dim", text: "// awaiting input █" }),
    ]);
    return el("div", { class: "reader__empty" }, [...brackets(), inner]);
  }

  function readerArticle(post, bodyHtml) {
    const head = el("div", { class: "reader__head" }, [
      el("div", { class: "reader__crumbs" }, [
        el("span", { class: "mono dim", text: "FILE" }),
        el("span", {
          class: "mono",
          text: "/" + post.kind.toLowerCase() + "/" + post.slug + ".md",
        }),
      ]),
      el(
        "button",
        { class: "reader__close", onClick: () => setActive(null) },
        [el("span", { text: "CLOSE" }), el("span", { class: "mono", text: "[ESC]" })]
      ),
    ]);

    const meta = el("div", { class: "reader__meta" }, [
      el("span", { class: "card__id mono", text: "#" + post.id }),
      el("span", { class: "card__kind card__kind--" + post.kind.toLowerCase(), text: post.kind }),
      post.severity
        ? el("span", { class: "sev sev--" + post.severity.toLowerCase(), text: "SEV: " + post.severity })
        : null,
      el("span", { class: "card__date mono", text: post.date }),
      el("span", { class: "dim mono", text: "·" }),
      el("span", { class: "card__date mono dim", text: post.read || "" }),
    ]);

    const titleText = el("span", { class: "reader__title-text", text: post.title });
    const caret = el("span", { class: "reader__title-caret", text: "_" });
    const title = el("h1", { class: "reader__title" }, [titleText, caret]);

    const excerpt = el("div", { class: "reader__excerpt", text: post.excerpt || "" });

    const begin = el("div", { class: "reader__divider" }, [
      el("span", { class: "mono", text: "// BEGIN_BODY" }),
      el("span", { class: "reader__divider-line" }),
    ]);
    const end = el("div", { class: "reader__divider" }, [
      el("span", { class: "mono", text: "// END_BODY" }),
      el("span", { class: "reader__divider-line" }),
    ]);

    const body = el("div", { class: "reader__body", html: bodyHtml });

    const tagsLg = el(
      "div",
      { class: "reader__tags" },
      (post.tags || []).map((t) => el("span", { class: "tag tag--lg", text: "#" + t }))
    );
    const sign = el("div", { class: "reader__sign mono" }, [
      el("span", { class: "dim", text: "signed " }),
      el("span", { style: "color:var(--yellow)", text: "fin" }),
      el("span", { class: "dim", text: " · " }),
      el("span", { class: "dim", text: "PGP 0xC0DE.BABE.4FIN" }),
    ]);
    const foot = el("div", { class: "reader__foot" }, [tagsLg, sign]);

    const scroll = el("div", { class: "reader__scroll" }, [meta, title, excerpt, begin, body, end, foot]);
    const art = el("article", { class: "reader" }, [head, scroll]);

    runDecrypt(titleText, post.title);

    return art;
  }

  // ============ Markdown / Mermaid setup ============

  function configureMarkdown() {
    if (!window.marked || !window.marked.use) return;
    const mermaidExt = {
      name: "mermaid",
      level: "block",
      start(src) {
        const m = src.match(/^```mermaid\b/m);
        return m ? m.index : undefined;
      },
      tokenizer(src) {
        const m = src.match(/^```mermaid[^\n]*\n([\s\S]*?)\n```\s*(?:\n|$)/);
        if (!m) return;
        return { type: "mermaid", raw: m[0], text: m[1] };
      },
      renderer(token) {
        return '<div class="mermaid">' + token.text + "</div>\n";
      },
    };
    window.marked.use({ extensions: [mermaidExt] });
  }

  function configureMermaid() {
    if (!window.mermaid) return;
    window.mermaid.initialize({
      startOnLoad: false,
      securityLevel: "strict",
      theme: "base",
      fontFamily: '"Chakra Petch", system-ui, sans-serif',
      flowchart:    { useMaxWidth: true, htmlLabels: true, curve: "basis", nodeSpacing: 70, rankSpacing: 90, padding: 18 },
      sequence:     { useMaxWidth: true, actorMargin: 80, messageFontSize: 18, noteFontSize: 17, actorFontSize: 18, boxMargin: 14 },
      class:        { useMaxWidth: true },
      state:        { useMaxWidth: true },
      er:           { useMaxWidth: true, fontSize: 18 },
      gantt:        { useMaxWidth: true, fontSize: 16 },
      pie:          { useMaxWidth: true, textPosition: 0.7 },
      themeVariables: {
        fontSize: "20px",
        labelFontSize: "20px",
        nodeTextSize: "20px",
        background: "#0b0b0c",
        primaryColor: "#101012",
        primaryTextColor: "#ececec",
        primaryBorderColor: "#fcee0a",
        secondaryColor: "#14140e",
        secondaryBorderColor: "#2e2e33",
        tertiaryColor: "#0b0b0c",
        tertiaryBorderColor: "#2e2e33",
        lineColor: "#9a9a9a",
        textColor: "#ececec",
        mainBkg: "#101012",
        nodeBorder: "#fcee0a",
        clusterBkg: "#0b0b0c",
        clusterBorder: "#2e2e33",
        edgeLabelBackground: "#0b0b0c",
        noteBkgColor: "#14140e",
        noteTextColor: "#ececec",
        noteBorderColor: "#fcee0a",
      },
    });
  }

  async function renderMermaidIn(root) {
    if (!window.mermaid || !root) return;
    const nodes = root.querySelectorAll(".mermaid:not([data-processed='true'])");
    if (!nodes.length) return;
    try {
      await window.mermaid.run({ nodes });
    } catch (e) {
      console.error("mermaid render failed", e);
    }
  }

  // ============ Body loading + markdown ============

  async function loadBody(post) {
    if (state.bodyCache[post.slug]) return state.bodyCache[post.slug];
    try {
      const url = "posts/" + post.id + "-" + post.slug + ".md";
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const raw = await res.text();
      const md = stripFrontmatter(raw);
      const html = (window.marked && window.marked.parse)
        ? window.marked.parse(md)
        : escapeHtml(md).replace(/\n\n+/g, "</p><p>").replace(/^/, "<p>").replace(/$/, "</p>");
      state.bodyCache[post.slug] = html;
      return html;
    } catch (e) {
      console.error("Body load failed", post.slug, e);
      return '<p class="dim">// transmission lost</p>';
    }
  }

  function stripFrontmatter(text) {
    const m = text.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/);
    return m ? text.slice(m[0].length) : text;
  }

  function escapeHtml(s) {
    return s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // ============ Decrypt title effect ============

  function runDecrypt(targetEl, target) {
    if (!target) { targetEl.textContent = ""; return; }
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&@*/<>";
    let frame = 0;
    const total = 14;
    const tick = () => {
      frame += 1;
      const progress = frame / total;
      const reveal = Math.floor(target.length * progress);
      let s = "";
      for (let i = 0; i < target.length; i++) {
        const ch = target[i];
        if (i < reveal) s += ch;
        else if (ch === " ") s += " ";
        else s += chars[Math.floor(Math.random() * chars.length)];
      }
      targetEl.textContent = s;
      if (frame >= total) { targetEl.textContent = target; return; }
      setTimeout(tick, 28);
    };
    targetEl.textContent = "";
    setTimeout(tick, 28);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
