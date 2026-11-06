"""Nguồn217: sơ đồ lớp điện phân và nhãn nguyên văn."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='25b4bf0cdf73e8d22fb8d532fc3296f61acaf77ddc397c0d36748e1030e18ee5';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[v for v in q['hinh']if v['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
def path(d,w=2,fill='none'):return f'<path d="{d}" fill="{fill}" stroke="#252440" stroke-width="{w}" stroke-linejoin="round"/>'
def label(x,y,t,z=28,a='middle'):return F.label(x,y,t,z,a)
def shape(d,fill,stroke='#252440',w=1):return f'<path d="{d}" fill="{fill}" stroke="{stroke}" stroke-width="{w}"/>'
b=shape('M233 72L260 72L277 137L441 140L455 78L477 78L477 190L233 186Z','#666666','#666666')
b+=shape('M241 72H255L268 151L442 154L455 78H470V182L241 178Z','#292929','#292929')
b+=shape('M262 81L453 85L441 140L276 137Z','#b1b1b1','#888888')
b+=shape('M276 137L441 140L440 151L278 148Z','#ffffff','#ffffff')
# Ống trắng hai vách, miệng trái mở; phần dưới nằm trong lớp nóng chảy.
b+=shape('M225 61L262 61L278 137L273 138L258 66H225Z','#ffffff','#888888',1.4)
b+=shape('M233 37L416 40V77H410V46L233 44Z','#292929','#292929')
for x,y in [(284,70),(323,71),(362,72),(401,73)]:
 b+=shape(f'M{x+9} 43H{x+15}V{y}H{x+9}Z','#292929','#292929')+shape(f'M{x} {y}H{x+25}V{y+43}H{x}Z','#292929','#292929')
b+=path('M210 16V40H232M461 20V77',1.4)
for x,y,t in [(210,9,'+'),(461,13,'−')]:
 b+=f'<circle cx="{x}" cy="{y}" r="7.5" fill="#292929"/>'+F.label(x,y+4,t,13,fill='#ffffff')
b+=path('M297 24V69M229 119H246M218 183H239M436 100L498 103M426 147L498 150',1.1)
b+=label(296,22,'Graphite',15)+label(159,124,'Graphite',15,'start')+label(50,188,'Bể điện phân bằng thép',14,'start')
b+=label(503,109,'Alumina +',15,'start')+label(503,129,'criolite nóng chảy',15,'start')+label(503,160,'Nhôm nóng chảy',15,'start')
b+=F.label(174,219,'Hình 15.1.',15,'start',weight='dam')+label(253,219,'Mô hình quy trình Hall – Héroult',15,'start')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="679" height="252" viewBox="0 0 679 252"><title>Mô hình quy trình Hall – Héroult theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='hall-heroult-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=217,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='4anodes/plusleft-minusright/steelshell-graphitelining-graymelt-whitelowerlayer/2wallpipe/alllabels-criolite-captionliteral/DDHpath;grayprinttexturekhôngparticlecount.')
(K/'cau-truc-hall-heroult-ddh-lo-217-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
