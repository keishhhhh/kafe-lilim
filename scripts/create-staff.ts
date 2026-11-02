import 'dotenv/config';
import argon2 from 'argon2';
import { db } from '../lib/db';
async function main(){
  const email=process.env.ADMIN_EMAIL?.toLowerCase().trim(),password=process.env.ADMIN_PASSWORD;
  if(!email || !password || password.length<14) throw new Error('Provide ADMIN_EMAIL and a strong ADMIN_PASSWORD of 14+ characters as environment variables.');
  const existing=await db.staffUser.findUnique({where:{email}});
  if(existing) throw new Error('Staff email already exists. No changes made.');
  await db.staffUser.create({data:{email,name:'Café administrator',role:'ADMIN',passwordHash:await argon2.hash(password,{type:argon2.argon2id})}});
  console.log('Administrator created:',email);
}
main().catch(e=>{console.error(e.message);process.exitCode=1}).finally(()=>db.$disconnect());
