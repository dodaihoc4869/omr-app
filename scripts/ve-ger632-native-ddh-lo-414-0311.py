"""Phản ứng nguồn632: giữ bảy mảnh chữ cắt và hai móc mũi tên mở."""
from pathlib import Path
import json,hashlib,importlib.util
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='74d7ec9a289e5afed5b4fccfa32f9397af73296ccf7ea296a5b17a731968e610';b=''
def path(d,w=1.7):
 global b
 b+=f'<path d="{d}" fill="none" stroke="#202020" stroke-width="{w}" stroke-linecap="butt" stroke-linejoin="round"/>'
def line(v,w=1.7):path('M'+'L'.join(f'{x} {y}'for x,y in v),w)
def lab(x,y,t,z=26,anchor='middle'):
 global b
 b+=F.label(x,y,t,z,anchor=anchor,fill='#202020')
def first(x,y,t,z=26):lab(x-F.advance(t[0],z)/2,y,t,z,'start')
# Acetic acid, hai chân carbonyl nằm trên hai nhánh gốc.
line([[14,156],[42,134],[65,147]])
line([[39,105],[39,136.35714285714286]]);line([[45,105],[45,135.69565217391303]])
lab(43,98,'O',26);first(77,165,'OH',26)
lab(147,131,'+',25)
# Geraniol: 10C trần, không tự thêm CH/CH2.
line([[210,211],[249,189],[284,211]])
line([[249,189],[249,148],[211,126],[211,85],[249,63],[285,85],[323,63],[349,78]])
line([[249,63],[249,24]]);line([[243,154],[243,184]]);line([[256,60],[285,78]])
first(360,92,'OH',26);lab(250,253,'Geraniol',26)
# Hai harpoon rỗng chỉ một móc mỗi đầu; không đóng/đổ đầu tam giác.
line([[430,121],[534,121]],1.8);path('M534 121 Q529 118 526 113',1.4)
line([[534,130],[430,130]],1.8);path('M430 130 Q435 133 438 139',1.4)
lab(465,110,'H₂SO₄',20);lab(510,115,'đặc',14)
lab(473,151,'t',21);lab(481,140,'o',13)
# Geranyl acetate là mạch riêng, không tịnh tiến mẫu cũ.
line([[590,213],[628,191],[665,213]])
line([[628,191],[628,150],[591,128],[591,87],[628,66],[665,88],[703,66],[727,80]])
line([[628,66],[628,27]]);line([[622,156],[622,186]]);line([[635,62],[665,81]])
lab(739,93,'O',26);line([[750,82],[777,68],[812,89]])
line([[774,37],[774,69.55555555555556]]);line([[780,37],[780,69.8]])
lab(777,32,'O',26);lab(699,253,'Geranyl acetate',26)
lab(869,132,'+',25);lab(944,132,'H₂O',26)
# Bảy phần mực native bị cắt ở y0: giữ dưới dạng mảnh vô danh, không khôi phục chữ.
path('M0 0 Q1 4 7 4 Q13 4 13 0',1.7)
path('M64 -1 Q63 2 59 4',1.6)
path('M286 -1 Q284 4 291 4 Q298 4 298 -1',1.7)
path('M319 1 L319 4 Q323 6 325 -1',1.7)
path('M689 -1 L689 2',2.6)
path('M724 -1 Q722 4 729 4 Q736 4 736 -1',1.7)
path('M798 1 L798 4 Q802 6 804 -1',1.7)
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="973" height="265" viewBox="0 0 973 265"><title>Phản ứng điều chế ester theo nguồn632</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='ger632-native-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
note='24C6OinclwaterEXCLH2SO4condition/acid2C-geraniol10C-ester12C/2CCdoubleEACH4total/2COdouble2splitfeetCONTACTrespectivearms/2OPENHALFharpoons-upperRIGHTABOVE-lowerLEFTBELOW/ALLregularUPRIGHT-2captionsEXACTGeraniol-Geranyl acetate/H2SO4dac-tSUPsmallo/7TOPcroppedUNKNOWNfragmentsretain-native265heightKEEP/NOaddedH-tempvalue-yield-answer-alias/nativeapproxNOTsubpixel-COfeetCALCULATEDfromapproxarms'
r=dict(i=632,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung=note)
(K/'cau-truc-ger632-native-ddh-lo-414-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
(K/'doc-ger632-lo-414.json').write_text(json.dumps(dict(hash=h,native=[973,265],questions=qs,ghiChu=note,rootSourceAudit='Root OWNnativeFULL2x/eachTOPfragment10x/arrows6x/2CO6x/allpublicde; sevenUNKNOWNpiecesretain/noRestore. Provided263heightwrong ROOTPIL265beforeFIRSTbuilder; noSVGnegativeforsourcecorrection. NativeapproxNOTsubpixel/COfeetCALCULATEDfromapproxarms.'),ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
