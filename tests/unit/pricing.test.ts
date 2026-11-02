import { describe,it,expect } from 'vitest';import { allowedNext,calculateLine,php } from '@/lib/pricing';
const product={id:'coffee',priceCentavos:14500,available:true,hidden:false,archived:false,inventory:{available:3,unlimited:false},modifierGroups:[{id:'size',minSelect:1,maxSelect:1,options:[{id:'regular',name:'Regular',priceCentavos:0,available:true},{id:'large',name:'Large',priceCentavos:3000,available:true}]},{id:'milk',minSelect:0,maxSelect:1,options:[{id:'oat',name:'Oat milk',priceCentavos:2500,available:true}]}]};
describe('server-side cart pricing',()=>{
 it('calculates signed centavos from the database menu',()=>expect(calculateLine(product,2,['large','oat']).lineCentavos).toBe(40000));
 it('rejects missing mandatory size',()=>expect(()=>calculateLine(product,1,['oat'])).toThrow());
 it('rejects forged modifier IDs',()=>expect(()=>calculateLine(product,1,['regular','invented'])).toThrow());
 it('rejects duplicates',()=>expect(()=>calculateLine(product,1,['regular','regular'])).toThrow());
 it('rejects overselling',()=>expect(()=>calculateLine(product,4,['regular'])).toThrow());
 it('rejects archived products',()=>expect(()=>calculateLine({...product,archived:true},1,['regular'])).toThrow());
 it('formats Philippine money',()=>expect(php(11050)).toContain('110.50'));
});
describe('fulfillment state machine',()=>{
 it('prevents paid-pickup completion until preparation',()=>expect(allowedNext('CONFIRMED','COMPLETED')).toBe(false));
 it('permits preparing to ready',()=>expect(allowedNext('PREPARING','READY_FOR_PICKUP')).toBe(true));
 it('prevents any action after completion',()=>expect(allowedNext('COMPLETED','CANCELLED')).toBe(false));
});
