// js/admin.js - إدارة لوحة التحكم والاستماع للطلبات لحظياً عبر سوبابيز

document.addEventListener("DOMContentLoaded", async () => {
    console.log("جاري مزامنة بيانات لوحة الآدمن...");
    const success = await loadData();
    
    if (success) {
        renderOrdersTable();
        initRealtimeSubscription();
        setupNotificationDropdown();
    } else {
        document.getElementById('orders-rows-container').innerHTML = `
            <tr><td colspan="7" class="p-4 text-center text-red-500 font-bold">فشلت عملية مزامنة البيانات سحابياً!</td></tr>
        `;
    }
});

// 1. ريندر وعرض جدول الطلبات في الصفحة
function renderOrdersTable() {
    const container = document.getElementById('orders-rows-container');
    container.innerHTML = '';
    
    if (DB.orders.length === 0) {
        container.innerHTML = `
            <tr class="text-center text-gray-400"><td colspan="7" class="p-8">لا يوجد أي طلبات مسجلة في السستم حتى الآن.</td></tr>
        `;
        return;
    }
    
    DB.orders.forEach(order => {
        // تجهيز شكل المنتجات داخل الجدول
        const itemsHtml = order.items.map(i => 
            `<div class="text-xs text-slate-600 font-medium">• ${i.name} (${i.qty} ${i.unit})</div>`
        ).join('');
        
        // تجهيز شكل العنوان التفصيلي
        const addressHtml = `
            <div class="text-xs">
                <span class="font-bold text-slate-700">${order.zone}</span> — ${order.street} (م ${order.houseNumber})
                ${order.floor ? ` — دور ${order.floor}` : ''} ${order.apartment ? ` — شقة ${order.apartment}` : ''}
                ${order.landmark ? `<div class="text-green-600 mt-0.5">📍 ${order.landmark}</div>` : ''}
            </div>
        `;

        container.innerHTML += `
            <tr class="hover:bg-slate-50 transition" id="order-row-${order.id}">
                <td class="p-4 font-bold text-blue-600">#${order.id}</td>
                <td class="p-4">
                    <div class="font-bold text-slate-800">${order.fullName}</div>
                    <div class="text-xs text-slate-400 mt-0.5">${order.whatsapp}</div>
                </td>
                <td class="p-4">${addressHtml}</td>
                <td class="p-4 space-y-0.5">${itemsHtml}</td>
                <td class="p-4 font-bold text-slate-700">${order.total.toFixed(2)} ج</td>
                <td class="p-4">
                    <span class="${getStatusClass(order.status)}">${order.status}</span>
                </td>
                <td class="p-4">
                    <select onchange="changeStatus(${order.id}, this.value)" class="text-xs border rounded p-1.5 bg-white shadow-sm focus:outline-none">
                        <option value="جديد" ${order.status === 'جديد' ? 'selected' : ''}>جديد</option>
                        <option value="جاري التجهيز" ${order.status === 'جاري التجهيز' ? 'selected' : ''}>جاري التجهيز</option>
                        <option value="خرج للتوصيل" ${order.status === 'خرج للتوصيل' ? 'selected' : ''}>خرج للتوصيل</option>
                        <option value="تم التسليم" ${order.status === 'تم التسليم' ? 'selected' : ''}>تم التسليم</option>
                        <option value="ملغي" ${order.status === 'ملغي' ? 'selected' : ''}>ملغي</option>
                    </select>
                </td>
            </tr>
        `;
    });
}

// 2. تحديث حالة الطلب وإرسالها فورياً لقاعدة البيانات السحابية
async function changeStatus(orderId, newStatus) {
    try {
        await updateOrderStatus(orderId, newStatus);
        // تحديث الحالة محلياً في الكائن
        const order = DB.orders.find(o => o.id === orderId);
        if (order) order.status = newStatus;
        renderOrdersTable();
    } catch (e) {
        alert("فشل تحديث الحالة في السيرفر!");
    }
}

// 3. ✨ تفعيل نظام البث والاستماع اللحظي (Supabase Realtime)
function initRealtimeSubscription() {
    supabaseClient
        .channel('public-realtime-events')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, payload => {
            console.log('📬 تم استقبال طلب جديد لحظياً:', payload.new);
            // إضافة الطلب الجديد في أعلى المصفوفة وإعادة بناء الجدول فوراً
            DB.orders.unshift(payload.new);
            renderOrdersTable();
            
            // تشغيل صوت تنبيه خفيف إن أردت، أو الاكتفاء بالنظام اللحظي
            triggerNotificationAlert('طلب جديد بقيمة ' + payload.new.total + ' ج');
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, payload => {
            console.log('🔄 تم تحديث حالة طلب سحابياً:', payload.new);
            const index = DB.orders.findIndex(o => o.id === payload.new.id);
            if (index !== -1) {
                DB.orders[index] = payload.new;
                renderOrdersTable();
            }
        })
        .subscribe();
}

// 4. مركز التحكم بالإشعارات وتأثيراتها
function setupNotificationDropdown() {
    const btn = document.getElementById('notif-btn');
    const dropdown = document.getElementById('notif-dropdown');
    
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('hidden');
        // عند فتح القائمة، تصفير العداد كأنها قُرأت
        document.getElementById('notif-count').classList.add('hidden');
    });
    
    document.addEventListener('click', () => dropdown.classList.add('hidden'));
}

function triggerNotificationAlert(message) {
    const countBadge = document.getElementById('notif-count');
    countBadge.classList.remove('hidden');
    
    // زيادة عدد الإشعارات غير المقروءة
    let currentCount = parseInt(countBadge.innerText) || 0;
    countBadge.innerText = currentCount + 1;
    
    // إضافة الإشعار في أعلى القائمة المنسدلة
    const list = document.getElementById('notif-list');
    const timeStr = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    
    const notifItem = `
        <div class="p-2 hover:bg-slate-50 border-b rounded transition bg-green-50">
            <div class="font-bold text-slate-800">🎉 طلب وارد جديد!</div>
            <div class="text-slate-600 mt-0.5">${message}</div>
            <div class="text-[10px] text-slate-400 mt-1 text-left">${timeStr}</div>
        </div>
    `;
    list.insertAdjacentHTML('afterbegin', notifItem);
}