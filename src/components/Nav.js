'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}
function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

export default function Nav() {
  const [isLight, setIsLight] = useState(false);
  const [activeSection, setActiveSection] = useState('');

  useEffect(() => {
    setIsLight(document.documentElement.classList.contains('light'));

    const sections = ['work', 'about', 'contact']
      .map((id) => document.getElementById(id))
      .filter(Boolean);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { rootMargin: '-40% 0px -50% 0px' }
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  function toggleTheme() {
    const next = !isLight;
    setIsLight(next);
    document.documentElement.classList.toggle('light', next);
    try {
      localStorage.setItem('theme', next ? 'light' : 'dark');
    } catch {}
  }

  return (
    <motion.nav
      className="site-nav"
      initial={{ y: -30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.2, 0.7, 0.3, 1] }}
    >
      <div className="brand">
        <Image
          src={isLight ? '/images/logo-for-light-bg.png' : '/images/logo-for-dark-bg.png'}
          alt="THE LEX CONCEPT logo"
          width={34}
          height={34}
          priority
          style={{ height: '34px', width: 'auto' }}
        />
        <div className="brand-name">
          THE LEX<span>·</span>CONCEPT
        </div>
      </div>

      <ul className="nav-links">
        <li><a href="#work" className={activeSection === 'work' ? 'active' : ''}>Work</a></li>
        <li><a href="#about" className={activeSection === 'about' ? 'active' : ''}>About</a></li>
        <li><a href="#contact" className={activeSection === 'contact' ? 'active' : ''}>Contact</a></li>
      </ul>

      <div className="nav-right">
        <motion.button
          className="icon-btn"
          aria-label="Toggle dark and light mode"
          onClick={toggleTheme}
          whileTap={{ scale: 0.85 }}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={isLight ? 'sun' : 'moon'}
              initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.35, ease: [0.2, 0.7, 0.3, 1] }}
              style={{ display: 'flex' }}
            >
              {isLight ? <SunIcon /> : <MoonIcon />}
            </motion.span>
          </AnimatePresence>
        </motion.button>

        <motion.a href="#contact" className="btn-primary" whileHover={{ y: -2 }} whileTap={{ scale: 0.96 }}>
          Start a project
        </motion.a>
      </div>
    </motion.nav>
  );
}
