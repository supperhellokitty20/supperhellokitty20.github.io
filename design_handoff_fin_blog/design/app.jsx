// fin.blog — cyberpunk 2077 HUD netrunner deck
// Layout: 260px sidebar | main(56px topbar / split list+reader)

const { useState, useEffect, useRef } = React;

// ============ Atomic HUD bits ============

// Corner-bracket frame around a panel. Decorative.
const Brackets = ({ color = "var(--yellow)" }) => (
  <>
    <span className="bracket bracket--tl" style={{ borderColor: color }} />
    <span className="bracket bracket--tr" style={{ borderColor: color }} />
    <span className="bracket bracket--bl" style={{ borderColor: color }} />
    <span className="bracket bracket--br" style={{ borderColor: color }} />
  </>
);

// Section label with a leading // and trailing line — used everywhere.
const SectionLabel = ({ children, count, accent }) => (
  <div className="section-label">
    <span className="section-label__slash">//</span>
    <span className="section-label__text">{children}</span>
    {count != null && <span className="section-label__count">[{count}]</span>}
    <span className="section-label__line" />
    {accent && <span className="section-label__accent">{accent}</span>}
  </div>
);

// Tiny status pill: dot + label
const StatusPill = ({ tone = "ok", children }) => (
  <span className={`status-pill status-pill--${tone}`}>
    <span className="status-pill__dot" />
    {children}
  </span>
);

// ============ Sidebar ============

const NAV = [
  { key: "all",      label: "ALL_POSTS",   id: "001" },
  { key: "writeup",  label: "WRITEUPS",    id: "002" },
  { key: "journal",  label: "JOURNAL",     id: "003" },
  { key: "archive",  label: "ARCHIVE",     id: "004", disabled: true },
  { key: "contact",  label: "CONTACT",     id: "005", disabled: true },
];

