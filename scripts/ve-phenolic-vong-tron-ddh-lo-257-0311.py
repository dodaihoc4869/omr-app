"""Nguồn722: đơn vị polymer với vòng thơm tròn, giữ đúng kiểu biểu diễn nguồn."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='ff99f5fc3539a5e99c7468bd2201595c9434bf831d4748c00b2a2dd706afff07'
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[v for v in q['hinh']if v['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
b='<path d="M111 113L143 95L175 113V151L143 169L111 151Z M44 113H111 M175 113H221 M280 113H344 M143 95V75 M94 59C72 91 71 136 93 175 M296 61C316 93 319 140 295 179" fill="none" stroke="#252440" stroke-width="2" stroke-linejoin="round"/>'
b+='<circle cx="143" cy="132" r="25" fill="none" stroke="#252440" stroke-width="2"/>'
b+=F.label(143+F.advance('H',27)/2,69,'OH',27)+F.label(224,123,'CH₂',27,'start')+F.label(322,166,'n',25)
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="387" height="222" viewBox="0 0 387 222"><title>Đơn vị polymer theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='phenolic-vong-tron-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=722,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='6Chexagon1innercircleNOthreeDouble/OHtopOanchor/CH2right/3horizontalstubs/1roundpair+nsub/noaddedanswer-caption.')
(K/'cau-truc-phenolic-vong-tron-ddh-lo-257-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(fn)
