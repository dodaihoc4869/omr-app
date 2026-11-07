"""Nguồn711: ba amino acid và các vị trí đánh số đúng nguồn."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='845ce482bdb03ab479d04c87612b9546b920ad8b6f7f00b938e51470a6e0c509'
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[v for v in q['hinh'] if v['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
def line(d,w=2.4):return f'<path d="{d}" fill="none" stroke="#252440" stroke-width="{w}" stroke-linejoin="round"/>'
def first(x,y,t,z=29):return F.label(x-F.advance(t[0],z)/2,y,t,z,'start')
def nlast(x,y):return F.label(x-F.advance('H₂',29)-F.advance('N',29)/2,y,'H₂N',29,'start')
b=line('M145 119L170 105L195 119 M167 104V78 M174 104V78 M226 119L251 105L291 127L331 105L371 127L411 105L438 119 M408 104V78 M415 104V78 M371 127V157')
b+=nlast(129,140)+first(170,72,'NH')+F.label(210,140,'N',29)+F.label(210,167,'H',29)+first(371,184,'NH₂')+F.label(411,73,'O',29)+first(451,140,'OH')
b+=line('M610 116L635 103L676 124L716 102L756 124L796 103L823 116 M632 102V77 M639 102V77 M793 102V77 M800 102V77 M756 124V154')
b+=F.label(596+F.advance('O',29)/2,136,'HO',29,'end')+F.label(635,72,'O',29)+F.label(796,72,'O',29)+first(834,136,'OH')+first(756,181,'NH₂')
b+=line('M990 116L1015 103L1055 124V154 M1055 124L1080 110 M1055 118L1077 105')+nlast(973,137)+F.label(1095,113,'O',29)+first(1055,182,'OH')
for x,y,t in [(117,104,'(1)'),(337,176,'(2)'),(594,160,'(1)'),(837,160,'(2)')]:b+=F.label(x,y,t,25)
for x,y,t in [(260,236,'Arginine (Arg)'),(700,233,'Glutamic acid (Glu)'),(1035,240,'Glycine (Gly)')]:b+=F.label(x,y,t,28)
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1187" height="285" viewBox="0 0 1187 285"><title>Ba cấu trúc theo nguồn</title>'+b+'</svg>').encode()
hh=hashlib.sha256(raw).hexdigest();fn='ba-amino-acid-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=711,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='3moleculesArg-Glu-Gly/13C8O6N/4COdouble+1CNdouble/H2N-NH-N-H-NH2literal/4numbers(1)(2)/3captionscase/noextra charges-stereo-arrows-answer/DDHpath.')
(K/'cau-truc-ba-amino-acid-ddh-lo-253-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
