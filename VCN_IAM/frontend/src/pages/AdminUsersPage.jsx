import { useEffect, useMemo, useState } from 'react';
import { authFetch } from '../lib/api';
import Modal from '../components/Modal';
import { useAdminLoading } from '../components/AdminLoadingContext';

const emptyCreateForm = { email: '', password: '', appId: '1', role: 'user' };

function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(emptyCreateForm);
  const [editForm, setEditForm] = useState({ id: null, email: '', password: '' });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const { setLoading: setAdminLoading } = useAdminLoading();

  async function loadUsers() {
    setLoading(true);
    setAdminLoading(true);

    try {
      const data = await authFetch('/api/admin/users');
      setUsers(data.users || []);
      setMessage('');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
      setAdminLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function handleCreate(event) {
    event.preventDefault();
    setAdminLoading(true);

    try {
      const result = await authFetch('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setMessage(`Utworzono użytkownika ${result.user.email}`);
      setIsCreateOpen(false);
      setForm(emptyCreateForm);
      await loadUsers();
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
      const payload = { email: editForm.email };
      if (editForm.password.trim()) {
        payload.password = editForm.password;
      }

      await authFetch(`/api/admin/users/${editForm.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      setMessage('Zaktualizowano użytkownika');
      setIsEditOpen(false);
      await loadUsers();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setAdminLoading(false);
    }
  }

  async function handleDelete(userId) {
    setAdminLoading(true);

    try {
      await authFetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
      setMessage('Usunięto użytkownika');
      await loadUsers();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setAdminLoading(false);
    }
  }

  function openEdit(user) {
    setEditForm({ id: user.id, email: user.email, password: '' });
    setIsEditOpen(true);
  }

  const filteredUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return users;
    }

    return users.filter((user) => {
      const permissionText = (user.permissions || [])
        .map((permission) => `${permission.appName} ${permission.role}`)
        .join(' ');
      return `${user.id} ${user.email} ${permissionText}`.toLowerCase().includes(normalizedQuery);
    });
  }, [query, users]);

  return (
    <section className="admin-page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Panel IAM</p>
          <h1>Użytkownicy</h1>
          <p className="hero-copy">Twórz konta, edytuj dane i usuwaj dostęp.</p>
        </div>
        <div className="mini-actions">
          <button className="primary-button" type="button" onClick={() => setIsCreateOpen(true)}>
            Dodaj użytkownika
          </button>
        </div>
      </div>

      <div className="content-toolbar">
        <input
          className="search-input"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Szukaj po e-mail, roli lub aplikacji..."
        />
        <span className="footer-note">{filteredUsers.length} użytkowników</span>
      </div>

      {message ? <div className="alert-box">{message}</div> : null}

      <div className="table-shell">
        <table>
          <thead>
            <tr>
              <th style={{ width: '72px' }}>ID</th>
              <th>E-mail</th>
              <th>Uprawnienia</th>
              <th className="table-actions">Akcje</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="4" className="table-state">
                  Ładowanie użytkowników...
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="4" className="empty-state">
                  Brak użytkowników.
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.email}</td>
                  <td>
                    {(user.permissions || [])
                      .map((permission) => `${permission.appName}: ${permission.role}`)
                      .join(', ') || '—'}
                  </td>
                  <td className="table-actions">
                    <div className="inline-actions">
                      <button className="ghost-button" type="button" onClick={() => openEdit(user)}>
                        Edytuj
                      </button>
                      <button className="danger-button" type="button" onClick={() => handleDelete(user.id)}>
                        Usuń
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
          title="Dodaj użytkownika"
          onClose={() => setIsCreateOpen(false)}
          footer={
            <>
              <button className="ghost-button" type="button" onClick={() => setIsCreateOpen(false)}>
                Anuluj
              </button>
              <button className="primary-button" type="submit" form="create-user-form">
                Utwórz
              </button>
            </>
          }
        >
          <form className="modal-form" id="create-user-form" onSubmit={handleCreate}>
            <label>
              E-mail
              <input
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                type="email"
                required
              />
            </label>

            <label>
              Hasło
              <input
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                type="password"
                required
              />
            </label>

            <div className="compact-form">
              <label>
                ID aplikacji
                <input value={form.appId} onChange={(event) => setForm({ ...form, appId: event.target.value })} />
              </label>

              <label>
                Rola
                <input value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} />
              </label>
            </div>
          </form>
        </Modal>
      ) : null}

      {isEditOpen ? (
        <Modal
          title="Edytuj użytkownika"
          onClose={() => setIsEditOpen(false)}
          footer={
            <>
              <button className="ghost-button" type="button" onClick={() => setIsEditOpen(false)}>
                Anuluj
              </button>
              <button className="primary-button" type="submit" form="edit-user-form">
                Zapisz
              </button>
            </>
          }
        >
          <form className="modal-form" id="edit-user-form" onSubmit={handleEdit}>
            <label>
              E-mail
              <input
                value={editForm.email}
                onChange={(event) => setEditForm({ ...editForm, email: event.target.value })}
                type="email"
                required
              />
            </label>

            <label>
              Nowe hasło
              <input
                value={editForm.password}
                onChange={(event) => setEditForm({ ...editForm, password: event.target.value })}
                type="password"
                placeholder="Pozostaw puste, aby nie zmieniać"
              />
            </label>
          </form>
        </Modal>
      ) : null}
    </section>
  );
}

export default AdminUsersPage;
