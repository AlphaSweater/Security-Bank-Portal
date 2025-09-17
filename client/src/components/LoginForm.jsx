import { useState } from 'react';

export default function LoginForm() {
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [token, setToken] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setToken('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }
      setToken(data.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-form" style={{border: '1px solid #444', padding: '1rem', borderRadius: 8, maxWidth: 400}}>
      <h3>Demo Login</h3>
      <form onSubmit={handleSubmit}>
        <label style={{display: 'block', marginBottom: '0.5rem'}}>
          Email
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required style={{width: '100%', padding: '0.5rem', marginTop: 4}} />
        </label>
        <label style={{display: 'block', marginBottom: '0.5rem'}}>
          Password
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required style={{width: '100%', padding: '0.5rem', marginTop: 4}} />
        </label>
        <button disabled={loading} type="submit" style={{marginTop: '0.5rem'}}>{loading ? 'Logging in...' : 'Login'}</button>
      </form>
      {error && <p style={{color: 'tomato'}}>{error}</p>}
      {token && (
        <div style={{marginTop: '0.75rem'}}>
          <p style={{color: 'limegreen'}}>Success! Token:</p>
          <code style={{fontSize: '0.8rem', wordBreak: 'break-all', display: 'block'}}>{token}</code>
        </div>
      )}
      <p style={{fontSize: '0.7rem', marginTop: '0.75rem', opacity: 0.7}}>Try changing credentials to see error handling.</p>
    </div>
  );
}
