'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmDialog from './ConfirmDialog';
import { CATEGORIES, CATEGORY_LABELS } from '@/lib/categories';
import { safeJson } from '@/lib/apiClient';

export default function WorksManager({ initialWorks }) {
  const router = useRouter();
  const [works, setWorks] = useState(initialWorks);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null); // work object or null for "new"
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('brand');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('live');
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [pendingDelete, setPendingDelete] = useState(null);

  function openNew() {
    setEditing(null);
    setTitle('');
    setCategory('brand');
    setDescription('');
    setStatus('live');
    setFile(null);
    setError('');
    setModalOpen(true);
  }

  function openEdit(work) {
    setEditing(work);
    setTitle(work.title);
    setCategory(work.category);
    setDescription(work.description || '');
    setStatus(work.status);
    setFile(null);
    setError('');
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
  }

  async function handleSave() {
    if (!title.trim()) {
      setError('Give the project a title.');
      return;
    }
    if (!editing && !file) {
      setError('Choose an image to upload.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      let imageUrl = editing?.imageUrl;
      let thumbUrl = editing?.thumbUrl;
      let blurDataUrl = editing?.blurDataUrl;

      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
        const uploadData = await safeJson(uploadRes);
        if (!uploadRes.ok) throw new Error(uploadData.error || 'Upload failed.');
        imageUrl = uploadData.imageUrl;
        thumbUrl = uploadData.thumbUrl;
        blurDataUrl = uploadData.blurDataUrl;
      }

      const payload = { title: title.trim(), category, description, status, imageUrl, thumbUrl, blurDataUrl };

      if (editing) {
        const res = await fetch(`/api/works/${editing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const updated = await safeJson(res);
        if (!res.ok) throw new Error(updated.error || 'Update failed.');
        setWorks((prev) => prev.map((w) => (w.id === updated.id ? updated : w)));
      } else {
        const res = await fetch('/api/works', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const created = await safeJson(res);
        if (!res.ok) throw new Error(created.error || 'Create failed.');
        setWorks((prev) => [created, ...prev]);
      }

      setModalOpen(false);
      router.refresh(); // refreshes server-rendered stats/activity elsewhere in the dashboard
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(work) {
    setPendingDelete(work);
  }

  async function confirmDelete() {
    const work = pendingDelete;
    setPendingDelete(null);
    const res = await fetch(`/api/works/${work.id}`, { method: 'DELETE' });
    if (res.ok) {
      setWorks((prev) => prev.filter((w) => w.id !== work.id));
      router.refresh();
    }
  }

  return (
    <>
      <div className="works-toolbar">
        <div className="page-sub" style={{ margin: 0 }}>{works.length} total works</div>
        <motion.button className="add-btn" onClick={openNew} whileTap={{ scale: 0.96 }}>
          + Upload New Work
        </motion.button>
      </div>

      <div className="panel">
        {works.length === 0 ? (
          <div className="empty-panel">No works yet — click "Upload New Work" to add your first project.</div>
        ) : (
          <table className="works-table">
            <thead>
              <tr><th>Work</th><th>Category</th><th>Date Added</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {works.map((w) => (
                  <motion.tr
                    key={w.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <td>
                      <div className="work-name-cell">
                        <img src={w.thumbUrl} alt="" className="thumb" />
                        <span>{w.title}</span>
                      </div>
                    </td>
                    <td><span className="cat-badge">{CATEGORY_LABELS[w.category] || w.category}</span></td>
                    <td>{new Date(w.createdAt).toLocaleDateString()}</td>
                    <td><span className={`status-badge ${w.status}`}>{w.status}</span></td>
                    <td>
                      <div className="row-actions">
                        <button onClick={() => openEdit(w)}>Edit</button>
                        <button className="del" onClick={() => handleDelete(w)}>Delete</button>
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
        {modalOpen && (
          <motion.div
            className="modal-overlay active"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="modal"
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.25, ease: [0.2, 0.7, 0.3, 1] }}
            >
              <h3>{editing ? 'Edit Work' : 'Upload New Work'}</h3>

              {editing && <img src={editing.imageUrl} alt="" className="upload-preview" />}

              <div className="mgroup">
                <label>Project Title</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Aurea Skincare" />
              </div>
              <div className="mgroup">
                <label>Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)}>
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div className="mgroup">
                <label>Image {editing && '(leave blank to keep current image) — high quality, up to 20MB'}</label>
                <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              </div>
              <div className="mgroup">
                <label>Description</label>
                <textarea rows="3" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short project description" />
              </div>
              <div className="mgroup">
                <label>Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="live">Live (visible on site)</option>
                  <option value="draft">Draft (hidden from visitors)</option>
                </select>
              </div>

              {error && <div className="inline-msg err">{error}</div>}

              <div className="modal-actions">
                <button onClick={closeModal} disabled={saving}>Cancel</button>
                <motion.button className="save-btn" onClick={handleSave} disabled={saving} whileTap={{ scale: 0.97 }}>
                  {saving ? 'Saving…' : 'Save Work'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete this work?"
        message={pendingDelete ? `"${pendingDelete.title}" will be permanently removed from the portfolio.` : ''}
        confirmLabel="Delete"
        danger
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
      />
    </>
  );
}
