"""Phổ khối lượng nguồn767: giữ các đỉnh yếu và các vạch chia riêng."""
from pathlib import Path
import json,hashlib,importlib.util
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='8f726d8daaa6bff08a532885cd45b3c7f676faa299becde90e64a361e1fd58e6';b=''
def path(d,w=1.5):
 global b
 b+=f'<path d="{d}" fill="none" stroke="#000000" stroke-width="{w}" stroke-linecap="butt"/>'
def lab(x,y,t,z=22,anchor='middle'):
 global b
 b+=F.label(x,y,t,z,anchor=anchor,fill='#000000')
# Khung kín, không có đầu mũi tên. Các vạch không được ép lên lưới đều.
path('M85.5 15.5H829.5V387.5H85.5Z',1.7)
XT=[85.5,97,109,121,133,145,157,168.5,181,193.5,205.5,218,230.5,243,254,265.5,277.5,289.5,302,314,326.5,338.5,350.5,362,373.5,385.5,398.5,411,423,435.5,448.5,460,472.5,485,497,509,521,533,545.5,558,570.5,583,595,607,618.5,630.5,642.5,655,666.5,679.5,696.5,708.5,721,733,744.5,756.5,768.5,780.5,792.5,804.5,817,829.5]
XM=[85.5,205.5,326.5,448.5,570.5,696.5,829.5]
for x in XT:path(f'M{x} 387.5V{396 if x in XM else 392}')
YT=[15.5,30,45.5,60.5,76,90.5,106,120.5,136,151.5,166,181.5,196.5,212,227,242.5,257.5,272.5,287.5,303,317.5,332.5,346.5,360.5,373.5,387.5]
YM=[15.5,90.5,166,242.5,317.5,387.5]
for y in YT:path(f'M{77 if y in YM else 81} {y}H85.5')
# Hai mươi hai đỉnh riêng: chiều cao pixel là hình vẽ, không tự gán phần trăm.
for x,y in [(199.5,377),(283,377),(292,361),(301,374),(374.5,373),(384,362),(393.5,341),(404.5,379),(475.5,377),(485,361),(494,306),(504.5,324),(513,377),(595.5,371),(680.5,373),(689.5,356),(697.5,378),(704.5,366),(713.5,272),(722.5,16),(732.5,353),(742.5,379)]:path(f'M{x} 387.5V{y}')
for x,t in [(85.5,'0.0'),(206,'15'),(328,'30'),(450,'45'),(572,'60'),(696,'75'),(829,'90')]:lab(x,420,t,24)
for y,t in [(24,'100'),(99,'80'),(174,'60'),(251,'40'),(326,'20'),(396,'0.0')]:lab(71,y,t,24,'end')
for x,y,t in [(293,354,'26'),(389,333,'39'),(494,301,'50'),(685,351,'76'),(707,266,'77'),(727,37,'78'),(741,346,'79')]:lab(x,y,t,22,'start'if t=='78'else'middle')
b+='<g transform="translate(34 208) rotate(-90)">'+F.label(0,0,'Cường độ tương đối',20.5,anchor='middle',fill='#000000')+'</g>'
b+='<g transform="translate(448 442) skewX(-10)">'+F.label(0,0,'m/z',24,anchor='middle',weight='dam',fill='#000000')+'</g>'
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="846" height="447" viewBox="0 0 846 447"><title>Phổ khối lượng theo nguồn767</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='ms767-native-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
note='22BLACKUPpeaks7labelsONLY26-39-50-76-77-78-79/15weakUNLABELLED/62X26YtickstemsNONPERIODICinclends/7X6YlabelsBOTH0.0literalDOT/1closedframe0heads0grid/ALLregularUPRIGHTexceptm-zTRUEdamITALIC/NOaddedbenzenering-formula-intensitypercent-answer/nativeapproxNOTsubpixel'
r=dict(i=767,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung=note)
(K/'cau-truc-ms767-native-ddh-lo-430-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
(K/'doc-ms767-lo-430.json').write_text(json.dumps(dict(hash=h,native=[846,447],questions=qs,ghiChu=note,rootSourceAudit='RootOWNnativeFULL/all1publicdeDH-11-C3-B12-I-25; OWNleft/middle/rightbaseline3x/Y2x/peaklabels6x/top3x/mz4x. 22peaks incl15weakUNLABELLED. 62X26Ytickstems inclframeends, pixelbands belowbaseline/leftaxis SUPPORTvisual notautomaticapproval. NONPERIODICnativegap679.5→696.5keep. Strongserifcontrastregular labelsNOTfauxbold; m/ztrueDAMitalic. No benzeneanswer/massinference/intensitypercentnormalization/nativeapproxNOTsubpixel.'),ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
