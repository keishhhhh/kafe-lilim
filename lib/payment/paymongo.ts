import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { ApiError } from '@/lib/http';
import { queueNotice } from '@/lib/notifications/outbox';

type Session={id:string,attributes:{checkout_url?:string,status?:string,reference_number?:string,payments?:{id:string,attributes:{status:string,amount:number,currency:string}}[]}};
function apiHeaders(){const key=process.env.PAYMONGO_SECRET_KEY;if(!key) throw new ApiError(503,'GCash payments are unavailable');return {'Authorization':`Basic ${Buffer.from(`${key}:`).toString('base64')}`,'Content-Type':'application/json'};}
export async function makeCheckout(orderId:string){
  const order=await db.order.findUnique({where:{id:orderId},include:{items:true,payments:true}});
  if(!order || order.paymentMethod!=='GCASH' || order.paymentStatus!=='PENDING') throw new ApiError(409,'This order is not awaiting GCash payment');
  const existing=order.payments.find(p=>p.checkoutUrl);
  if(existing?.checkoutUrl) return existing.checkoutUrl;
  const origin=process.env.APP_URL;
  if(!origin || !/^https?:\/\//.test(origin)) throw new ApiError(503,'APP_URL is not configured');
  const result=await fetch('https://api.paymongo.com/v2/checkout_sessions',{method:'POST',headers:{...apiHeaders(),'Idempotency-Key':`kafe-lilim-${order.id}`},
    body:JSON.stringify({data:{attributes:{line_items:order.items.map(x=>({name:x.name,amount:x.unitCentavos,currency:'PHP',quantity:x.quantity})),
      payment_method_types:['gcash'],success_url:`${origin}/order/track/${(await import('@/lib/security')).unseal(order.trackingTokenEncrypted)}`,
      cancel_url:`${origin}/cart`,reference_number:order.orderNumber,description:`Kafe Lilim pickup ${order.orderNumber}`,send_email_receipt:false}}}),cache:'no-store'});
  if(!result.ok) throw new ApiError(503,'GCash checkout is currently unavailable. Your pending order remains reserved; retry with the same request ID.');
  const resultData=(await result.json()) as {data:Session};
  const session=resultData.data;
  if(!session?.id || !session.attributes?.checkout_url || new URL(session.attributes.checkout_url).hostname!=='checkout.paymongo.com') throw new ApiError(502,'Invalid checkout response');
  await db.payment.updateMany({where:{orderId,status:'PENDING',providerSessionId:null},data:{providerSessionId:session.id,checkoutUrl:session.attributes.checkout_url}});
  return session.attributes.checkout_url;
}
export function parsePaidSession(payload:unknown){
  const root=payload as {data?:{id?:string,type?:string,livemode?:boolean,data?:Session,attributes?:{type?:string,livemode?:boolean,data?:Session}}};
  const event=root?.data;
  const type=event?.attributes?.type??event?.type;
  const session=event?.attributes?.data??event?.data;
  const livemode=event?.attributes?.livemode??event?.livemode;
  if(!event?.id || !type || typeof livemode!=='boolean') throw new ApiError(400,'Invalid PayMongo event');
  return {eventId:event.id,eventType:type,session,live:livemode};
}
export async function acceptPaidEvent(eventId:string,eventType:string,session:Session|undefined){
  if(eventType!=='checkout_session.payment.paid') return {ignored:true};
  if(!session?.id || !session.attributes?.reference_number) throw new ApiError(400,'Invalid paid checkout event');
  const paid=session.attributes.payments?.filter(p=>p.attributes.status==='paid')??[];
  if(paid.length!==1) throw new ApiError(400,'The payment event has no unique paid transaction');
  return db.$transaction(async tx=>{
    const duplicate=await tx.paymentEvent.findUnique({where:{externalId:eventId}});
    if(duplicate) return {duplicate:true};
    const payment=await tx.payment.findUnique({where:{providerSessionId:session.id},include:{order:true}});
    if(!payment || payment.order.orderNumber!==session.attributes.reference_number) throw new ApiError(409,'Unrecognized PayMongo checkout reference');
    if(paid[0].attributes.amount!==payment.amountCentavos || paid[0].attributes.currency!=='PHP') throw new ApiError(409,'Payment amount or currency mismatch');
    if(payment.providerPaymentId && payment.providerPaymentId!==paid[0].id) throw new ApiError(409,'Conflicting payment provider reference');
    if(payment.order.paymentStatus==='PAID'){
      await tx.paymentEvent.create({data:{externalId:eventId,eventType}}); return {duplicate:true};
    }
    const changed=await tx.order.updateMany({where:{id:payment.orderId,paymentStatus:'PENDING'},data:{paymentStatus:'PAID',paidAt:new Date(),fulfillmentStatus:'CONFIRMED'}});
    if(!changed.count) throw new ApiError(409,'Order is not awaiting payment; manual reconciliation required');
    await tx.payment.update({where:{id:payment.id},data:{status:'PAID',collectedAt:new Date(),providerPaymentId:paid[0].id}});
    await tx.paymentEvent.create({data:{externalId:eventId,eventType}});
    await queueNotice(tx,payment.orderId,'CONFIRMATION');
    await queueNotice(tx,payment.orderId,'PAYMENT_READY');
    return {paid:true};
  },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
}
// Authoritative provider retrieval covers missed or delayed webhooks.
export async function reconcileCheckout(orderId:string){
  const payment=await db.payment.findFirst({where:{orderId,method:'GCASH',status:'PENDING'}});
  if(!payment?.providerSessionId) throw new ApiError(409,'No registered PayMongo session to reconcile');
  const response=await fetch(`https://api.paymongo.com/v2/checkout_sessions/${encodeURIComponent(payment.providerSessionId)}`,{headers:apiHeaders(),cache:'no-store'});
  if(!response.ok) throw new ApiError(503,'Provider session could not be retrieved');
  const value=(await response.json()) as {data:Session};
  if(value.data?.id!==payment.providerSessionId) throw new ApiError(502,'Unrecognized provider session response');
  const paid=value.data.attributes?.payments?.find(p=>p.attributes.status==='paid');
  if(paid){
    await acceptPaidEvent(`reconciliation:${value.data.id}:${paid.id}`,'checkout_session.payment.paid',value.data);
    return {paid:true};
  }
  return {paid:false,status:value.data.attributes?.status??'unknown'};
}
// Maintenance never releases stock simply because a customer left checkout.
// First expire the provider session; only a successful provider expiry makes release safe.
export async function expireCheckout(orderId:string){
  const payment=await db.payment.findFirst({where:{orderId,status:'PENDING',method:'GCASH'}});
  if(!payment?.providerSessionId) throw new ApiError(409,'No PayMongo session to expire; manual reconciliation required');
  const result=await reconcileCheckout(orderId);
  if(result.paid) throw new ApiError(409,'Payment was already collected and confirmed; do not expire this order.');
  const r=await fetch(`https://api.paymongo.com/v2/checkout_sessions/${encodeURIComponent(payment.providerSessionId)}/expire`,{method:'POST',headers:apiHeaders(),cache:'no-store'});
  if(!r.ok) throw new ApiError(409,'PayMongo did not confirm expiry. Order and stock are unchanged.');
  const {settleReservations}=await import('@/lib/inventory/stock');
  await db.$transaction(async tx=>{
    const claimed=await tx.order.updateMany({where:{id:orderId,paymentStatus:'PENDING',fulfillmentStatus:'PENDING_PAYMENT'},data:{paymentStatus:'FAILED',fulfillmentStatus:'CANCELLED',cancelReason:'GCash checkout expired'}});
    if(!claimed.count) return;
    await tx.payment.update({where:{id:payment.id},data:{status:'FAILED'}});
    await settleReservations(tx,orderId,'RELEASED');
    await queueNotice(tx,orderId,'CANCELLED');
  },{isolationLevel:'Serializable'});
}
