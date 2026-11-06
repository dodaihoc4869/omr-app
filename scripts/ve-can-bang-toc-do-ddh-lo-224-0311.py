"""Nguồn322: giữ dữ liệu đồ thị; dòng mô tả bị cắt ngoài hình có bằng chứng riêng."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='376fe26a3db26928e1fa6a8549aa75382a580da670ab290bfd50a8aa48917197';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[v for v in q['hinh']if v['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
def line(d,w=2.8,fill='none'):return f'<path d="{d}" fill="{fill}" stroke="#252440" stroke-width="{w}" stroke-linejoin="round"/>'
b=line('M64 373V38M64 373H568',2.5)
b+=line('M58 54L64 37L70 54L64 50Z',.7,'#252440')+line('M550 367L568 373L550 379L554 373Z',.7,'#252440')
# Đường tâm lấy từ nét nguồn; không thêm đơn vị/tick/số tại gốc.
b+=line('M65 72C68 75.6 71 77.7 75 83C135.333 162.998 195.667 197.924 256 221M65 372C128.667 282.345 192.333 241.571 256 221H505')
b+=F.label(168,143,'(a)',36,fill='#707070')+F.label(176,318,'(b)',36,fill='#707070')
b+='<g transform="translate(47 203) rotate(-90)">'+F.label(0,0,'Tốc độ phản ứng',20)+'</g>'+F.label(318,398,'Thời gian',20)+F.label(506,212,'Trạng thái cân bằng',20,'end')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="605" height="433" viewBox="0 0 605 433"><title>Đồ thị tốc độ phản ứng theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='can-bang-toc-do-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=322,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='2axesheads/no0tick-units/2curves(a)(b)join256221→sharedplateau505221/3textlabels/DDHpath;croppeditalicbottomdescriptionnondatađượcloạisauđọcall2publicrefs-stems/khôngphụchồiphầncắt.')
(K/'cau-truc-can-bang-toc-do-ddh-lo-224-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
