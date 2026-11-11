"""Phương trình isoamyl nguồn1132: hai đầu mũi tên đầy, nhãn thường và dấu (*)."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='cb5dd679b235fd78860781d1f7306c0ff9f3ba72452a74836b0687ff4f374b42';b=''
def line(a,z):return f'<path d="M{a[0]} {a[1]}L{z[0]} {z[1]}" stroke="#000000" stroke-width="1.6" fill="none"/>'
def text(x,y,t,z=30,anchor='middle'):return F.label(x,y,t,z,anchor=anchor,fill='#000000')
def formula(x,y,parts,which='first',size=30):
 widths=[F.advance(t,size*.7 if kind=='sub'else size)for t,kind in parts]
 left=x-widths[0]/2 if which=='first'else x-sum(widths[:-1])-widths[-1]/2 if which=='last'else x-sum(widths)/2
 out=''
 for(t,kind),w in zip(parts,widths):out+=text(left,y+7 if kind=='sub'else y,t,size*.7 if kind=='sub'else size,'start');left+=w
 return out
for a,z in [[[63, 89], [92, 73]], [[92, 73], [121, 89]], [[89, 40], [89, 74.66]], [[96, 40], [96, 75.21]], [[302, 82], [326, 68]], [[326, 68], [362, 89]], [[362, 89], [399, 68]], [[399, 68], [400, 40]], [[399, 68], [425, 83]], [[742, 89], [766, 76]], [[766, 76], [787, 88]], [[812, 89], [834, 76]], [[834, 76], [870, 97]], [[870, 97], [906, 76]], [[906, 76], [907, 54]], [[906, 76], [921, 85]], [[763, 52], [763, 77.63]], [[769, 52], [769, 77.71]], [[505, 86], [670, 86]], [[503, 93], [668, 93]]]:b+=line(a,z)
for pts in [[[670, 86], [654, 82], [654, 90]], [[503, 93], [519, 89], [519, 97]]]:b+='<path d="M'+'L'.join(f'{x} {y}'for x,y in pts)+'Z" fill="#000000"/>'
for x,y in [(93,35),(766,49)]:b+=text(x,y,'O')
b+=formula(50,105,[('H','body'),('3','sub'),('C','body')],'last')+formula(135,105,[('O','body'),('H','body')])
b+=formula(286,104,[('H','body'),('O','body')],'last')
for x,y in [(400,34),(438,105),(906,48),(935,105)]:b+=formula(x,y,[('C','body'),('H','body'),('3','sub')])
b+=formula(727,105,[('H','body'),('3','sub'),('C','body')],'last')+text(800,105,'O')+formula(1054,104,[('H','body'),('2','sub'),('O','body')],'middle')
b+=text(216,103,'+')+text(1003,103,'+')+text(1122,100,'(*)',30)
for x,t in [(97,'Acetic acid'),(364,'Isoamyl alcohol'),(838,'Isoamyl acetate')]:b+=text(x,149,t,28)
parts=[('H',27,0),('2',19,6),('SO',27,0),('4',19,6),(' đặc, t',27,0),('o',18,-10)];left=594-sum(F.advance(t,z)for t,z,dy in parts)/2
for t,z,dy in parts:b+=text(left,65+dy,t,z,'start');left+=F.advance(t,z)
for x,z in [(36,41),(475,480),(681,689),(770,779)]:b+=f'<path d="M{x} 0H{z}" stroke="black" stroke-width="1"/>'
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1147" height="162" viewBox="0 0 1147 162"><title>Phương trình theo nguồn1132</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='isoamyl1132-native-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
r=dict(i=1132,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='14C6OincludingwaterEXCLUDINGcatalyst/2COdouble2splitfeetCONTACTslopes-nativeV/noaddedcrossbar/2FULLfilledtrianglesTOPrightBOTTOMleft/ALLregularUPRIGHT3captions-condition-chemicals/EXACT(*)farRIGHT/SUB2-3-4/tSUPo/4topedgeUNKNOWNfragmentsretainedNOrestorecuttext/0stereocharge/noIRbands-yield-answer-NOalias6')
(K/'cau-truc-isoamyl1132-native-ddh-lo-366-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
