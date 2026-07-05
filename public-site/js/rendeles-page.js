import { initOrderPage } from "./order.js";

function initMobileNav() {
  const toggle = document.getElementById("nav-toggle");
  const nav = document.querySelector(".main-nav");
  if (!toggle || !nav) return;
  toggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    toggle.classList.toggle("is-open", isOpen);
    toggle.setAttribute("aria-expanded", String(isOpen));
  });
}

document.getElementById("footer-year").textContent = String(new Date().getFullYear());
initMobileNav();
initOrderPage();
