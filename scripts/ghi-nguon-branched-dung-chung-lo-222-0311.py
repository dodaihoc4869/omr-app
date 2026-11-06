"""Nguồn275: liên kết dùng chung chỉ sau soát độc lập với bản225."""
from pathlib import Path
import json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());h='2eac7fa27ff347ba01a32772fcc838cd9ed170df1f0441313aea96b85d7ef866';base=json.loads((K/'cau-truc-polysaccharide-phan-nhanh-ddh-lo-219-ban-dung.json').read_text())[0];b=(K/base['svg']).read_bytes();assert hashlib.sha256(b).hexdigest()==base['hashSvg'];qs=[]
for q in iv['questions']:
 refs=[v for v in q['hinh']if v['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
r=dict(i=275,hash=h,fileNguon='anh/'+h+'.png',svg=base['svg'],hashSvg=base['hashSvg'],byteSvg=len(b),font='DDH Rounded',hashPhong=base['hashPhong'],trangThai='cho-soat-doc-lap',questions=qs,geometryBaseSource=225,canvasNguon='Hai bản quét khác tỷ lệ, không pixel identical; kiểm riêng mọi nét trước dùng chung.',ghiChuDung='6rings30H15OH/5CH2OH+1CH2/5externalO/branchlowerMIDDLEC6/2bracketsTOPmBOTTOMn/uniformdiags6bold/endOH/noX-captionadded/DDHpath;khôngphashapprove.')
(K/'cau-truc-branched-dung-chung-ddh-lo-222-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
