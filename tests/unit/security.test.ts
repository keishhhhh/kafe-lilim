import { createHmac } from 'node:crypto';import { describe,it,expect } from 'vitest';import { verifyPaymongoSignature } from '@/lib/security';
describe('PayMongo webhook signature',()=>{
 const raw='{"data":{"id":"evt_test"}}';const secret='test-secret';const now=1730000000;
 const sig=createHmac('sha256',secret).update(`${now}.${raw}`).digest('hex');
 it('accepts a correctly signed raw payload',()=>expect(verifyPaymongoSignature(raw,`t=${now},te=${sig},li=`,secret,false,now)).toBe(true));
 it('rejects altered payloads',()=>expect(verifyPaymongoSignature(raw+' ',`t=${now},te=${sig},li=`,secret,false,now)).toBe(false));
 it('rejects wrong mode',()=>expect(verifyPaymongoSignature(raw,`t=${now},te=${sig},li=`,secret,true,now)).toBe(false));
 it('rejects old replay',()=>expect(verifyPaymongoSignature(raw,`t=${now},te=${sig},li=`,secret,false,now+10000)).toBe(false));
});
