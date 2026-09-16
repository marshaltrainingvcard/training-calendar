const sheetURL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vShZHjeKaVqGU0_iGOCzd3VHSstzPN4EX-nK_vDOswp1ryvkiW_o-DhxIofeXqMzD15jM_0ovhhRXeY/pub?output=csv";

const apiURL =
  "https://script.google.com/macros/s/AKfycbxHw3aAV9V3o6LVt4QOdyHpkyaDwja_06miyPCNaPx9qHFrJ32m-I3JkCxZcVtHbge1kg/exec";

const calendar = document.getElementById("calendar");
const pagination = document.getElementById("pagination");
const itemsPerPage = 10;
let currentPage = 1;
let allCourses = [];

// Modal
const modal = document.getElementById("courseModal");
const closeModal = document.getElementById("closeModal");

closeModal.onclick = () => (modal.style.display = "none");
window.onclick = (e) => {
  if (e.target === modal) modal.style.display = "none";
};

// Load CSV
async function loadCourses() {
  const res = await fetch(sheetURL);
  const text = await res.text();

  const rows = text.trim().split("\n").map((r) => r.split(","));
  const headers = rows[0].map((h) => h.trim());

  allCourses = rows.slice(1).map((row) => {
    let obj = {};
    headers.forEach((h, i) => {
      obj[h] = row[i] ? row[i].trim() : "";
    });
    return obj;
  });

  populateFilters();
  renderCalendar();
  renderPagination();
}

function populateFilters() {
  const monthFilter = document.getElementById("monthFilter");
  const locationFilter = document.getElementById("locationFilter");
  const categoryFilter = document.getElementById("categoryFilter");

  const months = new Set();
  const locations = new Set();
  const categories = new Set();

  allCourses.forEach((c) => {
    const d = new Date(c.start_date);
    if (!isNaN(d)) {
      months.add(
        `${d.toLocaleString("default", { month: "long" })} ${d.getFullYear()}`
      );
    }
    if (c.location) locations.add(c.location);
    if (c.category) categories.add(c.category);
  });

  months.forEach((m) => {
    const opt = document.createElement("option");
    opt.value = m;
    opt.textContent = m;
    monthFilter.appendChild(opt);
  });

  locations.forEach((l) => {
    const opt = document.createElement("option");
    opt.value = l;
    opt.textContent = l;
    locationFilter.appendChild(opt);
  });

  categories.forEach((c) => {
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c;
    categoryFilter.appendChild(opt);
  });
}

document.getElementById("searchBar").addEventListener("input", applyFilters);
document.getElementById("monthFilter").addEventListener("change", applyFilters);
document.getElementById("locationFilter").addEventListener("change", applyFilters);
document.getElementById("categoryFilter").addEventListener("change", applyFilters);

function applyFilters() {
  const search = document.getElementById("searchBar").value.toLowerCase();
  const month = document.getElementById("monthFilter").value;
  const location = document.getElementById("locationFilter").value;
  const category = document.getElementById("categoryFilter").value;

  let filtered = allCourses.filter((c) => {
    const d = new Date(c.start_date);
    const courseMonth = `${d.toLocaleString("default", {
      month: "long",
    })} ${d.getFullYear()}`;

    const matchesSearch = c.course_title.toLowerCase().includes(search);
    const matchesMonth = month ? courseMonth === month : true;
    const matchesLocation = location ? c.location === location : true;
    const matchesCategory = category ? c.category === category : true;

    return matchesSearch && matchesMonth && matchesLocation && matchesCategory;
  });

  currentPage = 1;
  renderCalendar(filtered);
  renderPagination(filtered);
}

function groupByMonth(items) {
  const grouped = {};
  items.forEach((s) => {
    const date = new Date(s.start_date);
    if (isNaN(date)) return;
    const monthName = `${date.toLocaleString("default", {
      month: "long",
    })} ${date.getFullYear()}`;
    if (!grouped[monthName]) grouped[monthName] = [];
    grouped[monthName].push(s);
  });
  return grouped;
}

function formatDate(start, end) {
  const s = new Date(start);
  const e = new Date(end);

  if (isNaN(s) || isNaN(e)) return `${start} - ${end}`;

  const format = (d) =>
    `${String(d.getDate()).padStart(2, "0")} ${d.toLocaleString("default", {
      month: "short",
    })} ${d.getFullYear()}`;

  return `${format(s)} - ${format(e)}`;
}

function renderCalendar(courseList = allCourses) {
  calendar.innerHTML = "";

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = courseList.slice(startIndex, startIndex + itemsPerPage);

  const grouped = groupByMonth(paginatedItems);

  Object.keys(grouped).forEach((month) => {
    grouped[month].sort(
      (a, b) => new Date(a.start_date) - new Date(b.start_date)
    );
  });

  Object.keys(grouped).forEach((month) => {
    const monthHeader = document.createElement("div");
    monthHeader.className = "month-header";
    monthHeader.textContent = month;
    calendar.appendChild(monthHeader);

    grouped[month].forEach((course) => {
      const session = document.createElement("div");
      session.className = "session";

      session.innerHTML = `
        <div class="session-title">${course.course_title}</div>
        <div class="session-columns">
            <div class="col col-date">${formatDate(
              course.start_date,
              course.end_date
            )}</div>
            <div class="col">${course.location}</div>
            <div class="col col-fees">${course.currency || "AED"} ${
        course.fees
      }</div>
        </div>
      `;

      session.addEventListener("click", () => openCourseModal(course));
      calendar.appendChild(session);
    });
  });
}

function renderPagination(courseList = allCourses) {
  const totalPages = Math.ceil(courseList.length / itemsPerPage);
  pagination.innerHTML = "";

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("span");
    btn.className = "page-btn" + (i === currentPage ? " active" : "");
    btn.textContent = i;
    btn.addEventListener("click", () => {
      currentPage = i;
      renderCalendar(courseList);
      renderPagination(courseList);
    });
    pagination.appendChild(btn);
  }
}

function openCourseModal(course) {
  document.getElementById("modalTitle").innerText = course.course_title;
  document.getElementById("modalTitleLink").href = course.course_link || "#";

  document.getElementById("modalDate").innerText = formatDate(
    course.start_date,
    course.end_date
  );
  document.getElementById("modalLocation").innerText = course.location;
  document.getElementById("modalFees").innerText = `${
    course.currency || "AED"
  } ${course.fees}`;

  const registerBtn = document.getElementById("modalRegister");
  const termsCheck = document.getElementById("termsCheck");

  document.getElementById("registrationForm").reset();
  registerBtn.classList.remove("enabled");
  termsCheck.checked = false;

  termsCheck.onchange = () => {
    if (termsCheck.checked) registerBtn.classList.add("enabled");
    else registerBtn.classList.remove("enabled");
  };

  document.getElementById("registrationForm").onsubmit = async (e) => {
    e.preventDefault();
    if (!termsCheck.checked) return;

    const payload = {
      course: course.course_title,
      date: formatDate(course.start_date, course.end_date),
      location: course.location,
      fees: `${course.currency || "AED"} ${course.fees}`,
      name: document.getElementById("regName").value,
      email: document.getElementById("regEmail").value,
      company: document.getElementById("regCompany").value,
      position: document.getElementById("regPosition").value,
      phone: document.getElementById("regPhone").value,
    };

    const response = await fetch(apiURL, {
      method: "POST",
      body: JSON.stringify(payload),
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
