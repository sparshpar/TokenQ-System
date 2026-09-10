const state = {
  menu: [],
  cart: {},
  activeCategory: "All",
  search: "",
  view: "menu",
  profile: null,
  tokenPacks: [],
  walletTokens: 100,
  paymentMethod: "tokens_only",
  order: null,
  selectedItem: null,
  detailQuantity: 1,
};

const root = document.getElementById("app");
const categoryIcons = { All: "✦", Beverages: "🍹", Snacks: "🥪", "South Indian": "🥞", "Chinese (Veg)": "🥡", "Chinese (Non-Veg)": "🍗", "Chicken Items": "🍗", Paneer: "🧀", Lunch: "🍱", "Egg Items": "🍳", Frankie: "🌯", "Other Items": "🍽️", Shwarma: "🥙", Pizza: "🍕", Burger: "🍔", "Chaat Items": "🥗", Juices: "🧃", "Milk Shakes": "🥤" };
let countdownInterval = null;

const money = (value) => `₹${value}`;
const categories = () => ["All", ...new Set(state.menu.map((item) => item.category))];
const cartCount = () => Object.values(state.cart).reduce((sum, quantity) => sum + quantity, 0);
const findItem = (id) => state.menu.find((item) => item.id == id);
const cartTotal = () => Object.entries(state.cart).reduce((sum, [id, quantity]) => sum + (findItem(id)?.price || 0) * quantity, 0);
const cartPrepTime = () => Object.entries(state.cart).reduce((sum, [id, quantity]) => sum + (findItem(id)?.prep_minutes || 0) * quantity, 0);
const cartTokenCost = () => Object.entries(state.cart).reduce((sum, [id, quantity]) => sum + (findItem(id)?.token_cost || 0) * quantity, 0);
const filteredItems = () => state.menu.filter((item) => (state.activeCategory === "All" || item.category === state.activeCategory) && `${item.name} ${item.category}`.toLowerCase().includes(state.search.toLowerCase()));

function showToast(message) {
  const toast = document.getElementById("toast");
  const messageElement = document.getElementById("toast-message");
  if (!toast || !messageElement) return;
  messageElement.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 3000);
}

function setQuantity(id, delta) {
  const next = (state.cart[id] || 0) + delta;
  if (next <= 0) delete state.cart[id]; else state.cart[id] = next;
  render();
}

function renderMenu() {
  const items = filteredItems();
  const count = cartCount();
  const tokens = cartTokenCost();
  const enoughTokens = state.walletTokens >= tokens;
  root.innerHTML = `
    <header class="topbar">
      <div><div class="greeting">Good afternoon, student</div><div class="brand">TokenQ</div><div class="tagline">Campus food, ready when you are.</div></div>
      <div class="topbar-actions"><button class="wallet-button" data-store="true" type="button">🪙 ${state.walletTokens} tokens</button><button class="icon-btn" type="button" aria-label="Notifications">♧<span class="badge-dot">2</span></button><button class="icon-btn" type="button" aria-label="Profile" data-profile="true">◯</button></div>
    </header>
    <label class="search"><span>⌕</span><input id="search-input" value="${state.search}" placeholder="Search the menu..." aria-label="Search the menu"></label>
    <section class="hero"><div class="hero-title">Good food.<br><em>Zero</em> waiting.</div><div class="hero-sub">Pre-order lunch and pick it up between classes.</div><button class="hero-cta" type="button" data-scroll="menu-title">Order now →</button><div class="hero-dots"><span class="active"></span><span></span><span></span></div></section>
    <div class="cats" role="tablist">${categories().map((category) => `<button class="cat-item ${category === state.activeCategory ? "active" : ""}" data-category="${category}" type="button"><span class="cat-circle">${categoryIcons[category] || "🍽️"}</span><span class="cat-label">${category}</span></button>`).join("")}</div>
    <section class="section-head" id="menu-title"><div><div class="section-kicker">Fresh from the counter</div><h2>Full Menu</h2></div><span>${items.length} dishes</span></section>
    <section class="menu-grid">${items.map((item) => `<article class="item-card" data-item-id="${item.id}" tabindex="0" role="button" aria-label="View details for ${item.name}"><img class="item-thumb" src="${item.img}" alt="${item.name}" loading="lazy"><div class="item-name">${item.name}</div><div class="item-meta"><span>⏱ ${item.prep_minutes} min / item</span><span>🪙 ${item.token_cost}</span></div><div class="item-footer"><span class="price">${money(item.price)}</span><div class="qty-controls"><button class="qty-btn" data-sub="${item.id}" type="button">−</button><span>${state.cart[item.id] || 0}</span><button class="qty-btn" data-add="${item.id}" type="button">+</button></div></div></article>`).join("")}</section>
    ${renderCheckout(count, tokens, enoughTokens)}
    <nav class="bottom-nav"><button class="nav-item active" data-scroll="top" type="button"><span class="nav-icon">⌂</span><span>Home</span></button><button class="nav-item" data-scroll="menu-title" type="button"><span class="nav-icon">▦</span><span>Menu</span></button><button class="nav-item center" data-scroll="checkout" type="button"><span class="nav-icon">♢</span><span>Order</span></button><button class="nav-item" data-profile="true" type="button"><span class="nav-icon">◯</span><span>Profile</span></button></nav>
    <div class="modal-overlay" id="item-details-modal" aria-hidden="true"><div class="modal-sheet" role="dialog" aria-modal="true" aria-labelledby="modal-item-title"><div class="modal-handle"></div><button class="close-modal" id="close-item-modal" type="button" aria-label="Close details">×</button><div id="item-details-content"></div></div></div>`;
  bindMenuEvents();
}

