"""Nguồn1180: hai đường nồng độ; không thêm tên chất hoặc thông số thời gian."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='d61e0d2e63e6262bab77f0f8d06b9d0073acf224a002ece48e60b84d507fa1c6';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh'] if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
b='<path d="M134 133H612 M134 239H612" fill="none" stroke="#888888" stroke-width="2.5" stroke-dasharray="5 5"/>'
b+='<path d="M134 133C161 158 189 187 226 207C258 226 291 232 333 234C410 239 526 239 613 239 M134 339C157 310 175 283 194 258C226 217 262 186 304 169C378 142 483 139 612 134" fill="none" stroke="#252440" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>'
b+='<path d="M134 46V340H624 M127 133H140 M127 239H141" fill="none" stroke="#252440" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M128 59L134 43L140 59 M612 334L628 340L612 346" fill="none" stroke="#252440" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>'
b+=F.label(124,145,'1',27,anchor='end')+F.label(124,250,'0,5',27,anchor='end')+F.label(607,374,'Thời gian phản ứng',26,anchor='end')
# Số mũ dùng PATH DDH cỡ nhỏ; không phụ thuộc glyph superscript ngoài font.
a='Nồng độ (mol L';z=25;w=F.advance(a,z);sup=F.advance('−1',16);closing=F.advance(')',z);start=-(w+sup+closing)/2
b+='<g transform="translate(73 198) rotate(-90)">'+F.label(start,0,a,z,anchor='start')+F.label(start+w,-10,'−1',16,anchor='start')+F.label(start+w+sup,0,')',z,anchor='start')+'</g>'
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="671" height="413" viewBox="0 0 671 413"><title>Đồ thị nồng độ hai chất theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='nong-do-hai-chat-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=1180,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='2monotoniccurves1rising0to1-1falling1to0comma5/2dashedhorizontallevels/2openVaxisheads/2Yticks1and0comma5/rotatedNồng độ(mol Lsupminus1)/Thời gian phản ứng/regularDDH/noaddedXY-zero-timevalues-grid-equation-answer.')
(K/'cau-truc-nong-do-hai-chat-ddh-lo-293-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(fn)
