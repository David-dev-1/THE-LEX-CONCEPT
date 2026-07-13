'use client';
import { motion } from 'framer-motion';

const SOCIAL_LINKS = [
  { key: 'instagramUrl', label: 'Instagram' },
  { key: 'facebookUrl', label: 'Facebook' },
  { key: 'tiktokUrl', label: 'TikTok' },
  { key: 'linkedinUrl', label: 'LinkedIn' },
  { key: 'upworkUrl', label: 'Upwork' },
  { key: 'whatsappUrl', label: 'WhatsApp' },
];

export default function Footer({ content }) {
  const activeSocials = SOCIAL_LINKS.filter((s) => content?.[s.key]);

  return (
    <motion.footer
      className="site-footer"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
    >
      <div className="footer-left">© {new Date().getFullYear()} THE LEX CONCEPT. All rights reserved.</div>
      <div className="footer-right">
        {activeSocials.map((s) => (
          <a key={s.key} href={content[s.key]} target="_blank" rel="noopener noreferrer">
            {s.label}
          </a>
        ))}
        {/* Admin dashboard entry point - kept quiet/low-emphasis here since
            it's staff-only, exactly where it was. */}
        <a href="/admin" className="admin-link">Studio Login</a>
      </div>
    </motion.footer>
  );
}
