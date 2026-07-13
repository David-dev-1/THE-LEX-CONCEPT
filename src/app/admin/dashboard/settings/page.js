'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { safeJson } from '@/lib/apiClient';

export default function SettingsPage() {
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwStatus, setPwStatus] = useState(null);
  const [pwSaving, setPwSaving] = useState(false);

  // Email change state
  const [emailCurrentPassword, setEmailCurrentPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [emailStatus, setEmailStatus] = useState(null);
  const [emailSaving, setEmailSaving] = useState(false);

  async function handleChangePassword(e) {
    e.preventDefault();
    setPwSaving(true);
    setPwStatus(null);

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await safeJson(res);

      if (!res.ok) {
        setPwStatus({ type: 'err', message: data.error || 'Something went wrong.' });
      } else {
        setPwStatus({ type: 'ok', message: 'Password updated.' });
        setCurrentPassword('');
        setNewPassword('');
      }
    } catch {
      setPwStatus({ type: 'err', message: 'Could not reach the server.' });
    } finally {
      setPwSaving(false);
    }
  }

  async function handleChangeEmail(e) {
    e.preventDefault();
    setEmailSaving(true);
    setEmailStatus(null);

    try {
      const res = await fetch('/api/auth/change-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: emailCurrentPassword, newEmail }),
      });
      const data = await safeJson(res);

      if (!res.ok) {
        setEmailStatus({ type: 'err', message: data.error || 'Something went wrong.' });
      } else {
        setEmailStatus({ type: 'ok', message: `Login email updated to ${data.email}.` });
        setEmailCurrentPassword('');
        setNewEmail('');
      }
    } catch {
      setEmailStatus({ type: 'err', message: 'Could not reach the server.' });
    } finally {
      setEmailSaving(false);
    }
  }

  return (
    <section>
      <div className="page-title">Settings</div>
      <div className="page-sub">Account settings.</div>

      <motion.form
        className="panel settings-panel"
        onSubmit={handleChangeEmail}
        style={{ marginBottom: '24px' }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="panel-head" style={{ margin: '-24px -24px 20px', padding: '18px 24px' }}>
          Change Login Email
        </div>
        <div className="mgroup">
          <label>New Email</label>
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            required
          />
        </div>
        <div className="mgroup">
          <label>Current Password</label>
          <input
            type="password"
            value={emailCurrentPassword}
            onChange={(e) => setEmailCurrentPassword(e.target.value)}
            required
          />
        </div>
        {emailStatus && <div className={`inline-msg ${emailStatus.type === 'ok' ? 'ok' : 'err'}`}>{emailStatus.message}</div>}
        <motion.button className="add-btn" type="submit" style={{ marginTop: '14px' }} disabled={emailSaving} whileTap={{ scale: 0.97 }}>
          {emailSaving ? 'Saving…' : 'Update Email'}
        </motion.button>
      </motion.form>

      <motion.form
        className="panel settings-panel"
        onSubmit={handleChangePassword}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.08 }}
      >
        <div className="panel-head" style={{ margin: '-24px -24px 20px', padding: '18px 24px' }}>
          Change Password
        </div>
        <div className="mgroup">
          <label>Current Password</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
        </div>
        <div className="mgroup">
          <label>New Password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            minLength={8}
            required
          />
        </div>
        {pwStatus && <div className={`inline-msg ${pwStatus.type === 'ok' ? 'ok' : 'err'}`}>{pwStatus.message}</div>}
        <motion.button className="add-btn" type="submit" style={{ marginTop: '14px' }} disabled={pwSaving} whileTap={{ scale: 0.97 }}>
          {pwSaving ? 'Saving…' : 'Update Password'}
        </motion.button>
      </motion.form>
    </section>
  );
}
