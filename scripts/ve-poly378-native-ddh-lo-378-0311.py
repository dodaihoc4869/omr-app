"""Đoạn mạch nguồn122: từng nét riêng, giữ độ lệch nhánh và mọi H tường minh."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
p=json.loads((K/'doc-poly378-lo-378.json').read_text());g=p['geometry'];h=p['hash'];b=''
def lab(x,y,t,z=40):return F.label(x,y,t,z,fill='#202020')
for v in g['upperBonds']+g['lowerBonds']+g['horizontalBonds']:
 (x,y),(u,w)=v;b+=f'<path d="M{x} {y}L{u} {w}" stroke="#202020" stroke-width="2" fill="none"/>'
for v in g['backboneC']:
 x,y,u,w=v['bbox'];b+=lab((x+u)/2,104,'C')
for v in g['bottomH']:
 x,y,u,w=v['bbox'];b+=lab((x+u)/2,171,'H')
for v in g['topLabels']:
 x,y,u,w=v['bbox']
 if v['text']=='H':b+=lab((x+u)/2,35,'H')
 else:
  # Chữ C đầu nối nhánh; đặt riêng chỉ số để giữ khe với H kế bên.
  c=x+13.5
  b+=lab(c,35,'C')+lab(c+21,42,'2',23)+lab(c+41,35,'H')+lab(c+61,42,'5',23)
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="700" height="176" viewBox="0 0 700 176"><title>Đoạn mạch theo nguồn122</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='poly378-native-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
r=dict(i=122,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='8explicitbackboneC-4topC2H5FIRSTCanchors-4topH-8bottomH/16knownC12standaloneH-EXCLHwithinC2H5/9horizontalincl2freeends16vertical/ALLregularUPRIGHT-SUB25/upper4thx310.5-lower4th311.5nativeDRIFTkeep/individualnonperiodicstrokes-glyphWHITEgaps/0double-stereo-arrows-captions-brackets-n/NOmonomeranswer-polymername-addedrepeat-noalias738739714')
(K/'cau-truc-poly378-native-ddh-lo-378-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
