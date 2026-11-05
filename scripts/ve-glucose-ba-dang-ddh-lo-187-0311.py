"""Nguồn1402: ba dạng glucose, không thay bằng biến thể có H explicit."""
from pathlib import Path
import importlib.util,json,hashlib,math
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='fc5001e1b004158336c360edfbc6b82319d4ab9b1df302469a0ada0e26e5df98';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[v for v in q['hinh']if v['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
def line(d,w=1.4):return f'<path d="{d}" fill="none" stroke="#252440" stroke-width="{w}" stroke-linejoin="round"/>'
def first(x,y,t,size=18):return F.label(x-F.advance(t[0],size)/2,y,t,size,'start')
def wedge(p,q):
 x,y=p;u,v=q;ll=math.hypot(u-x,v-y);nx=-(v-y)/ll;ny=(u-x)/ll;return '<path d="M'+f'{x} {y}L{u+nx*4} {v+ny*4}L{u-nx*4} {v-ny*4}Z" fill="#252440"/>'
b='<g transform="translate(12 12)">'
for dx,beta in [(0,False),(362,True)]:
 b+=f'<g transform="translate({dx} 0)">'+line('M26 92L64 62H116M130 67L162 92')+F.label(123,66,'O',18)+wedge((26,92),(64,120))+line('M64 120H122',4.2)+wedge((162,92),(122,120))
 b+=line('M64 62V38L80 28M26 92V114M64 120V96M122 120V140')+first(88,28,'OH')+first(26,127,'OH')+first(64,89,'OH')+first(122,154,'OH')
 if beta:b+=line('M162 92V67')+first(162,62,'OH')+F.label(167,105,'1',10)
 else:b+=line('M162 92V114')+first(162,125,'OH')+F.label(162,84,'1',10)
 for x,y,t in [(113,134,'2'),(64,134,'3'),(20,90,'4'),(57,61,'5'),(59,35,'6')]:b+=F.label(x,y,t,10)
 b+=F.label(86,176,'β-glucose'if beta else'α-glucose',18)+'</g>'
b+=line('M275 26V160L289 169M275 26L291 17M275 22L289 13M275 51H295M251 77H275M275 103H295M275 129H295')+F.label(298,16,'O',18)+first(296,176,'OH')+first(302,56,'OH')+F.label(251,82,'HO',18,'end')+first(302,108,'OH')+first(302,134,'OH')
for x,y,t in [(267,29,'1'),(267,55,'2'),(267,89,'3'),(267,112,'4'),(267,136,'5'),(267,160,'6')]:b+=F.label(x,y,t,10)
for x1,x2 in [(190,219),(334,363)]:b+=line(f'M{x1} 90H{x2}m-5 -2l5 2M{x2} 94H{x1}m5 2l-5 -2',.9)
b+='</g>';raw=('<svg xmlns="http://www.w3.org/2000/svg" width="585" height="215" viewBox="0 0 585 215"><title>Ba dạng glucose theo nguồn1402</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='glucose-ba-dang-1402-ddh-'+hh+'.svg';(K/fn).write_bytes(raw);r=dict(i=1402,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='3formsα/open/β/18numbers/allOH-HO/terminalimplicitC/0Hexplicit/0CH2OH-CHOtext/4taperfront+2horizontalbold/2⇌/2captions/DDHpath.');(K/'cau-truc-glucose-ba-dang-ddh-lo-187-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
