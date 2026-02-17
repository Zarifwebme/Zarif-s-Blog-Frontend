import { apiGet, qs } from "./api.js";

/**
 * Sizning serializer field nomlaringiz har xil bo'lishi mumkin.
 * Shu mapping bilan “qaysi field bo'lsa o'shani oladi”.
 */
function pick(obj, keys, fallback = "") {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== undefined && v !== null && String(v).trim() !== "") return v;
  }
  return fallback;
}

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("uz-UZ", { day: "2-digit", month: "short", year: "numeric" });
}

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem("theme", theme);
}

function initTheme() {
  const saved = localStorage.getItem("theme");
  if (saved) setTheme(saved);
  else setTheme("light");

  document.getElementById("themeToggle").addEventListener("click", () => {
    const now = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    setTheme(now);
  });
}

function getStateFromURL() {
  const u = new URL(location.href);
  return {
    page: Number(u.searchParams.get("page") || "1"),
    category: u.searchParams.get("category") || "",
    search: u.searchParams.get("search") || "",
  };
}

function setURLState({ page, category, search }) {
  const u = new URL(location.href);
  u.searchParams.set("page", String(page || 1));
  if (category) u.searchParams.set("category", category);
  else u.searchParams.delete("category");
  if (search) u.searchParams.set("search", search);
  else u.searchParams.delete("search");
  history.pushState({}, "", u.toString());
}

function catSlug(cat) {
  // API da slug bo'lishi mumkin: {id, name, slug}
  return pick(cat, ["slug", "name", "title"]).toString().trim().toLowerCase();
}

function catName(cat) {
  return pick(cat, ["name", "title", "slug"], "Kategoriya");
}

function postId(p) {
  return pick(p, ["id", "pk"]);
}

function postTitle(p) {
  return pick(p, ["title", "name"]);
}

function postDesc(p) {
  return pick(p, ["description", "excerpt", "short_description", "summary"], "");
}

function postImage(p) {
  return pick(p, ["image", "thumbnail", "cover", "image_url"], "");
}

function postCategory(p) {
  // ba'zida: category: "sport" yoki category: {slug,name}
  const c = p?.category;
  if (!c) return "";
  if (typeof c === "string") return c;
  return pick(c, ["slug", "name", "title"], "");
}

function postDate(p) {
  return pick(p, ["created_at", "created", "published_at", "pub_date", "date"], "");
}

function postLink(p) {
  const id = postId(p);
  return `post.html?id=${encodeURIComponent(id)}`;
}

function skeletonFeatured() {
  return `
    <div class="card skeleton">
      <div class="sk-img"></div>
      <div class="sk-body">
        <div class="sk-line" style="width:40%"></div>
        <div class="sk-line" style="width:70%"></div>
        <div class="sk-line" style="width:55%"></div>
      </div>
    </div>
    <div class="side">
      <div class="card skeleton">
        <div class="sk-img" style="height:140px"></div>
        <div class="sk-body">
          <div class="sk-line" style="width:45%"></div>
          <div class="sk-line" style="width:80%"></div>
        </div>
      </div>
      <div class="card skeleton">
        <div class="sk-img" style="height:140px"></div>
        <div class="sk-body">
          <div class="sk-line" style="width:45%"></div>
          <div class="sk-line" style="width:80%"></div>
        </div>
      </div>
    </div>
  `;
}

function skeletonGrid(n = 6) {
  return Array.from({ length: n }).map(() => `
    <div class="card skeleton">
      <div class="sk-img"></div>
      <div class="sk-body">
        <div class="sk-line" style="width:35%"></div>
        <div class="sk-line" style="width:75%"></div>
        <div class="sk-line" style="width:55%"></div>
      </div>
    </div>
  `).join("");
}

function renderCategories(categories, activeSlug) {
  const wrap = document.getElementById("categoryChips");
  const all = `<div class="chip ${activeSlug ? "" : "active"}" data-slug="">#Barchasi</div>`;

  const items = categories.map(c => {
    const slug = catSlug(c);
    const name = catName(c);
    const active = slug === activeSlug ? "active" : "";
    return `<div class="chip ${active}" data-slug="${slug}">#${name}</div>`;
  }).join("");

  wrap.innerHTML = all + items;

  wrap.querySelectorAll(".chip").forEach(ch => {
    ch.addEventListener("click", () => {
      const slug = ch.dataset.slug || "";
      const st = getStateFromURL();
      setURLState({ page: 1, category: slug, search: st.search });
      load();
    });
  });
}

function renderFeatured(posts) {
  const wrap = document.getElementById("featuredWrap");
  if (!posts.length) {
    wrap.innerHTML = `<div class="desc">Postlar topilmadi.</div>`;
    return;
  }

  const main = posts[0];
  const side = posts.slice(1, 3);

  const mainHTML = `
    <a class="card" href="${postLink(main)}">
      <img class="cover" src="${postImage(main) || "https://picsum.photos/1200/800?blur=2"}" alt="cover"/>
      <div class="card-body">
        <div class="meta">
          <span>${formatDate(postDate(main))}</span>
        </div>
        <div class="postlink">
          <div>
            <div class="title">${postTitle(main)}</div>
            <p class="desc">${postDesc(main) || ""}</p>
            <div class="badge">#${postCategory(main) || "post"}</div>
          </div>
          <div class="arrow">↗</div>
        </div>
      </div>
    </a>
  `;

  const sideHTML = `
    <div class="side">
      ${side.map(p => `
        <a class="card" href="${postLink(p)}">
          <img class="small-cover" src="${postImage(p) || "https://picsum.photos/1200/800?blur=2"}" alt="cover"/>
          <div class="card-body">
            <div class="meta"><span>${formatDate(postDate(p))}</span></div>
            <div class="title" style="font-size:16px">${postTitle(p)}</div>
            <p class="desc">${postDesc(p) || ""}</p>
            <div class="badge">#${postCategory(p) || "post"}</div>
          </div>
        </a>
      `).join("")}
    </div>
  `;

  wrap.innerHTML = mainHTML + sideHTML;
}

