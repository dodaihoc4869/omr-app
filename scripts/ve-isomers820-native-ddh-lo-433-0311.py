"""Tám cấu trúc nguồn820: giữ các hướng nối đôi riêng của từng hình."""
from pathlib import Path
import json,hashlib,importlib.util
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='984d5c3d592d20b8f2c138c7ef03d814eb83448b3e521ddde11480a29f910d91';b=''
def path(d,w=1.4):
 global b
 b+=f'<path d="{d}" fill="none" stroke="#000000" stroke-width="{w}" stroke-linecap="butt" stroke-linejoin="round"/>'
def lab(x,y,t,z=26,anchor='middle'):
 global b
 b+=F.label(x,y,t,z,anchor=anchor,fill='#000000')
def first(x,y,t,z=26):lab(x-F.advance(t[0],z)/2,y,t,z,'start')
def last(x,y,t,z=26):lab(x+F.advance(t[-1],z)/2,y,t,z,'end')
# Hàng trên, bốn cấu trúc có các đỉnh và tia đôi riêng.
path('M105 117L130 133L165 112L199 132L235 116 M166 119L195 137')
last(93,116,'H₂N')
path('M415 100L436 110V145L471 165L506 147 M442 142L472 158')
last(400,101,'HO')
path('M713 115L733 126L767 108L802 126L837 108 M767 115L798 132')
last(699,117,'HO')
path('M962 121L998 100L1032 120L1067 104L1068 76 M998 100L999 64 M1003 96L1032 113')
first(1068,72,'COOH')
# Hàng dưới: COOH vẫn là chữ ngưng tụ, không tự mở thành C=O/OH.
path('M59 296L95 275L129 294L164 279L184 291 M95 275V239 M101 271L129 287')
first(197,308,'COOH')
# Cấu trúc (6): vòng và nhánh propenyl hướng lên-phải.
path('M422 291L442 260H482L502 291L482 322H442Z M445 266H478 M493 291L477 315 M447 315L430 291')
path('M395 291H422 M502 291H542L562 260H601 M548 294L568 266 M442 322L430 341 M408 353H382')
last(381,300,'HO');lab(421,363,'O')
# Cấu trúc (7) dùng đỉnh riêng và đầu mạch quay lên-trái, không dịch mẫu (6).
path('M741 302L761 271H801L821 302L801 333H761Z M764 277H797 M812 302L797 326 M766 326L749 302')
path('M716 302H741 M821 302H860L880 271L855 236 M856 296L873 271 M761 333L749 351 M727 364H701')
last(701,311,'HO');lab(741,373,'O')
path('M1019 307L1032 288H1071L1091 257L1072 226 M1067 282L1084 257')
last(1009,329,'H₂N')
for x,y,t in [(137,195,'(1)'),(431,195,'(2)'),(771,195,'(3)'),(1040,195,'(4)'),(127,402,'(5)'),(466,402,'(6)'),(775,402,'(7)'),(1038,402,'(8)')]:lab(x,y,t,24)
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1167" height="442" viewBox="0 0 1167 442"><title>Tám cấu trúc theo nguồn820</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='isomers820-native-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
note='8individualstructures4-4-4-6-6-10-10-4C=48C10O2N/14CCdouble6Phinner8chain/2Ph3innerCCeach/2H2N-LASTN-SUB2-4HO-LASTO-2COOH-FIRSTC-CONDENSEDnoexpandedCO/8regularUPRIGHTparenthesizednums1..8/ALLregularUPRIGHTBLACKthinuniform/0stereo-heads-charge-crops/individualnonperiodicvertices-rays-noalias2-3-6-7/NOaddedH-formula-name-condition-answer/nativeapproxNOTsubpixel'
r=dict(i=820,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung=note)
(K/'cau-truc-isomers820-native-ddh-lo-433-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
(K/'doc-isomers820-lo-433.json').write_text(json.dumps(dict(hash=h,native=[1167,442],questions=qs,ghiChu=note,rootSourceAudit='RootOWNnativeFULL/all1publicde11-C3-B13-I-1; OWNtopL/topR/botL/botR3x. 48C10O2N; source2/3 and6/7 eachindividualnonperiodicgeometry/chainorientation. AllregularUPRIGHT including8nums. 2H2NlastN,4HOlastO,2COOHfirstC-condensed. Noanswers/addedH/stereo/crops.'),ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
