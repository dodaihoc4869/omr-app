"""Điện phân nguồn311: lớp dung dịch và các nét cắt qua điện cực nguyên văn."""
from pathlib import Path
import json,hashlib,importlib.util
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='35b53e6f91508180895ee38919ed62d9d4c433a6f4cee5d7b5f10c37c135db19';b=''
def path(d,w=1.5,c='#000000',fill='none',join='miter'):
 global b
 b+=f'<path d="{d}" fill="{fill}" stroke="{c}" stroke-width="{w}" stroke-linecap="butt" stroke-linejoin="{join}"/>'
def line(v,w=1.5,c='#000000',join='miter'):path('M'+'L'.join(f'{x} {y}'for x,y in v),w,c,join=join)
def lab(x,y,t,z=24,anchor='middle',weight='de'):
 global b
 b+=F.label(x,y,t,z,anchor=anchor,fill='#000000',weight=weight)
def rect(x,y,w,h,c):
 global b
 b+=f'<path d="M{x} {y}h{w}v{h}h{-w}Z" fill="{c}"/>'
# Nền xám phần màng phía trên mực dung dịch, không thêm sắc hồng chỉ thị.
path('M165 119L216 80L216 192L165 236Z',0,fill='#ebebeb')
path('M25 154L71 124L349 124L349 191L295 236L25 236Z',0,fill='#99d9ea')
# Các cạnh sau và hai mặt bên có nét xám khác viền trước đen.
line([[25,119],[71,80],[349,80],[349,191]],1.2,'#b4b4b4')
line([[71,80],[71,191]],1.2,'#b4b4b4')
line([[25,236],[71,191]],1.8,'#7f7f7f');line([[295,119],[349,80]],1.5,'#7f7f7f')
line([[295,236],[349,191]],1.8,'#7f7f7f')
# Hai điện cực đen nguyên khối, chiều dài không bằng nhau.
rect(87,95,15,115,'#000000');rect(244,95,15,120,'#000000')
# Viền trước đen, lớp xám bề mặt dung dịch chạy đè qua hai thanh như native.
line([[25,236],[25,119],[295,119],[295,236],[25,236]],1.8)
# Cạnh đáy sau bị thanh chắn; giữ hai gạch xám ngắn trong thanh, không gọi dấu trừ.
for v in [[[71,191],[87,191]],[[102,191],[244,191]],[[259,191],[349,191]],[[92,191],[98,191]],[[249,191],[255,191]]]:line(v,1.2,'#7f7f7f')
line([[165,236],[165,119],[216,80],[216,192],[165,236]],5,'#c3c3c3','round')
line([[25,154],[71,124],[349,124]],1.8,'#7f7f7f')
line([[165,154],[216,124]],1.8,'#7f7f7f')
line([[25,154],[295,154],[349,124]],1.8,'#7f7f7f')
# Dây cắt nhau không có chấm nối. (+) trái, (-) phải là literal có ngoặc.
line([[95,95],[95,30],[418,30],[418,89]],1.8)
line([[254,95],[254,7],[551,7],[551,86]],1.8)
path('M396 100H576V186H396Z',5,fill='#ffffff')
path('M412 99V90H425V99',4);path('M545 99V87H558V99',4)
lab(400,83,'(+)',20);lab(566,82,'(-)',20)
lab(483,148,'Acquy',24,weight='dam')
# Hai leader không có đầu mũi tên; đầu trái chạm màng, đầu phải nằm trong dung dịch.
line([[191,215],[223,258]],1.8);line([[315,203],[409,230]],1.8)
lab(221,268,'Màng ngăn xốp',24,'start');lab(410,240,'Dung dịch NaCl',21,'start')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="587" height="276" viewBox="0 0 587 276"><title>Sơ đồ điện phân theo nguồn311</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='cell311-native-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
note='FLATdrawn3Dcell-NOTphoto/1CYANliquid2BLACKrodsunequal115-120height1GRAYmembrane/2crossingwiresNOjunctiondot-2batteryports1whiteBLACKframe/2GRAYsurfacelevels124back154frontOVERrods-backbottom191MASKEDbyrods2tinyGRAYdashes1insideEACHretainNOTminus/EXACTAcquyTRUEdamUPRIGHT-regularUPRIGHT(+)-(-)-Màng ngăn xốp-Dung dịch NaCl/2leadersNOheads-FREEtipinsidewater315203-membranetip191215/NOaddedbubble-ion-arrow-voltage-anodecathode-reaction-answer-alias/nativeapproxNOTsubpixel'
r=dict(i=311,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung=note)
(K/'cau-truc-cell311-native-ddh-lo-417-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
(K/'doc-cell311-lo-417.json').write_text(json.dumps(dict(hash=h,native=[587,276],questions=qs,ghiChu=note,rootSourceAudit='Root OWNnativeFULL2x/tank4x/ports4x/labels4x/allpublicde. OwnPILcolorscyan153217234/membrane195195195/topfill235235235/rodsBLACKnotteal;watergraylinesOVERrods. BackbottommaskedexcepttinygraydashEACHrod. NativeapproxNOTsubpixel.'),ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
