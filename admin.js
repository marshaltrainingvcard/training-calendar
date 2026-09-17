const adminAPI =
  "https://script.google.com/macros/s/AKfycbxHw3aAV9V3o6LVt4QOdyHpkyaDwja_06miyPCNaPx9qHFrJ32m-I3JkCxZcVtHbge1kg/exec";

let currentCourses = [];
let filteredCourses = [];
let currentPage = 1;
const perPage = 15;

// ===============================
// LOAD EXISTING COURSES
// ===============================
async function loadCourses() {
    const res = await fetch(adminAPI + "?action=list");
    currentCourses = await res.json();
    applyFilter();
}

// ===============================
// RENDER COURSES
// ===============================
function renderCourses(list) {
    const tbody = document.querySelector("#courseTable tbody");
    tbody.innerHTML = "";

    const start = (currentPage - 1) * perPage;
    const end = start + perPage;
    const pageItems = list.slice(start, end);

    pageItems.forEach((course, index) => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${course.course_title}</td>
            <td>${formatPrettyDate(course.start_date)}</td>
            <td>${formatPrettyDate(course.end_date)}</td>
            <td>${course.location}</td>
            <td>${course.currency} ${course.fees}</td>
            <td>${course.category}</td>
            <td>
                <button class="edit-btn" onclick="editCourse(${index + start})">Edit</button>
                <button class="delete-btn" onclick="confirmDelete(${index + start})">Delete</button>
            </td>
        `;

        tbody.appendChild(row);
    });

    renderPagination(list.length);
}

// ===============================
// PAGINATION
// ===============================
function renderPagination(total) {
    const pages = Math.ceil(total / perPage);
    const container = document.getElementById("pagination");
    container.innerHTML = "";

    for (let i = 1; i <= pages; i++) {
        const btn = document.createElement("button");
        btn.innerText = i;
        btn.className = (i === currentPage) ? "active-page" : "";
        btn.onclick = () => {
            currentPage = i;
            renderCourses(filteredCourses);
        };
        container.appendChild(btn);
    }
}

// ===============================
// FILTERS
// ===============================
function applyFilter() {
    const cat = document.getElementById("filterCategory").value;
    const loc = document.getElementById("filterLocation").value;

    filteredCourses = currentCourses;

    if (cat) filteredCourses = filteredCourses.filter(c => c.category === cat);
    if (loc) filteredCourses = filteredCourses.filter(c => c.location === loc);

    currentPage = 1;
    renderCourses(filteredCourses);
}

// ===============================
// DELETE COURSE (with confirmation)
// ===============================
function confirmDelete(index) {
    if (confirm("Are you sure you want to delete this course?")) {
        deleteCourse(index);
    }
}

async function deleteCourse(index) {
    await fetch(adminAPI + "?action=delete&row=" + index);
    loadCourses();
}

// ===============================
// ADD COURSE
// ===============================
document.getElementById("addCourseForm").onsubmit = async (e) => {
    e.preventDefault();

    const payload = {
        course_title: document.getElementById("course_title").value,
        start_date: document.getElementById("start_date").value,
        end_date: document.getElementById("end_date").value,
        location: document.getElementById("location").value,
        fees: document.getElementById("fees").value,
        currency: document.getElementById("currency").value,
        category: document.getElementById("category").value,
        course_link: document.getElementById("course_link").value
    };

    await fetch(adminAPI + "?action=add", {
        method: "POST",
        body: JSON.stringify(payload)
    });

    document.getElementById("addSuccess").style.display = "block";
    document.getElementById("addCourseForm").reset();

    loadCourses();
};

// ===============================
// EDIT COURSE
// ===============================
let editIndex = null;

function toInputDate(d) {
    if (!d) return "";
    d = String(d).trim();

    if (d.includes("T")) {
        const iso = new Date(d);
        if (!isNaN(iso)) {
            const year = iso.getUTCFullYear();
            const month = String(iso.getUTCMonth() + 1).padStart(2, "0");
            const day = String(iso.getUTCDate()).padStart(2, "0");
            return `${year}-${month}-${day}`;
        }
    }

    const parts = d.split("-");
    if (parts.length === 3) {
        return `${parts[0]}-${parts[1].padStart(2, "0")}-${parts[2].padStart(2, "0")}`;
    }

    const date = new Date(d);
    if (!isNaN(date)) {
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, "0");
        const day = String(date.getUTCDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    }

    return "";
}

function editCourse(index) {
    editIndex = index;
    const course = currentCourses[index];

    document.getElementById("edit_course_title").value = course.course_title;
    document.getElementById("edit_start_date").value = toInputDate(course.start_date);
    document.getElementById("edit_end_date").value = toInputDate(course.end_date);
    document.getElementById("edit_location").value = course.location;
    document.getElementById("edit_fees").value = course.fees;
    document.getElementById("edit_currency").value = course.currency;
    document.getElementById("edit_category").value = course.category;
    document.getElementById("edit_course_link").value = course.course_link;

    document.getElementById("editModal").style.display = "block";
}

function closeEdit() {
    document.getElementById("editModal").style.display = "none";
}

async function saveEdit() {
    if (!confirm("Are you sure you want to save these changes?")) return;

    const payload = {
        row: editIndex,
        course_title: document.getElementById("edit_course_title").value,
        start_date: document.getElementById("edit_start_date").value,
        end_date: document.getElementById("edit_end_date").value,
        location: document.getElementById("edit_location").value,
        fees: document.getElementById("edit_fees").value,
        currency: document.getElementById("edit_currency").value,
        category: document.getElementById("edit_category").value,
        course_link: document.getElementById("edit_course_link").value
    };

    await fetch(adminAPI + "?action=edit", {
        method: "POST",
        body: JSON.stringify(payload)
    });

    closeEdit();
    loadCourses();
}

// ===============================
// DATE FORMATTER
// ===============================
function formatPrettyDate(d) {
    if (!d) return "";
    d = String(d).trim();

    if (d.includes("T")) {
        const iso = new Date(d);
        if (!isNaN(iso)) {
            const day = String(iso.getUTCDate()).padStart(2, "0");
            const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            const month = months[iso.getUTCMonth()];
            const year = iso.getUTCFullYear();
            return `${day} ${month} ${year}`;
        }
    }

    const parts = d.split("-");
    if (parts.length === 3) {
        const year = parts[0];
        const month = parts[1];
        const day = parts[2];
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        return `${day} ${months[Number(month) - 1]} ${year}`;
    }

    return d;
}

// ===============================
// RUN AFTER PAGE LOADS
// ===============================
document.addEventListener("DOMContentLoaded", loadCourses);
