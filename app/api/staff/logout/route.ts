import { NextRequest } from 'next/server';import { logout } from '@/lib/auth/session';import { json,withApi,checkOrigin } from '@/lib/http';
export async function POST(request:NextRequest){return withApi(async()=>{checkOrigin(request);await logout();return json({ok:true});});}
