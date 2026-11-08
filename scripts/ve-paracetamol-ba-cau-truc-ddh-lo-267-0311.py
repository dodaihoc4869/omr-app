"""Nguồn790/hash9331104e…: ba cấu trúc, giữ nút carbonyl tách nét và H riêng dưới N."""
from pathlib import Path
import importlib.util,json,hashlib,math
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='9331104e88af0c47d9a2cc2c54f0fa6a6b8c50a11ebec99b185687bf159f0414';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
b='<g transform="translate(18 12)">'
def line(d,w=1.8):return f'<path d="{d}" fill="none" stroke="#252440" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round"/>'
for d in ['M65 41L102 19L140 41V83L102 105L65 83Z M73 44L102 27 M132 47V78 M73 80L102 97','M348 43L385 21L423 43V85L385 107L348 85Z M356 46L385 29 M415 49V80 M356 82L385 99','M640 44L677 22L714 44V87L677 109L640 87Z M648 47L677 30 M706 50V81 M648 84L677 101']:b+=line(d)
b+=line('M140 41L162 27 M65 83L41 99 M423 43L444 29 M348 85L325 100 M640 87L617 102 M714 44L736 30 M766 31L795 44V69 M805 69V44L831 32')
b+=F.label(168,27,'NO₂',24,'start')+F.label(39,121,'HO',24,'end')+F.label(448,35,'NH₂',24,'start')+F.label(322,123,'HO',24,'end')+F.label(615,124,'HO',24,'end')
b+=F.label(750,35,'N',24)+F.label(750,63,'H',24)+F.label(835,36,'CH₃',24,'start')+F.label(800,92,'O',24)
for x0,x1,y in [(203,288,62),(495,578,63)]:
 b+=line(f'M{x0} {y}H{x1-5}',1.5)+f'<path d="M{x1-7} {y-4}L{x1} {y}L{x1-7} {y+4}Z" fill="#252440"/>'
for x,t in [(106,'p-nitrophenol'),(395,'p-aminophenol'),(746,'Paracetamol')]:
 y=176;b+=f'<g transform="translate({math.tan(math.radians(10))*y:.5f} 0) skewX(-10)">'+F.label(x,y,t,24)+'</g>'
b+='</g>';raw=('<svg xmlns="http://www.w3.org/2000/svg" width="920" height="219" viewBox="0 0 920 219"><title>Ba cấu trúc theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='paracetamol-ba-cau-truc-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=790,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='HASH9331104e riêng/3Ph9innerdoubles+1CO2verticalrays/SPLITtopjunctionnativeNOhorizontalbridge/20C6O3N/3literalHO-NO2-NH2-NoverHseparatenoNHbond-CH3/2RIGHTheads/3regularitaliccaptionscase/noaddedconditions-yield80-stereo-charges-answer.')
(K/'cau-truc-paracetamol-ba-cau-truc-ddh-lo-267-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(fn)
