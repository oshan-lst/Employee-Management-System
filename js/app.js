console.log("hello");


const $ = id => document.getElementById(id);

const state = {
  employees: [],
  departments: [],
  designations: [],
  editingId: null,
  employeesLoaded: false,
  departmentsLoaded: false
};

const employeeModal = new bootstrap.Modal(
  $("employeeModal")
);

const viewModal = new bootstrap.Modal(
  $("viewModal")
);

function escapeHTML(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]
  );
}

function toList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.employees)) return data.employees;
  return [];
}

function getEmployeeId(employee) {
  return employee.id ??
    employee.employeeId ??
    employee.empId;
}

function getDepartmentId(department) {
  return department.departmentId ??
    department.deptId ??
    department.id;
}

function getDepartmentName(department) {
  return department.departmentName ??
    department.deptName ??
    department.name ??
    "Unnamed Department";
}

function getDesignationId(designation) {
  return designation.designationId ??
    designation.desigId ??
    designation.id;
}

function getDesignationName(designation) {
  return designation.designationName ??
    designation.desigName ??
    designation.name ??
    "Unnamed Designation";
}

function showAlert(message, type = "danger") {
  const alert = $("alertBox");

  alert.className = `alert alert-${type}`;
  alert.textContent = message;

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

function clearAlert() {
  $("alertBox").className = "alert d-none";
  $("alertBox").textContent = "";
}

function setAPIStatus(connected) {
  const status = $("apiStatus");

  status.className = connected
    ? "api-status online"
    : "api-status offline";

  status.innerHTML = `
    <span class="status-dot"></span>
    ${connected ? "API Connected" : "API Unavailable"}
  `;
}

function setSidebar(open) {
  $("sidebar").classList.toggle("open", open);
  $("sidebarOverlay").classList.toggle("show", open);
}

function navigate(page) {
  document.querySelectorAll(".page-section")
    .forEach(section => {
      section.classList.add("d-none");
    });

  $(`${page}Page`).classList.remove("d-none");

  document.querySelectorAll(".nav-item")
    .forEach(button => {
      button.classList.toggle(
        "active",
        button.dataset.page === page
      );
    });

  const titles = {
    dashboard: "Dashboard",
    employees: "Employees",
    departments: "Departments",
    designations: "Designations"
  };

  $("pageTitle").textContent = titles[page];

  setSidebar(false);
  clearAlert();
}

function emptyState(message) {
  return `
    <div class="empty-state">
      <i class="bi bi-inbox"></i>
      <p>${escapeHTML(message)}</p>
    </div>
  `;
}

function departmentNameById(id) {
  const department = state.departments.find(item =>
    String(getDepartmentId(item)) === String(id)
  );

  return department
    ? getDepartmentName(department)
    : (id ? `Department #${id}` : "—");
}

function employeeTableHTML(employees, actions = true) {
  if (!employees.length) {
    return emptyState("No employees found.");
  }

  return `
    <div class="table-responsive">
      <table class="employee-table">
        <thead>
          <tr>
            <th>EMPLOYEE</th>
            <th>PHONE</th>
            <th>DEPARTMENT</th>
            <th>TYPE</th>
            ${actions ? "<th>ACTIONS</th>" : ""}
          </tr>
        </thead>

        <tbody>
          ${employees.map(employee => {
            const id = getEmployeeId(employee);
            const name = employee.fullName || "Unnamed";
            const initial = name.trim().charAt(0).toUpperCase();

            return `
              <tr>
                <td>
                  <div class="employee-info">
                    <div class="employee-avatar">
                      ${escapeHTML(initial)}
                    </div>

                    <div>
                      <div class="employee-name">
                        ${escapeHTML(name)}
                      </div>

                      <div class="employee-email">
                        ${escapeHTML(employee.email || "—")}
                      </div>
                    </div>
                  </div>
                </td>

                <td>${escapeHTML(employee.phone || "—")}</td>

                <td>
                  ${escapeHTML(
                    employee.departmentName ||
                    departmentNameById(employee.departmentId)
                  )}
                </td>

                <td>
                  <span class="type-badge">
                    ${escapeHTML(employee.employeeType || "—")}
                  </span>
                </td>

                ${actions ? `
                  <td>
                    <div class="action-buttons">
                      <button class="action-btn"
                              data-view="${escapeHTML(id)}"
                              title="View">
                        <i class="bi bi-eye"></i>
                      </button>

                      <button class="action-btn"
                              data-edit="${escapeHTML(id)}"
                              title="Edit">
                        <i class="bi bi-pencil"></i>
                      </button>

                      <button class="action-btn delete"
                              data-delete="${escapeHTML(id)}"
                              title="Delete">
                        <i class="bi bi-trash"></i>
                      </button>
                    </div>
                  </td>
                ` : ""}
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderEmployees() {
  const query = $("searchInput").value
    .toLowerCase()
    .trim();

  const filtered = state.employees.filter(employee => {
    const searchable = [
      employee.fullName,
      employee.email,
      employee.phone,
      employee.employeeType,
      employee.departmentName,
      departmentNameById(employee.departmentId)
    ];

    return searchable.some(value =>
      String(value ?? "")
        .toLowerCase()
        .includes(query)
    );
  });

  $("employeeCount").textContent =
    `${filtered.length} employees found`;

  $("employeeTable").innerHTML =
    employeeTableHTML(filtered);

  $("recentEmployees").innerHTML =
    employeeTableHTML(
      state.employees.slice(-5).reverse(),
      false
    );

  $("statEmployees").textContent =
    state.employees.length;
}

function renderDepartments() {
  $("statDepartments").textContent =
    state.departments.length;

  $("departmentGrid").innerHTML =
    state.departments.length
      ? state.departments.map(department => `
          <div class="info-card">
            <i class="bi bi-diagram-3"></i>
            <div>
              <h4>
                ${escapeHTML(getDepartmentName(department))}
              </h4>
              <small>
                ID: ${escapeHTML(getDepartmentId(department))}
              </small>
            </div>
          </div>
        `).join("")
      : emptyState("No departments found.");

  const options = state.departments.map(department => `
    <option value="${escapeHTML(getDepartmentId(department))}">
      ${escapeHTML(getDepartmentName(department))}
    </option>
  `).join("");

  $("departmentId").innerHTML =
    '<option value="">Select Department</option>' + options;

  $("designationDept").innerHTML =
    '<option value="">Select Department</option>' + options;
}

async function loadDesignations(departmentId, target) {
  const element = $(target);

  if (!departmentId) {
    if (target === "designationId") {
      element.innerHTML =
        '<option value="">Select Designation</option>';
    } else {
      element.innerHTML =
        emptyState("Select a department first.");

      $("statDesignations").textContent = "—";
    }

    return;
  }

  try {
    const response = await API.getDesignations(departmentId);
    const designations = toList(response);

    state.designations = designations;

    if (target === "designationId") {
      element.innerHTML =
        '<option value="">Select Designation</option>' +
        designations.map(designation => `
          <option value="${escapeHTML(getDesignationId(designation))}">
            ${escapeHTML(getDesignationName(designation))}
          </option>
        `).join("");

    } else {
      $("statDesignations").textContent =
        designations.length;

      element.innerHTML = designations.length
        ? designations.map(designation => `
            <div class="info-card">
              <i class="bi bi-person-badge"></i>
              <div>
                <h4>
                  ${escapeHTML(getDesignationName(designation))}
                </h4>
                <small>
                  ID: ${escapeHTML(getDesignationId(designation))}
                </small>
              </div>
            </div>
          `).join("")
        : emptyState("No designations found.");
    }

  } catch (error) {
    showAlert(error.message);

    element.innerHTML = target === "designationId"
      ? '<option value="">Unavailable</option>'
      : emptyState("Could not load designations.");
  }
}

async function loadEmployees() {
  try {
    const response = await API.getEmployees();

    state.employees = toList(response);
    state.employeesLoaded = true;

    renderEmployees();
  } catch (error) {
    state.employeesLoaded = false;

    $("employeeTable").innerHTML =
      emptyState("Employee API unavailable.");

    $("recentEmployees").innerHTML =
      emptyState("Could not load employees.");

    $("statEmployees").textContent = "—";

    throw error;
  }
}

async function loadDepartments() {
  try {
    const response = await API.getDepartments();

    state.departments = toList(response);
    state.departmentsLoaded = true;

    renderDepartments();
  } catch (error) {
    state.departmentsLoaded = false;

    $("departmentGrid").innerHTML =
      emptyState("Department API unavailable.");

    $("statDepartments").textContent = "—";

    throw error;
  }
}

async function refreshData() {
  const results = await Promise.allSettled([
    loadEmployees(),
    loadDepartments()
  ]);

  const failed = results.filter(
    result => result.status === "rejected"
  );

  setAPIStatus(failed.length === 0);

  if (failed.length) {
    showAlert(
      failed.map(result => result.reason.message).join(" | ")
    );
  } else {
    clearAlert();
  }
}

function resetEmployeeForm() {
  $("employeeForm").reset();

  state.editingId = null;

  $("modalTitle").textContent = "Add Employee";
  $("saveBtn").textContent = "Save Employee";

  $("designationId").innerHTML =
    '<option value="">Select Designation</option>';
}

function openAddEmployee() {
  resetEmployeeForm();
  employeeModal.show();
}

async function fetchEmployee(id) {
  const response = await API.getEmployee(id);

  const record = response &&
    !Array.isArray(response) &&
    typeof response === "object"
      ? response
      : null;

  if (record && (record.fullName || record.email)) {
    return record;
  }

  const fallback = state.employees.find(employee =>
    String(getEmployeeId(employee)) === String(id)
  );

  if (!fallback) {
    throw new Error("Employee not found.");
  }

  return fallback;
}

async function openEditEmployee(id) {
  try {
    const employee = await fetchEmployee(id);

    resetEmployeeForm();

    state.editingId = id;

    $("modalTitle").textContent = "Edit Employee";

    const fields = [
      "fullName",
      "email",
      "phone",
      "gender",
      "employeeType",
      "salary",
      "departmentId"
    ];

    fields.forEach(field => {
      $(field).value = employee[field] ?? "";
    });

    $("dateOfJoining").value =
      employee.dateOfJoining
        ? String(employee.dateOfJoining).slice(0, 10)
        : "";

    if (employee.departmentId) {
      await loadDesignations(
        employee.departmentId,
        "designationId"
      );

      $("designationId").value =
        employee.designationId ?? "";
    }

    employeeModal.show();

  } catch (error) {
    showAlert(error.message);
  }
}

async function openViewEmployee(id) {
  try {
    const employee = await fetchEmployee(id);

    const details = [
      ["Full Name", employee.fullName],
      ["Email", employee.email],
      ["Phone", employee.phone],
      ["Gender", employee.gender],
      ["Date of Joining",
        employee.dateOfJoining
          ? String(employee.dateOfJoining).slice(0, 10)
          : "—"
      ],
      ["Department",
        employee.departmentName ||
        departmentNameById(employee.departmentId)
      ],
      ["Employee Type", employee.employeeType],
      ["Salary", employee.salary]
    ];

    $("employeeDetails").innerHTML =
      details.map(([label, value]) => `
        <div class="detail-row">
          <span>${escapeHTML(label)}</span>
          <strong>${escapeHTML(value ?? "—")}</strong>
        </div>
      `).join("");

    viewModal.show();

  } catch (error) {
    showAlert(error.message);
  }
}

async function deleteEmployee(id) {
  const employee = state.employees.find(item =>
    String(getEmployeeId(item)) === String(id)
  );

  const confirmed = confirm(
    `Delete ${employee?.fullName || "this employee"}?`
  );

  if (!confirmed) return;

  try {
    await API.deleteEmployee(id);
    await refreshData();

    if (state.employeesLoaded) {
      showAlert(
        "Employee deleted successfully.",
        "success"
      );
    }

  } catch (error) {
    showAlert(error.message);
  }
}

async function saveEmployee(event) {
  event.preventDefault();

  const form = $("employeeForm");

  if (!form.reportValidity()) return;

  const fullName = $("fullName").value.trim();
  const email = $("email").value.trim();

  if (!fullName || !email) {
    showAlert("Full name and email are required.");
    return;
  }

  const employee = {
    fullName,
    email,
    phone: $("phone").value.trim(),
    gender: $("gender").value,
    dateOfJoining: $("dateOfJoining").value
      ? new Date(
          $("dateOfJoining").value + "T00:00:00"
        ).toISOString()
      : null,
    departmentId: $("departmentId").value
      ? Number($("departmentId").value)
      : null,
    designationId: $("designationId").value
      ? Number($("designationId").value)
      : null,
    employeeType: $("employeeType").value,
    salary: $("salary").value
      ? Number($("salary").value)
      : null
  };

  const button = $("saveBtn");

  button.disabled = true;
  button.textContent = "Saving...";

  try {
    if (state.editingId !== null) {
      await API.updateEmployee(
        state.editingId,
        employee
      );
    } else {
      await API.createEmployee(employee);
    }

    employeeModal.hide();

    await refreshData();

    if (state.employeesLoaded) {
      showAlert(
        "Employee saved successfully.",
        "success"
      );
    }

  } catch (error) {
    showAlert(error.message);
  } finally {
    button.disabled = false;
    button.textContent = "Save Employee";
  }
}

document.addEventListener("click", event => {
  const navigation = event.target.closest("[data-page]");

  if (navigation) {
    navigate(navigation.dataset.page);
  }

  if (event.target.closest("[data-add]")) {
    openAddEmployee();
  }

  const viewButton = event.target.closest("[data-view]");

  if (viewButton) {
    openViewEmployee(viewButton.dataset.view);
  }

  const editButton = event.target.closest("[data-edit]");

  if (editButton) {
    openEditEmployee(editButton.dataset.edit);
  }

  const deleteButton = event.target.closest("[data-delete]");

  if (deleteButton) {
    deleteEmployee(deleteButton.dataset.delete);
  }
});

$("employeeForm").addEventListener(
  "submit",
  saveEmployee
);

$("searchInput").addEventListener(
  "input",
  renderEmployees
);

$("departmentId").addEventListener(
  "change",
  event => {
    loadDesignations(
      event.target.value,
      "designationId"
    );
  }
);

$("designationDept").addEventListener(
  "change",
  event => {
    loadDesignations(
      event.target.value,
      "designationGrid"
    );
  }
);

$("refreshDepartments").addEventListener(
  "click",
  async () => {
    try {
      await loadDepartments();
      showAlert("Departments refreshed.", "success");
    } catch (error) {
      showAlert(error.message);
    }
  }
);

$("menuBtn").addEventListener("click", () => {
  const open = !$("sidebar").classList.contains("open");
  setSidebar(open);
});

$("sidebarOverlay").addEventListener(
  "click",
  () => setSidebar(false)
);

$("designationGrid").innerHTML =
  emptyState("Select a department first.");

refreshData();

