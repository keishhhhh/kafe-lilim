import { db } from '../lib/db';
const products=[
  ['Coffee','Kape Barako',110,'Bold, local and lovingly brewed.','coffee'],
  ['Coffee','Café Americano',120,'Espresso poured long and smooth.','coffee'],
  ['Coffee','Café Latte',145,'Silky espresso with steamed milk.','coffee'],
  ['Coffee','Spanish Latte',155,'Velvety espresso with sweet condensed milk.','coffee'],
  ['Coffee','Caramel Macchiato',165,'Espresso layered with buttery caramel.','coffee'],
  ['Coffee','Iced Mocha',165,'Chocolate and espresso, chilled to perfection.','coffee'],
  ['Matcha','Matcha Latte',170,'Smooth matcha whisked into creamy milk.','matcha'],
  ['Non-coffee','Iced Chocolate',145,'Deep chocolate served over ice.','matcha'],
  ['Coffee','Vanilla Cold Brew',160,'Slow-steeped coffee with mellow vanilla.','coffee'],
  ['Pastries','Butter Croissant',105,'Flaky, golden and buttery.','pastry'],
  ['Pastries','Chocolate Cookie',85,'Soft-centered, chocolate-studded delight.','pastry'],
  ['Pastries','Blueberry Cheesecake',185,'Creamy cheesecake with bright berries.','pastry']
] as const;
const photos={coffee:'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=900&q=80',matcha:'https://images.unsplash.com/photo-1515823064-d6e0c04616a7?w=900&q=80',pastry:'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=900&q=80'};
async function seed(){
 await db.businessSettings.upsert({where:{id:'main'},update:{},create:{id:'main',acceptOrders:false}});
 const names=['Coffee','Non-coffee','Matcha','Tea','Pastries','Snacks','Seasonal specials'];
 for(const [i,name] of names.entries())await db.category.upsert({where:{name},create:{name,sortOrder:i},update:{}});
 const cats=await db.category.findMany();const ids=Object.fromEntries(cats.map(c=>[c.name,c.id]));
 for(const [category,name,price,description,kind] of products){
   if(await db.menuItem.findFirst({where:{name}}))continue;
   const beverage=['Coffee','Non-coffee','Matcha'].includes(category);
   const temp=beverage&&name!=='Vanilla Cold Brew'&&name!=='Iced Mocha'&&name!=='Iced Chocolate';
   await db.menuItem.create({data:{name,description:`[Sample menu] ${description}`,priceCentavos:price*100,categoryId:ids[category],imageUrl:photos[kind],featured:['Spanish Latte','Matcha Latte','Butter Croissant'].includes(name),
     inventory:{create:{available:24,lowStockAt:5}},
     modifierGroups:{create:beverage?[
       ...(temp?[{name:'Temperature',minSelect:1,maxSelect:1,sortOrder:1,options:{create:[{name:'Hot',priceCentavos:0},{name:'Iced',priceCentavos:1000}]}}]:[]),
       {name:'Size',minSelect:1,maxSelect:1,sortOrder:2,options:{create:[{name:'Regular',priceCentavos:0},{name:'Large',priceCentavos:3000}]}},
       {name:'Milk option',minSelect:0,maxSelect:1,sortOrder:3,options:{create:[{name:'Oat milk',priceCentavos:2500},{name:'Soy milk',priceCentavos:2000}]}},
       {name:'Sweetness',minSelect:0,maxSelect:1,sortOrder:4,options:{create:[{name:'50% sweetness',priceCentavos:0},{name:'No added sugar',priceCentavos:0}]}}
     ]:[]}}});
 }
 console.log('Seeded editable demonstration menu. Online ordering remains OFF. No demo sales created.');
}
seed().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>db.$disconnect());
