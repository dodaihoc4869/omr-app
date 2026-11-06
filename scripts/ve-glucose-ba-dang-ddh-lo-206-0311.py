"""Nguồn106: ba dạng glucose, giữ toàn bộ H/OH/số carbon và chiều nhánh."""
from pathlib import Path
import importlib.util,json,hashlib,math
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='140f0df917df37e648f76dfe43ec9993f5f3d8465ed89bba639fdf14432dac5e';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[v for v in q['hinh']if v['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
def path(d,w=1.8):return f'<path d="{d}" fill="none" stroke="#252440" stroke-width="{w}" stroke-linejoin="round"/>'
def label(x,y,t,z=24,a='middle'):return F.label(x,y,t,z,a)
def first(x,y,t,z=24):return F.label(x-F.advance(t[0],z)/2,y,t,z,'start')
def last(x,y,t,z=24):return F.label(x+F.advance(t[-1],z)/2,y,t,z,'end')
def taper(p,q):
 x,y=p;u,v=q;ll=math.hypot(u-x,v-y);nx=-(v-y)/ll;ny=(u-x)/ll;return f'<path d="M{x} {y}L{u+nx*3.5} {v+ny*3.5}L{u-nx*3.5} {v-ny*3.5}Z" fill="#252440"/>'
def ring(dx=0,beta=False):
 b=f'<g transform="translate({dx} 0)">'+path('M54 203L105 154H161M186 165L225 203')+label(175,164,'O')
 b+=taper((54,203),(105,252))+path('M105 252H175',6)+taper((225,203),(175,252))
 b+=path('M105 154V126M105 154V176M54 203V166M54 203V236M105 252V229M105 252V284M175 252V223M175 252V284M225 203V166M225 203V239')
 b+=first(105,121,'CH₂OH')+label(105,196,'H')+label(54,162,'H')+first(54,258,'OH')+first(105,222,'OH')+label(105,308,'H')+label(175,218,'H')+first(175,307,'OH')
 b+=(first(225,160,'OH')+label(225,263,'H'))if beta else(label(225,161,'H')+first(225,262,'OH'))
 for x,y,t in [(239,201,'1'),(190,272,'2'),(93,274,'3'),(44,211,'4'),(93,151,'5'),(105,98,'6')]:b+=label(x,y,t,18)
 return b+'</g>'
b=ring()+ring(763,True)
# Fischer: R-L-R-R, liên kết dọc nối vào carbon, chỉ C1 được ghi C tường minh.
b+=label(519,68,'C')+label(457,31,'H')+label(580,32,'O')+path('M469 31L508 54M530 50L568 28M534 58L572 35M519 72V391')
for j,y in enumerate([129,199,269,339],2):
 b+=path(f'M459 {y}H577')
 b+=(last(448,y+7,'HO')+label(589,y+7,'H'))if j==3 else(label(448,y+7,'H')+first(589,y+7,'OH'))
 b+=label(533,y-11,str(j),18)
b+=first(519,416,'CH₂OH')+label(500,414,'6',18)+label(519,42,'1',18)
b+=path('M291 201H381L375 194M381 207H291L298 214M669 201H759L753 194M759 207H669L676 214',1.6)
b+=label(130,338,'dạng α-glucose',19)+label(919,338,'dạng β-glucose',19)+label(529,449,'glucose, mạch hở',18)
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1050" height="470" viewBox="0 0 1050 470"><title>Ba dạng glucose theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='glucose-ba-dang-ddh-'+hh+'.svg';(K/fn).write_bytes(raw);r=dict(i=106,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='α-open-β/18Cnums/allsourceH-OH-CH2OH/4tapers2horizontalbold/FischerRLRR/aldehydeH-C=O/2equilibriumpairs/3captions/DDHpath.');(K/'cau-truc-glucose-ba-dang-ddh-lo-206-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
