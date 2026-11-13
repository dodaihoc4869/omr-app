"""Saccharose nguồn292: hai vòng nét mảnh, giữ từng H và hướng nhóm chữ."""
from pathlib import Path
import json,hashlib,importlib.util
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='314ed47bdb67e225b36943b82c968ae3504991a538e8a766b5169054cea1af57';b=''
def path(d,w=1.3):
 global b
 b+=f'<path d="{d}" fill="none" stroke="#000000" stroke-width="{w}" stroke-linecap="butt" stroke-linejoin="round"/>'
def lab(x,y,t,z=26,anchor='middle'):
 global b
 b+=F.label(x,y,t,z,anchor=anchor,fill='#000000')
def first(x,y,t,z=26):lab(x-F.advance(t[0],z)/2,y,t,z,'start')
def last(x,y,t,z=26):lab(x+F.advance(t[-1],z)/2,y,t,z,'end')
# Vòng sáu cạnh trái: các đường đều mảnh, không tự thêm nêm lập thể.
path('M37 124L71 70H140 M161 82L186 126L153 183 M71 183L37 124')
path('M71 183H153',2)
path('M71 39V94 M37 93V159 M71 155V214 M153 156V214 M186 94V126')
lab(154.5,79,'O');first(71,32,'CH₂OH');lab(71,117,'H');lab(37,88,'H');last(37,182,'HO');first(71,152,'OH');lab(71,236,'H');lab(153,153,'H');first(153,238,'OH');lab(186,91,'H')
# Cầu O: hai nhánh dừng trước chữ O, giữ khoảng trắng của glyph.
path('M186 126L221 146 M250 146L284 126');lab(235,164,'O')
# Vòng năm cạnh phải: HO trên C2 neo theo O cuối, không đổi thành OH.
path('M284 126L345 90 M374 89L434 124L399 183 M317 183L284 126')
path('M317 183H399',2)
path('M284 66V126 M317 158V212 M399 157V213 M434 95V158')
lab(359,92,'O');first(284,59,'CH₂OH');lab(317,155,'H');first(317,239,'OH');last(399,155,'HO');lab(399,236,'H');lab(434,92,'H');first(434,180,'CH₂OH')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="522" height="251" viewBox="0 0 522 251"><title>Saccharose theo nguồn292</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='suc292-native-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
note='12C11O-5freeOH3CH2OH8hydroxylO-2ringO1bridgeO/8standaloneH/LEFTsixRIGHTfiveRings-0TAPER0wedge-2uniformhorizontalFronts2px-othersTHIN/ALLregularUPRIGHTBLACK-SUB2-FIRSTC-FIRSTO-2literalHOLASTO/3CH2OH-leftUP-rightleftUP-rightrightDOWN/0nums-caption-arrows-charge/NOaddedH-OH-stereo-alphaBeta-answer-alias/nativeapproxNOTsubpixel'
r=dict(i=292,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung=note)
(K/'cau-truc-suc292-native-ddh-lo-422-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
(K/'doc-suc292-lo-422.json').write_text(json.dumps(dict(hash=h,native=[522,251],questions=qs,ghiChu=note,rootSourceAudit='Root OWNnativeFULL4x/LEFT-RIGHT4x/fronts4x/allpublicde. 12C11O5freeOH3CH2OH8standaloneH. LEFT6RIGHT5rings. NoTAPER, twohorizontalfront2pxuniform, remainingthin. TwoHOlastO leftdown-rightup, allregularblack. NativeapproxnotSubpixel.'),ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
