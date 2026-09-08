const sheetURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vShZHjeKaVqGU0_iGOCzd3VHSstzPN4EX-nK_vDOswp1ryvkiW_o-DhxIofeXqMzD15jM_0ovhhRXeY/pub?output=csv";

async function loadCSV() {
    const response = await fetch(sheetURL);
    const data = await response.text();
    return parseCSV(data);
}

function parseCSV(csv) {
    const rows = csv.split("\n").map(r => r.split(","));
    const headers = rows.shift();

    return rows.map(row => {
        let obj = {};
        headers.forEach((h, i) => obj[h.trim()] = row[i]?.trim());
        return obj;
    });
}

function groupByMonth(sessions) {
    const months = {};

    sessions.forEach(s => {
        const date = new Date(s.start_date);
        const monthName = date.toLocaleString("default", { month: "long", year: "numeric" });

        if (!months[monthName]) months[monthName] = [];
        months[monthName].push(s);
    });

    return months;
}

function populateFilters(sessions) {
    const monthSelect = document.getElementById("filter-month");
    const locationSelect = document.getElementById("filter-location");
    const categorySelect = document.getElementById("filter-category");

    const months = new Set();
    const locations = new Set();
    const categories = new Set();

    sessions.forEach(s => {
        months.add(new Date(s.start_date).toLocaleString("default", { month: "long", year: "numeric" }));
        locations.add(s.location);
        categories.add(s.category);
    });

    months.forEach(m => monthSelect.innerHTML += `<option value="${m}">${m}</option>`);
    locations.forEach(l => locationSelect.innerHTML += `<option value="${l}">${l}</option>`);
    categories.forEach(c => categorySelect.innerHTML += `<option value="${c}">${c}</option>`);
}

function renderCalendar(sessions) {
    const calendar = document.getElementById("calendar");
    calendar.innerHTML = "";

    const monthFilter = document.getElementById("filter-month").value;
    const locationFilter = document.getElementById("filter-location").value;
    const categoryFilter = document.getElementById("filter-category").value;

    const filtered = sessions.filter(s => {
        const monthName = new Date(s.start_date).toLocaleString("default", { month: "long", year: "numeric" });

        return (!monthFilter || monthFilter === monthName) &&
               (!locationFilter || locationFilter === s.location) &&
               (!categoryFilter || categoryFilter === s.category);
    });

    const grouped = groupByMonth(filtered);

    Object.keys(grouped).forEach(month => {
        calendar.innerHTML += `<div class="month-header">${month}</div>`;

        grouped[month].forEach(s => {
            const link = s.course_link || "#";

            calendar.innerHTML += `
                <div class="session">
                    <a class="session-title" href="${link}" target="_blank">${s.course_title}</a>
                    <p><strong>Date:</strong> ${s.start_date} → ${s.end_date}</p>
                    <p><strong>Location:</strong> ${s.location}</p>
                    <p><strong>Fees:</strong> AED ${s.fees}</p>
                </div>
            `;
        });
    });
}

async function init() {
    const sessions = await loadCSV();
    populateFilters(sessions);

    document.querySelectorAll("#filters select").forEach(sel => {
        sel.addEventListener("change", () => renderCalendar(sessions));
    });

    renderCalendar(sessions);
}

init();
