'use client';
import Link from 'next/link';import { Coffee,ShoppingBag,Sun,Moon } from 'lucide-react';import { useTheme } from 'next-themes';import { useCart } from './cart-context';
export function Header(){const {items}=useCart();const {resolvedTheme,setTheme}=useTheme();return <header className="header"><div className="container header-inner">
  <Link href="/" className="brand" aria-label="Kafe Lilim home"><Coffee className="inline brand-mark" size={23}/>Kafe Lilim</Link>
  <nav className="nav" aria-label="Main navigation"><Link href="/menu">Menu</Link><Link href="/cart" aria-label={`Shopping cart, ${items.reduce((s,x)=>s+x.quantity,0)} items`}><ShoppingBag size={19} className="inline"/> <span>{items.reduce((s,x)=>s+x.quantity,0)}</span></Link><button onClick={()=>setTheme(resolvedTheme==='dark'?'light':'dark')} aria-label="Toggle light or dark theme" title="Toggle theme">{resolvedTheme==='dark'?<Sun size={19}/>:<Moon size={19}/>}</button></nav>
</div></header>}
