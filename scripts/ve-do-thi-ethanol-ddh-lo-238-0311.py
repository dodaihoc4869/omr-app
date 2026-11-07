"""Nguồn521: giữ tọa độ bảy điểm và khoảng lệch trục dưới đường lưới 0."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='61330fe26e90de67951c5c2396386a64b76b24ec8bb25bccb46b3b952bc9ff78';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[v for v in q['hinh']if v['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
xs=[154,278,403,527,652,776,1025];ys=[586,544,502,461,420,378,337,296,254,213,171,130,88]
b=''
for x in xs:b+=f'<path d="M{x} 88V608" fill="none" stroke="#c9c9c9" stroke-width="1" stroke-dasharray="2 2"/>'
for y in ys:b+=f'<path d="M111 {y}H1069" fill="none" stroke="#c9c9c9" stroke-width="1" stroke-dasharray="2 2"/>'
b+='<path d="M111 88V608H1069" fill="none" stroke="#252440" stroke-width="1.6"/>'
for x,t in zip(xs,['0','6','12','18','24','30','42']):
 b+=f'<path d="M{x} 603V608" stroke="#252440" stroke-width="1.2"/>'+F.label(x,626,t,18)
for i,y in enumerate(ys):b+=f'<path d="M111 {y}H116" stroke="#252440" stroke-width="1.2"/>'+F.label(105,y+6,str(i*2),18,'end')
pts=[(154,586),(278,461),(403,358),(527,233),(652,171),(776,150),(1025,150)]
b+='<path d="M'+'L'.join(f'{x} {y}'for x,y in pts)+'" fill="none" stroke="#252440" stroke-width="2"/>'
for x,y in pts:b+=f'<circle cx="{x}" cy="{y}" r="4.2" fill="#252440"/>'
b+=F.label(590,80,'Nồng độ Ethanol (C₂H₅OH) theo thời gian',24)+F.label(590,651,'Thời gian (giờ)',20)
b+='<g transform="translate(73 347) rotate(-90)">'+F.label(0,0,'Nồng độ Ethanol (g/L)',18)+'</g>'
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1123" height="695" viewBox="0 0 1123 695"><title>Nồng độ ethanol theo thời gian theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='do-thi-ethanol-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=521,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='7markers6segments/7Xlabels0-6-12-18-24-30-42/13Ylabels0..24step2/lastplateau21/0gridy586-Xaxis608OFFSET22px-GIỮ/yaxisx111-x0point154/13H7Vdashedgrids/7X13Ytickstems/all3literaltexts-C2H5OHsubs/DDHpath/noadded36tick-values-arrows.')
(K/'cau-truc-do-thi-ethanol-ddh-lo-238-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
