import { NextRequest } from 'next/server';import { z } from 'zod';
import { requireStaff } from '@/lib/auth/session';import { changeStatus } from '@/lib/orders';
import { checkOrigin,json,parseBody,withApi } from '@/lib/http';import { flushOutbox } from '@/lib/notifications/outbox';
const body=z.object({status:z.enum(['PREPARING','READY_FOR_PICKUP','COMPLETED','CANCELLED']),reason:z.string().max(400).optional()});
export async function PATCH(req:NextRequest,{params}:{params:Promise<{id:string}>}){return withApi(async()=>{checkOrigin(req);const staff=await requireStaff();const input=body.parse(await parseBody(req));const value=await changeStatus((await params).id,input.status,staff.id,input.reason);await flushOutbox(10).catch(()=>{});return json(value);});}
