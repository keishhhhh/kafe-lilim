import { db } from '@/lib/db';import { json,withApi } from '@/lib/http';
export async function GET(){return withApi(async()=>json(await db.businessSettings.findUnique({where:{id:'main'}})));}
