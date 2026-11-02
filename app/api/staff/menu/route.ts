import { NextRequest } from 'next/server';import { db } from '@/lib/db';import { requireStaff } from '@/lib/auth/session';
import { itemSchema } from '@/lib/validation';import { checkOrigin,json,parseBody,withApi,ApiError } from '@/lib/http';
export async function GET(){return withApi(async()=>{await requireStaff();return json(await db.menuItem.findMany({include:{category:true,inventory:true,modifierGroups:{include:{options:true}}},orderBy:{name:'asc'}}));});}
export async function POST(req:NextRequest){return withApi(async()=>{checkOrigin(req);const staff=await requireStaff();const x=itemSchema.parse(await parseBody(req));const category=await db.category.findUnique({where:{id:x.categoryId}});if(!category)throw new ApiError(400,'Unknown category');
  const item=await db.$transaction(async tx=>{
    const item=await tx.menuItem.create({data:{name:x.name,description:x.description,priceCentavos:x.priceCentavos,categoryId:x.categoryId,imageUrl:x.imageUrl||null,featured:x.featured,available:x.available,hidden:x.hidden,inventory:{create:{available:x.stock,lowStockAt:x.lowStockAt,unlimited:x.unlimited}}}});
    await tx.auditLog.create({data:{staffId:staff.id,action:'MENU_CREATED',targetId:item.id}});return item;
  });return json(item,201);
});}
