// js/store.js
// منطق صفحات المتجر — يُستخدم في index.html فقط

const StoreState = {
  currentPage: 'home',
  currentCatId: null,
  qtyMap: {},   // uid => qty (المخزن المؤقت للكميات المحددة)
};

function navigateTo(page, catId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  StoreState.currentPage  = page;
  StoreState.currentCatId = catId || null;

  const pageEl = document.getElementById('page-' + page);
  if (pageEl) pageEl.classList.add('active');
  window.scrollTo(0, 0);

  if (page === 'home')     { renderHome(); }
  if (page === 'category') { renderCategoryPage(catId); }
  if (page === 'cart')     { renderCartPage(); }
  if (page === 'checkout') {
    if (!Cart.items.length) { showToast('السلة فارغة', 'error'); return; }
    renderCheckoutSummary();
  }
}

function showToast(msg, type = 'default', duration = 3000) {
  const container = document.getElementById('toast-container');
  if (!container) return;
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
          ${prods.slice(0, 8).map(p => productCardHTML(p, 'home')).join('')}
        </div>
      </section>
    `;
  }).join('');
}

// تعديل STEP إلى 0.50 (نصف كيلو)
function productCardHTML(product, context) {
  const uid = `${product.id}_${context}`;
  if (!StoreState.qtyMap[uid]) StoreState.qtyMap[uid] = 0.50; // القيمة البدائية نصف كيلو
  const qty   = StoreState.qtyMap[uid];
  const total = (product.price * qty).toFixed(2);

  return `
    <div class="product-card">
      <div class="product-img">
        ${product.img ? `<img src="${product.img}" alt="${product.name}" loading="lazy">` : product.icon}
      </div>
      <p class="product-name">${product.name}</p>
      <p class="product-price">${product.price} جنيه / ${product.unit}</p>
      <div class="qty-row">
        <button type="button" class="qty-btn" onclick="changeQty('${uid}', ${product.id}, -1)" ${qty <= 0.50 ? 'disabled' : ''}>−</button>
        <span class="qty-val" id="qty-${uid}">${qty.toFixed(2)}</span>
        <button type="button" class="qty-btn" onclick="changeQty('${uid}', ${product.id}, 1)" ${qty >= 20 ? 'disabled' : ''}>+</button>
      </div>
      <p class="product-total" id="total-${uid}">${total} جنيه</p>
      <button type="button" class="btn btn-primary btn-sm w-full" style="margin-top:4px" onclick="addToCartClick('${uid}', ${product.id})">
        🛒 إضافة للسلة
      </button>
    </div>
  `;
}

// عرض المنتجات داخل القسم بشكل أفقي متناسق
function renderCategoryPage(catId) {
  const cat = DB.categories.find(c => c.id === catId);
  if (!cat) return;

  document.getElementById('cat-page-icon').textContent = cat.icon;
  document.getElementById('cat-page-name').textContent = cat.name;

  const prods = DB.products.filter(p => p.catId === catId && p.active);
  document.getElementById('cat-page-count').textContent = `${prods.length} منتج متوفر`;

  const grid = document.getElementById('cat-products-grid');
  if (!prods.length) {
    grid.innerHTML = `<p style="grid-column:1/-1;text-align:center;color:var(--gray-500);padding:4px">لا توجد منتجات متوفرة حالياً في هذا القسم.</p>`;
    return;
  }

  // عرض بشكل أفقي مضغوط يناسب الشاشات
  grid.innerHTML = prods.map(p => {
    const uid = `${p.id}_catpage`;
    if (!StoreState.qtyMap[uid]) StoreState.qtyMap[uid] = 0.50;
    const qty = StoreState.qtyMap[uid];
    const total = (p.price * qty).toFixed(2);
    
    return `
      <div class="horizontal-prod-card">
        <div class="product-img">
          ${p.img ? `<img src="${p.img}" alt="${p.name}" loading="lazy">` : p.icon}
        </div>
        <div class="horizontal-prod-info">
          <p class="product-name">${p.name}</p>
          <p class="product-price">${p.price} ج / ${p.unit}</p>
          <p class="product-total" id="total-${uid}" style="text-align:right; margin-top:2px;">${total} ج</p>
        </div>
        <div class="qty-wrapper-box">
          <div class="qty-row" style="margin-top:0; width:110px;">
            <button type="button" class="qty-btn" onclick="changeQty('${uid}', ${p.id}, -1)" ${qty <= 0.50 ? 'disabled' : ''}>−</button>
            <span class="qty-val" id="qty-${uid}">${qty.toFixed(2)}</span>
            <button type="button" class="qty-btn" onclick="changeQty('${uid}', ${p.id}, 1)" ${qty >= 20 ? 'disabled' : ''}>+</button>
          </div>
          <button type="button" class="btn btn-primary btn-sm" style="padding: 5px 10px; font-size:12px;" onclick="addToCartClick('${uid}', ${p.id})">
            ➕ إضافة
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// تعديل الـ STEP إلى 0.50
function changeQty(uid, productId, dir) {
  const STEP = 0.50;
  let qty = StoreState.qtyMap[uid] || 0.50;
  qty = dir > 0 ? Math.min(20, parseFloat((qty + STEP).toFixed(2))) : Math.max(0.50, parseFloat((qty - STEP).toFixed(2)));
  
  StoreState.qtyMap[uid] = qty;
  const qtyEl = document.getElementById(`qty-${uid}`);
  const totalEl = document.getElementById(`total-${uid}`);
  const p = DB.products.find(x => x.id === productId);
  
  if (qtyEl) qtyEl.textContent = qty.toFixed(2);
  if (totalEl && p) totalEl.textContent = (p.price * qty).toFixed(2) + ' جنيه';
}

function addToCartClick(uid, productId) {
  const qty = StoreState.qtyMap[uid] || 0.50;
  Cart.add(productId, qty);
  showToast('تمت إضافة المنتج إلى السلة بنجاح', 'success');
}

function renderCartPage() {
  const wrap = document.getElementById('cart-list-wrap');
  const summary = document.getElementById('cart-summary-wrap');
  if (!wrap) return;

  if (!Cart.items.length) {
    wrap.innerHTML = `<div style="text-align:center;padding:40px 10px;color:var(--gray-500)">السلة فارغة تماماً، اذهب واضف بعض المنتجات الطازجة!</div>`;
    summary.classList.add('hidden');
    return;
  }

  summary.classList.remove('hidden');
  wrap.innerHTML = Cart.items.map(item => {
    const p = DB.products.find(x => x.id === item.id);
    if (!p) return '';
    return `
      <div class="cart-item">
        <div class="cart-item-img">
          ${p.img ? `<img src="${p.img}" alt="${p.name}">` : p.icon}
        </div>
        <div class="cart-item-details">
          <p class="cart-item-name">${p.name}</p>
          <p class="cart-item-p">${item.qty} ${p.unit} × ${p.price} ج</p>
        </div>
        <p class="cart-item-price">${(p.price * item.qty).toFixed(2)} ج</p>
        <button class="cart-del-btn" onclick="cartRemove(${p.id})" title="حذف">🗑️</button>
      </div>
    `;
  }).join('');

  document.getElementById('cart-subtotal').textContent = Cart.subtotal().toFixed(2) + ' ج';
  document.getElementById('cart-fee').textContent = DB.settings.deliveryFee.toFixed(2) + ' ج';
  document.getElementById('cart-total').textContent = Cart.total().toFixed(2) + ' ج';
}

function cartRemove(id) {
  Cart.remove(id);
  renderCartPage();
}

function renderCheckoutSummary() {
  const linesEl = document.getElementById('checkout-summary-lines');
  if (!linesEl) return;

  let html = `<p style="font-weight:700;margin-bottom:10px;font-size:14px">ملخص المنتجات:</p>`;
  Cart.items.forEach(item => {
    const p = DB.products.find(x => x.id === item.id);
    if (p) {
      html += `<div class="summary-row" style="font-size:13px;margin-bottom:6px;">
        <span>• ${p.name} (${item.qty} ${p.unit})</span>
        <span>${(p.price * item.qty).toFixed(2)} ج</span>
      </div>`;
    }
  });

  html += `
    <div class="summary-row" style="margin-top:12px;border-top:1px dashed var(--gray-200);padding-top:8px;"><span>إجمالي المنتجات:</span><span>${Cart.subtotal().toFixed(2)} ج</span></div>
    <div class="summary-row"><span>مصاريف التوصيل:</span><span>${DB.settings.deliveryFee.toFixed(2)} ج</span></div>
    <div class="summary-row total"><span>الإجمالي المطلوب:</span><span>${Cart.total().toFixed(2)} ج</span></div>
  `;
  linesEl.innerHTML = html;
}

function handleCheckout(e) {
  e.preventDefault();
  if (!Cart.items.length) return;

  const orderId = Math.floor(100000 + Math.random() * 900000);
  const sub = Cart.subtotal();
  const fee = DB.settings.deliveryFee;
  const grand = Cart.total();

  const order = {
    id:          orderId,
    fullName:    document.getElementById('f-name').value.trim(),
    whatsapp:    document.getElementById('f-wa').value.trim(),
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

// تشغيل عند التحميل لأول مرة
window.addEventListener('DOMContentLoaded', () => {
  renderHome();
});