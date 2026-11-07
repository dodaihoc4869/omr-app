"""Nguồn490: ba mạch acyl theo từng đỉnh nguồn, không suy từ câu hỏi hydrogen hóa."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='5ae2bfb1fedcbf84c9e5d8f39257bdfafd6c41f009ae3831fda942162e21d8ef';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[v for v in q['hinh']if v['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
def line(d,w=2):return f'<path d="{d}" fill="none" stroke="#252440" stroke-width="{w}" stroke-linejoin="round"/>'
def first(x,y,t,z=25):return F.label(x-F.advance(t[0],z)/2,y,t,z,'start')
b=line('M75 142V171M75 201V230M116 127H137M107 184H135M116 244H135M164 120L190 105M163 177L190 162M163 237L190 223')
b+=line('M187 78V105M194 78V105M187 141V162M194 141V162M185 200V223M192 200V223')
for x,y,t in [(75,136,'CH₂'),(75,194,'CH'),(75,254,'CH₂')]:b+=first(x,y,t)
for x,y in [(150,136),(150,194),(150,254),(191,71),(190,134),(190,192)]:b+=F.label(x,y,'O',25)
chains=[[(190,105),(231,127),(271,105),(311,127),(350,105),(390,127),(430,105),(470,127),(510,105),(550,127),(590,105),(630,127),(670,105),(710,127),(750,105),(789,127)],[(190,162),(229,183),(269,162),(309,183),(349,162),(389,183),(429,162),(469,183),(509,160),(554,160),(594,183),(634,162),(674,183),(714,162),(754,183),(794,162),(834,183),(874,162)],[(190,223),(230,245),(270,223),(310,245),(350,223),(390,245),(430,223),(470,245),(510,222),(556,222),(596,245),(636,222),(682,222),(722,245),(762,222),(808,222),(848,245),(888,223)]]
for pts in chains:b+=line('M'+'L'.join(f'{x} {y}'for x,y in pts))
b+=line('M515 168H548M515 230H548M642 230H674M768 230H800')+F.label(433,287,'(X)',30)
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="942" height="340" viewBox="0 0 942 340"><title>Ba nhánh chất béo theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='chat-beo-ba-nhanh-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=490,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='55C=3glycerol+16/18/18acyl/6O/3COdouble4CCdouble/top0middle1bottom3CCdouble/CH2-CH-CH2-Oliteral/3freeends/(X)caption/noaddedHconditions-answer/DDHpath.')
(K/'cau-truc-chat-beo-ba-nhanh-ddh-lo-236-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
