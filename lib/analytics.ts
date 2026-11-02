import { db } from './db';
import { DateTime } from 'luxon';
import { ZONE } from './time';
export async function getAnalytics(from:string,to:string){
  const first=DateTime.fromISO(from,{zone:ZONE}).startOf('day'),last=DateTime.fromISO(to,{zone:ZONE}).plus({days:1}).startOf('day');
  if(!first.isValid || !last.isValid || last<=first || last.diff(first,'days').days>366) throw new Error('Invalid reporting date range');
  const [orders,paid,rows,lowStock,refunds]=await Promise.all([
    db.order.findMany({where:{createdAt:{gte:first.toUTC().toJSDate(),lt:last.toUTC().toJSDate()}},select:{fulfillmentStatus:true,paymentStatus:true,totalCentavos:true}}),
    db.payment.findMany({where:{status:'PAID',collectedAt:{gte:first.toUTC().toJSDate(),lt:last.toUTC().toJSDate()}},include:{order:{include:{items:true}}}}),
    db.orderItem.findMany({where:{order:{paidAt:{gte:first.toUTC().toJSDate(),lt:last.toUTC().toJSDate()},paymentStatus:{in:['PAID','PARTIALLY_REFUNDED']}}},select:{name:true,quantity:true,lineCentavos:true}}),
    db.inventory.findMany({where:{unlimited:false},include:{item:true},take:100}),
    db.refund.findMany({where:{status:'SUCCEEDED',completedAt:{gte:first.toUTC().toJSDate(),lt:last.toUTC().toJSDate()}}})
  ]);
  const gross=paid.reduce((v,p)=>v+p.amountCentavos,0);
  const refunded=refunds.reduce((v,r)=>v+r.amountCentavos,0);
  const trendMap=new Map<string,number>();
  for(let d=first;d<last;d=d.plus({days:1})){trendMap.set(d.toISODate()!,0);}
  for(const p of paid){if(!p.collectedAt)continue;const day=DateTime.fromJSDate(p.collectedAt).setZone(ZONE).toISODate()!;trendMap.set(day,(trendMap.get(day)??0)+p.amountCentavos);}
  const itemsSold=rows.reduce((v,x)=>v+x.quantity,0);
  const products=new Map<string,{name:string,quantity:number,revenueCentavos:number}>();
  for(const x of rows){const prev=products.get(x.name)??{name:x.name,quantity:0,revenueCentavos:0};prev.quantity+=x.quantity;prev.revenueCentavos+=x.lineCentavos;products.set(x.name,prev);}
  return {totalOrders:orders.length,awaitingPayment:orders.filter(x=>x.paymentStatus==='PENDING').length,preparing:orders.filter(x=>x.fulfillmentStatus==='PREPARING').length,ready:orders.filter(x=>x.fulfillmentStatus==='READY_FOR_PICKUP').length,completed:orders.filter(x=>x.fulfillmentStatus==='COMPLETED').length,
    collectedCentavos:gross,refundCentavos:refunded,netCentavos:gross-refunded,itemsSold,averagePaidOrderCentavos:paid.length?Math.round(gross/paid.length):0,
    gcashCentavos:paid.filter(x=>x.method==='GCASH').reduce((s,p)=>s+p.amountCentavos,0),cashCentavos:paid.filter(x=>x.method==='PAY_AT_PICKUP').reduce((s,p)=>s+p.amountCentavos,0),
    trend:[...trendMap].map(([date,centavos])=>({date,centavos})),
    products:[...products.values()].sort((a,b)=>b.quantity-a.quantity),
    lowStock:lowStock.filter(x=>x.available<=x.lowStockAt&&!x.item.archived).map(x=>({name:x.item.name,available:x.available})),refundNote:'Refund totals include provider-confirmed PayMongo refunds and cash refunds explicitly recorded by an administrator.'};
}
