"""Nguồn1021: tám carbon viết tường minh, bốn nhánh Cl, không thêm ngoặc hay n."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='b76724b3433dbf8d7138c2981c5fd9f15e339650712ad353806a3a6842926a9d';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
b='';xs=[53,130,195,273,337,414,478,557];ends=[]
for i,x in enumerate(xs):
 t='CH₂'if i%2==0 else'CH';z=28;start=x-F.advance('C',z)/2
 b+=F.label(start,62,t,z,'start');ends.append(start+F.advance(t,z))
 if i%2:
  b+=f'<path d="M{x} 66V82" stroke="#252440" stroke-width="2"/>'
  b+=F.label(x-F.advance('C',28)/2,107,'Cl',28,'start')
for i in range(7):b+=f'<path d="M{ends[i]+3} 53H{xs[i+1]-F.advance("C",28)/2-3}" stroke="#252440" stroke-width="2"/>'
b+=f'<path d="M29 53H{xs[0]-F.advance("C",28)/2-3} M{ends[-1]+3} 53H610" stroke="#252440" stroke-width="2"/>'
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="645" height="142" viewBox="0 0 645 142"><title>Đoạn mạch polymer theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='pvc-tam-carbon-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=1021,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='8explicitC/4CH2alternating4CH/4Cldownat2-4-6-8/7horizontalCC+2freeends/4verticalCCl/regularDDH/Canchors/noaddedellipsis-bracket-n-name-answer.')
(K/'cau-truc-pvc-tam-carbon-ddh-lo-286-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(fn)
