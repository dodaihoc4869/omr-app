"""Chuẩn bị nguồn273 dùng chung sau kiểm độc lập riêng với nguồn48."""
from pathlib import Path
import json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());h='2e6696b5e058d4b7c82eb649a9415b526d32f6ed5f09f143a63d0bcd3b4ef68f';fn='disaccharide-cheo-ddh-3447d0e44a9d02c1da2ba293aed2745926f26da18ffb9340f19d668f648f4d16.svg';b=(K/fn).read_bytes();hh=hashlib.sha256(b).hexdigest();assert hh=='3447d0e44a9d02c1da2ba293aed2745926f26da18ffb9340f19d668f648f4d16'
base=json.loads((K/'cau-truc-disaccharide-cheo-ddh-lo-198-ban-dung.json').read_text())[0];qs=[]
for q in iv['questions']:
 refs=[v for v in q['hinh']if v['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
r=dict(i=273,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(b),font='DDH Rounded',hashPhong=base['hashPhong'],trangThai='cho-soat-doc-lap',questions=qs,geometryBaseSource=48,canvasNguon='Hai bản quét có tỷ lệ/bố cục lề khác, không pixel identical; kiểm riêng toàn nội dung.',ghiChuDung='2sixringschéo/12C11O/6OH2CH2OH/2ringO+verticalbridgeO/4TAPER2horizontalbold/lowerC4OH-UP/upperC1OH-UP/0Hnums-captionadded/DDHpath;khôngpHashapprove.')
(K/'cau-truc-disaccharide-dung-chung-ddh-lo-221-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
