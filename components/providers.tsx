'use client';
import { ThemeProvider } from 'next-themes';
import { CartProvider } from './customer/cart-context';
export function Providers({children}:{children:React.ReactNode}){return <ThemeProvider attribute="class" defaultTheme="system" enableSystem><CartProvider>{children}</CartProvider></ThemeProvider>;}
