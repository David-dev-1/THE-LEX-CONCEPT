'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmDialog from './ConfirmDialog';
import Toast from './Toast';
import { safeJson } from '@/lib/apiClient';

const STATUS_LABELS = {
  pending: 'Pending Review',
  changes_requested: 'Changes Requested',
  approved: 'Approved',
};

function timeAgo(date) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}

export default function ProofsManager({ initialProofs }) {
  const router = useRouter();
  const [proofs, setProofs] = useState(initialProofs);
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [customPin, setCustomPin] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState(null); // { link, pin } shown once after creation
  const [pendingDelete, setPendingDelete] = useState(null);
  const [toast, setToast] = useState('');

  function showToast(text) {
    setToast(text);
    setTimeout(() => setToast(''), 2200);
  }

  function openNew() {
    setTitle('');
    setClientName('');
    setClientEmail('');
    setCustomPin('');
    setError('');
    setCreated(null);
    setModalOpen(true);
  }

  async function handleCreate() {
    if (!title.trim()) {
      setError('Give the proof a title.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/proofs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, clientName, clientEmail, pin: customPin }),
      });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data.error || 'Something went wrong.');

      const link = `${window.location.origin}/proof/${data.token}`;
      setCreated({ id: data.id, link, pin: data.pin, title: data.title });
      setProofs((prev) => [{ ...data, pin: undefined, imageCount: 0, unresolvedComments: 0 }, ...prev]);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(proof) {
    setProofs((prev) => prev.filter((p) => p.id !== proof.id));
    setPendingDelete(null);
    await fetch(`/api/proofs/${proof.id}`, { method: 'DELETE' }).catch(() => {});
    router.refresh();
  }

  async function copyToClipboard(text, label) {
    try {
      await navigator.clipboard.writeText(text);
      showToast(`${label} copied.`);
    } catch {
      showToast('Could not copy — select and copy manually.');
    }
  }

  return (
    <>
      <div className="works-toolbar">
        <div className="page-sub" style={{ margin: 0 }}>{proofs.length} total proofs</div>
        <motion.button className="add-btn" onClick={openNew} whileTap={{ scale: 0.96 }}>
          + New Client Proof
        </motion.button>
      </div>

      <div className="panel">
        {proofs.length === 0 ? (
          <div className="empty-panel">No client proofs yet — create one to get a private review link.</div>
        ) : (
          <table className="works-table">
            <thead>
              <tr><th>Title</th><th>Client</th><th>Status</th><th>Feedback</th><th>Created</th><th></th></tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {proofs.map((p) => (
                  <motion.tr
                    key={p.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ cursor: 'pointer' }}
                    onClick={() => router.push(`/admin/dashboard/proofs/${p.id}`)}
                  >
                    <td><div style={{ fontWeight: 500 }}>{p.title}</div></td>
                    <td>{p.clientName || <span style={{ color: 'var(--muted)' }}>—</span>}</td>
                    <td><span className="cat-badge">{STATUS_LABELS[p.status] || p.status}</span></td>
                    <td>
                      {p.unresolvedComments > 0
                        ? <span style={{ color: 'var(--red)' }}>{p.unresolvedComments} unresolved</span>
                        : <span style={{ color: 'var(--muted)' }}>—</span>}
                    </td>
                    <td>{timeAgo(p.createdAt)}</td>
                    <td>
                      <div className="row-actions">
                        <button className="del" onClick={(e) => { e.stopPropagation(); setPendingDelete(p); }}>Delete</button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        )}
      </div>

      {/* Create modal */}
      <div className={`modal-overlay ${modalOpen ? 'active' : ''}`}>
        <div className="modal">
          {!created ? (
            <>
              <h3>New Client Proof</h3>
              <div className="mgroup">
                <label>Title</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Aurea Skincare — Round 1" />
              </div>
              <div className="mgroup">
                <label>Client Name (optional)</label>
                <input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="e.g. Tobi Adebanjo" />
              </div>
              <div className="mgroup">
                <label>Client Email (optional)</label>
                <input value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder="client@email.com" />
              </div>
              <div className="mgroup">
                <label>PIN (optional — 4-8 digits, auto-generated if left blank)</label>
                <input value={customPin} onChange={(e) => setCustomPin(e.target.value)} placeholder="e.g. 4821" />
              </div>
              {error && <div className="inline-msg err">{error}</div>}
              <div className="modal-actions">
                <button onClick={() => setModalOpen(false)} disabled={saving}>Cancel</button>
                <button className="save-btn" onClick={handleCreate} disabled={saving}>
                  {saving ? 'Creating…' : 'Create Proof'}
                </button>
              </div>
            </>
          ) : (
            <>
              <h3>"{created.title}" is ready</h3>
              <p style={{ color: 'var(--muted)', fontSize: '13.5px', lineHeight: 1.6, marginBottom: '18px' }}>
                Send your client the link below, and share the PIN separately (e.g. over WhatsApp or a
                different message) — that way, having the link alone isn't enough to see the work.
                <strong style={{ display: 'block', marginTop: '8px', color: 'var(--text)' }}>
                  The PIN won't be shown again after you close this.
                </strong>
              </p>
              <div className="mgroup">
                <label>Private Link</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input readOnly value={created.link} style={{ flex: 1 }} />
                  <button className="add-btn" style={{ padding: '0 16px' }} onClick={() => copyToClipboard(created.link, 'Link')}>Copy</button>
                </div>
              </div>
              <div className="mgroup">
                <label>PIN</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input readOnly value={created.pin} style={{ flex: 1, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.1em' }} />
                  <button className="add-btn" style={{ padding: '0 16px' }} onClick={() => copyToClipboard(created.pin, 'PIN')}>Copy</button>
                </div>
              </div>
              <div className="modal-actions">
                <button
                  onClick={() => { setModalOpen(false); router.refresh(); }}
                >
                  I'll add images later
                </button>
                <button
                  className="save-btn"
                  style={{ flex: 1 }}
                  onClick={() => router.push(`/admin/dashboard/proofs/${created.id}`)}
                >
                  Add Images Now →
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete this proof?"
        message={pendingDelete ? `"${pendingDelete.title}" and all its images and feedback will be permanently deleted. The client's link will stop working.` : ''}
        confirmLabel="Delete"
        danger
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => handleDelete(pendingDelete)}
      />

      <Toast message={toast} show={!!toast} />
    </>
  );
}
