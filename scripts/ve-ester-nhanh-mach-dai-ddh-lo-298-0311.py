"""Nguồn1251: vẽ từng đỉnh nhìn thấy; không sửa connectivity theo tên chất trong đề."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='e376ce1113281ce2041784be29b2679c0a3c99bc0b6b841eed5b4310b89caba6';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh'] if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
# Mạch acyl có đúng 16 đỉnh kể cả carbonyl; không suy thêm H hay C.
pts=[(5,64),(19,56),(33,64),(47,56),(61,64),(75,56),(89,64),(103,56),(117,64),(131,56),(145,64),(159,56),(173,64),(187,56),(201,64),(215,56)]
d='M'+'L'.join(f'{x} {y}'for x,y in pts)
b=f'<path d="{d} M215 56V47 M222 36L229 32V16L243 8 M229 32L243 40V56L257 64V80L271 88 M215 54L225 60 M214 58L223 63" fill="none" stroke="#222222" stroke-width="0.9" stroke-linecap="round" stroke-linejoin="round"/>'
b+=F.label(215,45,'O',12,fill='#222222')+F.label(229,69,'O',12,fill='#222222')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="278" height="96" viewBox="0 0 278 96"><title>Công thức khung ester theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='ester-nhanh-mach-dai-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=1251,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='24bareC2O/acyl16vertices1COdouble2splitrays/esterO-DIRECTbranchC-UP2C-DOWNRIGHT5C/0CCdouble/allthinuniform/regularDDH/noaddedCH2-H-stereo-caption-name-answer/nochangeconnectivityfromstem.')
(K/'cau-truc-ester-nhanh-mach-dai-ddh-lo-298-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(fn)
