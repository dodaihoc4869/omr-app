"""Triester ba hàng nguồn460: giữ từng đỉnh và hai nối đôi trên hàng giữa."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='53d59b6a279713c1d4fd275f240835a80e4f8dc99f2edd59cee18a90fd71cda1';b=''
rows=[[[77, 52], [117, 77], [156, 52], [196, 77], [235, 52], [275, 77], [314, 52], [353, 77], [393, 52], [432, 77], [472, 52], [511, 77], [551, 52], [591, 77], [630, 52], [670, 77]], [[118, 131], [156, 167], [194, 130], [233, 167], [272, 130], [310, 167], [349, 130], [387, 167], [426, 130], [479, 130], [518, 167], [557, 130], [610, 130], [649, 167], [687, 130], [726, 167], [764, 130], [803, 167]], [[82, 230], [119, 255], [157, 230], [195, 255], [233, 230], [271, 255], [309, 230], [346, 255], [384, 230], [422, 255], [465, 255], [502, 230], [540, 255], [578, 230], [615, 255], [653, 230], [691, 255], [729, 230]]]
def line(a,z):return f'<path d="M{a[0]} {a[1]}L{z[0]} {z[1]}" stroke="#000000" stroke-width="1.8" fill="none"/>'
for row in rows:
 for a,z in zip(row,row[1:]):b+=line(a,z)
for a,z in [((29,89),(7,122)),((7,122),(38,166)),((38,166),(7,211)),((7,211),(32,247)),((38,166),(69,166)),((48,71),(77,52)),((89,159),(118,131)),((48,250),(82,230)),((75,53.31),(75,26)),((79,53.25),(79,26)),((116,132.93),(116,111)),((120,132.89),(120,111)),((80,231.18),(80,212)),((84,231.35),(84,212)),((429,137),(476,137)),((560,137),(607,137)),((423,250),(463,250))]:b+=line(a,z)
for x,y in [(77,25),(37,91),(118,110),(81,180),(82,211),(37,269)]:b+=F.label(x,y,'O',28,fill='#000000')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="810" height="275" viewBox="0 0 810 275"><title>Triester ba hàng theo nguồn460</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='triester460-native-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
r=dict(i=460,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='55C6O/3glycerol+16-18-18acyl/CCdouble0-2-1/3COdouble2raysCONTACTslopingarms/noaddedcrossbar/6OregularUPRIGHT/ALLthinblack/0H0stereo0arrows/noformula-caption-X-answer')
(K/'cau-truc-triester460-native-ddh-lo-365-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
