import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { ApiError } from '@/lib/http';
import { flushOutbox } from '@/lib/notifications/outbox';

type ProviderRefund={id:string,attributes:{status:string,amount:number,currency:string,payment_id?:string}};
function providerKey(){const key=process.env.PAYMONGO_SECRET_KEY;if(!key)throw new ApiError(503,'PayMongo refund credentials are unavailable');return key;}
function resultStatus(status:string):'SUCCEEDED'|'PENDING'|'PROCESSING'|'FAILED'{return status==='succeeded'?'SUCCEEDED':status==='pending'?'PENDING':status==='processing'?'PROCESSING':'FAILED';}
async function recomputeRefund(tx:Prisma.TransactionClient,orderId:string){
  const [order,sums]=await Promise.all([tx.order.findUniqueOrThrow({where:{id:orderId}}),tx.refund.aggregate({where:{orderId,status:'SUCCEEDED'},_sum:{amountCentavos:true}})]);
  const amount=sums._sum.amountCentavos??0;
  if(!amount)return;
  const complete=amount>=order.totalCentavos;
  await tx.order.update({where:{id:orderId},data:{paymentStatus:complete?'REFUNDED':'PARTIALLY_REFUNDED',refundRequired:!complete}});
}
export async function refundOrder(orderId:string,staffId:string,reason:string,confirmedCashReturned:boolean){
  if(reason.trim().length<5)throw new ApiError(400,'Refund reason is required');
  const refund=await db.$transaction(async tx=>{
    const order=await tx.order.findUnique({where:{id:orderId},include:{payments:true,refunds:true}});
    if(!order)throw new ApiError(404,'Order not found');
    if(order.fulfillmentStatus!=='CANCELLED' || !order.paidAt)throw new ApiError(409,'Only collected, cancelled orders may be refunded.');
    const payment=order.payments.find(p=>p.status==='PAID');
    if(!payment)throw new ApiError(409,'Original collected payment not found');
    const existing=order.refunds.find(x=>x.status==='REQUESTED');
    if(existing)throw new ApiError(409,'A refund request needs provider verification before submitting another. Contact the administrator.');
    const outstanding=order.refunds.filter(x=>x.status!=='FAILED').reduce((sum,x)=>sum+x.amountCentavos,0);
    if(outstanding>=order.totalCentavos)throw new ApiError(409,'Refund has already been requested or completed.');
    if(outstanding!==0)throw new ApiError(409,'Partial refunds are not enabled in the staff interface. Reconcile pending refunds first.');
    if(order.paymentMethod==='PAY_AT_PICKUP'&&!confirmedCashReturned)throw new ApiError(400,'Staff must confirm cash was actually returned before recording a refund.');
    return tx.refund.create({data:{orderId,paymentId:payment.id,amountCentavos:order.totalCentavos,status:'REQUESTED',reason,staffId}});
  },{isolationLevel:'Serializable'});
  const payment=await db.payment.findUniqueOrThrow({where:{id:refund.paymentId}});
  if(payment.method==='PAY_AT_PICKUP'){
    await db.$transaction(async tx=>{
      const claimed=await tx.refund.updateMany({where:{id:refund.id,status:'REQUESTED'},data:{status:'SUCCEEDED',completedAt:new Date()}});
      if(!claimed.count)return;
      await recomputeRefund(tx,orderId);
      await tx.auditLog.create({data:{staffId,action:'CASH_REFUND_RECORDED',targetId:orderId,detail:{amountCentavos:refund.amountCentavos,reason}}});
    });
    return {status:'SUCCEEDED'};
  }
  if(!payment.providerPaymentId)throw new ApiError(409,'Missing verified provider payment ID');
  const secret=providerKey();
  const response=await fetch('https://api.paymongo.com/v1/refunds',{method:'POST',headers:{Authorization:`Basic ${Buffer.from(`${secret}:`).toString('base64')}`,'Content-Type':'application/json','Idempotency-Key':`kl-refund-${refund.id}`},
    body:JSON.stringify({data:{attributes:{amount:refund.amountCentavos,payment_id:payment.providerPaymentId,reason:'others',notes:reason.slice(0,255)}}}),cache:'no-store'});
  if(!response.ok)throw new ApiError(503,'Refund response was not successful. The request needs administrator reconciliation before another attempt.');
  const body=(await response.json()) as {data:ProviderRefund};const provider=body.data;
  if(!provider?.id||provider.attributes.amount!==refund.amountCentavos||provider.attributes.currency!=='PHP'||(provider.attributes.payment_id&&provider.attributes.payment_id!==payment.providerPaymentId))throw new ApiError(502,'Unrecognized refund result. Manual reconciliation required.');
  await db.$transaction(async tx=>{
    await tx.refund.update({where:{id:refund.id},data:{providerRefundId:provider.id,status:resultStatus(provider.attributes.status),completedAt:provider.attributes.status==='succeeded'?new Date():undefined}});
    if(provider.attributes.status==='succeeded')await recomputeRefund(tx,orderId);
    await tx.auditLog.create({data:{staffId,action:'GCASH_REFUND_REQUESTED',targetId:orderId,detail:{providerRefundId:provider.id,status:provider.attributes.status}}});
  });
  await flushOutbox(2).catch(()=>{});
  return {status:provider.attributes.status,providerRefundId:provider.id};
}
export async function settleRefundWebhook(eventId:string,eventType:string,resource:unknown){
  if(!['refund.succeeded','refund.failed'].includes(eventType))return {ignored:true};
  const provider=resource as ProviderRefund|undefined;
  if(!provider?.id||!provider.attributes||provider.attributes.currency!=='PHP')throw new ApiError(400,'Invalid refund event');
  return db.$transaction(async tx=>{
    if(await tx.paymentEvent.findUnique({where:{externalId:eventId}}))return {duplicate:true};
    const refund=await tx.refund.findUnique({where:{providerRefundId:provider.id},include:{payment:true}});
    if(!refund||provider.attributes.amount!==refund.amountCentavos||(provider.attributes.payment_id&&provider.attributes.payment_id!==refund.payment.providerPaymentId))throw new ApiError(409,'Unknown refund reference');
    const next=eventType==='refund.succeeded'?'SUCCEEDED':'FAILED';
    if(refund.status!=='SUCCEEDED'){
      await tx.refund.update({where:{id:refund.id},data:{status:next,completedAt:next==='SUCCEEDED'?new Date():undefined}});
      if(next==='SUCCEEDED')await recomputeRefund(tx,refund.orderId);
    }
    await tx.paymentEvent.create({data:{externalId:eventId,eventType}});
    return {refundRecorded:true};
  },{isolationLevel:'Serializable'});
}
