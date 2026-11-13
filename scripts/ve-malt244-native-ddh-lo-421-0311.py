"""Maltose nguồn244: hai vòng, các chân nêm và liên kết lượn riêng theo native."""
from pathlib import Path
import json,hashlib,importlib.util
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='2a36b01f67bd6be6a792cb328a5e329758c0453ec029433239c8b844b6e2d77c';b=''
def path(d,w=1.2):
 global b
 b+=f'<path d="{d}" fill="none" stroke="#000000" stroke-width="{w}" stroke-linecap="butt" stroke-linejoin="round"/>'
def fill(d):
 global b
 b+=f'<path d="{d}" fill="#000000"/>'
def lab(x,y,t,z=22):
 global b
 b+=F.label(x,y,t,z)
def first(x,y,t,z=22):
 global b
 b+=F.label(x-F.advance(t[0],z)/2,y,t,z,anchor='start')
# Vòng trái: các chân rộng thẳng đứng tại C3 và C2, mặt trước 6px.
path('M23 98L91 62H167 M190 69L229 98 M91 62V34 M23 98V124 M77 128V100 M172 128V155')
fill('M23 98L77 125H172L229 98L172 131H77Z')
lab(180,70,'O');first(91,29,'CH₂OH');first(23,144,'OH');first(77,96,'OH');first(172,176,'OH')
# Cầu glycoside, không thêm OH ở C4 vòng phải.
path('M229 98L249 110 M273 110L296 92');lab(261,126,'O')
# Vòng phải dùng đỉnh riêng, không tịnh tiến nguyên mẫu trái.
path('M296 92L363 57H439 M462 66L494 93 M363 57V29 M349 124V96 M443 124V151')
fill('M296 92L349 121H443L494 93L443 127H349Z')
lab(451,65,'O');first(363,24,'CH₂OH');first(349,92,'OH');first(443,171,'OH');first(532,100,'OH')
# Bốn đỉnh và bốn đáy lượn; đầu phải có khoảng trắng trước O của OH.
path('M494 93C495 93 496 95 497 95C498 95 499 90 500 90C501 90 502 95 503 95C504 95 505 90 506 90C507 90 508 95 509 95C510 95 511 90 512 90C513 90 514 95 515 95C516 95 517 90 518 90C518.5 90 519 91.5 519 93',1.6)
for x,y,t in [(229,86,'1'),(171,114,'2'),(78,151,'3'),(29,89,'4'),(83,57,'5'),(77,25,'6'),(497,83,'1'),(441,110,'2'),(349,146,'3'),(299,85,'4'),(354,53,'5'),(349,20,'6')]:lab(x,y,t,14)
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="574" height="185" viewBox="0 0 574 185"><title>Maltose theo nguồn244</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='malt244-native-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
note='12C11O-6freeOH2CH2OH8hydroxylO-2ringO1bridgeO/2Haworth4TAPER2boldfront6pxVERTICALfeet77-172and349-443/12regularnums1..6EACH/RIGHTwave4crests4troughs-LEFTjunction49493-RIGHTfree51993-WHITEgapbeforeOH/ALLregularUPRIGHT-SUB2-FIRSTC-FIRSTO/0standaloneH-caption-arrows/NOextraOHrightC4-alphaBeta-answer-alias64-149/nativeapproxNOTsubpixel'
r=dict(i=244,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung=note)
(K/'cau-truc-malt244-native-ddh-lo-421-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
(K/'doc-malt244-lo-421.json').write_text(json.dumps(dict(hash=h,native=[574,185],questions=qs,ghiChu=note,rootSourceAudit='Root OWNnativeFULL5x/LEFT-RIGHT5x/wave-frontfeet-top15x/allpublicde. 12C11O6freeOH2CH2OH, no OHrightC4. FourTAPERverticalfeet77-172/349-4436px. Fourwavecrest-troughnot8cycles. Allregular black, nativeAAfringenotdatacolors. NativeapproxnotSubpixel.'),ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
