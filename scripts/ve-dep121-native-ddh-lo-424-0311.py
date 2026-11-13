"""Saccharose nguồn292: hai vòng nét mảnh, giữ từng H và hướng nhóm chữ."""
from pathlib import Path
import json,hashlib,importlib.util
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='16f75e78c9fc27f3d880277707323e22b1d9688ff63b0d753828f276e138094f';b=''
def path(d,w=1.5):
 global b
 b+=f'<path d="{d}" fill="none" stroke="#000000" stroke-width="{w}" stroke-linecap="butt" stroke-linejoin="round"/>'
def lab(x,y,t,z=24,anchor='middle'):
 global b
 b+=F.label(x,y,t,z,anchor=anchor,fill='#000000')
def arrow(x,y,e):
 global b
 path(f'M{x} {y}H{e-3}',2)
 b+=f'<path d="M{e} {y}L{e-17} {y-4}L{e-15} {y}L{e-17} {y+4}Z" fill="#000000"/>'
# Từng đỉnh riêng theo native121, không lấy bản982 làm hình chung.
path('M12 64L49 42.5L87 64L125 42.5L163 64V109L125 130L87 109L49 130L12 109Z M87 64V109')
path('M21 66L47 53 M21 106L47 120 M80 71V102 M129 53L154 67 M129 120L154 106')
lab(216,99,'+');lab(264,99,'4O₂');arrow(301,89,487)
def condition(cx,top,bottom,percent):
 # Chu hoa chat thang; rieng phan tram nghieng nhu ban goc.
 lab(cx,top,'V₂O₅, t',24)
 lab(cx+50,top-12,'o',19)
 lab(cx-29,bottom,'H₁ =',24)
 global b
 b+=f'<g transform="translate({cx+41} {bottom}) skewX(-10)">'+F.label(0,0,percent,24,fill='#000000')+'</g>'
condition(386,77,119,'75%')
# Hai anhydride dựng RIÊNG, không dịch chung một mẫu.
path('M508 64L545 43.5L583 64V109L545 130L508 109Z')
path('M515 71V101 M549 53L575 67 M549 119L575 105')
path('M583 64L621 53H625L641 73 M641 100L625 122H621L583 109')
path('M635 25L621 49.5 M641 29L625 55 M621.5 122L629 150 M626.96 119.305L637 147')
lab(647,93,'O');lab(647,22,'O');lab(636,171,'O')
lab(719,101,'+');lab(777,101,'2CO₂');lab(827,101,'+');lab(872,101,'H₂O')
path('M6 220L44 198.5L82 220V265L44 286L6 265Z')
path('M14 227V258 M48 209L74 223 M48 276L74 262')
path('M82 220L122 208H124L140 229 M140 256L124 277H120L82 265')
path('M136 180L121 204 M142 184L125 210 M120.5 277L128 305 M127 273.0625L135 301')
lab(148,248,'O');lab(147,177,'O');lab(135,326,'O')
lab(201,253,'+');lab(280,253,'2C₂H₅OH');arrow(352,248,538);condition(437,236,278,'85%')
path('M555 225L593 203.5L630 225V270L593 291L555 270Z M630 225L660 211 M630 270L660 281')
path('M562 232V263 M597 214L622 228 M597 280L622 266')
lab(664,211,'COOC₂H₅',24,'start');lab(664,294,'COOC₂H₅',24,'start');lab(801,259,'+');lab(851,260,'H₂O')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="897" height="336" viewBox="0 0 897 336"><title>Hai phản ứng nguồn121</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='dep121-native-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
note='2literalreactions2FILLEDrightheads/BOTHV2O5,tSUPo-BOTHH1=75%85%/ALLregularUPRIGHT-onlypercentITALIC/2anhydrides4COsplitfeet-upperLEFTFREEgap-upperRIGHTcontact-lowerBOTHcontact/2condensedCOOC2H5FIRSTC/0croppedprose/noaddedH-theoryfix-answer-alias729982/nativeapproxNOTsubpixel'
r=dict(i=121,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung=note)
(K/'cau-truc-dep121-native-ddh-lo-424-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
(K/'doc-dep121-lo-424.json').write_text(json.dumps(dict(hash=h,native=[897,336],questions=qs,ghiChu=note,rootSourceAudit='Root OWNnativeFULL/all1publicde DH-12-C1-B3-D2-III-5. BothH1, noTOPfragments; native897336. Noalias729982.'),ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
