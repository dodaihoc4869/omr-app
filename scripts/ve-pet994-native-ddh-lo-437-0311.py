from pathlib import Path
import json,hashlib,importlib.util
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='b28a7e6b2ff347968070f5117aca5cf6f9d471fc0aeb7fd0073bf49bcdd791fe';b=''
def path(d,w=2.5):
 global b
 b+=f'<path d="{d}" fill="none" stroke="#000000" stroke-width="{w}" stroke-linecap="butt" stroke-linejoin="round"/>'
def lab(x,y,t,z=26,anchor='middle',weight='dam'):
 global b
 b+=F.label(x,y,t,z,anchor=anchor,fill='#000000',weight=weight)
def first(x,y,t,z=26):lab(x-F.advance(t[0],z,'dam')/2,y,t,z,'start')
def last(x,y,t,z=26):lab(x+F.advance(t[-1],z,'dam')/2,y,t,z,'end')
# Các vòng và các chân carbonyl theo từng nhánh nguồn; phân số là giao điểm tính từ guide gần đúng.
path('M169 130L191 86H234L256 130L235 173H191Z M194 93H231 M247 130L231 165 M178 130L195 165')
path('M938 124L958 87H1001L1022 124L1001 160H958Z M961 94H997 M1013 124L997 153 M947 124L962 153')
path('M113 158L126 130H169 M256 130H300L314 158 M896 124H938 M896 124L880 150 M1022 124H1064L1078 149')
path('M124 134.3076923L109 103 M129 130L116 99 M298 130L311 99 M304 138L317 103 M893 128.875L878 101 M898 124L884 97 M1062 124L1076 97 M1067 129.3571429L1082 101')
path('M627 124L787 123 M778 115L787 123L778 132',2.2)
path('M850 70H840V201H850 M1212 68H1223V199H1213',3)
path('M831 161H860 M1101 160H1122 M1210 160H1231',3)
lab(64,140,'n',36)
lab(104,98,'O',32);last(102,185,'HO',28)
lab(320,98,'O',32);first(320,185,'OH',28)
lab(367,139,'+',36);lab(384,137,'nHO–[CH₂]₂–OH',30,'start')
lab(704,115,'2,7 – 5,5 bar',22,weight='de')
lab(705,148,'220 – 260°C',22,weight='de')
lab(819,172,'H',30)
for x,y in [(874,98),(874,173),(1086,98),(1086,172)]:lab(x,y,'O',30)
lab(1124,170,'[CH₂]₂',26,'start');first(1245,170,'OH',30)
# Chỉ n dưới ngoặc ngoài nghiêng; dùng WOFF2 đậm thật.
b+='<g transform="translate(1231 208) skewX(-10)">'+F.label(0,0,'n',28,weight='dam',fill='#000000')+'</g>'
lab(1285,135,'+ (2n – 1)H₂O',30,'start')
# Bốn nhóm vết mờ bên trong phần trên, không khôi phục chữ bị mất.
b+='<path d="M188 49h4 M220 49h1 M273 49h3" fill="none" stroke="#777777" stroke-width="1.2"/>'
b+='<path d="M185 53l2 -1 M193 54l2 1 M218 53v2 M223 53h1 M272 53h3 M424 51l4 -1 M433 53h2 M441 53h4" fill="none" stroke="#dddddd" stroke-width="1"/>'
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1526" height="265" viewBox="0 0 1526 265"><title>Mạch nguồn994</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='pet994-native-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
note='20knownCmotif12OinclterminalOH-water-symbolicnNOTmoleculartotal/2Ph6innerCCdouble4COcontactseparatefeet/1OPENVrightheadshaftTIP/EXACT2,7–5,5bar-220–260°C/nHO–[CH2]2–OH-H…OH-+(2n–1)H2O/2innerSQUAREpairs1outerSQUARE+nSUB-DAMITALIC/chemicalTRUEdamUPRIGHT-conditionsregularUPRIGHT/4TOPinternalUNKNOWNfragmentgroupsKEEP/noaddedH-catalyst-answer/nativeapproxNOTsubpixel'
r=dict(i=994,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung=note)
(K/'cau-truc-pet994-native-ddh-lo-437-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
(K/'doc-pet994-lo-437.json').write_text(json.dumps(dict(hash=h,native=[1526,265],questions=qs,ghiChu=note,rootSourceAudit='RootOWNnativeFULL/all1de12-KT-C4-D2-II-2/left-arrow-right3x/n8x-TOP8x-CO8x. Rootcorrected sourceagent approximatefeet BEFORE firstbuilder: pairs contact respective native arms, fractions CALCULATED fromapproxslopes NOTmeasuredsubpixel; noextra crossbar. Rootn actualDAMITALIC/allchemicalTRUEdamUPRIGHT/conditionsregularUPRIGHT. Source20knownCmotifs12Oinclwater+terminalOH, unknownnnotmoleculartotal.4internalTOPunknownfragmentgroups retain no restore.'),ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
