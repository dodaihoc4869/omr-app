"""Nguồn401: bảng amine không khung, giữ hướng cấu trúc và từng dòng chữ."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='46baafa20f0b39e1d27f51e90547a33c835ea038991faa819b300348e2c928b5';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[v for v in q['hinh']if v['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
def line(d,w=1.1):return f'<path d="{d}" fill="none" stroke="#252440" stroke-width="{w}" stroke-linejoin="round"/>'
def last(x,y,t,z=18):return F.label(x+F.advance(t[-1],z)/2,y,t,z,'end')
b=F.label(118,26,'Cột (A)',18,weight='dam')+F.label(397,26,'Cột (B)',18,weight='dam')
for y,t in [(69,'a) N-methylbutan-2-amine; amine bậc hai'),(125,'b) butan-1-amine; amine bậc một'),(177,'c) benzenamine; amine bậc một')]:b+=F.label(242,y,t,15.3,'start')
b+=line('M112 58H129L140 38H163L174 58L163 78H140L129 58M135 55L144 42M160 42L169 58M144 74H160')+last(104,65,'H₂N')
b+=line('M103 106L115 99L134 110L154 99L173 110')+last(95,118,'H₂N')
b+=line('M75 147L92 157M108 157L127 147L147 158L167 147M127 147V126M100 171V179')+F.label(100,168,'N',18)+F.label(100,194,'H',18)
for y,t in [(68,'(1)'),(124,'(2)'),(177,'(3)')]:b+=F.label(19,y,t,18)
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="568" height="204" viewBox="0 0 568 204"><title>Ghép cấu tạo và tên amine theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='bang-amine-khong-khung-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=401,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='3structures/Ph3DOUBLE/H2N-N-Hliteral/2headersdam/3numberlabelsnormal/a)bậchai-b)c)bậcmột/allhyphens-semicolon/noGRID-noaddedCH3labels-answer/DDHpath.')
(K/'cau-truc-bang-amine-khong-khung-ddh-lo-227-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
