import { db } from '@/lib/db';
import { ApiError, json, withApi } from '@/lib/http';
import { hash } from '@/lib/security';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  return withApi(async () => {
    const { token } = await params;
    if (!token || token.length > 256) throw new ApiError(404, 'Order not found');

    const order = await db.order.findUnique({
      where: { trackingTokenHash: hash(token) },
      select: {
        orderNumber: true,
        items: {
          select: {
            name: true,
            quantity: true,
            lineCentavos: true,
            modifiers: true,
          },
        },
        totalCentavos: true,
        paymentMethod: true,
        paymentStatus: true,
        fulfillmentStatus: true,
        pickupAt: true,
        refundRequired: true,
        notifications: {
          select: { kind: true, channel: true, state: true },
        },
      },
    });

    if (!order) throw new ApiError(404, 'Order not found');

    const settings = await db.businessSettings.findUnique({
      where: { id: 'main' },
      select: { address: true },
    });

    return json({
      ...order,
      pickupAt: order.pickupAt.toISOString(),
      pickupLocation: settings?.address ?? 'Contact the café',
    });
  });
}
