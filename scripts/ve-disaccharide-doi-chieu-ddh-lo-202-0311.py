"""Nguồn73: saccharose và maltose, từng nguyên tử/chỉ số/nhãn nguồn."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='0ea2d853eeaf3d420361bc7e85bc98572359ad43a93a9b52f874fd9c4c7ce1df';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[v for v in q['hinh']if v['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
def line(d,w=.95):return f'<path d="{d}" fill="none" stroke="#252440" stroke-width="{w}" stroke-linejoin="round"/>'
def label(x,y,t,z=14,a='middle',weight='de'):return F.label(x,y,t,z,a,weight=weight)
def first(x,y,t,z=14):return F.label(x-F.advance(t[0],z)/2,y,t,z,'start')
def glucose(dx=0,dy=0,bridge=False):
 b=f'<g transform="translate({dx} {dy})">'+line('M23 140L53 107H89M104 115L128 140L97 172H54L23 140')+line('M54 172H97',2.7)+label(97,113,'O')
 b+=line('M53 107V88M53 107V120M23 140V116M54 172V156M54 172V192M97 172V153M97 172V192M128 140V116')
 if not bridge:b+=line('M23 140V160')+first(23,176,'OH')
 b+=first(53,86,'CH₂OH')+label(53,134,'H')+label(23,112,'H')+first(54,151,'OH')+label(54,207,'H')+label(97,148,'H')+first(97,207,'OH')+label(128,112,'H')
 for x,y,t in [(135,139,'1'),(93,184,'2'),(59,184,'3'),(16,144,'4'),(48,108,'5'),(54,70,'6')]:b+=label(x,y,t,9)
 return b+'</g>'
b=glucose()+glucose(398,0)+glucose(575,-4,True)
b+=line('M128 140L153 160M172 160L211 134')+label(163,171,'O')
b+=line('M211 134L237 184H292L311 131L269 109M254 109L211 134')+line('M237 184H292',2.7)+label(262,113,'O')
b+=line('M211 134V110M237 184V162M237 184V204M292 184V164M292 184V204M311 131V113M311 131V150')
# C1 fructose giữ HOCH₂: O được viết trước carbon theo nguồn.
b+=label(210,106,'HOCH₂')+label(237,158,'H')+first(237,219,'OH')+label(286,160,'HO')+label(292,220,'H')+label(311,110,'H')+first(311,177,'CH₂OH')
for x,y,t in [(211,91,'1'),(205,134,'2'),(242,197,'3'),(287,197,'4'),(318,133,'5'),(317,161,'6')]:b+=label(x,y,t,9)
b+=line('M526 140L549 160M571 160L598 136M703 136V157')+label(561,171,'O')+first(703,174,'OH')
b+=label(166,29,'liên kết α-1,2-glycoside',13)+line('M150 38V152M147 147L150 152L153 147',.85)
b+=label(558,26,'liên kết α-1,4-glycoside',13)+line('M545 35V150M542 145L545 150L548 145',.85)
b+=label(177,244,'Phân tử saccharose',14,weight='dam')+label(564,243,'Phân tử maltose',14,weight='dam')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1454" height="502" viewBox="0 0 1454 502"><title>Đối chiếu hai disaccharide theo nguồn</title><g transform="scale(2)">'+b+'</g></svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='disaccharide-doi-chieu-ddh-'+hh+'.svg';(K/fn).write_bytes(raw);r=dict(i=73,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='2panels/3sixrings1five/24Cnumbers/allH-OH-CH2OH-HOCH2/2bridgeO/2leaderarrows/2glycosidecaptions/2bottomcaptions/4lowerhorizontalbold/uniformdiagonals/DDHpath.');(K/'cau-truc-disaccharide-doi-chieu-ddh-lo-202-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
