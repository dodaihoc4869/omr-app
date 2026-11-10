"""Phổ khối nguồn851: giữ nét nền nghiêng và dấu rất nhỏ chưa rõ ý nghĩa."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='9be9532f9efaafb8f44010eec6408bedd0e9b4a69ccf6109cf799b3312255b67';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh'] if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
b=''
def line(d,w=1.6,color='#252440'):
 global b
 b+=f'<path d="{d}" fill="none" stroke="{color}" stroke-width="{w}" stroke-linecap="butt" stroke-linejoin="round"/>'
def label(x,y,t,size=24,anchor='middle'):
 global b
 b+=F.label(x,y,t,size,anchor=anchor)
line('M102 33L104 506L794 502')
for x,y in [(104,506),(219,505),(334,505),(449,504),(565,503),(679,503),(794,502)]:line(f'M{x} {y}V{y+10}');label(x,537,str({104:8,219:12,334:16,449:20,565:24,679:28,794:32}[x]))
for t,y in [('0',506),('20',411),('40',316),('60',222),('80',127),('100',33)]:line(f'M93 {y}H103');label(89,y+8,t,anchor='end')
for x,top,base in [(679,389,503),(707,31,502),(736,228,502),(248,501,505),(277,500,505),(305,496,505)]:line(f'M{x} {base}V{top}',2)
# Dấu nhô 1–2px có thật; giữ nguyên, không khẳng định thành phần/độ phong phú.
line('M765 502V500',1.5,'#686868')
for x,y,t in [(679,383,'28'),(707,24,'29'),(736,221,'30')]:label(x,y,t,20)
b+='<g transform="translate(38 266)rotate(-90)">'+F.label(0,0,'Cường độ tương đối (%)',25)+'</g>'
b+='<g transform="translate(788 568)skewX(-10)">'+F.label(0,0,'m/z',25)+'</g>'
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="817" height="580" viewBox="0 0 817 580"><title>Phổ khối theo nguồn851</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='pho-khoi-native851-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=851,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='3main28-29-30+3tinyUP13-14-15/1tinygraymark765intentUNKNOWNretained1-2px-NO31label/7X6Ynums/0heads0grid/nativebaseline104506→794502-yaxis10233→104506/regularlabels-mzREGULARITALIC/noaddedformula-abundance-answer')
(K/'cau-truc-pho-khoi-native851-ddh-lo-329-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
