"""Hai khối composite nguồn864: từng sợi và từng hạt nhìn thấy."""
from pathlib import Path
import json,hashlib,importlib.util
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='9d7115ce87e3776aa5b39a97e4086cb0438cf73551c98a8ba936e27b504e64a6';b=''
def path(d,w=2):
 global b
 b+=f'<path d="{d}" fill="none" stroke="#000000" stroke-width="{w}" stroke-linecap="butt" stroke-linejoin="round"/>'
# Hai khối riêng; không thêm các cạnh khuất ở trong khối.
path('M85 107L148 45H372V182L310 244H85Z M85 107H310L372 45 M310 107V244')
path('M518 104L582 40H812V177L748 241H518Z M518 104H748L812 40 M748 104V241')
# Mặt trên: chín sợi độc lập, vị trí/hướng và độ cong riêng.
for d in ['M121 94L137 74','M155 66L191 58','M149 83C161 84 175 82 180 87Q185 91 185 97','M213 77Q222 90 214 94','M224 66L250 73','M247 50L249 59','M267 88Q275 74 296 63','M305 76L317 86','M289 51L328 59']:path(d)
# Mặt trước: mười sáu sợi, không suy thành mạng có nút nối.
for d in ['M105 139L123 123','M120 149L144 155','M145 123L175 118','M177 140Q202 134 208 142Q210 152 222 148','M258 122Q269 138 281 138','M97 176L122 164','M125 198Q129 186 158 186','M97 196L111 227','M143 211L173 224','M171 159Q176 181 186 185','M202 166L242 168','M257 156Q262 167 239 192','M267 172L295 188','M203 196Q204 222 214 225','M235 210Q243 216 242 236','M259 205Q274 213 285 225']:path(d)
# Mặt bên: năm sợi.
for d in ['M321 114Q321 105 341 99','M352 92L354 133','M330 128L346 160','M327 167L323 206','M338 189L360 162']:path(d)
# Hạt đặc: 6 trên, 11 trước, 4 bên. Dáng ellipse/độ nghiêng theo từng hạt nguồn.
particles=[(580,79,7.3,7.3,0),(618,83.5,13,8,0),(644.5,61.5,7.3,7.5,0),(695.5,77,6.2,10,0),(737.5,67,7.4,7.4,0),(758.5,55,8.2,11.3,-37),
(536,125,8,11.3,-35),(601.5,137,7.3,10,0),(655,124,7.2,7.5,0),(712.5,143.5,13.1,8.3,0),(542,162.5,13.2,8.5,0),(580.5,176.5,7.5,7.5,0),(655.5,171.5,8,11.4,-35),(547.5,212,7.7,10,0),(613.5,208.5,7.5,7.6,0),(650,220,13.3,8.8,0),(707,201.5,7.5,7.5,0),
(790,92,7.5,10.2,0),(770,122.5,8.7,11.5,-37),(788,154,13.3,8.8,0),(771,182,7.4,7.4,0)]
for x,y,rx,ry,a in particles:b+=f'<ellipse cx="{x}" cy="{y}" rx="{rx}" ry="{ry}" transform="rotate({a} {x} {y})" fill="#000000"/>'
for x,t in [(171,'Composite cốt sợi'),(649,'Composite cốt hạt')]:b+=F.label(x,297,t,24,anchor='middle',fill='#000000')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="879" height="342" viewBox="0 0 879 342"><title>Hai loại composite theo nguồn864</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='composite864-native-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
note='2BLACKwireframecubes3visiblefacesEACH/LEFT30individualfibers9TOP16FRONT5SIDE/RIGHT21FILLEDparticles6TOP11FRONT4SIDE/2regularUPRIGHTBLACKcaptionsEXACTComposite cốt sợi-Composite cốt hạt/0heads-ticks-charge-chemicalformula/NOaddedhiddenedges-particles-node-labels-answer/nativeapproxNOTsubpixel'
r=dict(i=864,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung=note)
(K/'cau-truc-composite864-native-ddh-lo-428-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
(K/'doc-composite864-lo-428.json').write_text(json.dumps(dict(hash=h,native=[879,342],questions=qs,ghiChu=note,rootSourceAudit='RootOWNnativeFULL/all1publicde12-C4-B13-II-9; OWNLEFT/RIGHTcube3x+captions2x. 30separatefibers9top16front5side;21solidparticles6top11front4side. Individualnonperiodicpositions/angles/curves; neither count inferredfromcompositetheory. SourceflatlineillustrationNOTphoto. AllcaptionsregularUPRIGHT; no inferredchemicalformula/answer. NativeapproxNOTsubpixel.'),ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
