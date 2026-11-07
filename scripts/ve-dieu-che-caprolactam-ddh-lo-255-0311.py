"""Sơ đồ nguồn717: giữ nguyên ba cấu trúc và hai điều kiện in trên mũi tên."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='ebd51738484df2eee9e02198e0bf2fdcf7edfa0c15dc2333d4e5ea3ec7aacf7e'
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[v for v in q['hinh']if v['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
def line(d,w=2.3):return f'<path d="{d}" stroke="#252440" stroke-width="{w}" fill="none" stroke-linejoin="round"/>'
b=line('M145 178L186 201V249L145 273L104 249V201Z M142 177V150 M148 177V150')+F.label(145,145,'O',27)
b+=line('M360 178L402 201V249L360 273L318 249V201Z M357 177V148 M364 177V148 M367 117L378 99')+F.label(360,143,'N',27)+F.label(397,95,'OH',27)
b+=line('M641 150L592 174L581 228L616 271H666L707 228L699 190 M641 150L677 168 M638 148V106 M645 148V106 M708 164L728 145')+F.label(641,101,'O',27)+F.label(692,182,'N',27)+F.label(743,143,'H',27)
for x1,x2,y,t in [(198,297,221,'NH₂OH'),(418,537,221,'H₂SO₄')]:
 b+=line(f'M{x1} {y}H{x2} M{x2-11} {y-5}L{x2} {y}L{x2-11} {y+5}',2)
 b+=F.label((x1+x2)/2,214,t,24)
for x,t in [(151,'cyclohexanone'),(383,'cyclohexanoxime'),(649,'caprolactam')]:b+=F.label(x,300,t,24)
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="820" height="356" viewBox="0 0 820 356"><title>Sơ đồ điều chế theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='dieu-che-caprolactam-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=717,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='3molecules/18C3O2N/2COdouble1CNdouble/2sixrings1sevenringNH/oximeOHupright/2RIGHTarrowheads/NH2OH-H2SO4literal/3lowercasecaptions/noanswer-temp-extraH2O.')
(K/'cau-truc-dieu-che-caprolactam-ddh-lo-255-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(fn)
