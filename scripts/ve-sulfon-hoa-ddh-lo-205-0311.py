"""Nguồn101: sơ đồ phản ứng literal, không diễn giải nhãn X."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='13bf4d0cad1e75ab4ef58f8ca6f78ee8b6aa4404c5b637ca658d21cd0115c4fe';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[v for v in q['hinh']if v['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
def path(d,w=2,fill='none'):return f'<path d="{d}" fill="{fill}" stroke="#252440" stroke-width="{w}" stroke-linejoin="round"/>'
def label(x,y,t,z=28,a='middle'):return F.label(x,y,t,z,a)
b=''
for d,cx,cy,rx,ry in [('M136 125L169 66L236 68L267 128L237 187L167 186Z',201,127,46,48),('M528 130L563 69L629 72L660 133L630 191L562 190Z',594,132,45,49),('M985 133L1018 74L1086 76L1117 138L1088 196L1018 193Z',1051,135,46,48)]:
 b+=path(d)+f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="none" stroke="#252440" stroke-width="2"/>'
b+=path('M86 125H136M472 129L528 130M930 133H985M660 133H716M1117 138H1163')
b+=label(70,138,'R')+label(454,140,'R')+label(918,144,'R')+label(719,143,'SO₃H',28,'start')+label(1170,145,'SO₃Na',28,'start')
b+=path('M283 126H423M805 132H895')+path('M410 121L423 126L410 131L413 126Z',1,'#252440')+path('M882 127L895 132L882 137L885 132Z',1,'#252440')
b+=label(351,111,'H₂SO₄ đặc',27)+label(351,156,'t°',24)+label(840,113,'X',28)
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1309" height="257" viewBox="0 0 1309 257"><title>Sơ đồ phản ứng theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='sulfon-hoa-ddh-'+hh+'.svg';(K/fn).write_bytes(raw);r=dict(i=101,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='3hexagons/3aromaticcircles/3Rleft/2RIGHTarrows/H2SO4đặc-t°/X/SO3H-SO3Na/literaldata/noanswer/DDHpath.');(K/'cau-truc-sulfon-hoa-ddh-lo-205-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