function renderCheckout(count, tokens, enoughTokens) {
  if (!count) return "";
  const rows = Object.entries(state.cart).map(([id, quantity]) => { const item = findItem(id); return `<div class="checkout-line"><div><strong>${item.name}</strong><span>${quantity} × ${money(item.price)} · ${quantity} × ${item.prep_minutes} min</span></div><b>${money(item.price * quantity)}</b></div>`; }).join("");
  return `<section class="checkout-panel" id="checkout"><div class="checkout-heading"><div><div class="section-kicker">Items added to your order</div><h2>Checkout</h2></div><span>${count} items</span></div><div class="checkout-list">${rows}</div><div class="checkout-total"><span>Food total</span><b>${money(cartTotal())}</b><span>Preparation</span><b>${cartPrepTime()} min</b><span>Tokens required</span><b>🪙 ${tokens}</b><span>Available</span><b>🪙 ${state.walletTokens}</b></div><p class="deposit-note">Prep-Pay tokens are a confirmation deposit, not a discount. Pay the full food total at pickup.</p><div class="payment-options"><label class="payment-option ${state.paymentMethod === "tokens_only" ? "selected" : ""}"><input type="radio" name="payment" value="tokens_only" ${state.paymentMethod === "tokens_only" ? "checked" : ""}> 🪙 Use token balance</label><label class="payment-option ${state.paymentMethod === "cash_at_counter" ? "selected" : ""}"><input type="radio" name="payment" value="cash_at_counter" ${state.paymentMethod === "cash_at_counter" ? "checked" : ""}> 💵 Pay cash at counter</label></div>${enoughTokens ? "" : `<p class="cart-warning">Not enough tokens — top up to place this order</p>`}<button class="place-btn checkout-place" id="place-order" type="button" ${enoughTokens ? "" : "disabled"}>Place order · ${money(cartTotal())} · 🪙 ${tokens}</button></section>`;
}

function bindMenuEvents() {
  root.querySelectorAll("[data-item-id]").forEach((card) => {
    const open = () => openItemDetails(Number(card.dataset.itemId));
    card.addEventListener("click", (event) => {
      if (!event.target.closest("button")) open();
    });
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") { event.preventDefault(); open(); }
    });
  });
  root.querySelectorAll("[data-add]").forEach((button) => button.addEventListener("click", () => setQuantity(Number(button.dataset.add), 1)));
  root.querySelectorAll("[data-sub]").forEach((button) => button.addEventListener("click", () => setQuantity(Number(button.dataset.sub), -1)));
  root.querySelectorAll("[data-category]").forEach((button) => button.addEventListener("click", () => { state.activeCategory = button.dataset.category; render(); }));
  root.querySelectorAll("[data-scroll]").forEach((button) => button.addEventListener("click", () => { const target = button.dataset.scroll === "top" ? root : document.getElementById(button.dataset.scroll); target?.scrollIntoView({ behavior: "smooth" }); }));
  root.querySelectorAll("[data-profile]").forEach((button) => button.addEventListener("click", openProfile));
  root.querySelectorAll("[data-store]").forEach((button) => button.addEventListener("click", openStore));
  document.getElementById("place-order")?.addEventListener("click", placeOrder);
  document.querySelectorAll('input[name="payment"]').forEach((input) => input.addEventListener("change", (event) => { state.paymentMethod = event.target.value; render(); document.getElementById("checkout")?.scrollIntoView({ behavior: "smooth" }); }));
  document.getElementById("search-input")?.addEventListener("input", (event) => { state.search = event.target.value; render(); const input = document.getElementById("search-input"); input.focus(); input.setSelectionRange(input.value.length, input.value.length); });
  document.getElementById("close-item-modal")?.addEventListener("click", closeItemDetails);
  document.getElementById("item-details-modal")?.addEventListener("click", (event) => { if (event.target.id === "item-details-modal") closeItemDetails(); });
}

