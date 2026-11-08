"""Nguồn751: giữ năm anode, đáy cathode dốc và topology cửa tháo/van theo bản in."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='6a45ad684c147f12c04aac16950a7c34a8f1c58437598c331f0fefda4bf102d4'
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[v for v in q['hinh'] if v['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
b='''<path d="M255 158H616V242H255Z" fill="#c7c7c7"/>
<path d="M255 242H616V274H690V285H621V283L255 262Z" fill="#d3d3d3"/>
<path d="M255 242H616" stroke="#444" stroke-width="2"/>
<rect x="207" y="144" width="429" height="13" fill="#d3d3d3" stroke="#444" stroke-width="2"/>
<rect x="662" y="269" width="11" height="33" fill="#9d9d9d" stroke="#444" stroke-width="2"/>
<path d="M225 120H235V300H621V285H690V294H631V310H225Z" fill="#9d9d9d" stroke="#444" stroke-width="2"/>
<path d="M235 133H255V262L621 283V300H235Z" fill="#0e0e0e" stroke="#444" stroke-width="1.5"/>
<path d="M635 116H646V264H690V274H635Z" fill="#9d9d9d" stroke="#444" stroke-width="2"/>
<path d="M616 129H635V274H616Z" fill="#0e0e0e" stroke="#444" stroke-width="1.5"/>
<path d="M207 74H601V90H576V119H591V136H546V119H560V90H512V119H526V136H480V119H495V90H446V119H461V136H416V119H429V90H380V119H395V136H349V119H364V90H314V119H328V136H283V119H298V90H207Z" fill="#9d9d9d" stroke="#444" stroke-width="2"/>
'''
for x in [293,359,425,490,556]:b+=f'<rect x="{x}" y="129" width="26" height="98" fill="#0e0e0e" stroke="#333" stroke-width="1.5"/>'
b+='''<path d="M654 264Q657 254 667 254Q679 254 682 264Z" fill="#9d9d9d" stroke="#444" stroke-width="2"/>
<ellipse cx="655" cy="250" rx="5" ry="5" fill="#9d9d9d" stroke="#444" stroke-width="2"/>
<ellipse cx="668" cy="250" rx="7" ry="7" fill="#9d9d9d" stroke="#444" stroke-width="2"/>
<ellipse cx="684" cy="250" rx="9" ry="6" fill="#9d9d9d" stroke="#444" stroke-width="2"/>
<path d="M197 100L306 148 M630 93L592 166 M210 247L287 254 M207 289L282 290 M693 279H730" fill="none" stroke="#777" stroke-width="2"/>
'''
for x,y,t,z in [(129,72,'Anode bằng',25),(129,101,'than chì',25),(713,72,'Aluminium oxide',25),(713,102,'và cryolite',25),(713,132,'nóng chảy',25),(143,215,'Nhôm',25),(143,245,'nóng chảy',24),(128,287,'Cathode',24),(128,317,'bằng than chì',24),(795,265,'Cửa tháo nhôm',25),(795,295,'nóng chảy',25),(420,348,'Sơ đồ thùng điện phân Al₂O₃ nóng chảy',24)]:b+=F.label(x,y,t,z,weight='dam')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="932" height="404" viewBox="0 0 932 404"><title>Thùng điện phân theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='thung-dien-phan-al-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=751,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,hashPhongDam=F.font('dam')[1],trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='5anodes/5neckfeet/blackcathodewedgeDOWNRIGHT/2unequalwalls/2outletarms+gap+shaftprotrusion/3knoblobes+archbase/5plainleaders/6literalblocks12lines/noextraarrow-polarity-Hallname-answer.')
(K/'cau-truc-thung-dien-phan-al-ddh-lo-263-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(fn)
