import { rtdb } from "./orders-firebase-config.js";
import {
  ref, onValue, push, set, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const HUF = new Intl.NumberFormat("hu-HU");
const formatPrice = (n) => `${HUF.format(n)} Ft`;

function el(tag, className, html) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (html !== undefined) node.innerHTML = html;
  return node;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

// Realtime Database-ben az objektumokat kulcs->érték formában kapjuk
// vissza (nem tömbként, mint a Firestore snapshot.docs). Ez a segédfüggvény
// { id1: {...}, id2: {...} } alakból [{id: id1, ...}, {id: id2, ...}] tömböt csinál,
// és "order" mező szerint rendez, ha van ilyen mező.
function objToSortedArray(obj) {
  if (!obj) return [];
  return Object.entries(obj)
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

const state = {
  categories: [],
  products: [],
  cart: {}, // productId -> { product, qty }
  fulfillment: "pickup", // pickup | delivery
  payment: "cash" // cash | card
};

function cartTotal() {
  return Object.values(state.cart).reduce((sum, { product, qty }) => sum + product.price * qty, 0);
}

function cartCount() {
  return Object.values(state.cart).reduce((sum, { qty }) => sum + qty, 0);
}

function addToCart(product) {
  const existing = state.cart[product.id];
  state.cart[product.id] = { product, qty: (existing?.qty ?? 0) + 1 };
  renderCart();
}

function changeQty(productId, delta) {
  const entry = state.cart[productId];
  if (!entry) return;
  entry.qty += delta;
  if (entry.qty <= 0) delete state.cart[productId];
  renderCart();
}

function renderMenu() {
  const wrap = document.getElementById("order-menu");
  const loading = document.getElementById("order-menu-loading");
  const empty = document.getElementById("order-menu-empty");
  if (!wrap) return;

  if (!state.categories.length || !state.products.length) return;

  wrap.innerHTML = "";
  loading.hidden = true;
  empty.hidden = true;
  wrap.hidden = false;

  const byCategory = {};
  state.products.forEach(p => {
    if (p.active === false) return;
    (byCategory[p.categoryId] ||= []).push(p);
  });

  const hasAny = state.categories.some(c => (byCategory[c.id] || []).length);
  if (!hasAny) {
    wrap.hidden = true;
    empty.hidden = false;
    return;
  }

  state.categories.forEach(cat => {
    const items = byCategory[cat.id] || [];
    if (!items.length) return;

    const section = el("div", "order-menu-group");
    section.appendChild(el("h3", "order-menu-group-title", escapeHtml(cat.name)));

    const grid = el("div", "order-menu-grid");
    items.forEach(product => {
      const card = el("div", "order-menu-card" + (product.outOfStock ? " is-out" : ""));
      card.innerHTML = `
        <div class="order-menu-card-head">
          <p class="order-menu-card-name">${escapeHtml(product.name)}</p>
          <p class="order-menu-card-price">${formatPrice(product.price)}</p>
        </div>
        ${product.description ? `<p class="order-menu-card-desc">${escapeHtml(product.description)}</p>` : ""}
      `;
      const addBtn = el("button", "btn btn-primary order-add-btn", product.outOfStock ? "Elfogyott" : "+ Kosárba");
      addBtn.type = "button";
      addBtn.disabled = !!product.outOfStock;
      addBtn.addEventListener("click", () => addToCart(product));
      card.appendChild(addBtn);
      grid.appendChild(card);
    });

    section.appendChild(grid);
    wrap.appendChild(section);
  });
}

function renderCart() {
  const cartList = document.getElementById("cart-list");
  const cartEmpty = document.getElementById("cart-empty");
  const cartTotalNode = document.getElementById("cart-total-value");
  const cartCountNode = document.getElementById("cart-count-badge");
  const submitBtn = document.getElementById("order-submit-btn");
  if (!cartList) return;

  const entries = Object.values(state.cart);
  cartCountNode.textContent = String(cartCount());
  cartCountNode.hidden = cartCount() === 0;

  if (!entries.length) {
    cartList.innerHTML = "";
    cartEmpty.hidden = false;
    cartTotalNode.textContent = formatPrice(0);
    submitBtn.disabled = true;
    return;
  }

  cartEmpty.hidden = true;
  submitBtn.disabled = false;
  cartList.innerHTML = "";

  entries.forEach(({ product, qty }) => {
    const row = el("div", "cart-row");
    row.innerHTML = `
      <div class="cart-row-info">
        <p class="cart-row-name">${escapeHtml(product.name)}</p>
        <p class="cart-row-price">${formatPrice(product.price)} / db</p>
      </div>
      <div class="cart-row-qty">
        <button type="button" class="qty-btn" data-action="dec" aria-label="Kevesebb">–</button>
        <span class="qty-value">${qty}</span>
        <button type="button" class="qty-btn" data-action="inc" aria-label="Több">+</button>
      </div>
      <p class="cart-row-subtotal">${formatPrice(product.price * qty)}</p>
    `;
    row.querySelector('[data-action="dec"]').addEventListener("click", () => changeQty(product.id, -1));
    row.querySelector('[data-action="inc"]').addEventListener("click", () => changeQty(product.id, 1));
    cartList.appendChild(row);
  });

  cartTotalNode.textContent = formatPrice(cartTotal());
}

function renderFulfillmentUI() {
  const deliveryFields = document.getElementById("delivery-fields");
  if (deliveryFields) deliveryFields.hidden = state.fulfillment !== "delivery";
}

function initFulfillmentToggle() {
  document.querySelectorAll('input[name="fulfillment"]').forEach(input => {
    input.addEventListener("change", () => {
      state.fulfillment = input.value;
      renderFulfillmentUI();
    });
  });
}

function initPaymentToggle() {
  document.querySelectorAll('input[name="payment"]').forEach(input => {
    input.addEventListener("change", () => { state.payment = input.value; });
  });
}

function showFormStatus(message, type) {
  const node = document.getElementById("order-form-status");
  if (!node) return;
  node.textContent = message;
  node.className = `order-form-status ${type || ""}`;
}

async function submitOrder(e) {
  e.preventDefault();
  const submitBtn = document.getElementById("order-submit-btn");
  const entries = Object.values(state.cart);
  if (!entries.length) return;

  const name = document.getElementById("customer-name").value.trim();
  const phone = document.getElementById("customer-phone").value.trim();
  const address = document.getElementById("customer-address")?.value.trim() ?? "";
  const note = document.getElementById("customer-note").value.trim();

  if (!name || !phone) {
    showFormStatus("Kérjük, add meg a neved és a telefonszámod.", "error");
    return;
  }
  if (state.fulfillment === "delivery" && !address) {
    showFormStatus("Házhozszállításhoz add meg a szállítási címet.", "error");
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "Küldés…";
  showFormStatus("", "");

  try {
    const newOrderRef = push(ref(rtdb, "orders"));
    await set(newOrderRef, {
      items: entries.map(({ product, qty }) => ({
        productId: product.id,
        name: product.name,
        price: product.price,
        qty
      })),
      total: cartTotal(),
      fulfillment: state.fulfillment,
      payment: state.payment,
      customer: { name, phone, address: state.fulfillment === "delivery" ? address : "" },
      note,
      status: "new",
      createdAt: serverTimestamp()
    });

    state.cart = {};
    renderCart();
    document.getElementById("order-form").reset();
    renderFulfillmentUI();
    document.getElementById("order-success").hidden = false;
    document.getElementById("order-form-wrap").hidden = true;
  } catch (err) {
    console.error("Rendelés leadási hiba:", err);
    showFormStatus("Hiba történt a rendelés elküldésekor. Kérjük, próbáld újra, vagy hívj minket telefonon.", "error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Rendelés leadása";
  }
}

export function initOrderPage() {
  const loading = document.getElementById("order-menu-loading");

  onValue(ref(rtdb, "order_menu/categories"), snap => {
    state.categories = objToSortedArray(snap.val());
    renderMenu();
  }, err => {
    console.error("Menü (rendelés) betöltési hiba:", err);
    loading.hidden = true;
    document.getElementById("order-menu-empty").hidden = false;
  });

  onValue(ref(rtdb, "order_menu/products"), snap => {
    state.products = objToSortedArray(snap.val());
    renderMenu();
  });

  initFulfillmentToggle();
  initPaymentToggle();
  renderFulfillmentUI();
  renderCart();

  document.getElementById("order-form").addEventListener("submit", submitOrder);
}
