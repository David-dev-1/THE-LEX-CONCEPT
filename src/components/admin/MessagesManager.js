'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmDialog from './ConfirmDialog';
import Toast from './Toast';

function timeAgo(date) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;
  return new Date(date).toLocaleDateString();
}

// Builds a proper mailto: link with an encoded subject and a quoted-reply
// body, so clicking it opens the admin's mail client with a real draft
// ready to send - not just a bare "to" address.
function buildMailto(msg) {
  const subject = `Re: Your ${msg.projectType} inquiry — THE LEX CONCEPT`;
  const quoted = msg.message.split('\n').map((line) => `> ${line}`).join('\n');
  const body = `Hi ${msg.name},\n\nThanks for reaching out!\n\n\n\n---\nOn ${new Date(msg.createdAt).toLocaleString()}, you wrote:\n${quoted}`;
  return `mailto:${encodeURIComponent(msg.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export default function MessagesManager({ initialMessages }) {
  const router = useRouter();
  const [messages, setMessages] = useState(initialMessages);
  const [open, setOpen] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [toast, setToast] = useState('');

  function showToast(text) {
    setToast(text);
    setTimeout(() => setToast(''), 2200);
  }

  async function openMessage(msg) {
    setOpen(msg);
    if (!msg.read) {
      setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, read: true } : m)));
      await fetch(`/api/messages/${msg.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read: true }),
      }).catch(() => {});
      router.refresh();
    }
  }

  async function confirmDelete() {
    const msg = pendingDelete;
    setPendingDelete(null);
    setOpen(null);
    setMessages((prev) => prev.filter((m) => m.id !== msg.id));
    await fetch(`/api/messages/${msg.id}`, { method: 'DELETE' }).catch(() => {});
    router.refresh();
    showToast('Message deleted.');
  }

  async function handleCopyEmail(email) {
    try {
      await navigator.clipboard.writeText(email);
      showToast('Email address copied.');
    } catch {
      showToast('Could not copy — select and copy manually.');
    }
  }

  const unreadCount = messages.filter((m) => !m.read).length;

  return (
    <>
      <div className="works-toolbar">
        <div className="page-sub" style={{ margin: 0 }}>
          {messages.length} total · {unreadCount} unread
        </div>
      </div>

      <div className="panel">
        {messages.length === 0 ? (
          <div className="empty-panel">No messages yet — they'll show up here as visitors use the contact form.</div>
        ) : (
          <table className="works-table">
            <thead>
              <tr><th></th><th>From</th><th>Project</th><th>Date</th><th></th></tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {messages.map((m) => (
                  <motion.tr
                    key={m.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ cursor: 'pointer' }}
                    onClick={() => openMessage(m)}
                  >
                    <td style={{ width: '10px' }}>
                      {!m.read && <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--red)', display: 'inline-block' }} />}
                    </td>
                    <td>
                      <div style={{ fontWeight: m.read ? 400 : 600 }}>{m.name}</div>
                      <div style={{ color: 'var(--muted)', fontSize: '12px' }}>{m.email}</div>
                    </td>
                    <td><span className="cat-badge">{m.projectType}</span></td>
                    <td>{timeAgo(m.createdAt)}</td>
                    <td>
                      <div className="row-actions">
                        <button className="del" onClick={(e) => { e.stopPropagation(); setPendingDelete(m); }}>Delete</button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        )}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            className="modal-overlay active"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setOpen(null)}
          >
            <motion.div
              className="modal"
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.25, ease: [0.2, 0.7, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3>{open.name}</h3>
              <div className="mgroup">
                <label>Email</label>
                <div style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span>{open.email}</span>
                  <button
                    onClick={() => handleCopyEmail(open.email)}
                    style={{
                      all: 'unset', cursor: 'pointer', fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: '10.5px', letterSpacing: '.04em', textTransform: 'uppercase',
                      color: 'var(--muted)', border: '1px solid var(--border)', padding: '4px 8px',
                    }}
                  >
                    Copy
                  </button>
                </div>
              </div>
              <div className="mgroup">
                <label>Project Type</label>
                <div style={{ fontSize: '14px' }}>{open.projectType}</div>
              </div>
              <div className="mgroup">
                <label>Sent</label>
                <div style={{ fontSize: '14px' }}>{new Date(open.createdAt).toLocaleString()}</div>
              </div>
              <div className="mgroup">
                <label>Message</label>
                <div style={{
                  fontSize: '14px', lineHeight: 1.7, whiteSpace: 'pre-wrap',
                  background: 'var(--surface-2)', border: '1px solid var(--border)', padding: '14px',
                }}>
                  {open.message}
                </div>
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--muted)', fontFamily: "'IBM Plex Mono', monospace", marginBottom: '4px' }}>
                "Reply by Email" opens your device's default mail app with this drafted in. No mail app
                set as default? Use "Copy" above and paste the address into whichever email client you use.
              </div>

              <div className="modal-actions">
                <button onClick={() => setOpen(null)}>Close</button>
                <a
                  href={buildMailto(open)}
                  className="add-btn"
                  style={{ flex: 1, textAlign: 'center', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  Reply by Email
                </a>
                <button className="save-btn" style={{ background: 'var(--red)', color: '#fff' }} onClick={() => setPendingDelete(open)}>
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete this message?"
        message={pendingDelete ? `The message from ${pendingDelete.name} will be permanently deleted.` : ''}
        confirmLabel="Delete"
        danger
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
      />

      <Toast message={toast} show={!!toast} />
    </>
  );
}
