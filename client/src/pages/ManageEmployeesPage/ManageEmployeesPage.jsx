import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiUsers, FiSearch, FiPlus, FiEdit2, FiTrash2 } from "react-icons/fi";

import Button from "../../components/Common/Button/Button";
import { apiRequest } from "../../utils/apiUtil";
import styles from "./ManageEmployeesPage.module.css";

function ConfirmDialog({ open, title, message, onCancel, onConfirm }) {
  if (!open) return null;

  const onOverlayKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onCancel();
    }
  };

  const titleId = "confirm-title";

  return (
    <div
      className={styles.modalOverlay}
      onClick={onCancel}
      role="button"
      tabIndex={0}
      aria-label="Close dialog"
      onKeyDown={onOverlayKeyDown}
    >
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHeader}>
          <h4 id={titleId} className={styles.modalTitle}>
            {title}
          </h4>
          <button
            onClick={onCancel}
            aria-label="Close"
            className={styles.modalCloseButton}
            type="button"
          >
            ×
          </button>
        </div>
        <div className={styles.modalBody}>
          <p>{message}</p>
        </div>
        <div className={styles.modalFooter}>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="primary" onClick={onConfirm}>
            Confirm
          </Button>
        </div>
      </div>
    </div>
  );
}

function EmployeeForm({ initial, onSubmit, onCancel, submitting }) {
  const [form, setForm] = useState(
    initial || { firstName: "", lastName: "", email: "", role: "employee" }
  );

  useEffect(() => {
    if (initial) setForm(initial);
  }, [initial]);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit(form);
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.formRow}>
        <div>
          <label htmlFor="firstName" className={styles.fieldLabel}>
            First Name
          </label>
          <input
            id="firstName"
            name="firstName"
            type="text"
            className={styles.txInput}
            value={form.firstName}
            onChange={(e) => update("firstName", e.target.value)}
            required
            autoComplete="given-name"
          />
        </div>
        <div>
          <label htmlFor="lastName" className={styles.fieldLabel}>
            Last Name
          </label>
          <input
            id="lastName"
            name="lastName"
            type="text"
            className={styles.txInput}
            value={form.lastName}
            onChange={(e) => update("lastName", e.target.value)}
            required
            autoComplete="family-name"
          />
        </div>
      </div>
      <div className={styles.formRow}>
        <div>
          <label htmlFor="email" className={styles.fieldLabel}>
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            className={styles.txInput}
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            required
            autoComplete="email"
          />
        </div>
        <div className={styles.selectField}>
          {/* Associate label with select */}
          <label htmlFor="role" className={styles.label}>
            Role
          </label>
          <select
            id="role"
            name="role"
            className={styles.select}
            value={form.role}
            onChange={(e) => update("role", e.target.value)}
          >
            <option value="employee">Employee</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>
      <div className={styles.formFooter}>
        <Button variant="outline" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="primary" type="submit" disabled={submitting}>
          {submitting ? "Saving..." : "Save"}
        </Button>
      </div>
    </form>
  );
}

