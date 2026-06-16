import { useEffect, useMemo, useState } from 'react';
import { authFetch } from '../lib/api';
import Modal from '../components/Modal';
import { useAdminLoading } from '../components/AdminLoadingContext';

const roleOptions = ['viewer', 'editor', 'admin'];

function AdminPermissionsPage() {
  const [permissions, setPermissions] = useState([]);
  const [users, setUsers] = useState([]);
  const [apps, setApps] = useState([]);
  const [form, setForm] = useState({ userId: '', appId: '', role: 'viewer' });
  const [editForm, setEditForm] = useState({ id: null, role: 'viewer' });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [query, setQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const { setLoading: setAdminLoading } = useAdminLoading();

  async function loadData() {
    setLoading(true);
    setAdminLoading(true);

    try {
      const [permissionsResponse, usersResponse, appsResponse] = await Promise.all([
        authFetch('/api/admin/permissions'),
        authFetch('/api/admin/users'),
        authFetch('/api/admin/apps'),
      ]);

      setPermissions(permissionsResponse.permissions || []);
      setUsers(usersResponse.users || []);
      setApps(appsResponse.apps || []);
      setMessage('');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
      setAdminLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleCreate(event) {
    event.preventDefault();
    setAdminLoading(true);

    try {
      const result = await authFetch('/api/admin/permissions', {
        method: 'POST',
        body: JSON.stringify(form),
      });

      setMessage(result.message || 'Przypisano uprawnienie');
      setIsCreateOpen(false);
      setForm({ userId: '', appId: '', role: 'viewer' });
      await loadData();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setAdminLoading(false);
    }
  }

  async function handleEdit(event) {
    event.preventDefault();
    setAdminLoading(true);

    try {
      await authFetch(`/api/admin/permissions/${editForm.id}`, {
        method: 'PUT',
        body: JSON.stringify({ role: editForm.role }),
      });
      setMessage('Zaktualizowano uprawnienie');
      setIsEditOpen(false);
      await loadData();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setAdminLoading(false);
    }
  }

  async function handleDelete(permissionId) {
    setAdminLoading(true);

    try {
      await authFetch(`/api/admin/permissions/${permissionId}`, { method: 'DELETE' });
      setMessage('Cofnięto uprawnienie');
      await loadData();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setAdminLoading(false);
    }
  }

  function openEdit(permission) {
    setEditForm({ id: permission.id, role: permission.role });
    setIsEditOpen(true);
  }

  const filteredPermissions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return permissions;
    }

    return permissions.filter((permission) =>
      `${permission.id} ${permission.userEmail} ${permission.appName} ${permission.role}`
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [query, permissions]);

  return (
    <section className="admin-page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Panel IAM</p>
          <h1>Uprawnienia</h1>
          <p className="hero-copy">Nadawaj, edytuj i odbieraj dostęp do aplikacji.</p>
        </div>
        <div className="mini-actions">
          <button className="primary-button" type="button" onClick={() => setIsCreateOpen(true)}>
            Dodaj uprawnienie
          </button>
        </div>
      </div>

      <div className="content-toolbar">
        <input
          className="search-input"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Szukaj po użytkowniku, aplikacji lub roli..."
        />
        <span className="footer-note">{filteredPermissions.length} uprawnień</span>
      </div>

      {message ? <div className="alert-box">{message}</div> : null}

      <div className="table-shell">
        <table>
          <thead>
            <tr>
              <th style={{ width: '72px' }}>ID</th>
              <th>Użytkownik</th>
              <th>Aplikacja</th>
              <th style={{ width: '120px' }}>Rola</th>
              <th className="table-actions">Akcje</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" className="table-state">
                  Ładowanie uprawnień...
                </td>
              </tr>
            ) : filteredPermissions.length === 0 ? (
              <tr>
                <td colSpan="5" className="empty-state">
                  Brak uprawnień.
                </td>
              </tr>
            ) : (
              filteredPermissions.map((permission) => (
                <tr key={permission.id}>
                  <td>{permission.id}</td>
                  <td>{permission.userEmail}</td>
                  <td>{permission.appName}</td>
                  <td>
                    <span className="badge">{permission.role}</span>
                  </td>
                  <td className="table-actions">
                    <div className="inline-actions">
                      <button className="ghost-button" type="button" onClick={() => openEdit(permission)}>
                        Edytuj
                      </button>
                      <button className="danger-button" type="button" onClick={() => handleDelete(permission.id)}>
                        Cofnij
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isCreateOpen ? (
        <Modal
          title="Dodaj uprawnienie"
          onClose={() => setIsCreateOpen(false)}
          footer={
            <>
              <button className="ghost-button" type="button" onClick={() => setIsCreateOpen(false)}>
                Anuluj
              </button>
              <button className="primary-button" type="submit" form="create-permission-form">
                Przypisz
              </button>
            </>
          }
        >
          <form className="modal-form" id="create-permission-form" onSubmit={handleCreate}>
            <label>
              Użytkownik
              <select value={form.userId} onChange={(event) => setForm({ ...form, userId: event.target.value })} required>
                <option value="">Wybierz użytkownika</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.email}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Aplikacja
              <select value={form.appId} onChange={(event) => setForm({ ...form, appId: event.target.value })} required>
                <option value="">Wybierz aplikację</option>
                {apps.map((app) => (
                  <option key={app.id} value={app.id}>
                    {app.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Rola
              <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>
                {roleOptions.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </label>
          </form>
        </Modal>
      ) : null}

      {isEditOpen ? (
        <Modal
          title="Edytuj uprawnienie"
          onClose={() => setIsEditOpen(false)}
          footer={
            <>
              <button className="ghost-button" type="button" onClick={() => setIsEditOpen(false)}>
                Anuluj
              </button>
              <button className="primary-button" type="submit" form="edit-permission-form">
                Zapisz
              </button>
            </>
          }
        >
          <form className="modal-form" id="edit-permission-form" onSubmit={handleEdit}>
            <label>
              Rola
              <select value={editForm.role} onChange={(event) => setEditForm({ ...editForm, role: event.target.value })}>
                {roleOptions.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </label>
          </form>
        </Modal>
      ) : null}
    </section>
  );
}

export default AdminPermissionsPage;
