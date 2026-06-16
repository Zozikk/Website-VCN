import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { authFetch } from '../lib/api';
import { AdminLoadingProvider, useAdminLoading } from './AdminLoadingContext';

function AdminLoadingOverlay() {
  const { isLoading } = useAdminLoading();

  if (!isLoading) {
    return null;
  }

  return (
    <div className="overlay-backdrop" aria-live="polite" aria-busy="true">
      <div className="overlay-card">
        <div className="spinner-ring" />
        <p>Ładowanie danych...</p>
      </div>
    </div>
  );
}

function AdminLayoutInner() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const { setLoading } = useAdminLoading();

  useEffect(() => {
    setLoading(true);
    authFetch('/api/auth/me')
      .then((data) => setUser(data.user))
      .catch(() => navigate('/login', { replace: true }))
      .finally(() => setLoading(false));
  }, [navigate, setLoading]);

  async function handleLogout() {
    setLoading(true);
    await authFetch('/api/auth/logout', { method: 'POST' });
    navigate('/login', { replace: true });
    setLoading(false);
  }

  return (
    <div className="admin-app">
      <AdminLoadingOverlay />

      <header className="app-header">
        <div className="app-header-inner">
          <Link to="/admin/users" className="app-header-logo">
            <img src="/vcn-logo.svg" alt="VCN" />
          </Link>

          <nav className="app-nav" aria-label="Nawigacja panelu IAM">
            <NavLink to="/admin/users">Użytkownicy</NavLink>
            <NavLink to="/admin/apps">Aplikacje</NavLink>
            <NavLink to="/admin/permissions">Uprawnienia</NavLink>
          </nav>

          <div className="app-header-user">
            <div className="app-header-user-info">
              <strong>{user?.email || 'Administrator'}</strong>
              <span>{user?.role || 'Sesja aktywna'}</span>
            </div>
            <button type="button" className="ghost-button" onClick={handleLogout}>
              Wyloguj
            </button>
          </div>
        </div>
      </header>

      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}

function AdminLayout() {
  return (
    <AdminLoadingProvider>
      <AdminLayoutInner />
    </AdminLoadingProvider>
  );
}

export default AdminLayout;
