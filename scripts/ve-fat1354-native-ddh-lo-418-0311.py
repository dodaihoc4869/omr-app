"""Hai acid béo nguồn1354: mạch và chú thích màu nguyên văn."""
from pathlib import Path
import json,hashlib,importlib.util
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='f532ae1c222f306e0c118c7b723a4647e7c4b650469d1ee8ebcc35f21f170dca';b='';pink='#ff0064';teal='#0e9498'
def path(d,w=3.7,c='#000000',cap='round',join='round'):
 global b
 b+=f'<path d="{d}" fill="none" stroke="{c}" stroke-width="{w}" stroke-linecap="{cap}" stroke-linejoin="{join}"/>'
def line(v,w=3.7,c='#000000',cap='round',join='round'):path('M'+'L'.join(f'{x} {y}'for x,y in v),w,c,cap,join)
def lab(x,y,t,z=24,c='#000000',anchor='middle',weight='de'):
 global b
 b+=F.label(x,y,t,z,anchor=anchor,fill=c,weight=weight)
def last(x,y,t,z,c,weight='dam'):lab(x+F.advance(t[-1],z,weight)/2,y,t,z,c,'end',weight)
def first(x,y,t,z,c,weight='dam'):lab(x-F.advance(t[0],z,weight)/2,y,t,z,c,'start',weight)
def condensed(x,y,t,z,sx):
 global b
 b+=f'<g transform="translate({x} {y}) scale({sx} 1)">'+F.label(0,0,t,z,anchor='start',fill=pink)+'</g>'
# Viền hai ô, không tự thêm tiêu đề hoặc thứ tự lựa chọn.
path('M3 5H728V357H3Z M392 5V357',0.8,cap='butt',join='miter')
# DHA: 22 đỉnh carbon riêng, sáu nét đôi trong mạch mở.
line([[105,34],[129,47],[163,28],[197,47],[231,28],[265,47],[265,86],[298,106],[298,145],[265,164],[265,203],[231,222],[197,203],[163,222],[129,203],[129,164],[96,145],[62,164],[62,203],[28,222],[28,261],[62,280],[62,321]])
for v in [[[230,37],[257,52]],[[290,111],[290,141]],[[260,198],[230,213]],[[164,213],[136,198]],[[96,154],[68,169]],[[35,227],[35,257]]]:line(v)
# Hai tia CO có chân trên hai nhánh tương ứng; giao điểm tính từ nhánh xấp xỉ.
line([[125,44.833333333333336],[125,76]])
line([[133,44.76470588235294],[133,76]])
last(94,36,'HO',24,pink);lab(129,101,'O',24,pink,weight='dam')
# EPA là mạch riêng 20C; đầu trên-phải kết thúc tự do tại555124.
line([[503,67],[529,82],[529,107],[504,122],[477,107],[452,121],[452,151],[428,165],[428,194],[452,208],[452,236],[475,251],[503,236],[531,251],[555,236],[555,207],[579,193],[579,163],[555,148],[555,124]],5.5,teal,'butt','miter')
for v in [[[479,116],[460,128]],[[437,168],[437,191]],[[459,231],[478,242]],[[529,242],[548,231]],[[570,168],[570,189]]]:line(v,4.7,teal,'butt','miter')
line([[503,43],[503,67]],5.5,teal,'butt','miter')
line([[487,79],[503,66]],5.0,teal,'butt','miter')
line([[492,85],[510,71.03846153846153]],5.0,teal,'butt','miter')
first(503,39,'OH',35,teal);lab(473,101,'O',35,teal,weight='dam')
# Chú thích trái cao/hẹp theo native; DDH thật, không giả đậm.
condensed(89,302,'DOCOSAHEXAENOIC',33,0.64);condensed(89,338,'ACID',33,0.64)
lab(167,338,'(DHA)',31,pink,'start')
# Khoảng trắng EICOSA PENTAENOIC phải giữ; native không viết liền.
lab(400,293,'EICOSA PENTAENOIC',31,'#0000ff','start')
lab(400,333,'ACID (EPA)',31,'#0000ff','start')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="732" height="359" viewBox="0 0 732 359"><title>Hai acid béo theo nguồn1354</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='fat1354-native-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
note='LEFT22C6CCdouble-RIGHT20C5CCdouble-total42C4O/2individualOPENchains2COdouble2splitfeetCONTACTrespectivearms/LEFTBLACKbondsPINKHO-O-RIGHTALLTEAL/ALL4OtrueDAMUPRIGHT-2captions5literalblocksregularUPRIGHT/EXACTDOCOSAHEXAENOIC-ACID-(DHA)-EICOSA PENTAENOIC-ACID (EPA)/LEFTfirst2captionlinesCONDENSEDnative-rightBLUE/1outerrect1divider/0stereo-arrows-extraH/NOaddedomega-formula-temp-answer-alias/nativeapproxNOTsubpixel-COfeetCALCULATEDfromapproxarms'
r=dict(i=1354,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung=note)
(K/'cau-truc-fat1354-native-ddh-lo-418-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
(K/'doc-fat1354-lo-418.json').write_text(json.dumps(dict(hash=h,native=[732,359],questions=qs,ghiChu=note,rootSourceAudit='Root OWNnativeFULL2x/EACHpanelCO3x/captions3x/allpublicde. 22C6CCvs20C5CC individualvertexcount. HOlastOleft/OHfirstOright/ALL4Otruebold. Captionsregularupright, leftfirst2tallcondensed, rightBLUEserifnative→DDHpath. NativeapproxNOTsubpixel;COfeetCALCULATEDfromapproxarms,notmeasurednativeSubpixel.'),ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
