"""Nguồn1244: công thức nguyên văn, hai tia carbonyl và đầu mạch riêng."""
from pathlib import Path
import json,hashlib,importlib.util
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='e1d77276d17b8df04bf033c3382f6784041154c75ee93a2841ebd95164059b38';b=''
def path(d,fill='none',w=1.8):
 global b
 b+=f'<path d="{d}" fill="{fill}" stroke="#202020" stroke-width="{w}" stroke-linecap="butt" stroke-linejoin="round"/>'
def line(v):path('M'+'L'.join(f'{x} {y}'for x,y in v))
def lab(x,y,t,z=25,anchor='middle'):
 global b
 b+=F.label(x,y,t,z,anchor=anchor,fill='#202020')
def first(x,y,t,z=25):lab(x-F.advance(t[0],z)/2,y,t,z,'start')
def last(x,y,t,z=25):lab(x+F.advance(t[-1],z)/2,y,t,z,'end')
lab(7,98,'n',24);last(62,98,'H₂C');lab(112,98,'C');first(158,98,'COO');first(245,98,'CH₃')
line([[77,86],[97,86]]);line([[77,93],[97,93]]);line([[124,90],[146,90]]);line([[211,90],[232,90]])
line([[111,104],[111,123]]);first(111,145,'CN')
line([[299,92.5],[391,92.5]]);path('M391 92.5 L375 88 L376 92.5 L375 97 Z','#202020',0)
lab(344,73,'+ H₂O',24)
last(443,100,'HO');first(492,100,'CH₂');lab(572,100,'C');lab(699,100,'H')
line([[458,92.5],[477,92.5]]);line([[534,92.5],[557,92.5]]);line([[584,92.5],[685,92.5]])
line([[572,106],[572,124]]);first(572,147,'CN')
line([[571.5,77],[571.5,46],[597,31]])
# Hai tia lệch chân theo nguồn: tia trên tự do, tia dưới chạm thân dọc.
line([[547,26],[573,42]]);line([[542,33],[571.5,49]])
lab(531,29,'O');lab(612,29,'O');line([[627,30],[654,45]])
path('M483 31 Q464 84 483 138');path('M665 31 Q683 84 665 138');lab(686,126,'n',23)
lab(918,100,'(1)',28)
# Chỉ giữ các mảnh chữ đã bị cắt ở y0, không phục hồi chữ từ ngữ cảnh.
path('M105 0 L112 0 L111 1.5 L106 1.5 Z','#202020',0)
path('M191 0 Q198 4 204 0',w=1.4)
path('M287 0 L294 0 L293 1.5 L288 1.5 Z','#202020',0)
path('M395 0 Q402 4 408 0',w=1.4)
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="963" height="162" viewBox="0 0 963 162"><title>Công thức theo nguồn1244</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='cyano1244-native-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
note='10drawnC4O2N-EXCLwater-UNKNOWNpolymerTotal/LEFTnBASELINE-H2C=C(CN)-COO-CH3/RIGHTHO-CH2-C(CN)-bareCO-O-bareMethyl-H/1ROUNDpair+nSUB/CO2offsetraysUPPERfootFREEwhitegap-LOWERfootCONTACTverticalstem/1FULLFILLEDrighthead/+H2O/(1)farRIGHT/ALLregularUPRIGHTSUB23/4TOPcroppedUNKNOWNfragmentsretain/NOaddedn-methyltext-condition-answer-alias/nativeapproxNOTsubpixel'
r=dict(i=1244,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung=note)
(K/'cau-truc-cyano1244-native-ddh-lo-408-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
(K/'doc-cyano1244-lo-408.json').write_text(json.dumps(dict(hash=h,native=[963,162],questions=qs,ghiChu=note,rootSourceAudit='Root OWNnativeFULL2x/CO8x/TOPcrop5x. UpperCOfoot whitegap; lowercontact. NativeapproxNOTsubpixel, no automaticpixelgate.'),ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
