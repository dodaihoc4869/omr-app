"""Nguồn854: giữ mạch hai liên kết đôi và COOH viết gọn, không thêm đáp án omega."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='9c148a9f92a3daf60da31e6fd5ef4e769c5f18446939bb965f4147e0c3c46844';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
vertices=[(65,113),(95,63),(125,113),(154,63),(184,113),(214,63),(273,63),(302,113),(331,63),(390,63),(420,113),(449,63),(479,113),(508,63),(538,113),(568,63),(596,113)]
d='M'+'L'.join(f'{x} {y}'for x,y in vertices)+'L614 80 M218 69H269 M335 69H386'
b='<g transform="translate(20 20)"><path d="'+d+'" fill="none" stroke="#252440" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>'+F.label(611,74,'COOH',32,'start')+'</g>'
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="779" height="191" viewBox="0 0 779 191"><title>Mạch acid hai liên kết đôi theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='acid-hai-noi-doi-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=854,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='17bareCvertices+condensedCOOHfirstCanchor=18C2O/2flatCCdouble/leftfreeend/allthinuniform/noexpandedCOOH-noaddedH-caption-n-omega-answer.')
(K/'cau-truc-acid-hai-noi-doi-ddh-lo-273-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(fn)
