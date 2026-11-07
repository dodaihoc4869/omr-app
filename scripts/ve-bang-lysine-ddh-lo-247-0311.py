"""Nguồn594: bảng nhãn dinh dưỡng nguyên văn, không thêm dữ liệu."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='6e485397148c3ef35dd2cd8bbb29dc876eb452343f9138922daef1ac76a9e626'
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[v for v in q['hinh'] if v['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
b='<path d="M10 8H641V283H10Z" fill="none" stroke="#252440" stroke-width="4"/><path d="M29 109H631 M29 249H631" fill="none" stroke="#252440" stroke-width="3"/>'
b+=F.label(29,54,'Thành phần dinh dưỡng',34,'start',weight='dam')
b+=F.label(29,92,'Trong 1 viên nhộng',24,'start')
b+=F.label(29,158,'Hàm lượng',34,'start',weight='dam')
b+=F.label(29,196,'L-Lysine',24,'start')
b+=F.label(609,196,'500 mg',24,'end')
b+=F.label(115,230,'(gồm 637 mg L-Lysine Hydrochloride)',22,'start')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="648" height="290" viewBox="0 0 648 290"><title>Bảng dinh dưỡng theo nguồn</title>'+b+'</svg>').encode()
hh=hashlib.sha256(raw).hexdigest();fn='bang-lysine-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=594,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,hashPhongDam=F.font('dam')[1],trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='2boldheadings/4regularlabels/outerrect2horizontalrules/allliteralL-Lysine500mg637mgL-LysineHydrochloride/Trong1viênnhộng/noaddedcaption-data-answer/DDHpath.')
(K/'cau-truc-bang-lysine-ddh-lo-247-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
