import { prisma } from '@/lib/db';
import MessagesManager from '@/components/admin/MessagesManager';

export const dynamic = 'force-dynamic';

export default async function MessagesPage() {
  const messages = await prisma.contactMessage.findMany({ orderBy: { createdAt: 'desc' } });

  return (
    <section>
      <div className="page-title">Messages</div>
      <div className="page-sub">Every message submitted through the contact form — click one to read it in full.</div>
      <MessagesManager initialMessages={messages} />
    </section>
  );
}
