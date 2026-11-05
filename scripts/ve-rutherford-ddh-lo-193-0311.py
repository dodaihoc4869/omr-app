"""Nguồn24: bố trí thí nghiệm Rutherford, giữ hướng tia và các nhãn nguồn."""
from pathlib import Path
import importlib.util,json,hashlib,math
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='0419ff0d08adcbebffdaa037e6cb21d692b40d49a5897a2b237beb2ea7fb2bcb';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[v for v in q['hinh']if v['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
def path(d,fill='none',stroke='#454541',w=1.3):return f'<path d="{d}" fill="{fill}" stroke="{stroke}" stroke-width="{w}" stroke-linejoin="round"/>'
def arrow(x,y,u,v):
 ll=math.hypot(u-x,v-y);dx=(u-x)/ll;dy=(v-y)/ll;nx=-dy;ny=dx;return path(f'M{x} {y}L{u} {v}')+path(f'M{u} {v}L{u-dx*10+nx*4} {v-dy*10+ny*4}L{u-dx*10-nx*4} {v-dy*10-ny*4}Z','#555651','none')
b='<defs><linearGradient id="screen"><stop stop-color="#c5c5c3"/><stop offset="1" stop-color="#888986"/></linearGradient><linearGradient id="gold"><stop stop-color="#f2df9c"/><stop offset="1" stop-color="#c9aa56"/></linearGradient></defs>'
# Ba mảng màn chắn, chừa khe trước-trái cho chùm tới.
b+=path('M298 149C298 77 376 20 472 20C568 20 646 77 646 149L643 184C643 125 568 77 472 77C376 77 301 125 301 184Z','url(#screen)')
b+=path('M298 149V195Q300 230 336 253V204Q306 177 298 149Z','#8f908d')
# Chấm/tia phía sau lá vàng.
b+=path('M473 164L505 48')+'<circle cx="505" cy="48" r="3" fill="#656760"/>'
for u,v in [(303,143),(596,86),(607,96),(638,132),(553,232)]:b+=arrow(473,164,u,v)
# Lá vàng che khu vực giao tia, các tia lộ ra quanh tâm được giữ.
b+=path('M434 94L509 142V234L434 188Z','url(#gold)','#b99f58',1.4)
for d in ['M435 116L453 105L476 122L450 143L435 141Z','M435 155L462 137L483 154L455 176L435 177Z','M455 201L482 181L508 199V220L482 213Z','M474 133L508 146V162L491 176L474 164Z']:b+=path(d,'#f0d68a','none')
# Tia nhìn xuyên lá vàng (không thêm một đầu mũi tên mới).
for u,v in [(303,143),(596,86),(607,96),(638,132),(553,232)]:b+=path(f'M473 164L{u} {v}')
b+=path('M364 222C438 266 606 254 646 153V194C633 265 507 335 364 278Z','url(#screen)')+path('M366 221C441 264 603 251 644 153',stroke='#333532',w=1.2)
# Khối chì nguồn và đường chùm tới hai biên mảnh.
b+=path('M235 271L272 246L308 270L272 296Z','#c5c5c2')+path('M235 271V317L272 342V296Z','#9b9c98')+path('M272 296L308 270V316L272 342Z','#b8b9b5')+path('M260 287L272 279L283 287V300L272 308L260 300Z','#a0a19a')
b+=path('M273 292L471 161M276 296L475 166',stroke='#55564e',w=1)+path('M274 294L473 164',stroke='#c0ac6a',w=1.2)+'<circle cx="273" cy="294" r="3" fill="#eed377"/>'
# Nhãn và đường chỉ không đầu nhọn như nguồn.
b+=F.label(39,85,'Hạt alpha bị bật ngược',21,'start')+F.label(39,116,'trở lại',21,'start')+path('M278 89L347 149')
b+=F.label(613,51,'Hạt alpha xuyên thẳng',25,'start')+path('M604 42L552 113')+F.label(687,196,'Hạt alpha bị lệch',25,'start')+path('M680 185L628 145')
b+=F.label(531,180,'Lá vàng',25,'start')+path('M525 174L488 160')+F.label(103,198,'Chùm hạt alpha',22,'start')+path('M273 197L318 261')
b+=F.label(26,301,'Nguồn hạt alpha',21,'start')+path('M206 293H270')+F.label(366,333,'Chì',25,'start')+path('M357 323L299 300')+F.label(522,334,'Màn chắn',25,'start')+path('M516 321L465 286')
b+=F.label(450,380,'Thí nghiệm bắn phá lá vàng bằng các hạt alpha của Rutherford',25)
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="920" height="410" viewBox="0 0 920 410"><title>Thí nghiệm Rutherford theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='rutherford-ddh-'+hh+'.svg';(K/fn).write_bytes(raw);r=dict(i=24,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='Open detectorgray/back-frontocclusion/goldfoil/Pbsource/beam/5outgoingarrowheads+1roundendpoint/all8labels+captionliteral/DDHpath/noangles-numbersadded.');(K/'cau-truc-rutherford-ddh-lo-193-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
