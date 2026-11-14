"""Giữ hai đoạn mạch, n và hai nhánh Br riêng theo nguồn117."""
from pathlib import Path
import json,hashlib,importlib.util
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='167a25d1b49b49f4f085516dddc4b74babb5043776ef8c4eb290f2909ecaa6f2';b=''
source=json.loads(Path('/workspace/scratch/source442.json').read_text());g=source['geometry']
def line(v,w=1.6):
 global b
 b+='<path d="M'+'L'.join(f'{x} {y}'for x,y in v)+f'" fill="none" stroke="#202020" stroke-width="{w}" stroke-linecap="butt" stroke-linejoin="round"/>'
def lab(x,y,t,z=32,anchor='start'):
 global b
 b+=F.label(x,y,t,z,weight='de',anchor=anchor,fill='#202020')
for key in ['leftSingleBonds','leftCCdoubleRays','rightSingleBonds']:
 for v in g[key]:line(v)
for x,y,t in [(79,140,'CH₂'),(170,140,'C'),(212,140,'CH'),(292,140,'CH₂'),(173,81,'CH₃'),(378,158,'n'),(749,142,'CH₂'),(840,142,'C'),(895,142,'CH'),(975,142,'CH₂'),(841,83,'CH₃'),(837,193,'Br'),(896,194,'Br'),(1058,160,'n')]:lab(x,y,t)
lab(447,141,'+');lab(475,141,'nBr₂')
# Mỗi ngoặc được đặt riêng; không ép thành cùng một phép tịnh tiến.
b+='<path d="M79 100C65 109 65 153 79 165 M365 100C379 111 379 152 365 165 M749 102C735 113 735 155 749 167 M1043 102C1057 113 1057 155 1043 167" fill="none" stroke="#202020" stroke-width="1.3"/>'
line([[561,135],[663,135]])
b+='<path d="M659 131L666 135L659 139Z" fill="#202020"/>'
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1132" height="246" viewBox="0 0 1132 246"><title>Phản ứng theo nguồn117</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='poly117-bromine-native-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
note='10printedC16printedH4Brinclreagent-SYMBOLICnNOTpolymermolecularformula/LEFTCH2-C(CH3)=CH-CH2+ nBr2→RIGHTCH2-C(CH3)(Br)-CH(Br)-CH2/1CCdouble2separaterays/4individualROUND2nSUBupright/1tinyFILLEDrighthead/ALLregularUPRIGHT-sub23-FIRSTC-FIRSTBanchors/0stereo-charge-caption-condition/noaddedH-HBr-name-answer/nativeapproxNOTsubpixel/scanbackgroundflecksNOTchemicalbonds-particles'
r=dict(i=117,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung=note)
(K/'cau-truc-poly117-bromine-native-ddh-lo-442-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
(K/'doc-poly117-lo-442.json').write_text(json.dumps(dict(hash=h,native=[1132,246],questions=qs,ghiChu=note,independentSourceAudit=source,rootSourceAudit='Root OWN nativeFULL+FULL2x/all1de12-KT-C1234-D2-I-8/head12x confirms FILLEDtinytriangle/ALLregularUPRIGHT/10printedC16printedH4Brinclreagent UNKNOWNn. FirstC-FIRSTBanchors; no restored formula/extraHBr-answer. Sparse pale sourcegrain underLEFT is scanbackground, NOT bonds/charges/particles; no invented count.'),ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
