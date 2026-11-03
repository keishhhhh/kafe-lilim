import { z } from 'zod';
import type { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { ApiError, checkOrigin, json, parseBody, withApi } from '@/lib/http';
import { hash } from '@/lib/security';

const subscriptionSchema = z.object({
  token: z.string().min(1).max(256),
  subscription: z.object({
    endpoint: z.string().url().refine((value) => new URL(value).protocol === 'https:'),
    keys: z.object({
      p256dh: z.string().min(1).max(256),
      auth: z.string().min(1).max(256),
    }),
  }),
});

export async function POST(request: NextRequest) {
  return withApi(async () => {
    checkOrigin(request);
    const { token, subscription } = subscriptionSchema.parse(await parseBody(request));
    const order = await db.order.findUnique({
      where: { trackingTokenHash: hash(token) },
      select: { id: true },
    });
    if (!order) throw new ApiError(404, 'Order not found');

    await db.pushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      create: {
        orderId: order.id,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
      update: {
        orderId: order.id,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
    });

    return json({ subscribed: true });
  });
}
