const STORAGE_KEY = "studentDesk.records.v1";

const sampleStudents = [
  { id: "s1", name: "Aarav Kumar", email: "aarav@example.com", course: "CSE", year: "3", marks: 86, status: "Active" },
  { id: "s2", name: "Priya Sharma", email: "priya@example.com", course: "ECE", year: "2", marks: 92, status: "Active" },
  { id: "s3", name: "Rahul Reddy", email: "rahul@example.com", course: "CSE", year: "4", marks: 78, status: "Inactive" }
];

const $ = (id) => document.getElementById(id);
const dialog = $("studentDialog");
let students = loadStudents();

function loadStudents() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === null ? sampleStudents : JSON.parse(saved);
  } catch {
    return sampleStudents;
  }
}
function saveStudents() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
}
function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}
function render() {
  const query = $("searchInput").value.trim().toLowerCase();
  const course = $("courseFilter").value;
  const status = $("statusFilter").value;
  const filtered = students.filter(s =>
    [s.name, s.email, s.course].some(v => v.toLowerCase().includes(query)) &&
    (!course || s.course === course) &&
    (!status || s.status === status)
  );

  $("totalCount").textContent = students.length;
  $("activeCount").textContent = students.filter(s => s.status === "Active").length;
  $("averageMark").textContent = students.length
    ? (students.reduce((sum, s) => sum + Number(s.marks), 0) / students.length).toFixed(1)
    : "—";

  const courses = [...new Set(students.map(s => s.course))].sort();
  const currentCourse = $("courseFilter").value;
  $("courseFilter").innerHTML = '<option value="">All courses</option>' +
    courses.map(c => `<option value="${escapeHTML(c)}">${escapeHTML(c)}</option>`).join("");
  $("courseFilter").value = courses.includes(currentCourse) ? currentCourse : "";

  $("studentTableBody").innerHTML = filtered.map(s => `
    <tr>
      <td><div class="student-cell"><div class="avatar">${escapeHTML(s.name.charAt(0).toUpperCase())}</div>
        <div><div class="student-name">${escapeHTML(s.name)}</div><div class="student-email">${escapeHTML(s.email)}</div></div></div></td>
      <td>${escapeHTML(s.course)}</td><td>Year ${escapeHTML(s.year)}</td><td>${Number(s.marks)}%</td>
      <td><span class="status-pill ${s.status.toLowerCase()}">${escapeHTML(s.status)}</span></td>
      <td><button class="action-btn" data-action="edit" data-id="${s.id}">Edit</button>
      <button class="action-btn delete" data-action="delete" data-id="${s.id}">Delete</button></td>
    </tr>`).join("");
  $("emptyState").hidden = filtered.length !== 0;
  $("recordCount").textContent = `Showing ${filtered.length} of ${students.length} records`;
}

function openAddDialog() {
  $("studentForm").reset();
  $("studentId").value = "";
  $("dialogTitle").textContent = "Add student";
  $("formError").textContent = "";
  dialog.showModal();
}
function openEditDialog(student) {
  $("studentId").value = student.id;
  $("name").value = student.name;
  $("email").value = student.email;
  $("course").value = student.course;
  $("year").value = student.year;
  $("marks").value = student.marks;
  $("status").value = student.status;
  $("dialogTitle").textContent = "Edit student";
  $("formError").textContent = "";
  dialog.showModal();
}

$("addStudentBtn").addEventListener("click", openAddDialog);
$("closeDialog").addEventListener("click", () => dialog.close());
$("cancelDialog").addEventListener("click", () => dialog.close());
$("searchInput").addEventListener("input", render);
$("courseFilter").addEventListener("change", render);
$("statusFilter").addEventListener("change", render);

$("studentForm").addEventListener("submit", event => {
  event.preventDefault();
  const id = $("studentId").value;
  const student = {
    id: id || (crypto.randomUUID ? crypto.randomUUID() : String(Date.now())),
    name: $("name").value.trim(),
    email: $("email").value.trim(),
    course: $("course").value.trim().toUpperCase(),
    year: $("year").value,
    marks: Number($("marks").value),
    status: $("status").value
  };
  if (!student.name || !student.email || !student.course ||
      !Number.isFinite(student.marks) || student.marks < 0 || student.marks > 100) {
    $("formError").textContent = "Please enter valid details. Marks must be between 0 and 100.";
    return;
  }
  const duplicateEmail = students.some(s => s.email.toLowerCase() === student.email.toLowerCase() && s.id !== id);
  if (duplicateEmail) {
    $("formError").textContent = "A student with this email already exists.";
    return;
  }
  if (id) students = students.map(s => s.id === id ? student : s);
  else students.push(student);
  saveStudents();
  dialog.close();
  render();
});

$("studentTableBody").addEventListener("click", event => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const student = students.find(s => s.id === button.dataset.id);
  if (!student) return;
  if (button.dataset.action === "edit") openEditDialog(student);
  if (button.dataset.action === "delete" && confirm(`Delete ${student.name}'s record?`)) {
    students = students.filter(s => s.id !== student.id);
    saveStudents();
    render();
  }
});

render();
