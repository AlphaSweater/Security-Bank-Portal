import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiPlus, FiEdit2, FiTrash2, FiUsers, FiSearch } from "react-icons/fi";
import Button from "../../components/Common/Button/Button";
import { apiRequest } from "../../utils/apiUtil";
import styles from "./ManageEmployees.module.css";

function ConfirmDialog({ open, title, message, onCancel, onConfirm }) {
  if (!open) return null;
  return (
    <div className={styles.modalOverlay} onClick={onCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h4 className={styles.modalTitle}>{title}</h4>
          <button onClick={onCancel} aria-label="Close" className={styles.modalCloseButton}>
            ×
          </button>
        </div>
        <div className={styles.modalBody}>
          <p>{message}</p>
        </div>
        <div className={styles.modalFooter}>
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button variant="primary" onClick={onConfirm}>Confirm</Button>
        </div>
      </div>
    </div>
  );
}

function EmployeeForm({ initial, onSubmit, onCancel, submitting }) {
  const [form, setForm] = useState(
    initial || { firstName: "", lastName: "", email: "", role: "employee" }
  );

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
          <label htmlFor="firstName" className={styles.fieldLabel}>First Name</label>
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
          <label htmlFor="lastName" className={styles.fieldLabel}>Last Name</label>
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
          <label htmlFor="email" className={styles.fieldLabel}>Email</label>
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
          <label className={styles.label}>Role</label>
          <select
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

export default function ManageEmployees({ role }) {
  const navigate = useNavigate();

  // Basic client-side guard; page is still behind PrivateRoute
  const isAdmin = role === "admin";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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
    if (roleFilter === "employee") list = list.filter((u) => u.role === "employee");
    if (roleFilter === "admin") list = list.filter((u) => u.role === "admin");
    if (!q) return list;
    return list.filter((u) =>
      [u.firstName, u.lastName, u.email, u.role]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [items, search, roleFilter]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError("");
        // Try real API, otherwise fall back to demo list
        const data = await apiRequest("/api/admin/employees");
        if (cancelled) return;
        const arr = Array.isArray(data?.employees) ? data.employees : [];
        setItems(arr);
      } catch (e) {
        if (!cancelled) {
          // Fallback demo data if backend not ready
          setItems([
            {
              id: "EMP-1001",
              firstName: "Thabo",
              lastName: "Nkosi",
              email: "thabo.nkosi@bank.co.za",
              role: "employee",
            },
            {
              id: "EMP-1002",
              firstName: "Naledi",
              lastName: "Mokoena",
              email: "naledi.m@bank.co.za",
              role: "admin",
            },
          ]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function createEmployee(payload) {
    setSubmitting(true);
    try {
      const res = await apiRequest("/api/admin/employees", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      const newItem = res?.employee || { ...payload, id: crypto.randomUUID() };
      setItems((list) => [newItem, ...list]);
      setIsFormOpen(false);
      setEditing(null);
    } catch (e) {
      setError(e.message || "Failed to create employee");
    } finally {
      setSubmitting(false);
    }
  }

  async function updateEmployee(id, payload) {
    setSubmitting(true);
    try {
      await apiRequest(`/api/admin/employees/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      setItems((list) => list.map((u) => (u.id === id ? { ...u, ...payload } : u)));
      setIsFormOpen(false);
      setEditing(null);
    } catch (e) {
      setError(e.message || "Failed to update employee");
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
      setItems((list) => list.filter((u) => u.id !== id));
      setConfirm({ open: false, id: null });
    }
  }

  if (!isAdmin) {
    return (
      <div className={styles.pageWrapper}>
        <main className={styles.mainContent}>
          <div className={styles.pageHeader}>
            <Link to="/dashboard" className={styles.backLink}>
              ← Back to Dashboard
            </Link>
            <h1 className={styles.heading}>Unauthorized</h1>
            <div className={styles.subheading}>Admin access required</div>
          </div>
          <Button onClick={() => navigate("/dashboard")}>Go to Dashboard</Button>
        </main>
      </div>
    );
  }

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
            <FiSearch />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search employees..."
            />
          </div>
          <Button icon={FiPlus} onClick={() => { setIsFormOpen(true); setEditing(null); }}>
            Add Employee
          </Button>
        </div>

        <div className={styles.roleFilters}>
          <button
            className={`${styles.filterButton} ${roleFilter === 'all' ? styles.filterActive : ''}`}
            onClick={() => setRoleFilter('all')}
            type="button"
          >
            All
          </button>
          <button
            className={`${styles.filterButton} ${roleFilter === 'employee' ? styles.filterActive : ''}`}
            onClick={() => setRoleFilter('employee')}
            type="button"
          >
            Employees
          </button>
          <button
            className={`${styles.filterButton} ${roleFilter === 'admin' ? styles.filterActive : ''}`}
            onClick={() => setRoleFilter('admin')}
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
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className={styles.emptyState}>Loading employees…</td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4} className={styles.emptyState}>No employees</td>
                  </tr>
                ) : (
                  filtered.map((u) => (
                    <tr key={u.id || u._id}>
                      <td className={styles.nameCell}>
                        <div className={styles.name}>{[u.firstName, u.lastName].filter(Boolean).join(" ")}</div>
                      </td>
                      <td className={styles.mono}>{u.email}</td>
                      <td>
                        <span className={`${styles.rolePill} ${u.role === 'admin' ? styles.roleAdmin : styles.roleEmployee}`}>
                          {u.role}
                        </span>
                      </td>
                      <td>
                        <div className={styles.rowActions}>
                          <Button
                            size="small"
                            variant="outline"
                            icon={FiEdit2}
                            onClick={() => { setEditing(u); setIsFormOpen(true); }}
                          >
                            Edit
                          </Button>
                          <Button
                            size="small"
                            variant="danger"
                            icon={FiTrash2}
                            onClick={() => setConfirm({ open: true, id: u.id })}
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
          <div className={styles.modalOverlay} onClick={() => { if (!submitting) { setIsFormOpen(false); setEditing(null); } }}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h4 className={styles.modalTitle}>{editing ? "Edit Employee" : "Add Employee"}</h4>
                <button
                  onClick={() => { if (!submitting) { setIsFormOpen(false); setEditing(null); } }}
                  aria-label="Close"
                  className={styles.modalCloseButton}
                >
                  ×
                </button>
              </div>
              <div className={styles.modalBody}>
                <EmployeeForm
                  initial={editing}
                  submitting={submitting}
                  onCancel={() => { if (!submitting) { setIsFormOpen(false); setEditing(null); } }}
                  onSubmit={(payload) => editing ? updateEmployee(editing.id, payload) : createEmployee(payload)}
                />
                {error && <div className={styles.error}>{error}</div>}
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
