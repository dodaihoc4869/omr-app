"""Chuẩn bị liên kết nguồn247; chỉ được nhập sau soát độc lập riêng từng nguồn."""
from pathlib import Path
import json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());h='2a6dd33363b6da7ccf40ce8cd767568a80e6667cf08a227ea8e65c045dd14393';base=json.loads((K/'cau-truc-doi-chieu-polysaccharide-ddh-lo-197-ban-dung.json').read_text())[0];qs=[]
for q in iv['questions']:
 refs=[v for v in q['hinh']if v['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
b=(K/base['svg']).read_bytes();assert hashlib.sha256(b).hexdigest()==base['hashSvg']
r=dict(i=247,hash=h,fileNguon='anh/'+h+'.png',svg=base['svg'],hashSvg=base['hashSvg'],byteSvg=len(b),font=base['font'],hashPhong=base['hashPhong'],trangThai='cho-soat-doc-lap',questions=qs,geometryBaseSource=47,canvasNguon='Hai bản scan có tỷ lệ khác nhau, không pixel identical; kiểm riêng toàn nội dung trước dùng chung.',ghiChuDung='2panels/6Haworth/30H/6CH2OH/allOH/3nhóm3dots+1nhóm2dotsTRÁIcellulose/2captions/frontdiagonalsUNIFORM/horizontalbold/DDHpath;khôngpHashapprove.')
(K/'cau-truc-polymer-dung-chung-ddh-lo-218-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
