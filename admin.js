const adminAPI =
  "https://script.google.com/macros/s/AKfycbxHw3aAV9V3o6LVt4QOdyHpkyaDwja_06miyPCNaPx9qHFrJ32m-I3JkCxZcVtHbge1kg/exec";

// ===============================
// LOAD EXISTING COURSES
// ===============================
async function loadCourses() {
    const res = await fetch(adminAPI + "?action=list");
    const data = await res.json();

    const tbody = document.querySelector("#courseTable tbody");
    tbody.innerHTML = "";

    data.forEach((course, index) => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${course.course_title}</td>
            <td>${formatDate(course.start_date)}</td>
            <td>${formatDate(course.end_date)}</td>
            <td>${course.location}</td>
            <td>${course.currency} ${course.fees}</td>
            <td>${course.category}</td>
            <td><button class="delete-btn" onclick="deleteCourse(${index})">Delete</button></td>
        `;

        tbody.appendChild(row);
    });
}

// ===============================
// DELETE COURSE
// ===============================
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

// Load courses on page start
loadCourses();
