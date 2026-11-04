"""Dựng bát sứ và thiết bị khuấy theo nguồn82, không thêm sản phẩm phản ứng."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];M=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
r=next(r for r in json.loads((M/'doc-chi-tiet-con-lai-lo-155.json').read_text())if r['i']==82)
b='<defs><clipPath id="mesh"><path d="M147 212H333L289 303H94Z"/></clipPath></defs><g transform="translate(15 15) scale(2)" stroke-linejoin="round" stroke-linecap="round">'
b+='<path d="M125 303L116 376M281 303L294 374M321 240L328 292" stroke="#398e9b" stroke-width="8"/><path d="M147 212H333L289 303H94Z" fill="#fff" stroke="#44434b" stroke-width="1.2"/><g clip-path="url(#mesh)" stroke="#44434b" stroke-width=".9">'
for x in range(90,340,7):b+=f'<path d="M{x} 210V306"/>'
for y in range(212,306,7):b+=f'<path d="M90 {y}H335"/>'
b+='</g><ellipse cx="205" cy="347" rx="44" ry="26" fill="#fff" stroke="#839cad" stroke-width="1.3"/><path d="M163 347H247M171 358H239M184 365H226" stroke="#acc6d5" stroke-width="1"/><path d="M204 310Q198 320 199 326Q187 337 207 342Q230 348 215 358Q207 363 195 369" fill="none" stroke="#202124" stroke-width="2.2"/><path d="M195 302Q202 309 210 302L214 309H194Z" fill="#a43e37"/><path d="M202 303Q196 297 204 292Q210 300 207 304Z" fill="#d95c3e"/><path d="M177 370H232V380H177Z" fill="#202124"/>'
b+='<path d="M148 189Q144 242 164 281Q177 301 204 301Q230 302 247 281Q271 246 272 196" fill="#fff" stroke="#758397" stroke-width="1.6"/><path d="M160 256Q174 240 207 240Q240 240 256 258Q246 291 215 297Q178 297 160 256Z" fill="#fbfba0"/><ellipse cx="210" cy="192" rx="62" ry="25" fill="none" stroke="#758397" stroke-width="1.6"/><path d="M256 61L208 270" stroke="#d2eaf3" stroke-width="8"/><path d="M255 61L207 268" stroke="#91c9df" stroke-width="2.5"/><path d="M263 85Q239 76 222 92Q213 105 240 116Q260 120 278 104M265 106L278 104L272 117" fill="none" stroke="#657a8d" stroke-width="1.5"/><path d="M128 185L185 268" fill="none" stroke="#758397" stroke-width="1.2"/>'
for x,y,t in [(63,58,'Liên tục khuấy'),(63,88,'bằng đũa thủy tinh'),(32,140,'2 mL dầu ăn'),(32,173,'5 mL dung dịch'),(32,206,'NaOH 40%')]:b+=F.label(x,y,t,16 if y<100 else 18,'start','#ad4645')
b+='</g>'
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="780" height="860" viewBox="0 0 780 860"><title>Bát sứ khuấy dầu ăn và NaOH theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='bat-su-ddh-'+hh+'.svg';(M/fn).write_bytes(raw);r.update(svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',ghiChuDung='Bát sứ/liquid vàng/đũa/arrow khuấy/mesh3chân/lamp;đủ5dòngđỏ2mL5mL40%,khôngthêm sản phẩm/hạt.')
(M/'cau-truc-bat-su-ddh-lo-157-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2))
