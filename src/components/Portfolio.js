'use client';
import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { CATEGORY_LABELS as SHARED_CATEGORY_LABELS } from '@/lib/categories';

// "All" is a filter-only pseudo-category, not a real one a work can have -
// it's added here rather than in the shared list so the API's category
// validation never accidentally accepts "all" as a work's actual category.
const CATEGORY_LABELS = { all: 'All', ...SHARED_CATEGORY_LABELS };

function track(type, meta) {
  fetch('/api/activity', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, meta }),
  }).catch(() => {});
}

function ExpandIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
    </svg>
  );
}
function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

export default function Portfolio({ initialWorks }) {
  const [filter, setFilter] = useState('all');
  const [lightbox, setLightbox] = useState(null);

  const filtered = useMemo(
    () => (filter === 'all' ? initialWorks : initialWorks.filter((w) => w.category === filter)),
    [filter, initialWorks]
  );

  function handleFilter(cat) {
    setFilter(cat);
    if (cat !== 'all') track('filter_click', { category: CATEGORY_LABELS[cat] });
  }

  function openWork(work) {
    setLightbox(work);
    track('work_view', { workId: work.id, title: work.title });
  }

  // Escape key closes the lightbox, same as clicking the X or the backdrop.
  useEffect(() => {
    if (!lightbox) return;
    function handleKey(e) {
      if (e.key === 'Escape') setLightbox(null);
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [lightbox]);

  return (
    <section className="portfolio" id="work">
      <motion.div
        className="section-head"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.6 }}
      >
        <div className="section-title">Selected <span>Work</span></div>
        <div className="filters">
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
            <motion.button
              key={key}
              className={`filter-btn ${filter === key ? 'active' : ''}`}
              onClick={() => handleFilter(key)}
              whileTap={{ scale: 0.94 }}
            >
              {label}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {filtered.length === 0 ? (
        <motion.div className="empty-state" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          No projects in this category yet — check back soon.
        </motion.div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            className="grid"
            key={filter}
            initial="hidden"
            animate="show"
            exit={{ opacity: 0 }}
            variants={{ show: { transition: { staggerChildren: 0.06 } } }}
          >
            {filtered.map((work) => (
              <motion.div
                className="card"
                key={work.id}
                variants={{
                  hidden: { opacity: 0, y: 24 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.2, 0.7, 0.3, 1] } },
                }}
                whileHover={{ y: -6 }}
                onClick={() => openWork(work)}
              >
                <div className="card-media">
                  <Image
                    src={work.thumbUrl}
                    alt={work.title}
                    width={480}
                    height={600}
                    sizes="(max-width: 560px) 100vw, (max-width: 900px) 50vw, 33vw"
                    placeholder={work.blurDataUrl ? 'blur' : 'empty'}
                    blurDataURL={work.blurDataUrl || undefined}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  {/* Signals the image is clickable - fades in on hover,
                      and the custom cursor also enlarges over this element. */}
                  <div className="card-view-cue">
                    <span className="card-view-cue-icon"><ExpandIcon /></span>
                    <span className="card-view-cue-label">View Project</span>
                  </div>
                </div>
                <div className="card-info">
                  <h4>{work.title}</h4>
                  <span className="card-tag">{CATEGORY_LABELS[work.category]}</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      )}

      <AnimatePresence>
        {lightbox && (
          <motion.div
            onClick={() => setLightbox(null)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 200,
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px',
            }}
          >
            <motion.button
              onClick={(e) => { e.stopPropagation(); setLightbox(null); }}
              aria-label="Close"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.08, rotate: 90 }}
              whileTap={{ scale: 0.92 }}
              transition={{ duration: 0.25 }}
              style={{
                position: 'fixed', top: '28px', right: '32px', zIndex: 210,
                width: '44px', height: '44px', borderRadius: '50%',
                background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.25)',
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <CloseIcon />
            </motion.button>

            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.3, ease: [0.2, 0.7, 0.3, 1] }}
              style={{ maxWidth: '900px', width: '100%' }}
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={lightbox.imageUrl}
                alt={lightbox.title}
                width={2000}
                height={2500}
                placeholder={lightbox.blurDataUrl ? 'blur' : 'empty'}
                blurDataURL={lightbox.blurDataUrl || undefined}
                style={{ width: '100%', height: 'auto', maxHeight: '80vh', objectFit: 'contain' }}
              />
              <div style={{ color: '#fff', marginTop: '16px', fontFamily: "'Clash Display', sans-serif" }}>
                {lightbox.title}
              </div>
              {lightbox.description && (
                <div style={{ color: '#8F8D8C', fontSize: '14px', marginTop: '6px' }}>
                  {lightbox.description}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
