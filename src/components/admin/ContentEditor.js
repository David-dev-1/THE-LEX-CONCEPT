'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { safeJson } from '@/lib/apiClient';

function useContentField(initial) {
  const [values, setValues] = useState(initial);
  function set(key, value) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }
  return [values, set];
}

async function saveContent(fields) {
  const res = await fetch('/api/content', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fields),
  });
  const data = await safeJson(res);
  if (!res.ok) throw new Error(data.error || 'Something went wrong.');
  return data;
}

function SectionPanel({ title, children, onSave, saving, status }) {
  return (
    <motion.div
      className="panel settings-panel"
      style={{ marginBottom: '24px' }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="panel-head" style={{ margin: '-24px -24px 20px', padding: '18px 24px' }}>{title}</div>
      {children}
      {status && <div className={`inline-msg ${status.type === 'ok' ? 'ok' : 'err'}`}>{status.message}</div>}
      <motion.button className="add-btn" type="button" style={{ marginTop: '14px' }} onClick={onSave} disabled={saving} whileTap={{ scale: 0.97 }}>
        {saving ? 'Saving…' : 'Save Changes'}
      </motion.button>
    </motion.div>
  );
}

export default function ContentEditor({ initialContent }) {
  const router = useRouter();
  const [hero, setHero] = useContentField({
    heroEyebrow: initialContent.heroEyebrow,
    heroHeadingLine1: initialContent.heroHeadingLine1,
    heroHeadingLine2: initialContent.heroHeadingLine2,
    heroSubtext: initialContent.heroSubtext,
    heroToolsLabel: initialContent.heroToolsLabel,
    heroFocusLabel: initialContent.heroFocusLabel,
    heroBasedLabel: initialContent.heroBasedLabel,
  });
  const [about, setAbout] = useContentField({
    aboutHeadingLine1: initialContent.aboutHeadingLine1,
    aboutHeadingLine2: initialContent.aboutHeadingLine2,
    aboutParagraph1: initialContent.aboutParagraph1,
    aboutParagraph2: initialContent.aboutParagraph2,
    aboutImageUrl: initialContent.aboutImageUrl || '',
    aboutImageBlurDataUrl: initialContent.aboutImageBlurDataUrl || '',
    statProjects: initialContent.statProjects,
    statYears: initialContent.statYears,
    statSatisfaction: initialContent.statSatisfaction,
  });
  const [uploadingAboutImage, setUploadingAboutImage] = useState(false);
  const [aboutImageError, setAboutImageError] = useState('');
  const [contact, setContact] = useContentField({
    contactHeadingLine1: initialContent.contactHeadingLine1,
    contactHeadingLine2: initialContent.contactHeadingLine2,
    contactSubtext: initialContent.contactSubtext,
    contactEmail: initialContent.contactEmail,
    instagramUrl: initialContent.instagramUrl || '',
    facebookUrl: initialContent.facebookUrl || '',
    tiktokUrl: initialContent.tiktokUrl || '',
    linkedinUrl: initialContent.linkedinUrl || '',
    upworkUrl: initialContent.upworkUrl || '',
    whatsappUrl: initialContent.whatsappUrl || '',
  });

  const [savingHero, setSavingHero] = useState(false);
  const [savingAbout, setSavingAbout] = useState(false);
  const [savingContact, setSavingContact] = useState(false);
  const [heroStatus, setHeroStatus] = useState(null);
  const [aboutStatus, setAboutStatus] = useState(null);
  const [contactStatus, setContactStatus] = useState(null);

  async function handleAboutImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAboutImage(true);
    setAboutImageError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data.error || 'Upload failed.');

      // Use the full-quality image for the About portrait (it's a single
      // large photo, not a grid thumbnail) and store the blur preview too.
      setAbout('aboutImageUrl', data.imageUrl);
      setAbout('aboutImageBlurDataUrl', data.blurDataUrl || '');
    } catch (err) {
      setAboutImageError(err.message || 'Something went wrong.');
    } finally {
      setUploadingAboutImage(false);
    }
  }

  async function handleSaveHero() {
    setSavingHero(true);
    setHeroStatus(null);
    try {
      await saveContent(hero);
      setHeroStatus({ type: 'ok', message: 'Hero section updated.' });
      router.refresh();
    } catch (err) {
      setHeroStatus({ type: 'err', message: err.message });
    } finally {
      setSavingHero(false);
    }
  }

  async function handleSaveAbout() {
    setSavingAbout(true);
    setAboutStatus(null);
    try {
      await saveContent(about);
      setAboutStatus({ type: 'ok', message: 'About section updated.' });
      router.refresh();
    } catch (err) {
      setAboutStatus({ type: 'err', message: err.message });
    } finally {
      setSavingAbout(false);
    }
  }

  async function handleSaveContact() {
    setSavingContact(true);
    setContactStatus(null);
    try {
      await saveContent(contact);
      setContactStatus({ type: 'ok', message: 'Contact section updated.' });
      router.refresh();
    } catch (err) {
      setContactStatus({ type: 'err', message: err.message });
    } finally {
      setSavingContact(false);
    }
  }

  return (
    <>
      <SectionPanel title="Hero Section" onSave={handleSaveHero} saving={savingHero} status={heroStatus}>
        <div className="mgroup">
          <label>Eyebrow Text</label>
          <input value={hero.heroEyebrow} onChange={(e) => setHero('heroEyebrow', e.target.value)} />
        </div>
        <div className="mgroup">
          <label>Headline — Line 1</label>
          <input value={hero.heroHeadingLine1} onChange={(e) => setHero('heroHeadingLine1', e.target.value)} />
        </div>
        <div className="mgroup">
          <label>Headline — Line 2 (last word is highlighted in red)</label>
          <input value={hero.heroHeadingLine2} onChange={(e) => setHero('heroHeadingLine2', e.target.value)} />
        </div>
        <div className="mgroup">
          <label>Subtext</label>
          <textarea rows="3" value={hero.heroSubtext} onChange={(e) => setHero('heroSubtext', e.target.value)} />
        </div>
        <div className="mgroup">
          <label>Tools Label</label>
          <input value={hero.heroToolsLabel} onChange={(e) => setHero('heroToolsLabel', e.target.value)} />
        </div>
        <div className="mgroup">
          <label>Focus Label</label>
          <input value={hero.heroFocusLabel} onChange={(e) => setHero('heroFocusLabel', e.target.value)} />
        </div>
        <div className="mgroup">
          <label>Based Label</label>
          <input value={hero.heroBasedLabel} onChange={(e) => setHero('heroBasedLabel', e.target.value)} />
        </div>
      </SectionPanel>

      <SectionPanel title="About Section" onSave={handleSaveAbout} saving={savingAbout} status={aboutStatus}>
        <div className="mgroup">
          <label>Portrait Photo</label>
          {about.aboutImageUrl && (
            <img src={about.aboutImageUrl} alt="" className="upload-preview" style={{ marginBottom: '10px' }} />
          )}
          <input type="file" accept="image/*" onChange={handleAboutImageUpload} disabled={uploadingAboutImage} />
          {uploadingAboutImage && <div className="inline-msg" style={{ color: 'var(--muted)' }}>Uploading…</div>}
          {aboutImageError && <div className="inline-msg err">{aboutImageError}</div>}
        </div>
        <div className="mgroup">
          <label>Headline — Line 1</label>
          <input value={about.aboutHeadingLine1} onChange={(e) => setAbout('aboutHeadingLine1', e.target.value)} />
        </div>
        <div className="mgroup">
          <label>Headline — Line 2 (highlighted in red)</label>
          <input value={about.aboutHeadingLine2} onChange={(e) => setAbout('aboutHeadingLine2', e.target.value)} />
        </div>
        <div className="mgroup">
          <label>Paragraph 1</label>
          <textarea rows="3" value={about.aboutParagraph1} onChange={(e) => setAbout('aboutParagraph1', e.target.value)} />
        </div>
        <div className="mgroup">
          <label>Paragraph 2</label>
          <textarea rows="3" value={about.aboutParagraph2} onChange={(e) => setAbout('aboutParagraph2', e.target.value)} />
        </div>
        <div className="form-row">
          <div className="mgroup">
            <label>Projects Delivered</label>
            <input type="number" value={about.statProjects} onChange={(e) => setAbout('statProjects', e.target.value)} />
          </div>
          <div className="mgroup">
            <label>Years Designing</label>
            <input type="number" value={about.statYears} onChange={(e) => setAbout('statYears', e.target.value)} />
          </div>
        </div>
        <div className="mgroup">
          <label>Client Satisfaction (%)</label>
          <input type="number" value={about.statSatisfaction} onChange={(e) => setAbout('statSatisfaction', e.target.value)} />
        </div>
      </SectionPanel>

      <SectionPanel title="Contact Section &amp; Social Links" onSave={handleSaveContact} saving={savingContact} status={contactStatus}>
        <div className="mgroup">
          <label>Headline — Line 1</label>
          <input value={contact.contactHeadingLine1} onChange={(e) => setContact('contactHeadingLine1', e.target.value)} />
        </div>
        <div className="mgroup">
          <label>Headline — Line 2 (last word highlighted in red)</label>
          <input value={contact.contactHeadingLine2} onChange={(e) => setContact('contactHeadingLine2', e.target.value)} />
        </div>
        <div className="mgroup">
          <label>Subtext</label>
          <textarea rows="3" value={contact.contactSubtext} onChange={(e) => setContact('contactSubtext', e.target.value)} />
        </div>
        <div className="mgroup">
          <label>Contact Email</label>
          <input type="email" value={contact.contactEmail} onChange={(e) => setContact('contactEmail', e.target.value)} />
        </div>

        <div className="mgroup" style={{ marginTop: '22px', borderTop: '1px dashed var(--border)', paddingTop: '18px' }}>
          <label>Instagram URL (leave blank to hide)</label>
          <input value={contact.instagramUrl} onChange={(e) => setContact('instagramUrl', e.target.value)} placeholder="https://instagram.com/thelexconcept" />
        </div>
        <div className="mgroup">
          <label>Facebook URL</label>
          <input value={contact.facebookUrl} onChange={(e) => setContact('facebookUrl', e.target.value)} placeholder="https://facebook.com/thelexconcept" />
        </div>
        <div className="mgroup">
          <label>TikTok URL</label>
          <input value={contact.tiktokUrl} onChange={(e) => setContact('tiktokUrl', e.target.value)} placeholder="https://tiktok.com/@thelexconcept" />
        </div>
        <div className="mgroup">
          <label>LinkedIn URL</label>
          <input value={contact.linkedinUrl} onChange={(e) => setContact('linkedinUrl', e.target.value)} placeholder="https://linkedin.com/in/..." />
        </div>
        <div className="mgroup">
          <label>Upwork URL</label>
          <input value={contact.upworkUrl} onChange={(e) => setContact('upworkUrl', e.target.value)} placeholder="https://upwork.com/freelancers/..." />
        </div>
        <div className="mgroup">
          <label>WhatsApp URL</label>
          <input value={contact.whatsappUrl} onChange={(e) => setContact('whatsappUrl', e.target.value)} placeholder="https://wa.me/234..." />
        </div>
      </SectionPanel>
    </>
  );
}
