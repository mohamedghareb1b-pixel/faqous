// js/admin.js - كامل وجاهز للوحة الإدارة
const ADMIN_PASSWORD = 'admin123';
let adminAuthed      = false;
let orderFilter      = '';
let prodCatFilter    = 0;

// قاعدة البيانات المشتركة
let DB = JSON.parse(localStorage.getItem('faqous_db')) || {
  products: [],
  categories: [],
  orders: [],
  notifications: [],
  settings: { storeName: 'سوق فاقوس', whatsapp: '201000000000', deliveryFee: 15, storeOpen: true }
};

function loadData() {
  const data = localStorage.getItem('faqous_db');
  if (data) DB = JSON.parse(data);
}

function saveData() {
  localStorage.setItem('faqous_db', JSON.stringify(DB));
}

// ─── Auth ─────────────────────────────────────────────────────
function adminLogin(e) {
  e.preventDefault();
  const passEl = document.getElementById('admin-pass');
  if (!passEl) return;
  
  const pass = passEl.value;
  if (pass !== ADMIN_PASSWORD) {
    showAdminToast('كلمة المرور غير صحيحة', 'error');
    return;
  }
  adminAuthed = true;
  localStorage.setItem('faqous_admin_auth', '1');
  
  const loginPage = document.getElementById('admin-login');
  const dashPage = document.getElementById('admin-dashboard');
  if (loginPage) loginPage.classList.add('hidden');
  if (dashPage) dashPage.classList.remove('hidden');
  initAdminDashboard();
}

function adminLogout() {
  adminAuthed = false;
  localStorage.removeItem('faqous_admin_auth');
  const loginPage = document.getElementById('admin-login');
  const dashPage = document.getElementById('admin-dashboard');
  if (loginPage) loginPage.classList.remove('hidden');
  if (dashPage) dashPage.classList.add('hidden');
}

function checkAdminAuth() {
  if (localStorage.getItem('faqous_admin_auth') === '1') {
    adminAuthed = true;
    const loginPage = document.getElementById('admin-login');
    const dashPage = document.getElementById('admin-dashboard');
    if (loginPage) loginPage.classList.add('hidden');
    if (dashPage) dashPage.classList.remove('hidden');
    initAdminDashboard();
  }
}

// ─── Toast & Modals ───────────────────────────────────────────
function showAdminToast(msg, type = 'default') {
  alert(`${type === 'error' ? '❌' : '✅'} ${msg}`);
}

function openModal(title, bodyHTML, large = false) {
  const titleEl = document.getElementById('modal-title');
  const bodyEl = document.getElementById('modal-body');
  const overlayEl = document.getElementById('modal-overlay');
  
  if (titleEl) titleEl.textContent = title;
  if (bodyEl) bodyEl.innerHTML = bodyHTML;
  if (overlayEl) overlayEl.classList.remove('hidden');
}

function closeModal() {
  const overlayEl = document.getElementById('modal-overlay');
  if (overlayEl) overlayEl.classList.add('hidden');
}

// ─── Navigation ──────────────────────────────────────────────
function showAdminPage(page) {
  document.querySelectorAll('.admin-page').forEach(p => p.classList.add('hidden'));
  const pageEl = document.getElementById(`admin-page-${page}`);
  if (pageEl) pageEl.classList.remove('hidden');

  if (page === 'dashboard') renderDashboard();
  if (page === 'orders')    renderOrders();
  if (page === 'products')  renderProducts();
  if (page === 'settings')  loadSettings();
}

function initAdminDashboard() {
  loadData();
  renderDashboard();
  loadSettings();
}

// ─── Dashboard ────────────────────────────────────────────────
function renderDashboard() {
  loadData();
  const newCount = DB.orders ? DB.orders.filter(o => o.status === 'جديد').length : 0;
  const activeProds = DB.products ? DB.products.filter(p => p.active).length : 0;

  const statNew = document.getElementById('stat-new');
  const statProducts = document.getElementById('stat-products');
  if (statNew) statNew.textContent = newCount;
  if (statProducts) statProducts.textContent = activeProds;
}

