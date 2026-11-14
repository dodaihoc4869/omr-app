"""Sơ đồ ABS nguồn853: giữ mạch đơn ở đoạn giữa đúng hình gốc."""
from pathlib import Path
import json,hashlib,importlib.util
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='9bf8e8e6225397644e61f79a21bdc12cf76efcdf0fdf0aa3c29e63cd478d3ce5';b=''
def path(d,w=2.4,color='#444444'):
 global b
 b+=f'<path d="{d}" fill="none" stroke="{color}" stroke-width="{w}" stroke-linecap="butt" stroke-linejoin="round"/>'
def lab(x,y,t,z=24,weight='de'):
 global b
 b+=F.label(x,y,t,z,anchor='middle',weight=weight,fill='#000000')
# Styrene, ba nét đôi trong vòng và hai nét đôi của nhánh vinyl.
path('M117 119L84 137V174L117 192L149 174V137Z M117 119V84L149 65 M121 87L152 69 M91 141V169 M119 127L141 140 M119 184L141 171')
# Butadiene và acrylonitrile là hai hình riêng, không thêm dấu cộng.
path('M282 172L312 155L344 172L375 154 M284 178L313 162 M346 165L373 148')
path('M186 319V285L219 265L238 253 M192 318V290 M216 258L235 247 M223 272L242 261')
lab(250,259,'N',24)
# Trục mạch sản phẩm không tuần hoàn hoá các đỉnh và không thêm C=C ở đoạn y.
path('M818 127L877 159L910 141L940 159L974 141L1006 159L1039 141L1070 159L1102 141L1134 159 M877 159V195L844 213V249L877 268L910 249V213L877 195 M851 217V245 M879 203L902 216 M879 260L902 246 M1102 141V84 M1095 105V84 M1109 105V84')
lab(1102,77,'N',24)
# Ba cặp ngoặc vuông; x/y/z ở dưới, giữ độ cao từng cặp.
for d in ['M848 124H837V279H848','M908 124H919V279H908','M942 123H931V279H942','M1035 123H1047V279H1035','M1072 123H1060V279H1072','M1114 123H1125V279H1114']:path(d,2.7,'#222222')
for x,y,t in [(927,297,'x'),(1055,296,'y'),(1132.5,297,'z')]:lab(x,y,t,25)
path('M447 201H713',2.6,'#222222')
b+='<path d="M704 191L738 201L704 211L713 201Z" fill="#111111"/>'
for x,y,t,z in [(119,225,'styrene',24),(334,216,'butadiene',24),(217,361,'acrylonitrile',22),(987,333,'ABS polymer',26)]:lab(x,y,t,z,'dam')
# Những mảnh xám nhỏ có ý nghĩa chưa rõ: giữ, không đoán thành điều kiện.
b+='<path d="M634 132L640 129V132Z" fill="#555555"/><path d="M542 194H545 M580 194H584" fill="none" stroke="#999999" stroke-width="1"/>'
for x1,x2 in [(16,17),(219,222),(352,354),(578,579),(662,664),(966,969),(1068,1071)]:b+=f'<path d="M{x1} 0H{x2}" stroke="#e9e9e9" stroke-width="1"/>'
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1209" height="398" viewBox="0 0 1209 398"><title>Sơ đồ ABS theo nguồn853</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='abs853-native-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
note='30knownprintedC2N-exclcutcontinuations-unknownxyz/3monomersstyrene-butadiene-acrylonitrile→ABS/2Ph6innerCCdouble-4outsideCCdouble-2CNtriple/3SQUAREpairsxyzSUB/4middlebackboneCONLYsingleliteral/4TRUEdamUPRIGHTcaptions-styrene-butadiene-acrylonitrile-ABS polymer/2NregularUPRIGHT-xyzregularUPRIGHT/1FILLEDconcaveRIGHThead/3tinyUNKNOWNmarks+7TOPcroppedgrayfragmentsKEEP/NOaddedH-plus-catalyst-formula-answer/nativeapproxNOTsubpixel'
r=dict(i=853,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung=note)
(K/'cau-truc-abs853-native-ddh-lo-431-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
(K/'doc-abs853-lo-431.json').write_text(json.dumps(dict(hash=h,native=[1209,398],questions=qs,ghiChu=note,rootSourceAudit='RootOWNnativeFULL/all1publicde12-KT-C4-D3-II-3; OWNleft/right3x/arrow4x. Productmiddle onlysingleliteral, no theorynormalization. Captions TRUEdam, N and xyz regularUPRIGHT. Tinyarrow and TOPfragments UNKNOWN retained, no conditionguesses.'),ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
