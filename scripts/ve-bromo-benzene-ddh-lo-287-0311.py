"""Nguồn phản ứng và cơ chế: giữ nguyên vòng cation, hai mũi tên cong và mọi ion."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text())
def path(d,w=2.3):return f'<path d="{d}" fill="none" stroke="#252440" stroke-width="{w}" stroke-linejoin="round"/>'
def head(points):return f'<polygon points="{points}" fill="#252440"/>'
def labels(rows):return ''.join(F.label(x,y,t,z,a)for x,y,t,z,a in rows)
def save(i,h,b,w,ht,slug,note):
 qs=[]
 for q in iv['questions']:
  refs=[r for r in q['hinh']if r['hash']==h]
  if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
 raw=(f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{ht}" viewBox="0 0 {w} {ht}"><title>Hình phản ứng theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn=slug+'-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
 r=dict(i=i,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung=note)
 (K/('cau-truc-'+slug+'-ddh-lo-287-ban-dung.json')).write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(i,fn)
b=path('M76 75L35 99V148L76 173L117 149V100Z M44 103L76 84 M107 105V143 M76 164L44 145 M482 72L440 97V146L482 171L524 147V98Z M482 82L514 102 M450 102V140 M482 161L514 143 M524 98L548 84 M272 121H390')
b+=head('382,116 402,121 382,126')
b+=labels([(156,128,'+',29,'middle'),(195,128,'Br₂',29,'start'),(338,101,'FeBr₃',24,'middle'),(553,80,'Br',29,'start'),(625,127,'+',29,'middle'),(653,127,'HBr',29,'start')])
save(561,'68acc32fa343dbae80273d74d61b5b22f66e49d5b297ec7ead8e201655370e8c',b,740,212,'bromo-benzene-phan-ung','2phenyl6INNERdoubles/benzene+Br2→bromobenzene+HBr/1filledRIGHT/FeBr3ABOVE/2plus/allsubs2-3/regularDDH/noaddedconditions-yield-answer.')
b=path('M80 65L41 88V138L80 161L120 138V90Z M120 90L133 66 M120 90L144 104 M88 80C59 73 44 99 48 121C51 150 92 164 112 122 M155 94Q143 83 132 83 M379 100C352 47 197 25 163 89 M399 122H480 M584 73L544 96V144L584 168L624 145V97Z M584 83L615 102 M553 101V138 M584 158L615 140 M624 97L648 82',2.2)
b+=head('137,79 130,83 137,87')+head('160,98 161,84 167,87')+head('476,116 495,122 476,128')
b+='<circle cx="80" cy="113" r="11" fill="none" stroke="#252440" stroke-width="1.5"/>'
b+=labels([(80,120,'+',22,'middle'),(132,62,'Br',30,'start'),(159,128,'H',30,'middle'),(213,128,'+',29,'middle'),(263,130,'[FeBr₄]⁻',29,'start'),(653,86,'Br',30,'start'),(687,142,'+',29,'middle'),(723,142,'FeBr₃',29,'start'),(832,142,'+',29,'middle'),(858,142,'HBr',29,'start')])
save(1065,'c069ff79367e82b158e50e64bbe1cae9a480fa9a2d32dd528f48cb42295f036c',b,954,206,'bromo-benzene-co-che','leftsigmahexagonOPENinnerhorseshoeNOTcircleNOT3doubles/centerCIRCLEDplus/BrUP-HdownRIGHTatSAMEvertex/2curvedfilledheads/FeBr4squareSUPminus/1filledRIGHT/productphenyl3INNERdoubles+FeBr3+HBr/2sub3-1sub4/regularDDH/noaddedproton-condition-answer.')
