import { NextRequest,NextResponse } from 'next/server';
import { withApi,ApiError } from '@/lib/http';
import { verifyPaymongoSignature } from '@/lib/security';
import { parsePaidSession,acceptPaidEvent } from '@/lib/payments/paymongo';
import { flushOutbox } from '@/lib/notifications/outbox';
import { settleRefundWebhook } from '@/lib/payments/refunds';
export async function POST(request:NextRequest){return withApi(async()=>{
  const raw=await request.text();if(Buffer.byteLength(raw)>1000000)throw new ApiError(413,'Payload too large');
  const key=process.env.PAYMONGO_SECRET_KEY??'';const live=key.startsWith('sk_live_');
  if(!verifyPaymongoSignature(raw,request.headers.get('paymongo-signature'),process.env.a??'',live))throw new ApiError(401,'Invalid PayMongo signature');
  let payload:unknown;try{payload=JSON.parse(raw);}catch{throw new ApiError(400,'Invalid JSON');}
  const event=parsePaidSession(payload);
  if(event.live!==live)throw new ApiError(401,'Wrong payment environment');
  const output=event.eventType.startsWith('refund.')
    ? await settleRefundWebhook(event.eventId,event.eventType,event.session as unknown)
    : await acceptPaidEvent(event.eventId,event.eventType,event.session);
  await flushOutbox(5).catch(()=>{});
  return NextResponse.json(output);
});}
