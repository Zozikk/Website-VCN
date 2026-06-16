import { useEffect, useMemo, useState } from 'react';
import { authFetch } from '../lib/api';
import Modal from '../components/Modal';
import { useAdminLoading } from '../components/AdminLoadingContext';

function AdminAppsPage() {
  const [apps, setApps] = useState([]);
  const [form, setForm] = useState({ name: '', allowedRedirect: '' });
  const [editForm, setEditForm] = useState({ id: null, name: '', allowedRedirect: '' });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const { setLoading: setAdminLoading } = useAdminLoading();

  async function loadApps() {
    setLoading(true);
    setAdminLoading(true);

    try {
      const data = await authFetch('/api/admin/apps');
      setApps(data.apps || []);
      setMessage('');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
      setAdminLoading(false);
    }
  }

  useEffect(() => {
    loadApps();
  }, []);

  async function handleCreate(event) {
    event.preventDefault();
    setAdminLoading(true);

    try {
      const result = await authFetch('/api/admin/apps', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setMessage(`Utworzono aplikację ${result.app.name}`);
      setIsCreateOpen(false);
      setForm({ name: '', allowedRedirect: '' });
      await loadApps();
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
      await authFetch(`/api/admin/apps/${editForm.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: editForm.name,
          allowedRedirect: editForm.allowedRedirect,
        }),
      });
      setMessage('Zaktualizowano aplikację');
      setIsEditOpen(false);
      await loadApps();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setAdminLoading(false);
    }
  }

  async function handleDelete(appId) {
    setAdminLoading(true);

    try {
      await authFetch(`/api/admin/apps/${appId}`, { method: 'DELETE' });
      setMessage('Usunięto aplikację');
      await loadApps();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setAdminLoading(false);
    }
  }

  function openEdit(app) {
    setEditForm({
      id: app.id,
      name: app.name,
      allowedRedirect: app.allowed_redirect,
    });
    setIsEditOpen(true);
  }

  const filteredApps = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return apps;
    }

    return apps.filter((app) =>
      `${app.id} ${app.name} ${app.allowed_redirect} ${app.secret_key}`.toLowerCase().includes(normalizedQuery),
    );
  }, [query, apps]);

  return (
    <section className="admin-page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Panel IAM</p>
          <h1>Aplikacje</h1>
          <p className="hero-copy">Rejestruj klientów OAuth i zarządzaj redirect URI.</p>
        </div>
        <div className="mini-actions">
          <button className="primary-button" type="button" onClick={() => setIsCreateOpen(true)}>
            Dodaj aplikację
          </button>
        </div>
      </div>

      <div className="content-toolbar">
        <input
          className="search-input"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Szukaj po nazwie, redirect lub kluczu..."
        />
        <span className="footer-note">{filteredApps.length} aplikacji</span>
      </div>

      {message ? <div className="alert-box">{message}</div> : null}

      <div className="table-shell">
        <table>
          <thead>
            <tr>
              <th style={{ width: '72px' }}>ID</th>
              <th>Nazwa</th>
              <th>Redirect URI</th>
              <th>Secret key</th>
              <th className="table-actions">Akcje</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" className="table-state">
                  Ładowanie aplikacji...
                </td>
              </tr>
            ) : filteredApps.length === 0 ? (
              <tr>
                <td colSpan="5" className="empty-state">
                  Brak aplikacji.
                </td>
              </tr>
            ) : (
              filteredApps.map((app) => (
                <tr key={app.id}>
                  <td>{app.id}</td>
                  <td>{app.name}</td>
                  <td>{app.allowed_redirect}</td>
                  <td className="mono">{app.secret_key}</td>
                  <td className="table-actions">
                    <div className="inline-actions">
                      <button className="ghost-button" type="button" onClick={() => openEdit(app)}>
                        Edytuj
                      </button>
                      <button className="danger-button" type="button" onClick={() => handleDelete(app.id)}>
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
          title="Dodaj aplikację"
          onClose={() => setIsCreateOpen(false)}
          footer={
            <>
              <button className="ghost-button" type="button" onClick={() => setIsCreateOpen(false)}>
                Anuluj
              </button>
              <button className="primary-button" type="submit" form="create-app-form">
                Utwórz
              </button>
            </>
          }
        >
          <form className="modal-form" id="create-app-form" onSubmit={handleCreate}>
            <label>
              Nazwa aplikacji
              <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
            </label>

            <label>
              Dozwolony redirect URI
              <input
                value={form.allowedRedirect}
                onChange={(event) => setForm({ ...form, allowedRedirect: event.target.value })}
                required
              />
            </label>
          </form>
        </Modal>
      ) : null}

      {isEditOpen ? (
        <Modal
          title="Edytuj aplikację"
          onClose={() => setIsEditOpen(false)}
          footer={
            <>
              <button className="ghost-button" type="button" onClick={() => setIsEditOpen(false)}>
                Anuluj
              </button>
              <button className="primary-button" type="submit" form="edit-app-form">
                Zapisz
              </button>
            </>
          }
        >
          <form className="modal-form" id="edit-app-form" onSubmit={handleEdit}>
            <label>
              Nazwa aplikacji
              <input
                value={editForm.name}
                onChange={(event) => setEditForm({ ...editForm, name: event.target.value })}
                required
              />
            </label>

            <label>
              Dozwolony redirect URI
              <input
                value={editForm.allowedRedirect}
                onChange={(event) => setEditForm({ ...editForm, allowedRedirect: event.target.value })}
                required
              />
            </label>
          </form>
        </Modal>
      ) : null}
    </section>
  );
}

export default AdminAppsPage;
