const sheetURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vShZHjeKaVqGU0_iGOCzd3VHSstzPN4EX-nK_vDOswp1ryvkiW_o-DhxIofeXqMzD15jM_0ovhhRXeY/pub?output=csv";

let currentPage = 1;
const itemsPerPage = 10;
let globalSessions = [];

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

function formatDate(startStr, endStr) {
    const start = new Date(startStr);
    const end = new Date(endStr);

    const startDay = start.getDate();
    const endDay = end.getDate();

    const startMonth = start.toLocaleString("default", { month: "short" });
    const endMonth = end.toLocaleString("default", { month: "short" });

    const startYear = start.getFullYear();
    const endYear = end.getFullYear();

    // If same month & same year → normal format
    if (startMonth === endMonth && startYear === endYear) {
        return `${startDay} - ${endDay} ${startMonth} ${startYear}`;
    }

    // If different month but same year
    if (startYear === endYear) {
        return `${startDay} ${startMonth} - ${endDay} ${endMonth} ${startYear}`;
    }

    // If different year
    return `${startDay} ${startMonth} ${startYear} - ${endDay} ${endMonth} ${endYear}`;
}

function applySearchFilter(sessions) {
    const searchValue = document.getElementById("search").value.toLowerCase();

    if (!searchValue) return sessions;

    return sessions.filter(s =>
        s.course_title.toLowerCase().includes(searchValue) ||
        s.location.toLowerCase().includes(searchValue) ||
        s.category.toLowerCase().includes(searchValue)
    );
}

function renderCalendar(sessions) {
    const calendar = document.getElementById("calendar");
    calendar.innerHTML = "";

    const monthFilter = document.getElementById("filter-month").value;
    const locationFilter = document.getElementById("filter-location").value;
    const categoryFilter = document.getElementById("filter-category").value;

    let filtered = sessions.filter(s => {
        const monthName = new Date(s.start_date).toLocaleString("default", { month: "long", year: "numeric" });

        return (!monthFilter || monthFilter === monthName) &&
               (!locationFilter || locationFilter === s.location) &&
               (!categoryFilter || categoryFilter === s.category);
    });

    filtered = applySearchFilter(filtered);

    const totalItems = filtered.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;

    const paginatedItems = filtered.slice(startIndex, endIndex);

    const grouped = groupByMonth(paginatedItems);

    // Sort courses inside each month by start date
    Object.keys(grouped).forEach(month => {
    grouped[month].sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
});
    
    Object.keys(grouped).forEach(month => {
        calendar.innerHTML += `<div class="month-header">${month}</div>`;

        grouped[month].forEach(s => {
            const link = s.course_link || "#";
            const formattedDate = formatDate(s.start_date, s.end_date);

            calendar.innerHTML += `
                <a href="${link}" target="_blank" style="text-decoration:none; color:inherit;">
                    <div class="session">
                        <div class="session-title">${s.course_title}</div>

                        <div class="session-columns">
                            <div class="col date-col">${formattedDate}</div>
                            <div class="col location-col">${s.location}</div>
                            <div class="col fees-col">AED ${s.fees}</div>
                        </div>
                    </div>
                </a>
            `;
        });
    });

    renderPagination(totalPages);
}

function renderPagination(totalPages) {
    const calendar = document.getElementById("calendar");

    let paginationHTML = `<div class="pagination">`;

    for (let i = 1; i <= totalPages; i++) {
        paginationHTML += `
            <div class="page-btn ${i === currentPage ? "active" : ""}" data-page="${i}">
                ${i}
            </div>
        `;
    }

    paginationHTML += `</div>`;

    calendar.innerHTML += paginationHTML;

    document.querySelectorAll(".page-btn").forEach(btn => {
        btn.onclick = () => {
            currentPage = parseInt(btn.dataset.page);
            renderCalendar(globalSessions);
        };
    });
}

async function init() {
    globalSessions = await loadCSV();
    populateFilters(globalSessions);

    document.querySelectorAll("#filters select").forEach(sel => {
        sel.addEventListener("change", () => {
            currentPage = 1;
            renderCalendar(globalSessions);
        });
    });

    document.getElementById("search").addEventListener("input", () => {
        currentPage = 1;
        renderCalendar(globalSessions);
    });

    renderCalendar(globalSessions);
}

init();
