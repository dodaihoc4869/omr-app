"""Nguồn983: ba amine và hai cột chữ, giữ nguyên nội dung chưa ghép đáp án."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='afd1bb70ac568c5fcc6f6b98e7a95053395f3012c585c156aa66967d8e5e2f6a';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
def line(d,w=2.6):return f'<path d="{d}" fill="none" stroke="#252440" stroke-width="{w}" stroke-linejoin="round"/>'
b=line('M175 82H201L219 50H255L275 82L255 114H219L201 82 M209 81L224 57 M251 57L267 81 M223 107H251 M159 161L179 149L210 167L241 149L272 167 M113 226L141 242 M170 242L198 226L231 245L263 227 M198 226V192 M155 264V277',2.2)
for x,y,t,z,a,w in [(184,31,'Cột (A)',30,'middle','dam'),(639,31,'Cột (B)',30,'middle','dam'),(4,100,'(1)',30,'start','de'),(4,191,'(2)',30,'start','de'),(4,278,'(3)',30,'start','de'),(171,94,'H₂N',30,'end','de'),(156,182,'H₂N',30,'end','de'),(155,260,'N',31,'middle','de'),(155,304,'H',31,'middle','de')]:b+=F.label(x,y,t,z,a,weight=w)
for y,t in [(103,'a) N-methylbutan-2-amine; amine bậc hai'),(195,'b) butan-1-amine; amine bậc một'),(281,'c) benzenamine; amine bậc một')]:b+=F.label(383,y,t,24.5,'start')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="912" height="309" viewBox="0 0 912 309"><title>Hai cột cấu trúc và tên amine theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='amine-hai-cot-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=983,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='3amines15C3N/1phenyl3innerdouble/2H2NNanchors/1N1Hwithverticalbond/2actualdamheaders3rownums3regulartexts/EXACTN-methylbutan-2-amine;aminebậchai/NOgrid/noaddedmatchinglines-answer-charge-stereo.')
(K/'cau-truc-amine-hai-cot-ddh-lo-284-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(fn)
