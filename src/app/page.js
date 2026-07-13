import { prisma } from '@/lib/db';
import { getSiteContent } from '@/lib/siteContent';
import Nav from '@/components/Nav';
import Hero from '@/components/Hero';
import Portfolio from '@/components/Portfolio';
import About from '@/components/About';
import Contact from '@/components/Contact';
import Footer from '@/components/Footer';
import PageViewTracker from '@/components/PageViewTracker';
import CustomCursor from '@/components/CustomCursor';
import ScrollProgress from '@/components/ScrollProgress';

// The page is cached and regenerated at most every 30 seconds under normal
// traffic, so a spike in visitors hits a fast cached page instead of the
// database every time. When the admin edits works or content, the relevant
// API route calls revalidatePath('/') to refresh this cache immediately -
// so edits still show up right away, this isn't a stale 30-second delay.
export const revalidate = 30;

export default async function Home() {
  const [works, content] = await Promise.all([
    prisma.work.findMany({ where: { status: 'live' }, orderBy: { createdAt: 'desc' } }),
    getSiteContent(),
  ]);

  return (
    <>
      <PageViewTracker />
      <CustomCursor />
      <ScrollProgress />
      <Nav />
      <Hero content={content} />
      <Portfolio initialWorks={works} />
      <About content={content} />
      <Contact content={content} />
      <Footer content={content} />
    </>
  );
}
