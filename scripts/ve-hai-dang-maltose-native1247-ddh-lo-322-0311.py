"""Hai dạng cấu tạo nguồn1247; giữ nhánh, nêm và carbon đầu trần."""
from pathlib import Path
import importlib.util,json,hashlib,math
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='e24490e9444f5578cbedb302d200c9f2972434ed5a5626dcc228b069d161be76';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh'] if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
b=''
def line(d,w=2):
 global b
 b+=f'<path d="{d}" fill="none" stroke="#252440" stroke-width="{w}" stroke-linejoin="round" stroke-linecap="butt"/>'
def wedge(a,z):
 global b
 dx=z[0]-a[0];dy=z[1]-a[1];l=math.hypot(dx,dy);nx=-dy/l*4;ny=dx/l*4
 b+=f'<path d="M{a[0]} {a[1]}L{z[0]} {z[1]+4}L{z[0]} {z[1]-4}Z" fill="#252440"/>'
def label(x,y,t,size=35,weight='de',anchor='middle'):
 global b
 b+=F.label(x,y,t,size,weight=weight,anchor=anchor)
def ring(c1,c2,c3,c4,c5,ox):
 line(f'M{c4[0]} {c4[1]}L{c5[0]} {c5[1]}H{ox-16} M{ox+15} 132L{c1[0]} {c1[1]}')
 line(f'M{c3[0]} {c3[1]}H{c2[0]}',8)
 wedge(c4,c3);wedge(c1,c2);label(ox,130,'O')
ring((242,169),(185,210),(90,210),(35,169),(90,116),197.5)
ring((516,169),(459,210),(366,210),(315,169),(359,116),466.5)
ring((866,170),(813,210),(708,210),(653,169),(708,116),816.5)
line('M954 169L1010 116V64L1047 42 M1010 116H1053')
line('M1010 210H1118',8);wedge((954,169),(1010,210));wedge((1178,181),(1118,210))
for x,end in [(90,123),(359,392),(708,741)]:line(f'M{x} 116V64L{end} 42')
for x in [127,396,745,1051]:label(x,46,'OH',anchor='start')
for x,y,end,tx,base in [(35,169,218,23,250),(90,210,162,77,158),(185,210,257,172,288),(366,210,162,353,158),(459,210,257,446,288),(516,169,218,503,250),(653,169,218,640,250),(708,210,162,695,158),(813,210,257,800,288),(1010,210,162,997,158),(1118,210,257,1105,288)]:
 line(f'M{x} {y}V{end}');label(tx,base,'OH',anchor='start')
label(1056,131,'OH',anchor='start')
line('M242 169L265 197 M291 197L315 169 M866 170L894 198 M921 198L954 169')
label(278.5,225,'O');label(907.5,225,'O')
line('M1178 181L1186 133 M1183 184L1199 137 M1178 181L1214 202')
label(1200.5,131,'O');label(1232.5,230,'H')
label(286,364,'(I)',46,'dam');label(965.5,364,'(II)',46,'dam')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1260" height="383" viewBox="0 0 1260 383"><title>Hai dạng cấu tạo theo nguồn1247</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='hai-dang-maltose-native1247-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=1247,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='2panels24C22O16OH/4bareterminalC-NOCH2/1explicitH/8TAPER4boldfront/chemicalregular2trueDAMuprightRomancaptions/noaddedH-CH2-nums-arrows-answer')
(K/'cau-truc-hai-dang-maltose-native1247-ddh-lo-322-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
