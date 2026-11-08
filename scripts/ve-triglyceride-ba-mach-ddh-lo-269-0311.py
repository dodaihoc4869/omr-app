"""Nguồn801: ba mạch18C, giữ0/1/3liênkếtđôi và thứtựnhãn nguồn."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='95277f92029c88b0a7822528b9ba4cf578be50a5c93fcd337a6132040840f80a';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
def line(d):return f'<path d="{d}" fill="none" stroke="#252440" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
rows=[[(159,60),(206,88),(253,60),(301,88),(349,60),(397,88),(445,60),(492,88),(540,60),(587,88),(635,60),(683,88),(731,60),(779,88),(826,60),(873,88),(921,60),(968,88)],[(159,141),(206,170),(254,141),(301,170),(349,141),(397,170),(445,141),(492,170),(540,141),(589,141),(637,170),(684,141),(731,170),(779,141),(826,170),(873,141),(921,170),(968,141)],[(159,223),(207,251),(254,223),(301,251),(349,223),(397,251),(445,223),(492,251),(540,223),(590,223),(638,251),(687,223),(735,223),(785,251),(833,223),(880,223),(930,251),(977,223)]]
b='<g transform="translate(20 20)">'
for pts in rows:b+=line('M'+'L'.join(f'{x} {y}'for x,y in pts))
for d in ['M543 150H586','M543 232H587','M690 232H732','M837 232H877','M70 88H93 M124 80L159 60 M154 63V34 M162 62V34','M70 170H93 M124 162L159 141 M154 144V116 M162 143V116','M70 251H93 M124 244L159 223 M154 226V197 M162 225V197','M54 108V152 M54 190V235']:b+=line(d)
for y,text in [(101,'H₂C'),(183,'HC'),(264,'H₂C')]:b+=F.label(65,y,text,32,'end')
for y in [101,183,264]:b+=F.label(110,y,'O',32)
for y in [28,110,192]:b+=F.label(159,y,'O',32)
for x,y,text in [(981,79,'(1)'),(981,161,'(2)'),(981,244,'(3)')]:b+=F.label(x,y,text,32,'start')
b+='</g>';raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1064" height="313" viewBox="0 0 1064 313"><title>Triglyceride ba mạch theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='triglyceride-ba-mach-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=801,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='3acyl18Ceach+3glycerolC=57C6O/0-1-3CCdouble/3COdouble/3esterO/2glycerolCC/freeRIGHTends/literalH2C-HC-H2C-3labels1..3/noaddedH-alkenenums-stereo-arrow-caption-answer.')
(K/'cau-truc-triglyceride-ba-mach-ddh-lo-269-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(fn)
