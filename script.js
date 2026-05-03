const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQN4XD2dzhAfryhsCdKL3DsL82J-8kCINh-fqnjrsuIiWZlUzR60BKuiP0MnUe8nyAkTx4nmSrdCHaj/pub?gid=0&single=true&output=csv';
const TARGET_HOURS = 4000;

let monthlyData = {};

// Theme Setup
const themeToggleBtn = document.getElementById('theme-toggle');
const currentTheme = localStorage.getItem('theme') || 'light';

if (currentTheme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    themeToggleBtn.innerText = '☀️ Light Mode';
}

themeToggleBtn.addEventListener('click', () => {
    let theme = document.documentElement.getAttribute('data-theme');
    if (theme === 'dark') {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('theme', 'light');
        themeToggleBtn.innerText = '🌙 Dark Mode';
    } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
        themeToggleBtn.innerText = '☀️ Light Mode';
    }
});

async function fetchAndProcessData() {
    try {
        const response = await fetch(csvUrl);
        const data = await response.text();
        
        // Fast CSV parsing optimization
        const rows = data.split('\n');
        const dataRows = rows.slice(1);
        const stats = {};

        // Use a simpler split if data doesn't contain commas within quotes for better speed.
        // If your labeler names have commas, keep the regex: row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
        for (let i = 0; i < dataRows.length; i++) {
            const row = dataRows[i];
            if (!row.trim()) continue;
            
            const cols = row.split(','); // Faster split
            if (cols.length < 4) continue;

            let dateStr = cols[0].replace(/"/g, '').trim();
            const labeler = cols[1].replace(/"/g, '').trim();
            const hoursC = parseFloat(cols[2]) || 0;
            const hoursD = parseFloat(cols[3]) || 0;

            if (!dateStr) continue;

            if (!stats[dateStr]) {
                stats[dateStr] = { users: new Set(), totalHours: 0 };
            }
            stats[dateStr].users.add(labeler);
            stats[dateStr].totalHours += (hoursC + hoursD);
        }

        monthlyData = {};
        
        for (const date in stats) {
            const parts = date.split(',');
            if(parts.length < 2) continue;
            
            const year = parts[0].trim();
            const monthNum = parts[1].trim().split('-')[0];
            const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            
            // Ensure monthNum is valid to avoid errors
            const index = parseInt(monthNum) - 1;
            if(index < 0 || index > 11) continue;
            
            const monthName = `${monthNames[index]} ${year}`;

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
        }

        document.getElementById('loading-spinner').style.display = 'none';
        renderTabs();

    } catch (error) {
        console.error("Fetch error:", error);
        document.getElementById('loading-spinner').innerHTML = '<p style="color:red;">Error loading data.</p>';
    }
}

function renderTabs() {
    const tabsNav = document.getElementById('tabs-nav');
    tabsNav.innerHTML = '';
    
    const months = Object.keys(monthlyData).sort((a,b) => new Date(b) - new Date(a));

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

    if (months.length > 0) renderMonthCards(months[0]);
}

function renderMonthCards(monthName) {
    const grid = document.getElementById('cards-grid');
    grid.innerHTML = '';
    
    // Sort ascending: Oldest date (1st of month) first, Newest date last.
    const days = monthlyData[monthName].sort((a,b) => new Date(a.date) - new Date(b.date));

    days.forEach(item => {
        const diffClass = item.diff >= 0 ? 'positive' : 'negative';
        const diffSign = item.diff > 0 ? '+' : '';
        
        const card = `
            <div class="card">
                <div class="date-title">🗓️ ${item.date}</div>
                <div class="row"><span class="label">Total Active Users:</span> <span class="value">${item.totalUsers}</span></div>
                <div class="row"><span class="label">Total Hours:</span> <span class="value">${item.totalHours}</span></div>
                <div class="row"><span class="label">Avg Hour/Labeler:</span> <span class="value">${item.avg}</span></div>
                <div class="row"><span class="label">Target:</span> <span class="value">${TARGET_HOURS}</span></div>
                <div class="row"><span class="label">Difference:</span> <span class="value ${diffClass}">${diffSign}${item.diff}</span></div>
            </div>
        `;
        grid.insertAdjacentHTML('beforeend', card);
    });
}

// Start processing
fetchAndProcessData();
