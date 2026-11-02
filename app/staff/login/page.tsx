import { LoginForm } from '@/components/staff/login-form';import { currentStaff } from '@/lib/auth/session';import { redirect } from 'next/navigation';
export const dynamic='force-dynamic';export const metadata={title:'Staff Sign In',robots:{index:false}};
export default async function StaffLogin(){if(await currentStaff())redirect('/staff/dashboard');return <div className="container"><LoginForm/></div>}
