"""Vẽ nguyên phương án nguồn1366; không sửa cấu trúc theo tên chất trong câu dẫn."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
p=json.loads((K/'doc-open1366-lo-381.json').read_text());g=p['geometry'];h=p['hash'];b=''
def line(v,w=1.2):
 global b
 b+='<path d="M'+'L'.join(f'{x} {y}'for x,y in v)+f'" fill="none" stroke="#202020" stroke-width="{w}" stroke-linecap="butt"/>'
def label(x,y,t,z=22,anchor='middle'):
 global b
 b+=F.label(x,y,t,z,anchor=anchor,fill='#202020')
def oh(x,y):label(x-F.advance('O',22)/2,y,'OH',anchor='start')
def ch2oh(x,y):
 x-=F.advance('C',22)/2
 for t,z,dy in [('CH',22,0),('2',15.4,4),('OH',22,0)]:
  label(x,y+dy,t,z,'start');x+=F.advance(t,z)
for key in ['leftRing','rightOpenChain']:
 r=g[key]
 for v in r.get('thinBonds',[r.get('thinBond')]):line(v)
 line(r['CH2OH']['bond'])
 for q in r['freeOH']:line(q['bond'])
 line(r['boldFront'],6)
 for v in r['frontTapers']:b+='<path d="M'+'L'.join(f'{x} {y}'for x,y in v)+'Z" fill="#202020"/>'
for v in g['bridgeO']['bonds']:line(v)
label(150.5,75,'O');label(235,135,'O')
for x in [76,327]:ch2oh(x,36)
for x,y in [(19,72),(69,180),(153,180),(320,180),(404,101)]:oh(x,y)
label(371,75,'OH',anchor='start')
label(452,108,'CH=O',anchor='start')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="527" height="191" viewBox="0 0 527 191"><title>Phương án cấu trúc theo nguồn1366</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='open1366-native-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
r=dict(i=1366,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='12C11O/6freeOH+2CH2OH=8hydroxylO/LEFT1Haworth5bareC1ringO-RIGHTopen4bareC+literalCH=O-FIRSTC/1bridgeO/4TAPER2boldfront6px-VERTICALfeet/ALLregularUPRIGHT-SUB2-CH2OH-FIRSTC/OH-firstO/0arrows-captions-nums/NOtheorynormalize-PAanswer-addedH-rightRing-alias/ONLY1of4sameqidNOnewfull')
(K/'cau-truc-open1366-native-ddh-lo-381-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
