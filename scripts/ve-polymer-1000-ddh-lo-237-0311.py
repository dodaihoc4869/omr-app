"""Nguồn506: ba Haworth nằm ngang; ngoặc vòng giữa và chỉ số 1000 nguyên văn."""
from pathlib import Path
import importlib.util,json,hashlib,math
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='5d7646e610ca22a24a3b003a3dff78ed42fe218eaadcaa097bb8f51349dd4d64';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[v for v in q['hinh']if v['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
def line(d,w=1.8):return f'<path d="{d}" fill="none" stroke="#252440" stroke-width="{w}" stroke-linejoin="round"/>'
def first(x,y,t,z=23):return F.label(x-F.advance(t[0],z)/2,y,t,z,'start')
def taper(p,q):
 dx=q[0]-p[0];dy=q[1]-p[1];n=math.hypot(dx,dy);ux=-dy/n;uy=dx/n
 pts=[(p[0]+ux*.8,p[1]+uy*.8),(q[0]+ux*3.6,q[1]+uy*3.6),(q[0]-ux*3.6,q[1]-uy*3.6),(p[0]-ux*.8,p[1]-uy*.8)]
 return '<path d="M'+'L'.join(f'{a:.3f} {b:.3f}'for a,b in pts)+'Z" fill="#252440"/>'
b=''
for sh in [0,284,568]:
 b+='<g transform="translate('+str(sh)+' 0)">'
 b+=line('M55 162L115 118H196M222 125L271 162M115 118V88M115 118V136M55 162V130M115 206V181M115 206V232M209 206V181M209 206V232M271 162V130')
 b+=taper((55,162),(115,206))+taper((271,162),(209,206))+line('M115 206H209',7.2)
 b+=F.label(209,127,'O',23)+first(115,82,'CH₂OH')
 for x,y in [(115,155),(55,126),(115,252),(209,177),(271,126)]:b+=F.label(x,y,'H',23)
 for x,y in [(115,177),(209,254)]:b+=first(x,y,'OH')
 b+='</g>'
b+=line('M55 162V188M839 162V208M271 162L295 178M315 178L339 162M555 162L579 178M599 178L623 162')
b+=first(55,208,'OH')+first(839,227,'OH')+F.label(305,197,'O',23)+F.label(589,197,'O',23)
b+=line('M339 48H323V274H339M559 48H575V274H559',1.8)+F.label(581,281,'1000',17,'start')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="907" height="324" viewBox="0 0 907 324"><title>Đoạn mạch polymer với chỉ số 1000 theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='polymer-1000-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=506,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='3horizontalHaworth/18C15H8OH3CH2OH3ringO2bridgeO=16O/6TAPER3bold/bracketsONLYmiddlering-notbridgeO/literal1000NOspace-n/terminalOHleftdown-rightdown/noCnums-caption-extraH/DDHpath.')
(K/'cau-truc-polymer-1000-ddh-lo-237-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
