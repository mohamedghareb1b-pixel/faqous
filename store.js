// js/store.js
// منطق صفحات المتجر — يُستخدم في index.html فقط

// ─── الحالة ───────────────────────────────────────────────────
const StoreState = {
  currentPage: 'home',
  currentCatId: null,
  qtyMap: {},   // uid => qty
};

// ─── التنقل ───────────────────────────────────────────────────
function navigateTo(page, catId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  StoreState.currentPage  = page;
  StoreState.currentCatId = catId || null;

  const pageEl = document.getElementById('page-' + page);
  if (pageEl) pageEl.classList.add('active');
  window.scrollTo(0, 0);

  if (page === 'home')     { clearSearch(); renderHome(); }
  if (page === 'category') { renderCategoryPage(catId); }
  if (page === 'cart')     { renderCartPage(); }
  if (page === 'checkout') {
    if (!Cart.items.length) { showToast('السلة فارغة', 'error'); return; }
    renderCheckoutSummary();
  }
}

// ─── Toast ────────────────────────────────────────────────────
function showToast(msg, type = 'default', duration = 3000) {
  const container = document.getElementById('toast-container');
  const el        = document.createElement('div');
  const icons     = { success: '✅', error: '❌', default: 'ℹ️' };
  el.className    = `toast toast-${type}`;
  el.innerHTML    = `<span>${icons[type] || ''}</span><span>${msg}</span>`;
  container.appendChild(el);
  setTimeout(() => {
    el.style.opacity   = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'all .3s';
    setTimeout(() => el.remove(), 300);
  }, duration);
}

// ─── الصفحة الرئيسية ──────────────────────────────────────────
function renderHome() {
  renderCategoryIcons();
  renderCarousels();
  Cart.updateBadge();
}

function renderCategoryIcons() {
  const grid = document.getElementById('cats-grid');
  if (!grid) return;
  grid.innerHTML = DB.categories.map(c => `
    <div class="cat-item" onclick="navigateTo('category', ${c.id})">
      <span class="cat-icon">${c.icon}</span>
      <span class="cat-name">${c.name}</span>
    </div>
  `).join('');
}

function renderCarousels() {
  const wrap = document.getElementById('carousels');
  if (!wrap) return;
  wrap.innerHTML = DB.categories.map(cat => {
    const prods = DB.products.filter(p => p.catId === cat.id && p.active);
    if (!prods.length) return '';
    return `
      <section class="carousel-section">
        <div class="carousel-header">
          <div class="carousel-title">
            <span>${cat.icon}</span>
            <span>${cat.name}</span>
          </div>
          <button class="more-btn" onclick="navigateTo('category', ${cat.id})">
            عرض المزيد ‹
          </button>
        </div>
        <div class="carousel-track scroll-hide">
          ${prods.slice(0, 8).map(p => productCardHTML(p, 'c')).join('')}
        </div>
      </section>
    `;
  }).join('');
}

// ─── بطاقة المنتج ─────────────────────────────────────────────
function productCardHTML(product, context) {
  const uid = `${product.id}_${context}`;
  if (!StoreState.qtyMap[uid]) StoreState.qtyMap[uid] = 0.25;
  const qty   = StoreState.qtyMap[uid];
  const total = (product.price * qty).toFixed(2);

  return `
    <div class="product-card">
      <div class="product-img">
        ${product.img
          ? `<img src="${product.img}" alt="${product.name}" loading="lazy">`
          : product.icon}
      </div>
      <p class="product-name">${product.name}</p>
      <p class="product-price">${product.price} جنيه / ${product.unit}</p>
      <div class="qty-row">
        <button class="qty-btn" onclick="changeQty('${uid}', ${product.id}, -1)"
          ${qty <= 0.25 ? 'disabled' : ''}>−</button>
        <span class="qty-val" id="qty-${uid}">${qty.toFixed(2)}</span>
        <button class="qty-btn" onclick="changeQty('${uid}', ${product.id}, 1)"
          ${qty >= 20 ? 'disabled' : ''}>+</button>
      </div>
      <p class="product-total" id="total-${uid}">${total} جنيه</p>
      <button class="btn btn-primary btn-sm add-btn"
        onclick="addToCartFromCard('${uid}', ${product.id})">
        🛒 إضافة للسلة
      </button>
    </div>
  `;
}

