import { apiGet, qs } from "./api.js";

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
  setTheme(saved || "light");

  document.getElementById("themeToggle").addEventListener("click", () => {
    const now = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    setTheme(now);
  });
}

function getId() {
  const u = new URL(location.href);
  return u.searchParams.get("id");
}

function postTitle(p) { return pick(p, ["title", "name"]); }
function postDesc(p) { return pick(p, ["description", "excerpt", "short_description", "summary"], ""); }
function postImage(p) { return pick(p, ["image", "thumbnail", "cover", "image_url"], ""); }
function postDate(p) { return pick(p, ["created_at", "created", "published_at", "pub_date", "date"], ""); }

function postCategory(p) {
  const c = p?.category;
  if (!c) return "";
  if (typeof c === "string") return c;
  return pick(c, ["slug", "name", "title"], "");
}

function postCategoryName(p) {
  const c = p?.category;
  if (!c) return "";
  if (typeof c === "string") return c;
  return pick(c, ["name", "title", "slug"], "");
}

function postId(p){ return pick(p, ["id","pk"]); }

function initSearch() {
  const form = document.getElementById("searchForm");
  const input = document.getElementById("searchInput");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const q = input.value.trim();
    // search natijasi indexda ko'rinsin
    const u = new URL(location.origin + location.pathname.replace("post.html","index.html"));
    if (q) u.searchParams.set("search", q);
    location.href = u.toString();
  });
}

function cardSmall(p) {
  const id = postId(p);
  return `
    <a class="card" href="post.html?id=${encodeURIComponent(id)}">
      <img class="small-cover" src="${postImage(p) || "https://picsum.photos/1200/800?blur=2"}" alt="cover"/>
      <div class="card-body">
        <div class="meta"><span>${formatDate(postDate(p))}</span></div>
        <div class="title" style="font-size:16px">${postTitle(p)}</div>
        <p class="desc">${postDesc(p) || ""}</p>
        <div class="badge">#${postCategory(p) || "post"}</div>
      </div>
    </a>
  `;
}

function cardGrid(p) {
  const id = postId(p);
  return `
    <a class="card" href="post.html?id=${encodeURIComponent(id)}">
      <img class="cover" style="height:200px" src="${postImage(p) || "https://picsum.photos/1200/800?blur=2"}" alt="cover"/>
      <div class="card-body">
        <div class="meta"><span>${formatDate(postDate(p))}</span></div>
        <div class="title">${postTitle(p)}</div>
        <p class="desc">${postDesc(p) || ""}</p>
        <div class="badge">#${postCategory(p) || "post"}</div>
      </div>
    </a>
  `;
}

async function load() {
  const id = getId();
  if (!id) {
    document.getElementById("detailCard").innerHTML = `<div class="card-body">ID topilmadi.</div>`;
    return;
  }

  const post = await apiGet(`/posts/${id}/`);

  document.title = `${postTitle(post)} — Zarif's Blog`;

  const breadcrumb = document.getElementById("breadcrumb");
  const catSlug = postCategory(post);
  const catLabel = postCategoryName(post);
  breadcrumb.innerHTML = `
    <a href="index.html">Bosh sahifa</a> / 
    <a href="index.html?category=${encodeURIComponent(catSlug)}">${catLabel || catSlug || "Kategoriya"}</a> /
    <span>${postTitle(post)}</span>
  `;

  const detail = document.getElementById("detailCard");
  detail.innerHTML = `
    <img class="cover" src="${postImage(post) || "https://picsum.photos/1200/800?blur=2"}" alt="cover"/>
    <div class="card-body">
      <div class="meta">
        <span>${formatDate(postDate(post))}</span>
      </div>
      <div class="title" style="font-size:24px">${postTitle(post)}</div>
      <div class="badge">#${catLabel || catSlug || "post"}</div>

      <div class="content">
        ${
          // agar API HTML qaytarsa: content/body/html
          // oddiy text bo'lsa ham ko'rsatadi
          pick(post, ["content", "body", "text", "html"], postDesc(post) || "")
        }
      </div>
    </div>
  `;

  // Related: shu kategoriya bo'yicha postlar (id dan boshqa)
  const relatedPayload = await apiGet("/posts/" + qs({ category: catSlug, page: 1 }));
  const related = Array.isArray(relatedPayload) ? relatedPayload : (relatedPayload.results || []);
  const filtered = related.filter(p => String(postId(p)) !== String(id)).slice(0, 6);

  const relatedWrap = document.getElementById("relatedWrap");
  relatedWrap.innerHTML = filtered.slice(0, 3).map(cardSmall).join("") || `<div class="desc">Related topilmadi.</div>`;

  const relatedGrid = document.getElementById("relatedGrid");
  relatedGrid.innerHTML = filtered.map(cardGrid).join("") || `<div class="desc">Related topilmadi.</div>`;
}

initTheme();
initSearch();
load();
