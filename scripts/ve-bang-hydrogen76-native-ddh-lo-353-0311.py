"""Bảng nguồn76: giữ nguyên bốn kiểu, không suy đáp án hoặc sửa liên kết."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
p=json.loads((K/'doc-hydrogen76-lo-353.json').read_text());h=p['hash'];g=p['geometry'];b=''
for x0,y0,x1,y1 in g['tableLines']:
 b+=f'<path d="M{x0} {y0}L{x1} {y1}" stroke="#000000" stroke-width="1.4" fill="none"/>'
blue='#0000ff'
def formula(x,y,text):
 if text=='H':return F.label(x,y,text,32,fill=blue,weight='dam')
 parts=[('C',32,0),('2',22,4),('H',32,0),('5',22,4)];cursor=x-sum(F.advance(t,z,'dam')for t,z,_ in parts)/2;out=''
 for t,z,dy in parts:
  out+=F.label(cursor,y+dy,t,z,anchor='start',fill=blue,weight='dam');cursor+=F.advance(t,z,'dam')
 return out
for a in g['panels']:
 b+=F.label(a['headerCenter'],39,a['headerText'],32,fill='#000000',weight='dam')
 for atom in a['topAtoms']:
  b+=F.label(atom['x'],atom['baseline'],atom['text'],32,fill=blue,weight='dam')
 for atom in a['lowerLabels']:b+=formula(atom['x'],atom['baseline'],atom['text'])
 for x0,y0,x1,y1 in a['bonds']:
  b+=f'<path d="M{x0} {y0}L{x1} {y1}" stroke="{blue}" stroke-width="1.4" fill="none"/>'
 for x,y in a['dots']:b+=f'<ellipse cx="{x}" cy="{y}" rx="2.5" ry="2.7" fill="#ff0000"/>'
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="153" viewBox="0 0 1400 153"><title>Bốn kiểu liên kết hydrogen theo nguồn76</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='bang-hydrogen76-native-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh'] if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
r=dict(i=76,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='4tablepanelsKiểu1-4TRUEdamUPRIGHT/ALLbluechemicalTRUEdamUPRIGHT/4C2H5with2-5SUB4pendantH/8O8topH/8horizontal8diagonalbonds/12REDdots3EACH/0charges0arrows/noaddedanswer-ranking-theoryfix')
(K/'cau-truc-bang-hydrogen76-native-ddh-lo-353-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
