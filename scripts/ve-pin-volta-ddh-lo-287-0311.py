"""Nguồn1049: chồng sáu cặp bản kim loại, sáu lớp bìa và ba đường chú thích."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='bdb70c5e116a5ede8424de2f16ecc0efc8678f15fdfd0889cb67d261ce2c9034';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
b='<path d="M280 59H295V80H280Z M280 370H295V391H280Z" fill="#000000"/>'
for y in [100,149,198,247,296,344]:b+=f'<rect x="222" y="{y}" width="132" height="7" fill="#009bd2" stroke="#394950" stroke-width="1"/>'
for y in [80,128,177,226,275,323]:b+=f'<rect x="210" y="{y}" width="155" height="21" rx="1.5" fill="#cecece" stroke="#333c3e" stroke-width="1"/>'
for y in [106,155,204,253,301,349]:b+=f'<rect x="210" y="{y}" width="155" height="21" rx="1.5" fill="#ff6900" stroke="#333c3e" stroke-width="1"/>'
b+='<path d="M172 249H233 M172 333H233 M172 360H233" fill="none" stroke="#6d797d" stroke-width="1.5"/>'
for y in [61,388]:b+=f'<circle cx="317" cy="{y}" r="11" fill="white" stroke="#6c7474" stroke-width="1"/>'
for x,y,t,z,a,c in [(317,69,'−',25,'middle','#596363'),(317,396,'+',25,'middle','#596363'),(67,233,'Bìa tẩm',20,'start','#252440'),(67,257,'dung dịch',20,'start','#252440'),(67,281,'H₂SO₄',20,'start','#252440'),(164,342,'Zinc',22,'end','#252440'),(164,367,'Copper',22,'end','#252440')]:b+=F.label(x,y,t,z,a,fill=c)
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="423" height="448" viewBox="0 0 423 448"><title>Pin Volta theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='pin-volta-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=1049,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='6grayZinc6orangeCopper6bluecardlayers/2blackterminals/TOPcircledminusBOTTOMcircledplus/3leadersNOheads/5regularlabelLinesBìa tẩm-dung dịch-H2SO4-Zinc-Copper/sub2sub4/noaddedwire-voltage-reaction-answer.')
(K/'cau-truc-pin-volta-ddh-lo-287-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(fn)
