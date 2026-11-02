import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
export class ApiError extends Error { constructor(public status:number, message:string){super(message);} }
export function checkOrigin(request:NextRequest){
  const origin = request.headers.get('origin');
  if (!origin) return; // Non-browser clients still require credentials or provider signature.
  const host = request.headers.get('host');
  if (!host || new URL(origin).host !== host || !/^https?:/.test(origin)) throw new ApiError(403,'Invalid request origin');
}
export async function withApi(fn:()=>Promise<NextResponse>){
  try { return await fn(); }
  catch (err){
    if (err instanceof ApiError) return NextResponse.json({error:err.message},{status:err.status});
    if (err instanceof ZodError) return NextResponse.json({error:'Validation failed',issues:err.issues.map(i=>({path:i.path.join('.'),message:i.message}))},{status:400});
    console.error('Request failed:',err instanceof Error ? err.name : 'Unknown error');
    return NextResponse.json({error:'An unexpected error occurred.'},{status:500});
  }
}
export function json(data:unknown,status=200){return NextResponse.json(data,{status,headers:{'Cache-Control':'no-store'}});}
export async function parseBody(request:NextRequest,maxBytes=15000){
  const body = await request.text();
  if (Buffer.byteLength(body)>maxBytes) throw new ApiError(413,'Request is too large');
  try { return JSON.parse(body) as unknown; }
  catch {throw new ApiError(400,'Invalid JSON');}
}
