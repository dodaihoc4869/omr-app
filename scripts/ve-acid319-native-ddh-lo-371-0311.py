"""Mạch acid béo nguồn319: giữ sai khác từng đỉnh và khe chân carbonyl bản gốc."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
p=json.loads((K/'doc-acid319-lo-371.json').read_text());h=p['hash'];g=p['geometry'];b=''
def line(pair):
 (x,y),(u,v)=pair
 return f'<path d="M{x} {y}L{u} {v}" stroke="#252525" stroke-width="2" fill="none"/>'
v=g['orderedBareC'];b+='<path d="M'+'L'.join(f'{x} {y}'for x,y in v)+'" stroke="#252525" stroke-width="2" fill="none"/>'
for pair in g['innerParallelRays']+[g['HO']['bond']]+g['carbonyl']['downRays']:b+=line(pair)
z=26;left=31+F.advance('O',z)/2-F.advance('HO',z)
b+=F.label(left,25,'HO',z,anchor='start',fill='#252525')+F.label(70,106,'O',26,fill='#252525')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="740" height="113" viewBox="0 0 740 113"><title>Mạch acid béo theo nguồn319</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='acid319-native-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
r=dict(i=319,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='22bareC2O/6CCdouble1COdoubleDOWN2rays-nativeWHITEGAPbelowCvertex-NOforceCONTACT-NOcrossbar/HOlastOanchor-ALLregularUPRIGHT/OPENchainRIGHTfreeUP/nonperiodic22vertices6innerparallelraysliteral/0rings-arrows-stereo-captions/noaddedH-formula-DHAname-omegaanswer-noalias1145-1385-811-751')
(K/'cau-truc-acid319-native-ddh-lo-371-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
