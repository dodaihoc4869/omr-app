"""Nguồn180: mạch acid theo đúng các đỉnh và hai liên kết đôi nguồn."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='1f3d2ced408fd27b2226c07a3d612f18bd099af3b46b303179a5a7ff3aea6686';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[v for v in q['hinh']if v['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
def path(d,w=2,fill='none'):return f'<path d="{d}" fill="{fill}" stroke="#252440" stroke-width="{w}" stroke-linejoin="round"/>'
def label(x,y,t,z=28,a='middle'):return F.label(x,y,t,z,a)
b=path('M47 93L92 47L137 93L183 47L230 93L275 47H339L386 93L432 47H497L543 93L589 47L635 93L680 47L727 93L773 47L819 93L846 65',3)
b+=path('M279 56H335M436 56H493',3)+label(850,64,'COOH',24,'start')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="945" height="129" viewBox="0 0 945 129"><title>Cấu tạo acid theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='linoleic-acid-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=180,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='17Cimplicit+COOH/2horizontalC=C/zigzagliteral/noadditionalH-labels-caption/DDHpath.')
(K/'cau-truc-linoleic-acid-ddh-lo-216-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
