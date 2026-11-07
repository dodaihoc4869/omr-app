"""Nguồn608: giữ mọi liên kết và nhãn trong phản ứng điều chế paracetamol."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='70a4ff274f825ee57f0a69f28785dd06be24f313617124d67032bdcf38806142'
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[v for v in q['hinh'] if v['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
def line(d,w=2):return f'<path d="{d}" fill="none" stroke="#252440" stroke-width="{w}" stroke-linejoin="round"/>'
def first(x,y,t,z=24):return F.label(x-F.advance(t[0],z)/2,y,t,z,'start')
def phenyl(x):
 return line(f'M{x} 151L{x+31} 168V202L{x} 219L{x-31} 202V168Z M{x-25} 173V198 M{x+1} 158L{x+25} 172 M{x+25} 198L{x+1} 212 M{x} 219V243')
b=phenyl(137)+phenyl(714)
b+=line('M137 151V129 M714 151V127 M313 202L337 191L355 201 M378 201L397 191L419 202 M334 190V169 M340 190V169 M394 190V169 M400 190V169 M725 108L745 96L765 107 M742 95V75 M748 95V75 M513 188H620 M608 184L621 188L608 192')
b+=first(137,124,'NH₂')+first(137,264,'OH')+first(714,263,'OH')
b+=F.label(714-F.advance('H',24)-F.advance('N',24)/2,124,'HN',24,'start')
b+=F.label(337,165,'O',24)+F.label(397,165,'O',24)+F.label(367,219,'O',24)+F.label(745,70,'O',24)
b+=F.label(314,219,'H₃C',24,'end')+F.label(419,219,'CH₃',24,'start')+F.label(766,124,'CH₃',24,'start')
b+=F.label(886,189,'CH₃COOH',24,'start')
for x in [228,837]:b+=F.label(x,193,'+',24)
for x,t in [(137,'4-aminophenol'),(372,'acetic anhydride'),(725,'paracetamol'),(955,'acetic acid')]:b+=F.label(x,324,t,26,weight='dam')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1090" height="362" viewBox="0 0 1090 362"><title>Phản ứng theo nguồn</title>'+b+'</svg>').encode()
hh=hashlib.sha256(raw).hexdigest();fn='paracetamol-phan-ung-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=608,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,hashPhongDam=F.font('dam')[1],trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='2Ph3doubleeach/anhydride2COdoubleO/amideHNliteralCOdoubleCH3/2OH/NH2/CH3COOH/4lowercasecaptions/2plus1RIGHThead/noaddedconditions-answer/DDHpath.')
(K/'cau-truc-paracetamol-phan-ung-ddh-lo-248-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
