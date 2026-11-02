import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireStaff } from '@/lib/auth/session';
import { checkOrigin, json, parseBody, withApi } from '@/lib/http';
import { refundOrder } from '@/lib/payments/refunds';
const input = z.object({reason:z.string().trim().min(5).max(300),confirmedCashReturned:z.boolean().default(false)});
export async function POST(request:NextRequest,{params}:{params:Promise<{id:string}>}){
  return withApi(async()=>{
    checkOrigin(request);
    const admin=await requireStaff('ADMIN');
    const value=input.parse(await parseBody(request));
    return json(await refundOrder((await params).id,admin.id,value.reason,value.confirmedCashReturned));
  });
}
