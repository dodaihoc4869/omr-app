"""Nguồn1347 đầy đủ và259 cắt đáy: dựng từ nhãn nhìn trực tiếp ở bản đầy đủ."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text())
def path(d):return f'<path d="{d}" fill="none" stroke="#252440" stroke-width="1.8" stroke-linejoin="round"/>'
b=path('M10 46L68 12L128 46V112L68 146L10 112ZM128 46L188 12L248 46L294 20M248 46V100M68 21L118 50M18 53V106M118 108L68 137')
b+=F.label(299,27,'CH₃',22,'start')+F.label(239,128,'NH₂',22,'start')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="354" height="162" viewBox="0 0 354 162"><title>Cấu tạo theo nguồn đầy đủ công khai</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='amphetamine-literal-ddh-'+hh+'.svg';(K/fn).write_bytes(raw);out=[]
for i,h in [(1347,'f3f6a910d977b78470e1d028bae650c6ef285ae3c54d3d8d1a03bb8112008a46'),(259,'2ca5723dcc6a244b502fc4d34a8aab0e98c8ef8f0765a6ed0e55be6511eb7770')]:
 qs=[]
 for q in iv['questions']:
  refs=[v for v in q['hinh']if v['hash']==h]
  if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
 out.append(dict(i=i,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,geometryBaseSource=1347,ghiChuDung='PhLEFT/3aromaticDOUBLE/CH3EXPLICITupperright-Cfirst/NH2DOWN-Nfirst/nocharges-stereo-caption/DDHpath;259croppeduppermatches1347fullsamepublicstem,missingbottomđọcTRỰCTIẾP1347KHÔNGđoántheory/khôngsửaảnhimmutable.'))
(K/'cau-truc-amphetamine-literal-ddh-lo-220-ban-dung.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n')
