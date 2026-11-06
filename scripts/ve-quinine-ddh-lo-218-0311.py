"""Nguồn213: cấu trúc và ba vạch lập thể của nguồn quinine."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='23b5701061e2a0da406fb65129240b2fa36ddadada39471f5c4efb2392310c45';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[v for v in q['hinh']if v['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
def path(d):return f'<path d="{d}" fill="none" stroke="#252440" stroke-width="1.8" stroke-linecap="round"/>'
b=path('M81 115L117 135V178L152 198V240L116 261L97 250M81 224V198L45 178V136L81 115M81 198L117 178M152 198L189 178V137L209 101L221 97M236 94L249 90L289 100L269 137L244 131M189 137L215 130M229 112V88L249 48L211 38L181 66M249 48V90M81 90V113')
b+=path('M81 124L108 140M53 142V171M90 198L112 186M144 205V233M98 242L114 251M188 73L213 47')
# Chỉ ba vạch đứt ở nhánh OH như nguồn, ngắn gần carbon và dài dần về O.
b+=path('M197 181L196 185M205 184L202 190M212 187L208 195')
b+=F.label(81-F.advance('O',22)/2,85,'OMe',22,'start')+F.label(81,251,'N',23)+F.label(229,137,'N',23)+F.label(214,211,'OH',23,'start')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="328" height="301" viewBox="0 0 328 301"><title>Cấu tạo quinine theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='quinine-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=213,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='OMe/2N/OH/quinoline5double+vinyl1double/3hashedbarsOH/cagecrossinggap/noHchargescaptionadded/DDHpath.')
(K/'cau-truc-quinine-ddh-lo-218-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
