"""Dựng ô orbital từ mẫu nguồn đã mở đối chiếu; giữ cả cách biểu diễn sai trong phương án."""
from pathlib import Path
import json,hashlib,html
G=Path(__file__).resolve().parents[1];M=G/'docs/hinh-vector-0311/kiem';S=G/'docs/hinh-vector-0311/nguon';A=sorted(json.loads((S/'kiem-ke.json').read_text())['assets'],key=lambda a:a['hash'])
# Hash được đóng băng sau kiểm nguồn, không phụ thuộc số thứ tự khi kho có hình mới.
SRC_FILE=M/'orbital-nguon-da-chon.json'
SRC=json.loads(SRC_FILE.read_text())
ink='#252440';edge='#77758e';teal='#087f8e';records=[]
def line(x,y,xx,yy,w=3):return f'<path d="M{x} {y}L{xx} {yy}" fill="none" stroke="{ink}" stroke-width="{w}" stroke-linecap="round"/>'
def txt(x,y,t,size=20,anchor='start',color=ink):return f'<text x="{x}" y="{y}" font-family="DejaVu Sans,Arial,sans-serif" font-size="{size}" fill="{color}" text-anchor="{anchor}">{html.escape(t)}</text>'
def arrow(x,y,d,h=64):
 if d=='u':return line(x,y+h,x,y+10)+f'<path d="M{x-7} {y+18}L{x} {y+4}L{x+7} {y+18}Z" fill="{ink}"/>'
 return line(x,y+4,x,y+h-6)+f'<path d="M{x-7} {y+h-14}L{x} {y+h}L{x+7} {y+h-14}Z" fill="{ink}"/>'
def boxes(x,y,patterns,cell=80,height=86):
 w=cell*len(patterns);b=f'<rect x="{x}" y="{y}" width="{w}" height="{height}" rx="3" fill="none" stroke="{edge}" stroke-width="2.5"/>'
 for i,p in enumerate(patterns):
  if i:b+=f'<path d="M{x+i*cell} {y}V{y+height}" fill="none" stroke="{edge}" stroke-width="2.5"/>'
  for j,d in enumerate(p):b+=arrow(x+i*cell+cell*(.38+.24*j) if len(p)==2 else x+i*cell+cell*.5,y+9,d,height-18)
 return b
PAT={35:['ud'],98:['d'],103:['uu'],218:['ud','ud','ud'],291:['uu'],333:['u'],508:['u','u','u'],537:['ud','ud','ud','u','u'],626:['uu','u','u'],679:['d'],779:['u']*4,861:['u'],929:['uu','u','u'],1059:['u']*3,1097:['ud','u',''],1234:['uu'],1264:['ud']*3,1281:['ud'],1314:['ud']}
def save(idx,b,w,h,description,pattern):
 src=SRC[str(idx)];svg=f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}" role="img"><title>{html.escape(description)}</title>{b}</svg>'
 digest=hashlib.sha256(svg.encode()).hexdigest();file='orbital-'+digest+'.svg';(M/file).write_text(svg)
 records.append({'chiSoLucQuet':idx,'hash':src['hash'],'svg':file,'ten':description,'mauMuiTen':pattern,'trangThai':'cho-soat-doc-lap','ghiChu':'Không sửa các mũi tên cùng chiều/số ô sai khi đó là dữ kiện hoặc phương án của câu.'})
for idx,p in PAT.items():save(idx,boxes(24,24,p),len(p)*80+48,134,'Biểu diễn electron trong ô orbital',p)
for idx in [718,793]:
 b=boxes(24,24,['ud'])+boxes(144,24,['ud'])+boxes(264,24,['ud','u','u'])
 b+=txt(64,145,'1s',22,'middle')+txt(184,145,'2s',22,'middle')+txt(384,145,'2p',22,'middle')
 save(idx,b,528,166,'Phân bố electron ở các phân lớp 1s, 2s, 2p',[['ud'],['ud'],['ud','u','u']])
for idx in [518,956]:
 b=txt(24,33,'Cột A',22,color=teal)+txt(370,33,'Cột B',22,color=teal)
 for n,(lab,pat) in enumerate([('a)',['','','']),('b)',['u','u','u']),('c)',['ud','ud','ud'])]):
  y=52+n*104;b+=txt(24,y+53,lab,22)+boxes(66,y,pat,cell=76)
 b+=txt(370,87,'1. Phân lớp bão hòa',22)+txt(370,191,'2. Phân lớp bán (nửa) bão hòa',22)+txt(370,295,'3. Phân lớp chứa các AO trống',22)
 save(idx,b,750,365,'Hai cột mô tả phân bố electron trong phân lớp p',{'a':['','',''],'b':['u','u','u'],'c':['ud','ud','ud']})
(M/'orbital-ve-thu-cong.json').write_text(json.dumps(records,ensure_ascii=False,indent=2))
(M/'orbital-ve-thu-cong-map.json').write_text(json.dumps({a['hash']:a['svg']for a in records},indent=2))
print('Đã dựng',len(records),'hình nguồn →',len(set(a['svg']for a in records)),'SVG riêng; chờ soát.')
