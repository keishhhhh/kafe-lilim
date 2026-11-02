import { currentStaff } from '@/lib/auth/session';import { redirect } from 'next/navigation';
export async function staffGuard(){const staff=await currentStaff();if(!staff)redirect('/staff/login');return staff;}
