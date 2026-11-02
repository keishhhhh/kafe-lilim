import { CartView } from '@/components/customer/cart-view';export const metadata={title:'Your Basket'};
export default function CartPage(){return <div className="container"><div className="page-intro"><span className="eyebrow">Good things to come</span><h1>Your basket</h1></div><CartView/><div style={{height:90}}/></div>}
