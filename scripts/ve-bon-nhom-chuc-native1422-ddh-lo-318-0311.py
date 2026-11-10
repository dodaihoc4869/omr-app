"""Bốn nhóm chức1422: giữ O–H, đầu nối tự do và hai chân carbonyl riêng."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='ff28eaaa483a7c1950a589db0221bf59f2b8615a63bcfe075476dc2f4032ed64';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh'] if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
def label(x,y,t,z=35,weight='de'):return F.label(x,y,t,z,fill='#111',weight=weight)
def path(d):return f'<path d="{d}" fill="none" stroke="#111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
b=path('M43 83H84L98 107 M82 81L104 58 M88 86L110 63 M124 119H141')
b+=label(116,58,'O')+label(108,130,'O')+label(157,130,'H',35,'dam')
b+=path('M293 85H335L350 109 M333 83L355 60 M339 88L361 65 M375 120H394')
b+=label(367,60,'O')+label(359,132,'O')
b+=path('M502 89H544L557 113 M542 87L564 64 M548 92L570 69')
b+=label(576,65,'O')+label(571,133,'H',35,'dam')
b+=path('M751 96H793L814 131 M791 94L813 71 M797 99L819 76')+label(825,72,'O')
for x,t in [(99,'(I)'),(354,'(II)'),(570,'(III)'),(779,'(IV)')]:b+=label(x,189,t,32,'dam')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="870" height="231" viewBox="0 0 870 231"><title>Bốn nhóm chức theo nguồn1422</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='bon-nhom-chuc-native1422-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=1422,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='4COdouble2splitfeetEACH/6Oregular2HactualDAM/4RomancaptionsactualDAMupright/IexplicitO-H/IIrightMIDHEIGHTfreebondNOTcharge/IIIexplicitH/IV2barearms/allthin/noaddedcharges-H-CH3-names-answer')
(K/'cau-truc-bon-nhom-chuc-native1422-ddh-lo-318-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
