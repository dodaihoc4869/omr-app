"""Hai triester X/Y nguồn1255: giữ các chuỗi riêng và nhãn OOC nguyên văn."""
from pathlib import Path
import json,hashlib,importlib.util
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='e3f5e5924fce8a8e1c3f051b77bfc0ac1652d46045288f57859cb9ed99aee281';b=''
def line(v,w=1.1):
 global b
 b+='<path d="M'+'L'.join(f'{x} {y}'for x,y in v)+f'" fill="none" stroke="#303030" stroke-width="{w}" stroke-linecap="butt" stroke-linejoin="round"/>'
def lab(x,y,t,z=19,anchor='middle',weight='de'):
 global b
 b+=F.label(x,y,t,z,anchor=anchor,fill='#303030',weight=weight)
def last(x,y,t,z=19):lab(x+F.advance(t[-1],z)/2,y,t,z,'end')
# Mỗi dòng được đọc riêng, giữ sai biệt góc và điểm cuối native.
lt=[[95,33],[121.5,48],[147.5,33],[174,48],[200,33],[226.5,48],[252.5,33],[278.5,48],[304.5,33],[331,48],[357,33],[383.5,48],[409.5,33],[435.5,48],[461.5,33],[488,48],[514,33],[540.5,48]]
lm=[[138.5,106],[146,114],[172,98.5],[198.5,114],[224.5,98.5],[251,114],[277,98.5],[303,114],[329,98.5],[355.5,114],[381.5,98.5],[408,114],[434,98.5],[460,114],[486.5,98.5],[512.5,114],[539,98.5],[565,114]]
lb=[[95,164],[121.5,149],[147.5,164],[174,149],[200,164],[226.5,149],[252.5,164],[278.5,149],[304.5,164],[331,149],[357,164],[383.5,149],[409.5,164],[435.5,149],[461.5,164],[488,149],[514,164],[540.5,149]]
rt=[[790,38],[817,53],[843.5,38],[870,53],[897,38],[923.5,53],[950,38],[976.5,53],[1003,38],[1033.5,38],[1060,53],[1087,38],[1113.5,53],[1140,38],[1166.5,53],[1193,38],[1219.5,53],[1246,38]]
rm=[[833,111],[842,119],[868.5,104],[895,119],[921.5,104],[948,119],[975,104],[1001.5,119],[1028,104],[1058.5,104],[1085,119],[1111.5,104],[1138,119],[1165,104],[1191.5,119],[1218,104],[1244.5,119],[1271,104]]
rb=[[790,169],[817,154],[843.5,169],[870,154],[897,169],[923.5,154],[950,169],[976.5,154],[1003,169],[1033.5,169],[1060,154],[1087,169],[1113.5,154],[1140,169],[1166.5,154],[1193,169],[1219.5,154],[1246,169]]
for v in [lt,lm,lb,rt,rm,rb]:line(v)
# OOC là nhãn co gọn giữa mạch, không bổ sung carbonyl không được vẽ.
last(49,83,'H₂C',19);last(49,127,'H₂C',19);lab(59,105,'CH–OOC',19,'start')
lab(74,61,'O',19);lab(74,149,'O',19);lab(95,12,'O',19);lab(95,198,'O',19)
for v in [[[58,69],[67,61]],[[59,84],[64,89.71428571428571]],[[59,113],[65,106]],[[58,127],[68,136]],[[81,49],[95,33]],[[81,149],[95,164]]]:line(v)
last(744,89,'H₂C',18);last(744,133,'H₂C',18);lab(756,111,'CH–OOC',18,'start')
lab(769,66,'O',18);lab(769,154,'O',18);lab(790,17,'O',18);lab(790,203,'O',18)
for v in [[[754,75],[762,67]],[[754,88],[762,96]],[[754,119],[761,112]],[[754,132],[763,141]],[[776,54],[790,38]],[[776,154],[790,169]]]:line(v)
# Ba nét đôi C–C, đầu trong tự do, không thêm giao ngang.
for v in [[[1005,42],[1031,42]],[[1030,108],[1056,108]],[[1005,165],[1031,165]]]:line(v,.9)
# Bốn carbonyl: hai chân offset tiếp xúc đúng hai nhánh, tính giao theo đoạn native xấp xỉ.
for v in [[[93,14],[93,35.285714285714285]],[[97,14],[97,34.132075471698116]],[[93,161.85714285714286],[93,184]],[[97,162.8679245283019],[97,184]],[[788,20],[788,40.285714285714285]],[[792,20],[792,39.111111111111114]],[[788,166.85714285714286],[788,189]],[[792,167.88888888888889],[792,189]]]:line(v,.9)
lab(282,199,'X',26,weight='dam');lab(974,205,'Y',26,weight='dam')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1482" height="218" viewBox="0 0 1482 218"><title>Hai cấu trúc X và Y theo nguồn1255</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='tri1255-native-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
note='2individualtriesterpanelsX-Y/57C6OEACH114C12Ototal/LEFT0CCdouble-RIGHT3CCdouble1EACH/4drawnCOdouble2splitfeetCONTACTrespectivearms/2literalCH-OOC-middleNOexpandedCO/4H2C-LASTCanchors/ALLchemicalregularUPRIGHT-ONLYXYtrueDAMUPRIGHT/6individualnonperiodicchains-FREECCinnerends/NOaddedH-formula-caption-stereo-answer-alias/nativeapproxNOTsubpixel-COfeetCALCULATEDfromapproxarms'
r=dict(i=1255,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung=note)
(K/'cau-truc-tri1255-native-ddh-lo-413-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
(K/'doc-tri1255-lo-413.json').write_text(json.dumps(dict(hash=h,native=[1482,218],questions=qs,ghiChu=note,rootSourceAudit='Root OWNnativeFULL/eachpanel3x/LEFTCO3x/allpublicde. LiteralOOC notexpanded; ownindividualchainvertices. NativeapproxNOTsubpixel/COfeetCALCULATEDfromapproxarms.'),ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
