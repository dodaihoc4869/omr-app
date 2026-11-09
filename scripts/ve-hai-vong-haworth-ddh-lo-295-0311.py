"""Nguồn1217: giữ hai vòng Haworth, sáu OH và các nét phối cảnh riêng."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='dcf530b67f2a5183ad13283acca2125d81e95775027b988353bc541ff5a7866d';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh'] if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
b='<g fill="none" stroke="#363636" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M40 172V138L85 93H135 M161 103L193 138L210 167 M85 93V59 M85 179V151 M148 185V217 M226 167L242 138L287 93H335 M362 103L395 138V172 M287 93V59 M287 179V151 M350 185V217"/></g>'
# Hai cạnh trước đậm đều; bốn cạnh xiên thuôn về đỉnh sau.
b+='<path d="M40 137L87 178L85 185Z M85 178H148V185H85Z M145 179L193 137L148 185Z M242 137L289 178L287 185Z M287 178H350V185H287Z M347 179L395 137L350 185Z" fill="#292929"/>'
for x,y,t in [(148,105,'O'),(350,105,'O'),(217,193,'O'),(50,198,'OH'),(96,146,'OH'),(159,243,'OH'),(298,146,'OH'),(361,243,'OH'),(406,198,'OH')]:b+=F.label(x,y,t,29,fill='#363636')
# CH2OH: chỉ số dưới bằng glyph DDH nhỏ, giữ carbon đầu tại nhánh đứng.
for x in [74,276]:
 b+=F.label(x,55,'CH',29,anchor='start',fill='#363636');a=F.advance('CH',29)
 b+=F.label(x+a,61,'2',19,anchor='start',fill='#363636');b+=F.label(x+a+F.advance('2',19),55,'OH',29,anchor='start',fill='#363636')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="471" height="286" viewBox="0 0 471 286"><title>Hai vòng carbohydrate theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='hai-vong-haworth-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=1217,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='2Haworth/2ringO1bridgeO/2CH2OH6freeOH/4TAPER2frontbold/0explicitH0Cnums/regularDDH/noaddedcaption-name-answer.')
(K/'cau-truc-hai-vong-haworth-ddh-lo-295-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(fn)