function openItemDetails(id) {
  state.selectedItem = findItem(id);
  state.detailQuantity = 1;
  renderItemDetails();
  document.getElementById("item-details-modal")?.classList.add("open");
}

function closeItemDetails() {
  document.getElementById("item-details-modal")?.classList.remove("open");
  state.selectedItem = null;
}

function renderItemDetails() {
  const item = state.selectedItem;
  if (!item) return;
  const quantity = state.detailQuantity;
  document.getElementById("item-details-content").innerHTML = `<h2 class="modal-title" id="modal-item-title">${item.name}</h2><img class="modal-img" src="${item.img}" alt="${item.name}"><div class="modal-price">${money(item.price)}</div><p class="modal-desc">${item.category}</p><div class="modal-section-label">Preparation time</div><div class="modal-prep">⏱ ${item.prep_minutes * quantity} minutes <small>(${item.prep_minutes} min / item)</small></div><div class="modal-section-label">Token cost</div><div class="modal-prep">🪙 ${item.token_cost * quantity} tokens</div><div class="modal-section-label">Quantity</div><div class="modal-quantity"><button class="qty-btn" id="detail-minus" type="button">−</button><strong>${quantity}</strong><button class="qty-btn" id="detail-plus" type="button">+</button></div><button class="modal-add-btn" id="detail-order-now" type="button">ORDER NOW · ${money(item.price * quantity)}</button>`;
  document.getElementById("detail-minus").addEventListener("click", () => { state.detailQuantity = Math.max(1, state.detailQuantity - 1); renderItemDetails(); });
  document.getElementById("detail-plus").addEventListener("click", () => { state.detailQuantity += 1; renderItemDetails(); });
  document.getElementById("detail-order-now").addEventListener("click", orderSelectedItem);
}

async function orderSelectedItem() {
  const item = state.selectedItem;
  if (!item) return;
  const response = await fetch("/api/order", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items: [{ id: item.id, quantity: state.detailQuantity }], payment_method: state.paymentMethod }) });
  const data = await response.json();
  if (!response.ok) { showToast(data.error || "Unable to place order"); return; }
  state.order = data.order;
  state.walletTokens = data.wallet_tokens;
  state.view = "track";
  closeItemDetails();
  render();
  showToast(`Order ${state.order.token} confirmed`);
  startCountdown();
}

async function placeOrder() {
  if (!cartCount()) return;
  const response = await fetch("/api/place-order", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ cart: state.cart, payment_method: state.paymentMethod }) });
  const data = await response.json();
  if (!response.ok) { showToast(data.error || "Unable to place order"); return; }
  state.order = data.order;
  state.order.seconds_left = data.order.prep_minutes * 60;
  state.walletTokens = data.wallet_tokens;
  state.cart = {};
  state.view = "track";
  render();
  showToast(`Order placed! Ready in ${state.order.prep_minutes} minutes`);
  startCountdown();
}

function startCountdown() {
  clearInterval(countdownInterval);
  countdownInterval = setInterval(() => {
    if (!state.order || state.view !== "track") return clearInterval(countdownInterval);
    state.order.seconds_left = Math.max(0, state.order.seconds_left - 1);
    if (state.order.seconds_left === 0) { state.order.status = "ready"; clearInterval(countdownInterval); }
    else if (state.order.seconds_left === state.order.prep_minutes * 60 - 3) state.order.status = "preparing";
    updateTrackingDom();
  }, 1000);
}

function updateTrackingDom() {
  if (!state.order) return;
  const timer = document.getElementById("countdown-timer");
  const label = document.getElementById("status-label");
  const pill = document.getElementById("status-pill");
  const seconds = state.order.seconds_left;
  if (timer) timer.textContent = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  if (label) label.textContent = state.order.status === "ready" ? "Ready for pickup!" : state.order.status === "preparing" ? `Preparing your food — ready in ${Math.ceil(seconds / 60)} mins` : `Order received — pickup in ${Math.ceil(seconds / 60)} mins`;
  if (pill) { pill.className = `status-pill ${state.order.status}`; pill.textContent = state.order.status === "queued" ? "Order Queued" : state.order.status === "preparing" ? "Preparing" : "Ready for pickup"; }
}

