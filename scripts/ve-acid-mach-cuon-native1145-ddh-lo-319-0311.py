"""Mạch acid1145: đếm đỉnh trực tiếp, giữ sáu nối đôi và hai chân carbonyl."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='ced42548a5bd44a35229b977f61073a3b767c656388de3691c3570813a430349';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh'] if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
def path(d):return f'<path d="{d}" fill="none" stroke="#222" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>'
b=path('M57 90H101L123 53H167L189 16H232L255 53H298L320 90L299 127L320 164H365L386 127L365 90L387 53H431L454 16H497L519 53H562L584 90L563 127L585 164')
b+=path('M195 25H226 M295 62L309 87 M327 154H358 M377 87L391 62 M460 25H491 M558 62L573 87')
# Hai chân đặt trên hai cạnh kề ở góc carbonyl; không nối cầu ngang hay tách trắng.
b+=path('M99 90L120 127 M104 85L126 124')
b+=F.label(7,101,'HO',31,anchor='start',fill='#222')+F.label(131,151,'O',29,fill='#222')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="601" height="182" viewBox="0 0 601 182"><title>Mạch theo nguồn1145</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='acid-mach-cuon-native1145-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=1145,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='22bareC2O/6CCdouble/COdoubleDOWNRIGHT2splitfeetCONTINUOUS/HOleftOanchor/freeRIGHTDOWN/allthinregular/noaddedH-CH3-nums-caption-answer/noalias1341-noCOwhitegap')
(K/'cau-truc-acid-mach-cuon-native1145-ddh-lo-319-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
