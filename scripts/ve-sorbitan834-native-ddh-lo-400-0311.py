"""Nguồn834: mạch riêng và các nét lập thể đọc từ ảnh gốc."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
p=json.loads((K/'doc-sorbitan834-lo-400.json').read_text());g=p['geometry'];h=p['hash'];b=''
def path(d,fill='none',stroke='#202020',w=1.5):
 global b
 b+=f'<path d="{d}" fill="{fill}" stroke="{stroke}" stroke-width="{w}" stroke-linecap="butt" stroke-linejoin="round"/>'
def line(v,w=1.5):path('M'+'L'.join(f'{x} {y}'for x,y in v),w=w)
def lab(x,y,t,z=23,anchor='middle'):
 global b
 b+=F.label(x,y,t,z,anchor=anchor,fill='#202020')
def first(x,y,t,z=23):lab(x-F.advance(t[0],z)/2,y,t,z,anchor='start')
def last(x,y,t,z=23):lab(x+F.advance(t[-1],z)/2,y,t,z,anchor='end')
line(g['acylOrderedVertices']+[[617,69]])
for v in g['carbonyl']['rootRays']:line(v)
line([[639,70],[662,83.5],[696.5,63.5],[731,83.5],[753,67]])
line([[773,69],[795,83.5],[783,121.5],[743,121.5],[731,83.5]])
path('M696.5 63.5 L694 38 L699 38.5 Z','#202020','none',0)
path('M743 121.5 L725.5 141 L730.5 144 Z','#202020','none',0)
for name in ['hashedH','hashedOH']:
 for v in g[name]['individualSegmentsApprox']:line(v,1.5)
# Vết mờ riêng, không tự gọi là vạch lập thể thứ bảy.
path('M796 145 L797 145',stroke='#999999',w=0.8)
lab(593.5,132,'O');lab(628,73,'O');lab(763,70,'O')
first(697,33,'OH');last(720,163,'HO');first(807,163,'OH');lab(731,53,'H')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="834" height="182" viewBox="0 0 834 182"><title>Công thức theo nguồn834</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='sorbitan834-native-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
r=dict(i=834,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='24C6O=18acyl+6sugarC/3freeOH-1explicitH/1CO2splitraysCONTACTrespectivearms/0CCdouble/1fiveRing1ringO/2SOLIDwedgesOHup-HOdownleft/2HASHEDwedges6Hhorizontalbars-6OHobliquebars+1tinyGRAYterminalmarkUNKNOWNretainedNOTseventhbar/ALLregularUPRIGHT-FIRSTOandLASTOanchors/individualnonperiodicchainvertices/NOaddedH-formula-caption-name-arrow-charge-answer-alias')
(K/'cau-truc-sorbitan834-native-ddh-lo-400-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
