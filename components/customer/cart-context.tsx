'use client';
import { createContext,useCallback,useContext,useEffect,useState } from 'react';
export type CartLine={id:string,menuItemId:string,name:string,quantity:number,modifiers:string[],modifierNames:string[],note:string,unitCentavos:number,imageUrl:string|null};
type Store={items:CartLine[],add:(line:CartLine)=>void,change:(line:CartLine)=>void,remove:(id:string)=>void,clear:()=>void};
const Context=createContext<Store|null>(null);
export function CartProvider({children}:{children:React.ReactNode}){
  const [items,setItems]=useState<CartLine[]>([]);const [loaded,setLoaded]=useState(false);
  useEffect(()=>{try{const value=JSON.parse(localStorage.getItem('kl_cart')||'[]');if(Array.isArray(value))setItems(value);}catch{}setLoaded(true);},[]);
  useEffect(()=>{if(loaded)localStorage.setItem('kl_cart',JSON.stringify(items));},[items,loaded]);
  const add=useCallback((line:CartLine)=>setItems(prev=>[...prev,line]),[]);
  const change=useCallback((line:CartLine)=>setItems(prev=>prev.map(x=>x.id===line.id?line:x)),[]);
  const remove=useCallback((id:string)=>setItems(prev=>prev.filter(x=>x.id!==id)),[]);
  const clear=useCallback(()=>setItems([]),[]);
  return <Context.Provider value={{items,add,change,remove,clear}}>{children}</Context.Provider>;
}
export function useCart(){const ctx=useContext(Context);if(!ctx)throw new Error('Cart provider missing');return ctx;}
