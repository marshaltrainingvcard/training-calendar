const sheetURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vShZHjeKaVqGU0_iGOCzd3VHSstzPN4EX-nK_vDOswp1ryvkiW_o-DhxIofeXqMzD15jM_0ovhhRXeY/pub?output=csv";
const apiURL = "https://script.google.com/macros/s/AKfycbxHw3aAV9V3o6LVt4QOdyHpkyaDwja_06miyPCNaPx9qHFrJ32m-I3JkCxZcVtHbge1kg/exec";

const calendar = document.getElementById("calendar");
const pagination = document.getElementById("pagination");
const itemsPerPage = 10;
let currentPage = 1;
let allCourses = [];

// Modal
const modal = document.getElementById("courseModal");
const closeModal = document.getElementById("closeModal");

closeModal.onclick = () => modal.style.display = "none";
window.onclick = (e) => { if (e.target === modal) modal.style.display = "none"; };

// Load and parse CSV
async function loadCourses() {
    const res = await fetch(sheetURL);
    const text = await res.text();

    const rows = text.trim().split("\n").map(r => r.split(","));
    const headers = rows[0].map(h => h.trim());

    allCourses = rows.slice(1).map(row => {
        let obj = {};
        headers.forEach((h, i) => {
            obj[h] = row[i] ? row[i].trim() : "";
        });
        return obj;
    });

    renderCalendar();
    renderPagination();
}

function groupByMonth(items) {
    const grouped = {};
    items.forEach(s => {
        const date = new Date(s.start_date);
        if (isNaN(date)) return;
        const monthName = date.toLocaleString("default", { month: "long", year: "numeric" });
        if (!grouped[monthName]) grouped[monthName] = [];
        grouped[monthName].push(s);
    });
    return grouped;
}

function formatDate(start, end) {
    const s = new Date(start);
    const e = new Date(end);
    if (isNaN(s) || isNaN(e)) return `${start} - ${end}`;
    return `${s.toLocaleDateString()} - ${e.toLocaleDateString()}`;
}

function renderCalendar() {
    calendar.innerHTML = "";

    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedItems = allCourses.slice(startIndex, startIndex + itemsPerPage);

    const grouped = groupByMonth(paginatedItems);

    Object.keys(grouped).forEach(month => {
        grouped[month].sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
    });

    Object.keys(grouped).forEach(month => {
        const monthHeader = document.createElement("div");
        monthHeader.className = "month-header";
        monthHeader.textContent = month;
        calendar.appendChild(monthHeader);

        grouped[month].forEach(course => {
            const session = document.createElement("div");
            session.className = "session";

            session.innerHTML = `
                <div class="session-title">${course.course_title}</div>
                <div class="session-columns">
                    <div class="col">${formatDate(course.start_date, course.end_date)}</div>
                    <div class="col">${course.location}</div>
                    <div class="col">${course.currency || "AED"} ${course.fees}</div>
                </div>
            `;

            session.addEventListener("click", () => openCourseModal(course));
            calendar.appendChild(session);
        });
    });
}

function renderPagination() {
    const totalPages = Math.ceil(allCourses.length / itemsPerPage);
    pagination.innerHTML = "";

    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement("span");
        btn.className = "page-btn" + (i === currentPage ? " active" : "");
        btn.textContent = i;
        btn.addEventListener("click", () => {
            currentPage = i;
            renderCalendar();
            renderPagination();
        });
        pagination.appendChild(btn);
    }
}

function openCourseModal(course) {
    document.getElementById("modalTitle").innerText = course.course_title;
    document.getElementById("modalTitleLink").href = course.course_link || "#";

    document.getElementById("modalDate").innerText = formatDate(course.start_date, course.end_date);
    document.getElementById("modalLocation").innerText = course.location;
    document.getElementById("modalFees").innerText = `${course.currency || "AED"} ${course.fees}`;

    const registerBtn = document.getElementById("modalRegister");
    const captchaCheck = document.getElementById("captchaCheck");

    document.getElementById("registrationForm").reset();
    registerBtn.classList.remove("enabled");
    captchaCheck.checked = false;

    captchaCheck.onchange = () => {
        if (captchaCheck.checked) registerBtn.classList.add("enabled");
        else registerBtn.classList.remove("enabled");
    };

    document.getElementById("registrationForm").onsubmit = async (e) => {
        e.preventDefault();
        if (!captchaCheck.checked) return;

        const payload = {
            course: course.course_title,
            date: formatDate(course.start_date, course.end_date),
            location: course.location,
            fees: `${course.currency || "AED"} ${course.fees}`,
            name: document.getElementById("regName").value,
            email: document.getElementById("regEmail").value,
            company: document.getElementById("regCompany").value,
            position: document.getElementById("regPosition").value,
            phone: document.getElementById("regPhone").value
        };

        const response = await fetch(apiURL, {
            method: "POST",
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (result.status === "success") {
            alert("Your registration has been submitted successfully.");
            modal.style.display = "none";
        } else {
            alert("There was an error submitting your registration.");
        }
    };

    modal.style.display = "block";
}

loadCourses();
