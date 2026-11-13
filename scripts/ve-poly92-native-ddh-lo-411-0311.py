"""Bốn phản ứng polymer nguồn92; hai ghế mảnh được dựng riêng theo nguồn."""
from pathlib import Path
import json,hashlib,importlib.util
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='1200858d9f515e33003c505680c550675f4fbdc2466757dd8422acaa1c0a67ae';b=''
def line(v,w=1.3):
 global b
 d='M'+'L'.join(f'{x} {y}'for x,y in v)
 b+=f'<path d="{d}" fill="none" stroke="#303030" stroke-width="{w}" stroke-linecap="butt" stroke-linejoin="round"/>'
def lab(x,y,t,z=29,anchor='middle'):
 global b
 b+=F.label(x,y,t,z,anchor=anchor,fill='#303030')
def first(x,y,t,z=29):lab(x-F.advance(t[0],z)/2,y,t,z,'start')
def last(x,y,t,z=29):lab(x+F.advance(t[-1],z)/2,y,t,z,'end')
def bracket(a,c,y0,y1,nx,ny):
 line([[a+17,y0],[a,y0],[a,y1],[a+17,y1]],1.8)
 line([[c-17,y0],[c,y0],[c,y1],[c-17,y1]],1.8);lab(nx,ny,'n',22)
def arrow(a,c,y,cond=False):
 global b
 line([[a,y],[c,y]],1.8)
 b+=f'<path d="M{c-16} {y-5} L{c} {y} L{c-16} {y+5} L{c-13} {y} Z" fill="#303030"/>'
 if cond:lab((a+c)/2,y-11,'xt, t',27);lab((a+c)/2+34,y-24,'o',17)
 else:lab((a+c)/2-3,y-11,'t',28);lab((a+c)/2+7,y-24,'o',17)
# Dòng1: từng chữ C đầu và các nét đơn/đôi độc lập.
for x,t in [(68,'CH₂'),(144,'CH'),(221,'CH'),(285,'CH₂')]:first(x,46,t)
for v in [[[22,36],[56,36]],[[109,36],[131,36]],[[175,33],[204,33]],[[175,40],[204,40]],[[252,36],[272,36]],[[324,36],[365,36]]]:line(v)
bracket(36,344,8,67,359,79);lab(465,48,'+ n HCl',29);arrow(540,629,39,True)
for x,t in [(707,'CH₂'),(784,'CH'),(861,'CH₂'),(935,'CH₂')]:first(x,51,t)
for v in [[[663,40],[696,40]],[[747,40],[771,40]],[[816,40],[848,40]],[[900,40],[922,40]],[[974,40],[1015,40]],[[783,55],[783,72]]]:line(v)
first(783,94,'Cl',28);bracket(675,985,11,70,1000,82)
# Dòng2: CH3–COO móc vào O cuối, hai nhánh methyl giữ C đầu.
first(104,204,'CH₂');lab(214,204,'C');last(214,135,'CH₃–COO',28)
for v in [[[53,193],[92,193]],[[143,193],[201,193]],[[225,193],[279,193]],[[215,138],[215,180]],[[215,208],[215,236]]]:line(v)
first(215,261,'CH₃');bracket(65,247,151,217,265,229)
lab(377,206,'+ n NaOH');arrow(471,563,196)
first(640,208,'CH₂');lab(736,208,'C');first(735,152,'OH');first(736,265,'CH₃')
for v in [[[590,196],[627,196]],[[680,196],[725,196]],[[750,196],[814,196]],[[735,157],[735,182]],[[736,210],[736,239]]]:line(v)
bracket(609,792,154,220,809,234);lab(941,210,'+ nCH₃COONa')
# Dòng3: C/O in rõ, hai tia dọc giữ khe trắng với cả hai chữ.
lab(84,334,'NH');lab(183,334,'(CH₂)₅');lab(259,333,'C');lab(259,376,'O')
for v in [[[18,321],[64,321]],[[105,321],[141,321]],[[225,321],[248,321]],[[271,321],[305,321]],[[255,336],[255,353]],[[262,336],[262,353]]]:line(v)
bracket(37,292,298,351,307,363);lab(400,335,'+ n NaOH');arrow(495,586,323)
lab(618,337,'n');last(669,337,'H₂N');lab(761,337,'(CH₂)₅');lab(831,337,'COONa',29,'start')
line([[687,323],[717,323]]);line([[806,323],[824,323]])
# Hai ghế ALLthin, không nhân bản tịnh tiến và không thêm nét nêm.
for v in [[[0,458],[55,435],[134,470],[222,456]],[[247,465],[288,522],[170,501],[95,517],[55,435]],[[288,522],[328,495]],[[355,493],[393,518]],[[134,470],[113,434]],[[71,502],[95,517]],[[170,501],[187,519]],[[683,483],[747,456],[825,490],[915,477]],[[939,486],[979,541],[862,521],[786,536],[747,456]],[[979,541],[1019,515]],[[1047,513],[1086,538]],[[825,490],[804,455]],[[763,522],[786,536]],[[862,521],[881,540]]]:line(v,1.3)
lab(237,462,'O',28);lab(342,493,'O',28);first(113,431,'CH₂OH',28);last(55,504,'HO',28);first(198,543,'OH',28)
bracket(14,373,402,548,389,558)
lab(929,483,'O',28);lab(1035,514,'O',28);first(807,453,'CH₂OAc',28);last(747,525,'AcO',28);first(891,564,'OAc',28)
bracket(700,1061,422,568,1078,579)
lab(491,503,'+ 3n (Ac)₂O',28);arrow(574,663,491,True);lab(1168,514,'+ 3nAcOH',28)
for x,y,t in [(1305,52,'(1)'),(1303,207,'(2)'),(1305,332,'(3)'),(1304,512,'(4)')]:lab(x,y,t,30)
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1340" height="587" viewBox="0 0 1340 587"><title>Bốn phản ứng theo nguồn92</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='poly92-native-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
note='4literalpolymerreactions-UNKNOWNnTotal/4FULLFILLEDrightheads/7SQUAREpairs7nSUB-othernBASELINE/row1CH2-CH=CH-CH2+nHCl-ClDOWN-FIRSTC/row2CH3-COO-LASTOanchor-CH3DOWN-toOHUP-CH3DOWN+nCH3COONa/row3NH-(CH2)5-C-EXPLICITCdoubleO2verticalraysWHITEglyphgaps-toH2N-(CH2)5-COONa/row4TWOindividualALLTHINchairsNOtaper-bareC-CH2OH-HO-OH-toCH2OAc-AcO-OAc-ACKEEP/AcO-LASTOanchors/3n(Ac)2O-3nAcOH/ALLregularUPRIGHT-4nums/NOtheoryfix-addedH-water-formula-name-answer-alias/nativeapproxNOTsubpixel'
r=dict(i=92,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung=note)
(K/'cau-truc-poly92-native-ddh-lo-411-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
(K/'doc-poly92-lo-411.json').write_text(json.dumps(dict(hash=h,native=[1340,587],questions=qs,ghiChu=note,rootSourceAudit='Root OWNnativeFULL/chairs2x/explicitCO8x; individualALLthinchairvertices and literalAc groups. NativeapproxNOTsubpixel.'),ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
