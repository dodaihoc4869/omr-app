"""Nguồn1173: tinh chế đồng, giữ nguồn trống và hai mẫu điện cực khác nhau."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='d3defda670f51ca32de49f5ad447d04c0e7f9d1ccc9f6805db1632bcf45c6573';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh'] if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
b='<path d="M169 166H459V269Q459 297 433 297H195Q168 297 168 270Z" fill="#e1e1e1"/><path d="M169 100L168 270Q168 297 195 297H433Q459 297 459 269V100 M169 166H458" fill="none" stroke="#777777" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>'
b+='<path d="M223 194V64H290 M338 64H407V194" fill="none" stroke="#777777" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><rect x="290" y="41" width="47" height="47" fill="white" stroke="#777777" stroke-width="2.5"/>'
b+='<path d="M193 202Q198 194 210 192L228 190Q240 181 245 187L248 198Q250 204 256 207Q260 211 253 216L252 225Q259 232 254 238Q259 249 250 254L242 258L231 255Q224 262 216 254Q209 260 204 250Q193 254 195 243Q186 237 194 230L193 220Q201 211 193 208Q190 205 193 202Z" fill="#868686" stroke="#555555" stroke-width="2.5" stroke-linejoin="round"/>'
b+='<path d="M395 190L419 197V251L395 245Z" fill="#868686" stroke="#555555" stroke-width="2.5" stroke-linejoin="round"/><path d="M150 230H192 M471 216H428" stroke="#555555" stroke-width="2" fill="none"/><path d="M419 216L431 211V221Z" fill="#555555"/>'
for x,y,t,z,a in [(314,112,'Nguồn điện',24,'middle'),(29,210,'Đồng không',23,'start'),(29,237,'tinh khiết',23,'start'),(474,211,'Đồng',23,'start'),(474,239,'tinh khiết',23,'start'),(318,289,'Dung dịch CuSO₄',24,'middle')]:b+=F.label(x,y,t,z,anchor=a)
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="604" height="337" viewBox="0 0 604 337"><title>Sơ đồ tinh chế đồng theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='tinh-che-dong-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=1173,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='1openbeakergrayliquid/1blankpowersquare2wires/leftirregularcopper-rightslantedquadrilateral/leftleaderNOhead-rightfilledLEFThead/6regulartextlines4labelblocks/sub4/noaddedpolarity-ions-bubbles-current-masses-answer.')
(K/'cau-truc-tinh-che-dong-ddh-lo-292-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(fn)
