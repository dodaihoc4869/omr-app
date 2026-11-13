"""Nhựa phenolic nguồn908: mười vòng tròn và các nhóm nguyên văn."""
from pathlib import Path
import json,hashlib,importlib.util
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='a636c32cd592c07ab47aefad2254e18f5a493ad57ccd7cb152a1fe3e5681aae3';b=''
def path(d,w=1.5):
 global b
 b+=f'<path d="{d}" fill="none" stroke="#080808" stroke-width="{w}" stroke-linecap="butt" stroke-linejoin="round"/>'
def line(v,w=1.5):path('M'+'L'.join(f'{x} {y}'for x,y in v),w)
def lab(x,y,t,z=26,anchor='middle',weight='de'):
 global b
 b+=F.label(x,y,t,z,anchor=anchor,fill='#080808',weight=weight)
def first(x,y,t,z=26):lab(x-F.advance(t[0],z)/2,y,t,z,'start')
def last(x,y,t,z=26):lab(x+F.advance(t[-1],z)/2,y,t,z,'end')
def ring(v,c,r):
 line(v+[v[0]])
 x,y=c;path(f'M{x-r} {y} a{r} {r} 0 1 0 {2*r} 0 a{r} {r} 0 1 0 {-2*r} 0')
# Mười vòng với các đỉnh riêng, không dùng vòng mẫu dịch đều.
ring([[25,69],[50,54],[76,69],[76,99],[50,114],[25,99]],(50,84),18.5)
ring([[153,69],[167,43],[196,43],[211,69],[196,95],[167,95]],(182,69),18.5)
ring([[274,112],[289,86],[318,86],[333,112],[318,138],[289,138]],(304,112),18.5)
ring([[396,60],[422,45],[448,60],[448,90],[422,105],[396,90]],(422,75),18.5)
ring([[560,60],[586,45],[611,60],[611,90],[586,105],[560,90]],(586,75),18.5)
ring([[688,37],[701,11],[731,11],[746,37],[731,63],[701,63]],(716,37),18.5)
ring([[167,243],[192,228],[218,243],[218,273],[192,288],[167,273]],(192,258),18.5)
ring([[293,243],[319,228],[344,243],[344,273],[319,288],[293,273]],(319,258),18.5)
ring([[431,243],[457,228],[482,243],[482,273],[457,288],[431,273]],(457,258),18.5)
ring([[600,243],[615,218],[644,218],[659,243],[644,269],[615,269]],(629,243),18.5)
# Mười OH trên vòng; HO cuối giữ thứ tự trái-phải như native.
for v in [[[50,54],[50,39]],[[211,69],[226,69]],[[333,112],[348,112]],[[422,45],[422,30]],[[586,45],[586,30]],[[746,37],[761,37]],[[192,228],[192,213]],[[319,228],[319,213]],[[457,228],[457,213]],[[615,269],[615,284]]]:line(v)
for x,y in [(50,35),(238,80),(360,123),(422,25),(586,25),(774,48),(192,209),(319,209),(458,209)]:first(x,y,'OH')
last(613,307,'HO')
# Tám cầu CH2, ba nhóm CH2OH. Không vẽ thêm H hoặc mắt xích ngoài dấu chấm.
for v in [[[76,69],[90,69]],[[136,69],[153,69]],[[196,95],[209,107]],[[260,112],[274,112]],[[318,86],[332,72]],[[381,60],[396,60]],[[448,60],[463,60]],[[507,60],[521,60]],[[545,60],[560,60]],[[611,60],[625,47]],[[674,37],[688,37]],[[218,243],[232,243]],[[281,243],[293,243]],[[344,243],[359,243]],[[409,243],[431,243]],[[482,243],[497,243]],[[548,243],[561,243]],[[585,243],[600,243]]]:line(v)
for x,y in [(103,80),(224,124),(343,71),(476,71),(637,48),(244,252),(371,252),(508,252)]:first(x,y,'CH₂')
line([[152,243],[167,243]]);lab(149,252,'HOCH₂',26,'end')
line([[319,288],[319,303]]);first(319,326,'CH₂OH')
line([[644,218],[655,207]]);first(666,209,'CH₂OH')
# Hai nhóm đúng ba chấm native, không gán số carbon cho khoảng lược.
for x,y,r in [(528,60,1.0),(534,60,1.1),(540,60,1.0),(568,243,1.7),(574,243,1.7),(580,243,1.7)]:
 b+=f'<circle cx="{x}" cy="{y}" r="{r}" fill="#080808"/>'
# Native caption đậm đen, viền màu do raster không phải chữ đỏ.
lab(495,155,'(Hình 1.a)',28,weight='dam');lab(496,338,'(Hình 1.b)',28,weight='dam')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="812" height="349" viewBox="0 0 812 349"><title>Hai sơ đồ nhựa phenolic theo nguồn908</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='phen908-native-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
note='71visibleC13O-excludesUNKNOWNoutside2ellipsis/10individualsixrings6TOP4BOTTOM10innerCIRCLES-NOalternatingdouble/8CH2bridges3CH2OHgroups10phenolicOH/2individual3dotellipsis/ALLchemicalregularUPRIGHT-ONLY2captionsTRUEdamBLACKUPRIGHT-EXACT(Hình 1.a)-(Hình 1.b)/HOCH2LEFT-CH2OHBOTTOMandUPRIGHT-HOlastOterminalDOWN/NOaddedH-n-formula-monomer-arrow-answer-alias/nativeapproxNOTsubpixel'
r=dict(i=908,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung=note)
(K/'cau-truc-phen908-native-ddh-lo-416-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
(K/'doc-phen908-lo-416.json').write_text(json.dumps(dict(hash=h,native=[812,349],questions=qs,ghiChu=note,rootSourceAudit='Root OWNnativeFULL2x/dotsTOPBOTTOM4x/captions4x/allpublicde. Nativecaptiondominantblackpixels/rededgeAA-notmaroon. 10rings=6TOP4BOTTOM,71visibleC13Oexclunknownellipsis/nativeapproxNOTsubpixel.'),ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