export default function ManageEmployeesPage({ role }) {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  // separate errors: loadError for fetching employees, formError for create/update failures
  const [loadError, setLoadError] = useState("");
  const [formError, setFormError] = useState("");
  const [items, setItems] = useState([]);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [confirm, setConfirm] = useState({ open: false, id: null });
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = items;
    if (roleFilter === "employee")
      list = list.filter((u) => u.role === "employee");
    if (roleFilter === "admin") list = list.filter((u) => u.role === "admin");
    if (!q) return list;
    return list.filter((u) =>
      [u.firstName, u.lastName, u.email, u.role]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [items, search, roleFilter]);

  // function to load employees (callable by effect and retry button)
  async function loadEmployees() {
    // Try real API, otherwise fall back to demo list
    const data = await apiRequest("/api/admin/employees");
    const arr = Array.isArray(data?.employees) ? data.employees : [];
    return arr;
  }

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setLoadError("");
        const arr = await loadEmployees();
        if (!mounted) return;
        setItems(arr);
      } catch (e) {
        if (!mounted) return;
        setLoadError(e.message || "Failed to load employees");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  async function handleRetry() {
    try {
      setLoading(true);
      setLoadError("");
      const arr = await loadEmployees();
      setItems(arr);
    } catch (e) {
      setLoadError(e.message || "Failed to load employees");
    } finally {
      setLoading(false);
    }
  }

  async function createEmployee(payload) {
    setSubmitting(true);
    setFormError("");
    try {
      const res = await apiRequest("/api/admin/employees", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      const newItem = res?.employee || { ...payload, id: crypto.randomUUID() };
      setItems((list) => [newItem, ...list]);
      setIsFormOpen(false);
      setEditing(null);
      setFormError("");
    } catch (e) {
      setFormError(e.message || "Failed to create employee");
    } finally {
      setSubmitting(false);
    }
  }

  async function updateEmployee(id, payload) {
    setSubmitting(true);
    setFormError("");
    try {
      await apiRequest(`/api/admin/employees/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      setItems((list) =>
        list.map((u) =>
          u.id === id || u._id === id ? { ...u, ...payload } : u
        )
      );
      setIsFormOpen(false);
      setEditing(null);
      setFormError("");
    } catch (e) {
      setFormError(e.message || "Failed to update employee");
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteEmployee(id) {
    try {
      await apiRequest(`/api/admin/employees/${id}`, { method: "DELETE" });
    } catch {
      // ignore if backend not ready
    } finally {
      setItems((list) => list.filter((u) => u.id !== id && u._id !== id));
      setConfirm({ open: false, id: null });
    }
  }

  // keyboard support for the main form modal backdrop
  const onFormOverlayKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (!submitting) {
        setIsFormOpen(false);
        setEditing(null);
      }
    }
  };

  return (
    <div className={styles.pageWrapper}>
      <main className={styles.mainContent}>
        <div className={styles.pageHeader}>
          <Link to="/dashboard" className={styles.backLink}>
            ← Back to Dashboard
          </Link>
          <h1 className={styles.heading}>Manage Employees</h1>
          <div className={styles.subheading}>
            <span className={styles.iconPill} aria-hidden>
              <FiUsers />
            </span>
            Create, update, and remove employees
          </div>
        </div>

        <div className={styles.toolbar}>
          <div className={styles.searchBox}>
            <FiSearch aria-hidden />
            {/* Associate label with control */}
            <label htmlFor="employeeSearch" className={styles.searchLabel}>
              Search employees
            </label>
            <input
              id="employeeSearch"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search employees..."
              type="search"
            />
          </div>
          <Button
            icon={FiPlus}
            onClick={() => {
              setIsFormOpen(true);
              setEditing(null);
              setFormError("");
            }}
          >
            Add Employee
          </Button>
        </div>

        {loadError && (
          <div className={styles.error} role="alert" style={{ marginTop: 12 }}>
            <span>{loadError}</span>
            <Button
              variant="outline"
              onClick={handleRetry}
              style={{ marginLeft: 12 }}
            >
              Retry
            </Button>
          </div>
        )}

        <div className={styles.roleFilters}>
          <button
            className={`${styles.filterButton} ${
              roleFilter === "all" ? styles.filterActive : ""
            }`}
            onClick={() => setRoleFilter("all")}
            type="button"
          >
            All
          </button>
          <button
            className={`${styles.filterButton} ${
              roleFilter === "employee" ? styles.filterActive : ""
            }`}
            onClick={() => setRoleFilter("employee")}
            type="button"
          >
            Employees
          </button>
          <button
            className={`${styles.filterButton} ${
              roleFilter === "admin" ? styles.filterActive : ""
            }`}
            onClick={() => setRoleFilter("admin")}
            type="button"
          >
            Admins
          </button>
        </div>

        <div className={styles.card}>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Email</th>
                  <th scope="col">Role</th>
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className={styles.emptyState}>
                      Loading employees…
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4} className={styles.emptyState}>
                      No employees
                    </td>
                  </tr>
                ) : (
                  filtered.map((u) => (
                    <tr key={u.id || u._id}>
                      <td className={styles.nameCell}>
                        <div className={styles.name}>
                          {[u.firstName, u.lastName].filter(Boolean).join(" ")}
                        </div>
                      </td>
                      <td className={styles.mono}>{u.email}</td>
                      <td>
                        <span
                          className={`${styles.rolePill} ${
                            u.role === "admin"
                              ? styles.roleAdmin
                              : styles.roleEmployee
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td>
                        <div className={styles.rowActions}>
                          <Button
                            size="small"
                            variant="outline"
                            icon={FiEdit2}
                            onClick={() => {
                              setEditing(u);
                              setIsFormOpen(true);
                              setFormError("");
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            size="small"
                            variant="danger"
                            icon={FiTrash2}
                            onClick={() =>
                              setConfirm({ open: true, id: u.id || u._id })
                            }
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {isFormOpen && (
          <div
            className={styles.modalOverlay}
            onClick={() => {
              if (!submitting) {
                setIsFormOpen(false);
                setEditing(null);
              }
            }}
            role="button" // a11y for clickable backdrop
            tabIndex={0}
            aria-label="Close form"
            onKeyDown={onFormOverlayKeyDown}
          >
            <div
              className={styles.modal}
              role="dialog"
              aria-modal="true"
              aria-labelledby="employee-form-title"
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <h4 id="employee-form-title" className={styles.modalTitle}>
                  {editing ? "Edit Employee" : "Add Employee"}
                </h4>
                <button
                  onClick={() => {
                    if (!submitting) {
                      setIsFormOpen(false);
                      setEditing(null);
                    }
                  }}
                  aria-label="Close"
                  className={styles.modalCloseButton}
                  type="button"
                >
                  ×
                </button>
              </div>
              <div className={styles.modalBody}>
                <EmployeeForm
                  initial={editing}
                  submitting={submitting}
                  onCancel={() => {
                    if (!submitting) {
                      setIsFormOpen(false);
                      setEditing(null);
                    }
                  }}
                  onSubmit={(payload) =>
                    editing
                      ? updateEmployee(editing.id || editing._id, payload)
                      : createEmployee(payload)
                  }
                />
                {formError && <div className={styles.error}>{formError}</div>}
              </div>
            </div>
          </div>
        )}

        <ConfirmDialog
          open={confirm.open}
          title="Delete employee"
          message="This action cannot be undone. Are you sure?"
          onCancel={() => setConfirm({ open: false, id: null })}
          onConfirm={() => deleteEmployee(confirm.id)}
        />
      </main>
    </div>
  );
}
