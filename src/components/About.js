'use client';
import { motion } from 'framer-motion';
import Image from 'next/image';
import AnimatedCounter from './AnimatedCounter';

export default function About({ content }) {
  return (
    <section className="about" id="about">
      <motion.div
        className="about-portrait"
        initial={{ opacity: 0, x: -30 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.7, ease: [0.2, 0.7, 0.3, 1] }}
      >
        {content.aboutImageUrl ? (
          <Image
            src={content.aboutImageUrl}
            alt="Alexandra Fajemirokun"
            width={800}
            height={1000}
            sizes="(max-width: 900px) 100vw, 45vw"
            placeholder={content.aboutImageBlurDataUrl ? 'blur' : 'empty'}
            blurDataURL={content.aboutImageBlurDataUrl || undefined}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <span>PORTRAIT<br />— photo pending —</span>
        )}
      </motion.div>

      <motion.div
        className="about-copy"
        initial={{ opacity: 0, x: 30 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.7, ease: [0.2, 0.7, 0.3, 1], delay: 0.1 }}
      >
        <div className="eyebrow">About</div>
        <h2>{content.aboutHeadingLine1}<br /><span>{content.aboutHeadingLine2}</span></h2>
        <p>{content.aboutParagraph1}</p>
        <p>{content.aboutParagraph2}</p>
        <div className="tools-row">
          {['Photoshop', 'CorelDraw', 'Brand Strategy', 'Print Design'].map((tool, i) => (
            <motion.div
              className="tool-pill"
              key={tool}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.15 + i * 0.06 }}
            >
              {tool}
            </motion.div>
          ))}
        </div>
        <div className="about-stats">
          <div>
            <div className="stat-num"><AnimatedCounter value={content.statProjects} suffix="+" /></div>
            <div className="stat-label">Projects Delivered</div>
          </div>
          <div>
            <div className="stat-num"><AnimatedCounter value={content.statYears} suffix="+" /></div>
            <div className="stat-label">Years Designing</div>
          </div>
          <div>
            <div className="stat-num"><AnimatedCounter value={content.statSatisfaction} suffix="%" /></div>
            <div className="stat-label">Client Satisfaction</div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
