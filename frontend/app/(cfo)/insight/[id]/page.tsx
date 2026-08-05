import InsightDetailClient from './client';

export default async function InsightDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <InsightDetailClient insightId={id} />;
}
