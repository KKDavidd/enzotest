import { initMenu } from "./menu.js";
import { initInfo } from "./info.js";

function initMobileNav() {
  const toggle = document.getElementById("nav-toggle");
  const nav = document.querySelector(".main-nav");
  if (!toggle || !nav) return;

  toggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    toggle.classList.toggle("is-open", isOpen);
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  nav.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      nav.classList.remove("is-open");
      toggle.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });
}

function initHeaderScrollState() {
  const header = document.getElementById("site-header");
  if (!header) return;
  const onScroll = () => {
    header.style.boxShadow = window.scrollY > 8 ? "0 8px 24px rgba(0,0,0,0.25)" : "none";
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

function setFooterYear() {
  const node = document.getElementById("footer-year");
  if (node) node.textContent = String(new Date().getFullYear());
}

function setFooterOptoutLink() {
  const link = document.getElementById("footer-optout");
  if (!link) return;

  const today = new Date().toLocaleDateString("hu-HU"); // pl. 2026. 07. 02.
  const subject = "Értékelés eltávolítás";
  const body = `${today}\nAz Ön neve: \nAz Ön értékelésének szövege: `;

  // Fontos: mailto linkeknél kézzel kell percent-encode-olni (encodeURIComponent),
  // mert az URLSearchParams "+"-t tenne a szóközök helyére, amit több
  // levelezőkliens (pl. Outlook) szó szerinti "+" jelként jelenít meg.
  link.href = `mailto:ertekeles@enzopizza.hu?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function init() {
  initMobileNav();
  initHeaderScrollState();
  setFooterYear();
  setFooterOptoutLink();
  initMenu();
  initInfo();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
