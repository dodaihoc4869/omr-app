"""Nguồn189: đoạn mạch sáu carbon, giữ nguyên mọi H/CH3 của nguồn."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='2035e2ffe087401d81a15a1038398541e2a798a1133e8129c686088dbf9e00e0';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[v for v in q['hinh']if v['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
def path(d):return f'<path d="{d}" fill="none" stroke="#252440" stroke-width="2.3"/>'
b=''
xs=[141,232,322,412,503,594]
for j,x in enumerate(xs):
 b+=F.label(x,125,'C',32)
 # Nhánh CH3 bắt đầu từ tâm nguyên tử C đầu, không căn giữa cả cụm.
 t='H' if j%2==0 else 'CH₃'; start=x-F.advance(t[0],32)/2
 b+=F.label(start,59,t,32,'start')+F.label(x,193,'H',32)
 b+=path(f'M{x} 64V99M{x} 130V164')
for x1,x2 in [(50,123),(156,214),(247,304),(337,394),(427,485),(518,576),(609,683)]:b+=path(f'M{x1} 115H{x2}')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="734" height="226" viewBox="0 0 734 226"><title>Đoạn mạch polymer theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='polymer-sau-carbon-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=189,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='6C ngang/3H phía trên xen kẽ3CH3-Cfirst/6H phía dưới/7đoạn ngang/12liên kết dọc/không dấu ngoặc-n-chú thích thêm/DDHpath.')
(K/'cau-truc-polymer-sau-carbon-ddh-lo-216-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
