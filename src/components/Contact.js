'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { safeJson } from '@/lib/apiClient';

export default function Contact({ content }) {
  const [status, setStatus] = useState('idle'); // idle | sending | success | error
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('sending');
    setErrorMsg('');

    const form = e.target;
    const payload = {
      name: form.name.value.trim(),
      email: form.email.value.trim(),
      projectType: form.projectType.value,
      message: form.message.value.trim(),
    };

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await safeJson(res);

      if (!res.ok) {
        setStatus('error');
        setErrorMsg(data.error || 'Something went wrong. Please try again.');
        return;
      }

      setStatus('success');
      form.reset();
    } catch {
      setStatus('error');
      setErrorMsg('Could not send your message. Check your connection and try again.');
    }
  }

  return (
    <section className="contact" id="contact">
      <motion.div
        className="contact-left"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.7, ease: [0.2, 0.7, 0.3, 1] }}
      >
        <div className="eyebrow">Contact</div>
        <h2>{content.contactHeadingLine1}<br />{content.contactHeadingLine2.split(' ').map((w, i, arr) =>
          i === arr.length - 1 ? <span className="stroke" key={i} style={{ color: 'var(--red)' }}>{w}</span> : `${w} `
        )}</h2>
        <p>{content.contactSubtext}</p>
        <div className="contact-detail">
          <label>Email</label>
          <a href={`mailto:${content.contactEmail}`}>{content.contactEmail}</a>
        </div>
        {content.instagramUrl && (
          <div className="contact-detail">
            <label>Instagram</label>
            <a href={content.instagramUrl} target="_blank" rel="noopener noreferrer">{content.instagramUrl.replace(/^https?:\/\//, '')}</a>
          </div>
        )}
      </motion.div>

      <motion.div
        className="contact-right"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.7, ease: [0.2, 0.7, 0.3, 1], delay: 0.1 }}
      >
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Name</label>
              <input type="text" name="name" required placeholder="Your full name" />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" name="email" required placeholder="you@email.com" />
            </div>
          </div>
          <div className="form-group">
            <label>Project Type</label>
            <select name="projectType" required defaultValue="">
              <option value="" disabled>Select a category</option>
              <option>Brand Identity</option>
              <option>Logo Design</option>
              <option>Flyer / Poster</option>
              <option>Print</option>
              <option>Other</option>
            </select>
          </div>
          <div className="form-group">
            <label>Project Details</label>
            <textarea name="message" required placeholder="Tell me a bit about your project..." />
          </div>
          <motion.button
            type="submit"
            className="submit-btn"
            disabled={status === 'sending'}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
          >
            {status === 'sending' ? 'Sending…' : 'Send Message'}
          </motion.button>

          <AnimatePresence mode="wait">
            {status === 'success' && (
              <motion.div
                key="success"
                className="form-success"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                ✓ Message sent — Alexandra will get back to you within 24–48 hours.
              </motion.div>
            )}
            {status === 'error' && (
              <motion.div
                key="error"
                className="form-error"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                {errorMsg}
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </motion.div>
    </section>
  );
}
