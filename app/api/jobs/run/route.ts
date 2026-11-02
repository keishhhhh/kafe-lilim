import { NextRequest } from 'next/server';import { flushOutbox } from '@/lib/notifications/outbox';import { db } from '@/lib/db';import { expireCheckout } from '@/lib/payments/paymongo';import { json,withApi,ApiError } from '@/lib/http';
export async function GET(req:NextRequest){return withApi(async()=>{
  if(!process.env.CRON_SECRET||req.headers.get('authorization')!==`Bearer ${process.env.CRON_SECRET}`)throw new ApiError(401,'Unauthorized');
  await flushOutbox(50);
  const abandoned=await db.order.findMany({where:{paymentMethod:'GCASH',paymentStatus:'PENDING',createdAt:{lt:new Date(Date.now()-90*60000)}},take:15,orderBy:{createdAt:'asc'},select:{id:true}});
  const unresolved:string[]=[];
  for(const order of abandoned){try{await expireCheckout(order.id);}catch{unresolved.push(order.id);}}
  return json({processed:true,unresolvedPendingPaymentCount:unresolved.length});
});}
