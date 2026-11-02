import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
export const hash = (text:string) => createHash('sha256').update(text).digest('hex');
export const randomToken = () => randomBytes(32).toString('base64url');
function encryptionKey(){
  const value = process.env.APP_ENCRYPTION_KEY;
  if (!value || !/^[0-9a-fA-F]{64}$/.test(value)) throw new Error('APP_ENCRYPTION_KEY must be 32 random bytes encoded as hex');
  return Buffer.from(value,'hex');
}
export function seal(value:string){
  const iv = randomBytes(12); const cipher = createCipheriv('aes-256-gcm',encryptionKey(),iv);
  const payload = Buffer.concat([cipher.update(value,'utf8'),cipher.final()]);
  return Buffer.concat([iv,cipher.getAuthTag(),payload]).toString('base64url');
}
export function unseal(value:string){
  const bytes = Buffer.from(value,'base64url');
  const decipher = createDecipheriv('aes-256-gcm',encryptionKey(),bytes.subarray(0,12));
  decipher.setAuthTag(bytes.subarray(12,28));
  return Buffer.concat([decipher.update(bytes.subarray(28)),decipher.final()]).toString('utf8');
}
export function verifyPaymongoSignature(raw:string, header:string|null, secret:string, live:boolean, nowSec=Math.floor(Date.now()/1000)){
  if (!header || !secret) return false;
  const fields = Object.fromEntries(header.split(',').map(part => part.trim().split('=',2)));
  const ts = Number(fields.t);
  const signature = live ? fields.li : fields.te;
  if (!Number.isSafeInteger(ts) || Math.abs(nowSec-ts)>300 || !/^[a-f0-9]{64}$/i.test(signature || '')) return false;
  const expected = createHmac('sha256',secret).update(`${fields.t}.${raw}`).digest();
  const given = Buffer.from(signature,'hex');
  return expected.length === given.length && timingSafeEqual(expected,given);
}
