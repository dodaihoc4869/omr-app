"""Bộ chưng cất nguồn587: giữ sáu nhãn và hướng nước, không thêm nhiệt kế."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];M=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
r=next(r for r in json.loads((M/'doc-chi-tiet-con-lai-lo-155.json').read_text())if r['i']==587)
b='<g transform="translate(25 20) scale(2)" stroke-linejoin="round" stroke-linecap="round">'
for x in [45,283]:b+=f'<path d="M{x} 5V273" stroke="#626269" stroke-width="5"/><path d="M{x-1} 5V273" stroke="#b8b8bd" stroke-width="1"/>'
b+='<path d="M26 272H183L194 285H18ZM220 273H345L355 284H212Z" fill="#ddd" stroke="#44434b" stroke-width=".9"/><path d="M20 130H104M32 197H150M272 111H294" stroke="#999" stroke-width="3"/>'
for x,y in [(45,130),(45,197),(283,110)]:b+=f'<ellipse cx="{x}" cy="{y}" rx="9" ry="3" fill="#888"/>'
b+='<path d="M103 104V143C72 156 82 191 110 193C139 191 146 159 119 143V104Z" fill="#fff" stroke="#44434b" stroke-width="1"/><path d="M87 174H135Q132 189 111 191Q92 189 87 174Z" fill="#ddd"/><path d="M101 102H121V108H101ZM104 112H118" fill="#888" stroke="#44434b" stroke-width="1"/><path d="M108 102V61Q108 50 119 52L179 73L178 79L119 57Q114 55 114 62V102" fill="#fff" stroke="#44434b" stroke-width="1"/>'
b+='<path d="M181 75L367 139L365 145L179 81Z" fill="#fff" stroke="#44434b" stroke-width="1"/><path d="M208 75L358 125Q369 133 356 144L200 90Q189 81 208 75Z" fill="#fff" stroke="#44434b" stroke-width="1"/><path d="M201 81L360 135M199 86L357 140" stroke="#44434b" stroke-width=".9"/><path d="M215 78L217 73Q219 71 222 73L229 75L228 79L222 77L221 80M335 137L332 144Q331 146 334 147L341 149L342 145L337 143L339 139" fill="#fff" stroke="#44434b" stroke-width="1"/><path d="M174 65L180 67L176 79L170 77ZM378 138L385 140L381 152L374 150Z" fill="#888" stroke="#44434b" stroke-width=".8"/><path d="M367 139L415 156Q427 161 427 175V181H422V174Q422 165 413 162L365 145Z" fill="#fff" stroke="#44434b" stroke-width="1"/>'
b+='<path d="M419 181V190L397 243Q416 251 449 243L430 190V181Z" fill="#fff" stroke="#44434b" stroke-width="1"/><ellipse cx="424" cy="181" rx="7" ry="3" fill="#fff" stroke="#44434b" stroke-width=".8"/><path d="M400 238Q421 243 446 238M403 244Q424 249 444 244" fill="none" stroke="#aaa" stroke-width="1"/><path d="M398 249H449V285H398Z" fill="#fff" stroke="#44434b" stroke-width="1"/>'
for x in range(400,448,8):b+=f'<path d="M{x} 283Q{x+13} 251 400 254" fill="none" stroke="#777" stroke-width=".8"/>'
b+='<path d="M82 196H151V200H82Z" fill="#ddd" stroke="#44434b" stroke-width="1"/>'
for x in range(84,151,5):b+=f'<path d="M{x} 196l3 4" stroke="#666" stroke-width=".6"/>'
b+='<path d="M105 230Q68 233 91 266H132Q155 234 117 230V220H105Z" fill="#fff" stroke="#44434b" stroke-width="1"/><path d="M105 220H117V225H105Z" fill="#ddd" stroke="#44434b" stroke-width="1"/><path d="M109 219Q100 208 111 203Q121 211 115 219Z" fill="#c5c5c8"/><path d="M109 231Q105 244 116 248Q121 253 114 262" fill="none" stroke="#888" stroke-width="1"/>'
# Kẹp sinh hàn trước ống, nối với trụ phải theo vệt xám trong nguồn.
b+='<path d="M273 104L282 105L295 109L296 119L286 119M276 107L275 115L287 119M278 104V100L288 103" fill="none" stroke="#999" stroke-width="3"/>'
# Sáu nhãn đúng nguồn, dùng DDH và giữ leader không đầu nhọn trừ hai dòng nước.
for x,y,t in [(210,56,'Nước ra'),(382,117,'Sinh hàn'),(352,171,'Nước vào'),(195,166,'Bình cầu'),(219,195,'Lưới amiăng'),(338,235,'Bình hứng')]:b+=F.label(x,y,t,13)
b+='<path d="M226 64L254 72M250 69L254 72L249 72M338 157L315 150M319 150L315 150L318 153M347 115H304M162 164H137M169 190L143 193M379 230L407 236" fill="none" stroke="#44434b" stroke-width=".85"/></g>'
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="640" viewBox="0 0 1000 640"><title>Bộ chưng cất theo nguồn sáu nhãn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='chung-cat-ddh-'+hh+'.svg';(M/fn).write_bytes(raw);r.update(svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',ghiChuDung='2stands/flaskmeshspiritlamp/2wall inclinedcondenser/portsupperOUTlowerIN/receiverwoodblock/6labels;khôngthermometer/numbers/khôngđoáncount giọt mờ.')
(M/'cau-truc-chung-cat-ddh-lo-158-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2))
