"""Nguồn285: đường ống, dòng khí và nhãn theo sơ đồ Haber–Bosch công khai."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='30909a372d49d0206fbdd1efe07eb82921267cb477ff5353ca50ddd44e1c7c03';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[v for v in q['hinh']if v['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
def path(d,w=2,fill='none',stroke='#252440',extra=''):return f'<path d="{d}" fill="{fill}" stroke="{stroke}" stroke-width="{w}" {extra}/>'
def pipe(d,w=16):return path(d,w,stroke='#252440',extra='stroke-linejoin="round"')+path(d,w-5,stroke='#ffffff',extra='stroke-linejoin="round"')
def label(x,y,t,z=22,a='middle'):return F.label(x,y,t,z,a,weight='dam')
b='<defs><linearGradient id="froid" gradientUnits="userSpaceOnUse" x1="0" y1="100" x2="0" y2="253"><stop offset="0" stop-color="#e51016"/><stop offset="0.55" stop-color="#98213e"/><stop offset="1" stop-color="#302d6d"/></linearGradient><clipPath id="cooler"><rect x="428" y="100" width="93" height="179" rx="18"/></clipPath></defs>'
b+=pipe('M49 187H125')+'<circle cx="152" cy="187" r="27" fill="#ffffff" stroke="#252440" stroke-width="2.7"/>'
b+=pipe('M154 187H262M471 100V79Q471 66 458 66H229Q216 66 216 79V187M388 234H428')
b+=path('M155 180A8 8 0 1 0 155 194',2.4)
b+='<rect x="262" y="100" width="126" height="182" rx="30" fill="#fee32f" stroke="#252440" stroke-width="2.8"/>'
b+='<rect x="313" y="101" width="22" height="180" fill="#aa9275" stroke="#252440" stroke-width="2.8"/>'+path('M318 103V279',1.3,stroke='#d3c2a8')
b+='<rect x="428" y="100" width="93" height="179" rx="18" fill="#d4d5d7"/>'+path('M428 100H521V253H428Z',0,'url(#froid)','none','clip-path="url(#cooler)"')+'<rect x="428" y="100" width="93" height="179" rx="18" fill="none" stroke="#252440" stroke-width="2.8"/>'+path('M429 253H520',2)
coil='M538 116H443Q437 116 437 122Q437 128 443 128H507Q513 128 513 133.5Q513 139 507 139H443Q437 139 437 144.5Q437 150 443 150H507Q513 150 513 155.5Q513 161 507 161H443Q437 161 437 167Q437 173 443 173H507Q513 173 513 178.5Q513 184 507 184H443Q437 184 437 189.5Q437 195 443 195H507Q513 195 513 200.5Q513 206 507 206H443Q437 206 437 212Q437 218 443 218H507Q513 218 513 223.5Q513 229 507 229H443Q437 229 437 235Q437 241 443 241H538'
b+=path(coil,8,extra='stroke-linejoin="round"')+path(coil,5,stroke='#a4d8e6',extra='stroke-linejoin="round"')+path(coil,1,stroke='#739aa7',extra='stroke-linejoin="round"')
b+=pipe('M471 279V357',14)+'<circle cx="473" cy="314" r="19" fill="#ffffff" stroke="#252440" stroke-width="2.5"/>'
b+=path('M455 325L492 301',15,extra='stroke-linecap="round"')+path('M455 325L492 301',9,stroke='#ffffff',extra='stroke-linecap="round"')
b+=path('M471 358C470 363 461 374 468 377C478 381 479 370 474 363Z',0,'#d7dedd','none')
# Mở các cổng nối: đường viền tháp không được chặn dòng trong ống.
b+=path('M260.5 181H263.5V193H260.5Z',0,'#fee32f','none')+path('M386.5 228H390V240H386.5Z',0,'#fee32f','none')
b+=path('M426.5 229H430V239H426.5Z',0,'url(#froid)','none')+path('M466 98.5H476V102H466Z',0,'#e51016','none')+path('M466 277.5H476V281H466Z',0,'#d4d5d7','none')
b+=path('M77 187H112M230 187H257M397 234H424M371 66H318M216 100V153',2.2)
for d in ['M100 182L112 187L100 192L103 187Z','M245 182L257 187L245 192L248 187Z','M412 229L424 234L412 239L415 234Z','M330 61L318 66L330 71L327 66Z','M211 141L216 153L221 141L216 144Z']:b+=path(d,.7,'#252440')
b+=path('M152 104V160M224 251H262M324 261V300M522 178H558M481 368H512',2)
b+=label(62,95,'Bộ phận nén',22,'start')+label(34,167,'H₂ + N₂',22,'start')+label(344,44,'H₂ + N₂')+label(62,259,'Tháp tổng hợp',22,'start')+label(330,332,'Chất xúc tác')+label(570,187,'Tháp làm lạnh',22,'start')+label(475,272,'NH₃')+label(519,377,'Ammonia lỏng',22,'start')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="759" height="415" viewBox="0 0 759 415"><title>Sơ đồ thiết bị tổng hợp ammonia theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='haber-bosch-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=285,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='5flowheads/12coilruns6leftU5rightU/2coilexternalendsRIGHT/recycleloop/compressor/2towers-catalyststrip/sourcecolors-gradient/NH3graybottom/1valve1dropletsilhouette/alllabelsDDHdam/noextraformula-counts/DDHpath.')
(K/'cau-truc-haber-bosch-ddh-lo-222-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
