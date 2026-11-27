
const API = {
  async request(path, options = {}) {
    const controller = new AbortController();

    const timeout = setTimeout(() => {
      controller.abort();
    }, CONFIG.REQUEST_TIMEOUT_MS);

    try {
      const headers = {
        Accept: "application/json"
      };

      if (options.body !== undefined) {
        headers["Content-Type"] = "application/json";
      }

      const response = await fetch(
        CONFIG.API_BASE_URL + path,
        {
          method: options.method || "GET",
          headers,
          signal: controller.signal,
          ...(options.body !== undefined
            ? { body: JSON.stringify(options.body) }
            : {})
        }
      );

      const raw = await response.text();
      let result;

      try {
        result = raw ? JSON.parse(raw) : null;
      } catch {
        result = raw;
      }

      if (!response.ok) {
        throw new Error(
          result?.message ||
          result?.title ||
          `HTTP Error ${response.status}`
        );
      }

      if (result?.result === false) {
        throw new Error(
          result.message || "API request failed"
        );
      }

      if (
        result &&
        typeof result === "object" &&
        "result" in result &&
        "data" in result
      ) {
        return result.data;
      }

      return result;

    } catch (error) {
      if (error.name === "AbortError") {
        throw new Error("API request timed out");
      }

      if (error instanceof TypeError) {
        throw new Error(
          "Cannot connect to API. Check server URL and CORS."
        );
      }

      throw error;
    } finally {
      clearTimeout(timeout);
    }
  },

  getEmployees() {
    return this.request("/GetEmployees");
  },

  getEmployee(id) {
    return this.request(
      "/" + encodeURIComponent(id)
    );
  },

  getDepartments() {
    return this.request("/GetDepartments");
  },

  getDesignations(departmentId) {
    return this.request(
      "/GetDesignationsByDeptId?deptId=" +
      encodeURIComponent(departmentId)
    );
  },

  createEmployee(employee) {
    return this.request("/CreateEmployee", {
      method: "POST",
      body: employee
    });
  },

  updateEmployee(id, employee) {
    return this.request(
      "/UpdateEmployee?id=" + encodeURIComponent(id),
      {
        method: "PUT",
        body: employee
      }
    );
  },

  deleteEmployee(id) {
    return this.request(
      "/DeleteEmployee?id=" + encodeURIComponent(id),
      {
        method: "DELETE"
      }
    );
  }
};
