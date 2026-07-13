'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { safeJson } from '@/lib/apiClient';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await safeJson(res);

      if (!res.ok) {
        setError(data.error || 'Something went wrong.');
        setLoading(false);
        return;
      }

      router.push('/admin/dashboard');
      router.refresh();
    } catch {
      setError('Could not reach the server. Try again.');
      setLoading(false);
    }
  }

  return (
    <div className="admin-login-screen">
      <motion.div
        className="login-box"
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.2, 0.7, 0.3, 1] }}
      >
        <div className="login-brand">THE LEX<span>·</span>CONCEPT</div>
        <div className="login-sub">Studio Admin</div>

        <form onSubmit={handleSubmit}>
          <div className="lgroup">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="lgroup">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <motion.button className="login-btn" type="submit" disabled={loading} whileTap={{ scale: 0.97 }}>
            {loading ? 'Logging in…' : 'Log In'}
          </motion.button>
          {error && (
            <motion.div
              className="login-error"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.25 }}
            >
              {error}
            </motion.div>
          )}
        </form>
      </motion.div>
    </div>
  );
}
