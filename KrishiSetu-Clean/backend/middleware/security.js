const {error}=require('./http');
const attempts=new Map();
function security(req,res,p){
  res.setHeader('X-Frame-Options','DENY');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('Permissions-Policy','camera=(), microphone=(), geolocation=()');
  res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
  if(!p.startsWith('/api/')||['GET','HEAD'].includes(req.method))return;
  const origin=req.headers.origin;const expected=process.env.APP_ORIGIN||`${req.socket.encrypted?'https':'http'}://${req.headers.host}`;
  if(req.headers['sec-fetch-site']==='cross-site'||(origin&&origin!==expected))error(403,'Cross-origin request denied');
  if(['/api/login','/api/register','/api/password'].includes(p)){
    const now=Date.now();for(const [k,v] of attempts)if(v.until<=now)attempts.delete(k);
    const key=req.socket.remoteAddress+'|'+p;let a=attempts.get(key);if(!a){a={count:0,until:now+900000};attempts.set(key,a)}
    if(++a.count>20){res.setHeader('Retry-After',String(Math.ceil((a.until-now)/1000)));error(429,'Too many attempts. Try again later.');}
  }
}
module.exports=security;
