// ضع هنا الرابط الخاص بـ Google Sheet بعد نشره كـ CSV
const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQN4XD2dzhAfryhsCdKL3DsL82J-8kCINh-fqnjrsuIiWZlUzR60BKuiP0MnUe8nyAkTx4nmSrdCHaj/pub?gid=0&single=true&output=csv';
const TARGET_HOURS = 4000;

async function fetchAndProcessData() {
    try {
        const response = await fetch(csvUrl);
        const data = await response.text();
        
        const rows = data.split('\n');
        const dataRows = rows.slice(1);

        const stats = {};

        dataRows.forEach(row => {
            // تقسيم الصف لتفادي مشاكل الفواصل داخل البيانات
            const cols = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            if (cols.length < 4) return;

            // تنظيف التاريخ (شيلنا السطر اللي كان بيعمل مشكلة المسافة)
            let dateStr = cols[0].replace(/"/g, '').trim();
            
            const labeler = cols[1].replace(/"/g, '').trim();
            const hoursC = parseFloat(cols[2]) || 0;
            const hoursD = parseFloat(cols[3]) || 0;

            if (!dateStr) return;

            if (!stats[dateStr]) {
                stats[dateStr] = {
                    users: new Set(),
                    totalHours: 0
                };
            }

            stats[dateStr].users.add(labeler);
            stats[dateStr].totalHours += (hoursC + hoursD);
        });

        // تحويل البيانات لمصفوفة عشان نقدر نرتبها
        const finalData = Object.keys(stats).map(date => {
            const totalUsers = stats[date].users.size;
            const totalHours = stats[date].totalHours;
            const difference = totalHours - TARGET_HOURS;
            
            return {
                date: date,
                totalUsers: totalUsers,
                totalHours: totalHours.toFixed(2),
                avgPerLabeler: totalUsers > 0 ? (totalHours / totalUsers).toFixed(2) : "0.00",
                target: TARGET_HOURS,
                difference: difference.toFixed(2)
            };
        });

        // ترتيب الأيام تنازلياً (الأحدث فوق)
        finalData.sort((a, b) => new Date(b.date) - new Date(a.date));

        renderCards(finalData);

    } catch (error) {
        console.error("Error:", error);
        document.getElementById('content').innerHTML = '<div class="loading" style="color:red;">حدث خطأ أثناء تحميل البيانات. تأكد من الرابط.</div>';
    }
}

function renderCards(data) {
    const container = document.getElementById('content');
    container.innerHTML = '';

    if (data.length === 0) {
        container.innerHTML = '<div class="loading">لا توجد بيانات متاحة.</div>';
        return;
    }

    data.forEach(item => {
        // تحديد اللون (أحمر للسالب، أخضر للموجب)
        const diffClass = item.difference >= 0 ? 'positive' : 'negative';
        // إضافة علامة + إذا كان الرقم موجب
        const diffSign = item.difference > 0 ? '+' : ''; 
        
        const card = `
            <div class="card">
                <div class="date-title">🗓️ ${item.date}</div>
                <div class="row"><span class="label">Total Active Users:</span> <span class="value">${item.totalUsers}</span></div>
                <div class="row"><span class="label">Total Hours:</span> <span class="value">${item.totalHours}</span></div>
                <div class="row"><span class="label">Avg Hour/Labeler:</span> <span class="value">${item.avgPerLabeler}</span></div>
                <div class="row"><span class="label">Target:</span> <span class="value">${item.target}</span></div>
                <div class="row"><span class="label">Difference:</span> <span class="value ${diffClass}">${diffSign}${item.difference}</span></div>
            </div>
        `;
        container.innerHTML += card;
    });
}

// تشغيل الكود
fetchAndProcessData();
