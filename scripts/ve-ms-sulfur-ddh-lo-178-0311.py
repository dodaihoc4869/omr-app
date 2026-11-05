"""Phổ nguồn1195: giữ vị trí/chiều cao pixel, không suy m/z các peak."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
r=dict(next(x for x in json.loads((K/'doc-molecule-lo-169.json').read_text())if x['i']==1195));r.pop('chiLaDuLieuDungChuaSoatRender',None)
def line(d,w=1.3):return f'<path d="{d}" fill="none" stroke="#252440" stroke-width="{w}"/>'
b=line('M65 10V305H504V10',1.4)
for x,y in [(160,92),(204,253),(249,204),(295,163),(345,254),(392,295),(434,129),(442,248)]:b+=line(f'M{x} 305V{y}',1.7)
for x,t in zip([112,157,198,243,286,330,375,417,462],range(30,271,30)):b+=F.label(x,331,str(t),15)
for y,t in [(305,0),(261,20),(218,40),(174,60),(131,80),(88,100),(44,120)]:b+=F.label(56,y+5,str(t),15,'end')
b+=F.label(283,352,'m/z',17)+f'<g transform="translate(23 175) rotate(-90)">'+F.label(0,0,'Cường độ tương đối (%)',17)+'</g>'
# Superscript + dùng đúng glyph DDH, không suy thêm chỉ số/đỉnh.
b+=F.label(386,115,'[M',18,'start',weight='dam')+F.label(412,106,'+',11,'start',weight='dam')+F.label(421,115,'] = 256',18,'start',weight='dam')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="530" height="375" viewBox="0 0 530 375"><title>Phổ MS sulfur theo nguồn</title>'+b+'</svg>').encode();h=hashlib.sha256(raw).hexdigest();fn='ms-sulfur-ddh-'+h+'.svg';(K/fn).write_bytes(raw);r.update(svg=fn,hashSvg=h,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',ghiChuDung='8peaksnativeheight/frame3sides/noextraMzpeaklabels/noheightnormalization/Y0..120/X30..270/Msup+256/DDHpath.');(K/'cau-truc-ms-sulfur-ddh-lo-178-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
