"""Bốn phương án nguồn843: giữ nguyên Cl và mọi liên kết in trong đề."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='9b0fa741ea6bd94cca619900460c06f50fd2330edb5c401c28b0320275d62767';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh'] if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
segments=[(96,100,111,100),(137,100,152,100),(177,100,192,100),(218,100,236,100),(124,65,124,82),(124,115,124,132),(160,116,160,135),(168,116,168,135),(361,100,375,100),(401,100,415,100),(441,100,455,100),(482,100,496,100),(388,65,388,82),(388,115,388,132),(424,116,424,135),(432,116,432,135),(646,93,661,93),(687,93,701,93),(727,93,742,93),(768,93,784,93),(755,58,755,77),(755,108,755,128),(670,110,670,130),(678,110,678,130),(900,69,912,79),(900,115,912,106),(985,93,1000,93),(1026,93,1041,93),(972,108,972,128),(1013,58,1013,77),(1013,108,1013,128),(943,88,958,88),(943,96,958,96)]
b='<path d="'+' '.join(f'M{x} {y}L{u} {v}' for x,y,u,v in segments)+'" fill="none" stroke="#252440" stroke-width="1.8" stroke-linecap="round"/>'
atoms=[('H',84,100),('C',124,100),('C',164,100),('O',205,100),('H',249,100),('H',124,52),('H',124,149),('O',164,149),('H',348,100),('C',388,100),('C',428,100),('N',468,100),('H',388,52),('H',388,149),('O',428,149),('H',633,93),('C',674,93),('O',714,93),('C',755,93),('H',797,93),('H',755,44),('H',755,143),('O',674,143),('C',972,93),('C',1013,93),('H',1054,93),('H',884,64),('H',884,123),('H',972,143),('H',1013,44),('H',1013,143)]
for t,x,y in atoms:b+=F.label(x,y+(16 if t=='O' and y>120 else 11),t,32)
b+=F.label(909,104,'Cl',32,anchor='start')
b+=F.label(499,111,'CH',32,anchor='start')+F.label(499+F.advance('CH',32),119,'3',22.4,anchor='start')
for n,x,y in [(1,142.5,204),(2,431,204),(3,723.5,202),(4,1022.5,202)]:b+=F.label(x,y,f'({n})',34,weight='dam')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1140" height="240" viewBox="0 0 1140 240"><title>Bốn công thức theo nguồn843</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='bon-cong-thuc-native843-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=843,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='9C5O1N1Cl/17standaloneH+CH3H3/3COdouble1ClCdouble/regularatoms4trueDAMuprightcaptions/Clliteral2H-doubleC-Nliteral2bonds-noH-charge/noanswer-theoryfix')
(K/'cau-truc-bon-cong-thuc-native843-ddh-lo-326-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
