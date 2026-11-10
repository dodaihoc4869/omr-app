"""Bốn nhận định nguồn874: giữ cấu trúc và chữ nguyên văn, không chữa phương án."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='9f06a92bb0d0b88b5aec52227d84e7a679e1698e5de6dc0a3fb8c9634d89e997';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
b='';C='#252440'
def label(x,y,t,size=32,weight='de'):
 global b
 b+=F.label(x,y,t,size,anchor='start',fill=C,weight=weight)
def line(d):
 global b
 b+=f'<path d="{d}" fill="none" stroke="{C}" stroke-width="2" stroke-linecap="round"/>'
def chem(x,y,t,sub=None):
 label(x,y,t)
 if sub:label(x+F.advance(t,32),y+7,str(sub),22.4)
def dots(xs,y):
 global b
 for x in xs:b+=f'<circle cx="{x}" cy="{y}" r="1.7" fill="{C}"/>'
for y,t in [(64,'a.'),(142,'b.'),(296,'c.'),(436,'d.')]:label(41,y,t,32,'dam')
# a: bốn CH2, ba liên kết giữa và hai đầu tự do có ba chấm mỗi phía.
for x in [118,193,268,343]:chem(x,64,'CH',2)
line('M100 54H116 M177 54H191 M252 54H266 M327 54H341 M402 54H415')
dots([79,87,95],54);dots([421,429,437],54);label(449,64,'có tên là polymethylene.',27)
# b: vòng ngoặc tròn, n dưới; C cuối nối CH3 xuống, giữ hai chân nối đôi.
for x,t,sub in [(109,'CH',2),(184,'CH',None),(248,'C',None),(288,'CH',2)]:chem(x,142,t,sub)
chem(247,190,'CH',3)
line('M78 131H107 M166 131H182 M230 128H246 M230 134H246 M272 131H286 M346 131H375 M258 148V163')
line('M103 114Q83 148 103 181 M345 114Q365 148 345 181');label(355,169,'n',22.4);label(390,142,'có tên là polyisoprene.',27)
# c: CH2-C-CH2 là đúng literal của ảnh, không bỏ CH2 cuối để sửa lý thuyết.
chem(128,296,'CH',2);chem(204,296,'C');chem(244,296,'CH',2)
chem(203,249,'COOCH',3);chem(204,345,'CH',3)
line('M81 286H126 M187 286H202 M228 286H242 M301 286H343 M214 255V269 M214 303V320')
line('M123 258Q103 292 123 325 M324 258Q344 292 324 325');label(335,311,'n',22.4);label(363,296,'có tên là poly(methyl methacrylate).',26)
# d: các chữ kề nhau không có liên kết ngang in giữa, giữ nguyên như nguồn.
x=120;anchors=[]
for t,sub in [('CH',2),('CH',None),('CH',None),('CH',2),('CH',2),('CH',None),('CH',2),('CH',None)]:
 anchors.append(x);chem(x,442,t,sub);x+=F.advance(t,32)+(F.advance(str(sub),22.4)if sub else 0)
for j,up in [(1,False),(2,True),(5,False),(7,True)]:
 xc=anchors[j]+F.advance('C',32)/2
 if up:line(f'M{xc} 417V399');chem(anchors[j],394,'CH',3)
 else:line(f'M{xc} 447V462');chem(anchors[j],488,'CH',3)
line(f'M102 431H118 M{x+2} 431H{x+19}')
dots([80,88,96],431);dots([x+26,x+34,x+42],431);label(x+62,436,'có tên là polypropylene.',27)
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="953" height="526" viewBox="0 0 953 526"><title>Bốn nhận định polymer theo nguồn874</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='bon-nhan-dinh-polymer-native874-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=874,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='4literalrowsabcd/4polymernames-polymethylene-polyisoprene-poly(methyl methacrylate)-polypropylene/ROUND2pairs2nSUB/rowc3backboneC-COOCH3UP-CH3DOWN/rowd8backbonegroups4CH3branches-noaddedinternalbonds/2ends3dotsEACHrowa-d/trueDAMabcd-regularothers/noaddedanswer-theoryfix')
(K/'cau-truc-bon-nhan-dinh-polymer-native874-ddh-lo-332-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(hh,len(raw),x)
