"""Bảng polymer nguồn747: giữ công thức và tên gọi theo từng cột."""
from pathlib import Path
import json,hashlib,importlib.util
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='8b4f2e54f12c6e59b5f3c9f8168cc2da3b4a476b23d07f081883dbafbb584eec';b=''
def path(d,w=1.5):
 global b
 b+=f'<path d="{d}" fill="none" stroke="#000000" stroke-width="{w}" stroke-linecap="butt" stroke-linejoin="round"/>'
def lab(x,y,t,z=32,anchor='middle',weight='de'):
 global b
 b+=F.label(x,y,t,z,anchor=anchor,weight=weight,fill='#000000')
def first(x,y,t,z=32):lab(x-F.advance(t[0],z)/2,y,t,z,'start')
# Bảng không có cạnh ngang trên cùng trong phần ảnh nhìn thấy.
path('M3.5 0V474.5H1160.5V0 M668.5 0V474.5',1.5)
path('M3.5 38H1160.5 M3.5 152.5H1160.5 M3.5 230.5H1160.5 M3.5 396.5H1160.5',1.2)
lab(337,28,'Cột A',28,weight='dam');lab(916,28,'Cột B',28,weight='dam')
for y,t in [(145,'1.'),(213,'2.'),(389,'3.'),(458,'4.')]:lab(76,y,t,32)
# Tên gọi giữ đúng thứ tự cột B; không tự ghép với công thức cột A.
for x,y,t in [(713,88,'a) Poly(phenol-formaldehyde)'),(720,184,'b) Polyisoprene'),(720,306,'c) Nylon-6,6'),(720,428,'d) Capron')]:lab(x,y,t,29,'start')
# Hàng 1: 4 carbon mạch chính, methyl gắn ở carbon thứ hai.
first(134,84,'CH₂');lab(212,84,'C');first(258,84,'CH');first(322,84,'CH₂');first(212,134,'CH₃')
path('M103 74H123 M184 74H199 M226 70H244 M226 78H244 M295 74H309 M371 73H389 M211 88V108')
path('M123 42Q104 79 123 117 M367 41Q387 79 367 117');lab(383,121,'n',21)
# Hàng 2: chỉ số5 ngoài ngoặc vuông, n dưới ngoặc tròn.
lab(120,198,'NH[CH₂]₅CO',32,'start')
path('M118 166Q103 187 118 208 M321 166Q336 187 321 208 M99 187H117 M320 187H339');lab(335,209,'n',20)
# Hàng 3: vòng sáu cạnh với đúng ba tia nối đôi, OH neo O đầu.
path('M166 294L198 314V353L166 372.5L133 353V314Z M139 322V348 M167 302L192 317 M167 365L192 350')
path('M115 314H133 M198 312H214 M276 310H287 M166 294V268')
first(166,261,'OH',31);first(226,321,'CH₂',31)
path('M129 253Q111 315 129 379 M268 251Q286 314 267 377');lab(279,371,'n',20)
# Hàng 4 giữ hai cặp ngoặc vuông [CH2]6 và [CH2]4, CO cô đọng.
lab(120,441,'NH[CH₂]₆NHCO[CH₂]₄CO',32,'start')
path('M118 411Q103 431 118 451 M516 410Q531 431 516 450 M99 432H117 M516 430H535');lab(530,451,'n',20)
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1172" height="480" viewBox="0 0 1172 480"><title>Bảng polymer theo nguồn747</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='table747-native-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
note='2cols4rows2TRUEdamheaders-Cột A-Cột B/ALLothersregularUPRIGHTBLACK/4ROUNDnSUB-3innerSQUAREpairsSUB5-6-4/row1CH2-C(CH3)=CH-CH2/row2NH[CH2]5CO/row3Ph3innerCC-OHfirstO-CH2firstC/row4NH[CH2]6NHCO[CH2]4CO/EXACTa) Poly(phenol-formaldehyde)-b) Polyisoprene-c) Nylon-6,6-d) Capron/0arrows-answer-expandedCO-addedH/nativeapproxNOTsubpixel'
r=dict(i=747,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung=note)
(K/'cau-truc-table747-native-ddh-lo-426-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
(K/'doc-table747-lo-426.json').write_text(json.dumps(dict(hash=h,native=[1172,480],questions=qs,ghiChu=note,rootSourceAudit='RootOWNnativeFULL/all1publicdeVIP27-C4-B12-I-8; EACHrow3xnative. TableROOTpixelbands:vertical3..4/668..669/1160..1161; horizontal38/152..153/230..231partial/396..397/474..475; initialsourceaudit670/1166/y233etcWRONG corrected BEFOREbuilder. PixelbandsSUPPORTvisualNOTautomaticgate. HeaderONLYDAM. NoTOPedgeinvented/noanswer.'),ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
