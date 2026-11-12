"""Nguồn482: triester ba mạch18C; giữ nét và phần cắt sát mép gốc."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
p=json.loads((K/'doc-triester482-lo-398.json').read_text());g=p['geometry'];h=p['hash'];b=''
def path(d,fill='none',stroke='#303030',w=2):
 global b
 b+=f'<path d="{d}" fill="{fill}" stroke="{stroke}" stroke-width="{w}" stroke-linecap="butt" stroke-linejoin="round"/>'
def line(v,w=2):path('M'+'L'.join(f'{x} {y}'for x,y in v),w=w)
def lab(x,y,t,z=26,anchor='middle'):
 global b
 b+=F.label(x,y,t,z,anchor=anchor,fill='#202020')
def first(x,y,t,z=26):lab(x-F.advance(t[0],z)/2,y,t,z,anchor='start')
def last(x,y,t,z=26):lab(x+F.advance(t[-1],z)/2,y,t,z,anchor='end')
def italic(x,y,t,z=30):
 global b
 b+=f'<g transform="translate({x} {y}) skewX(-10)">'+F.label(0,0,t,z,anchor='middle',fill='#202020')+'</g>'
# Ba mạch đọc riêng; giữ đoạn đầu dưới thẳng đứng và mép cắt gốc.
for key in ['topChain','bottomChain']:line(g[key]['orderedVerticesFromCO'],1.25)
line([[56,22],[55.5,25],[55.5,40]],1.25)
# Cổ carbonyl giữa có chỗ nối cong ngắn theo ảnh, không áp V đối xứng.
path('M115 102 L127.5 95 Q130 92.5 132.5 95 L155 108',w=1.25)
line(g['middleChain']['orderedVerticesFromCO'][1:],1.25)
for key in ['topChain','middleChain','bottomChain']:
 for v in g[key]['carbonyl']['rays']:line(v,1.25)
line([[47,141],[31,151]],1.25)
for key in ['OtopToC','C1C2','C2C3','C2ToMidO','C3ToBottomO']:line(g['glycerol'][key],1.25)
for x,y in [(31.5,16),(56,59),(130.5,73),(106,117),(7.2,145),(56,145)]:lab(x,y,'O',18)
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="551" height="194" viewBox="0 0 551 194"><title>Công thức theo nguồn482</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='triester482-native-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
r=dict(i=482,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='57C6O=3glycerol+18-18-18acyl/0CCdouble3COdouble/3CO2splitraysCONTACTnativearms-topandbottomdiag+vertical-middle2slopesSHORTroundedjunction/6OregularUPRIGHT-ALLthinblack/3bareglycerolC-NOH2C-HC/eachnonperiodicchainvertices/BOTTOMFIRSTCCVERTICAL31-151to31-179/nativeBOTTOMcrop193KEEP/0H-stereo-arrows-caption/NOaddedX-formula-answer-alias1342490801460591996')
(K/'cau-truc-triester482-native-ddh-lo-398-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
