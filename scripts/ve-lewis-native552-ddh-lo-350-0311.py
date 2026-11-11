"""Bốn công thức electron nguồn552: giữ từng chấm, không chữa phương án."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
p=json.loads((K/'doc-lewis552-lo-350.json').read_text());h=p['hash'];b=''
for a in p['geometry']['panels']:
 c=a['caption'];x0,y0,x1,y1=c['bbox'];b+=F.label((x0+x1)/2,y1-1,c['text'],32,fill='#000000',weight='dam')
 for c in a['atoms']:
  x0,y0,x1,y1=c['bbox'];b+=F.label((x0+x1)/2,y1-1,c['text'],32,fill='#000000')
 for x,y in a['redDotCenters']:b+=f'<circle cx="{x}" cy="{y}" r="3.7" fill="#ff0000"/>'
 x,y=a['trailingPrintPeriod']['center'];b+=F.label(x,y+2,'.',32,fill='#000000')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1282" height="104" viewBox="0 0 1282 104"><title>Bốn công thức electron theo nguồn552</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='lewis-native552-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh'] if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
r=dict(i=552,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='4panelsA-DtrueDAMupright/ALLatomsregularUPRIGHT-NH3-BH3-OCO-ClCl/44redfilleddotsA8B6C16D14/BZEROtopdots/4separateblacktrailingperiods4captionperiods/0bondlines0charges/nooctetfix-answer-highlight-names')
(K/'cau-truc-lewis-native552-ddh-lo-350-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
