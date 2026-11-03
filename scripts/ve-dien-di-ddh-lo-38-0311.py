"""Nguồn1229: hai CH2 trong ngoặc2, NH3+/COO− đúng nguyên văn."""
from pathlib import Path
import json,hashlib,importlib.util
G=Path(__file__).resolve().parents[1];P=G/'docs/hinh-vector-0311';M=P/'kiem';sp=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(sp);sp.loader.exec_module(F);A=sorted(json.loads((P/'nguon/kiem-ke.json').read_text())['assets'],key=lambda a:a['hash']);rows=[]
def save(i,w,h,b,note):
 svg=(f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}"><title>Hình theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(svg).hexdigest();fn='hinh-ddh-'+hh+'.svg';(M/fn).write_bytes(svg);a=A[i];rows.append(dict(i=i,hash=a['hash'],fileNguon=a['file'],svg=fn,hashSvg=hh,byteSvg=len(svg),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',ghiChu=note))
b='<rect x="370" y="30" width="240" height="108" fill="white" stroke="#252440" stroke-width="2.5"/><rect x="195" y="165" width="590" height="245" fill="none" stroke="#252440" stroke-width="2.5"/>'
b+='<path d="M350 84H138C-5 84 -5 290 130 290H245M630 84H850C1000 84 1000 290 855 290H735M245 210V365M735 210V365M350 78H370M610 78H630M340 365L250 455M490 365V455M640 365L750 455" fill="none" stroke="#252440" stroke-width="2.5" stroke-linecap="round"/>'
for x in[355,625]:b+=f'<circle cx="{x}" cy="84" r="12" fill="white" stroke="#252440" stroke-width="2.5"/>'
for x in[370,490,610]:b+=f'<rect x="{x-9}" y="210" width="18" height="145" fill="#6961bb"/>'
for x,y,label,size in[(490,99,'Nguồn điện',32),(350,52,'−',32),(625,52,'+',32),(263,203,'cathode',29),(731,203,'anode',29),(220,237,'−',32),(758,237,'+',32),(225,493,'(1)',30),(490,493,'(2)',30),(779,493,'(3)',30),(490,563,'Hình: kết quả thí nghiệm tính điện di ở pH = 6',31)]:b+=F.label(x,y,label,size)
b='<g transform="translate(160 0)">'+b+'</g>'+F.label(90,207,'Kết thúc',28)
save(1275,1160,595,b,'Cựcâmtrái/cathode,cựcdươngphải/anode;nguồnđiệnnốihaiđiệncực;3vệtdiện di/vịtrí(1)(2)(3);giữKếtthúc/pH=6,khôngđoánchất.')
(M/'cau-truc-dien-di-ddh-lo-38-ban-dung.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
