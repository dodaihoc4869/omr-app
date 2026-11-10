"""Hai dạng maltose nguồn962: giữ nét nêm, đầu carbon trần và cặp bán mũi tên."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='ad31b9948a5a3eb1be18dc10f69ecf5a62c114f9fa9e6d59ef94baea26c00308';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh'] if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
b=''
def line(d,w=1.7):
 global b
 b+=f'<path d="{d}" fill="none" stroke="#252440" stroke-width="{w}" stroke-linejoin="round" stroke-linecap="butt"/>'
def wedge(a,z):
 global b
 b+=f'<path d="M{a[0]} {a[1]}L{z[0]} {z[1]+3}L{z[0]} {z[1]-3}Z" fill="#252440"/>'
def label(x,y,t,size=22,weight='de',anchor='middle'):
 global b
 b+=F.label(x,y,t,size,weight=weight,anchor=anchor)
def ring(c1,c2,c3,c4,c5,ox,oy):
 line(f'M{c4[0]} {c4[1]}L{c5[0]} {c5[1]}H{ox-12} M{ox+11} {oy+10}L{c1[0]} {c1[1]}')
 line(f'M{c3[0]} {c3[1]}H{c2[0]}',6)
 wedge(c4,c3);wedge(c1,c2);label(ox,oy+7,'O')
ring((216,145),(176,162),(109,162),(72,142),(113,112),182,112)
ring((411,152),(372,168),(305,168),(270,146),(300,114),374,114)
ring((708,151),(667,168),(600,168),(563,145),(604,119),674,118)
line('M760 154L791 119V93L814 78 M791 119H817')
line('M796 173H862',6);wedge((760,154),(796,173));wedge((902,156.5),(862,173))
for x,y,ty,ex,ey in [(113,112,83,132,72),(300,114,89,322,75),(604,119,89,624,75)]:
 line(f'M{x} {y}V{ty}L{ex} {ey}')
for x,y in [(136,72),(326,74),(628,77),(818,78)]:label(x,y,'OH',anchor='start')
for x,y,end,tx,base in [(72,142,165,64,185),(109,162,141,102,137),(176,162,188,167,207),(305,168,144,297,139),(372,168,194,363,212),(411,152,177,403,196),(563,145,170,555,192),(600,168,144,592,139),(667,168,194,658,212),(796,173,148,788,144),(862,173,197,854,218)]:
 line(f'M{x} {y}V{end}');label(tx,base,'OH',anchor='start')
label(820,126,'OH',anchor='start')
line('M216 145L232 162 M252 163L270 146 M708 151L724 167 M745 167L760 154')
label(242,179,'O');label(734,185,'O')
line('M899.5 156.5L905.5 131 M905.5 158L911.5 133.5 M899.5 156.5H905.5L924 169')
label(913,128,'O');label(935,183,'H')
line('M457 146H520 M457 155H520',1.4)
b+='<path d="M507 142L520 146H507Z M457 155H469V159Z" fill="#252440"/>'
label(255,233,'(I)',29,'dam');label(754,239,'(II)',29,'dam')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="998" height="290" viewBox="0 0 998 290"><title>Hai dạng maltose cân bằng theo nguồn962</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='maltose-can-bang-native962-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=962,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='24C22O16OH/3Haworth1openaldehyde1explicitH/4bareterminalC-noCH2/8TAPER4boldfront6px-verticalfeet/2HALFfilledharpoons/regularchemical2trueDAMcaptions/OH-leftI-down4-stemshort4-clearbackbond/noaddedH-CH2-nums-answer-noalias1247')
(K/'cau-truc-maltose-can-bang-native962-ddh-lo-340-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
