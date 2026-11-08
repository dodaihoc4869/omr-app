"""Nguồn850: giữ cấu trúc, hai chiều cân bằng và ba tên chất nguyên văn."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='9bd83e1ae3ac6448887a5da75485044a74206cfeb6bcd440ea8376df88d8032a';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
def line(d):return f'<path d="{d}" fill="none" stroke="#252440" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>'
b='<g transform="translate(20 20)">'
b+=line('M91 109L114 96L136 109 M111 95V72 M117 95V72')
b+=F.label(89,128,'H₃C',30,'end')+F.label(114,67,'O',30)+F.label(138,128,'OH',30,'start')
b+=F.label(226,126,'+',30)
b+=F.label(328,124,'HO',30,'end')+line('M332 103L352 92L387 112L423 92L445 105 M423 91V68')
b+=F.label(412,63,'CH₃',30,'start')+F.label(447,125,'CH₃',30,'start')
b+=line('M543 106H725 M725 112H543')+'<path d="M725 106L711 101L711 106Z M543 112L557 112L557 117Z" fill="#252440"/>'
b+=F.label(634,88,'H₂SO₄ đặc, t°',24)
b+=line('M803 112L827 99L849 111 M824 98V75 M830 98V75 M875 112L897 100L932 120L968 100L990 113 M968 99V76')
b+=F.label(802,132,'H₃C',30,'end')+F.label(827,71,'O',30)+F.label(862,132,'O',30)+F.label(957,71,'CH₃',30,'start')+F.label(992,133,'CH₃',30,'start')
b+=F.label(1082,122,'+',30)+F.label(1107,122,'H₂O',30,'start')
for x,y,t in [(120,165,'Acetic acid'),(389,169,'Isoamyl alcohol'),(904,169,'Isoamyl acetate')]:b+=F.label(x,y,t,30,weight='dam')
b+='</g>'
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1235" height="250" viewBox="0 0 1235 250"><title>Phản ứng tạo isoamyl acetate theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='isoamyl-acetate-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=850,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='Acetic acid+Isoamyl alcohol⇌Isoamyl acetate+H2O/2COdouble/2CH3branches/2opposingfilledhalfheads/H2SO4 đặc,t°/3actualdamcaptions-case/noadded-yield-phase-answer.')
(K/'cau-truc-isoamyl-acetate-ddh-lo-272-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(fn)
