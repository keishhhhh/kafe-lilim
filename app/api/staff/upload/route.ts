import { NextRequest } from 'next/server';import { put } from '@vercel/blob';import { randomUUID } from 'node:crypto';
import { requireStaff } from '@/lib/auth/session';import { checkOrigin,json,withApi,ApiError } from '@/lib/http';
export async function POST(req:NextRequest){return withApi(async()=>{checkOrigin(req);await requireStaff();
  const data=await req.formData();const file=data.get('file');if(!(file instanceof File) || file.size>4000000 || file.size<8)throw new ApiError(400,'Provide an image under 4 MB');
  const bytes=Buffer.from(await file.arrayBuffer());const png=bytes.subarray(0,8).toString('hex')==='89504e470d0a1a0a';
  const jpeg=bytes[0]===255&&bytes[1]===216&&bytes[2]===255;const webp=bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP';
  if(!png&&!jpeg&&!webp)throw new ApiError(400,'Use a PNG, JPEG, or WebP image');
  const ext=png?'png':jpeg?'jpg':'webp';
  if(!process.env.BLOB_READ_WRITE_TOKEN)throw new ApiError(503,'Image storage is not configured');
  const result=await put(`menu/${randomUUID()}.${ext}`,bytes,{access:'public',contentType:png?'image/png':jpeg?'image/jpeg':'image/webp',addRandomSuffix:false,token:process.env.BLOB_READ_WRITE_TOKEN});
  return json({url:result.url});
});}
