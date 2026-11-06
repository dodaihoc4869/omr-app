"""Nguồn425: hai Haworth đánh số, nhánh C6 bare và nhãn OH có dấu (1)."""
from pathlib import Path
import importlib.util,json,hashlib,math
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='4c3ed15d4b87187b59361af3f10f576e40be5af690109cc838688f14777eee27';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[v for v in q['hinh']if v['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
def line(d,w=1.8,c='#252440'):return f'<path d="{d}" fill="none" stroke="{c}" stroke-width="{w}" stroke-linejoin="round"/>'
def first(x,y,t,z=23):return F.label(x-F.advance(t[0],z)/2,y,t,z,'start',fill='#858585')
def taper(p,q):
 dx=q[0]-p[0];dy=q[1]-p[1];n=math.hypot(dx,dy);ux=-dy/n;uy=dx/n
 pts=[(p[0]+ux*.8,p[1]+uy*.8),(q[0]+ux*3.5,q[1]+uy*3.5),(q[0]-ux*3.5,q[1]-uy*3.5),(p[0]-ux*.8,p[1]-uy*.8)]
 return '<path d="M'+'L'.join(f'{a:.3f} {b:.3f}'for a,b in pts)+'Z" fill="#252440"/>'
b=''
for sh in [0,240]:
 b+='<g transform="translate('+str(sh)+' 0)">'
 b+=line('M80 164L128 130H191M213 137L251 164M128 200V168M202 200V231')
 b+=line('M128 130V100',1.8,'#858585' if sh==0 else '#252440')
 if sh==0:b+=line('M80 164V198')
 b+=line('M128 100L159 82',1.8,'#858585')
 b+=taper((80,164),(128,200))+taper((251,164),(202,200))+line('M128 200H202',7)
 b+=F.label(207,134,'O',23,fill='#858585')
 for x,y in [(171,81),(128,164),(202,251)]:b+=first(x,y,'OH')
 for x,y,t in [(119,100,'6'),(119,130,'5'),(75,161,'4'),(131,219,'3'),(194,219,'2'),(250,188,'1')]:b+=F.label(x,y,t,18)
 b+='</g>'
b+=first(80,219,'OH')+F.label(286,206,'O',23,fill='#858585')
b+=line('M251 164L276 192M296 192L320 164',1.8,'#858585')
# Liên kết lượn sóng được soát theo ảnh nguồn, không quyết định cấu hình sản phẩm.
b+=line('M491 164C493 163 493 160 495.5 160C498 160 497.5 165 500 165C502 165 501.5 160 503.5 160C506 160 505.5 165 508 165C510 165 509.5 160 511.5 160C514 160 513.5 165 516 165C518 165 518.5 160 520.5 160C523 160 522.5 164 525 164',1.5,'#858585')
b+=first(535,168,'OH')+F.label(571,155,'(1)',12,fill='#858585')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="640" height="287" viewBox="0 0 640 287"><title>Hai vòng đường theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='disaccharide-wave-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=425,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='2Haworth12nums/8OH2ringO1bridge/4TAPER2bold/2C6barebentOH/RIGHTC1wavy-OHsup(1)/noH-CH2-caption/DDHpath.')
(K/'cau-truc-disaccharide-wave-ddh-lo-228-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
