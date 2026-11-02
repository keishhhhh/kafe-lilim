'use client';import { useRouter } from 'next/navigation';
export function Logout(){const router=useRouter();return <button className="btn btn-outline btn-small" onClick={async()=>{await fetch('/api/staff/logout',{method:'POST'});router.replace('/staff/login');router.refresh();}}>Log out</button>}
