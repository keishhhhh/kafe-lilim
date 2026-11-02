import { NextRequest } from 'next/server';import { db } from '@/lib/db';import { requireStaff } from '@/lib/auth/session';import { json,withApi } from '@/lib/http';
export async function GET(request:NextRequest){return withApi(async()=>{
  await requireStaff();const status=request.nextUrl.searchParams.get('status')||undefined;
  const page=Math.max(1,Math.min(1000,Number(request.nextUrl.searchParams.get('page'))||1));
  const where=status&&['PENDING_PAYMENT','CONFIRMED','PREPARING','READY_FOR_PICKUP','COMPLETED','CANCELLED'].includes(status)?{fulfillmentStatus:status as 'CONFIRMED'}:{};
  return json(await db.order.findMany({where,include:{items:true,refunds:true,notifications:{select:{kind:true,channel:true,state:true,lastError:true}}},orderBy:{createdAt:'desc'},take:40,skip:(page-1)*40}));
});}
