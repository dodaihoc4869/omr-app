from pathlib import Path
import json,hashlib,importlib.util
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='a78695f2035b0f4ba0d83b6cbd0e667da03aec3a756a4e859006ccfd425bcb1f';b=''
def path(d,w=1.8):
 global b
 b+=f'<path d="{d}" fill="none" stroke="#000000" stroke-width="{w}" stroke-linecap="butt" stroke-linejoin="round"/>'
def lab(x,y,t,z=26,anchor='middle'):
 global b
 b+=F.label(x,y,t,z,anchor=anchor,fill='#000000')
def first(x,y,t,z=26):lab(x-F.advance(t[0],z)/2,y,t,z,'start')
def last(x,y,t,z=26):lab(x+F.advance(t[-1],z)/2,y,t,z,'end')
# Ba nhóm có các chân C=O và đoạn nối ngắn riêng theo nguồn, không sao đối xứng.
path('M148 152V120L181 104H187L211 120 M148 120L118 113 M148 126L117 119 M181 104V74 M187 104V74')
path('M148 259V290L176 300H184L210 292 M148 286L115 294 M150 291L117 301 M176 300V329 M184 300V329')
path('M306 175L328 193V219L306 240 M326 191.3636L348 174 M328 199L352 179 M328 217L351 238 M326 220.9091L345 240')
path('M221 135V195 M221 219V278')
b+='<path d="M206 216L160 235V247Z M237 216L283 235V247Z" fill="#000000"/>'
# 6 trái và 7 phải: từng thanh dọc riêng, không dasharray tuần hoàn.
path('M160.5 170V173',1.5)
path('M170.0 174V177',2)
path('M177.0 178V184',2)
path('M186.5 183V189',1.5)
path('M195.0 187V196',4)
path('M203.5 190V202',1.5)
path('M233.5 194V203',3)
path('M243.0 190V198',4)
path('M251.0 187V193',2)
path('M258.5 183V189',1.5)
path('M265.5 178V184',1.5)
path('M274.0 176V177',4)
path('M282.5 172V173',1.5)
path('M66 47H48V350H66 M375 47H393V350H375',2)
lab(105,121,'O',26)
lab(184,70,'O',26)
lab(222,134,'O',26)
lab(148,174,'O',26)
lab(105,309,'O',26)
lab(180,351,'O',26)
lab(221,299,'O',26)
lab(148,257,'O',26)
lab(297,174,'O',26)
lab(360,174,'O',26)
lab(360,257,'O',26)
lab(297,258,'O',26)
lab(220.5,216,'Cr',24)
lab(417,62,'3−',28)
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="476" height="382" viewBox="0 0 476 382"><title>Mạch nguồn921</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='cr921-native-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
note='6bareC12O1Cr3oxalates6COdouble/2solidwedges/6LEFT7RIGHTindividualgradedbars/2axialsingles/SQUAREpair-3minusOUTSIDE/ALLregularUPRIGHT/individualnonperiodicgeometry-shortCOjoins/0H-caption-arrows/NOaddedatom-formula-name-answer/nativeapproxNOTsubpixel'
r=dict(i=921,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung=note)
(K/'cau-truc-cr921-native-ddh-lo-435-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
(K/'doc-cr921-lo-435.json').write_text(json.dumps(dict(hash=h,native=[476,382],questions=qs,ghiChu=note,rootSourceAudit='RootOWNnativeFULL/all1de12-C8-B27-II-13/core-top-bottom-right5x/hash9x. 6C12OCr; 6left7rightbars individually counted, no mirroredtemplate. AllregularUPRIGHT/2filledwedges/3minusoutside. Root corrected source approximate carbonyl joins BEFORE firstbuilder; coordinates approximate notnativeSubpixel. Sparsebackgroundflecks not chemical charges.'),ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
