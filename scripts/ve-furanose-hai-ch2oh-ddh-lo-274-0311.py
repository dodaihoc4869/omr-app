"""Nguồn863: giữ hai nêm, cạnh đậm và khoảng ngắt liên kết sau OH phía trước."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='9d67a770bfcd66c025f7ff6ed341b1d2494180e500e097348f709e1343183a53';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
def line(d,w=2):return f'<path d="{d}" fill="none" stroke="#252440" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round"/>'
b='<g transform="translate(20 20)">'+line('M52 119L149 91 M179 91L229 105 M238 108L277 119 M52 119V73 M277 119V73 M277 119V175 M235 162V99 M95 162V201')
b+='<path d="M52 119L91 162L99 162Z M277 119L231 162L239 162Z" fill="#252440"/>'+line('M95 162H235',7)
b+=F.label(165,96,'O',30)
for x,y,t in [(42,69,'CH₂OH'),(266,201,'CH₂OH'),(265,65,'OH'),(223,91,'OH'),(83,226,'OH')]:b+=F.label(x,y,t,30,'start')
b+='</g>'
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="437" height="307" viewBox="0 0 437 307"><title>Vòng đường hai nhóm CH2OH theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='furanose-hai-ch2oh-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=863,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='5memberring4C1O+2CH2OH+3freeOH=6C6O/2TAPER1boldhorizontal/rearO-rightbondGAPbehindfrontOHvertical/nojunction/noexplicitH-nums-caption-answer.')
(K/'cau-truc-furanose-hai-ch2oh-ddh-lo-274-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(fn)
