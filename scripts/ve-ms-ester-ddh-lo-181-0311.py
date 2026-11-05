"""Nguồn765: phổ ester giữ frame/ticks/heightpixel, không gán m/z peak."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
r=dict(next(x for x in json.loads((K/'doc-molecule-lo-169.json').read_text())if x['i']==765));r.pop('chiLaDuLieuDungChuaSoatRender',None)
# Các nét nhỏ sẽ chốt bằng đọc riêng PNG native/zoom trước admission.
peaks=[(104,245),(112,242),(120,203),(143,245),(219.5,235),(227,139),(234.5,233),(243,8),(251,139),(257.5,245),(342.5,244),(350,246),(466,157),(472.5,246)]
b='<g transform="translate(12 8)"><path d="M81 248V7H543V248Z" fill="none" stroke="#252440" stroke-width="1.3"/>'
for x,y in peaks:b+=f'<path d="M{x} 248V{y}" stroke="#252440" stroke-width="1.4"/>'
for j in range(61):
 x=81+j*462/60;b+=f'<path d="M{x} 248V{254 if j%10==0 else 251}" stroke="#252440" stroke-width=".85"/>'
 if j%10==0:b+=F.label(x,273,str(10+j),16)
for j in range(21):
 y=248-j*241/20;b+=f'<path d="M81 {y}H{75 if j%4==0 else 78}" stroke="#252440" stroke-width=".85"/>'
 if j%4==0:b+=F.label(74,y+5,str(j*5),16,'end')
b+=F.label(313,293,'m/z',18)+'<g transform="translate(32 130) rotate(-90)">'+F.label(0,0,'Cường độ tương đối (%)',17)+'</g></g>'
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="600" height="315" viewBox="0 0 600 315"><title>Phổ khối lượng ester theo nguồn</title>'+b+'</svg>').encode();h=hashlib.sha256(raw).hexdigest();fn='ms-ester-ddh-'+h+'.svg';(K/fn).write_bytes(raw);r.update(svg=fn,hashSvg=h,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',peaksPixel=peaks,ghiChuDung='4frame/minorX1major10/Yminor5major20/pixelheight/noextraMzpeaklabels/noM/DDHpath. Tinybarschốtđọcsourcezoomkhôngsuytheory.');(K/'cau-truc-ms-ester-ddh-lo-181-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
