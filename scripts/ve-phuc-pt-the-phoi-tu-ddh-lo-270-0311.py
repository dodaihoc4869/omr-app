"""Nguồn828: giữsáuhashmỗi nhánh, nêmđặc vàX/Y/Z chưađiềnsảnphẩm."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='994ff4344ca92b36d98495759c99d8aa65f045eb940b426baa790e98a451cc0e';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
def line(d,w=2):return f'<path d="{d}" fill="none" stroke="#252440" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round"/>'
b='<g transform="translate(20 20)">'
b+=line('M126 56H103V207H126 M328 56H351V207H328')
for x,y,z in [(163,88,2),(174,94,5),(183,101,7),(193,106,9),(203,111,12),(213,116,14),(254,116,14),(263,111,12),(272,106,9),(280,100,7),(289,94,4),(297,88,2)]:b+=line(f'M{x} {y-z/2:g}V{y+z/2:g}',2.2)
for d in ['M215 143L163 163V179Z','M254 143L295 162V178Z']:b+=f'<path d="{d}" fill="#666666" stroke="#252440" stroke-width="1.4" stroke-linejoin="round"/>'
b+=F.label(234,141,'Pt',32)
for x,y in [(143,95),(319,95),(143,192),(319,193)]:b+=F.label(x,y,'Cl',36)
b+=F.label(30,151,'2K',36,'start')+F.label(87,132,'+',24)+F.label(360,70,'2−',34,'start')
for x0,x1,center,top,bottom in [(424,553,489,'+4KI','−4KCl'),(624,744,684,'+NH₃','−KI'),(817,937,877,'+NH₃','−KI')]:
 b+=line(f'M{x0} 135H{x1} M{x1-13} 125L{x1} 135L{x1-13} 145',2.2)+F.label(center,126,top,26)+F.label(center,161,bottom,26)
for x,t in [(590,'X'),(783,'Y'),(971,'Z')]:b+=F.label(x,151,t,40)
b+='</g>';raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1082" height="291" viewBox="0 0 1082 291"><title>Sơ đồ biến đổi phức theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='phuc-pt-the-phoi-tu-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=828,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='2Ksup+squarePtCl4sup2minus/2TOPhashedwedges6barseachNOfullshaft/taperbroadPt/2BOTTOMsolidwedgesnarrowPt/3openVRIGHTarrowheads/+4KI−4KCl;+NH3−KI;+NH3−KI/X-Y-Zliteral/noaddedproducts-answer-temperature-phase.')
(K/'cau-truc-phuc-pt-the-phoi-tu-ddh-lo-270-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(fn)
