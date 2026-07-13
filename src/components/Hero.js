'use client';
import { motion } from 'framer-motion';

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};
const item = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.2, 0.7, 0.3, 1] } },
};

export default function Hero({ content }) {
  return (
    <motion.header className="hero" initial="hidden" animate="show" variants={container}>
      <div className="hero-grid">
        <div>
          <motion.div className="eyebrow" variants={item}>{content.heroEyebrow}</motion.div>
          <motion.h1 variants={item}>
            {content.heroHeadingLine1}<br />
            {content.heroHeadingLine2.split(' ').map((word, i, arr) =>
              i === arr.length - 1 ? <span className="stroke" key={i}>{word}</span> : `${word} `
            )}
          </motion.h1>
          <motion.p className="hero-sub" variants={item}>{content.heroSubtext}</motion.p>
          <motion.div className="hero-cta" variants={item}>
            <motion.a href="#work" className="btn-primary" whileHover={{ y: -2 }} whileTap={{ scale: 0.96 }}>
              View the work
            </motion.a>
            <motion.a href="#contact" className="link-ghost" whileHover={{ x: 4 }}>
              Commission a project →
            </motion.a>
          </motion.div>
        </div>
        <motion.div className="hero-meta" variants={item}>
          <div><strong>Tools</strong>{content.heroToolsLabel}</div>
          <div><strong>Focus</strong>{content.heroFocusLabel}</div>
          <div><strong>Based</strong>{content.heroBasedLabel}</div>
        </motion.div>
      </div>
    </motion.header>
  );
}
