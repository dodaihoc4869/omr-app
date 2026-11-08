"""Nguồn885: năm nút xám và bốn liên kết; không thêm điện tích từ câu dẫn."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='a17654e391b9512883e0aac69b29476dadc94618ebb1cf5e198d7c943bd8828f';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
b='<path d="M155 88V131 M84 159H127 M183 159H225 M155 187V228" fill="none" stroke="#333333" stroke-width="1.6"/>'
for x,y,r in [(155,159,28),(155,62,26),(58,159,26),(251,159,26),(155,254,26)]:
 b+=f'<circle cx="{x}" cy="{y}" r="{r}" fill="#d0d0d0" stroke="#888888" stroke-width="1.5"/>'
 b+=F.label(x,y+(11 if r==28 else 8),'Pt'if r==28 else'NH₃',30 if r==28 else 24,weight='dam')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="307" height="310" viewBox="0 0 307 310"><title>Mô hình phức platinum theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='pt-bon-ammine-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=885,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='5flatgraycircles/1Pt4NH3allactualdam/4cardinalordinarySINGLEthinuniform/1Pt4N12H/noaddedcharge2plus-brackets-wedge-hash-arrows-caption-answer.')
(K/'cau-truc-pt-bon-ammine-ddh-lo-277-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(fn)
