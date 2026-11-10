"""Đoạn polyester1390: giữ đầu mạch và các chân carbonyl theo nguồn."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='fa9f6113c522a8fbcf219b371c95c718150d85185bc4e0327171ee3c07c4137c';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh'] if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
def label(x,y):return F.label(x,y,'O',25,fill='#111')
def path(d):return f'<path d="{d}" fill="none" stroke="#111" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>'
b=path('M50 132V85L90 62L115 76 M144 77L170 62L209 85L234 71 M263 71L288 85L328 62L353 76 M382 77L407 62L446 85L471 71 M500 71L526 85L565 62L590 76 M170 62V17 M288 85V132 M407 62V17 M526 85V132')
# Chân hai tia ở hai cạnh nghiêng, không thêm cầu ngang carbonyl.
b+=path('M86 64V31 M94 64V31 M205 83V116 M213 83V116 M324 64V31 M332 64V31 M442 83V116 M450 83V116 M561 64V31 M569 64V31')
for x,y in [(90,24),(130,94),(209,140),(249,70),(328,24),(368,94),(446,140),(486,70),(565,24),(605,94)]:b+=label(x,y)
b+=path('M12 63L16 65 M21 68L25 70 M30 73L34 75 M39 78L43 80 M47 83L50 85 M619 77L624 75 M628 72L633 70 M637 67L642 65')
b+='<circle cx="646" cy="62.8" r="0.65" fill="#111"/>'
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="655" height="149" viewBox="0 0 655 149"><title>Đoạn mạch theo nguồn1390</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='polyester-native1390-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=1390,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='15bareC10O/5COdouble2splitfeetEACH/5verticalmethylstubsDOWN-UP-DOWN-UP-DOWN/LEFT4separatedashes+shortJOINEDstub/RIGHT3separatedashes+tinyterminalDOT/allthinregularDDH/noaddedH-CH2-CH3-brackets-n-caption-answer')
(K/'cau-truc-polyester-native1390-ddh-lo-315-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
