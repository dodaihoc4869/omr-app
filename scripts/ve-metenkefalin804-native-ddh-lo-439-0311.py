from pathlib import Path
import json,hashlib,importlib.util
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='958879717d75ab58834aa2708e51bd34f3f462520127b3f0f7f98c3a6ba18457';b=''
def path(d,w=1.5):
 global b
 b+=f'<path d="{d}" fill="none" stroke="#000000" stroke-width="{w}" stroke-linecap="butt" stroke-linejoin="round"/>'
def solid(d):
 global b
 b+=f'<path d="{d}" fill="#000000"/>'
def lab(x,y,t,z=27,anchor='middle'):
 global b
 b+=F.label(x,y,t,z,anchor=anchor,fill='#000000')
def first(x,y,t,z=27):lab(x-F.advance(t[0],z)/2,y,t,z,'start')
def last(x,y,t,z=27):lab(x+F.advance(t[-1],z)/2,y,t,z,'end')
# Hai vòng và sáu tia riêng, không chuẩn hoá đỉnh thành lục giác đều.
path('M106 174L138 156L171 174L171 210L138 228L106 210Z')
path('M113 178L113 207M139 164L164 179M139 220L164 205')
path('M565 65L597 47L630 65L630 101L597 119L565 101Z')
path('M572 69L597 54M623 69L623 97M572 97L597 112')
path('M171 174L204 156L237 174L269 156L289 167')
path('M316 166L334 156L365 173Q368 175 371 173L387 164')
path('M414 165L433 174L466 156L486 166')
path('M513 165L532 156L562 173Q565 175 568 173L585 164')
path('M612 165L630 174L663 156L696 174L716 164')
path('M86 220L106 210M533 119L565 101M630 210L650 222M740 164L761 175')
# Các giao điểm là tính từ cánh xấp xỉ native, không phải đo subpixel của raster.
path('M267 157.125L267 133M273 158.2L273 133')
path('M365 173L365 196M371 173L371 196')
path('M463 157.636364L463 133M470 158L470 133')
path('M562 173L562 196M568 173L568 196')
path('M628 208L608 220M634.390244 212.634146L611 226')
solid('M237 174L234 196L241 196Z')
solid('M532 156L529 120L536 116Z')
solid('M630 174L627 207L634 211Z')
last(73,240,'HO')
first(237,220,'NH₂',26)
lab(270,130,'O')
lab(303.5,184,'N');lab(303.5,205,'H')
lab(402,165,'N');lab(402,144,'H')
lab(368,221,'O')
lab(467,130,'O')
lab(500.5,184,'N');lab(500.5,205,'H')
lab(599,165,'N');lab(599,144,'H')
lab(566,221,'O')
lab(598,240,'O')
first(662,240,'OH')
lab(729,165,'S')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="807" height="281" viewBox="0 0 807 281"><title>Cấu trúc nguồn804</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='metenkefalin804-native-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
note='27C5N7O1S/2Ph6innerCCdouble5COdouble-contact/3individualSOLIDwedges/4NHseparateH-NOdrawnNHstroke/1NH2FIRSTN-HOlastO-OHfirstO/ALLregularUPRIGHT/individualnonperiodicvertices/0arrows-captions-charges/NOaddedH-formula-name-answer/nativeapproxNOTsubpixel'
r=dict(i=804,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung=note)
(K/'cau-truc-metenkefalin804-native-ddh-lo-439-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
(K/'doc-metenkefalin804-lo-439.json').write_text(json.dumps(dict(hash=h,native=[807,281],questions=qs,ghiChu=note,independentSourceAudit=json.loads(Path('/workspace/scratch/source439.json').read_text()),rootSourceAudit='RootOWNnativeFULL3x/all2publicde/left-mid-right-top5x/CO2-CO4-CO5own12x. Count27C=12ring+5alpha+5CO+2ring-side+3S-side. 5N7O1S/4NHseparateH without drawnN-Hstroke/1NH2/3SOLIDwedges individualslantedfeet. ALLregularUPRIGHT. No answers. Sourceagentfeet CO2right371175 andCO4right568175 belowarms corrected BEFOREfirstbuilder to shortroundedjoins365173Q368175371173 and562173Q565175568173 nativeownmacros; CO5rightfoot extended sameangle to OHarm intersection634.390244,212.634146 CALCULATEDfromapproxarmsNOTnativeSubpixel. No forcedcrossbar at otherCO. Nativegeometry approximation not exactpixel reproduction.'),ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
