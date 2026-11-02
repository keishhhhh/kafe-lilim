import { NextRequest } from 'next/server';import { z } from 'zod';
import { db } from '@/lib/db';import { requireStaff } from '@/lib/auth/session';import { checkOrigin,json,parseBody,withApi,ApiError } from '@/lib/http';
const inputSchema=z.object({delta:z.number().int().min(-100000).max(100000),lowStockAt:z.number().int().min(0).max(100000).optional(),unlimited:z.boolean().optional(),reason:z.string().trim().min(3).max(200)});
export async function PATCH(req:NextRequest,{params}:{params:Promise<{id:string}>}){return withApi(async()=>{checkOrigin(req);const staff=await requireStaff();const input=inputSchema.parse(await parseBody(req));const id=(await params).id;
  await db.$transaction(async tx=>{
    const inv=await tx.inventory.findUnique({where:{id}});if(!inv)throw new ApiError(404,'Inventory not found');
    if(inv.available+input.delta<0)throw new ApiError(409,'Cannot reduce stock below available quantity (reserved units cannot be adjusted here).');
    await tx.inventory.update({where:{id},data:{available:{increment:input.delta},lowStockAt:input.lowStockAt,unlimited:input.unlimited}});
    await tx.inventoryMovement.create({data:{inventoryId:id,deltaAvailable:input.delta,reason:input.reason,staffId:staff.id}});
    await tx.auditLog.create({data:{staffId:staff.id,action:'INVENTORY_ADJUSTED',targetId:id,detail:input}});
  },{isolationLevel:'Serializable'});
  return json({updated:true});
});}
