function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem("theme", theme);
}

function initTheme() {
  const saved = localStorage.getItem("theme");
  setTheme(saved || "light");

  const desktopToggle = document.getElementById("themeToggle");
  desktopToggle?.addEventListener("click", () => {
    const now = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    setTheme(now);
  });

  const mobileToggle = document.getElementById("themeToggleMobile");
  mobileToggle?.addEventListener("click", () => {
    desktopToggle?.click();
  });
}

function initMobileMenu() {
  const overlay = document.getElementById("menuOverlay");
  const btn = document.getElementById("menuBtn");
  const close = document.getElementById("menuClose");

  function openMenu() {
    overlay.classList.add("open");
    overlay.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }
  function closeMenu() {
    overlay.classList.remove("open");
    overlay.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  btn?.addEventListener("click", openMenu);
  close?.addEventListener("click", closeMenu);

  overlay?.addEventListener("click", (e) => {
    if (e.target === overlay) closeMenu();
  });

  overlay?.querySelectorAll("[data-close]").forEach(a => {
    a.addEventListener("click", () => closeMenu());
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMenu();
  });
}

function initMobileMenu() {
  const overlay = document.getElementById("menuOverlay");
  const btn = document.getElementById("menuBtn");
  const close = document.getElementById("menuClose");

  if (!overlay || !btn || !close) return;

  const lockScroll = () => { document.documentElement.style.overflow = "hidden"; };
  const unlockScroll = () => { document.documentElement.style.overflow = ""; };

  const openMenu = () => {
    overlay.classList.add("open");
    overlay.setAttribute("aria-hidden", "false");
    lockScroll();
  };

  const closeMenu = () => {
    overlay.classList.remove("open");
    overlay.setAttribute("aria-hidden", "true");
    unlockScroll();
  };

  btn.addEventListener("click", openMenu);
  close.addEventListener("click", closeMenu);

  // fon bosilsa yopiladi (sheetning o‘zi emas)
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeMenu();
  });

  overlay.querySelectorAll("[data-close]").forEach(a => {
    a.addEventListener("click", () => closeMenu());
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlay.classList.contains("open")) closeMenu();
  });

  // Mobile theme toggle -> desktop toggle
  const mobileToggle = document.getElementById("themeToggleMobile");
  mobileToggle?.addEventListener("click", () => {
    document.getElementById("themeToggle")?.click();
  });
}

initTheme();
initMobileMenu();
initMobileMenu();
