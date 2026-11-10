"""Ephedrine nguồn1154: nét mảnh đồng đều, không suy diễn lập thể."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='d12bfc880ca5fc2afe7c50c2ccd81a85651ccf6689a5d01eef21e05fba352c73';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh'] if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
b='<path d="M68 93L123 124V188L68 220L14 188V124Z M69 102L115 129 M115 182L69 211 M22 130V182 M123 124L177 93L232 124L273 101 M177 93V47 M232 124V188 M287 80V29" fill="none" stroke="#252440" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>'
b+=F.label(164,44,'OH',35,anchor='start')+F.label(274,107,'NH',35,anchor='start')
b+='<g transform="translate(169 258)skewX(-10)">'+F.label(0,0,'Ephedrine',31)+'</g>'
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="326" height="272" viewBox="0 0 326 272"><title>Ephedrine theo nguồn1154</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='ephedrine-native1154-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=1154,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='10C1N1O/Ph3innerdouble/OHUP-Oanchor/NHliteralNanchor-NmethylUP/alphaMethylDOWN/allthinuniform0stereo/chemicalregular-EphedrineREGULARITALIC/noaddedH-CH3-charge-answer;nonfigureedgeprintfragmentsomitONLYafterallrefsproof')
(K/'cau-truc-ephedrine-native1154-ddh-lo-323-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