const Sidebar = ({ filter, setFilter, counts, open, onClose, collapsed, onToggleCollapse }) => {
  // live clock
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const time = now.toLocaleTimeString("en-GB", { hour12: false });

  return (
    <aside className={"sidebar" + (open ? " is-open" : "") + (collapsed ? " is-collapsed" : "")}>
      <button className="sidebar__close" onClick={onClose} aria-label="close menu">×</button>
      <button
        className="sidebar__collapse"
        onClick={onToggleCollapse}
        aria-label={collapsed ? "expand sidebar" : "collapse sidebar"}
        title={collapsed ? "Expand  [  " : "Collapse  [  "}
      >
        {collapsed ? "»" : "«"}
      </button>
      <div className="sidebar__top">
        {/* Identity block */}
        <div className="ident">
          <div className="ident__mark">
            <span className="ident__mark-brand">FIN</span>
            <span className="ident__mark-dot">.</span>
            <span className="ident__mark-tld">BLOG</span>
          </div>
          <div className="ident__tag">
            <span style={{ color: "var(--magenta)" }}>{">"}</span> trespass.log{" "}
            <span className="caret">_</span>
          </div>
          <div className="ident__meta">
            <div><span className="dim">USER</span><span>fin</span></div>
            <div><span className="dim">ROLE</span><span>netrunner / freelance</span></div>
            <div><span className="dim">LOC</span><span>NC // off-grid</span></div>
          </div>
        </div>

        {/* Nav */}
        <nav className="nav">
          <SectionLabel>NAVIGATION</SectionLabel>
          <ul className="nav__list">
            {NAV.map((n) => {
              const active = filter === n.key;
              return (
                <li key={n.key}>
                  <button
                    className={
                      "nav__item" +
                      (active ? " is-active" : "") +
                      (n.disabled ? " is-disabled" : "")
                    }
                    onClick={() => { if (!n.disabled) { setFilter(n.key); onClose && onClose(); } }}
                    disabled={n.disabled}
                  >
                    <span className="nav__id">{n.id}</span>
                    <span className="nav__label">{n.label}</span>
                    {counts[n.key] != null && (
                      <span className="nav__count">{counts[n.key]}</span>
                    )}
                    {n.disabled && <span className="nav__lock">LOCKED</span>}
                    {active && <span className="nav__bar" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* System footer */}
      <div className="sysfoot">
        <SectionLabel>SYSTEM</SectionLabel>
        <div className="sysfoot__rows">
          <div><span className="dim">TIME</span><span className="mono">{time}</span></div>
          <div><span className="dim">UPLINK</span><StatusPill tone="ok">SECURE</StatusPill></div>
          <div><span className="dim">DAEMON</span><span className="mono">blackwall.v7</span></div>
        </div>
        <div className="sysfoot__legal">© 2077 // NO RIGHTS RESERVED</div>
      </div>
    </aside>
  );
};

// ============ Top bar ============

const TopBar = ({ crumb, total, query, setQuery, onMenu, listHidden, onToggleList, hasPost }) => (
  <header className="topbar">
    <button className="topbar__menu" onClick={onMenu} aria-label="open menu">
      <span /><span /><span />
    </button>
    <div className="topbar__crumb">
      <span className="dim">//</span>
      <span>fin.blog</span>
      <span className="dim">/</span>
      <span style={{ color: "var(--yellow)" }}>{crumb}</span>
    </div>
    <div className="topbar__center">
      <span className="dim mono">QUERY:</span>
      <input
        className="topbar__input mono"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="grep ./posts/*"
        spellCheck={false}
      />
    </div>
    <div className="topbar__right">
      <button
        className={"topbar__toggle" + (listHidden ? " is-active" : "")}
        onClick={onToggleList}
        title={listHidden ? "Show post list  ]" : "Hide post list  ]"}
      >
        <span className="topbar__toggle-icon">{listHidden ? "☰" : "✕"}</span>
        <span className="topbar__toggle-label">{listHidden ? "LIST" : "FOCUS"}</span>
      </button>
      <span className="topbar__sep" />
      <span className="dim mono">RESULTS</span>
      <span className="mono" style={{ color: "var(--yellow)" }}>
        {String(total).padStart(2, "0")}
      </span>
      <span className="topbar__sep topbar__sep--narrow" />
      <StatusPill tone="ok">ONLINE</StatusPill>
    </div>
  </header>
);

// ============ Post list ============

const PostCard = ({ post, active, onSelect, index }) => (
  <button
    className={"card" + (active ? " is-active" : "")}
    onClick={() => onSelect(post)}
  >
    <Brackets color={active ? "var(--yellow)" : "var(--line)"} />
    <div className="card__row1">
      <span className="card__id mono">#{post.id}</span>
      <span className={"card__kind card__kind--" + post.kind.toLowerCase()}>
        {post.kind}
      </span>
      {post.severity && (
        <span className={"sev sev--" + post.severity.toLowerCase()}>
          SEV: {post.severity}
        </span>
      )}
      <span className="card__date mono">{post.date}</span>
    </div>
    <div className="card__title">{post.title}</div>
    <div className="card__excerpt">{post.excerpt}</div>
    <div className="card__row3">
      <div className="card__tags">
        {post.tags.map((t) => (
          <span key={t} className="tag">#{t}</span>
        ))}
      </div>
      <span className="card__read mono dim">{post.read}</span>
    </div>
    {active && <span className="card__active-rail" />}
  </button>
);

const PostList = ({ posts, activeId, onSelect, filter }) => {
  return (
    <section className="list">
      <SectionLabel count={posts.length} accent={filter === "all" ? "LIVE" : null}>
        TRANSMISSIONS
      </SectionLabel>
      {posts.length === 0 ? (
        <div className="list__empty mono">
          <span style={{ color: "var(--magenta)" }}>// NO_MATCH</span>
          <div className="dim" style={{ marginTop: 8 }}>
            adjust query or clear filters
          </div>
        </div>
      ) : (
        <div className="list__scroll">
          {posts.map((p, i) => (
            <PostCard
              key={p.id}
              post={p}
              index={i}
              active={activeId === p.id}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </section>
  );
};

// ============ Reader ============

// Brief decrypt animation on the title when post changes.
const useDecrypt = (target, deps) => {
  const [out, setOut] = useState(target);
  useEffect(() => {
    if (!target) { setOut(""); return; }
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&@*/<>";
    let frame = 0;
    const total = 14;
    const id = setInterval(() => {
      frame += 1;
      const progress = frame / total;
      const reveal = Math.floor(target.length * progress);
      let s = "";
      for (let i = 0; i < target.length; i++) {
        if (i < reveal) s += target[i];
        else if (target[i] === " ") s += " ";
        else s += chars[Math.floor(Math.random() * chars.length)];
      }
      setOut(s);
      if (frame >= total) { clearInterval(id); setOut(target); }
    }, 28);
    return () => clearInterval(id);
    // eslint-disable-next-line
  }, deps);
  return out;
};

const ReaderEmpty = () => (
  <div className="reader__empty">
    <Brackets color="var(--line)" />
    <div className="reader__empty-inner">
      <div className="reader__empty-glyph mono">{"{ }"}</div>
      <div className="reader__empty-h">NO TRANSMISSION SELECTED</div>
      <div className="reader__empty-p dim">
        Pick a file from the list. Decryption is automatic.
      </div>
      <div className="reader__empty-foot mono dim">
        // awaiting input ▌
      </div>
    </div>
  </div>
);

const Reader = ({ post, onClose }) => {
  const decrypted = useDecrypt(post?.title || "", [post?.id]);
  const scrollRef = useRef(null);
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [post?.id]);

  if (!post) return <ReaderEmpty />;

  return (
    <article className="reader" key={post.id}>
      <div className="reader__head">
        <div className="reader__crumbs">
          <span className="mono dim">FILE</span>
          <span className="mono">/{post.kind.toLowerCase()}/{post.slug}.md</span>
        </div>
        <button className="reader__close" onClick={onClose}>
          <span>CLOSE</span>
          <span className="mono">[ESC]</span>
        </button>
      </div>

      <div className="reader__scroll" ref={scrollRef}>
        <div className="reader__meta">
          <span className="card__id mono">#{post.id}</span>
          <span className={"card__kind card__kind--" + post.kind.toLowerCase()}>
            {post.kind}
          </span>
          {post.severity && (
            <span className={"sev sev--" + post.severity.toLowerCase()}>
              SEV: {post.severity}
            </span>
          )}
          <span className="card__date mono">{post.date}</span>
          <span className="dim mono">·</span>
          <span className="card__date mono dim">{post.read}</span>
        </div>

        <h1 className="reader__title">
          <span className="reader__title-text">{decrypted}</span>
          <span className="reader__title-caret">_</span>
        </h1>

        <div className="reader__excerpt">{post.excerpt}</div>

        <div className="reader__divider">
          <span className="mono">// BEGIN_BODY</span>
          <span className="reader__divider-line" />
        </div>

        <div className="reader__body">
          {post.body.map((block, i) => {
            const [tag, text] = block;
            if (tag === "p") return <p key={i}>{text}</p>;
            if (tag === "h3") return <h3 key={i}>{text}</h3>;
            if (tag === "code") return <pre key={i}><code>{text}</code></pre>;
            return null;
          })}
        </div>

        <div className="reader__divider">
          <span className="mono">// END_BODY</span>
          <span className="reader__divider-line" />
        </div>

        <div className="reader__foot">
          <div className="reader__tags">
            {post.tags.map((t) => (
              <span key={t} className="tag tag--lg">#{t}</span>
            ))}
          </div>
          <div className="reader__sign mono">
            <span className="dim">signed</span>{" "}
            <span style={{ color: "var(--yellow)" }}>fin</span>{" "}
            <span className="dim">·</span>{" "}
            <span className="dim">PGP 0xC0DE.BABE.4FIN</span>
          </div>
        </div>
      </div>
    </article>
  );
};

// ============ App root ============

const App = () => {
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  // Collapsible panels
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() =>
    localStorage.getItem("fin.sidebarCollapsed") === "1"
  );
  const [listHidden, setListHidden] = useState(false);

  useEffect(() => {
    localStorage.setItem("fin.sidebarCollapsed", sidebarCollapsed ? "1" : "0");
  }, [sidebarCollapsed]);

  // Click a post → enter focus mode (hide list). Closing → restore list.
  const openPost = (p) => {
    setActive(p);
    setListHidden(true);
  };
  const closePost = () => {
    setActive(null);
    setListHidden(false);
  };

  // Resizable splitter — width of the post list column in px.
  const LIST_MIN = 280;
  const LIST_MAX = 560;
  const LIST_DEFAULT = 360;
  const [listWidth, setListWidth] = useState(() => {
    const saved = parseInt(localStorage.getItem("fin.listWidth") || "", 10);
    return Number.isFinite(saved) && saved >= LIST_MIN && saved <= LIST_MAX
      ? saved
      : LIST_DEFAULT;
  });
  const [dragging, setDragging] = useState(false);
  const workspaceRef = useRef(null);

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e) => {
      const rect = workspaceRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
      const clamped = Math.max(LIST_MIN, Math.min(LIST_MAX, x));
      setListWidth(clamped);
    };
    const onUp = () => {
      setDragging(false);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", onMove);
    window.addEventListener("touchmove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchend", onUp);
    };
  }, [dragging]);

  useEffect(() => {
    localStorage.setItem("fin.listWidth", String(listWidth));
  }, [listWidth]);

  const resetSplit = () => setListWidth(LIST_DEFAULT);

  // Filter logic
  const counts = {
    all: window.POSTS.length,
    writeup: window.POSTS.filter((p) => p.kind === "WRITEUP").length,
    journal: window.POSTS.filter((p) => p.kind === "JOURNAL").length,
  };

  let posts = window.POSTS;
  if (filter === "writeup") posts = posts.filter((p) => p.kind === "WRITEUP");
  if (filter === "journal") posts = posts.filter((p) => p.kind === "JOURNAL");
  if (query.trim()) {
    const q = query.toLowerCase();
    posts = posts.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q) ||
        p.tags.some((t) => t.includes(q))
    );
  }

  // Escape to close; [ toggles sidebar; ] toggles list
  useEffect(() => {
    const onKey = (e) => {
      if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) return;
      if (e.key === "Escape" && active) closePost();
      else if (e.key === "[") setSidebarCollapsed((v) => !v);
      else if (e.key === "]") setListHidden((v) => !v);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);

  const crumb =
    filter === "all" ? "all_posts"
    : filter === "writeup" ? "writeups"
    : filter === "journal" ? "journal"
    : filter;

  return (
    <div
      className={
        "app" +
        (active ? " has-active" : "") +
        (menuOpen ? " menu-open" : "") +
        (sidebarCollapsed ? " sidebar-collapsed" : "") +
        (listHidden ? " list-hidden" : "")
      }
    >
      <Sidebar
        filter={filter}
        setFilter={(f) => { setFilter(f); setListHidden(false); }}
        counts={counts}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
      />
      <div className="app__scrim" onClick={() => setMenuOpen(false)} />
      <main className="main">
        <TopBar
          crumb={crumb}
          total={posts.length}
          query={query}
          setQuery={setQuery}
          onMenu={() => setMenuOpen(true)}
          listHidden={listHidden}
          onToggleList={() => setListHidden((v) => !v)}
          hasPost={!!active}
        />
        <div className="workspace" ref={workspaceRef} style={{ "--list-w": listWidth + "px" }}>
          <PostList
            posts={posts}
            activeId={active?.id}
            onSelect={openPost}
            filter={filter}
          />
          <div
            className={"splitter" + (dragging ? " is-dragging" : "")}
            onMouseDown={(e) => { e.preventDefault(); setDragging(true); }}
            onTouchStart={(e) => setDragging(true)}
            onDoubleClick={resetSplit}
            role="separator"
            aria-label="resize post list"
            title="Drag to resize  ·  double-click to reset"
          >
            <span className="splitter__grip" />
          </div>
          <Reader post={active} onClose={closePost} />
        </div>
      </main>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
