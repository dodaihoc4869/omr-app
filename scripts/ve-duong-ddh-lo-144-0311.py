"""C6 khai triển không được gộp thành CH2OH; mẫu dùng lại phải soát từng nguồn."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];M=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
s=importlib.util.spec_from_file_location('haworth',G/'scripts/haworth-ddh-0311.py');H=importlib.util.module_from_spec(s);s.loader.exec_module(H)
a=json.loads((M/'doc-chi-tiet-con-lai-lo-144.json').read_text());rows=[]
def line(p,q,w=1.6):return f'<path d="M{p[0]} {p[1]}L{q[0]} {q[1]}" fill="none" stroke="#252440" stroke-width="{w}" stroke-linecap="round"/>'
for r in a:
 if r['i']not in[1210,1266]:continue
 if r['i']==1266:
  fn='nhan-lien-ket-ddh-69575d0a9f7d3a6d691d0fb500bc2d9e185edc1f816a8d434d3a34ffdc61ebfe.svg';raw=(M/fn).read_bytes();hh=hashlib.sha256(raw).hexdigest()
 else:
  g=r['geometry'];v=g['ringVertices'];b='<g transform="translate(30 30) scale(3)">'
  b+=line(v['C5'],(216,104))+line((244,110),v['C1'])+line(v['C4'],v['C5'])+F.label(230,111,'O',22)
  b+=H.wedge(v['C4'],v['C3'],1.5,4)+line(v['C3'],v['C2'],4)+H.wedge(v['C2'],v['C1'],4,1.5)
  for ps in g['substituentBonds'].values():b+=line(*ps)
  for x,y in[(297,186),(229,218),(131,139),(69,182)]:b+=F.label(x-F.advance('O',22)/2,y,'OH',22,'start')
  b+=F.label(168,67,'OH',22,'start')
  for t,(x,y)in g['carbonNumbers'].items():b+=F.label(x,y+5,t,16)
  b+='</g>';raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="840" viewBox="0 0 1200 840"><title>Vòng glucose với carbon 6 khai triển</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='glucose-c6-ddh-'+hh+'.svg';(M/fn).write_bytes(raw)
 rows.append(dict(r,svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',ghiChuDung='1210C6nodeẩn+số6/nhánhchéoOH,KHÔNGalias1036CH2OHtext;C1OHdown/5OH/3frontbold/6sốC/0Hexplicit.1266candidatebase880cùngH/CH2OH/arrowmapping,phảisoátriêngsource/base/render/hash.'))
(M/'cau-truc-duong-ddh-lo-144-ban-dung.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
