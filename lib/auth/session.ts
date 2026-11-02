import 'server-only';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { ApiError } from '@/lib/http';
import { hash, randomToken } from '@/lib/security';
import type { StaffRole } from '@prisma/client';
const cookieName = 'kl_staff_session';
const sessionDays = 7;
export async function createSession(staffId:string){
  const token = randomToken();
  await db.staffSession.create({data:{staffId,tokenHash:hash(token),expiresAt:new Date(Date.now()+sessionDays*86400000)}});
  (await cookies()).set(cookieName,token,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:sessionDays*86400});
}
export async function currentStaff(){
  const token = (await cookies()).get(cookieName)?.value;
  if (!token) return null;
  const session = await db.staffSession.findUnique({where:{tokenHash:hash(token)},include:{staff:true}});
  if (!session || session.revokedAt || session.expiresAt<=new Date() || !session.staff.active) return null;
  return session.staff;
}
export async function requireStaff(role?:StaffRole){
  const staff = await currentStaff();
  if (!staff) throw new ApiError(401,'Staff login required');
  if (role && staff.role!==role) throw new ApiError(403,'Administrator access required');
  return staff;
}
export async function logout(){
  const token = (await cookies()).get(cookieName)?.value;
  if (token) await db.staffSession.updateMany({where:{tokenHash:hash(token)},data:{revokedAt:new Date()}});
  (await cookies()).delete(cookieName);
}
