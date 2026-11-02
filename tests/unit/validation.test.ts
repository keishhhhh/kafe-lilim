import { describe,it,expect } from 'vitest';import { orderSchema } from '@/lib/validation';
const ok={clientRequestId:'8e7fb8ea-8a13-4911-87e9-8f3c1553b8d2',customerName:'Juan Dela Cruz',customerEmail:'buyer@example.com',pickupAt:'2026-10-30T14:00',paymentMethod:'PAY_AT_PICKUP' as const,items:[{menuItemId:'abc',quantity:2,modifiers:['large']}]};
describe('guest checkout validation',()=>{
 it('accepts a valid guest order',()=>expect(orderSchema.safeParse(ok).success).toBe(true));
 it('rejects an order without items',()=>expect(orderSchema.safeParse({...ok,items:[]}).success).toBe(false));
 it('rejects absurdly large item counts',()=>expect(orderSchema.safeParse({...ok,items:[{menuItemId:'abc',quantity:100000}]}).success).toBe(false));
 it('does not accept prices from the browser',()=>expect(orderSchema.parse({...ok,totalCentavos:1})).not.toHaveProperty('totalCentavos'));
});
