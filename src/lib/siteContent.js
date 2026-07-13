import { prisma } from './db';

// SiteContent is a singleton (always id: 1). This helper fetches it, and
// transparently creates the default row the very first time it's needed -
// so there's no separate "run this migration/seed step" requirement for it.
export async function getSiteContent() {
  let content = await prisma.siteContent.findUnique({ where: { id: 1 } });
  if (!content) {
    content = await prisma.siteContent.create({ data: { id: 1 } });
  }
  return content;
}
