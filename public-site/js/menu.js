import { db } from "./firebase-config.js";
import {
  collection,
  query,
  orderBy,
  doc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"

const DEFAULT_ALLERGENS = {
  1: "Glutén", 2: "Rákfélék", 3: "Tojás", 4: "Hal", 5: "Földimogyoró",
  6: "Szójabab", 7: "Tej", 8: "Diófélék", 9: "Zeller", 10: "Mustár",
  11: "Szezámmag", 12: "Kéndioxid", 13: "Csillagfürt", 14: "Puhatestűek", 15: "Méz"
};

const HUF = new Intl.NumberFormat("hu-HU");

function formatPrice(price, suffix) {
  if (typeof price !== "number") return "";
  return `${HUF.format(price)} Ft${suffix ? ` ${suffix}` : ""}`;
}

function el(tag, className, html) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (html !== undefined) node.innerHTML = html;
  return node;
}

function renderAllergenLegend(allergenMap) {
  const listNode = document.getElementById("allergen-list");
  if (!listNode) return;
  listNode.innerHTML = "";
  Object.entries(allergenMap)
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .forEach(([code, label]) => {
      const li = el("li", null, `${code}. ${label}`);
      listNode.appendChild(li);
    });
}

function renderMenuItem(product) {
  const allergensLabel = (product.allergens || []).length
    ? `(${product.allergens.join(",")})`
    : "";

  const card = el("article", "menu-item" + (product.outOfStock ? " menu-item-out" : ""));
  card.innerHTML = `
    ${product.outOfStock ? `<span class="out-of-stock-stamp">Elfogyott</span>` : ""}
    <div class="menu-item-head">
      <p class="menu-item-name">${escapeHtml(product.name || "")}
        ${allergensLabel ? `<span class="menu-item-allergens">${allergensLabel}</span>` : ""}
      </p>
      <p class="menu-item-price">${formatPrice(product.price, product.priceSuffix)}</p>
    </div>
    ${product.description ? `<p class="menu-item-desc">${escapeHtml(product.description)}</p>` : ""}
    ${(product.tags && product.tags.length) ? `
      <div class="menu-item-tags">
        ${product.tags.map(t => `<span class="menu-item-tag">${escapeHtml(t)}</span>`).join("")}
      </div>` : ""}
  `;
  return card;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function slugify(str) {
  return String(str)
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function buildMenuDOM(categories, productsByCategory, isFirstRender) {
  const tabsNode = document.getElementById("menu-tabs");
  const contentNode = document.getElementById("menu-content");

  
  const previouslySelectedTab = tabsNode.querySelector('.tab-btn[aria-selected="true"]');
  const previousSelectedId = previouslySelectedTab ? previouslySelectedTab.id : null;

  tabsNode.innerHTML = "";
  contentNode.innerHTML = "";

  let restoredSelection = false;

  categories.forEach((cat, idx) => {
    const items = productsByCategory[cat.id] || [];
    if (!items.length) return;

    const tabId = `tab-${slugify(cat.name)}`;
    const panelId = `panel-${slugify(cat.name)}`;
    const shouldSelect = previousSelectedId ? tabId === previousSelectedId : idx === 0;
    if (shouldSelect) restoredSelection = true;

    
    const tabBtn = el("button", "tab-btn", cat.name);
    tabBtn.id = tabId;
    tabBtn.type = "button";
    tabBtn.setAttribute("role", "tab");
    tabBtn.setAttribute("aria-controls", panelId);
    tabBtn.setAttribute("aria-selected", shouldSelect ? "true" : "false");
    tabBtn.addEventListener("click", () => {
      document.getElementById(panelId)?.scrollIntoView({ behavior: "smooth", block: "start" });
      tabsNode.querySelectorAll(".tab-btn").forEach(b => b.setAttribute("aria-selected", "false"));
      tabBtn.setAttribute("aria-selected", "true");
    });
    tabsNode.appendChild(tabBtn);

    
    const group = el("div", isFirstRender ? "menu-group" : "menu-group menu-group-static");
    group.id = panelId;
    group.setAttribute("role", "tabpanel");
    group.setAttribute("aria-labelledby", tabId);
    if (isFirstRender) group.style.animationDelay = `${Math.min(idx * 0.05, 0.3)}s`;

    const titleHtml = cat.note
      ? `${escapeHtml(cat.name)} <small style="font-family:var(--font-mono);font-size:0.7rem;color:var(--color-cream-dim);text-transform:none;">${escapeHtml(cat.note)}</small>`
      : escapeHtml(cat.name);
    group.appendChild(el("h3", "menu-group-title", titleHtml));

    const grid = el("div", "menu-grid");
    items.forEach(p => grid.appendChild(renderMenuItem(p)));
    group.appendChild(grid);

    contentNode.appendChild(group);
  });

  
  if (!restoredSelection) {
    const firstTab = tabsNode.querySelector(".tab-btn");
    if (firstTab) firstTab.setAttribute("aria-selected", "true");
  }
}

export function initMenu() {
  const loadingNode = document.getElementById("menu-loading");
  const contentNode = document.getElementById("menu-content");
  const emptyNode = document.getElementById("menu-empty");

  const state = {
    categories: null,
    products: null,
    allergenMap: DEFAULT_ALLERGENS
  };
  let hasRenderedOnce = false;

  function render() {
    if (!state.categories || !state.products) return;

    const productsByCategory = {};
    state.products.forEach(p => {
      if (!p.categoryId) return;
      (productsByCategory[p.categoryId] ||= []).push(p);
    });

    const hasAnyItems = state.categories.some(c => (productsByCategory[c.id] || []).length > 0);

    if (!hasAnyItems) {
      loadingNode.hidden = true;
      contentNode.hidden = true;
      emptyNode.hidden = false;
      return;
    }

    buildMenuDOM(state.categories, productsByCategory, !hasRenderedOnce);
    hasRenderedOnce = true;
    renderAllergenLegend(state.allergenMap);

    loadingNode.hidden = true;
    emptyNode.hidden = true;
    contentNode.hidden = false;
  }

  function handleError(err) {
    console.error("Menü betöltési hiba:", err);
    loadingNode.hidden = true;
    if (contentNode) contentNode.hidden = true;
    emptyNode.hidden = false;
  }

  
  const categoriesQuery = query(collection(db, "categories"), orderBy("order", "asc"));
  onSnapshot(categoriesQuery, snap => {
    state.categories = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    render();
  }, handleError);

  
  const productsQuery = query(collection(db, "products"), orderBy("order", "asc"));
  onSnapshot(productsQuery, snap => {
    state.products = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(p => p.active !== false);
    render();
  }, handleError);

  
  onSnapshot(doc(db, "settings", "allergens"), snap => {
    state.allergenMap = (snap.exists() && snap.data().list)
      ? { ...DEFAULT_ALLERGENS, ...snap.data().list }
      : DEFAULT_ALLERGENS;
    render();
  }, err => {
    console.warn("Allergén lista figyelése sikertelen, alapértelmezett lista használata.", err);
  });
}
