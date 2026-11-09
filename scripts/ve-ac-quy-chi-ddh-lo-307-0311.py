"""Sơ đồ ắc quy chì nguồn1335: giữ màu, lớp PbSO4 và mọi nhãn gốc."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='f21a4c96628f5e0bb0476dbd484b636908e6741180cefa7e22919531b76f9763';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh'] if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
def label(x,y,t,z=23,fill='#000',anchor='middle'):return F.label(x,y,t,z,anchor=anchor,fill=fill)
b='''<path d="M100 231H442V228H465V403H100Z" fill="#7f7f7f"/>
<path d="M99 157V404H466V157" fill="none" stroke="#000" stroke-width="3.4"/>
<path d="M137 161H221V367H137Z" fill="#7092be" stroke="#505050" stroke-width="0.8"/>
<path d="M357 164H442V369H357Z" fill="#b5e61d" stroke="#666" stroke-width="0.8"/>
<path d="M137 337Q169 308 221 293V367H137Z M357 290Q416 302 442 341V369H357Z" fill="#fff" stroke="#505050" stroke-width="0.8"/>
<path d="M173 165V112H249 M327 111H397V169" fill="none" stroke="#000" stroke-width="2.2"/>
<path d="M249 93H327V126H249Z" fill="#fff" stroke="#000" stroke-width="2.2"/>
<path d="M191 73H371 M362 68L371 73L362 78" fill="none" stroke="#151515" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/>
'''
b+=label(274,66,'e',24)+label(288,118,'2,1V',23)
b+=label(152,149,'(-)',22)+label(418,155,'(+)',22)
b+=label(178,222,'Pb',23,'#fff')+label(402,217,'PbO₂',23)
b+=label(184,348,'PbSO₄',23)+label(401,349,'PbSO₄',23)
# Hai điện tích trên dòng riêng, dùng glyph DDH thật ở kích thước nhỏ.
b+=label(279,270,'H',23,'#fff')+label(293,259,'+',14,'#fff')
b+=label(293,334,'HSO₄',23,'#fff')
x=293+F.advance('HSO₄',23)/2+2;b+=label(x,324,'-',14,'#fff',anchor='start')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="548" height="459" viewBox="0 0 548 459"><title>Ắc quy chì theo nguồn1335</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='ac-quy-chi-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=1335,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='1openbeakergrayfill/bluePbLEFT-greenPbO2RIGHT/2whitePbSO4bottomcurves/1rectmeter2,1V2wires/eRIGHTopenVshafttotip/(-)LEFT(+)RIGHT/whiteHsupplus-HSO4supminus/regularDDH/noaddedbubbles-reactions-current-legend-answer')
(K/'cau-truc-ac-quy-chi-ddh-lo-307-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
