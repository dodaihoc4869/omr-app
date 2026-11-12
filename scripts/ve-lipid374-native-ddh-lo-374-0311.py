"""Thủy phân lipid nguồn374: giữ số đỉnh, chân CO và hai nét nối đôi T nguyên dạng."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
p=json.loads((K/'doc-lipid374-lo-374.json').read_text());h=p['hash'];g=p['geometry'];b=''
def path(v):
 return '<path d="M'+'L'.join(f'{x} {y}'for x,y in v)+'" stroke="#252525" stroke-width="2" fill="none"/>'
for v in g['reactantGlycerol']['bonds']:b+=path(v)
for row in g['esterO']:b+=path(row['bond'])
for row in g['chains']:
 b+=path(row['vertices'])
 if 'innerRay'in row:b+=path(row['innerRay'])
for row in g['carbonyls']:
 for v in row['rays']:b+=path(v)
for v in g['productGlycerol']['bonds']:b+=path(v)
b+=path(g['saltZ']['bareVertices'])+path(g['saltZ']['COONa']['bond'])
for v in g['saltT']['nativeStrokePaths']:b+=path(v)
b+=path(g['saltT']['COONa']['bond'])+path(g['arrow']['shaft'])
b+='<path d="M'+'L'.join(f'{x} {y}'for x,y in g['arrow']['filledHead'])+'Z" fill="#252525"/>'
for x,y in [(38,79),(60,155),(37,233),(77,27),(106,112),(55,270)]:b+=F.label(x,y,'O',26,fill='#252525')
def first(x,y,t,z):return F.label(x-F.advance(t[0],z)/2,y,t,z,anchor='start',fill='#252525')
for x,y in [(685,73),(729,146),(686,222)]:b+=first(x,y,'OH',24)
b+=first(1093,83,'COONa',23.5)+first(1099,203,'COONa',23.5)
b+=F.label(502,151,'3NaOH',22,anchor='start',fill='#252525')
for x,y in [(481,151),(785,148)]:b+=F.label(x,y,'+',26,fill='#252525')
b+=F.label(794,86,'2',24,fill='#252525')
b+=F.label(617,130,'t',24,fill='#252525')+F.label(625,119,'o',13,fill='#252525')
for x,y,t in [(255,284,'(X)'),(695,264,'(Y)'),(966,127,'(Z)'),(964,253,'(T)')]:b+=F.label(x,y,t,32,weight='dam',fill='#252525')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1175" height="291" viewBox="0 0 1175 291"><title>Thủy phân lipid theo nguồn374</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='lipid374-native-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
r=dict(i=374,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='45reactantC6O=3glycerol+14-13-15acyl/CCdouble0-1-0/3COdouble2splitfeetCONTACT-topmid2slopes-bottomLEFThorizontalRIGHTupslope-NOcrossbar/productY3C3OH-Z13bareC+COONaC14-T14locations+COONaC15/KEEPunbalancedliteral-NOtheorynormalize/1FILLEDrighthead-3NaOH-2Z-tSUPo/chemregularUPRIGHT-4captionsXYZTtrueDAMUPRIGHT/TCCupperLEFTfreeRIGHTcontact-lowerLEFTshortkink937198-945191-contactRIGHTfree968191/0stereo-noaddedH-acidnames-charges-yield-answer-noalias')
(K/'cau-truc-lipid374-native-ddh-lo-374-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
