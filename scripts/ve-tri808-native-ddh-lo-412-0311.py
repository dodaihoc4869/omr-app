"""Triester nguồn808: ba mạch gấp riêng, giữ mọi đỉnh và nét đôi."""
from pathlib import Path
import json,hashlib,importlib.util
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='96077242a5b599e99fa7833695079323674709387e63a92869e1488044fdd8b6';b=''
def line(v,w=1.25):
 global b
 b+='<path d="M'+'L'.join(f'{x} {y}'for x,y in v)+f'" fill="none" stroke="#111111" stroke-width="{w}" stroke-linecap="butt" stroke-linejoin="round"/>'
def lab(x,y,t,z=22,anchor='middle'):
 global b
 b+=F.label(x,y,t,z,anchor=anchor,fill='#111111')
def first(x,y,t,z=22):lab(x-F.advance(t[0],z)/2,y,t,z,'start')
def last(x,y,t,z=22):lab(x+F.advance(t[-1],z)/2,y,t,z,'end')
# Mạch trái: 17C trần kể cả CO, đầu methyl H3C neo chữ C cuối.
left=[[99,16],[122.5,3],[152.5,20.5],[152.5,55],[122.5,72.5],[93,55],[62.5,72.5],[33,55],[3,72.5],[3,107],[33,124],[62.5,107],[92.5,124],[122.5,107],[152.5,124],[182,107],[212,124],[242.5,107],[263,119]]
line(left);line([[8,76],[8,103]])
last(91.5,28,'H₃C');lab(242.5,80,'O');lab(273,132,'O')
# Trung tâm glycerol: ba C riêng; không tự thêm CH2/CH.
line([[283,118],[301.5,107],[331.5,124],[331.5,158],[311,170]])
line([[331.5,124],[352,112]]);lab(362,114,'O');lab(303,183,'O')
# Mạch phải, các đỉnh không ép về chu kỳ lý tưởng.
right=[[373,112],[391,123],[421,106],[450.5,123],[480.5,106],[510,123],[540,106],[570,123],[600,106],[629.5,123],[629.5,157.5],[600,175],[570,157.5],[540,175],[510.5,157.5],[480.5,175],[480.5,209],[510.5,226.5],[532.5,214]]
line(right);line([[624.5,126],[624.5,154]])
first(541,217,'CH₃');lab(391.5,165,'O')
# Mạch dưới: từng góc được đọc riêng, một nối đôi ở đoạn gấp đáy.
bottom=[[302.5,186],[302.5,209],[332.5,226.5],[333,261],[363,278],[363.5,312.5],[393.5,329.5],[394,364],[424,381.5],[424.5,415.5],[395,433],[365.5,416],[365,381.5],[335,364.5],[334.5,330],[304,313],[274.5,330.5],[275,365],[296,377]]
line(bottom);line([[419,412.5],[395,427.5]])
first(307,390,'CH₃');lab(274,235,'O')
# Chân carbonyl tiếp xúc từng nhánh; toạ độ giao tính từ đoạn xấp xỉ native.
line([[240,82],[240,108.39344262295081]]);line([[245,82],[245,108.46341463414635]])
line([[388.5,121.47222222222223],[388.5,148]]);line([[394,121.3],[394,148]])
line([[281.5,218.5],[302.5,205]]);line([[284.5,223],[305,210.45833333333334]])
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="633" height="436" viewBox="0 0 633 436"><title>Triester ba mạch gấp theo nguồn808</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='tri808-native-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
note='57C6O=3bareglycerol+3individualfolded18Cacyl/3CCdouble3COdouble/3explicitmethylTOPH3C-LASTC-RIGHTandBOTTOMCH3-FIRSTC/ALLregularUPRIGHT-allthinblack/3CO2raysCONTACTrespectivearms-individualshortnativejoins/NOaddedH-CH2-name-caption-formula-stereo-arrow-answer-alias/nativeapproxNOTsubpixel-COfeetCALCULATEDfromapproxarms'
r=dict(i=808,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung=note)
(K/'cau-truc-tri808-native-ddh-lo-412-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
(K/'doc-tri808-lo-412.json').write_text(json.dumps(dict(hash=h,native=[633,436],questions=qs,ghiChu=note,rootSourceAudit='Root OWNnativeFULL3x/EACHcarbonyl10x/allpublicde; independentindividualvertices, no chemistry normalization. FeetCALCULATEDfromapproxnativearms NOTnativeSubpixel.'),ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
