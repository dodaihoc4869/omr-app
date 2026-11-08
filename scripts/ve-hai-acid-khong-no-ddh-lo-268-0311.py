"""Nguồn796: hai mạch18C, giữ đúng vị trí liên kết đôi và chữ hoa caption nguồn."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='9469f3a8d9b2c41305c0b3e58c4363b1097adaedc0aa99ce2411087ab009ca9f';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh'] if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
def line(d):return f'<path d="{d}" fill="none" stroke="#252440" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>'
top=[(53,98),(78,79),(104,98),(129,79),(154,98),(180,79),(208,79),(235,98),(262,79),(289,79),(315,98),(341,79),(366,98),(392,79),(418,98),(443,79),(468,98),(493,79)]
bottom=[(56,197),(80,216),(106,197),(131,216),(156,197),(182,216),(209,216),(236,197),(263,216),(291,216),(316,197),(342,216),(369,216),(396,197),(421,216),(447,197),(472,216),(497,197)]
b='<g transform="translate(20 20)">'
for pts in [top,bottom]:b+=line('M'+'L'.join(f'{x} {y}'for x,y in pts))
# Nét song song của5liên kếtC=C nằm phía trong literal zigzag,không thêmnêm/stereo.
for d in ['M181 84H207','M263 84H288','M183 211H208','M264 211H290','M343 211H368','M489 82V50 M497 82V50 M493 79L508 89','M493 200V169 M501 200V169 M497 197L512 207']:b+=line(d)
b+=F.label(493,46,'O',22)+F.label(497,165,'O',22)+F.label(509,105,'OH',22,'start')+F.label(513,223,'OH',22,'start')
b+=F.label(298,137,'Linoleic Acid',21)+F.label(346,255,'Linolenic Acid',21)
b+='</g>';raw=('<svg xmlns="http://www.w3.org/2000/svg" width="636" height="335" viewBox="0 0 636 335"><title>Hai mạch acid không no theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='hai-acid-khong-no-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=796,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='2open18Cchains/36C4O/2COOH-OHright/top2CCdouble-bottom3CCdouble/2COdouble/18verticesEACHinclCO/freeLEFTends/captionEXACTLinoleic Acid-Linolenic Acid/noaddedH-nums-labelXYA-glycerol-triester-answer.')
(K/'cau-truc-hai-acid-khong-no-ddh-lo-268-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(fn)
