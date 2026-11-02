import type { Prisma } from '@prisma/client';
import { ApiError } from '@/lib/http';
export async function reserve(tx:Prisma.TransactionClient,orderId:string,inventoryId:string,quantity:number,unlimited:boolean){
  if (!unlimited){
    const change = await tx.inventory.updateMany({where:{id:inventoryId,available:{gte:quantity}},data:{available:{decrement:quantity},reserved:{increment:quantity}}});
    if (!change.count) throw new ApiError(409,'Stock changed before checkout. Please review your cart.');
  }
  await tx.stockReservation.create({data:{orderId,inventoryId,quantity,status:'ACTIVE'}});
  if (!unlimited) await tx.inventoryMovement.create({data:{inventoryId,deltaAvailable:-quantity,deltaReserved:quantity,orderId,reason:'ORDER_RESERVED'}});
}
export async function settleReservations(tx:Prisma.TransactionClient,orderId:string,type:'CONSUMED'|'RELEASED'){
  const rows = await tx.stockReservation.findMany({where:{orderId,status:'ACTIVE'},include:{inventory:true}});
  for (const row of rows){
    const claimed = await tx.stockReservation.updateMany({where:{id:row.id,status:'ACTIVE'},data:{status:type}});
    if (!claimed.count || row.inventory.unlimited) continue;
    await tx.inventory.update({where:{id:row.inventoryId},data:{reserved:{decrement:row.quantity},...(type==='RELEASED'?{available:{increment:row.quantity}}:{})}});
    await tx.inventoryMovement.create({data:{inventoryId:row.inventoryId,orderId,deltaReserved:-row.quantity,deltaAvailable:type==='RELEASED'?row.quantity:0,reason:type==='RELEASED'?'ORDER_RELEASED':'ORDER_CONSUMED'}});
  }
}
