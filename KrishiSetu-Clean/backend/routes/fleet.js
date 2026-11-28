const {sql,db}=require('../database/store');
const {json,error,body,str,num}=require('../middleware/http');
const {randomUUID}=require('node:crypto');
const {photo}=require('./shop');
const rate=v=>{if(typeof v!=='number'||!Number.isFinite(v)||v<0||v>1000000)error(400,'Invalid fee');return v};
const fields='id,owner,type,plate,location,capacity,volume,base,perKm,perKg,perM3,active,photo IS NOT NULL AS hasPhoto';
function quote(v,kg,km,volume){kg=num(kg);km=num(km);volume=rate(volume);if(kg>v.capacity||volume>v.volume)error(400,'Load exceeds vehicle capacity');return Math.round((v.base+km*v.perKm+kg*v.perKg+volume*v.perM3)*100)/100}
function get(id){const v=sql.prepare('SELECT '+fields+' FROM fleet WHERE id=?').get(id);if(!v)error(404,'Vehicle not found');return v}
function available(v){return v.active&&!sql.prepare("SELECT 1 FROM fleet_quotes q JOIN orders o ON o.id=q.orderId WHERE q.vehicleId=? AND o.status IN ('Assigned','Picked up')").get(v.id)}
function assignment(u,o,b){const v=get(b.vehicleId);if(v.owner!==u.id||!available(v))error(409,'Vehicle unavailable');const distance=num(b.distance),volume=rate(b.volume);return {vehicleId:v.id,vehicleType:v.type,distance,volume,fee:quote(v,o.qty,distance,volume)}}
async function fleet(req,res,p,u){if(!p.startsWith('/api/fleet'))return false;if(!u)error(401,'Please login');const m=req.method;const id=p.split('/')[3];
if(p==='/api/fleet'&&m==='GET'){const vehicles=sql.prepare('SELECT '+fields+' FROM fleet WHERE active=1 OR owner=?').all(u.id).map(v=>({...v,plate:v.owner===u.id?v.plate:undefined,available:!!available(v),name:db.users.find(x=>x.id===v.owner)?.name||'Unknown'}));json(res,200,{vehicles});return true}
if(id&&p.endsWith('/photo')&&m==='GET'){const v=get(id);if(!v.active&&v.owner!==u.id)error(404,'Not found');const r=sql.prepare('SELECT mime,photo FROM fleet WHERE id=?').get(id);if(!r.photo)error(404,'No photo');res.writeHead(200,{'Content-Type':r.mime,'Cache-Control':'no-store'});res.end(Buffer.from(r.photo));return true}
if(p==='/api/fleet/quote'&&m==='POST'){const b=await body(req);const v=get(b.vehicleId);if(!available(v))error(409,'Vehicle unavailable');json(res,200,{fee:quote(v,b.kg,b.distance,b.volume)});return true}
if(u.role!=='transporter')error(403,'Transporters only');
if(p==='/api/fleet'&&m==='POST'){const b=await body(req,3*1024*1024);const img=b.photo?photo(b.photo):null;const key=randomUUID();sql.prepare('INSERT INTO fleet VALUES(?,?,?,?,?,?,?,?,?,?,?,1,?,?)').run(key,u.id,str(b.type),str(b.plate),str(b.location),num(b.capacity),num(b.volume),rate(b.base),rate(b.perKm),rate(b.perKg),rate(b.perM3),img?'image/'+img.kind:null,img?img.bytes:null);json(res,201,{id:key});return true}
if(id&&m==='PATCH'){const v=get(id);if(v.owner!==u.id)error(403,'Own vehicles only');const b=await body(req,3*1024*1024);if(typeof b.active!=='boolean')error(400,'Invalid availability');sql.prepare('UPDATE fleet SET active=? WHERE id=?').run(+b.active,id);json(res,200,{success:true});return true}error(404,'Not found')}
module.exports={fleet,assignment};
