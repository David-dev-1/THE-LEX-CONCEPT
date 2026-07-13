'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmDialog from './ConfirmDialog';
import Toast from './Toast';
import { safeJson } from '@/lib/apiClient';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending Review' },
  { value: 'changes_requested', label: 'Changes Requested' },
  { value: 'approved', label: 'Approved' },
];

export default function ProofDetail({ proof }) {
  const router = useRouter();
  const fileInputRef = useRef(null);

  const [images, setImages] = useState(proof.images);
  const [status, setStatus] = useState(proof.status);
  const [uploading, setUploading] = useState(false);
  const [activePin, setActivePin] = useState(null); // { imageId, commentId }
  const [pendingDeleteImage, setPendingDeleteImage] = useState(null);
  const [pendingDeleteProof, setPendingDeleteProof] = useState(null);
  const [pinResetResult, setPinResetResult] = useState(null);
  const [toast, setToast] = useState('');

  const link = typeof window !== 'undefined' ? `${window.location.origin}/proof/${proof.token}` : '';

  function showToast(text) {
    setToast(text);
    setTimeout(() => setToast(''), 2200);
  }

  async function handleStatusChange(newStatus) {
    setStatus(newStatus);
    await fetch(`/api/proofs/${proof.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    }).catch(() => {});
    router.refresh();
  }

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`/api/proofs/${proof.id}/images`, { method: 'POST', body: formData });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data.error || 'Upload failed.');
      setImages((prev) => [...prev, { ...data, comments: [] }]);
      showToast('Image added.');
    } catch (err) {
      showToast(err.message || 'Something went wrong.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function confirmDeleteImage() {
    const image = pendingDeleteImage;
    setPendingDeleteImage(null);
    setImages((prev) => prev.filter((i) => i.id !== image.id));
    await fetch(`/api/proofs/${proof.id}/images/${image.id}`, { method: 'DELETE' }).catch(() => {});
    router.refresh();
  }

  async function toggleResolved(imageId, commentId, resolved) {
    setImages((prev) => prev.map((img) =>
      img.id === imageId
        ? { ...img, comments: img.comments.map((c) => (c.id === commentId ? { ...c, resolved } : c)) }
        : img
    ));
    await fetch(`/api/proof/${proof.token}/comments/${commentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resolved }),
    }).catch(() => {});
  }

  async function handleResetPin() {
    const res = await fetch(`/api/proofs/${proof.id}/reset-pin`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    const data = await safeJson(res);
    if (res.ok) setPinResetResult(data.pin);
  }

  async function confirmDeleteProof() {
    setPendingDeleteProof(false);
    await fetch(`/api/proofs/${proof.id}`, { method: 'DELETE' }).catch(() => {});
    router.push('/admin/dashboard/proofs');
  }

  async function copy(text, label) {
    try {
      await navigator.clipboard.writeText(text);
      showToast(`${label} copied.`);
    } catch {
      showToast('Could not copy — select and copy manually.');
    }
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px', gap: '20px', flexWrap: 'wrap' }}>
        <div>
          <div className="page-title">{proof.title}</div>
          <div className="page-sub" style={{ marginBottom: 0 }}>
            {proof.clientName ? `For ${proof.clientName}` : 'No client name set'}
            {proof.clientEmail ? ` · ${proof.clientEmail}` : ''}
          </div>
        </div>
        <Link href="/admin/dashboard/proofs" className="link-ghost" style={{ whiteSpace: 'nowrap' }}>← All Proofs</Link>
      </div>

      <div className="panel" style={{ padding: '20px 24px', marginBottom: '24px', marginTop: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '18px', alignItems: 'end' }}>
          <div className="mgroup" style={{ marginBottom: 0 }}>
            <label>Status</label>
            <select value={status} onChange={(e) => handleStatusChange(e.target.value)}>
              {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div className="mgroup" style={{ marginBottom: 0 }}>
            <label>Private Link</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input readOnly value={link} style={{ flex: 1, fontSize: '12.5px' }} />
              <button className="add-btn" style={{ padding: '0 14px' }} onClick={() => copy(link, 'Link')}>Copy</button>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="add-btn" onClick={handleResetPin}>Reset PIN</button>
            <button className="row-actions del" style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--muted)', padding: '11px 16px', cursor: 'pointer', fontFamily: "'IBM Plex Mono', monospace", fontSize: '12.5px' }} onClick={() => setPendingDeleteProof(true)}>
              Delete Proof
            </button>
          </div>
        </div>

        {pinResetResult && (
          <div className="inline-msg" style={{ marginTop: '14px', color: 'var(--text)', background: 'var(--surface-2)', border: '1px solid var(--border)', padding: '12px 14px' }}>
            New PIN: <strong style={{ fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.1em' }}>{pinResetResult}</strong> — share this with your client (won't be shown again).
            <button style={{ all: 'unset', cursor: 'pointer', marginLeft: '14px', color: 'var(--red)', fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', textTransform: 'uppercase' }} onClick={() => copy(pinResetResult, 'PIN')}>Copy</button>
          </div>
        )}
      </div>

      <div className="works-toolbar">
        <div className="page-sub" style={{ margin: 0 }}>{images.length} image{images.length === 1 ? '' : 's'}</div>
        <label className="add-btn" style={{ cursor: 'pointer' }}>
          {uploading ? 'Uploading…' : '+ Add Image'}
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUpload} disabled={uploading} style={{ display: 'none' }} />
        </label>
      </div>

      {images.length === 0 ? (
        <div className="panel empty-panel">No images yet — add one so your client has something to review.</div>
      ) : (
        <div style={{ display: 'grid', gap: '28px' }}>
          {images.map((image) => (
            <div className="panel" key={image.id} style={{ overflow: 'hidden' }}>
              <div style={{ background: 'var(--surface-2)', textAlign: 'center' }}>
                <div style={{ position: 'relative', display: 'inline-block', lineHeight: 0 }}>
                  <img src={image.imageUrl} alt="" style={{ display: 'block', maxWidth: '100%', maxHeight: '60vh', width: 'auto', height: 'auto' }} />
                {image.comments.map((c, i) => (
                  <button
                    key={c.id}
                    onClick={() => setActivePin(activePin?.commentId === c.id ? null : { imageId: image.id, commentId: c.id })}
                    style={{
                      position: 'absolute', left: `${c.x}%`, top: `${c.y}%`, transform: 'translate(-50%, -50%)',
                      width: '26px', height: '26px', borderRadius: '50% 50% 50% 0',
                      background: c.resolved ? 'var(--muted)' : 'var(--red)', color: '#fff', border: '2px solid #fff',
                      fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600,
                    }}
                  >
                    {i + 1}
                  </button>
                ))}
                </div>
              </div>

              <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: image.comments.length ? '1px solid var(--border)' : 'none' }}>
                <div style={{ fontSize: '13px', color: 'var(--muted)' }}>
                  {image.title || 'Untitled image'} · {image.comments.length} comment{image.comments.length === 1 ? '' : 's'}
                </div>
                <button className="row-actions del" style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--muted)', padding: '7px 12px', cursor: 'pointer', fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px' }} onClick={() => setPendingDeleteImage(image)}>
                  Delete Image
                </button>
              </div>

              {image.comments.length > 0 && (
                <div>
                  {image.comments.map((c, i) => (
                    <div key={c.id} className="activity-item" style={{ background: activePin?.commentId === c.id ? 'var(--surface-2)' : 'transparent' }}>
                      <div className={`dot ${c.authorType === 'admin' ? 'edit' : 'message'}`}></div>
                      <div style={{ flex: 1 }}>
                        <div className="activity-text">
                          <strong>#{i + 1} {c.authorName}:</strong> {c.message}
                        </div>
                        <div className="activity-time">{new Date(c.createdAt).toLocaleString()}</div>
                      </div>
                      <button
                        onClick={() => toggleResolved(image.id, c.id, !c.resolved)}
                        style={{
                          all: 'unset', cursor: 'pointer', fontFamily: "'IBM Plex Mono', monospace", fontSize: '10.5px',
                          letterSpacing: '.04em', textTransform: 'uppercase', color: c.resolved ? 'var(--green)' : 'var(--muted)',
                          border: '1px solid var(--border)', padding: '5px 10px', whiteSpace: 'nowrap',
                        }}
                      >
                        {c.resolved ? '✓ Resolved' : 'Mark Resolved'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!pendingDeleteImage}
        title="Delete this image?"
        message="This also deletes every comment pinned to it. This can't be undone."
        confirmLabel="Delete"
        danger
        onCancel={() => setPendingDeleteImage(null)}
        onConfirm={confirmDeleteImage}
      />
      <ConfirmDialog
        open={pendingDeleteProof}
        title="Delete this entire proof?"
        message={`"${proof.title}" and all its images and feedback will be permanently deleted. The client's link will stop working.`}
        confirmLabel="Delete Everything"
        danger
        onCancel={() => setPendingDeleteProof(false)}
        onConfirm={confirmDeleteProof}
      />
      <Toast message={toast} show={!!toast} />
    </>
  );
}
