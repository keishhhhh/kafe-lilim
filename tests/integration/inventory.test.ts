import { describe,it,expect } from 'vitest';import { db } from '@/lib/db';
import { reserve,settleReservations } from '@/lib/inventory/stock';
const allowed=Boolean(process.env.TEST_DATABASE_URL)&&process.env.DATABASE_URL===process.env.TEST_DATABASE_URL;
describe.skipIf(!allowed)('PostgreSQL stock transactions (dedicated test database)',()=>{
 it('prevents concurrent overselling, and releases exactly once',async()=>{
  const cat=await db.category.create({data:{name:'TEST_'+crypto.randomUUID()}});
  const item=await db.menuItem.create({data:{name:'Temporary coffee',priceCentavos:10000,categoryId:cat.id,inventory:{create:{available:1}}},include:{inventory:true}});
  const makeOrder=async(key:string)=>db.$transaction(async tx=>{const o=await tx.order.create({data:{clientRequestId:key,orderNumber:key,trackingTokenHash:key,trackingTokenEncrypted:'test-only',customerName:'Test',customerEmail:'test@example.com',pickupAt:new Date(Date.now()+3600000),totalCentavos:10000,paymentMethod:'PAY_AT_PICKUP'}});await reserve(tx,o.id,item.inventory!.id,1,false);return o;});
  const result=await Promise.allSettled([makeOrder(crypto.randomUUID()),makeOrder(crypto.randomUUID())]);
  expect(result.filter(x=>x.status==='fulfilled')).toHaveLength(1);
  const successful=result.find(x=>x.status==='fulfilled') as PromiseFulfilledResult<{id:string}>;
  await db.$transaction(tx=>settleReservations(tx,successful.value.id,'RELEASED'));
  await db.$transaction(tx=>settleReservations(tx,successful.value.id,'RELEASED'));
  const inv=await db.inventory.findUniqueOrThrow({where:{id:item.inventory!.id}});
  expect(inv.available).toBe(1);expect(inv.reserved).toBe(0);
  // Test records intentionally remain in the dedicated throwaway database.
 });
});
