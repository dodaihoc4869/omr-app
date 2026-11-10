"""Mạch acid nguồn889: đếm đỉnh theo nguồn, COOH giữ nguyên dạng chữ."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='a2ff4ba94e5fb5796ddfdd39c5651c86c003d3e7d71a6c458b7ed30f7077c195';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
b='<path d="M44 226L68 179L44 132L67 85H114L138 38H185L208 85H255L279 132L255 179L279 226H326L350 179L326 132L350 85H397L421 38H468L491 85H538L551 112 M56 132L74 98 M144 50H179 M249 98L268 132 M286 213H319 M339 132L357 98 M428 50H461" fill="none" stroke="#252440" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
b+=F.label(549,139,'COOH',30,anchor='start')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="665" height="262" viewBox="0 0 665 262"><title>Mạch acid theo nguồn889</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='mach-acid-native889-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=889,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='21bareC+COOHfirstC=22C/6CCdouble/2OcondensedCOOH/1freeLEFTDOWNend/rightCOOHfirstCanchor/regularupright-allthin0stereo/noaddedH-CH3-COdouble-caption-answer/noalias1385-1145')
(K/'cau-truc-mach-acid-native889-ddh-lo-334-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
