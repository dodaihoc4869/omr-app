"""Đồ thị hoạt tính hai enzyme nguồn789: giữ đường chấm và nhãn gốc."""
from pathlib import Path
import json,hashlib,importlib.util
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='92ec0e58a9762f475b718fd88d7179967ab7962bcdf397eefcfb20b94c62c1e2';b=''
def path(d,w=1.5,color='#000000'):
 global b
 b+=f'<path d="{d}" fill="none" stroke="{color}" stroke-width="{w}" stroke-linecap="butt" stroke-linejoin="round"/>'
def lab(x,y,t,z=18):
 global b
 b+=F.label(x,y,t,z,anchor='middle',weight='dam',fill='#000000')
# Mảnh đường bảng cắt ở mép trên vẫn nằm trong khung ảnh, không phục hồi bảng.
path('M0 2H512V0 M170 0V2',1)
# Hai trục chỉ có đầu tam giác xám, không tự thêm vạch chia.
path('M71.5 80V327.5H558',1.5,'#555555')
b+='<path d="M71.5 69L65 81H78Z M569 327.5L557 321V334Z" fill="#999999"/>'
# Dẫn chiếu x=2 bằng chấm xám; không phải đường dữ liệu thứ ba.
b+='<path d="M114 89V326" fill="none" stroke="#888888" stroke-width="1.5" stroke-dasharray="1.5 2.2"/>'
# Pepsin: đường liền bất đối xứng, không chuẩn hoá theo phương trình đối xứng.
path('M72 216C78 204 86 177 92 149C98 123 107 85 114 85C122 85 128 120 137 165C145 205 153 246 162 278C167 294 172 305 175 308',2.5)
# Từng chấm thấy được trên đường chymotrypsin. Tọa độ làm tròn nửa pixel là
# hướng dẫn dựng xấp xỉ, không phải phép đo dưới pixel hay dữ liệu cường độ.
DOTS=[(247.5, 289.5), (249.5, 283.5), (252.0, 277.5), (254.5, 272.0), (256.5, 266.0), (258.5, 260.0), (260.5, 254.0), (263.0, 248.5), (265.0, 242.5), (267.0, 236.5), (268.5, 230.5), (270.5, 224.5), (273.0, 218.5), (274.5, 212.5), (276.5, 206.5), (278.5, 200.5), (280.5, 194.5), (282.0, 188.5), (284.0, 182.5), (285.5, 176.5), (287.5, 170.5), (289.5, 164.5), (291.0, 158.5), (293.0, 152.5), (295.0, 146.5), (296.5, 140.5), (298.5, 134.5), (300.5, 128.5), (302.5, 122.5), (305.0, 116.5), (307.0, 110.5), (309.0, 104.5), (311.5, 99.0), (314.5, 93.5), (317.5, 87.5), (320.5, 82.5), (324.5, 77.5), (330.5, 76.0), (335.5, 79.5), (339.0, 85.0), (341.5, 90.5), (344.5, 96.0), (347.0, 102.0), (349.5, 107.5), (352.0, 113.5), (354.5, 119.0), (357.5, 125.0), (359.5, 130.5), (362.0, 136.5), (364.5, 142.5), (367.0, 148.5), (369.0, 154.5), (371.0, 159.5), (373.5, 166.0), (375.5, 171.5), (378.0, 177.5), (380.0, 183.5), (382.5, 189.0), (384.0, 195.5), (386.5, 201.0), (388.5, 207.5), (390.5, 213.0), (392.5, 219.0), (394.5, 225.0), (397.0, 230.5), (399.0, 236.5), (400.5, 242.5), (402.5, 249.0), (404.5, 254.5), (407.0, 260.5), (409.0, 266.5), (410.5, 272.5), (412.5, 278.5), (414.5, 284.5), (417.0, 290.0)]
for x,y in DOTS:b+=f'<circle cx="{x}" cy="{y}" r="1.7" fill="#000000"/>'
for x,t in [(72,'1'),(114,'2'),(156,'3'),(199,'4'),(235,'5'),(275,'6'),(313,'7'),(353,'8'),(394,'9'),(435,'10'),(476,'11'),(520,'12')]:lab(x,355,t,18)
lab(289,383,'pH',18);lab(153,91,'Pepsin',17);lab(332,65,'Chymotrypsin',16)
b+='<g transform="translate(49 205) rotate(-90)">'+F.label(0,0,'Tốc độ phản ứng',14,anchor='middle',weight='dam',fill='#000000')+'</g>'
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="597" height="420" viewBox="0 0 597 420"><title>Hoạt tính enzyme theo nguồn789</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='enzyme789-native-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
note='2plotsPepsinSOLID-Chymotrypsin75individualDOTS/1GRAYdottedPepsinguide/2GRAYfilledaxisheads-0ticks/12Xlabels1..12-NOYlabels/ALLtrueDAMUPRIGHT-Pepsin-Chymotrypsin-pH-Tốc độ phản ứngROTminus90/TOPcroppedtablerule2stubsKEEP/NOaddedtable-data-intensity-units-answer/Chymopeaknative330NOTnormalize8tick353/nativeapproxNOTsubpixel'
r=dict(i=789,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung=note)
(K/'cau-truc-enzyme789-native-ddh-lo-429-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
(K/'doc-enzyme789-lo-429.json').write_text(json.dumps(dict(hash=h,native=[597,420],questions=qs,ghiChu=note,rootSourceAudit='RootOWNnativeFULL/all2publicde-refs; OWNpeps/chymo3x/labelnums3x/Y4x/TOP3x. AlllabelsTRUEdamUPRIGHT. Chymoplot75separatedinkdots only drawingpattern NOT75measurements, eachroundednativeapproxanchor; guideGRAYdotted. Nativepeak330not8tick353 despitebothpublicstems≈8. BothstemsBẢNGbutinventoryONLY1hinh; preserveTOPcroppedrule2stubs, NOinventpartner/tablecheckedclaim. Noanswer/intensitynormalization.'),ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
