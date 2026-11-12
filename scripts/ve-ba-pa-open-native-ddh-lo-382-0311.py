"""Ba phương án riêng theo ba ảnh gốc; không sửa theo tên chất trong câu dẫn."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());rows=[]
for i in [85,728,550]:
 p=json.loads((K/f'doc-open{i}-lo-382.json').read_text());g=p['builderGeometry'];h=p['hash'];b='';z=g['z']
 def line(v,w=1.2):
  global b
  b+='<path d="M'+'L'.join(f'{x} {y}'for x,y in v)+f'" fill="none" stroke="#202020" stroke-width="{w}" stroke-linecap="butt"/>'
 def label(x,y,t,size=None,anchor='middle'):
  global b
  b+=F.label(x,y,t,size or z,anchor=anchor,fill='#202020')
 def oh(x,y):label(x-F.advance('O',z)/2,y,'OH',anchor='start')
 def ch2oh(x,y):
  x-=F.advance('C',z)/2
  for t,sz,dy in [('CH',z,0),('2',z*.7,4),('OH',z,0)]:
   label(x,y+dy,t,sz,'start');x+=F.advance(t,sz)
 for v in g['thin']:line(v)
 for v in g['fronts']:line(v,6)
 for tip,foot in g['tapers']:
  x,y=foot;b+=f'<path d="M{tip[0]} {tip[1]}L{x} {y-3}V{y+3}Z" fill="#202020"/>'
 for x,y in g['Os']:label(x,y,'O')
 for x,y in g['CH2OH']:ch2oh(x,y)
 for x,y in g['OH']:oh(x,y)
 label(*g['OHright'],'OH',anchor='start');label(*g['CHO'],'CH=O',anchor='start')
 if g['tiny']:
  x,y,r=g['tiny'];b+=f'<circle cx="{x}" cy="{y}" r="{r}" fill="#202020"/>'
 w,ht=g['size'];raw=(f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{ht}" viewBox="0 0 {w} {ht}"><title>Phương án cấu trúc theo nguồn{i}</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn=f'open{i}-native-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
 qs=[]
 for q in iv['questions']:
  refs=[r for r in q['hinh']if r['hash']==h]
  if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
 note='12C11O/6freeOH+2CH2OH=8hydroxylO/LEFT1Haworth5bareC1ringO-RIGHTopen4bareC+literalCH=O-FIRSTC/1bridgeO/4TAPER2boldfront6pxVERTICALfeet/ALLregularUPRIGHT-SUB2-FIRSTC-FIRSTO/0captionarrownums/NOtheorynormalize-PAanswer-addedH-rightRing-alias/'
 note+= {85:'LEFTbackOHdown-frontLEFTup-frontRIGHTdown/RIGHTfrontLEFTdown-frontRIGHTup/1tinyBOTTOMRIGHTdotUNKNOWNretain',728:'LEFTbackOHdown-frontLEFTup-frontRIGHTdown/RIGHTfrontLEFTup-frontRIGHTdown/1tinyBOTTOMRIGHTfragmentCROPrightedgeUNKNOWNretain/NOTepsilon728',550:'LEFTbackOHup-bothfrontOHdown/RIGHTfrontLEFTup-frontRIGHTdown/0tinyfragment'}[i]
 rows.append(dict(i=i,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung=note));print(i,hh,len(raw))
(K/'cau-truc-ba-pa-open-native-ddh-lo-382-ban-dung.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n')
