"""Nguồn10: hai công thức surfactant literal, giữ điện tích và mọi đỉnh mạch."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='01818a91aa8ba7178a6488db185db06c17fbeb82c1fe479a05a58e1583d31947';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[v for v in q['hinh']if v['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
def line(d,w=2):return f'<path d="{d}" fill="none" stroke="#252440" stroke-width="{w}" stroke-linejoin="round"/>'
def poly(a):return line('M'+'L'.join(f'{x} {y}'for x,y in a))
top=[(35,119),(79,94),(122,119),(166,94),(210,119),(254,94),(297,119),(341,94),(385,119),(429,94),(472,119),(516,94),(560,119),(604,94),(647,119),(691,94),(735,119),(778,94)]
bottom=[(75,228),(109,209),(156,236),(203,209),(250,236),(298,209),(345,236),(393,209),(440,236),(488,209),(535,236),(582,209),(630,236)]
b=poly(top)+line('M778 94L806 110M774 94V64M782 94V64')+F.label(779,57,'O',38)+F.label(825,133,'O',38)+F.label(841,112,'−',23)+F.label(875,133,'Na',38)+F.label(906,113,'+',25)+F.label(475,172,'Sodium stearate (X)',31)
b+=poly(bottom)+line('M630 236L677 209L725 236V291L677 318L630 291Z M636 239L676 216M718 241V286M675 311L637 287M703 264H741')
b+=F.label(757,278,'S',31)+line('M751 229V248M759 229V248M751 283V302M759 283V302M775 264H794')+F.label(756,222,'O',31)+F.label(756,332,'O',31)+F.label(813,278,'O',31)+F.label(828,261,'−',19)+F.label(838,319,'Na',31)+F.label(860,303,'+',20)
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="960" height="365" viewBox="0 0 960 365"><title>Hai công thức chất hoạt động bề mặt theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='hai-surfactant-ddh-'+hh+'.svg';(K/fn).write_bytes(raw);r=dict(i=10,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,topPoints=top,bottomPoints=bottom,ghiChuDung='Top18CcarboxylateO−Na+/Sodiumstearate(X);bottom12alkylC+benzene6C/3double/expandedS(=O)2O−Na+free/literalbondstart703264inring/NObottomcaption/noHadded/DDHpath.');(K/'cau-truc-hai-surfactant-ddh-lo-191-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
