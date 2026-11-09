"""Nguồn1161: bảy thanh xếp chồng, giữ mốc hình và số phần trăm nguyên văn."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='d2afad956e05038c1e248aba1a3f626cb2750b769edaca5941edeb7d201ee398';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh'] if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
b='<rect x="50" y="53" width="1098" height="353" fill="#fbf9ee"/><path d="M223 55V365" stroke="#252440" stroke-width="3" fill="none" stroke-linecap="round"/>'
colors=['#fded4d','#cfeb1a','#fbb9c8'];names=['Dầu hướng dương','Dầu oliu','Dầu đậu nành','Dầu lạc','Mỡ lợn','Mỡ bò','Chất béo từ bơ']
stops=[(319,497),(345,1055),(354,568),(381,813),(587,1018),(687,1097),(813,1097)];vals=[(11,20,69),(14,77,9),(15,24,61),(18,48,34),(41,47,12),(52,44,4),(66,30,4)]
for j,(ab,v) in enumerate(zip(stops,vals)):
 y=[62,107,152,196,239,283,327][j];xs=[225,*ab,1133]
 for z in range(3):
  b+=f'<rect x="{xs[z]}" y="{y}" width="{xs[z+1]-xs[z]}" height="33" fill="{colors[z]}"/>'
  b+=F.label(xs[z]+5,y+23,str(v[z])+'%',20,anchor='start',weight='dam')
 if j<6:b+=F.label(216,y+25,names[j],20,anchor='end')
 else:
  b+=F.label(216,y+20,names[j],20,anchor='end');b+=F.label(216,y+47,'động vật',20,anchor='end')
for x,t,c in [(223,'gốc no',colors[0]),(356,'gốc không no chứa 1 liên kết đôi',colors[1]),(742,'gốc không no chứa nhiều liên kết đôi',colors[2])]:
 b+=f'<rect x="{x}" y="379" width="23" height="22" fill="{c}"/>';b+=F.label(x+33,397,t,22,anchor='start')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1206" height="462" viewBox="0 0 1206 462"><title>Hàm lượng các gốc acid béo theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='ti-le-acid-beo-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=1161,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='7stackedbars/3colors/21percentlabels11-20-69;14-77-9;15-24-61;18-48-34;41-47-12;52-44-4;66-30-4/7nameslast2lines/3legendlabels/1verticalbaseline/noaddedticks-title-answer/noheightorwidthnormalization.')
(K/'cau-truc-ti-le-acid-beo-ddh-lo-291-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(fn)
