document.addEventListener("DOMContentLoaded", async () => {
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

function renderOrdersTable() {
    const container = document.getElementById('orders-rows-container');
    if(!container) return;
    container.innerHTML = '';
    if (DB.orders.length === 0) {
        container.innerHTML = `
            <tr class="text-center text-gray-400"><td colspan="7" class="p-8">لا يوجد أي طلبات مسجلة في السستم حتى الآن.</td></tr>
        `;
        return;
    }
    DB.orders.forEach(order => {
        const itemsHtml = order.items.map(i => 
            `<div class="text-xs text-slate-600 font-medium">• ${i.name} (${i.qty} ${i.unit})</div>`
        ).join('');
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

async function changeStatus(orderId, newStatus) {
    try {
        await updateOrderStatus(orderId, newStatus);
        const order = DB.orders.find(o => o.id === orderId);
        if (order) order.status = newStatus;
        renderOrdersTable();
    } catch (e) {
        alert("فشل تحديث الحالة في السيرفر!");
    }
}

function initRealtimeSubscription() {
    supabaseClient
        .channel('public-realtime-events')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, payload => {
            console.log('📬 تم استقبال طلب جديد لحظياً:', payload.new);
            DB.orders.unshift(payload.new);
            renderOrdersTable();
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

function setupNotificationDropdown() {
    const btn = document.getElementById('notif-btn');
    const dropdown = document.getElementById('notif-dropdown');
    if(btn && dropdown) {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('hidden');
            document.getElementById('notif-count').classList.add('hidden');
        });
        document.addEventListener('click', () => dropdown.classList.add('hidden'));
    }
}

function triggerNotificationAlert(message) {
    const countBadge = document.getElementById('notif-count');
    if(!countBadge) return;
    countBadge.classList.remove('hidden');
    let currentCount = parseInt(countBadge.innerText) || 0;
    countBadge.innerText = currentCount + 1;
    const list = document.getElementById('notif-list');
    if(!list) return;
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