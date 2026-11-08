"""Hai nguồn499/327: giữ mọi H và ngoặc vuông chỉ bao hai carbon giữa."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text())
def line(d):return f'<path d="{d}" fill="none" stroke="#252440" stroke-width="1.8"/>'
def ch2(xs,cy,hy1,hy2,by1,by2,by3,by4):
 b=''
 for x in xs:b+=F.label(x,cy,'C',28)+F.label(x,hy1,'H',28)+F.label(x,hy2,'H',28)+line(f'M{x} {by1}V{by2} M{x} {by3}V{by4}')
 return b
def dot(x,y,r=5):return f'<circle cx="{x}" cy="{y}" r="{r}" fill="#252440"/>'
b=ch2([71,121,197,246],85,35,138,38,60,88,111)+ch2([455,505,560,622],82,31,135,34,57,86,108)
b+=line('M29 74H56 M83 74H107 M211 70H232 M211 77H232 M343 75H379 M371 68L379 75L371 82 M414 72H441 M469 72H491 M523 72H547 M573 72H608 M490 7H480V137H490 M577 7H588V137H577')
for x,y,t,z in [(8,85,'R',28),(393,85,'R',28),(591,147,'n',23)]:b+=F.label(x,y,t,z,'start')
b+=F.label(164,85,'+',28)+F.label(274,85,'+',28)+dot(143,74)+dot(639,71)
for x in [299,307,315]:b+=dot(x,80,1.8)
a=b
b=ch2([70,119,174,234],89,39,137,43,64,94,112)+ch2([477,526,581,641],85,35,133,39,60,90,108)
b+=line('M29 79H56 M84 79H105 M136 79H160 M189 79H220 M349 78H388 M380 71L388 78L380 85 M437 75H464 M491 75H512 M543 75H567 M596 75H627 M655 75H679 M104 15H94V142H104 M190 15H201V142H190 M511 11H501V138H511 M597 11H608V138H597')
for x,y,t,z in [(8,89,'R',28),(300,88,'R',28),(415,86,'R',28),(681,85,'R',28),(204,153,'n',23),(611,149,'n',23)]:b+=F.label(x,y,t,z,'start')
b+=F.label(280,88,'+',28)+dot(251,76)+dot(327,76)
rows=[]
for i,h,w,hh,body,note in [(499,'5bf187daeae23673aae96b1952c0f3067d7047bda3eac5901de84def65020e76',652,153,a,'8C16explicitH/2R2radicaldots/2plus3ellipsisperiods/1CCdouble/1RIGHTopenV/1squarepairONLYmiddle2C+nsub/noaddedheading-condition-answer'),(327,'38b3dacf803d65628186d81d3a7357bb9f19d510c67edcfc8505918c9b168f4e',706,158,b,'8C16explicitH/4R2radicaldotsONLYreactants/1plus0CCdouble/1RIGHTopenV/2squarepairsONLYmiddle2C+2nsub/NOproductdot/noaddedheading-condition-answer')]:
 qs=[]
 for q in iv['questions']:
  refs=[r for r in q['hinh']if r['hash']==h]
  if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
 raw=(f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{hh}" viewBox="0 0 {w} {hh}"><title>Giai đoạn polymer theo nguồn{i}</title>'+body+'</svg>').encode();sha=hashlib.sha256(raw).hexdigest();fn=f'pe-giai-doan-{i}-ddh-{sha}.svg';(K/fn).write_bytes(raw)
 rows.append(dict(i=i,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=sha,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung=note));print(i,sha)
(K/'cau-truc-pe-hai-giai-doan-ddh-lo-280-ban-dung.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n')
