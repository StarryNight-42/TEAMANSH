"""Optional integration test: Python 3 standard library only; uses a temporary database."""
import json, os, subprocess, tempfile, time, urllib.request, urllib.error, http.cookiejar
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
BASE='http://127.0.0.1:3939'
def client(): return urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
def req(c,path,method='GET',data=None,status=200):
 r=urllib.request.Request(BASE+path,method=method,data=None if data is None else json.dumps(data).encode(),headers={'Content-Type':'application/json'} if data is not None else {})
 try: response=c.open(r,timeout=5)
 except urllib.error.HTTPError as e: response=e
 with response:
  assert response.status==status,(path,response.status,response.read())
  raw=response.read(); return json.loads(raw) if 'application/json' in response.headers.get('Content-Type','') else raw
with tempfile.TemporaryDirectory() as tmp:
 env=dict(os.environ,PORT='3939',HOST='127.0.0.1',SQLITE_FILE=str(Path(tmp)/'test.sqlite'))
 def start():
  p=subprocess.Popen(['node','server.js'],cwd=ROOT,env=env,stdout=subprocess.DEVNULL)
  for _ in range(50):
   try: req(client(),'/'); return p
   except (OSError,urllib.error.URLError): time.sleep(.1)
  p.terminate(); raise RuntimeError('Server did not start')
 p=start()
 try:
  accounts={}; ids={}
  for role in ['farmer','distributor','transporter']:
   c=client(); b=dict(name=role.title(),email=role+'@example.com',password='TestPass123',role=role); ids[role]=req(c,'/api/register','POST',b,201)['user']['id']; req(c,'/api/login','POST',b); assert b'KRISHI SETU' in req(c,'/'+role+'.html'); accounts[role]=c
  f,d,t=(accounts[x] for x in ['farmer','distributor','transporter']); req(client(),'/api/workspace',status=401)
  product=req(f,'/api/products','POST',dict(name='Tomato',price=40,stock=200,location='Dhankuta'))['result']['id']; req(d,'/api/products','POST',dict(name='Bad',price=1,stock=1,location='X'),403)
  order=req(d,'/api/orders','POST',dict(productId=product,qty=100,drop='Itahari',shipping='company',method='Cash on delivery'))['result']['id']; assert req(f,'/api/workspace')['products'][0]['stock']==100
  req(t,'/api/orders/'+order,'PATCH',dict(status='Delivered'),403)
  for c,state in [(f,'Accepted'),(t,'Assigned'),(t,'Picked up'),(t,'Delivered'),(d,'Received')]: req(c,'/api/orders/'+order,'PATCH',dict(status=state))
  assert req(d,'/api/workspace')['orders'][0]['status']=='Received'
  req(f,'/api/messages','POST',dict(to=ids['distributor'],text='नमस्ते Tomato ready')); assert req(d,'/api/notifications')['messages'][0]['text']=='नमस्ते Tomato ready'; assert not req(t,'/api/notifications')['messages']; assert req(d,'/api/notifications')['unread']>0
  with d.open(BASE+'/api/events',timeout=5) as stream: assert b'Tomato ready' in stream.readline()
  req(d,'/api/notifications/read','POST'); assert req(d,'/api/notifications')['unread']==0
  req(t,'/api/local/vehicles','POST',dict(type='Pickup',capacity=500,location='Itahari',charge=1000)); assert req(f,'/api/local/workspace')['vehicles'][0]['type']=='Pickup'
  p.terminate();p.wait();p=start();assert req(f,'/api/workspace')['products'][0]['stock']==100;assert req(d,'/api/workspace')['orders'][0]['status']=='Received';assert req(d,'/api/notifications')['messages']
  print('PASS: registration/login, role protection, product, stock, delivery lifecycle, private chat, SSE, notifications, vehicle registration and SQLite restart persistence')
 finally: p.terminate();p.wait()
