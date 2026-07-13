import { getSiteContent } from '@/lib/siteContent';
import ContentEditor from '@/components/admin/ContentEditor';

export const dynamic = 'force-dynamic';

export default async function SiteContentPage() {
  const content = await getSiteContent();

  return (
    <section>
      <div className="page-title">Site Content</div>
      <div className="page-sub">Edit the text and social links shown on the public portfolio — changes go live immediately.</div>
      <ContentEditor initialContent={content} />
    </section>
  );
}
