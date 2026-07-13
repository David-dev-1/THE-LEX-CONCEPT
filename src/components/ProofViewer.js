'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { safeJson } from '@/lib/apiClient';

const STATUS_LABELS = {
  pending: 'Pending Review',
  changes_requested: 'Changes Requested',
  approved: 'Approved ✓',
};

function getStoredName(token) {
  try {
    return localStorage.getItem(`proof_client_name_${token}`) || '';
  } catch {
    return '';
  }
}
function storeName(token, name) {
  try {
    localStorage.setItem(`proof_client_name_${token}`, name);
  } catch {}
}

export default function ProofViewer({ token }) {
  const [loading, setLoading] = useState(true);
  const [unlocked, setUnlocked] = useState(false);
  const [proof, setProof] = useState(null);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [unlocking, setUnlocking] = useState(false);
  const [draftPin, setDraftPin] = useState(null); // { imageId, x, y }
  const [draftMessage, setDraftMessage] = useState('');
  const [draftName, setDraftName] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [statusError, setStatusError] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState('');

  useEffect(() => {
    fetchProof();
    setDraftName(getStoredName(token));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchProof() {
    setLoading(true);
    const res = await fetch(`/api/proof/${token}`);
    if (res.ok) {
      const data = await safeJson(res);
      setProof(data);
      setUnlocked(true);
    } else {
      setUnlocked(false);
    }
    setLoading(false);
  }

  async function handleUnlock(e) {
    e.preventDefault();
    setUnlocking(true);
    setPinError('');
    try {
      const res = await fetch(`/api/proof/${token}/unlock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      const data = await safeJson(res);
      if (!res.ok) {
        setPinError(data.error || 'Incorrect PIN.');
        return;
      }
      await fetchProof();
    } catch {
      setPinError('Could not reach the server. Try again.');
    } finally {
      setUnlocking(false);
    }
  }

  function handleImageClick(e, imageId) {
    if (draftPin) return; // one draft pin at a time
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setDraftPin({ imageId, x, y });
    setDraftMessage('');
  }

  async function submitDraftPin() {
    if (!draftMessage.trim()) return;
    const name = draftName.trim() || 'Client';
    storeName(token, name);
    setSubmittingComment(true);
    setCommentError('');

    try {
      const res = await fetch(`/api/proof/${token}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proofImageId: draftPin.imageId,
          x: draftPin.x,
          y: draftPin.y,
          message: draftMessage.trim(),
          authorName: name,
        }),
      });

      if (res.status === 401) {
        // The session expired (or the cookie got cleared) - send them
        // back to the PIN gate instead of just failing silently.
        setUnlocked(false);
        return;
      }

      const data = await safeJson(res);
      if (!res.ok) {
        setCommentError(data.error || 'Could not add that comment. Try again.');
        return;
      }

      setProof((prev) => ({
        ...prev,
        images: prev.images.map((img) =>
          img.id === draftPin.imageId ? { ...img, comments: [...img.comments, data] } : img
        ),
      }));
      setDraftPin(null);
      setDraftMessage('');
    } catch {
      setCommentError('Could not reach the server. Check your connection and try again.');
    } finally {
      setSubmittingComment(false);
    }
  }

  async function handleStatus(status) {
    setStatusError('');
    try {
      const res = await fetch(`/api/proof/${token}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (res.status === 401) {
        setUnlocked(false);
        return;
      }

      const data = await safeJson(res);
      if (!res.ok) {
        setStatusError(data.error || 'Could not update the status. Try again.');
        return;
      }

      setProof((prev) => ({ ...prev, status }));
      setStatusMsg(status === 'approved' ? 'Marked as approved — thank you!' : 'Changes requested — the designer has been notified.');
      setTimeout(() => setStatusMsg(''), 4000);
    } catch {
      setStatusError('Could not reach the server. Check your connection and try again.');
    }
  }

  if (loading) {
    return <div className="proof-shell"><div className="proof-loading">Loading…</div></div>;
  }

  if (!unlocked) {
    return (
      <div className="admin-login-screen">
        <motion.div
          className="login-box"
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="login-brand">Design Proof</div>
          <div className="login-sub">Enter the PIN your designer shared with you</div>
          <form onSubmit={handleUnlock}>
            <div className="lgroup">
              <label>PIN</label>
              <input
                type="text"
                inputMode="numeric"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="e.g. 4821"
                autoFocus
              />
            </div>
            <motion.button className="login-btn" type="submit" disabled={unlocking} whileTap={{ scale: 0.97 }}>
              {unlocking ? 'Checking…' : 'View Proof'}
            </motion.button>
            {pinError && <div className="login-error">{pinError}</div>}
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="proof-shell">
      <header className="proof-header">
        <div>
          <div className="proof-title">{proof.title}</div>
          <div className="proof-status">{STATUS_LABELS[proof.status] || proof.status}</div>
        </div>
      </header>

      <div className="proof-notice">
        This is a watermarked preview for review purposes. Click anywhere on an image to leave feedback
        pinned to that exact spot.
      </div>

      <div className="proof-images">
        {proof.images.map((image) => (
          <div className="proof-image-card" key={image.id}>
            <div
              className="proof-image-frame"
              onClick={(e) => handleImageClick(e, image.id)}
              onContextMenu={(e) => e.preventDefault()}
            >
              <img src={image.imageUrl} alt="" draggable={false} onDragStart={(e) => e.preventDefault()} />

              {image.comments.map((c, i) => (
                <div
                  key={c.id}
                  className={`proof-pin ${c.resolved ? 'resolved' : ''}`}
                  style={{ left: `${c.x}%`, top: `${c.y}%` }}
                  title={c.message}
                  onClick={(e) => e.stopPropagation()}
                >
                  {i + 1}
                </div>
              ))}

              {draftPin && draftPin.imageId === image.id && (
                <div
                  className="proof-pin-draft"
                  style={{ left: `${draftPin.x}%`, top: `${draftPin.y}%` }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className={`proof-pin-popover ${draftPin.x > 55 ? 'flip-x' : ''} ${draftPin.y > 55 ? 'flip-y' : ''}`}>
                    <input
                      placeholder="Your name"
                      value={draftName}
                      onChange={(e) => setDraftName(e.target.value)}
                    />
                    <textarea
                      placeholder="What should change here?"
                      value={draftMessage}
                      onChange={(e) => setDraftMessage(e.target.value)}
                      autoFocus
                      rows={3}
                    />
                    {commentError && <div className="login-error" style={{ marginBottom: '8px' }}>{commentError}</div>}
                    <div className="proof-pin-popover-actions">
                      <button onClick={() => { setDraftPin(null); setCommentError(''); }}>Cancel</button>
                      <button className="proof-pin-submit" onClick={submitDraftPin} disabled={submittingComment}>
                        {submittingComment ? 'Adding…' : 'Add Comment'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            {image.title && <div className="proof-image-caption">{image.title}</div>}
          </div>
        ))}
      </div>

      <div className="proof-actions" style={{ flexDirection: 'column', gap: '12px' }}>
        <AnimatePresence mode="wait">
          {statusMsg ? (
            <motion.div key="msg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="proof-status-msg">
              {statusMsg}
            </motion.div>
          ) : (
            <motion.div key="btns" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: 'flex', gap: '14px' }}>
              <button className="link-ghost" onClick={() => handleStatus('changes_requested')}>Request Changes</button>
              <button className="btn-primary" onClick={() => handleStatus('approved')}>Approve Final</button>
            </motion.div>
          )}
        </AnimatePresence>
        {statusError && <div className="login-error">{statusError}</div>}
      </div>

      <div className="proof-footer-note">
        Preview images are watermarked and provided for review only — not for redistribution or final use.
      </div>
    </div>
  );
}
