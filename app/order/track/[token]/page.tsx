import { notFound } from 'next/navigation';
import { TrackingLive } from '@/components/customer/tracking-live';
import { db } from '@/lib/db';
import { hash } from '@/lib/security';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Track your order' };

export default async function OrderTrackingPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  if (!token || token.length > 256) notFound();

  const order = await db.order.findUnique({
    where: { trackingTokenHash: hash(token) },
    select: { id: true },
  });
  if (!order) notFound();

  return (
    <main className="container section">
      <TrackingLive token={token} />
    </main>
  );
}
