"""Sơ đồ azo1191: năm mô-típ vòng, giữ mép cắt và các nhãn nguyên văn."""
from pathlib import Path
import json,hashlib,importlib.util
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='d7688cd9ab036cd559e84ff75d95ca6ca643f607381d8f751992f6fb49924878';b=''
def path(d,w=1.4,c='#000000'):
 global b
 b+=f'<path d="{d}" fill="none" stroke="{c}" stroke-width="{w}" stroke-linecap="butt" stroke-linejoin="round"/>'
def line(v,w=1.4):path('M'+'L'.join(f'{x} {y}'for x,y in v),w)
def lab(x,y,t,z=26,anchor='middle'):
 global b
 b+=F.label(x,y,t,z,anchor=anchor)
def first(x,y,t,z=26):lab(x-F.advance(t[0],z)/2,y,t,z,'start')
def ring(v,rays):
 line(v+[v[0]])
 for ray in rays:line(ray)
def head(tip,base,y):
 global b
 b+=f'<path d="M{tip} {y}L{base} {y-4.2}L{base+2.5} {y}L{base} {y+4.2}Z" fill="#000000"/>'
# Vòng đầu: hai nhánh cắt ở mép dưới, không phục hồi đỉnh ngoài ảnh.
line([[7,156],[7,115],[44,94],[81,115],[81,156],[52,172.5]])
line([[7,156],[35,172.5]])
for ray in [[[12,120],[12,151]],[[45,100],[74,118]],[[46,169],[74,152]]]:line(ray)
line([[44,94],[44,63]]);first(44,59,'NH₂')
# Diazonium: đỉnh dưới còn nhìn thấy một phần tại mép ảnh.
ring([[378,88],[414,109],[414,151],[378,172],[343,151],[343,109]],[[[379,94],[407,111]],[[407,148],[379,165]],[[348,113],[348,148]]])
line([[378,88],[378,61]]);first(378,54,'N₂')
path('M343 38H333V173 M414 38H423V173',1.1)
lab(432,39,'+',20);lab(439,57,'Cl',26,'start');lab(470,37,'−',20)
# Aniline trên mũi tên thứ hai: đỉnh và nét đôi riêng theo nguồn.
ring([[575,54],[607,71],[607,109],[575,127],[546,109],[546,71]],[[[575,61],[601,76]],[[601,105],[576,120]],[[551,75],[551,105]]])
line([[575,54],[575,29]]);first(575,24,'NH₂',25);lab(522,104,'+',26)
# Sản phẩm: hai vòng và hai tia N=N tách khỏi chữ.
ring([[709,86],[739,104],[739,140],[709,158],[678,140],[678,104]],[[[710,93],[733,107]],[[733,136],[710,151]],[[683,108],[683,136]]])
ring([[860,34],[891,52],[891,88],[860,104],[829,88],[829,52]],[[[835,54],[859,41]],[[885,56],[885,83]],[[835,84],[859,98]]])
line([[739,104],[755,94]]);line([[812,98],[829,88]]);line([[891,52],[911,40]])
line([[780,93],[788,97]]);line([[779,99],[787,103]])
lab(769,96,'N',25);lab(799,114,'N',25);first(923,43,'NH₂',25)
# Hai đầu mũi tên đầy; không thêm hiệu suất hay sản phẩm phụ từ câu dẫn.
line([[95,143],[325,143]],1.4);head(327,313,143)
line([[463,139],[656,139]],1.4);head(658,642,139)
lab(212,132,'+ HNO₂ + HCl',26)
lab(148,170,'(1) 0 - 5',26,'start');lab(260,157,'o',18);lab(277,170,'C',26)
lab(564,168,'(2)',26)
b+='<g transform="translate(817 158) skewX(-10)">'+F.label(0,0,'(màu vàng)',26)+'</g>'
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="964" height="173" viewBox="0 0 964 173"><title>Sơ đồ tạo azo theo nguồn1191</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='azo1191-native-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
note='5PhMOTIFS-28FULLinsidebareC1BOTTOMpartialC-2LEFTBOTTOMcutcontinuationsUNKNOWNtotalC-NOrestore30/7N1ClEXCLreagentconditions/15CCinnerdouble1NNdouble2SEPARATEslopingrays/3NH2-FIRSTN-N2INSIDESQUAREplusSUPoutsideRIGHT-ClminusSUP/ALLregularUPRIGHT-ONLY(màu vàng)regularITALIC/2FULLFILLEDrightheads/+HNO2+HCl/(1) 0 - 5smallSUPoC/(2)/nativeBOTTOMcrop173KEEP/NOaddedwater-yield-H-charge-answer-alias1082/nativeapproxNOTsubpixel'
r=dict(i=1191,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung=note)
(K/'cau-truc-azo1191-native-ddh-lo-420-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
(K/'doc-azo1191-lo-420.json').write_text(json.dumps(dict(hash=h,native=[964,173],questions=qs,ghiChu=note,rootSourceAudit='Root OWNnativeFULL4x/left-cond-mid-prod4x/coupler5x/NN20x/allpublicde. FivePh motifs notinitialmental4; source-only count correctedBEFOREfirstbuilder. 28fullinsideC+1bottompartialvisibleC, firstbottomvertexoutsideUNKNOWN notrestored. Allregular; captiononlyitalic. NativeapproxnotSubpixel.'),ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
