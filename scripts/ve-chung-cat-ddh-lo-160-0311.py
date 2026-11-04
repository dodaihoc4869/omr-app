"""Chưng cất nguồn1024: năm nhãn số, nhiệt kế và ba giọt đọc rõ."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];M=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
r=next(r for r in json.loads((M/'doc-chi-tiet-con-lai-lo-155.json').read_text())if r['i']==1024)
b='<defs><clipPath id="jacket"><path d="M319 197Q332 190 343 195L564 281Q586 293 576 307Q571 319 564 315L319 230Q302 221 312 205Z"/></clipPath><clipPath id="flask"><path d="M187 250C137 272 136 340 177 367Q203 385 232 365C276 331 267 277 220 250V126H187Z"/></clipPath></defs><g transform="translate(15 15)" stroke-linejoin="round" stroke-linecap="round">'
for x,y in [(84,87),(442,84)]:b+=f'<path d="M{x-3} 529V{y}H{x+3}V529Z" fill="#fff" stroke="#252440" stroke-width="2"/>'
b+='<path d="M11 528H316L329 540L315 549H256L242 532H74L63 548H11ZM379 530H519L525 543H500L496 535H405L399 550H368Z" fill="#fff" stroke="#252440" stroke-width="2"/>'
for y in [208,385]:
 b+=f'<path d="M42 {y}H187" stroke="#171719" stroke-width="8"/><path d="M61 {y+28}L111 {y-29}" stroke="#171719" stroke-width="7"/><rect x="58" y="{y-10}" width="74" height="20" fill="#171719"/><circle cx="84" cy="{y}" r="10" fill="#fff" stroke="#171719" stroke-width="2"/>'
b+='<path d="M187 250C137 272 136 340 177 367Q203 385 232 365C276 331 267 277 220 250V126H187Z" fill="#fff" stroke="#252440" stroke-width="2"/><g clip-path="url(#flask)" stroke="#555" stroke-width="1.5"><path d="M150 330H260M150 334H260"/>'
for y,xs in [(340,[161,190,225]),(350,[171,203,234]),(360,[182,213])]:
 for x in xs:b+=f'<path d="M{x} {y}h12"/>'
b+='</g><path d="M220 169L613 316Q646 326 646 349V414M220 177L610 326Q630 337 630 352V414" fill="none" stroke="#252440" stroke-width="2"/><path d="M250 170L276 179Q294 187 287 199Q282 211 269 207L245 196Z" fill="#fff" stroke="#252440" stroke-width="2"/><path d="M246 176L279 189M244 187L277 199" stroke="#252440" stroke-width="2"/>'
b+='<path d="M319 197Q332 190 343 195L354 200L359 191L366 194L362 207L564 281Q586 293 576 307Q571 319 564 315L538 306L531 330L523 327L529 303L319 230Q302 221 312 205Z" fill="#fff" stroke="#252440" stroke-width="2"/><g clip-path="url(#jacket)" stroke="#555" stroke-width="1.2">'
for y in range(208,313,14):b+=f'<path d="M310 {y}H580"/>'
b+='</g><path d="M310 202L575 302M310 213L575 313" stroke="#252440" stroke-width="2"/><path d="M425 226L455 236M432 278L456 287" stroke="#171719" stroke-width="9"/><path d="M590 304L600 307L596 330L587 327" fill="#fff" stroke="#252440" stroke-width="2"/>'
b+='<path d="M187 378H258V387H187M197 387V393M250 387V393" fill="#171719" stroke="#171719" stroke-width="2"/><path d="M197 421H220V451H197Z" fill="#171719"/><path d="M196 419Q193 410 199 405Q203 416 208 408L212 402Q226 411 218 421" fill="#fff" stroke="#252440" stroke-width="2"/><path d="M197 449Q160 455 162 480Q162 502 182 524L179 529H241L239 523Q260 501 257 477Q256 458 220 449Z" fill="#fff" stroke="#252440" stroke-width="2"/><path d="M209 451L198 518Q202 525 217 525M204 455L192 518Q193 526 209 527M164 475H257M166 480H255M169 495h17M223 495h25M176 508h17M220 510h19" fill="none" stroke="#555" stroke-width="1.5"/>'
b+='<path d="M614 394V414L569 540Q566 555 580 555H685Q702 555 699 540L654 414V394" fill="#fff" stroke="#252440" stroke-width="2"/><path d="M577 520H691M576 526h24M612 526h23M649 526h30M582 539h22M618 539h24M655 539h25M588 548h23M624 548h24M661 548h20" stroke="#555" stroke-width="1.5"/>'
for x,y,tip in [(632,449,439),(639,482,470),(630,509,499)]:b+=f'<path d="M{x-2} {tip}Q{x-10} {y+9} {x} {y+11}Q{x+9} {y+9} {x-2} {tip}Z" fill="#fff" stroke="#252440" stroke-width="1.7"/>'
b+='<path d="M199 207V15Q202 6 205 15L206 207Q202 216 199 207Z" fill="#fff" stroke="#252440" stroke-width="1.6"/><path d="M185 115H222V130H185Z" fill="#171719"/>'
# Vạch ký họa nhiệt kế, không thêm nhãn số.
for y in range(35,201,12):b+=f'<path d="M200 {y}h3" stroke="#555" stroke-width="1"/>'
for x,y,t in [(279,32,'Nhiệt kế'),(515,357,'(1)'),(370,166,'(2)'),(521,208,'(3)'),(314,310,'(4)'),(717,456,'(5)'),(320,467,'Đèn cồn')]:b+=F.label(x,y,t,26)
b+='<path d="M241 44L203 56M522 223L491 265M283 302L258 314M699 474L662 493M290 474L232 495" stroke="#252440" stroke-width="1.7" fill="none"/></g>'
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="790" height="600" viewBox="0 0 790 600"><title>Chưng cất nguồn có nhiệt kế và năm nhãn số</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='chung-cat-so-ddh-'+hh+'.svg';(M/fn).write_bytes(raw);r.update(svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',ghiChuDung='2stands/thermometer/5numberlabels/Đèncồn/2wallvaportube+condenser/3dropsRÕ,khôngthêmflowarrows.')
(M/'cau-truc-chung-cat-ddh-lo-160-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2))
