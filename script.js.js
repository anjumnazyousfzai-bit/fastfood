/* ==========================================================
   Crunch Station - script.js
   Menu rendering, category filter, order cart, checkout
   ========================================================== */

(function () {
  "use strict";

  /* ---------- Settings (change these to fit your shop) ---------- */
  const CURRENCY = "$";
  const TAX_RATE = 0.08;
  const STORAGE_KEY = "crunch-station-order";

  /* ---------- Menu data ---------- */
  const MENU = [
    { id: "b1", category: "Burgers", emoji: "🍔", name: "Classic Smash", price: 5.99, desc: "Smashed beef patty, cheddar, pickles, onion and house sauce." },
    { id: "b2", category: "Burgers", emoji: "🍔", name: "Double Smash Burger", price: 7.99, desc: "Two patties, double cheese, crispy onions and smoky sauce." },
    { id: "b3", category: "Burgers", emoji: "🌶️", name: "Fire Burger", price: 7.49, desc: "Pepper jack, jalapeños and a spicy mayo kick." },
    { id: "b4", category: "Burgers", emoji: "🥬", name: "Garden Burger", price: 6.99, desc: "Crispy veggie patty, lettuce, tomato and avocado spread." },

    { id: "c1", category: "Chicken", emoji: "🍗", name: "Crunch Chicken Sandwich", price: 6.99, desc: "Buttermilk fried chicken, slaw and pickles on a toasted bun." },
    { id: "c2", category: "Chicken", emoji: "🍗", name: "Chicken Tenders (5 pc)", price: 7.49, desc: "Hand-breaded tenders with your choice of dip." },
    { id: "c3", category: "Chicken", emoji: "🔥", name: "Hot Wings (8 pc)", price: 8.99, desc: "Crispy wings tossed in hot sauce, with a cool ranch dip." },

    { id: "s1", category: "Sides", emoji: "🍟", name: "Large Fries", price: 3.49, desc: "Golden, salted and always hot." },
    { id: "s2", category: "Sides", emoji: "🧅", name: "Onion Rings", price: 3.99, desc: "Thick-cut rings in a crunchy batter." },
    { id: "s3", category: "Sides", emoji: "🧀", name: "Cheese Bites", price: 4.49, desc: "Melty mozzarella bites with marinara sauce." },

    { id: "d1", category: "Drinks", emoji: "🥤", name: "Cola", price: 1.99, desc: "Ice-cold fountain drink, free refills when you dine in." },
    { id: "d2", category: "Drinks", emoji: "🍋", name: "Fresh Lemonade", price: 2.99, desc: "Squeezed fresh with a little mint." },
    { id: "d3", category: "Drinks", emoji: "🥛", name: "Vanilla Shake", price: 4.29, desc: "Thick, creamy and made with real vanilla." },
    { id: "d4", category: "Drinks", emoji: "🍫", name: "Chocolate Shake", price: 4.29, desc: "Rich chocolate topped with whipped cream." },

    { id: "t1", category: "Desserts", emoji: "🍦", name: "Soft Serve Cone", price: 2.49, desc: "Classic vanilla soft serve in a crisp cone." },
    { id: "t2", category: "Desserts", emoji: "🍪", name: "Warm Cookie", price: 2.29, desc: "Chocolate chunk cookie, baked in-house." }
  ];

  // Combo of the day (shown in the hero ticket)
  const COMBO = { id: "combo", emoji: "🍔", name: "Combo of the day", price: 9.99 };

  /* ---------- Element references ---------- */
  const $ = (sel) => document.querySelector(sel);

  const menuGrid = $("#menuGrid");
  const filtersEl = $("#filters");
  const cartEl = $("#cart");
  const overlay = $("#overlay");
  const cartToggle = $("#cartToggle");
  const cartClose = $("#cartClose");
  const cartCount = $("#cartCount");
  const cartList = $("#cartList");
  const cartEmpty = $("#cartEmpty");
  const cartTotals = $("#cartTotals");
  const cartActions = $("#cartActions");
  const subtotalEl = $("#subtotal");
  const taxEl = $("#tax");
  const totalEl = $("#total");
  const checkoutBtn = $("#checkoutBtn");
  const clearBtn = $("#clearBtn");
  const orderDone = $("#orderDone");
  const orderNumber = $("#orderNumber");
  const newOrderBtn = $("#newOrderBtn");
  const toastEl = $("#toast");

  /* ---------- State ---------- */
  let activeCategory = "All";
  let cart = loadCart(); // { itemId: quantity }
  let toastTimer = null;
  let lastFocus = null;

  /* ---------- Helpers ---------- */
  const money = (n) => CURRENCY + n.toFixed(2);

  function findItem(id) {
    if (id === COMBO.id) return COMBO;
    return MENU.find((m) => m.id === id);
  }

  function loadCart() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      // keep only items that still exist
      const clean = {};
      Object.keys(parsed).forEach((id) => {
        if (findItem(id) && Number.isInteger(parsed[id]) && parsed[id] > 0) clean[id] = parsed[id];
      });
      return clean;
    } catch (e) {
      return {};
    }
  }

  function saveCart() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
      /* storage unavailable: the order still works for this visit */
    }
  }

  function showToast(message) {
    toastEl.textContent = message;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2200);
  }

  /* ---------- Menu ---------- */
  function renderFilters() {
    const categories = ["All"].concat([...new Set(MENU.map((m) => m.category))]);
    filtersEl.innerHTML = "";
    categories.forEach((cat) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "filter-btn";
      btn.textContent = cat;
      btn.dataset.category = cat;
      btn.setAttribute("aria-pressed", String(cat === activeCategory));
      filtersEl.appendChild(btn);
    });
  }

  function renderMenu() {
    const items = activeCategory === "All" ? MENU : MENU.filter((m) => m.category === activeCategory);
    menuGrid.innerHTML = items
      .map(
        (m) => `
        <article class="item">
          <div class="item-pic" aria-hidden="true">${m.emoji}</div>
          <div class="item-body">
            <h3>${m.name}</h3>
            <p class="item-desc">${m.desc}</p>
            <div class="item-foot">
              <span class="item-price">${money(m.price)}</span>
              <button class="add-btn" type="button" data-id="${m.id}" aria-label="Add ${m.name} to order">Add</button>
            </div>
          </div>
        </article>`
      )
      .join("");
  }

  filtersEl.addEventListener("click", (e) => {
    const btn = e.target.closest(".filter-btn");
    if (!btn) return;
    activeCategory = btn.dataset.category;
    filtersEl.querySelectorAll(".filter-btn").forEach((b) => {
      b.setAttribute("aria-pressed", String(b === btn));
    });
    renderMenu();
  });

  menuGrid.addEventListener("click", (e) => {
    const btn = e.target.closest(".add-btn");
    if (!btn) return;
    addToCart(btn.dataset.id);
  });

  $("#addCombo").addEventListener("click", () => addToCart(COMBO.id));

  /* ---------- Cart ---------- */
  function addToCart(id) {
    const item = findItem(id);
    if (!item) return;
    // adding after a finished order starts a fresh one
    if (!orderDone.hidden) resetReceiptView();
    cart[id] = (cart[id] || 0) + 1;
    saveCart();
    renderCart();
    showToast(item.name + " added to your order");
    cartCount.classList.remove("bump");
    void cartCount.offsetWidth; // restart the animation
    cartCount.classList.add("bump");
  }

  function changeQty(id, delta) {
    if (!cart[id]) return;
    cart[id] += delta;
    if (cart[id] <= 0) delete cart[id];
    saveCart();
    renderCart();
  }

  function cartTotalsData() {
    const subtotal = Object.keys(cart).reduce((sum, id) => sum + findItem(id).price * cart[id], 0);
    const tax = subtotal * TAX_RATE;
    return { subtotal, tax, total: subtotal + tax };
  }

  function renderCart() {
    const ids = Object.keys(cart);
    const count = ids.reduce((n, id) => n + cart[id], 0);
    cartCount.textContent = count;

    cartEmpty.hidden = ids.length > 0;
    cartList.innerHTML = ids
      .map((id) => {
        const item = findItem(id);
        const qty = cart[id];
        return `
        <li class="cart-row">
          <span class="cart-row-name">${item.name}</span>
          <span class="cart-row-price">${money(item.price * qty)}</span>
          <span class="qty">
            <button type="button" data-action="dec" data-id="${id}" aria-label="Remove one ${item.name}">&minus;</button>
            <output aria-label="Quantity">${qty}</output>
            <button type="button" data-action="inc" data-id="${id}" aria-label="Add one ${item.name}">+</button>
          </span>
        </li>`;
      })
      .join("");

    const t = cartTotalsData();
    subtotalEl.textContent = money(t.subtotal);
    taxEl.textContent = money(t.tax);
    totalEl.textContent = money(t.total);

    checkoutBtn.disabled = ids.length === 0;
    clearBtn.hidden = ids.length === 0;
  }

  cartList.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    changeQty(btn.dataset.id, btn.dataset.action === "inc" ? 1 : -1);
  });

  clearBtn.addEventListener("click", () => {
    cart = {};
    saveCart();
    renderCart();
  });

  /* ---------- Drawer open / close ---------- */
  function openCart() {
    lastFocus = document.activeElement;
    cartEl.classList.add("open");
    cartEl.setAttribute("aria-hidden", "false");
    overlay.hidden = false;
    cartToggle.setAttribute("aria-expanded", "true");
    cartClose.focus();
  }

  function closeCart() {
    cartEl.classList.remove("open");
    cartEl.setAttribute("aria-hidden", "true");
    overlay.hidden = true;
    cartToggle.setAttribute("aria-expanded", "false");
    if (lastFocus) lastFocus.focus();
  }

  cartToggle.addEventListener("click", openCart);
  cartClose.addEventListener("click", closeCart);
  overlay.addEventListener("click", closeCart);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && cartEl.classList.contains("open")) closeCart();
  });

  /* ---------- Checkout ---------- */
  function resetReceiptView() {
    orderDone.hidden = true;
    cartList.hidden = false;
    cartTotals.hidden = false;
    cartActions.hidden = false;
    $("#cartBody").hidden = false;
  }

  checkoutBtn.addEventListener("click", () => {
    if (!Object.keys(cart).length) return;

    // Demo only: a real site would send the order to a server here.
    const number = "#" + String(Math.floor(1000 + Math.random() * 9000));
    orderNumber.textContent = number;

    cart = {};
    saveCart();
    renderCart();

    $("#cartBody").hidden = true;
    cartTotals.hidden = true;
    cartActions.hidden = true;
    orderDone.hidden = false;
  });

  newOrderBtn.addEventListener("click", () => {
    resetReceiptView();
    closeCart();
    document.getElementById("menu").scrollIntoView();
  });

  /* ---------- Contact form ---------- */
  const form = $("#contactForm");
  const formNote = $("#formNote");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const fields = [form.name, form.email, form.message];
    let valid = true;

    fields.forEach((f) => {
      const ok = f.value.trim() !== "" && (f.type !== "email" || /^\S+@\S+\.\S+$/.test(f.value.trim()));
      f.classList.toggle("invalid", !ok);
      if (!ok) valid = false;
    });

    if (!valid) {
      formNote.className = "form-note error";
      formNote.textContent = "Fill in your name, a valid email and a message.";
      return;
    }

    // Demo only: connect this to your email service or backend.
    form.reset();
    formNote.className = "form-note ok";
    formNote.textContent = "Message sent. We will reply soon.";
  });

  /* ---------- Init ---------- */
  $("#year").textContent = new Date().getFullYear();
  renderFilters();
  renderMenu();
  renderCart();
})();