'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmDialog from './ConfirmDialog';

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

// showClearAll: pass true only on the full Activity Log page, not the
// Overview snippet, so "clear everything" isn't one accidental click away
// from the dashboard home.
export default function ActivityFeed({ items, showClearAll = false }) {
  const router = useRouter();
  const [list, setList] = useState(items);
  const [clearing, setClearing] = useState(false);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);

  async function handleDelete(id) {
    setList((prev) => prev.filter((i) => i.id !== id));
    await fetch(`/api/activity/${id}`, { method: 'DELETE' }).catch(() => {});
    router.refresh();
  }

  async function handleClearAll() {
    setConfirmClearOpen(false);
    setClearing(true);
    await fetch('/api/activity', { method: 'DELETE' }).catch(() => {});
    setList([]);
    setClearing(false);
    router.refresh();
  }

  return (
    <div>
      {showClearAll && list.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '14px 22px 0' }}>
          <button className="row-actions del" style={{ all: 'unset', cursor: 'pointer' }} onClick={() => setConfirmClearOpen(true)} disabled={clearing}>
            <span style={{
              fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', letterSpacing: '.05em',
              textTransform: 'uppercase', color: 'var(--muted)', border: '1px solid var(--border)',
              padding: '7px 12px', display: 'inline-block',
            }}>
              {clearing ? 'Clearing…' : 'Clear All Activity'}
            </span>
          </button>
        </div>
      )}

      {list.length === 0 ? (
        <div className="empty-panel">No activity recorded yet — activity appears here as visitors use the site.</div>
      ) : (
        <AnimatePresence initial={false}>
          {list.map((item) => (
            <motion.div
              className="activity-item"
              key={item.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0, paddingTop: 0, paddingBottom: 0 }}
              transition={{ duration: 0.25 }}
              style={{ overflow: 'hidden', justifyContent: 'space-between' }}
            >
              <div style={{ display: 'flex', gap: '14px' }}>
                <div className={`dot ${item.type}`}></div>
                <div>
                  <div className="activity-text">{item.message}</div>
                  <div className="activity-time">{timeAgo(item.createdAt)}</div>
                </div>
              </div>
              <button
                onClick={() => handleDelete(item.id)}
                aria-label="Delete this activity entry"
                style={{
                  all: 'unset', cursor: 'pointer', color: 'var(--muted)', fontSize: '16px',
                  lineHeight: 1, padding: '4px 8px',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--red)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--muted)')}
              >
                ×
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      )}

      <ConfirmDialog
        open={confirmClearOpen}
        title="Clear the entire activity log?"
        message="This also resets the dashboard stats, since they're calculated from this history. This can't be undone."
        confirmLabel="Clear Everything"
        danger
        onCancel={() => setConfirmClearOpen(false)}
        onConfirm={handleClearAll}
      />
    </div>
  );
}
