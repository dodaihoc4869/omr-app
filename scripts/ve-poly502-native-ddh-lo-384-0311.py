"""Đoạn mạch nguồn502: giữ neo cạnh nhãn và chỉ số dưới bị cắt như ảnh gốc."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
p=json.loads((K/'doc-poly502-lo-384.json').read_text());g=p['geometry'];h=p['hash'];b=''
def line(v):
 global b
 b+='<path d="M'+'L'.join(f'{x} {y}'for x,y in v)+'" fill="none" stroke="#555555" stroke-width="1.3" stroke-linecap="butt"/>'
def label(x,y,t,z=28):
 global b
 b+=F.label(x,y,t,z,weight='dam',anchor='start',fill='#202020')
for v in g['singleBonds']:line(v)
for pair in g['doubleBonds']:
 for v in pair:line(v)
for j,r in enumerate(g['labels']):
 x=r['bbox'][0];t=r['text']
 if j in [12,13,16,17]:y=30
 elif j in [14,15]:y=165
 elif j in [0,3,5,6,8,11]:y=123
 else:y=77
 if t in ['CH₂','CH₃']:
  label(x,y,'CH');dy=9 if j==14 else 6
  label(x+F.advance('CH',28,'dam'),y+dy,'2'if t=='CH₂'else'3',19.6)
 else:label(x,y,t)
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="806" height="171" viewBox="0 0 806 171"><title>Đoạn mạch theo nguồn502</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='poly502-native-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
r=dict(i=502,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='15knownC=12backboneC+3CH3/6explicitprintedC6CH2-3CH3-3standaloneH/24knownH/3CCdouble2separatehorizontalraysEACH-16singleshaftsincl2freeends/ALLlabelsTRUEdamUPRIGHT-SUB23/graythinbonds/CH3edgeanchorsNOTtheorypulltoFIRSTC-CH2oppositeglyphsides/centerBOTTOMCH3sub3CROPPEDnative171height-RIGHTblankkeep/0ring-bracket-n-arrow-caption/NOmonomer-Sbridge-name-formula-answer-alias/ONLY1of2sameqidNOnewfull/finalONLYmiddleHrayend415142.5sameangle-whitegap-native')
(K/'cau-truc-poly502-native-ddh-lo-384-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
