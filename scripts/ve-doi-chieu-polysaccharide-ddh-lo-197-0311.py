"""Nguồn47: amylose ngang và cellulose chéo; không alias bộ khác."""
from pathlib import Path
import importlib.util,json,hashlib,math
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='09bee4ba201084345a24020edca93309b20d32786e653def6f162e4341eb3d23';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[v for v in q['hinh']if v['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
def line(d,w=1.6):return f'<path d="{d}" fill="none" stroke="#252440" stroke-width="{w}" stroke-linejoin="round"/>'
def first(x,y,t,size=20):return F.label(x-F.advance(t[0],size)/2,y,t,size,'start')
def wedge(p,q):
 return line(f'M{p[0]} {p[1]}L{q[0]} {q[1]}',2)
def ring(x,y,beta=False):
 b=f'<g transform="translate({x} {y})">'+line('M-36 36L0 0H40M64 10L88 36')+F.label(51,9,'O',20)+wedge((-36,36),(0,71))+line('M0 71H52',2.6 if beta else 3)+wedge((88,36),(52,71))
 b+=line('M0 0V-20M0 0V13M-36 36V17M0 71V54M0 71V92M52 71V54M52 71V92')+first(0,-25,'CH₂OH',22)+F.label(0,30,'H',19)+F.label(-36,7,'H',19)+first(0,50,'OH')+F.label(0,108,'H',19)+F.label(52,50,'H',19)+first(52,108,'OH')
 b+=(line('M88 36V55')+F.label(88,77,'H',19))if beta else(line('M88 36V17')+F.label(88,7,'H',19))
 return b+'</g>'
b=''
for x in [146,356,566]:b+=ring(x,76)
b+=line('M77 137L110 112M234 112L263 137M288 137L320 112M444 112L473 137M498 137L530 112M654 112L681 137')
for x in [64,275,485,696]:b+=F.label(x,147,'O',20)
b+=F.label(38,147,'…',21)+F.label(724,147,'…',21)+F.label(380,242,'Phân tử amylose',27)
for x,y in [(885,179),(1087,124),(1285,68)]:b+=ring(x,y,True)
b+=line('M819 234L849 215M973 215L996 192M1023 178L1051 160M1175 160L1195 137M1220 123L1249 104M1373 104L1397 79')
for x,y in [(808,244),(1009,193),(1208,137),(1409,80)]:b+=F.label(x,y,'O',20)
b+=F.label(782,244,'.',21)+F.label(792,244,'.',21)+F.label(1435,80,'…',21)+F.label(1117,330,'Phân tử cellulose',27)
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1505" height="365" viewBox="0 0 1505 365"><title>Đối chiếu amylose và cellulose theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='doi-chieu-polysaccharide-ddh-'+hh+'.svg';(K/fn).write_bytes(raw);r=dict(i=47,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='2panels3Haworthngangamylose/3Haworthchéocellulose/6CH2OH/allH-OH-C5Hexpl/diagonalsUNIFORM-notwedges/bridgesO+2terminalOmỗipanel/3nhóm3dots+1nhóm2dotsTRÁIcellulose/2captions/noHnumbersadded/noalias43-590/printlinesexcluded/DDHpath.');(K/'cau-truc-doi-chieu-polysaccharide-ddh-lo-197-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
