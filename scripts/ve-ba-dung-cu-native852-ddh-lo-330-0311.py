"""Dụng cụ nguồn852: nét và mức chất lỏng riêng theo native, không alias1288."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='9bee2d632b156e4129f9152fb7e4960366d8d79a46b67b3933fc588045c76521';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh'] if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
b='<path d="M14 211H48V276Q48 291 30 296Q14 290 14 276Z M112 82Q115 86 122 86H211Q218 85 221 82L222 130Q221 143 207 146H127Q112 144 111 130Z M128 288H213L228 336Q231 342 229 347Q225 361 211 365H137Q121 364 114 349Q110 343 112 337Z" fill="#ebebeb"/>'
b+='<path d="M16 211H45 M112 82Q115 86 122 86H211Q218 85 221 82 M128 288H213" fill="none" stroke="#b4b4b4" stroke-width="1.3"/>'
b+='<path d="M10 7Q14 10 14 17V276Q14 290 30 296Q48 291 48 276V17Q48 10 52 7 M107 7Q111 10 111 17V130Q112 144 127 146H207Q221 143 222 130V17Q222 10 227 7 M141 189Q145 192 145 199V223Q145 227 142 233L112 337Q110 343 114 349Q121 364 137 365H211Q225 361 229 347Q231 342 228 336L197 233Q195 227 195 223V199Q195 192 199 189" fill="none" stroke="#292929" stroke-width="3.1" stroke-linecap="round" stroke-linejoin="round"/>'
for y in [49,90,132,173,215,256]:b+=f'<path d="M31 {y}H42" stroke="#b5b5b5" stroke-width="1.4"/>'
for y in [23,43,64,85,105,126]:b+=f'<path d="M203 {y}H214" stroke="#b5b5b5" stroke-width="1.4"/>'
for y,x in [(240,179),(261,184),(282,190),(303,195),(323,200),(344,206)]:b+=f'<path d="M{x} {y}H{x+11}" stroke="#b5b5b5" stroke-width="1.4"/>'
b+='<path d="M26 337V373 M35 337V373" stroke="#292929" stroke-width="2.8"/>'
b+='<path d="M51 289Q55 282 59 289V306H62Q67 306 67 313V319Q67 323 62 323H59V341Q55 349 51 341V323H44V306H51Z" fill="#888888" stroke="#373737" stroke-width="2"/>'
b+='<path d="M44 310H65V317H44Z" fill="#d2d2d2"/><path d="M54 290V306 M54 323V339" stroke="#555555" stroke-width="1.5"/>'
b+='<path d="M18 296H44V323L40 337H22L17 323Z" fill="#858585" stroke="#3b3b3b" stroke-width="2"/><path d="M21 299H25V324L28 334H23L21 322Z" fill="#b6b6b6"/>'
for x,y,t in [(74,184,'A'),(166,67,'B'),(161,274,'C')]:b+=F.label(x,y,t,22,weight='dam',fill='#1b1b1b')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="235" height="379" viewBox="0 0 235 379"><title>Ba dụng cụ theo nguồn852</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='ba-dung-cu-native852-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=852,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='3grayapparatusABC/6Aticks6Bticks6Cticks-B85coincidentmeniscus/3liquidfills/stopcock2edgesOPENoutlet/3trueDAMlabels/noaddednums-mL-drop-stand-answer/noalias1288')
(K/'cau-truc-ba-dung-cu-native852-ddh-lo-330-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
