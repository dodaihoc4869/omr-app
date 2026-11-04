"""Hai disaccharide nguồn787/1325, giữ từng H/OH/số carbon/nhãn liên kết."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];M=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
inv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());assets=sorted(inv['assets'],key=lambda x:x['hash']);refs={r['where']:r for r in json.loads((G/'docs/hinh-vector-0311/nguon/vi-tri-cong-khai.json').read_text())['refs']}
def text(x,y,t,size=27):return F.label(x,y,t,size)
def path(d,w=2):return f'<path d="{d}" stroke="#252440" stroke-width="{w}" fill="none"/>'
def glucose(x=0,y=0,number=True):
 # Khung nguồn chung, C1 phải/C4 trái, nhánhC6 lên và từngH/OH.
 b='<g transform="translate(%s %s)">'%(x,y)
 b+=path('M37 182L98 120H170M196 131L249 182L187 242H98L37 182')+path('M98 242H187',5)
 b+=text(185,133,'O')+path('M98 120V86M98 120V149M37 182V137M37 182V222M98 242V210M98 242V281M187 242V208M187 242V279M249 182V136')
 for a in [(139,78,'CH₂OH'),(98,172,'H'),(37,131,'H'),(48,251,'OH'),(109,205,'OH'),(98,307,'H'),(187,199,'H'),(199,308,'OH'),(249,129,'H')]:b+=text(*a)
 if number:
  for a in [(265,176,'1'),(207,266,'2'),(84,269,'3'),(24,191,'4'),(84,116,'5'),(100,51,'6')]:b+=text(*a,20)
 return b+'</g>'
records=[]
for i in [787,1325]:
 b=glucose();b+=text(300,28,'liên kết α-1,%s-glycoside'%('4' if i==787 else '2'),25)
 if i==787:
  # Nhánh glycoside C1trái sangC4phải; vòngphải dịch356,-3.
  b+=path('M249 182L303 226M333 226L392 179')+text(318,241,'O')
  b+=glucose(356,-3).replace('M37 182V137M37 182V222','M37 182V137')
  # C4vòngphải đãthayOHbằngO-bridge, bỏ nhãnOHởvịtrí này.
  pos=b.rfind(text(48,251,'OH'));b=b[:pos]+b[pos:].replace(text(48,251,'OH'),' ',1)
  b+=path('M605 179V221')+text(616,252,'OH')+path('M312 44L287 203M286 195L287 203L295 198',1.4)
  width,height=690,340
 else:
  # Vòng trái ởsource1325 rộnghơn nguồn787: co giãn nguyên khối để bảotoàn bố trí.
  b='<g transform="translate(0 0) scale(1.095 1.085)">'+glucose()+'</g>'+text(410,30,'liên kết α-1,2-glycoside',26)
  b+=path('M273 197L333 245M366 245L430 182')+text(350,260,'O')
  b+=path('M430 182L487 288H611L655 182L570 139M529 139L430 182')+path('M487 288H611',5)+text(545,142,'O')
  b+=path('M430 182V132M487 288V245M487 288V345M611 288V230M611 288V345M655 182V136M655 182V238')
  for a in [(425,122,'HOCH₂'),(488,220,'H'),(500,378,'OH'),(598,219,'HO'),(611,378,'H'),(655,130,'H'),(702,273,'CH₂OH')]:b+=text(*a,31)
  for a in [(430,82,'1'),(412,176,'2'),(474,323,'3'),(598,322,'4'),(672,185,'5'),(658,306,'6')]:b+=text(*a,22)
  b+=path('M372 44L311 220M308 211L311 220L320 214',1.5)
  width,height=800,410
 raw=('<svg xmlns="http://www.w3.org/2000/svg" width="%s" height="%s" viewBox="0 0 %s %s"><title>Disaccharide nguồn%s</title><g transform="translate(10 5)">'%(width,height,width,height,i)+b+'</g></svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='disaccharide-ddh-'+hh+'.svg';(M/fn).write_bytes(raw)
 a=assets[i];qs=[]
 for q in inv['questions']:
  hs=[h for h in q['hinh']if h['hash']==a['hash']]
  if hs:qs.append({'qid':q['qid'],'de':q['de'],'refs':[{'where':h['where'],'viTri':refs[h['where']]['viTri']}for h in hs]})
 records.append({'i':i,'hash':a['hash'],'fileNguon':a['file'],'questions':qs,'daMoNative':True,'svg':fn,'hashSvg':hh,'byteSvg':len(raw),'font':'DDH Rounded','hashPhong':F.HASH,'trangThai':'cho-soat-doc-lap','ghiChuDung':'2vòng/từngH-OH/6sốC mỗiđơnvị/nhánhC6/bridgeO/captionα1,4hoặcα1,2+leaderbarearrow,khôngsửatheory.'})
(M/'cau-truc-disaccharide-ddh-lo-164-ban-dung.json').write_text(json.dumps(records,ensure_ascii=False,indent=2))
