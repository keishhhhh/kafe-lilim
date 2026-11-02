import { NextRequest } from 'next/server';import argon2 from 'argon2';import { z } from 'zod';
import { db } from '@/lib/db';import { json,parseBody,withApi,ApiError,checkOrigin } from '@/lib/http';
import { createSession } from '@/lib/auth/session';import { rateLimit,ipFor } from '@/lib/rate-limit';
export async function POST(request:NextRequest){return withApi(async()=>{
  checkOrigin(request);const data=z.object({email:z.string().email(),password:z.string().min(1).max(200)}).parse(await parseBody(request));
  await rateLimit('login-ip:'+ipFor(request),12,900);await rateLimit('login-user:'+data.email.toLowerCase(),10,900);
  const user=await db.staffUser.findUnique({where:{email:data.email.toLowerCase()}});
  const valid=user?.active && await argon2.verify(user.passwordHash,data.password);
  if(!valid)throw new ApiError(401,'Invalid staff credentials');
  await createSession(user.id);return json({ok:true});
});}
