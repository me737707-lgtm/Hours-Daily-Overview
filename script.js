const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQN4XD2dzhAfryhsCdKL3DsL82J-8kCINh-fqnjrsuIiWZlUzR60BKuiP0MnUe8nyAkTx4nmSrdCHaj/pub?gid=0&single=true&output=csv';
const TARGET_HOURS = 4000;

let monthlyData = {}; // سنخزن البيانات مقسمة بالشهور هنا

async function fetchAndProcessData() {
    try {
        const response = await fetch(csvUrl);
        const data = await response.text();
        const rows = data.split('\n').slice(1);

        const stats = {};

        rows.forEach(row => {
            const cols = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            if (cols.length < 4) return;

            let dateStr = cols[0].replace(/"/g, '').trim(); // مثال: 2026, 04-01
            const labeler = cols[1].replace(/"/g, '').trim();
            const hoursC = parseFloat(cols[2]) || 0;
            const hoursD = parseFloat(cols[3]) || 0;

            if (!dateStr) return;

            if (!stats[dateStr]) {
                stats[dateStr] = { users: new Set(), totalHours: 0 };
            }
            stats[dateStr].users.add(labeler);
            stats[dateStr].totalHours += (hoursC + hoursD);
        });

        // تحويل البيانات لشهور
        monthlyData = {};
        Object.keys(stats).forEach(date => {
            // استخراج السنة والشهر (نفترض صيغة YYYY, MM-DD)
            const parts = date.split(',');
            const year = parts[0].trim();
            const monthNum = parts[1].trim().split('-')[0];
            
            const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            const monthName = monthNames[parseInt(monthNum) - 1] + " " + year;

            if (!monthlyData[monthName]) monthlyData[monthName] = [];

            const totalUsers = stats[date].users.size;
            const totalHours = stats[date].totalHours;
            const diff = totalHours - TARGET_HOURS;

            monthlyData[monthName].push({
                date: date,
                totalUsers: totalUsers,
                totalHours: totalHours.toFixed(2),
                avg: totalUsers > 0 ? (totalHours / totalUsers).toFixed(2) : "0.00",
                diff: diff.toFixed(2)
            });
        });

        renderTabs();

    } catch (error) {
        console.error(error);
        document.getElementById('cards-grid').innerHTML = '<div class="loading">خطأ في تحميل البيانات.</div>';
    }
}

function renderTabs() {
    const tabsNav = document.getElementById('tabs-nav');
    tabsNav.innerHTML = '';
    
    const months = Object.keys(monthlyData).sort((a,b) => new Date(b) - new Date(a)); // ترتيب الشهور للأحدث

    months.forEach((month, index) => {
        const btn = document.createElement('button');
        btn.className = `tab-btn ${index === 0 ? 'active' : ''}`;
        btn.innerText = month;
        btn.onclick = () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderMonthCards(month);
        };
        tabsNav.appendChild(btn);
    });

    if (months.length > 0) renderMonthCards(months[0]); // عرض أول شهر تلقائياً
}

function renderMonthCards(monthName) {
    const grid = document.getElementById('cards-grid');
    grid.innerHTML = '';
    
    const days = monthlyData[monthName].sort((a,b) => new Date(b.date) - new Date(a.date));

    days.forEach(item => {
        const diffClass = item.diff >= 0 ? 'positive' : 'negative';
        const card = `
            <div class="card">
                <div class="date-title">🗓️ ${item.date}</div>
                <div class="row"><span class="label">Total Active Users:</span> <span class="value">${item.totalUsers}</span></div>
                <div class="row"><span class="label">Total Hours:</span> <span class="value">${item.totalHours}</span></div>
                <div class="row"><span class="label">Avg Hour/Labeler:</span> <span class="value">${item.avg}</span></div>
                <div class="row"><span class="label">Target:</span> <span class="value">4000</span></div>
                <div class="row"><span class="label">Difference:</span> <span class="value ${diffClass}">${item.diff}</span></div>
            </div>
        `;
        grid.innerHTML += card;
    });
}

fetchAndProcessData();
