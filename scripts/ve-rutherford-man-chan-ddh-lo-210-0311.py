"""Nguồn131: màn chắn Rutherford và các tia theo hình, không thêm dữ liệu."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='17db6ed26194b54f495bf9caca1ecb1044fe47c1473e63808bfb3d97fcd521a4';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[v for v in q['hinh']if v['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
def path(d,w=1.5,fill='none',stroke='#444444'):return f'<path d="{d}" fill="{fill}" stroke="{stroke}" stroke-width="{w}" stroke-linejoin="round"/>'
def label(x,y,t,z=20,a='start',dam=False):return F.label(x,y,t,z,a,weight='dam'if dam else'de')
b='''<defs><linearGradient id="screen"><stop stop-color="#797979"/><stop offset=".5" stop-color="#bdbdbd"/><stop offset="1" stop-color="#858585"/></linearGradient><linearGradient id="foil"><stop stop-color="#f3f3f3"/><stop offset="1" stop-color="#c5c5c5"/></linearGradient></defs>'''
# Thành phía sau, mép cửa trái và thành phía trước tạo khoảng mở nguồn.
b+=path('M265 169C259 95 349 40 445 40C554 34 633 89 633 169C611 124 532 94 442 98C363 98 298 127 274 185Z',1.7,'url(#screen)')
b+=path('M265 169V222Q271 254 310 284V229Q282 211 274 185Z',1.7,'#9c9c9c')
b+=path('M337 248C423 295 572 284 633 169V222C630 334 449 359 337 306Z',1.7,'url(#screen)')
# Tấm lá vàng giữ màu xám sáng và mặt nghiêng như bản in.
b+=path('M417 120L486 169V260Q485 263 481 260L417 211Z',1.6,'url(#foil)',stroke='#8a8a8a')
# Khối chì có ba mặt và lỗ nguồn.
b+=path('M202 302L241 276L280 302L241 330Z',1.5,'#b6b6b6')+path('M202 302L241 330V377L202 348Z',1.5,'#a0a0a0')+path('M241 330L280 302V349L241 377Z',1.5,'#bfbfbf')
b+='<ellipse cx="222" cy="337" rx="14" ry="20" transform="rotate(-25 222 337)" fill="#707070" stroke="#424242" stroke-width="1.5"/><ellipse cx="230" cy="333" rx="4" ry="5" fill="#b9b9b9" stroke="#555555" stroke-width="1.1"/>'
# Chùm tới và bốn tia có đầu mũi tên; các đoạn bị lá che giữ đứt khuất.
b+=path('M280 302L448 192M417 185L305 157M486 165L554 117M486 181L607 156M486 223L531 254',1.4,stroke='#777777')
for d in ['M305 157L316 156L313 163Z','M554 117L550 127L544 120Z','M607 156L596 162L595 154Z','M531 254L520 250L525 244Z']:b+=path(d,.7,'#777777',stroke='#777777')
# Đường dẫn nhãn không có đầu tên.
b+=path('M190 99L280 139M609 64L600 64L548 119M662 209L620 173M508 202L474 200M242 224L286 294M179 326L218 327M328 359L269 332M488 351L449 316',1.3)
b+=label(48,95,'Hạt alpha bị bật',19)+label(48,121,'ngược trở lại',19)+label(614,67,'Hạt alpha xuyên thẳng',19)+label(667,221,'Hạt alpha bị lệch',19)+label(513,209,'Lá vàng',20)+label(237,229,'Chùm hạt alpha',20,'end')+label(175,333,'Nguồn hạt alpha',20,'end')+label(333,369,'Chì',20)+label(492,363,'Màn chắn',20)
b+=label(424,474,'Thí nghiệm bắn phá lá vàng bằng các hạt alpha của Rutherford',21,'middle',True)
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="885" height="515" viewBox="0 0 885 515"><title>Thí nghiệm Rutherford theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='rutherford-man-chan-ddh-'+hh+'.svg';(K/fn).write_bytes(raw);r=dict(i=131,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='Open3Dscreen/Pb3faces-sourcehole/graygoldfoil/incidentbeam+4rayheads/alllabels-leaders/captiondam/internalgradients/DDHpath.');(K/'cau-truc-rutherford-man-chan-ddh-lo-210-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
