import ProofViewer from '@/components/ProofViewer';

export const metadata = {
  title: 'Design Proof — THE LEX CONCEPT',
  robots: { index: false, follow: false }, // private links should never appear in search results
};

export default function ProofPage({ params }) {
  return <ProofViewer token={params.token} />;
}