function changeQty(uid, productId, dir) {
  const STEP = 0.25;
  let qty    = StoreState.qtyMap[uid] || 0.25;
  qty        = dir > 0
    ? Math.min(20,    parseFloat((qty + STEP).toFixed(2)))
    : Math.max(0.25,  parseFloat((qty - STEP).toFixed(2)));

  StoreState.qtyMap[uid] = qty;

  const qtyEl   = document.getElementById(`qty-${uid}`);
  const totalEl = document.getElementById(`total-${uid}`);
  const p       = DB.products.find(x => x.id === productId);

  if (qtyEl)   qtyEl.textContent   = qty.toFixed(2);
  if (totalEl && p) totalEl.textContent = (p.price * qty).toFixed(2) + ' جنيه';

  // تحديث حالة الأزرار
  const card      = qtyEl ? qtyEl.closest('.product-card') : null;
  if (card) {
    const [minusBtn, plusBtn] = card.querySelectorAll('.qty-btn');
    if (minusBtn) minusBtn.disabled = qty <= 0.25;
    if (plusBtn)  plusBtn.disabled  = qty >= 20;
  }
}

function addToCartFromCard(uid, productId) {
  const qty = StoreState.qtyMap[uid] || 0.25;
  const p   = DB.products.find(x => x.id === productId);
  if (!p) return;
  Cart.add(productId, qty);
  showToast(`تمت الإضافة — ${p.name} (${qty} ${p.unit})`, 'success');
}

// ─── صفحة القسم ───────────────────────────────────────────────
function renderCategoryPage(catId) {
  const cat   = DB.categories.find(c => c.id === catId);
  const prods = DB.products.filter(p => p.catId === catId && p.active);
  if (!cat) return;

  document.getElementById('cat-breadcrumb').textContent = cat.name;
  document.getElementById('cat-page-icon').textContent  = cat.icon;
  document.getElementById('cat-page-name').textContent  = cat.name;
  document.getElementById('cat-page-count').textContent = `${prods.length} منتج متاح`;

  const grid = document.getElementById('cat-products-grid');
  if (!prods.length) {
    grid.innerHTML = `
      <div class="empty" style="grid-column:1/-1">
        <div class="empty-icon">📭</div>
        <p class="empty-text">لا توجد منتجات في هذا القسم حالياً</p>
      </div>`;
    return;
  }
  grid.innerHTML = prods.map(p => productCardHTML(p, 'g')).join('');
}

// ─── البحث ────────────────────────────────────────────────────
function handleSearch(val) {
  const q = val.trim();
  if (!q) { clearSearch(); return; }

  const results = DB.products.filter(p => p.active && p.name.includes(q));
  document.getElementById('home-content').classList.add('hidden');
  document.getElementById('search-results').classList.remove('hidden');
  document.getElementById('search-result-label').textContent =
    `نتائج البحث عن "${q}" — ${results.length} نتيجة`;

  const grid = document.getElementById('search-grid');
  grid.innerHTML = results.length
    ? results.map(p => productCardHTML(p, 's')).join('')
    : `<div class="empty" style="grid-column:1/-1">
         <div class="empty-icon">🔍</div>
         <p class="empty-text">لا توجد نتائج مطابقة</p>
       </div>`;
}

function clearSearch() {
  const input = document.getElementById('search-input');
  if (input) input.value = '';
  document.getElementById('home-content')?.classList.remove('hidden');
  document.getElementById('search-results')?.classList.add('hidden');
}