// ─── Orders ───────────────────────────────────────────────────
function renderOrders() {
  loadData();
  const list = document.getElementById('orders-list');
  if (!list) return;

  if (!DB.orders || !DB.orders.length) {
    list.innerHTML = '<p style="text-align:center;padding:20px;">لا توجد طلبات حالياً</p>';
    return;
  }

  list.innerHTML = DB.orders.map(o => `
    <div style="background:#fff; padding:12px; margin-bottom:8px; border-radius:8px; border:1px solid #e5e7eb">
      <p><strong>طلب #${o.id} — الاسم: ${o.fullName}</strong></p>
      <p>الحالة: ${o.status} | الإجمالي: ${o.total} ج</p>
    </div>
  `).join('');
}

// ─── Products (المصلحة بالكامل لإنشاء وإضافة المنتجات بدون أخطاء) ───
function renderProducts() {
  loadData();
  const listEl = document.getElementById('products-list');
  if (!listEl) return;

  if (!DB.products || !DB.products.length) {
    listEl.innerHTML = '<p style="text-align:center;padding:20px;">المتجر فارغ، أضف منتجات جديدة</p>';
    return;
  }

  listEl.innerHTML = DB.products.map(p => `
    <div style="background:#fff; padding:12px; margin-bottom:8px; border-radius:8px; border:1px solid #e5e7eb; display:flex; justify-content:space-between; align-items:center">
      <div>
        <span>${p.icon} <strong>${p.name}</strong></span> — <span>${p.price} ج / ${p.unit}</span>
      </div>
      <div>
        <button class="btn btn-sm" onclick="openEditProduct(${p.id})" style="width:auto; display:inline-block; background:#f3f4f6; color:#000; padding:4px 8px; margin-left:4px">✏️</button>
        <button class="btn btn-sm" onclick="deleteProduct(${p.id})" style="width:auto; display:inline-block; background:#fee2e2; color:#ef4444; padding:4px 8px">🗑️</button>
      </div>
    </div>
  `).join('');
}

function openAddProduct() { openProductForm(null); }
function openEditProduct(id) { if(DB.products) openProductForm(DB.products.find(x => x.id === id)); }

