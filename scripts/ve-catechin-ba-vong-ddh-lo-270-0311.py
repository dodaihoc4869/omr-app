"""Nguồn812: hai vòngphenyl vàvòngether, khôngtựthêmstereo haycaption."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='9671112ca6ba5c48ea8dce8e5085edefab75c53865271acb72340cf19718ebf8';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
def line(d):return f'<path d="{d}" fill="none" stroke="#252440" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
b='<g transform="translate(20 20)">'
for d in ['M122 182L180 149L239 182V250L180 283L122 250Z M130 188V245 M181 157L230 186 M181 274L230 245','M239 250L297 283L356 250V182L311 157 M284 157L239 182','M415 81L473 47L532 81V148L473 182L415 148Z M424 85L473 57 M524 87V143 M424 145L473 174','M356 182L415 148 M122 182L76 156 M180 283V337 M356 250L402 276 M532 81L577 55 M532 148L577 173']:b+=line(d)
b+=F.label(297,163,'O',28)+F.label(73,162,'HO',28,'end')+F.label(170,365,'OH',28,'start')+F.label(404,297,'OH',28,'start')+F.label(579,61,'OH',28,'start')+F.label(579,196,'OH',28,'start')
b+='</g>';raw=('<svg xmlns="http://www.w3.org/2000/svg" width="691" height="433" viewBox="0 0 691 433"><title>Ba vòng theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='catechin-ba-vong-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=812,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='15C6O/2phenyl6innerdoubles/1ether6memberringfusedleft/5OH1literalHO4OH/2sharedvertices/ALLthinuniform/noH-stereo-wedge-charges-caption-answer.')
(K/'cau-truc-catechin-ba-vong-ddh-lo-270-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(fn)
