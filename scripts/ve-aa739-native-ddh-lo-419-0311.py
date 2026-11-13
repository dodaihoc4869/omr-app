"""Ba amino acid nguồn739: nét, chữ và mảnh cắt riêng theo native."""
from pathlib import Path
import json,hashlib,importlib.util
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='89a253ea4f51ccff306b97e528548c359ac113ffe84f670401bb365e57fe2280';b=''
def path(d,w=2.6,c='#000000'):
 global b
 b+=f'<path d="{d}" fill="none" stroke="{c}" stroke-width="{w}" stroke-linejoin="round" stroke-linecap="butt"/>'
def lab(x,y,t,z=30,anchor='middle'):
 global b
 b+=F.label(x,y,t,z,anchor=anchor)
def first(x,y,t,z=30):lab(x-F.advance(t[0],z)/2,y,t,z,'start')
def last(x,y,t,z=30):lab(x+F.advance(t[-1],z)/2,y,t,z,'end')
# Arginine: NH imine, N et H du pont restent deux glyphes sans liaison ajoutée.
path('M63 74L81.5 63Q85.5 60.5 89 63L109 75 M137 75L159 62L198 83L235 62L273 83L306.5 63Q310 60.5 314 63L335 75 M273 83V113')
path('M81.5 33V63 M89 33V63 M306.5 33V63 M314 33V63')
last(48,95,'H₂N');first(85.5,29,'NH');lab(123,95,'N');lab(123,120,'H');first(273,139,'NH₂');lab(310,29,'O');first(349,95,'OH')
# Glutamic acid: les deux CO verticaux ont chacun deux pieds sur les bras natifs.
path('M481 75L501 63Q505 60.5 509 63L543 83L581 62L619 83L653 63Q657 60.5 661 63L682 75 M619 83V113')
path('M501 33V63 M509 33V63 M653 33V63 M661 33V63')
last(468,95,'HO');lab(505,29,'O');lab(657,29,'O');first(697,95,'OH');first(619,139,'NH₂')
# Glycine: deux rayons diagonaux indépendants, pas de traverse artificielle.
path('M860 75L885 61L923 83V113 M919.5 80.97368421052632L946 64 M923 87.65384615384616L950 70')
last(846,95,'H₂N');lab(962,71,'O');first(923,139,'OH')
for x,y,t in [(33,128,'(1)'),(245,139,'(2)'),(460,125,'(1)'),(705,125,'(2)')]:lab(x,y,t,22)
for x,t in [(200,'Arginine (Arg)'),(582,'Glutamic acid (Glu)'),(890,'Glycine (Gly)')]:lab(x,188,t,26)
# Sept fragments en bas du scan: intention inconnue, ne pas restaurer la prose coupée.
for x1,x2 in [(64,67),(118,123),(144,148),(226,231),(293,298),(475,480)]:path(f'M{x1} 210.5H{x2+1}',1,'#d7d7d7')
path('M337 211L338 209.5L339 211',1.5)
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="979" height="211" viewBox="0 0 979 211"><title>Ba amino acid theo nguồn739</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='aa739-native-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
note='3AA13C8O6N/4CO1CNdouble-3CO1CNshortnativeARCHjoins-GlyCO2splitfeetCONTACTrespectivearms/4NH2-1imineNH-1bridgeNplusHSEPARATE-NONHstroke/4OH/ALLchemical4nums3captionsregularUPRIGHT/EXACTArginine (Arg)-Glutamic acid (Glu)-Glycine (Gly)/7BOTTOMtinyCROPUNKNOWNretain-NOrestore/0charge-stereo-arrows/NOaddedH-N-answer-alias7111022/nativeapproxNOTsubpixel-COfeetCALCULATEDfromapproxarms'
r=dict(i=739,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung=note)
(K/'cau-truc-aa739-native-ddh-lo-419-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
(K/'doc-aa739-lo-419.json').write_text(json.dumps(dict(hash=h,native=[979,211],questions=qs,ghiChu=note,rootSourceAudit='Root OWNnativeFULL3x/LEFT-RIGHT4x/BOTTOM4x/allpublicde. Independent13C8O6N count. FourNH2, NHimine, bridgeN+H separate; noaddedN-Hstroke. ALLregularupright. SevenBOTTOMcroppedunknownretain. COfeetcalculatedfromapproxarms, notnativeSubpixel.'),ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
