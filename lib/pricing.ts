import { ApiError } from './http';
export type PriceableItem={id:string,priceCentavos:number,available:boolean,hidden:boolean,archived:boolean,inventory:{available:number,unlimited:boolean}|null,modifierGroups:{id:string,minSelect:number,maxSelect:number,options:{id:string,name:string,priceCentavos:number,available:boolean}[]}[]};
export function calculateLine(item:PriceableItem,quantity:number,modifierIds:string[]){
  if (!item.available || item.hidden || item.archived || !item.inventory || (!item.inventory.unlimited && item.inventory.available<quantity)) throw new ApiError(409,'A selected menu item is unavailable or has insufficient stock.');
  if (!Number.isInteger(quantity)||quantity<1||quantity>20) throw new ApiError(400,'Invalid quantity');
  if (new Set(modifierIds).size!==modifierIds.length) throw new ApiError(400,'Duplicate modifier selection');
  let mods:{name:string,priceCentavos:number}[]=[];
  for (const group of item.modifierGroups){
    const chosen=group.options.filter(opt=>modifierIds.includes(opt.id));
    if (chosen.length<group.minSelect || chosen.length>group.maxSelect) throw new ApiError(400,'Incomplete or incompatible product customizations.');
    if (chosen.some(x=>!x.available)) throw new ApiError(409,'One customization is unavailable.');
    mods=mods.concat(chosen.map(x=>({name:x.name,priceCentavos:x.priceCentavos})));
  }
  if (mods.length!==modifierIds.length) throw new ApiError(400,'Unknown or incompatible customization.');
  const unit=item.priceCentavos+mods.reduce((s,m)=>s+m.priceCentavos,0);
  return {unitCentavos:unit,lineCentavos:unit*quantity,modifiers:mods};
}
export const php=(centavos:number)=>new Intl.NumberFormat('en-PH',{style:'currency',currency:'PHP'}).format(centavos/100);
export function allowedNext(current:string,next:string){
  const graph:Record<string,string[]>={CONFIRMED:['PREPARING','CANCELLED'],PREPARING:['READY_FOR_PICKUP','CANCELLED'],READY_FOR_PICKUP:['COMPLETED','CANCELLED'],PENDING_PAYMENT:['CONFIRMED','CANCELLED'],COMPLETED:[],CANCELLED:[]};
  return (graph[current]||[]).includes(next);
}
