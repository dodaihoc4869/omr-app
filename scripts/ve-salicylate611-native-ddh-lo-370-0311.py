"""Điều chế methyl salicylate nguồn611: giữ hai harpoon và carbonyl tiếp xúc bản gốc."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
p=json.loads((K/'doc-salicylate611-lo-370.json').read_text());h=p['hash'];g=p['geometry'];b=''
def line(pair,width=1.8):
 (x,y),(u,v)=pair
 return f'<path d="M{x} {y}L{u} {v}" stroke="#202020" stroke-width="{width}" fill="none"/>'
def text(x,y,t,z=30,anchor='middle'):return F.label(x,y,t,z,anchor=anchor,fill='#202020')
def first(x,y,t,z=30):return text(x-F.advance(t[0],z)/2,y,t,z,'start')
def parts(x,y,runs):
 out=''
 for t,z,dy in runs:out+=text(x,y+dy,t,z,'start');x+=F.advance(t,z)
 return out
for name in ['left','right']:
 d=g[name];v=d['ringVertices'];b+='<path d="M'+'L'.join(f'{x} {y}'for x,y in v)+'Z" stroke="#202020" stroke-width="1.8" fill="none"/>'
 for pair in d['innerDoubleRays']+d['bonds']+d['CORays']:b+=line(pair)
b+=text(138,26,'O')+text(706,34,'O')+text(745,108,'O')
b+=first(178,100,'OH')+first(138,175,'OH')+first(706,183,'OH')
b+=parts(785-F.advance('C',30)/2,83,[('CH',30,0),('3',21,7)])
b+=parts(305,135,[('CH',30,0),('3',21,7),('OH',30,0)])
b+=parts(883,139,[('H',30,0),('2',21,7),('O',30,0)])
b+=text(261,132,'+',34)+text(841,140,'+',34)
a=g['equilibrium'];b+=line(a['upperShaft'],2)+line(a['lowerShaft'],2)
for pts in [a['upperHalfHead'],a['lowerHalfHead']]:b+='<path d="M'+'L'.join(f'{x} {y}'for x,y in pts)+'Z" fill="#202020"/>'
left=495-(F.advance('H',30)+F.advance('+',20))/2;b+=parts(left,99,[('H',30,0),('+',20,-10)])
for x,t in [(96,'Salicylic acid'),(369,'Methanol'),(698,'Methyl salicylate')]:b+=text(x,226,t,28)
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="941" height="233" viewBox="0 0 941 233"><title>Điều chế methyl salicylate theo nguồn611</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='salicylate611-native-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
r=dict(i=611,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='16C8Oincludingmethanol-waterEXCLUDINGconditionHplus/2Ph6innerCCdouble/2COdouble2splitfeetCONTACTslopes-nativeV-NOaddedcrossbar/2HALFfilledharpoonsTOPrightABOVE-BOTTOMleftBELOW/ALLregularUPRIGHT3captions-chemicals-condition/EXACTSalicylicacid-Methanol-Methylsalicylate/OHfirstO-CH3firstCanchors/SUB3-2-SUPplus/0stereo-noadded75percent-massanswer-temp-coefficient-condensedCOOH')
(K/'cau-truc-salicylate611-native-ddh-lo-370-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
