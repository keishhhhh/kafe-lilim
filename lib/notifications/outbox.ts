import { Prisma, type NoticeKind } from '@prisma/client';
import { db } from '@/lib/db';
import { unseal } from '@/lib/security';
import webpush from 'web-push';
const label:Record<NoticeKind,string>={CONFIRMATION:'Order received',PAYMENT_READY:'GCash payment confirmed',READY:'Ready for pickup',CANCELLED:'Order cancelled'};
export async function queueNotice(tx:Prisma.TransactionClient,orderId:string,kind:NoticeKind){
  await tx.notification.createMany({data:[{orderId,kind,channel:'EMAIL' as const},...(kind==='READY'?[{orderId,kind,channel:'PUSH' as const}]:[])],skipDuplicates:true});
}
async function deliverEmail(orderId:string,kind:NoticeKind){
  const key=process.env.RESEND_API_KEY,from=process.env.EMAIL_FROM;
  if(!key || !from) throw new Error('Resend email provider is not configured');
  const order=await db.order.findUniqueOrThrow({where:{id:orderId}});
  const settings=await db.businessSettings.findUnique({where:{id:'main'}});
  const url=`${process.env.APP_URL}/order/track/${unseal(order.trackingTokenEncrypted)}`;
  const body=`${label[kind]}: Kafe Lilim order ${order.orderNumber}.\n\nPickup: ${settings?.address??'Contact the café'}\nDate: ${order.pickupAt.toLocaleString('en-PH',{timeZone:'Asia/Manila'})}\nTrack your order: ${url}\n\n${settings?.pickupInstructions??''}`;
  const r=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json','Idempotency-Key':`${orderId}/${kind}/email`},body:JSON.stringify({from,to:[order.customerEmail],subject:`Kafe Lilim · ${label[kind]} · ${order.orderNumber}`,text:body}),cache:'no-store'});
  if(!r.ok) throw new Error(`Resend HTTP ${r.status}`);
}
async function deliverPush(orderId:string){
  if(!process.env.VAPID_PRIVATE_KEY || !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_SUBJECT) throw new Error('Push notification keys are not configured');
  const order=await db.order.findUniqueOrThrow({where:{id:orderId},include:{subscriptions:true}});
  if(!order.subscriptions.length) return; // customer did not opt in; email remains mandatory
  webpush.setVapidDetails(process.env.VAPID_SUBJECT,process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,process.env.VAPID_PRIVATE_KEY);
  const payload=JSON.stringify({title:'Your Kafe Lilim order is ready!',body:`Order ${order.orderNumber} is ready for pickup.`,url:`/order/track/${unseal(order.trackingTokenEncrypted)}`});
  let failures=0;
  for(const sub of order.subscriptions){
    try{await webpush.sendNotification({endpoint:sub.endpoint,keys:{p256dh:sub.p256dh,auth:sub.auth}},payload);}
    catch(e){if(typeof e==='object' && e && 'statusCode' in e && [404,410].includes(Number(e.statusCode))){await db.pushSubscription.delete({where:{id:sub.id}});}else failures++;}
  }
  if(failures) throw new Error(`Failed to deliver ${failures} push subscription(s)`);
}
export async function flushOutbox(max=15){
  const due=await db.notification.findMany({where:{state:{in:['PENDING','FAILED','SENDING']},nextAttemptAt:{lte:new Date()},attempts:{lt:7}},take:max,orderBy:{createdAt:'asc'}});
  for(const job of due){
    const claimed=await db.notification.updateMany({where:{id:job.id,state:{in:['PENDING','FAILED','SENDING']}},data:{state:'SENDING',nextAttemptAt:new Date(Date.now()+5*60000),attempts:{increment:1}}});
    if(!claimed.count) continue;
    try{
      if(job.channel==='EMAIL') await deliverEmail(job.orderId,job.kind);
      else await deliverPush(job.orderId);
      await db.notification.update({where:{id:job.id},data:{state:'SENT',deliveredAt:new Date(),lastError:null}});
    }catch(error){
      const delayMinutes=Math.min(360,2**job.attempts);
      await db.notification.update({where:{id:job.id},data:{state:'FAILED',nextAttemptAt:new Date(Date.now()+delayMinutes*60000),lastError:error instanceof Error?error.message.slice(0,200):'Unknown delivery issue'}});
    }
  }
}