// ─── صفحة السلة ───────────────────────────────────────────────
function renderCartPage() {
  const empty = document.getElementById('cart-empty');
  const wrap  = document.getElementById('cart-items-wrap');

  if (!Cart.items.length) {
    empty.classList.remove('hidden');
    wrap.classList.add('hidden');
    return;
  }
  empty.classList.add('hidden');
  wrap.classList.remove('hidden');

  document.getElementById('cart-items').innerHTML = Cart.items.map(item => {
    const p = DB.products.find(x => x.id === item.id);
    if (!p) return '';
    return `
      <div class="cart-item">
        <div class="cart-item-emoji">${p.icon}</div>
        <div class="cart-item-info">
          <p class="cart-item-name">${p.name}</p>
          <p class="cart-item-sub">${p.price} جنيه × ${item.qty} ${p.unit}</p>
        </div>
        <div class="qty-row">
          <button class="qty-btn"
            onclick="cartChangeQty(${p.id}, ${parseFloat((item.qty - 0.25).toFixed(2))})">−</button>
          <span class="qty-val">${item.qty.toFixed(2)}</span>
          <button class="qty-btn"
            onclick="cartChangeQty(${p.id}, ${parseFloat((item.qty + 0.25).toFixed(2))})">+</button>
        </div>
        <p class="cart-item-price">${(p.price * item.qty).toFixed(2)} ج</p>
        <button class="cart-del-btn" onclick="cartRemove(${p.id})" title="حذف">🗑️</button>
      </div>
    `;
  }).join('');

  const sub   = Cart.subtotal();
  const fee   = DB.settings.deliveryFee;
  const grand = sub + fee;

  document.getElementById('cart-summary').innerHTML = `
    <div class="summary-row">
      <span>إجمالي المنتجات</span>
      <span>${sub.toFixed(2)} جنيه</span>
    </div>
    <div class="summary-row">
      <span>رسوم التوصيل</span>
      <span>${fee} جنيه</span>
    </div>
    <div class="summary-row summary-total">
      <span>الإجمالي النهائي</span>
      <span>${grand.toFixed(2)} جنيه</span>
    </div>
  `;
}

function cartChangeQty(productId, qty) {
  Cart.updateQty(productId, qty);
  renderCartPage();
}

function cartRemove(productId) {
  Cart.remove(productId);
  renderCartPage();
  showToast('تم حذف المنتج من السلة');
}

// ─── صفحة إتمام الطلب ────────────────────────────────────────
function renderCheckoutSummary() {
  const sub   = Cart.subtotal();
  const fee   = DB.settings.deliveryFee;
  const grand = sub + fee;

  document.getElementById('checkout-summary').innerHTML = `
    <div class="checkout-items">
      ${Cart.items.map(item => {
        const p = DB.products.find(x => x.id === item.id);
        if (!p) return '';
        return `
          <div class="checkout-item">
            <span>${p.name} × ${item.qty} ${p.unit}</span>
            <span>${(p.price * item.qty).toFixed(2)} ج</span>
          </div>`;
      }).join('')}
      <div class="checkout-item muted">
        <span>التوصيل</span><span>${fee} ج</span>
      </div>
      <div class="checkout-item checkout-total">
        <span>الإجمالي</span><span>${grand.toFixed(2)} جنيه</span>
      </div>
    </div>
  `;

  const btn = document.getElementById('submit-btn');
  if (btn) btn.textContent = `تأكيد الطلب — ${grand.toFixed(2)} جنيه`;
}

function submitOrder(e) {
  e.preventDefault();

  const sub   = Cart.subtotal();
  const fee   = DB.settings.deliveryFee;
  const grand = sub + fee;

  const order = {
    id:          ++DB.orderCounter,
    fullName:    document.getElementById('f-name').value.trim(),
    whatsapp:    document.getElementById('f-wa').value.trim(),
    phoneExtra:  document.getElementById('f-phone2').value.trim(),
    zone:        document.getElementById('f-zone').value.trim(),
    street:      document.getElementById('f-street').value.trim(),
    houseNumber: document.getElementById('f-house').value.trim(),
    floor:       document.getElementById('f-floor').value.trim(),
    apartment:   document.getElementById('f-apt').value.trim(),
    landmark:    document.getElementById('f-landmark').value.trim(),
    notes:       document.getElementById('f-notes').value.trim(),
    items:       Cart.items.map(i => {
      const p = DB.products.find(x => x.id === i.id);
      return { id: i.id, name: p.name, price: p.price, qty: i.qty, unit: p.unit };
    }),
    subtotal:    sub,
    deliveryFee: fee,
    total:       grand,
    status:      'جديد',
    createdAt:   new Date().toISOString(),
  };

  DB.orders.unshift(order);

  DB.notifications.unshift({
    id:      Date.now(),
    title:   `طلب جديد #${order.id}`,
    body:    `من: ${order.fullName} — ${order.total.toFixed(2)} جنيه`,
    orderId: order.id,
    read:    false,
    time:    order.createdAt,
  });

  saveData();
  Cart.clear();

  document.getElementById('success-order-num').textContent = `#${order.id}`;
  document.getElementById('checkout-form').reset();
  navigateTo('success');
}

// ─── تهيئة المتجر ─────────────────────────────────────────────
function initStore() {
  renderHome();

  document.getElementById('modal-overlay')
    .addEventListener('click', function (e) {
      if (e.target === this) closeModal();
    });
}
