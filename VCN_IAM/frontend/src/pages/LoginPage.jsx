import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authFetch } from '../lib/api';

function LoginPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialAppId = searchParams.get('appId');
  const initialRedirectUri = searchParams.get('redirectUri');
  const hasAuthRequest = Boolean(initialAppId && initialRedirectUri);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [meLoading, setMeLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchMe() {
      setMeLoading(true);

      try {
        const result = await authFetch('/api/auth/me');
        if (!cancelled && result.user) {
          if (hasAuthRequest) {
            const separator = initialRedirectUri.includes('?') ? '&' : '?';
            const authorizeResult = await authFetch('/api/auth/authorize', {
              method: 'POST',
              body: JSON.stringify({ appId: Number(initialAppId), redirectUri: initialRedirectUri }),
            });

            window.location.assign(
              `${initialRedirectUri}${separator}code=${encodeURIComponent(authorizeResult.code)}&appId=${encodeURIComponent(String(authorizeResult.appId))}`,
            );
            return;
          }

          navigate('/admin/users', { replace: true });
        }
      } catch {
        // no active session
      } finally {
        if (!cancelled) {
          setMeLoading(false);
        }
      }
    }

    fetchMe();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (hasAuthRequest) {
        const result = await authFetch('/api/auth/authorize', {
          method: 'POST',
          body: JSON.stringify({ appId: Number(initialAppId), redirectUri: initialRedirectUri }),
        });

        const separator = initialRedirectUri.includes('?') ? '&' : '?';
        window.location.assign(
          `${initialRedirectUri}${separator}code=${encodeURIComponent(result.code)}&appId=${encodeURIComponent(String(result.appId))}`,
        );
        return;
      }

      navigate('/admin/users', { replace: true });
    } catch (submitError) {
      setError(submitError.message || 'Unable to login');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-shell login-shell">
      <section className="auth-form-card login-card">
        <div className="login-header">
          <img src="/vcn-logo.svg" alt="VCN" className="login-logo" />
          <h1>Zaloguj się</h1>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <label>
            Login
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="username" />
          </label>

          <label>
            Hasło
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="current-password" />
          </label>

          {error ? <div className="alert-box">{error}</div> : null}

          <button type="submit" disabled={loading || meLoading} className="primary-button">
            {loading ? 'Logowanie...' : 'Zaloguj'}
          </button>
        </form>

        {meLoading ? <p className="login-status">Sprawdzanie sesji...</p> : null}

        <p className="login-powered-by">Powered by VCN IAM</p>
      </section>
    </main>
  );
}

export default LoginPage;
