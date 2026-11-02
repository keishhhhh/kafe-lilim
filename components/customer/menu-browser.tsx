'use client';
import { useEffect,useRef,useState } from 'react';import { Plus,Search,X,Check,Minus } from 'lucide-react';
import { useCart,type CartLine } from './cart-context';import { php } from '@/lib/pricing';
export type MenuProduct={id:string,name:string,description:string,priceCentavos:number,imageUrl:string|null,featured:boolean,available:boolean,hidden:boolean,archived:boolean,category:{id:string,name:string},inventory:{id:string,available:number,unlimited:boolean}|null,modifierGroups:{id:string,name:string,minSelect:number,maxSelect:number,options:{id:string,name:string,priceCentavos:number,available:boolean}[]}[]};
export function ProductDialog({product,onClose,original}:{product:MenuProduct|null,onClose:()=>void,original?:CartLine}){
  const ref=useRef<HTMLDialogElement>(null);const [quantity,setQuantity]=useState(original?.quantity??1);const [selected,setSelected]=useState<string[]>(original?.modifiers??[]);const [note,setNote]=useState(original?.note??'');const [error,setError]=useState('');const {add,change}=useCart();
  useEffect(()=>{if(product){ref.current?.showModal();}return()=>ref.current?.close();},[product]);
  if(!product)return null;
  const unit=product.priceCentavos+product.modifierGroups.flatMap(g=>g.options).filter(o=>selected.includes(o.id)).reduce((s,x)=>s+x.priceCentavos,0);
  const submit=()=>{
    for(const group of product.modifierGroups){const count=group.options.filter(o=>selected.includes(o.id)).length;if(count<group.minSelect||count>group.maxSelect){setError(`Choose ${group.minSelect}–${group.maxSelect} for ${group.name}.`);return;}}
    if(note.length>300){setError('Notes must be under 300 characters');return;}
    const line:CartLine={id:original?.id??crypto.randomUUID(),menuItemId:product.id,name:product.name,imageUrl:product.imageUrl,quantity,modifiers:selected,modifierNames:product.modifierGroups.flatMap(g=>g.options).filter(o=>selected.includes(o.id)).map(o=>o.name),note,unitCentavos:unit};
    if(original)change(line);else add(line);onClose();
  };
  const choose=(group:MenuProduct['modifierGroups'][number],id:string)=>{
    setError('');setSelected(prev=>{
      if(prev.includes(id))return prev.filter(v=>v!==id);
      const others=prev.filter(x=>!group.options.some(o=>o.id===x));const within=prev.filter(x=>group.options.some(o=>o.id===x));
      return [...others,...(group.maxSelect===1?[id]:[...within,id].slice(-group.maxSelect))];
    });
  };
  return <dialog className="dialog" ref={ref} onClose={onClose} onClick={e=>{if(e.target===ref.current)ref.current?.close();}} aria-label={`Customize ${product.name}`}>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'start',gap:10}}><div><span className="eyebrow">Make it yours</span><h2 style={{fontSize:30,marginBottom:8}}>{product.name}</h2></div><button className="btn btn-outline btn-small" onClick={()=>ref.current?.close()} aria-label="Close"><X size={18}/></button></div><p className="muted">{product.description}</p>
    {product.modifierGroups.map(g=><fieldset key={g.id} style={{border:0,padding:0,margin:'18px 0'}}><legend style={{fontWeight:700}}>{g.name} <span className="tiny muted">· Choose {g.minSelect}{g.minSelect!==g.maxSelect?`–${g.maxSelect}`:''}</span></legend><div className="stack" style={{gap:8,marginTop:10}}>{g.options.filter(o=>o.available).map(o=><label key={o.id} className="surface" style={{padding:'10px 14px',display:'flex',alignItems:'center',gap:12,cursor:'pointer'}}><input type={g.maxSelect===1?'radio':'checkbox'} name={`option-${g.id}`} checked={selected.includes(o.id)} onChange={()=>choose(g,o.id)}/><span style={{flex:1}}>{o.name}</span><span className="tiny muted">{o.priceCentavos?`+ ${php(o.priceCentavos)}`:'Included'}</span></label>)}</div></fieldset>)}
    <div className="field"><label htmlFor="item-note">Special instructions (optional)</label><textarea id="item-note" maxLength={300} rows={2} value={note} onChange={e=>setNote(e.target.value)} placeholder="For example, less ice"/></div>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',margin:'16px 0'}}><div style={{display:'flex',alignItems:'center',gap:18}}><button aria-label="Decrease quantity" onClick={()=>setQuantity(q=>Math.max(1,q-1))}><Minus size={17}/></button><b>{quantity}</b><button aria-label="Increase quantity" onClick={()=>setQuantity(q=>Math.min(20,q+1))}><Plus size={17}/></button></div><b>{php(unit*quantity)}</b></div>
    {error&&<p role="alert" className="error">{error}</p>}<button className="btn" style={{width:'100%'}} onClick={submit}><Check size={18}/>{original?'Update basket':'Add to basket'}</button>
  </dialog>;
}
export function MenuBrowser({products}:{products:MenuProduct[]}){
  const [category,setCategory]=useState('All');const [search,setSearch]=useState('');const [opened,setOpened]=useState<MenuProduct|null>(null);const [sort,setSort]=useState('featured');
  const categories=['All',...new Set(products.map(p=>p.category.name))];
  const filtered=products.filter(p=>(category==='All'||p.category.name===category)&&`${p.name} ${p.description}`.toLowerCase().includes(search.toLowerCase())).sort((a,b)=>sort==='name'?a.name.localeCompare(b.name):sort==='low'?a.priceCentavos-b.priceCentavos:Number(b.featured)-Number(a.featured));
  return <><div style={{display:'flex',flexWrap:'wrap',gap:12,alignItems:'center'}}><div style={{flex:'1 1 230px',position:'relative'}}><Search size={18} style={{position:'absolute',top:14,left:12}}/><input aria-label="Search the menu" placeholder="Search for something lovely..." value={search} onChange={e=>setSearch(e.target.value)} style={{paddingLeft:38}}/></div><select aria-label="Sort menu" style={{width:'auto'}} value={sort} onChange={e=>setSort(e.target.value)}><option value="featured">Featured first</option><option value="name">Name A to Z</option><option value="low">Price: low to high</option></select></div>
    <div className="filters" aria-label="Product categories">{categories.map(c=><button key={c} className={c===category?'active':''} onClick={()=>setCategory(c)}>{c}</button>)}</div>
    {!filtered.length?<div className="surface empty"><h3>No drinks found</h3><p className="muted">Try another search or category.</p></div>:<div className="tiles">{filtered.map(p=><article key={p.id} className="product-card"><img className="product-image" src={p.imageUrl||'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=700&q=80'} alt={p.name}/><div className="product-detail"><div style={{display:'flex',gap:8,marginBottom:8}}><span className="eyebrow">{p.category.name}</span>{p.featured&&<span className="chip">Favorite</span>}</div><h3 style={{margin:'4px 0 8px'}}>{p.name}</h3><p>{p.description}</p><div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:8,marginTop:'auto'}}><b className="price">{php(p.priceCentavos)}</b><button className="btn btn-small" disabled={!p.available||!p.inventory||(!p.inventory.unlimited&&p.inventory.available===0)} onClick={()=>setOpened(p)}>{!p.available||!p.inventory||(!p.inventory.unlimited&&p.inventory.available===0)?'Sold out':<><Plus size={16}/> Add</>}</button></div></div></article>)}</div>}
    {opened&&<ProductDialog key={opened.id} product={opened} onClose={()=>setOpened(null)}/>}
  </>;
}