function renderGrid(posts) {
  const grid = document.getElementById("postsGrid");
  if (!posts.length) {
    grid.innerHTML = `<div class="desc">Postlar topilmadi.</div>`;
    return;
  }

  grid.innerHTML = posts.map(p => `
    <a class="card" href="${postLink(p)}">
      <img class="cover" style="height:200px" src="${postImage(p) || "https://picsum.photos/1200/800?blur=2"}" alt="cover"/>
      <div class="card-body">
        <div class="meta"><span>${formatDate(postDate(p))}</span></div>
        <div class="postlink">
          <div>
            <div class="title">${postTitle(p)}</div>
            <p class="desc">${postDesc(p) || ""}</p>
            <div class="badge">#${postCategory(p) || "post"}</div>
          </div>
          <div class="arrow">↗</div>
        </div>
      </div>
    </a>
  `).join("");
}

/**
 * DRF pagination bo'lsa: {count,next,previous,results}
 * Bo'lmasa: oddiy array kelishi mumkin.
 */
function parseListPayload(data) {
  if (Array.isArray(data)) {
    return { results: data, count: data.length, next: null, previous: null };
  }
  return {
    results: data?.results ?? [],
    count: data?.count ?? 0,
    next: data?.next ?? null,
    previous: data?.previous ?? null
  };
}

function extractPageFromUrl(nextOrPrevUrl) {
  if (!nextOrPrevUrl) return null;
  try {
    const u = new URL(nextOrPrevUrl);
    return Number(u.searchParams.get("page") || "1");
  } catch {
    return null;
  }
}

function renderPagination({ page, count, next, previous }, pageSizeGuess = 6) {
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const pageNums = document.getElementById("pageNums");

  const totalPages = Math.max(1, Math.ceil((count || 1) / pageSizeGuess));

  const prevPage = extractPageFromUrl(previous);
  const nextPage = extractPageFromUrl(next);

  prevBtn.style.opacity = prevPage ? "1" : ".4";
  nextBtn.style.opacity = nextPage ? "1" : ".4";

  prevBtn.onclick = () => {
    if (!prevPage) return;
    const st = getStateFromURL();
    setURLState({ page: prevPage, category: st.category, search: st.search });
    load();
  };

  nextBtn.onclick = () => {
    if (!nextPage) return;
    const st = getStateFromURL();
    setURLState({ page: nextPage, category: st.category, search: st.search });
    load();
  };

  // ko'p bo'lsa ham, 1..10 ko'rsatamiz (rasmdagidek)
  const maxShow = 10;
  const showPages = Math.min(totalPages, maxShow);
  const start = Math.max(1, Math.min(page - 2, totalPages - showPages + 1));
  const pages = Array.from({ length: showPages }, (_, i) => start + i);

  pageNums.innerHTML = pages.map(p => `
    <div class="pill ${p === page ? "active" : ""}" data-page="${p}">${p}</div>
  `).join("");

  pageNums.querySelectorAll(".pill").forEach(el => {
    el.addEventListener("click", () => {
      const p = Number(el.dataset.page);
      const st = getStateFromURL();
      setURLState({ page: p, category: st.category, search: st.search });
      load();
    });
  });
}

function initSearch() {
  const form = document.getElementById("searchForm");
  const input = document.getElementById("searchInput");

  const st = getStateFromURL();
  input.value = st.search;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const q = input.value.trim();
    const st2 = getStateFromURL();
    setURLState({ page: 1, category: st2.category, search: q });
    load();
  });
}

async function load() {
  const st = getStateFromURL();

  // skeleton
  document.getElementById("featuredWrap").innerHTML = skeletonFeatured();
  document.getElementById("postsGrid").innerHTML = skeletonGrid(6);

  // categories
  try {
    const cats = await apiGet("/categories/");
    renderCategories(Array.isArray(cats) ? cats : (cats?.results || []), st.category);
  } catch (e) {
    // categories ishlamasa ham postlar ishlasin
    document.getElementById("categoryChips").innerHTML = `<div class="desc">Kategoriya yuklanmadi.</div>`;
  }

  // posts list
  const list = await apiGet("/posts/" + qs({ page: st.page, category: st.category, search: st.search }));
  const parsed = parseListPayload(list);

  // featured = birinchi 3 ta post (shu page dan)
  renderFeatured(parsed.results.slice(0, 3));
  // grid = qolganlari
  renderGrid(parsed.results);

  // page size guess: results length (0 bo'lsa 6)
  const pageSizeGuess = parsed.results.length || 6;
  renderPagination({ page: st.page, count: parsed.count, next: parsed.next, previous: parsed.previous }, pageSizeGuess);
}

initTheme();
initSearch();
window.addEventListener("popstate", load);
load();
