"""Nguồn556: phương trình xà phòng hóa đúng các ký hiệu in trong nguồn."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='6812fb0de36ad1e3eac463fda1b9e0b516b9ced44916a242d7e0c8948b772971'
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[v for v in q['hinh'] if v['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
def line(d):return f'<path d="{d}" fill="none" stroke="#252440" stroke-width="2"/>'
b=line('M236.532 71V98 M236.532 144V173 M1046.7 71V98 M1046.7 144V173 M540 128H605 M598 121L606 128L598 135')
for x,y,t in [(39,64,'C₁₅H₃₁COOCH₂'),(39,136,'C₁₅H₃₁COOCH'),(39,209,'C₁₅H₃₁COOCH₂'),(332,137,'+ 3NaOH'),(684,135,'3C₁₅H₃₁COONa'),(960,140,'+'),(1035,64,'CH₂OH'),(1035,136,'CHOH'),(1035,209,'CH₂OH')]:b+=F.label(x,y,t,36,'start')
b+=F.label(576,119,'t°',23)
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1192" height="253" viewBox="0 0 1192 253"><title>Phương trình phản ứng theo nguồn</title>'+b+'</svg>').encode()
hh=hashlib.sha256(raw).hexdigest();fn='xa-phong-hoa-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=556,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='Ba C15H31COOCH2/CH/CH2;hai verticalbonds+glycerolCH2OH-CHOH-CH2OH;3NaOH/3C15H31COONa/1RIGHThead/t°literal/noextra phases-caption-answer/DDHpath.')
(K/'cau-truc-xa-phong-hoa-ddh-lo-244-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
