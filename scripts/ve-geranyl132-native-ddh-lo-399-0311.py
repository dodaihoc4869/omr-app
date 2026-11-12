"""Nguồn132: giữ phần nhìn thấy và các nhánh cắt, chú thích đậm nghiêng thật."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
p=json.loads((K/'doc-geranyl132-lo-399.json').read_text());g=p['geometry'];h=p['hash'];b=''
def path(d,fill='none',stroke='#303030',w=2):
 global b
 b+=f'<path d="{d}" fill="{fill}" stroke="{stroke}" stroke-width="{w}" stroke-linecap="butt" stroke-linejoin="round"/>'
def line(v,w=2):path('M'+'L'.join(f'{x} {y}'for x,y in v),w=w)
def lab(x,y,t,z=26,anchor='middle'):
 global b
 b+=F.label(x,y,t,z,anchor=anchor,fill='#202020')
def first(x,y,t,z=26):lab(x-F.advance(t[0],z)/2,y,t,z,anchor='start')
def last(x,y,t,z=26):lab(x+F.advance(t[-1],z)/2,y,t,z,anchor='end')
def italic(x,y,t,z=30):
 global b
 b+=f'<g transform="translate({x} {y}) skewX(-10)">'+F.label(0,0,t,z,anchor='middle',fill='#202020')+'</g>'
# Mỗi nét rời giữ đúng khoảng lệch và nhánh cắt từ nguồn.
a=g['mainPathGuides']
for key in ['upperLeftToO','toEsterO','lowerLeftToCC2','upperMethyl','bottomJoin']:line(a[key],1.5)
for key in ['CC1TwoRays','CC2TwoRays','lowerCutBranches']:
 for v in a[key]:line(v,1.5)
e=g['ester'];line([[158,62],[181,47.5],[183,47],[185.5,48],[219,68]],1.5)
line([e['carbonylRays'][0][0],e['rootLeftFootCalculated']],1.5);line(e['carbonylRays'][1],1.5)
lab(146.5,75,'O',22);lab(183,16,'O',20)
lab(31,84,'(1)',17,anchor='start');lab(5,161,'(2)',17,anchor='start')
b+='<g transform="translate(87 133) skewX(-10)">'+F.label(0,0,'Geranyl acetate',18.5,anchor='start',fill='#202020',weight='dam')+'</g>'
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="242" height="195" viewBox="0 0 242 195"><title>Công thức theo nguồn132</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='geranyl132-native-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
r=dict(i=132,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='8FULLinsidebareC+2LEFTboundarypartialjunctions-2BOTTOMcutcontinuationsUNKNOWNtotalC/2OregularUPRIGHT/2CCdoubleSEPARATEoffsetrays-CC2TOPtinyGAPSKEEP-BOTTOMshortjoin/1CO2verticalraysLEFTnativegraybridge-RIGHTcontact/2regularUPRIGHTnums(1)(2)/EXACTGeranyl acetateTRUEdamITALIC/LEFTx0strokeCROP-BOTTOM2armsCROP-TOPcarbonylOCROP/NOrestoredhiddenbranch-molecularformula-H-stereo-arrow-answer-alias1248')
(K/'cau-truc-geranyl132-native-ddh-lo-399-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