function openProductForm(product) {
  const isEdit = !!product;
  const units  = ['كيلو', 'لتر', 'علبة', 'كرتونة', 'حبة'];
  const categoriesList = DB.categories || [];
  const prodIdToSend = isEdit ? product.id : 0; // إصلاح: نمرر 0 للإضافة بدلاً من نص null

  const html = `
    <div style="display:flex;flex-direction:column;gap:14px; padding:10px;">
      <div class="form-group">
        <label style="display:block;margin-bottom:4px">اسم المنتج</label>
        <input style="width:100%; padding:8px; border:1px solid #ccc; border-radius:6px" id="pf-name" value="${isEdit ? product.name : ''}" placeholder="مثال: طماطم" required />
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div class="form-group">
          <label style="display:block;margin-bottom:4px">السعر (جنيه)</label>
          <input style="width:100%; padding:8px; border:1px solid #ccc; border-radius:6px" type="number" id="pf-price" value="${isEdit ? product.price : ''}" min="0" step="0.5" required />
        </div>
        <div class="form-group">
          <label style="display:block;margin-bottom:4px">الوحدة</label>
          <select style="width:100%; padding:8px; border:1px solid #ccc; border-radius:6px" id="pf-unit">
            ${units.map(u => `<option ${isEdit && product.unit === u ? 'selected' : ''}>${u}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-group">
        <label style="display:block;margin-bottom:4px">القسم</label>
        <select style="width:100%; padding:8px; border:1px solid #ccc; border-radius:6px" id="pf-cat">
          ${categoriesList.map(c => `<option value="${c.id}" ${isEdit && product.catId === c.id ? 'selected' : ''}>${c.icon} ${c.name}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label style="display:block;margin-bottom:4px">أيقونة (emoji)</label>
        <input style="width:100%; padding:8px; border:1px solid #ccc; border-radius:6px" id="pf-icon" value="${isEdit ? product.icon : '🛒'}" placeholder="🍅" />
      </div>
      <button style="background:#10b981; color:#fff; padding:12px; border:none; border-radius:6px; cursor:pointer; font-weight:bold" onclick="saveProduct(${prodIdToSend})">
        ${isEdit ? '💾 حفظ التعديلات' : '➕ إضافة المنتج للمتجر'}
      </button>
    </div>
  `;

  openModal(isEdit ? `تعديل: ${product.name}` : 'إضافة منتج جديد', html);
}

function saveProduct(productId) {
  const nameIn = document.getElementById('pf-name');
  const priceIn = document.getElementById('pf-price');
  const unitIn = document.getElementById('pf-unit');
  const catIn = document.getElementById('pf-cat');
  const iconIn = document.getElementById('pf-icon');

  if (!nameIn || !priceIn || !unitIn || !catIn || !iconIn) return;

  const name  = nameIn.value.trim();
  const price = parseFloat(priceIn.value);
  const unit  = unitIn.value;
  const catId = parseInt(catIn.value) || 1;
  const icon  = iconIn.value.trim() || '🛒';

  if (!name || isNaN(price) || price < 0) {
    showAdminToast('يرجى ملء البيانات بشكل صحيح', 'error');
    return;
  }

  if (!DB.products) DB.products = [];

  if (productId && productId > 0) {
    const p = DB.products.find(x => x.id === productId);
    if (p) Object.assign(p, { name, price, unit, catId, icon });
    showAdminToast('تم تحديث المنتج بنجاح', 'success');
  } else {
    const currentIds = DB.products.map(x => x.id);
    const newId = currentIds.length > 0 ? Math.max(...currentIds) + 1 : 1;
    DB.products.push({ id: newId, catId, name, price, unit, icon, active: true });
    showAdminToast('تم إضافة المنتج بنجاح', 'success');
  }

  saveData();
  closeModal();
  renderProducts();
  renderDashboard();
}

function deleteProduct(id) {
  if (!confirm('هل أنت متأكد من الحذف؟')) return;
  DB.products = DB.products.filter(x => x.id !== id);
  saveData();
  renderProducts();
  renderDashboard();
}

// ─── Settings ─────────────────────────────────────────────────
function loadSettings() {
  if (!DB.settings) return;
  const setName = document.getElementById('set-name');
  const setWa = document.getElementById('set-wa');
  const setFee = document.getElementById('set-fee');
  
  if (setName) setName.value = DB.settings.storeName || '';
  if (setWa) setWa.value = DB.settings.whatsapp || '';
  if (setFee) setFee.value = DB.settings.deliveryFee || 15;

  const toggle = document.getElementById('set-open-toggle');
  const label  = document.getElementById('set-open-label');
  
  if (toggle && label) {
    if (DB.settings.storeOpen) {
      toggle.classList.add('on');
      label.textContent = 'المتجر مفتوح';
    } else {
      toggle.classList.remove('on');
      label.textContent = 'المتجر مغلق';
    }
  }
}

function saveSettings() {
  if (!DB.settings) return;
  const setName = document.getElementById('set-name');
  const setWa = document.getElementById('set-wa');
  const setFee = document.getElementById('set-fee');
  
  if (setName) DB.settings.storeName = setName.value.trim();
  if (setWa) DB.settings.whatsapp  = setWa.value.trim();
  if (setFee) DB.settings.deliveryFee = parseFloat(setFee.value) || 15;
  
  saveData();
  showAdminToast('تم حفظ الإعدادات بنجاح', 'success');
}

// التحقق من الهوية فور تشغيل ملف الإدارة
document.addEventListener('DOMContentLoaded', checkAdminAuth);