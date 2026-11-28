function json(res,status,data){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data))}
function error(status,message){throw Object.assign(new Error(message),{status})}
async function body(req){if(!String(req.headers['content-type']).startsWith('application/json'))error(415,'JSON required');let size=0,parts=[];for await(const p of req){size+=p.length;if(size>32768)error(413,'Request too large');parts.push(p)}try{const b=JSON.parse(Buffer.concat(parts));if(!b||typeof b!=='object'||Array.isArray(b))throw Error();return b}catch{error(400,'Invalid JSON')}}
function str(v,max=120){if(typeof v!=='string'||!v.trim()||v.trim().length>max)error(400,'Invalid text field');return v.trim()}
function num(v){if(typeof v!=='number'||!Number.isFinite(v)||v<=0||v>1e8)error(400,'Invalid quantity or price');return v}
module.exports={json,error,body,str,num};
