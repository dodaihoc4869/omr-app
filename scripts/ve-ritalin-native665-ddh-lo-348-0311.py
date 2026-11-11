"""Hai cấu trúc Ritalin: giữ literal ClH₂N và ngữ cảnh nguồn riêng."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
p=json.loads((K/'doc-ritalin665-lo-348.json').read_text());g=p['geometry'];h=p['hash']
def line(pts):return '<path d="M'+'L'.join(f'{x} {y}' for x,y in pts)+'" fill="none" stroke="#252440" stroke-width="1.2" stroke-linejoin="round"/>'
b=''
for side in ['left','right']:
 a=g[side];v=a['phenylVertices'];b+=line(v+[v[0]])
 for ps in a['phenylInnerDouble']+a['centralBonds']+a['piperidineBonds']:b+=line(ps)
 label=a['labels'][0];x=label['CcenterX'];y=label['bbox'][3];b+=F.label(x-F.advance('C',18)/2,y,label['text'],18,'start')
 label=a['labels'][1];x=a['piperidineBareC'][0][0];y=label['bbox'][3]-3;b+=F.label(x+F.advance('N',18)/2,y,label['text'],18,'end')
 label=a['caption'];box=label['bbox'];b+=F.label((box[0]+box[2])/2,box[3]-2,label['text'],16)
a=g['arrow'];b+=line(a['shaft']);b+='<path d="M'+'L'.join(f'{x} {y}' for x,y in a['headTriangle'])+'Z" fill="#252440"/>'
box=a['condition']['bbox'];b+=F.label(box[0],box[3]-2,a['condition']['text'],17,'start')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="679" height="212" viewBox="0 0 679 212"><title>Hai cấu trúc theo nguồn665</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='ritalin-native665-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh'] if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
r=dict(i=665,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='27C4O2N2Cl/4sixrings6phenylinnerdouble/2literalClH2N-rightNanchors/COOHleft-COOCH3right-firstCanchors/ALLregularUPRIGHT/2exactcaptions-Ritalinic acid hydrochloride-methylphenidate hydrochloride/+CH3OH/HCl-1FILLEDrighthead/0charges0stereo/noaddedHClsplit-COdouble-water-yield75-answer')
(K/'cau-truc-ritalin-native665-ddh-lo-348-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