function renderTracking() {
  const order = state.order;
  root.innerHTML = `<section class="track"><div class="track-top"><button class="back-link" id="back-to-menu" type="button">← Back to menu</button><button class="wallet-button" data-profile="true" type="button">🪙 ${state.walletTokens} tokens</button></div><div class="tagline">Your order is in the queue</div><h2>ORDER PLACED ✓</h2><div class="token-label">YOUR TOKEN NUMBER</div><div class="token">${order.token}</div><div class="status-pill ${order.status}" id="status-pill">Order Queued</div><div class="countdown" id="countdown-timer">00:00</div><div class="countdown-label" id="status-label"></div><p class="payment-confirmation">${order.payment_method === "cash_at_counter" ? `💵 Pay ${money(order.total_price)} cash at counter` : "🪙 Food bill payment: token balance selected"}</p><div class="tracking-summary"><strong>Estimated preparation time</strong><span>${order.prep_minutes} minutes</span><strong>Food total</strong><span>${money(order.total_price)}</span><strong>Tokens deducted</strong><span>🪙 ${order.tokensSpent}</span><strong>Tokens remaining</strong><span>🪙 ${state.walletTokens}</span></div><div class="track-items"><strong class="track-items-title">Items in this order</strong>${order.items.map((item) => `<div><span>${item.name}<br><small>${item.qty} × ${item.prep_minutes} min = ${item.line_prep_minutes} min</small></span><b>${money(item.line_total)}</b></div>`).join("")}<div class="tracking-total"><span>Total preparation</span><b>${order.prep_minutes} min</b></div></div></section>`;
  document.getElementById("back-to-menu").addEventListener("click", () => { clearInterval(countdownInterval); state.order = null; state.view = "menu"; render(); });
  document.querySelectorAll("[data-profile]").forEach((button) => button.addEventListener("click", openProfile));
  updateTrackingDom();
}

async function openProfile() {
  const response = await fetch("/api/profile");
  state.profile = await response.json();
  state.walletTokens = state.profile.wallet_tokens;
  state.view = "profile";
  render();
}

async function openStore() {
  const response = await fetch("/api/token-packs");
  const data = await response.json();
  state.tokenPacks = data.packs;
  state.walletTokens = data.wallet_tokens;
  state.view = "store";
  render();
}

function renderProfile() {
  const profile = state.profile;
  root.innerHTML = `<section class="profile-view"><button class="back-link" data-back-menu type="button">← Back to menu</button><div class="profile-avatar">${profile.name.slice(0, 1)}</div><div class="section-kicker">Student Profile</div><h2>${profile.name}</h2><div class="profile-details"><span>College</span><b>${profile.college}</b><span>Roll Number</span><b>${profile.roll_number}</b><span>Department</span><b>${profile.department}</b><span>Year</span><b>${profile.year}</b><span>Email</span><b>${profile.email}</b></div><div class="wallet-card"><div><span>Token Wallet</span><strong>🪙 ${state.walletTokens} Tokens</strong></div><button class="place-btn" data-store="true" type="button">Buy Tokens</button></div></section>`;
  bindSecondaryEvents();
}

function renderStore() {
  root.innerHTML = `<section class="store-view"><button class="back-link" data-back-menu type="button">← Back to menu</button><div class="section-kicker">Prep-pay wallet</div><h2>Buy Tokens</h2><p class="store-copy">Demo purchase only. No real payment is processed.</p><div class="store-balance">Current Balance <strong>🪙 ${state.walletTokens}</strong></div><div class="token-pack-list">${state.tokenPacks.map((pack) => `<article class="token-pack"><span>🪙</span><div><strong>${pack.tokens} Tokens</strong><small>₹${pack.price}</small></div><button class="place-btn" data-buy-pack="${pack.id}" type="button">Buy</button></article>`).join("")}</div></section>`;
  bindSecondaryEvents();
  root.querySelectorAll("[data-buy-pack]").forEach((button) => button.addEventListener("click", () => buyTokens(button.dataset.buyPack)));
}

function bindSecondaryEvents() { root.querySelectorAll("[data-back-menu]").forEach((button) => button.addEventListener("click", () => { state.view = "menu"; render(); })); root.querySelectorAll("[data-store]").forEach((button) => button.addEventListener("click", openStore)); }

async function buyTokens(packId) { const response = await fetch("/api/buy-tokens", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pack_id: packId }) }); const data = await response.json(); if (!response.ok) return showToast(data.error); state.walletTokens = data.wallet_tokens; showToast(data.message); renderStore(); }

function render() { if (state.view === "track") renderTracking(); else if (state.view === "profile") renderProfile(); else if (state.view === "store") renderStore(); else renderMenu(); }

async function init() { const response = await fetch("/api/menu"); const data = await response.json(); state.menu = data.items || []; const wallet = await fetch("/api/wallet"); state.walletTokens = (await wallet.json()).wallet_tokens; render(); }
init();
