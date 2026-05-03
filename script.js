/* ================================================================
   Hours Overview Dashboard — Vanilla JS
   No frameworks · No build tools · Runs directly in the browser
   ================================================================ */

(function () {
    "use strict";

    /* ──── Constants ──── */
    const CSV_URL =
        "https://docs.google.com/spreadsheets/d/e/2PACX-1vQN4XD2dzhAfryhsCdKL3DsL82J-8kCINh-fqnjrsuIiWZlUzR60BKuiP0MnUe8nyAkTx4nmSrdCHaj/pub?gid=0&single=true&output=csv";

    // 🔥 ضع هنا رابط الـ CSV الخاص بشيت الـ Users 🔥
    const USERS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQN4XD2dzhAfryhsCdKL3DsL82J-8kCINh-fqnjrsuIiWZlUzR60BKuiP0MnUe8nyAkTx4nmSrdCHaj/pub?gid=1748741633&single=true&output=csv";

    const TARGET_DAILY = 4000;
    const TARGET_WEEKLY = 28000; // 4000 * 7 days

    const MONTH_NAMES = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December",
    ];

    /* ──── State ──── */
    let monthlyData = {};
    let activeMonth = "";
    let isDark = false;
    let currentView = "daily"; // 'daily' or 'weekly'

    /* ──── DOM Refs ──── */
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);

    // Login Refs
    const loginOverlay = $("#login-overlay");
    const loginForm = $("#login-form");
    const loginUsername = $("#login-username");
    const loginPassword = $("#login-password");
    const loginError = $("#login-error");
    const loginSubmitBtn = $("#login-submit-btn");
    const mainDashboard = $("#main-dashboard");
    const displayUsername = $("#display-username");
    const logoutBtn = $("#logout-btn");

    // Dashboard Refs
    const themeToggleBtn = $("#theme-toggle");
    const tabsNav        = $("#tabs-nav");
    const tabsSkeleton   = $("#tabs-skeleton");
    const statsBar       = $("#stats-bar");
    const viewControls   = $("#view-controls");
    const loadingState   = $("#loading");
    const errorState     = $("#error-state");
    const errorMessage   = $("#error-message");
    const retryBtn       = $("#retry-btn");
    const cardsGrid      = $("#cards-grid");

    /* ================================================================
       SVG ICONS (inline, zero dependencies)
       ================================================================ */
    const ICONS = {
        calendar: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>',
        users: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>',
        clock: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>',
        barChart: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="20" x2="12" y2="10"></line><line x1="18" y1="20" x2="18" y2="4"></line><line x1="6" y1="20" x2="6" y2="16"></line></svg>',
        target: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>',
        trendUp: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>',
        trendDown: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline><polyline points="17 18 23 18 23 12"></polyline></svg>',
        
        /* Larger versions for stats bar */
        calendarLg: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>',
        clockLg: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>',
        usersLg: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>',
        barChartLg: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="20" x2="12" y2="10"></line><line x1="18" y1="20" x2="18" y2="4"></line><line x1="6" y1="20" x2="6" y2="16"></line></svg>',
        targetLg: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>'
    };

    /* ================================================================
       AUTHENTICATION LOGIC
       ================================================================ */
    function checkAuth() {
        const currentUser = localStorage.getItem("dashboard_user");
        if (currentUser) {
            // User is logged in
            loginOverlay.style.display = "none";
            mainDashboard.style.display = "flex";
            displayUsername.textContent = currentUser;
            fetchAndProcessData(); // Load the dashboard data
        } else {
            // Not logged in
            loginOverlay.style.display = "flex";
            mainDashboard.style.display = "none";
        }
    }

    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const user = loginUsername.value.trim();
        const pass = loginPassword.value.trim();
        
        if(!user || !pass) return;

        loginSubmitBtn.textContent = "Verifying...";
        loginSubmitBtn.disabled = true;
        loginError.textContent = "";

        try {
            const res = await fetch(USERS_CSV_URL);
            if(!res.ok) throw new Error("Could not connect to database");
            const text = await res.text();
            
            const rows = text.split("\n").slice(1); // skip header
            let isValid = false;

            for (let row of rows) {
                if(!row.trim()) continue;
                // Parsing CSV line properly
                const cols = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
                if(cols.length >= 2) {
                    const csvUser = cols[0].replace(/"/g, "").trim();
                    const csvPass = cols[1].replace(/"/g, "").trim();
                    
                    if (user === csvUser && pass === csvPass) {
                        isValid = true;
                        break;
                    }
                }
            }

            if (isValid) {
                localStorage.setItem("dashboard_user", user);
                loginOverlay.style.opacity = "0";
                setTimeout(() => {
                    checkAuth();
                    loginOverlay.style.opacity = "1"; // reset for future
                }, 400);
            } else {
                loginError.textContent = "Invalid username or password.";
            }

        } catch (err) {
            console.error(err);
            loginError.textContent = "Error connecting to Users database.";
        }

        loginSubmitBtn.textContent = "Sign In";
        loginSubmitBtn.disabled = false;
    });

    logoutBtn.addEventListener("click", () => {
        localStorage.removeItem("dashboard_user");
        location.reload(); 
    });

    /* ================================================================
       THEME & VIEW MANAGEMENT
       ================================================================ */
    function initTheme() {
        const saved = localStorage.getItem("dashboard-theme");
        isDark = saved === "dark" || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
        
        if (isDark) {
            document.documentElement.setAttribute("data-theme", "dark");
        } else {
            document.documentElement.removeAttribute("data-theme");
        }
    }

    function toggleTheme() {
        isDark = !isDark;
        if (isDark) {
            document.documentElement.setAttribute("data-theme", "dark");
            localStorage.setItem("dashboard-theme", "dark");
        } else {
            document.documentElement.removeAttribute("data-theme");
            localStorage.setItem("dashboard-theme", "light");
        }
    }

    themeToggleBtn.addEventListener("click", toggleTheme);

    const segBtns = $$(".seg-btn");
    segBtns.forEach(btn => {
        btn.addEventListener("click", (e) => {
            segBtns.forEach(b => b.classList.remove("active"));
            e.target.classList.add("active");
            currentView = e.target.getAttribute("data-view");
            renderCards(); 
        });
    });

    /* ================================================================
       DATA FETCHING & PARSING
       ================================================================ */
    async function fetchAndProcessData() {
        showLoading();

        try {
            const response = await fetch(CSV_URL);
            if (!response.ok) throw new Error("Failed to fetch data");
            const text = await response.text();

            const rows = text.split("\n");
            const dataRows = rows.slice(1);
            const stats = {};

            for (let i = 0; i < dataRows.length; i++) {
                const row = dataRows[i];
                if (!row.trim()) continue;

                const cols = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
                if (cols.length < 4) continue;

                const dateStr = cols[0].replace(/"/g, "").trim();
                const labeler = cols[1].replace(/"/g, "").trim();
                const hoursC  = parseFloat(cols[2]) || 0;
                const hoursD  = parseFloat(cols[3]) || 0;

                if (!dateStr) continue;

                if (!stats[dateStr]) {
                    stats[dateStr] = { users: new Set(), totalHours: 0 };
                }
                stats[dateStr].users.add(labeler);
                stats[dateStr].totalHours += hoursC + hoursD;
            }

            monthlyData = {};

            for (const date in stats) {
                const parts = date.split(",");
                if (parts.length < 2) continue;

                const year     = parts[0].trim();
                const monthDay = parts[1].trim();
                const monthNum = monthDay.split("-")[0];

                const idx = parseInt(monthNum, 10) - 1;
                if (idx < 0 || idx > 11) continue;

                const monthName = `${MONTH_NAMES[idx]} ${year}`;
                if (!monthlyData[monthName]) monthlyData[monthName] = [];

                const totalUsers = stats[date].users.size;
                const totalHours = stats[date].totalHours;
                const diff       = totalHours - TARGET_DAILY;

                const properDate = `${year}-${monthDay}`;
                let dayName = "";
                let isFriday = false;

                const d = new Date(properDate);
                if (!isNaN(d.getTime())) {
                    dayName  = d.toLocaleDateString("en-US", { weekday: "long" });
                    isFriday = d.getDay() === 5;
                }

                monthlyData[monthName].push({
                    date,
                    dayName,
                    isFriday,
                    totalUsers,
                    usersSet: stats[date].users, // Preserve for weekly aggregation
                    totalHours: totalHours.toFixed(2),
                    avg: totalUsers > 0 ? (totalHours / totalUsers).toFixed(2) : "0.00",
                    diff: diff.toFixed(2),
                });
            }

            hideLoading();
            renderTabs();

        } catch (err) {
            console.error("Fetch error:", err);
            showError(err.message || "An unexpected error occurred");
        }
    }

    /* ================================================================
       UI STATE MANAGEMENT
       ================================================================ */
    function showLoading() {
        loadingState.style.display = "flex";
        errorState.style.display   = "none";
        cardsGrid.style.display    = "none";
        statsBar.style.display     = "none";
        if(viewControls) viewControls.style.display = "none";
        tabsSkeleton.style.display = "flex";
    }

    function hideLoading() {
        loadingState.style.display   = "none";
        tabsSkeleton.style.display   = "none";
    }

    function showError(msg) {
        loadingState.style.display = "none";
        tabsSkeleton.style.display = "none";
        errorState.style.display   = "flex";
        cardsGrid.style.display    = "none";
        statsBar.style.display     = "none";
        if(viewControls) viewControls.style.display = "none";
        errorMessage.textContent   = msg + ". Please check your connection and try again.";
    }

    function showContent() {
        errorState.style.display = "none";
        cardsGrid.style.display  = "grid";
        statsBar.style.display   = "grid";
        if(viewControls) viewControls.style.display = "flex";
    }

    retryBtn.addEventListener("click", fetchAndProcessData);

    /* ================================================================
       RENDER: TABS
       ================================================================ */
    function getSortedMonths() {
        return Object.keys(monthlyData).sort(
            (a, b) => new Date(b).getTime() - new Date(a).getTime()
        );
    }

    function renderTabs() {
        /* Remove old tab buttons (keep skeleton) */
        const oldBtns = tabsNav.querySelectorAll(".tab-btn");
        oldBtns.forEach((btn) => btn.remove());

        const months = getSortedMonths();
        if (months.length === 0) return;

        /* Create tabs container */
        const tabsInner = document.createElement("div");
        tabsInner.className = "tabs-inner";
        tabsNav.appendChild(tabsInner);

        months.forEach((month, i) => {
            const btn = document.createElement("button");
            btn.className = "tab-btn" + (i === 0 ? " active" : "");
            btn.textContent = month;
            btn.setAttribute("role", "tab");
            btn.addEventListener("click", () => {
                tabsInner.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
                btn.classList.add("active");
                setActiveMonth(month);
            });
            tabsInner.appendChild(btn);
        });

        activeMonth = months[0];
        renderStats();
        renderCards();
        showContent();
    }

    function setActiveMonth(month) {
        activeMonth = month;
        renderStats();
        renderCards();
    }

    /* ================================================================
       RENDER: SUMMARY STATS
       ================================================================ */
    function renderStats() {
        const days = monthlyData[activeMonth] || [];
        if (days.length === 0) {
            statsBar.style.display = "none";
            return;
        }

        const totalHoursSum = days.reduce((s, d) => s + parseFloat(d.totalHours), 0);
        const peakUsers     = Math.max(...days.map((d) => d.totalUsers));
        const avgPerDay     = totalHoursSum / days.length;
        const daysOnTarget  = days.filter((d) => parseFloat(d.diff) >= 0).length;
        const fridayCount   = days.filter((d) => d.isFriday).length;
        const targetRatio   = daysOnTarget / days.length;

        let targetVariant = "";
        if (targetRatio >= 0.7) targetVariant = "positive";
        else if (targetRatio < 0.3) targetVariant = "negative";

        statsBar.innerHTML = `
            <div class="stat-item">
                <div class="stat-icon">${ICONS.calendarLg}</div>
                <div class="stat-info">
                    <div class="stat-label">Total Days</div>
                    <div class="stat-value-row">
                        <span class="stat-value">${days.length}</span>
                    </div>
                </div>
            </div>
            <div class="stat-item">
                <div class="stat-icon">${ICONS.clockLg}</div>
                <div class="stat-info">
                    <div class="stat-label">Total Hours</div>
                    <div class="stat-value-row">
                        <span class="stat-value">${formatNum(totalHoursSum, 0)}</span>
                    </div>
                </div>
            </div>
            <div class="stat-item">
                <div class="stat-icon">${ICONS.usersLg}</div>
                <div class="stat-info">
                    <div class="stat-label">Peak Users</div>
                    <div class="stat-value-row">
                        <span class="stat-value">${peakUsers}</span>
                    </div>
                </div>
            </div>
            <div class="stat-item">
                <div class="stat-icon">${ICONS.barChartLg}</div>
                <div class="stat-info">
                    <div class="stat-label">Avg / Day</div>
                    <div class="stat-value-row">
                        <span class="stat-value">${formatNum(avgPerDay, 0)}</span>
                    </div>
                </div>
            </div>
            <div class="stat-item">
                <div class="stat-icon ${targetVariant}">${ICONS.targetLg}</div>
                <div class="stat-info">
                    <div class="stat-label">Days on Target</div>
                    <div class="stat-value-row">
                        <span class="stat-value ${targetVariant}">${daysOnTarget}/${days.length}</span>
                        ${fridayCount > 0 ? `<span class="stat-sub">${fridayCount} Fridays</span>` : ""}
                    </div>
                </div>
            </div>
        `;

        statsBar.style.display = "grid";
    }

    /* ================================================================
       RENDER: CARDS (Daily & Weekly Views)
       ================================================================ */
    function renderCards() {
        const days = (monthlyData[activeMonth] || []).slice().sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        cardsGrid.innerHTML = "";

        // ----- WEEKLY VIEW LOGIC -----
        if (currentView === 'weekly') {
            const weeksMap = {};

            days.forEach(item => {
                const parts = item.date.split(',');
                const year = parts[0].trim();
                const monthDay = parts[1].trim();
                const properDate = `${year}-${monthDay}`;

                const d = new Date(properDate);
                if(isNaN(d.getTime())) return;

                // Group by week (Monday to Sunday)
                const dayOfWeek = d.getDay();
                const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
                const monday = new Date(d);
                monday.setDate(monday.getDate() - diffToMonday);

                const sunday = new Date(monday);
                sunday.setDate(sunday.getDate() + 6);

                const monthNamesShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                const formatShort = (dateObj) => `${monthNamesShort[dateObj.getMonth()]} ${String(dateObj.getDate()).padStart(2, '0')}`;

                const weekKey = `${formatShort(monday)} - ${formatShort(sunday)}`;

                if(!weeksMap[weekKey]) {
                    weeksMap[weekKey] = {
                        label: weekKey,
                        year: monday.getFullYear(),
                        mondayTime: monday.getTime(),
                        usersSet: new Set(),
                        totalHours: 0
                    };
                }

                // Merge unique users and sum hours
                item.usersSet.forEach(u => weeksMap[weekKey].usersSet.add(u));
                weeksMap[weekKey].totalHours += parseFloat(item.totalHours);
            });

            // ترتيب الأسابيع تصاعدياً (من القديم للجديد)
            const weeksArray = Object.values(weeksMap).sort((a,b) => a.mondayTime - b.mondayTime);

            weeksArray.forEach((weekItem, index) => {
                const diffNum  = weekItem.totalHours - TARGET_WEEKLY;
                const hoursNum = weekItem.totalHours;
                const pct      = Math.min((hoursNum / TARGET_WEEKLY) * 100, 100);
                const isOver   = diffNum >= 0;
                const totalUsers = weekItem.usersSet.size;
                const avg = totalUsers > 0 ? (hoursNum / totalUsers).toFixed(2) : "0.00";

                let accentClass = isOver ? "card-accent-over" : "card-accent-under";
                let fillClass   = isOver ? "fill-over" : "fill-under";

                const card = document.createElement("div");
                card.className = "card " + accentClass;
                card.style.animationDelay = `${index * 40}ms`;

                card.innerHTML = `
                    <div class="card-accent">
                        <div class="card-accent-inner"></div>
                    </div>
                    <div class="card-header">
                        <div class="card-header-left">
                            <div class="card-date-icon">${ICONS.calendar}</div>
                            <div class="card-date-info">
                                <div class="card-date-text">Week of ${escapeHtml(weekItem.label)}</div>
                                <div class="card-day-row">
                                    <span class="card-day-name">${weekItem.year}</span>
                                    <span class="friday-badge" style="background:var(--bg-secondary); color:var(--text-secondary)">7 DAYS</span>
                                </div>
                            </div>
                        </div>
                        <div class="card-diff-badge ${isOver ? "positive" : "negative"}">
                            ${isOver ? ICONS.trendUp : ICONS.trendDown}
                            <span>${diffNum > 0 ? "+" : ""}${formatNum(Math.abs(diffNum))}</span>
                        </div>
                    </div>
                    <div class="card-progress-section">
                        <div class="card-progress-header">
                            <span class="card-progress-label">Weekly Target Progress</span>
                            <span class="card-progress-pct">${pct.toFixed(1)}%</span>
                        </div>
                        <div class="card-progress-track">
                            <div class="card-progress-fill ${fillClass}" data-width="${pct}"></div>
                        </div>
                    </div>
                    <div class="card-data-rows">
                        <div class="card-row">
                            <div class="card-row-label">${ICONS.users}<span>Weekly Active Users</span></div>
                            <span class="card-row-value">${totalUsers}</span>
                        </div>
                        <div class="card-row">
                            <div class="card-row-label">${ICONS.clock}<span>Total Hours</span></div>
                            <span class="card-row-value">${formatNum(hoursNum)}</span>
                        </div>
                        <div class="card-row">
                            <div class="card-row-label">${ICONS.barChart}<span>Avg / Labeler</span></div>
                            <span class="card-row-value">${avg}</span>
                        </div>
                        <div class="card-row card-row-divider">
                            <div class="card-row-label">${ICONS.target}<span>Weekly Target</span></div>
                            <span class="card-row-value">${TARGET_WEEKLY.toLocaleString()}</span>
                        </div>
                    </div>
                `;
                cardsGrid.appendChild(card);
            });

        // ----- DAILY VIEW LOGIC -----
        } else {
            days.forEach((item, index) => {
                const diffNum  = parseFloat(item.diff);
                const hoursNum = parseFloat(item.totalHours);
                const pct      = Math.min((hoursNum / TARGET_DAILY) * 100, 100);
                const isOver   = diffNum >= 0;

                let accentClass = "card-accent-default";
                if (item.isFriday) accentClass = "";
                else if (isOver)  accentClass = "card-accent-over";
                else              accentClass = "card-accent-under";

                let fillClass = "fill-default";
                if (item.isFriday) fillClass = "";
                else if (isOver)   fillClass = "fill-over";
                else               fillClass = "fill-under";

                const card = document.createElement("div");
                card.className = "card" + (item.isFriday ? " card-friday" : "") + " " + accentClass;
                card.style.animationDelay = `${index * 40}ms`;

                card.innerHTML = `
                    <div class="card-accent">
                        <div class="card-accent-inner"></div>
                    </div>
                    <div class="card-header">
                        <div class="card-header-left">
                            <div class="card-date-icon">${ICONS.calendar}</div>
                            <div class="card-date-info">
                                <div class="card-date-text">${escapeHtml(item.date)}</div>
                                <div class="card-day-row">
                                    <span class="card-day-name">${escapeHtml(item.dayName)}</span>
                                    ${item.isFriday ? '<span class="friday-badge">FRIDAY</span>' : ""}
                                </div>
                            </div>
                        </div>
                        <div class="card-diff-badge ${isOver ? "positive" : "negative"}">
                            ${isOver ? ICONS.trendUp : ICONS.trendDown}
                            <span>${diffNum > 0 ? "+" : ""}${formatNum(Math.abs(diffNum))}</span>
                        </div>
                    </div>
                    <div class="card-progress-section">
                        <div class="card-progress-header">
                            <span class="card-progress-label">Daily Target Progress</span>
                            <span class="card-progress-pct">${pct.toFixed(1)}%</span>
                        </div>
                        <div class="card-progress-track">
                            <div class="card-progress-fill ${fillClass}" data-width="${pct}"></div>
                        </div>
                    </div>
                    <div class="card-data-rows">
                        <div class="card-row">
                            <div class="card-row-label">${ICONS.users}<span>Active Users</span></div>
                            <span class="card-row-value">${item.totalUsers}</span>
                        </div>
                        <div class="card-row">
                            <div class="card-row-label">${ICONS.clock}<span>Total Hours</span></div>
                            <span class="card-row-value">${formatNum(hoursNum)}</span>
                        </div>
                        <div class="card-row">
                            <div class="card-row-label">${ICONS.barChart}<span>Avg / Labeler</span></div>
                            <span class="card-row-value">${item.avg}</span>
                        </div>
                        <div class="card-row card-row-divider">
                            <div class="card-row-label">${ICONS.target}<span>Daily Target</span></div>
                            <span class="card-row-value">${TARGET_DAILY.toLocaleString()}</span>
                        </div>
                    </div>
                `;
                cardsGrid.appendChild(card);
            });
        }

        /* Animate progress bars and accent stripes after paint */
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                const fills = cardsGrid.querySelectorAll(".card-progress-fill");
                fills.forEach((fill) => {
                    const w = fill.getAttribute("data-width");
                    fill.style.width = w + "%";
                });

                const allCards = cardsGrid.querySelectorAll(".card");
                allCards.forEach((c, i) => {
                    setTimeout(() => c.classList.add("loaded"), i * 40 + 100);
                });
            });
        });
    }

    /* ================================================================
       HELPERS
       ================================================================ */
    function formatNum(n, decimals) {
        if (typeof decimals === "undefined") decimals = 2;
        return Number(n).toLocaleString(undefined, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        });
    }

    function escapeHtml(str) {
        const div = document.createElement("div");
        div.textContent = str;
        return div.innerHTML;
    }

    /* ================================================================
       INIT
       ================================================================ */
    initTheme();
    checkAuth();

})();
