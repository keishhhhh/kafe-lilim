import { NextRequest } from 'next/server';import { db } from '@/lib/db';import { requireStaff } from '@/lib/auth/session';
import { itemSchema } from '@/lib/validation';import { checkOrigin,json,parseBody,withApi,ApiError } from '@/lib/http';
export async function PATCH(req:NextRequest,{params}:{params:Promise<{id:string}>}){return withApi(async()=>{checkOrigin(req);const staff=await requireStaff();const {id}=await params;
  const data=await parseBody(req);const archive=(data as {archive?:boolean}).archive;
  if(typeof archive==='boolean'){
    const result=await db.menuItem.update({where:{id},data:{archived:archive}});
    await db.auditLog.create({data:{staffId:staff.id,action:archive?'MENU_ARCHIVED':'MENU_RESTORED',targetId:id}});return json(result);
  }
  const x=itemSchema.omit({stock:true,lowStockAt:true,unlimited:true}).parse(data);
  const product=await db.menuItem.update({where:{id},data:{name:x.name,description:x.description,priceCentavos:x.priceCentavos,categoryId:x.categoryId,imageUrl:x.imageUrl||null,available:x.available,featured:x.featured,hidden:x.hidden}});
  await db.auditLog.create({data:{staffId:staff.id,action:'MENU_EDITED',targetId:id}});return json(product);
});}
export async function DELETE(req:NextRequest,{params}:{params:Promise<{id:string}>}){return withApi(async()=>{checkOrigin(req);const staff=await requireStaff('ADMIN');const {id}=await params;
  // Soft deletion always preserves reservation and historical inventory records.
  const item=await db.menuItem.update({where:{id},data:{archived:true,hidden:true}});
  await db.auditLog.create({data:{staffId:staff.id,action:'MENU_SOFT_DELETED',targetId:id}});
  return json({deleted:true,archived:item.archived});
});}
