"""Hai mô hình electron: giữ riêng từng electron, quỹ đạo và nhãn hạt nhân."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
p=json.loads((K/'doc-model-electron-lo-347.json').read_text());iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());out=[]
for a in p['sources']:
 b='';i=a['i'];h=a['hash']
 for side in ['left','right']:
  r=a[side]
  for c in r['orbits']:
   x,y=c['center'];b+=f'<ellipse cx="{x}" cy="{y}" rx="{c["rx"]}" ry="{c["ry"]}" fill="none" stroke="#061e2c" stroke-width="1.8"/>'
  for c in r['nuclei']:
   x,y=c['center'];rad=c['radius'];b+=f'<circle cx="{x}" cy="{y}" r="{rad}" fill="#ff0000" stroke="#111" stroke-width="1.6"/>'+F.label(x,y+7.5,c['text'],22,weight='dam',fill='#000')
  dots=r.get('electronCenters')
  if dots is None:dots=([v for group in r['electronsByAtom'] for v in group] if side=='left' else r['innerElectrons']+r['externalOuterElectrons']+r['sharedLensElectrons'])
  rx,ry=(3.5,5) if i==1029 else (3,4)
  for x,y in dots:b+=f'<ellipse cx="{x}" cy="{y}" rx="{rx}" ry="{ry}" fill="#acc2d3" stroke="#173044" stroke-width="2"/>'
 x,y=a['left']['plus']['center'];b+=F.label(x,y+7,'+',22,fill='#000')
 ar=a['arrow'];(x,y),(u,v)=ar['shaft'];b+=f'<path d="M{x} {y}L{u} {v}" fill="none" stroke="#000" stroke-width="{2.5 if i==1029 else 1.2}"/>'
 b+='<path d="M'+'L'.join(f'{x} {y}' for x,y in ar['headTriangle'])+'Z" fill="#000"/>'
 w,he=a['size'];raw=(f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{he}" viewBox="0 0 {w} {he}"><title>Mô hình electron theo nguồn{i}</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn=f'model-electron-native{i}-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
 qs=[]
 for q in iv['questions']:
  refs=[r for r in q['hinh'] if r['hash']==h]
  if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
 note=('HF10source10product/2sharedlensdots/+1+9EACHside/6orbits' if i==1029 else 'N2source7+7-product14/6sharedlensdots-4inner4external/+7FOUR/8orbits-rightouterCROPPEDnative')
 out.append(dict(i=i,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung=note+'/4rednuclei/grayblueoutlinedelectrons/1FILLEDrighthead1plus/blacktrueDAMnucleusregularplus/ALLuprightPLUSbaseline/noaddedletters-names-charge-caption-answer'))
 print(i,hh,len(raw))
(K/'cau-truc-model-electron-native-ddh-lo-347-ban-dung.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n')
