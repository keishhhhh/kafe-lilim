import { db } from '@/lib/db';
import { json,withApi } from '@/lib/http';
export const dynamic='force-dynamic';
export async function GET(){return withApi(async()=>json(await db.menuItem.findMany({where:{archived:false,hidden:false},include:{category:true,inventory:true,modifierGroups:{include:{options:{where:{available:true}}},orderBy:{sortOrder:'asc'}}},orderBy:[{featured:'desc'},{name:'asc'}]})));}
