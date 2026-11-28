const {sql,db}=require('../database/store');
const {json,error,body,str,num}=require('../middleware/http');
const {randomUUID}=require('node:crypto');
const date=v=>{if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(v)||!Number.isFinite(Date.parse(v))||new Date(v).toISOString().slice(0,10)!==v)error(400,'Invalid date');return v};
module.exports=async(req,res,p,u)=>{
 if(!p.startsWith('/api/local/'))return false;
 if(!u)error(401,'Please login');
 if(req.method==='GET'&&p==='/api/local/workspace'){
 const harvest=sql.prepare('SELECT * FROM local_harvest').all().filter(h=>db.products.some(x=>x.id===h.productId)).map(h=>({...h,product:db.products.find(x=>x.id===h.productId).name}));
 json(res,200,{prices:sql.prepare('SELECT * FROM local_prices ORDER BY observed DESC').all(),centres:sql.prepare('SELECT * FROM local_centres').all(),vehicles:sql.prepare('SELECT * FROM local_vehicles').all().map(v=>({...v,name:db.users.find(x=>x.id===v.owner)?.name||'Unknown'})),harvest});return true;
 }
 if(req.method!=='POST')error(404,'Not found');const b=await body(req);
 if(p==='/api/local/prices'){sql.prepare('INSERT INTO local_prices VALUES (?,?,?,?,?,?)').run(randomUUID(),str(b.product),str(b.market),num(b.price),date(b.observed),u.id)}
 else if(p==='/api/local/centres'){sql.prepare('INSERT INTO local_centres VALUES (?,?,?,?,?)').run(randomUUID(),str(b.name),str(b.location),str(b.contact),u.id)}
 else if(p==='/api/local/vehicles'){if(u.role!=='transporter')error(403,'Transporters only');sql.prepare('INSERT INTO local_vehicles VALUES (?,?,?,?,?) ON CONFLICT(owner) DO UPDATE SET type=excluded.type,capacity=excluded.capacity,location=excluded.location,charge=excluded.charge').run(u.id,str(b.type),num(b.capacity),str(b.location),num(b.charge))}
 else if(p==='/api/local/harvest'){if(u.role!=='farmer'||!db.products.some(x=>x.id===b.productId&&x.farmerId===u.id))error(403,'Own products only');const h=date(b.harvest),s=date(b.sellBy);if(s<h)error(400,'Sell-by must follow harvest');sql.prepare('INSERT INTO local_harvest VALUES (?,?,?,?) ON CONFLICT(productId) DO UPDATE SET district=excluded.district,harvest=excluded.harvest,sellBy=excluded.sellBy').run(b.productId,str(b.district),h,s)}
 else error(404,'Not found');json(res,200,{success:true});return true;
};
