import { NextRequest } from 'next/server';import { db } from '@/lib/db';import { requireStaff } from '@/lib/auth/session';import { settingsSchema } from '@/lib/validation';import { checkOrigin,json,parseBody,withApi,ApiError } from '@/lib/http';
export async function GET(){return withApi(async()=>{await requireStaff();return json(await db.businessSettings.findUnique({where:{id:'main'}}));});}
export async function PATCH(req:NextRequest){return withApi(async()=>{checkOrigin(req);const staff=await requireStaff('ADMIN');const x=settingsSchema.parse(await parseBody(req));
  if(x.acceptOrders && (x.address.includes('SAMPLE') || x.email.includes('example.com')))throw new ApiError(409,'Replace sample address and contact email before enabling online orders.');
  const result=await db.businessSettings.update({where:{id:'main'},data:{...x,logoUrl:x.logoUrl||null,heroImage:x.heroImage||null,socialUrl:x.socialUrl||null}});
  await db.auditLog.create({data:{staffId:staff.id,action:'BUSINESS_SETTINGS_CHANGED',targetId:'main'}});return json(result);
});}
