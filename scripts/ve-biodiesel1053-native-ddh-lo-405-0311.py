"""Nguồn1053: từng dòng vật chất, hộp và đầu mũi tên theo ảnh gốc."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
p=json.loads((K/'doc-biodiesel1053-lo-405.json').read_text());g=p['geometry'];h=p['hash'];b=''
def path(d,fill='none',stroke='#202020',w=1.5):
 global b
 b+=f'<path d="{d}" fill="{fill}" stroke="{stroke}" stroke-width="{w}" stroke-linecap="butt" stroke-linejoin="miter"/>'
def line(v):path('M'+'L'.join(f'{x} {y}'for x,y in v))
def lab(x,y,t,z=26,anchor='middle',weight='de'):
 global b
 b+=F.label(x,y,t,z,anchor=anchor,weight=weight,fill='#202020')
def head(x,y,d):
 # Hình đặc có đáy lõm; mỗi hướng được quay từ cùng khung cục bộ.
 vectors={'RIGHT':(1,0),'LEFT':(-1,0),'DOWN':(0,1),'UP':(0,-1)};dx,dy=vectors[d]
 def xy(u,v):return f'{x+u*dx-v*dy} {y+u*dy+v*dx}'
 path('M'+xy(0,0)+' L'+xy(-13,-6)+' L'+xy(-9,0)+' L'+xy(-13,6)+' Z','#202020','none',0)
for v in g['paths']:
 vs=[list(a)for a in v['vertices']]
 if not v['tips']:vs[-1][0]=898  # Trục ra tới đúng mép cắt gốc, không bịa đầu.
 line(vs)
 for x,y in v['tips']:head(x,y,v['direction'])
for v in g['boxes']:
 x,y,r,bt=v['rect'];path(f'M{x} {y} H{r} V{bt} H{x} Z')
 bx,by,br,bb=v['labelBox'];lab((bx+br)/2,bb,v['label'],18.5 if v['label']=='Đầu vào'else 26)
for v in g['paths']:
 x,y,r,bt=v['labelBox'];lab((x+r)/2,bt,v['label'])
for v in g['legend']:
 x,y,r,bt=v['bbox'];lab(x,v['baselineApprox'],v['literal'],24,anchor='start',weight='dam'if v['weight']=='TRUEBOLD'else'de')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="898" height="571" viewBox="0 0 898 571"><title>Sơ đồ theo nguồn1053</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='biodiesel1053-native-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
r=dict(i=1053,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='6RECTboxes/16FULLFILLEDconcaveheads13RIGHT1LEFT1DOWN1UP/3RIGHTnativeCROPPEDshafts6-5-2NOaddedheads/EXACTĐầu vào-R1-S1-D1-R2-S2/ALLnumsBASELINE-commaflows1,2,4,6-1,6-2,4-1,2,5-1,5/EXACTR1, R2: Thiết bị phản ứng-S1, S2: Buồng phân tách-D1: Tháp chưng cất/ONLYCác dòng vật chất:TRUEdam-restALLregularUPRIGHT/EXACT(1) Methanol-(2) Biodiesel-(3) Dầu thải-(4) Triglyceride-(5) Glycerol-(6) Nước/individualpaths-heads/NOaddedcatalystR1R2-massflow-condition-answer-alias')
(K/'cau-truc-biodiesel1053-native-ddh-lo-405-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
