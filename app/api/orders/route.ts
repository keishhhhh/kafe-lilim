import { NextRequest } from 'next/server';
import { createOrder } from '@/lib/orders';
import { json,parseBody,withApi,checkOrigin } from '@/lib/http';
import { orderSchema } from '@/lib/validation';
import { rateLimit,ipFor } from '@/lib/rate-limit';
export async function POST(request:NextRequest){return withApi(async()=>{checkOrigin(request);await rateLimit(`checkout:${ipFor(request)}`,12,3600);const input=orderSchema.parse(await parseBody(request));return json(await createOrder(input),201);});}
