"""Nguồn736: bốn panel chất hoạt động bề mặt, dựng từng đầu/đuôi."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='896d86f2ece3f5f1f916370fe2cb67a08f1b9acd56bc66f7e19e4f9881a9bdb3';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[v for v in q['hinh']if v['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
def path(d,fill='none',stroke='none',w=1):return f'<path d="{d}" fill="{fill}" stroke="{stroke}" stroke-width="{w}"/>'
def molecule(x,y,u,v):return path(f'M{x} {y}L{u} {v}',stroke='#7cbac7',w=2)+f'<circle cx="{x}" cy="{y}" r="4" fill="#16b7df" stroke="#1980a6" stroke-width="1"/>'
a=[(272,109,279,132),(310,91,311,115),(338,102,326,124),(361,119,369,143),(235,130,239,153),(221,145,233,166),(265,145,255,167),(306,158,315,182),(342,150,329,173)]
bb=[(425,127,429,151),(448,100,456,123),(563,143,550,163),(411,189,412,211),(423,188,436,203),(435,180,447,195),(447,173,457,191),(461,165,467,188),(479,161,479,184),(494,164,489,187),(507,169,500,192),(519,174,511,197),(531,179,524,202),(543,183,538,204),(555,182,553,204),(570,189,570,211),(582,189,582,211)]
c=[(749,99,736,121),(649,138,668,149),(661,124,673,145),(677,120,677,145),(693,123,683,145),(707,136,688,148),(712,155,690,155),(705,170,695,192),(718,176,710,199),(730,180,724,201),(743,183,737,203),(646,158,668,158),(659,174,673,193),(649,184,661,202)]
d=[(868,85,869,110),(886,88,876,111),(852,90,863,111),(899,101,878,114),(840,103,861,115),(904,118,880,119),(836,120,860,120),(900,136,878,125),(841,137,862,125),(854,149,864,128),(888,149,876,128),(870,154,870,130)]
b='<defs><linearGradient id="water" x2="0" y2="1"><stop stop-color="#d9f2fb"/><stop offset="1" stop-color="#c6edf6"/></linearGradient></defs>'
for x,cap in [(190,'(a)'),(398,'(b)'),(604,'(c)'),(810,'(d)')]:
 b+=f'<rect x="{x}" y="61" width="197" height="199" fill="url(#water)"/>'
 b+=f'<rect x="{x}" y="205" width="197" height="55" fill="#fbe9e2"/>'+path(f'M{x} 232Q{x+12} 222 {x+25} 232T{x+50} 232T{x+75} 232T{x+100} 232T{x+125} 232T{x+150} 232T{x+175} 232T{x+197} 232V260H{x}Z','#f6d4d4')
 b+=f'<rect x="{x}" y="61" width="197" height="199" fill="none" stroke="#06a8d7" stroke-width="4"/>'+F.label(x+98,290,cap,22)
b+=path('M218 202Q243 183 257 178Q274 172 290 181Q315 195 354 199Q358 199 357 205H218Z','#834c33')+path('M425 202Q452 185 469 175Q480 169 494 177Q526 194 563 199V205H425Z','#834c33')+path('M648 202Q659 193 672 180Q679 174 673 168Q658 157 662 148Q668 133 683 139Q700 146 691 161Q682 171 693 181Q710 196 744 199V205H648Z','#834c33')+f'<circle cx="870" cy="120" r="24" fill="#834c33"/>'
for group in [a,bb,c,d]:
 for m in group:b+=molecule(*m)
for x in [376,583,790]:b+=path(f'M{x} 153H{x+15}V145L{x+32} 160L{x+15} 175V167H{x}Z','#317fae')
b+='<circle cx="210" cy="85" r="36" fill="white" stroke="#382c25" stroke-width="3"/>'+path('M217 72L195 111',stroke='#6bb7c8',w=4)+'<circle cx="217" cy="72" r="10" fill="#18b7dd" stroke="#1980a6" stroke-width="2"/>'
b+=F.label(208,29,'Đầu ưa nước',23,'start')+path('M229 32L218 73',stroke='#382c25',w=1.4)+F.label(15,95,'Đuôi kị nước',23,'start')+path('M157 92H207',stroke='#382c25',w=1.4)+F.label(5,198,'Vết bẩn dầu mỡ',23,'start')+path('M182 192H264',stroke='#382c25',w=1.4)+F.label(91,253,'Vật liệu',23,'start')+path('M180 244H264',stroke='#382c25',w=1.4)
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1030" height="310" viewBox="0 0 1030 310"><title>Bốn giai đoạn theo sơ đồ nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='surfactant-bon-panel-ddh-'+hh+'.svg';(K/fn).write_bytes(raw);r=dict(i=736,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,molecules=dict(A=a,B=bb,C=c,D=d),ghiChuDung='4panel9/17/14/12heads+insethead/3arrows/4labelsleaders/captions(a)..(d)/water-materiallayers/dirt. Watermarkpublisherbackgroundnotcontent,ngoàifiguretopfringeexcluded.');(K/'cau-truc-surfactant-bon-panel-ddh-lo-184-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
