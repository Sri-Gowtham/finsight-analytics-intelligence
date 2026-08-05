import BankDetailClient from './client';
import { mockBanks } from '@/lib/mock-data';

export default async function BankDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;
  const bank = mockBanks.find((b) => b.id === id);

  if (!bank) {
    return (
      <div className="p-8 flex items-center justify-center h-screen">
        <p className="text-text-secondary">Bank not found</p>
      </div>
    );
  }

  return <BankDetailClient bank={bank} />;
}
